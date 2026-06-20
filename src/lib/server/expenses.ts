import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { eq, gte, lte, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

export const getExpenses = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			from: z.string().optional(),
			to: z.string().optional(),
			categoryId: z.string().optional(),
		}).optional(),
	)
	.handler(async ({ data }) => {
		return db.query.expenses.findMany({
			where: (e, { and, gte, lte, eq }) => {
				const conditions = [];
				if (data?.from) conditions.push(gte(e.date, new Date(data.from)));
				if (data?.to) conditions.push(lte(e.date, new Date(data.to)));
				if (data?.categoryId) conditions.push(eq(e.categoryId, data.categoryId));
				return conditions.length > 0 ? and(...conditions) : undefined;
			},
			orderBy: [desc(expenses.date)],
		});
	});

export const createExpense = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			amount: z.number().positive(),
			categoryId: z.string().optional(),
			description: z.string().optional(),
			date: z.string(),
		}),
	)
	.handler(async ({ data }) => {
		const [expense] = await db
			.insert(expenses)
			.values({
				id: nanoid(),
				amount: data.amount,
				categoryId: data.categoryId,
				description: data.description,
				date: new Date(data.date),
			})
			.returning();
		return expense;
	});

export const deleteExpense = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await db.delete(expenses).where(eq(expenses.id, data.id));
	});
