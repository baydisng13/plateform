import {
	pgTable,
	text,
	integer,
	boolean,
	timestamp,
	real,
	json,
	pgEnum,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["owner", "waiter", "chef"]);

export const orderTypeEnum = pgEnum("order_type", [
	"dine_in",
	"takeaway",
	"delivery",
	"online",
]);

export const orderStatusEnum = pgEnum("order_status", [
	"awaiting",
	"pending",
	"in_kitchen",
	"ready",
	"completed",
]);

export const kitchenStatusEnum = pgEnum("kitchen_status", [
	"waiting",
	"cooking",
	"ready",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
	"cash",
	"telebirr",
	"cbe",
	"boa",
]);

// ─── Better Auth tables ───────────────────────────────────────────────────────

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	role: roleEnum("role").notNull().default("waiter"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── Restaurant ───────────────────────────────────────────────────────────────

export const restaurantSettings = pgTable("restaurant_settings", {
	id: text("id").primaryKey().default("singleton"),
	name: text("name").notNull().default(""),
	logoUrl: text("logo_url"),
	operatingHours: json("operating_hours").$type<{
		open: string;
		close: string;
		days: number[];
	}>(),
	orderTypesEnabled: json("order_types_enabled")
		.$type<string[]>()
		.default(["dine_in", "takeaway", "delivery", "online"]),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const telegramSettings = pgTable("telegram_settings", {
	id: text("id").primaryKey().default("singleton"),
	botTokenEncrypted: text("bot_token_encrypted"),
	ownerChatIds: json("owner_chat_ids").$type<string[]>().default([]),
	chefChatIds: json("chef_chat_ids").$type<string[]>().default([]),
	waiterChatIds: json("waiter_chat_ids").$type<string[]>().default([]),
	contacts: json("contacts").$type<
		Array<{ id: string; name: string; username: string; role: string; chatId: string }>
	>().default([]),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Menu ─────────────────────────────────────────────────────────────────────

export const menuCategories = pgTable("menu_categories", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const menuTags = pgTable("menu_tags", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	color: text("color").notNull(),
	isDefault: boolean("is_default").notNull().default(false),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const menuItems = pgTable("menu_items", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	description: text("description"),
	categoryId: text("category_id")
		.notNull()
		.references(() => menuCategories.id),
	price: real("price").notNull(),
	imageUrl: text("image_url"),
	color: text("color").notNull().default("bg-emerald-100 text-emerald-700"),
	available: boolean("available").notNull().default(true),
	tagIds: json("tag_ids").$type<string[]>().default([]),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Tables ───────────────────────────────────────────────────────────────────

export const tables = pgTable("tables", {
	id: text("id").primaryKey(),
	number: integer("number").notNull().unique(),
	name: text("name"),
	capacity: integer("capacity"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Expense categories ───────────────────────────────────────────────────────

export const expenseCategories = pgTable("expense_categories", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Orders ───────────────────────────────────────────────────────────────────

export const orders = pgTable("orders", {
	id: text("id").primaryKey(),
	type: orderTypeEnum("type").notNull(),
	status: orderStatusEnum("status").notNull().default("pending"),
	customerPhone: text("customer_phone"),
	customerName: text("customer_name"),
	tableId: text("table_id").references(() => tables.id),
	tableNumber: integer("table_number"),
	address: text("address"),
	notes: text("notes"),
	deliveryNote: text("delivery_note"),
	waiterId: text("waiter_id").references(() => user.id),
	createdBy: text("created_by").references(() => user.id),
	elapsedMin: integer("elapsed_min").notNull().default(0),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
	id: text("id").primaryKey(),
	orderId: text("order_id")
		.notNull()
		.references(() => orders.id, { onDelete: "cascade" }),
	menuItemId: text("menu_item_id").references(() => menuItems.id),
	name: text("name").notNull(),
	quantity: integer("quantity").notNull(),
	unitPrice: real("unit_price").notNull(),
	kitchenStatus: kitchenStatusEnum("kitchen_status").default("waiting"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const payments = pgTable("payments", {
	id: text("id").primaryKey(),
	orderId: text("order_id")
		.notNull()
		.references(() => orders.id, { onDelete: "cascade" }),
	method: paymentMethodEnum("method").notNull(),
	transactionRef: text("transaction_ref"),
	proofUrl: text("proof_url"),
	amountReceived: real("amount_received"),
	tip: real("tip"),
	confirmedBy: text("confirmed_by").references(() => user.id),
	confirmedAt: timestamp("confirmed_at").notNull().defaultNow(),
});

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const expenses = pgTable("expenses", {
	id: text("id").primaryKey(),
	amount: real("amount").notNull(),
	categoryId: text("category_id").references(() => expenseCategories.id),
	description: text("description"),
	date: timestamp("date").notNull().defaultNow(),
	createdBy: text("created_by").references(() => user.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});
