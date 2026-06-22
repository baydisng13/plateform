import { db } from "@/db";
import { telegramSettings, orders, expenses } from "@/db/schema";
import { decrypt } from "@/lib/encrypt";
import { Bot, type Context } from "grammy";
import { eq, desc, gte, and, lt } from "drizzle-orm";

// ─── Bot singleton ────────────────────────────────────────────────────────────

let _bot: Bot | null = null;

async function getSettings() {
	const [s] = await db.select().from(telegramSettings).limit(1);
	return s ?? null;
}

async function getBot(): Promise<Bot | null> {
	try {
		const s = await getSettings();
		if (!s?.botTokenEncrypted) return null;
		if (!_bot) {
			const token = decrypt(s.botTokenEncrypted);
			_bot = new Bot(token);
			registerCommands(_bot);
		}
		return _bot;
	} catch {
		return null;
	}
}

export function resetBotCache(): void {
	_bot = null;
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

// ─── Command handlers ─────────────────────────────────────────────────────────

async function cmdOrders(ctx: Context) {
	const chatId = ctx.msg?.chat.id.toString() ?? "";
	const role = await getRoleForChat(chatId);
	if (role !== "owner") {
		await ctx.reply("⛔ This command is for owners only.");
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
		await ctx.reply("📋 No active orders today.");
		return;
	}

	const lines = rows.map((o) => {
		const total = o.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
		return `#${o.id.slice(-4)} ${orderTypeBadge(o.type)} — ${statusBadge(o.status)}\n${o.items.map((i) => `  ${i.quantity}× ${i.name}`).join("\n")}\n  💰 ${etb(total)}`;
	});

	await ctx.reply(`📋 *Active orders today (${rows.length})*\n\n${lines.join("\n\n")}`, {
		parse_mode: "Markdown",
	});
}

async function cmdSummary(ctx: Context) {
	const chatId = ctx.msg?.chat.id.toString() ?? "";
	const role = await getRoleForChat(chatId);
	if (role !== "owner") {
		await ctx.reply("⛔ This command is for owners only.");
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

	await ctx.reply(
		`📊 *Today's Summary*\n\n` +
		`🧾 Total orders: ${todayOrders.length}\n` +
		`✅ Completed: ${completed.length}\n` +
		`💰 Revenue: ${etb(revenue)}\n` +
		`💸 Expenses: ${etb(totalExpenses)}\n` +
		`📈 Net profit: ${etb(revenue - totalExpenses)}\n\n` +
		`*By status:*\n${statusLines}`,
		{ parse_mode: "Markdown" },
	);
}

async function cmdWeekly(ctx: Context) {
	const chatId = ctx.msg?.chat.id.toString() ?? "";
	const role = await getRoleForChat(chatId);
	if (role !== "owner") {
		await ctx.reply("⛔ This command is for owners only.");
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

	// Group by day
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

	await ctx.reply(
		`📅 *Weekly Revenue (last 7 days)*\n\n${lines.join("\n")}\n\n` +
		`💰 Total: ${etb(totalRevenue)}`,
		{ parse_mode: "Markdown" },
	);
}

async function cmdPending(ctx: Context) {
	const chatId = ctx.msg?.chat.id.toString() ?? "";
	const role = await getRoleForChat(chatId);
	if (role !== "owner") {
		await ctx.reply("⛔ This command is for owners only.");
		return;
	}

	const rows = await db.query.orders.findMany({
		where: (o, { inArray }) => inArray(o.status, ["awaiting", "pending"]),
		with: { items: true },
		orderBy: [desc(orders.createdAt)],
	});

	if (rows.length === 0) {
		await ctx.reply("✅ No pending orders.");
		return;
	}

	const lines = rows.map((o) => {
		const extra =
			o.type === "online" ? `\n  📞 ${o.customerPhone ?? "—"}` :
			o.type === "dine_in" ? `\n  🪑 Table ${o.tableNumber ?? "—"}` : "";
		return `#${o.id.slice(-4)} ${orderTypeBadge(o.type)} — ${statusBadge(o.status)}${extra}\n  ${o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}`;
	});

	await ctx.reply(`⏳ *Pending orders (${rows.length})*\n\n${lines.join("\n\n")}`, {
		parse_mode: "Markdown",
	});
}

async function cmdKitchen(ctx: Context) {
	const chatId = ctx.msg?.chat.id.toString() ?? "";
	const role = await getRoleForChat(chatId);
	if (role !== "owner" && role !== "chef") {
		await ctx.reply("⛔ This command is for chefs and owners.");
		return;
	}

	const rows = await db.query.orders.findMany({
		where: (o, { eq }) => eq(o.status, "in_kitchen"),
		with: { items: true },
		orderBy: [orders.createdAt],
	});

	if (rows.length === 0) {
		await ctx.reply("🍽️ No orders in the kitchen right now.");
		return;
	}

	const now = Date.now();
	const lines = rows.map((o) => {
		const elapsed = Math.floor((now - o.createdAt.getTime()) / 60000);
		return `#${o.id.slice(-4)} ${orderTypeBadge(o.type)} — ${elapsed}min ago\n${o.items.map((i) => `  ${i.quantity}× ${i.name}`).join("\n")}${o.notes ? `\n  📝 ${o.notes}` : ""}`;
	});

	await ctx.reply(
		`👨‍🍳 *In kitchen (${rows.length})*\n\nUse /ready [id] to mark done.\n\n${lines.join("\n\n")}`,
		{ parse_mode: "Markdown" },
	);
}

async function cmdReady(ctx: Context) {
	const chatId = ctx.msg?.chat.id.toString() ?? "";
	const role = await getRoleForChat(chatId);
	if (role !== "owner" && role !== "chef") {
		await ctx.reply("⛔ This command is for chefs and owners.");
		return;
	}

	// Extract order ID from command text: /ready abc1
	const text = ctx.msg?.text ?? "";
	const parts = text.trim().split(/\s+/);
	const shortId = parts[1];

	if (!shortId) {
		await ctx.reply("Usage: /ready [order_id]\nExample: /ready a1b2");
		return;
	}

	// Find order by last-4 of ID or full ID
	const allKitchenOrders = await db.query.orders.findMany({
		where: (o, { eq }) => eq(o.status, "in_kitchen"),
	});
	const match = allKitchenOrders.find(
		(o) => o.id === shortId || o.id.slice(-4) === shortId,
	);

	if (!match) {
		await ctx.reply(`❌ No in-kitchen order found with ID "${shortId}".`);
		return;
	}

	await db
		.update(orders)
		.set({ status: "ready", updatedAt: new Date() })
		.where(eq(orders.id, match.id));

	await ctx.reply(`✅ Order #${match.id.slice(-4)} marked as ready.`);

	// Notify waiters
	await sendToWaiters(`✅ Order #${match.id.slice(-4)} is ready for pickup/delivery`);
}

// ─── Register commands on bot ─────────────────────────────────────────────────

function registerCommands(bot: Bot) {
	bot.command("orders", cmdOrders);
	bot.command("summary", cmdSummary);
	bot.command("weekly", cmdWeekly);
	bot.command("pending", cmdPending);
	bot.command("kitchen", cmdKitchen);
	bot.command("ready", cmdReady);
	bot.command("myid", (ctx) =>
		ctx.reply(
			`Your chat ID is:\n\`${ctx.msg?.chat.id}\`\n\nPaste this into PlateForm → Settings → Telegram → Contacts.`,
			{ parse_mode: "Markdown" },
		),
	);
	bot.command("start", (ctx) =>
		ctx.reply(
			"👋 *PlateForm Bot*\n\nAvailable commands:\n" +
			"/orders — Today's active orders\n" +
			"/summary — Today's summary\n" +
			"/weekly — Weekly revenue\n" +
			"/pending — Awaiting action\n" +
			"/kitchen — In-kitchen orders (chef)\n" +
			"/ready [id] — Mark order ready (chef)\n" +
			"/myid — Get your Telegram chat ID",
			{ parse_mode: "Markdown" },
		),
	);
}

// ─── Webhook entry point ──────────────────────────────────────────────────────

export async function handleWebhookUpdate(update: unknown): Promise<void> {
	try {
		const bot = await getBot();
		if (!bot) {
			console.error("[telegram] handleWebhookUpdate: no bot (missing token?)");
			return;
		}
		// biome-ignore lint/suspicious/noExplicitAny: grammy expects Update type
		await bot.handleUpdate(update as any);
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
	const bot = await getBot();
	if (!bot || chatIds.length === 0) return;
	await Promise.allSettled(chatIds.map((id) => bot.api.sendMessage(id, message)));
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
