import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { menuItems, menuCategories, menuTags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

export const getMenuItems = createServerFn({ method: "GET" }).handler(async () => {
	return db.select().from(menuItems).orderBy(menuItems.createdAt);
});

export const getMenuCategories = createServerFn({ method: "GET" }).handler(async () => {
	return db.select().from(menuCategories).orderBy(menuCategories.name);
});

export const getMenuTags = createServerFn({ method: "GET" }).handler(async () => {
	return db.select().from(menuTags).orderBy(menuTags.createdAt);
});

const menuItemSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	categoryId: z.string(),
	price: z.number().positive(),
	color: z.string(),
	available: z.boolean(),
	tagIds: z.array(z.string()).optional(),
	imageUrl: z.string().optional(),
});

export const createMenuItem = createServerFn({ method: "POST" })
	.inputValidator(menuItemSchema)
	.handler(async ({ data }) => {
		const [item] = await db
			.insert(menuItems)
			.values({ ...data, id: nanoid(), tagIds: data.tagIds ?? [] })
			.returning();
		return item;
	});

export const updateMenuItem = createServerFn({ method: "POST" })
	.inputValidator(menuItemSchema.extend({ id: z.string() }))
	.handler(async ({ data: { id, ...rest } }) => {
		const [item] = await db
			.update(menuItems)
			.set({ ...rest, updatedAt: new Date() })
			.where(eq(menuItems.id, id))
			.returning();
		return item;
	});

export const deleteMenuItem = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await db.delete(menuItems).where(eq(menuItems.id, data.id));
	});

export const toggleMenuItemAvailability = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string(), available: z.boolean() }))
	.handler(async ({ data }) => {
		const [item] = await db
			.update(menuItems)
			.set({ available: data.available, updatedAt: new Date() })
			.where(eq(menuItems.id, data.id))
			.returning();
		return item;
	});

// Categories
const categorySchema = z.object({ name: z.string().min(1) });

export const createMenuCategory = createServerFn({ method: "POST" })
	.inputValidator(categorySchema)
	.handler(async ({ data }) => {
		const [cat] = await db
			.insert(menuCategories)
			.values({ id: nanoid(), name: data.name })
			.returning();
		return cat;
	});

export const updateMenuCategory = createServerFn({ method: "POST" })
	.inputValidator(categorySchema.extend({ id: z.string() }))
	.handler(async ({ data: { id, ...rest } }) => {
		const [cat] = await db
			.update(menuCategories)
			.set(rest)
			.where(eq(menuCategories.id, id))
			.returning();
		return cat;
	});

export const deleteMenuCategory = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await db.delete(menuCategories).where(eq(menuCategories.id, data.id));
	});

// Tags
const tagSchema = z.object({ name: z.string().min(1), color: z.string(), isDefault: z.boolean().optional() });

export const createMenuTag = createServerFn({ method: "POST" })
	.inputValidator(tagSchema)
	.handler(async ({ data }) => {
		const [tag] = await db
			.insert(menuTags)
			.values({ id: nanoid(), name: data.name, color: data.color, isDefault: data.isDefault ?? false })
			.returning();
		return tag;
	});

export const updateMenuTag = createServerFn({ method: "POST" })
	.inputValidator(tagSchema.extend({ id: z.string() }))
	.handler(async ({ data: { id, ...rest } }) => {
		const [tag] = await db
			.update(menuTags)
			.set(rest)
			.where(eq(menuTags.id, id))
			.returning();
		return tag;
	});

export const deleteMenuTag = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		await db.delete(menuTags).where(eq(menuTags.id, data.id));
	});
