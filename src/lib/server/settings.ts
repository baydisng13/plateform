import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import {
	restaurantSettings,
	telegramSettings,
	tables,
	expenseCategories,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { encrypt, decrypt } from "@/lib/encrypt";
import { resetBotCache } from "./telegram";
import { requireAuth, requireOwner } from "./auth-utils";
import { env } from "@/env";

// Restaurant settings — read is public (used on public /order page)
export const getRestaurantSettings = createServerFn({ method: "GET" }).handler(async () => {
	const [settings] = await db.select().from(restaurantSettings).limit(1);
	return settings ?? null;
});

export const saveRestaurantSettings = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			name: z.string(),
			logoUrl: z.string().optional(),
			operatingHours: z
				.object({ open: z.string(), close: z.string(), days: z.array(z.number()) })
				.optional(),
			orderTypesEnabled: z.array(z.string()).optional(),
		}),
	)
	.handler(async ({ data }) => {
		await requireOwner();
		const existing = await db.select().from(restaurantSettings).limit(1);
		if (existing.length > 0) {
			await db
				.update(restaurantSettings)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(restaurantSettings.id, "singleton"));
		} else {
			await db.insert(restaurantSettings).values({ id: "singleton", ...data });
		}
	});

// Telegram settings
export const getTelegramSettings = createServerFn({ method: "GET" }).handler(async () => {
	await requireOwner();
	const [settings] = await db.select().from(telegramSettings).limit(1);
	if (!settings) return null;
	return {
		...settings,
		botTokenEncrypted: settings.botTokenEncrypted ? "••••••••" : null,
		hasToken: !!settings.botTokenEncrypted,
	};
});

export const saveTelegramSettings = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			botToken: z.string().optional(),
			contacts: z
				.array(
					z.object({
						id: z.string(),
						name: z.string(),
	
						role: z.string(),
						chatId: z.string(),
					}),
				)
				.optional(),
			ownerChatIds: z.array(z.string()).optional(),
			chefChatIds: z.array(z.string()).optional(),
			waiterChatIds: z.array(z.string()).optional(),
		}),
	)
	.handler(async ({ data }) => {
		await requireOwner();
		const { botToken, ...rest } = data;
		const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() };

		if (botToken) {
			updateData.botTokenEncrypted = encrypt(botToken);
			resetBotCache();
		}

		const existing = await db.select().from(telegramSettings).limit(1);
		if (existing.length > 0) {
			await db
				.update(telegramSettings)
				.set(updateData)
				.where(eq(telegramSettings.id, "singleton"));
		} else {
			await db.insert(telegramSettings).values({ id: "singleton", ...updateData });
		}
	});

// Tables — read requires auth (staff only), mutations owner-only
export const getTables = createServerFn({ method: "GET" }).handler(async () => {
	await requireAuth();
	return db.select().from(tables).orderBy(tables.number);
});

export const createTable = createServerFn({ method: "POST" })
	.inputValidator(z.object({ number: z.number().int().positive(), name: z.string().optional(), capacity: z.number().optional() }))
	.handler(async ({ data }) => {
		await requireOwner();
		const [table] = await db.insert(tables).values({ id: nanoid(), ...data }).returning();
		return table;
	});

export const updateTable = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string(), number: z.number().int().positive(), name: z.string().optional(), capacity: z.number().optional() }))
	.handler(async ({ data: { id, ...rest } }) => {
		await requireOwner();
		const [table] = await db.update(tables).set(rest).where(eq(tables.id, id)).returning();
		return table;
	});

export const deleteTable = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await requireOwner();
		await db.delete(tables).where(eq(tables.id, data.id));
	});

// Expense categories
export const getExpenseCategories = createServerFn({ method: "GET" }).handler(async () => {
	await requireOwner();
	return db.select().from(expenseCategories).orderBy(expenseCategories.name);
});

export const createExpenseCategory = createServerFn({ method: "POST" })
	.inputValidator(z.object({ name: z.string().min(1) }))
	.handler(async ({ data }) => {
		await requireOwner();
		const [cat] = await db.insert(expenseCategories).values({ id: nanoid(), name: data.name }).returning();
		return cat;
	});

export const deleteExpenseCategory = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await requireOwner();
		await db.delete(expenseCategories).where(eq(expenseCategories.id, data.id));
	});

// Telegram webhook registration
export const registerTelegramWebhook = createServerFn({ method: "POST" }).handler(async () => {
	await requireOwner();

	const [settings] = await db.select().from(telegramSettings).limit(1);
	if (!settings?.botTokenEncrypted) throw new Error("No bot token saved. Add your token first.");

	const token = decrypt(settings.botTokenEncrypted);
	const baseUrl = (env.BETTER_AUTH_URL ?? "").replace(/\/$/, "");
	const webhookUrl = `${baseUrl}/api/telegram/webhook`;
	const secret = env.TELEGRAM_WEBHOOK_SECRET;

	const body: Record<string, string> = { url: webhookUrl };
	if (secret) body.secret_token = secret;

	const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	const json = (await res.json()) as { ok: boolean; description?: string };
	if (!json.ok) throw new Error(json.description ?? "Telegram API error");

	return { webhookUrl, description: json.description ?? "Webhook registered." };
});

export const sendTestMessage = createServerFn({ method: "POST" })
	.inputValidator(z.object({ chatId: z.string() }))
	.handler(async ({ data }) => {
		await requireOwner();

		const [settings] = await db.select().from(telegramSettings).limit(1);
		if (!settings?.botTokenEncrypted) throw new Error("No bot token saved.");

		const token = decrypt(settings.botTokenEncrypted);
		const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ chat_id: data.chatId, text: "✅ PlateForm test message — notifications are working!" }),
		});

		const json = (await res.json()) as { ok: boolean; description?: string };
		if (!json.ok) throw new Error(json.description ?? "Telegram API error");

		return { ok: true };
	});

export const checkTelegramWebhook = createServerFn({ method: "GET" }).handler(async () => {
	await requireOwner();

	const [settings] = await db.select().from(telegramSettings).limit(1);
	if (!settings?.botTokenEncrypted) throw new Error("No bot token saved.");

	const token = decrypt(settings.botTokenEncrypted);
	const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
	const json = (await res.json()) as {
		ok: boolean;
		result?: { url: string; has_custom_certificate: boolean; pending_update_count: number; last_error_message?: string; last_error_date?: number };
		description?: string;
	};

	if (!json.ok) throw new Error(json.description ?? "Telegram API error");
	return json.result ?? null;
});
