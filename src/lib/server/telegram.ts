import { db } from "@/db";
import { telegramSettings, orders, expenses } from "@/db/schema";
import { decrypt } from "@/lib/encrypt";
import { eq, desc, gte, and, lt } from "drizzle-orm";

// ─── Settings ─────────────────────────────────────────────────────────────────

async function getSettings() {
	const [s] = await db.select().from(telegramSettings).limit(1);
	return s ?? null;
}

let _token: string | null = null;

async function getToken(): Promise<string | null> {
	if (_token) return _token;
	const s = await getSettings();
	if (!s?.botTokenEncrypted) return null;
	_token = decrypt(s.botTokenEncrypted);
	return _token;
}

export function resetBotCache(): void {
	_token = null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function etb(n: number) {
	return `${new Intl.NumberFormat("en-US").format(Math.round(n))} ETB`;
}

function orderTypeBadge(type: string) {
	const map: Record<string, string> = {
		dine_in: "🪑 Dine-in",
		takeaway: "🥡 Takeaway",
		delivery: "🚚 Delivery",
		online: "📱 Online",
	};
	return map[type] ?? type;
}

function statusBadge(status: string) {
	const map: Record<string, string> = {
		awaiting: "⏳ Awaiting",
		pending: "🆕 Pending",
		in_kitchen: "👨‍🍳 In Kitchen",
		ready: "✅ Ready",
		completed: "🏁 Completed",
	};
	return map[status] ?? status;
}

async function getRoleForChat(chatId: string): Promise<"owner" | "chef" | "waiter" | null> {
	const s = await getSettings();
	if (!s?.contacts) return null;
	const contact = (s.contacts as Array<{ chatId: string; role: string }>).find(
		(c) => c.chatId === chatId,
	);
	return (contact?.role as "owner" | "chef" | "waiter") ?? null;
}

function todayRange() {
	const start = new Date();
	start.setHours(0, 0, 0, 0);
	const end = new Date(start);
	end.setDate(end.getDate() + 1);
	return { start, end };
}

// ─── Telegram API ─────────────────────────────────────────────────────────────

async function tgSend(token: string, chatId: number | string, text: string, parseMode?: string) {
	const body: Record<string, unknown> = { chat_id: chatId, text };
	if (parseMode) body.parse_mode = parseMode;
	const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	const json = (await res.json()) as { ok: boolean; description?: string };
	if (!json.ok) throw new Error(`Telegram sendMessage failed: ${json.description}`);
}

// ─── Command handlers ─────────────────────────────────────────────────────────

async function cmdOrders(token: string, chatId: number) {
	const role = await getRoleForChat(chatId.toString());
	if (role !== "owner") {
		await tgSend(token, chatId, "⛔ This command is for owners only.");
		return;
	}

	const { start, end } = todayRange();
	const rows = await db.query.orders.findMany({
		where: (o, { and, gte, lt, ne }) =>
			and(gte(o.createdAt, start), lt(o.createdAt, end), ne(o.status, "completed")),
		with: { items: true },
		orderBy: [desc(orders.createdAt)],
	});

	if (rows.length === 0) {
		await tgSend(token, chatId, "📋 No active orders today.");
		return;
	}

	const lines = rows.map((o) => {
		const total = o.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
		return `#${o.id.slice(-4)} ${orderTypeBadge(o.type)} — ${statusBadge(o.status)}\n${o.items.map((i) => `  ${i.quantity}× ${i.name}`).join("\n")}\n  💰 ${etb(total)}`;
	});

	await tgSend(token, chatId, `📋 *Active orders today (${rows.length})*\n\n${lines.join("\n\n")}`, "Markdown");
}

async function cmdSummary(token: string, chatId: number) {
	const role = await getRoleForChat(chatId.toString());
	if (role !== "owner") {
		await tgSend(token, chatId, "⛔ This command is for owners only.");
		return;
	}

	const { start, end } = todayRange();
	const [todayOrders, expenseRows] = await Promise.all([
		db.query.orders.findMany({
			where: (o, { and, gte, lt }) => and(gte(o.createdAt, start), lt(o.createdAt, end)),
			with: { items: true },
		}),
		db.select().from(expenses).where(and(gte(expenses.date, start), lt(expenses.date, end))),
	]);

	const completed = todayOrders.filter((o) => o.status === "completed");
	const revenue = completed.reduce(
		(s, o) => s + o.items.reduce((si, i) => si + i.quantity * i.unitPrice, 0),
		0,
	);
	const totalExpenses = expenseRows.reduce((s, e) => s + e.amount, 0);

	const byStatus = todayOrders.reduce<Record<string, number>>((acc, o) => {
		acc[o.status] = (acc[o.status] ?? 0) + 1;
		return acc;
	}, {});

	const statusLines = Object.entries(byStatus)
		.map(([s, n]) => `  ${statusBadge(s)}: ${n}`)
		.join("\n");

	await tgSend(token, chatId,
		`📊 *Today's Summary*\n\n` +
		`🧾 Total orders: ${todayOrders.length}\n` +
		`✅ Completed: ${completed.length}\n` +
		`💰 Revenue: ${etb(revenue)}\n` +
		`💸 Expenses: ${etb(totalExpenses)}\n` +
		`📈 Net profit: ${etb(revenue - totalExpenses)}\n\n` +
		`*By status:*\n${statusLines}`,
		"Markdown",
	);
}

async function cmdWeekly(token: string, chatId: number) {
	const role = await getRoleForChat(chatId.toString());
	if (role !== "owner") {
		await tgSend(token, chatId, "⛔ This command is for owners only.");
		return;
	}

	const end = new Date();
	end.setHours(23, 59, 59, 999);
	const start = new Date(end);
	start.setDate(start.getDate() - 6);
	start.setHours(0, 0, 0, 0);

	const rows = await db.query.orders.findMany({
		where: (o, { and, gte, lte, eq }) =>
			and(gte(o.createdAt, start), lte(o.createdAt, end), eq(o.status, "completed")),
		with: { items: true },
	});

	const byDay: Record<string, { revenue: number; count: number }> = {};
	for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
		const key = d.toISOString().slice(0, 10);
		byDay[key] = { revenue: 0, count: 0 };
	}
	for (const o of rows) {
		const key = o.createdAt.toISOString().slice(0, 10);
		if (byDay[key]) {
			byDay[key].count += 1;
			byDay[key].revenue += o.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
		}
	}

	const totalRevenue = rows.reduce(
		(s, o) => s + o.items.reduce((si, i) => si + i.quantity * i.unitPrice, 0),
		0,
	);

	const lines = Object.entries(byDay).map(([date, d]) => {
		const label = new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
		return `  ${label}: ${etb(d.revenue)} (${d.count} orders)`;
	});

	await tgSend(token, chatId,
		`📅 *Weekly Revenue (last 7 days)*\n\n${lines.join("\n")}\n\n💰 Total: ${etb(totalRevenue)}`,
		"Markdown",
	);
}

async function cmdPending(token: string, chatId: number) {
	const role = await getRoleForChat(chatId.toString());
	if (role !== "owner") {
		await tgSend(token, chatId, "⛔ This command is for owners only.");
		return;
	}

	const rows = await db.query.orders.findMany({
		where: (o, { inArray }) => inArray(o.status, ["awaiting", "pending"]),
		with: { items: true },
		orderBy: [desc(orders.createdAt)],
	});

	if (rows.length === 0) {
		await tgSend(token, chatId, "✅ No pending orders.");
		return;
	}

	const lines = rows.map((o) => {
		const extra =
			o.type === "online" ? `\n  📞 ${o.customerPhone ?? "—"}` :
			o.type === "dine_in" ? `\n  🪑 Table ${o.tableNumber ?? "—"}` : "";
		return `#${o.id.slice(-4)} ${orderTypeBadge(o.type)} — ${statusBadge(o.status)}${extra}\n  ${o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}`;
	});

	await tgSend(token, chatId, `⏳ *Pending orders (${rows.length})*\n\n${lines.join("\n\n")}`, "Markdown");
}

async function cmdKitchen(token: string, chatId: number) {
	const role = await getRoleForChat(chatId.toString());
	if (role !== "owner" && role !== "chef") {
		await tgSend(token, chatId, "⛔ This command is for chefs and owners.");
		return;
	}

	const rows = await db.query.orders.findMany({
		where: (o, { eq }) => eq(o.status, "in_kitchen"),
		with: { items: true },
		orderBy: [orders.createdAt],
	});

	if (rows.length === 0) {
		await tgSend(token, chatId, "🍽️ No orders in the kitchen right now.");
		return;
	}

	const now = Date.now();
	const lines = rows.map((o) => {
		const elapsed = Math.floor((now - o.createdAt.getTime()) / 60000);
		return `#${o.id.slice(-4)} ${orderTypeBadge(o.type)} — ${elapsed}min ago\n${o.items.map((i) => `  ${i.quantity}× ${i.name}`).join("\n")}${o.notes ? `\n  📝 ${o.notes}` : ""}`;
	});

	await tgSend(token, chatId,
		`👨‍🍳 *In kitchen (${rows.length})*\n\nUse /ready [id] to mark done.\n\n${lines.join("\n\n")}`,
		"Markdown",
	);
}

async function cmdReady(token: string, chatId: number, text: string) {
	const role = await getRoleForChat(chatId.toString());
	if (role !== "owner" && role !== "chef") {
		await tgSend(token, chatId, "⛔ This command is for chefs and owners.");
		return;
	}

	const parts = text.trim().split(/\s+/);
	const shortId = parts[1];

	if (!shortId) {
		await tgSend(token, chatId, "Usage: /ready [order_id]\nExample: /ready a1b2");
		return;
	}

	const allKitchenOrders = await db.query.orders.findMany({
		where: (o, { eq }) => eq(o.status, "in_kitchen"),
	});
	const match = allKitchenOrders.find(
		(o) => o.id === shortId || o.id.slice(-4) === shortId,
	);

	if (!match) {
		await tgSend(token, chatId, `❌ No in-kitchen order found with ID "${shortId}".`);
		return;
	}

	await db
		.update(orders)
		.set({ status: "ready", updatedAt: new Date() })
		.where(eq(orders.id, match.id));

	await tgSend(token, chatId, `✅ Order #${match.id.slice(-4)} marked as ready.`);
	await sendToWaiters(`✅ Order #${match.id.slice(-4)} is ready for pickup/delivery`);
}

// ─── Webhook entry point ──────────────────────────────────────────────────────

export async function handleWebhookUpdate(update: unknown): Promise<void> {
	try {
		const token = await getToken();
		if (!token) return;

		// biome-ignore lint/suspicious/noExplicitAny: dynamic telegram update
		const upd = update as any;
		const msg = upd?.message;
		if (!msg) return;

		const chatId: number = msg.chat?.id;
		const text: string = msg.text ?? "";
		const cmd = text.split("@")[0].split(" ")[0];

		switch (cmd) {
			case "/start":
				await tgSend(token, chatId,
					"👋 *PlateForm Bot*\n\nAvailable commands:\n" +
					"/orders — Today's active orders\n" +
					"/summary — Today's summary\n" +
					"/weekly — Weekly revenue\n" +
					"/pending — Awaiting action\n" +
					"/kitchen — In-kitchen orders (chef)\n" +
					"/ready [id] — Mark order ready (chef)\n" +
					"/myid — Get your Telegram chat ID",
					"Markdown",
				);
				break;
			case "/myid":
				await tgSend(token, chatId, `Your chat ID is:\n\`${chatId}\`\n\nPaste this into PlateForm → Settings → Telegram → Contacts.`, "Markdown");
				break;
			case "/orders":
				await cmdOrders(token, chatId);
				break;
			case "/summary":
				await cmdSummary(token, chatId);
				break;
			case "/weekly":
				await cmdWeekly(token, chatId);
				break;
			case "/pending":
				await cmdPending(token, chatId);
				break;
			case "/kitchen":
				await cmdKitchen(token, chatId);
				break;
			case "/ready":
				await cmdReady(token, chatId, text);
				break;
		}
	} catch (err) {
		console.error("[telegram] handleWebhookUpdate error:", err);
	}
}

// ─── Targeted notifications ───────────────────────────────────────────────────

async function getChatIdsByRole(role: "owner" | "chef" | "waiter"): Promise<string[]> {
	const s = await getSettings();
	if (!s) return [];
	const key = role === "owner" ? "ownerChatIds" : role === "chef" ? "chefChatIds" : "waiterChatIds";
	return (s[key] as string[] | null) ?? [];
}

async function send(chatIds: string[], message: string): Promise<void> {
	if (chatIds.length === 0) return;
	const token = await getToken();
	if (!token) return;
	await Promise.allSettled(chatIds.map((id) => tgSend(token, id, message)));
}

/** Sends to owners + chefs (used for new staff-created orders) */
export async function sendTelegramNotification(message: string): Promise<void> {
	try {
		const [ownerIds, chefIds] = await Promise.all([
			getChatIdsByRole("owner"),
			getChatIdsByRole("chef"),
		]);
		await send([...new Set([...ownerIds, ...chefIds])], message);
	} catch {
		// best-effort — never block order flow
	}
}

/** Sends to owners only */
export async function sendToOwner(message: string): Promise<void> {
	try {
		await send(await getChatIdsByRole("owner"), message);
	} catch {}
}

/** Sends to chefs only */
export async function sendToChefs(message: string): Promise<void> {
	try {
		await send(await getChatIdsByRole("chef"), message);
	} catch {}
}

/** Sends to waiters only */
export async function sendToWaiters(message: string): Promise<void> {
	try {
		await send(await getChatIdsByRole("waiter"), message);
	} catch {}
}

// ─── Photo helpers ────────────────────────────────────────────────────────────

async function tgSendPhoto(token: string, chatId: number | string, fileId: string, caption?: string) {
	const body: Record<string, unknown> = { chat_id: chatId, photo: fileId };
	if (caption) { body.caption = caption; body.parse_mode = "Markdown"; }
	const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	const json = (await res.json()) as { ok: boolean; description?: string };
	if (!json.ok) throw new Error(`Telegram sendPhoto failed: ${json.description}`);
}

/** Upload a base64-encoded image to the owner's Telegram chat, return the file_id */
export async function uploadProofToTelegram(base64: string, mimeType: string): Promise<string | null> {
	const token = await getToken();
	if (!token) return null;
	const ownerIds = await getChatIdsByRole("owner");
	if (ownerIds.length === 0) return null;

	const binary = Buffer.from(base64, "base64");
	const form = new FormData();
	form.append("chat_id", ownerIds[0]);
	form.append("photo", new Blob([binary], { type: mimeType }), "proof.jpg");
	form.append("disable_notification", "true");

	const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
		method: "POST",
		body: form,
	});
	const json = (await res.json()) as {
		ok: boolean;
		result?: { photo: Array<{ file_id: string; width: number }> };
	};
	if (!json.ok || !json.result) return null;

	const photos = json.result.photo.slice().sort((a, b) => b.width - a.width);
	return photos[0]?.file_id ?? null;
}

/** Send payment-confirmed notification with optional photo + QR data */
export async function sendPaymentConfirmedNotification(params: {
	orderId: string;
	method: string;
	amountReceived?: number;
	qrData?: string;
	proofFileId?: string;
}): Promise<void> {
	try {
		const token = await getToken();
		if (!token) return;

		const [ownerIds, waiterIds] = await Promise.all([
			getChatIdsByRole("owner"),
			getChatIdsByRole("waiter"),
		]);
		const chatIds = [...new Set([...ownerIds, ...waiterIds])];
		if (chatIds.length === 0) return;

		const order = await db.query.orders.findFirst({
			where: (o, { eq }) => eq(o.id, params.orderId),
			with: { items: true },
		});
		if (!order) return;

		const total = order.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
		const methodLabel: Record<string, string> = {
			cash: "Cash", telebirr: "Telebirr", cbe: "CBE Birr", boa: "BOA",
		};
		const location = order.tableNumber
			? `Table ${order.tableNumber}`
			: order.customerPhone ?? "Takeaway";

		const lines = [
			`💰 *Payment Confirmed*`,
			`${location} — ${methodLabel[params.method] ?? params.method}`,
			`Amount: ${etb(total)}`,
		];
		if (params.amountReceived && params.amountReceived !== total) {
			lines.push(`Received: ${etb(params.amountReceived)}`);
		}
		if (params.qrData) {
			lines.push(`\n🔲 QR: \`${params.qrData}\``);
		}

		const text = lines.join("\n");
		await Promise.allSettled(
			chatIds.map((id) =>
				params.proofFileId
					? tgSendPhoto(token, id, params.proofFileId, text)
					: tgSend(token, id, text, "Markdown"),
			),
		);
	} catch {
		// best-effort
	}
}
