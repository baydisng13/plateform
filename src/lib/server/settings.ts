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

// Restaurant settings
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
						username: z.string(),
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

// Tables
export const getTables = createServerFn({ method: "GET" }).handler(async () => {
	return db.select().from(tables).orderBy(tables.number);
});

export const createTable = createServerFn({ method: "POST" })
	.inputValidator(z.object({ number: z.number().int().positive(), name: z.string().optional(), capacity: z.number().optional() }))
	.handler(async ({ data }) => {
		const [table] = await db.insert(tables).values({ id: nanoid(), ...data }).returning();
		return table;
	});

export const updateTable = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string(), number: z.number().int().positive(), name: z.string().optional(), capacity: z.number().optional() }))
	.handler(async ({ data: { id, ...rest } }) => {
		const [table] = await db.update(tables).set(rest).where(eq(tables.id, id)).returning();
		return table;
	});

export const deleteTable = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await db.delete(tables).where(eq(tables.id, data.id));
	});

// Expense categories
export const getExpenseCategories = createServerFn({ method: "GET" }).handler(async () => {
	return db.select().from(expenseCategories).orderBy(expenseCategories.name);
});

export const createExpenseCategory = createServerFn({ method: "POST" })
	.inputValidator(z.object({ name: z.string().min(1) }))
	.handler(async ({ data }) => {
		const [cat] = await db.insert(expenseCategories).values({ id: nanoid(), name: data.name }).returning();
		return cat;
	});

export const deleteExpenseCategory = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await db.delete(expenseCategories).where(eq(expenseCategories.id, data.id));
	});
