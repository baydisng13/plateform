import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { orders, orderItems, payments, expenses } from "@/db/schema";
import { eq, desc, and, gte, lt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { sendTelegramNotification, sendToOwner, sendToWaiters } from "./telegram";
import { requireAuth, requireOwner, requireRole } from "./auth-utils";

const orderLineSchema = z.object({
	menuItemId: z.string().optional(),
	name: z.string(),
	quantity: z.number().int().positive(),
	unitPrice: z.number().positive(),
});

export const getActiveOrders = createServerFn({ method: "GET" }).handler(async () => {
	await requireAuth();
	const rows = await db.query.orders.findMany({
		where: (o, { ne }) => ne(o.status, "completed"),
		with: { items: true },
		orderBy: [desc(orders.createdAt)],
	});
	return rows;
});

export const getOrderById = createServerFn({ method: "GET" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await requireAuth();
		return db.query.orders.findFirst({
			where: eq(orders.id, data.id),
			with: { items: true },
		});
	});

// No auth — also used by public /order page (online customers)
export const createOrder = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			type: z.enum(["dine_in", "takeaway", "delivery", "online"]),
			customerPhone: z.string().optional(),
			customerName: z.string().optional(),
			tableNumber: z.number().optional(),
			address: z.string().optional(),
			notes: z.string().optional(),
			items: z.array(orderLineSchema),
		}),
	)
	.handler(async ({ data }) => {
		const { items, ...orderData } = data;
		const id = nanoid();
		const status = data.type === "online" ? "awaiting" : "pending";

		await db.insert(orders).values({ ...orderData, id, status });
		await db.insert(orderItems).values(
			items.map((i) => ({
				id: nanoid(),
				orderId: id,
				menuItemId: i.menuItemId,
				name: i.name,
				quantity: i.quantity,
				unitPrice: i.unitPrice,
				kitchenStatus: "waiting" as const,
			})),
		);

		const order = await db.query.orders.findFirst({
			where: eq(orders.id, id),
			with: { items: true },
		});

		const itemSummary = items.map((i) => `${i.quantity}× ${i.name}`).join(", ");
		if (status === "awaiting") {
			// Online order — owner only needs to call customer to confirm
			await sendToOwner(`📱 New online order #${id.slice(-4)} — needs confirmation\nPhone: ${data.customerPhone ?? "—"}\nItems: ${itemSummary}`);
		} else {
			// Staff-created order — notify owner + chef
			await sendTelegramNotification(`🆕 New order #${id.slice(-4)} (${data.type})\nItems: ${itemSummary}`);
		}

		return order;
	});

export const updateOrderStatus = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			id: z.string(),
			status: z.enum(["awaiting", "pending", "in_kitchen", "ready", "completed"]),
			deliveryNote: z.string().optional(),
		}),
	)
	.handler(async ({ data }) => {
		await requireAuth();
		const kitchenUpdate =
			data.status === "in_kitchen"
				? await db
						.update(orderItems)
						.set({ kitchenStatus: "waiting" })
						.where(eq(orderItems.orderId, data.id))
				: null;
		void kitchenUpdate;

		const [order] = await db
			.update(orders)
			.set({
				status: data.status,
				...(data.deliveryNote ? { deliveryNote: data.deliveryNote } : {}),
				updatedAt: new Date(),
			})
			.where(eq(orders.id, data.id))
			.returning();

		if (data.status === "ready") {
			// Notify waiters to pick up + owner for awareness
			const msg = `✅ Order #${data.id.slice(-4)} is ready for pickup/delivery`;
			await Promise.all([sendToWaiters(msg), sendToOwner(msg)]);
		}

		return order;
	});

export const deleteOrder = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await requireOwner();
		await db.delete(orders).where(eq(orders.id, data.id));
	});

export const appendOrderItems = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			orderId: z.string(),
			items: z.array(orderLineSchema),
		}),
	)
	.handler(async ({ data }) => {
		await requireRole("owner", "waiter");
		await db.insert(orderItems).values(
			data.items.map((i) => ({
				id: nanoid(),
				orderId: data.orderId,
				menuItemId: i.menuItemId,
				name: i.name,
				quantity: i.quantity,
				unitPrice: i.unitPrice,
				kitchenStatus: "waiting" as const,
			})),
		);
	});

export const updateItemKitchenStatus = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			itemId: z.string(),
			kitchenStatus: z.enum(["waiting", "cooking", "ready"]),
		}),
	)
	.handler(async ({ data }) => {
		await requireRole("owner", "chef");
		await db
			.update(orderItems)
			.set({ kitchenStatus: data.kitchenStatus })
			.where(eq(orderItems.id, data.itemId));
	});

export const confirmPayment = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			orderId: z.string(),
			method: z.enum(["cash", "telebirr", "cbe", "boa"]),
			amountReceived: z.number().optional(),
			tip: z.number().optional(),
			proofUrl: z.string().optional(),
			transactionRef: z.string().optional(),
		}),
	)
	.handler(async ({ data }) => {
		const user = await requireRole("owner", "waiter");
		const { orderId, ...paymentData } = data;
		await db.insert(payments).values({ id: nanoid(), orderId, confirmedBy: user.id, ...paymentData });
		await db
			.update(orders)
			.set({ status: "completed", updatedAt: new Date() })
			.where(eq(orders.id, orderId));

		await sendToOwner(`💰 Payment confirmed for order #${orderId.slice(-4)} — ${data.method.toUpperCase()}`);
	});

// Analytics
export const getDailyStats = createServerFn({ method: "GET" }).handler(async () => {
	await requireOwner();
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	const [todayOrders, expenseRows] = await Promise.all([
		db.query.orders.findMany({
			where: (o, { and, gte, lt }) => and(gte(o.createdAt, today), lt(o.createdAt, tomorrow)),
			with: { items: true },
		}),
		db.select().from(expenses).where(and(gte(expenses.date, today), lt(expenses.date, tomorrow))),
	]);

	const completedToday = todayOrders.filter((o) => o.status === "completed");
	const revenue = completedToday.reduce(
		(s, o) => s + o.items.reduce((si, i) => si + i.quantity * i.unitPrice, 0),
		0,
	);
	const expensesToday = expenseRows.reduce((s, e) => s + e.amount, 0);

	return {
		ordersToday: todayOrders.length,
		revenueToday: revenue,
		completedToday: completedToday.length,
		expensesToday,
		netToday: revenue - expensesToday,
	};
});
