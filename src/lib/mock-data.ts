export type OrderType = "dine_in" | "takeaway" | "delivery" | "online";
export type OrderStatus =
	| "awaiting"
	| "pending"
	| "in_kitchen"
	| "ready"
	| "completed";
export type PaymentMethod = "cash" | "telebirr" | "cbe" | "boa";
export type StaffRole = "Owner" | "Waiter" | "Chef";
export type ExpenseCategory =
	| "Ingredients"
	| "Utilities"
	| "Rent"
	| "Staff"
	| "Equipment"
	| "Other";

export interface MenuCategory {
	id: string;
	name: string;
}

export interface MenuTag {
	id: string;
	name: string;
	color: string;
	isDefault?: boolean;
}

export interface MenuItem {
	id: string;
	name: string;
	description: string;
	categoryId: string;
	price: number;
	color: string;
	available: boolean;
	tagIds?: string[];
}

export type ItemKitchenStatus = "waiting" | "cooking" | "ready";

export interface OrderLine {
	menuItemId: string;
	name: string;
	qty: number;
	unitPrice: number;
	kitchenStatus?: ItemKitchenStatus;
}

export interface Order {
	id: string;
	type: OrderType;
	status: OrderStatus;
	customerName?: string;
	customerPhone?: string;
	address?: string;
	tableNumber?: number;
	notes?: string;
	items: OrderLine[];
	createdAt: string;
	elapsedMin: number;
	waiter?: string;
	payment?: { method: PaymentMethod; ref?: string };
}

export interface Expense {
	id: string;
	amount: number;
	category: ExpenseCategory;
	description: string;
	date: string;
}

export interface StaffMember {
	id: string;
	name: string;
	email: string;
	role: StaffRole;
	active: boolean;
}

export const restaurant = {
	name: "Fresh & Pressed",
	initial: "F",
	tagline: "Healthy food & cold-pressed juice",
	owner: "Haben G.",
};

export const menuTags: MenuTag[] = [
	{ id: "fasting", name: "Fasting", color: "bg-violet-100 text-violet-700", isDefault: true },
	{ id: "non-fasting", name: "Non-Fasting", color: "bg-amber-100 text-amber-700", isDefault: true },
	{ id: "vegan", name: "Vegan", color: "bg-emerald-100 text-emerald-700", isDefault: true },
	{ id: "spicy", name: "Spicy", color: "bg-rose-100 text-rose-700", isDefault: true },
];

export const menuCategories: MenuCategory[] = [
	{ id: "juices", name: "Cold-Pressed Juices" },
	{ id: "smoothies", name: "Smoothies" },
	{ id: "bowls", name: "Grain Bowls" },
	{ id: "salads", name: "Salads" },
	{ id: "shots", name: "Wellness Shots" },
];

export const menuItems: MenuItem[] = [
	{
		id: "m1",
		name: "Avocado Detox",
		description: "Avocado, spinach, lime, mint, coconut water",
		categoryId: "juices",
		price: 220,
		color: "bg-emerald-100 text-emerald-700",
		available: true,
	},
	{
		id: "m2",
		name: "Mango Paradise",
		description: "Fresh mango, orange, banana, ginger",
		categoryId: "smoothies",
		price: 180,
		color: "bg-amber-100 text-amber-700",
		available: true,
	},
	{
		id: "m3",
		name: "Beetroot Detox",
		description: "Beetroot, carrot, apple, lemon, ginger",
		categoryId: "juices",
		price: 200,
		color: "bg-rose-100 text-rose-700",
		available: true,
	},
	{
		id: "m4",
		name: "Quinoa Power Bowl",
		description: "Quinoa, roasted veg, chickpeas, avocado, tahini",
		categoryId: "bowls",
		price: 380,
		color: "bg-yellow-100 text-yellow-700",
		available: true,
	},
	{
		id: "m5",
		name: "Greek Salad",
		description: "Tomato, cucumber, olives, feta, oregano",
		categoryId: "salads",
		price: 320,
		color: "bg-sky-100 text-sky-700",
		available: true,
	},
	{
		id: "m6",
		name: "Ginger Citrus Shot",
		description: "Ginger, turmeric, orange, lemon, cayenne",
		categoryId: "shots",
		price: 90,
		color: "bg-orange-100 text-orange-700",
		available: true,
	},
	{
		id: "m7",
		name: "Acai Berry Bowl",
		description: "Acai, banana, blueberries, granola, coconut",
		categoryId: "bowls",
		price: 360,
		color: "bg-purple-100 text-purple-700",
		available: false,
	},
	{
		id: "m8",
		name: "Green Goddess",
		description: "Kale, avocado, cucumber, sprouts, tahini dressing",
		categoryId: "salads",
		price: 340,
		color: "bg-green-100 text-green-700",
		available: true,
	},
	{
		id: "m9",
		name: "Tropical Smoothie",
		description: "Pineapple, mango, coconut milk, chia seeds",
		categoryId: "smoothies",
		price: 200,
		color: "bg-teal-100 text-teal-700",
		available: true,
	},
	{
		id: "m10",
		name: "Lemon Wheatgrass",
		description: "Wheatgrass, lemon, ginger, apple",
		categoryId: "shots",
		price: 80,
		color: "bg-lime-100 text-lime-700",
		available: true,
	},
];

const today = new Date();
const iso = (mAgo: number) => {
	const d = new Date(today);
	d.setMinutes(d.getMinutes() - mAgo);
	return d.toISOString();
};

export const orders: Order[] = [
	{
		id: "ORD-8832",
		type: "online",
		status: "awaiting",
		customerPhone: "+251 911 234 567",
		address: "Bole Apartments, Bldg 4, Apt 12",
		items: [
			{ menuItemId: "m1", name: "Avocado Detox", qty: 2, unitPrice: 220 },
			{ menuItemId: "m4", name: "Quinoa Power Bowl", qty: 1, unitPrice: 380 },
		],
		createdAt: iso(4),
		elapsedMin: 4,
	},
	{
		id: "ORD-8833",
		type: "dine_in",
		status: "pending",
		tableNumber: 7,
		waiter: "Dawit",
		items: [
			{ menuItemId: "m2", name: "Mango Paradise", qty: 2, unitPrice: 180 },
			{ menuItemId: "m6", name: "Ginger Citrus Shot", qty: 1, unitPrice: 90 },
		],
		createdAt: iso(7),
		elapsedMin: 7,
		notes: "No sugar in mango",
	},
	{
		id: "ORD-8831",
		type: "dine_in",
		status: "in_kitchen",
		tableNumber: 4,
		waiter: "Dawit",
		items: [
			{ menuItemId: "m4", name: "Quinoa Power Bowl", qty: 1, unitPrice: 380 },
			{ menuItemId: "m1", name: "Avocado Detox", qty: 1, unitPrice: 220 },
		],
		createdAt: iso(12),
		elapsedMin: 12,
		notes: "No onions in bowl",
	},
	{
		id: "ORD-8830",
		type: "takeaway",
		status: "in_kitchen",
		customerName: "Sara",
		customerPhone: "+251 922 110 998",
		items: [
			{ menuItemId: "m3", name: "Beetroot Detox", qty: 3, unitPrice: 200 },
		],
		createdAt: iso(15),
		elapsedMin: 15,
	},
	{
		id: "ORD-8829",
		type: "takeaway",
		status: "ready",
		customerName: "Sara",
		customerPhone: "+251 922 110 998",
		items: [{ menuItemId: "m5", name: "Greek Salad", qty: 1, unitPrice: 320 }],
		createdAt: iso(22),
		elapsedMin: 22,
	},
	{
		id: "ORD-8828",
		type: "delivery",
		status: "ready",
		customerPhone: "+251 944 882 110",
		address: "Kazanchis, Lion Tower, Apt 8B",
		items: [
			{ menuItemId: "m8", name: "Green Goddess", qty: 1, unitPrice: 340 },
			{ menuItemId: "m6", name: "Ginger Citrus Shot", qty: 2, unitPrice: 90 },
		],
		createdAt: iso(28),
		elapsedMin: 28,
	},
	{
		id: "ORD-8827",
		type: "dine_in",
		status: "completed",
		tableNumber: 2,
		waiter: "Hanna",
		items: [
			{ menuItemId: "m2", name: "Mango Paradise", qty: 1, unitPrice: 180 },
			{ menuItemId: "m5", name: "Greek Salad", qty: 1, unitPrice: 320 },
		],
		createdAt: iso(42),
		elapsedMin: 42,
		payment: { method: "cash" },
	},
	{
		id: "ORD-8826",
		type: "delivery",
		status: "completed",
		customerPhone: "+251 911 555 010",
		address: "Sarbet, Green Hills, Apt 3",
		items: [
			{ menuItemId: "m4", name: "Quinoa Power Bowl", qty: 2, unitPrice: 380 },
		],
		createdAt: iso(58),
		elapsedMin: 58,
		payment: { method: "telebirr", ref: "TBR-998812" },
	},
];

export const expenses: Expense[] = [
	{
		id: "e1",
		amount: 1850,
		category: "Ingredients",
		description: "Mango, avocado, leafy greens (Shola Market)",
		date: iso(60),
	},
	{
		id: "e2",
		amount: 600,
		category: "Utilities",
		description: "Water bill — November",
		date: iso(120),
	},
	{
		id: "e3",
		amount: 12000,
		category: "Rent",
		description: "Shop rent — December",
		date: iso(720),
	},
	{
		id: "e4",
		amount: 4500,
		category: "Staff",
		description: "Dawit — weekly wage",
		date: iso(300),
	},
	{
		id: "e5",
		amount: 950,
		category: "Equipment",
		description: "Replacement juicer blade",
		date: iso(480),
	},
	{
		id: "e6",
		amount: 320,
		category: "Other",
		description: "Cleaning supplies",
		date: iso(180),
	},
];

export const dashboard = {
	revenueToday: 14250,
	ordersToday: 42,
	expensesToday: 3120,
	netToday: 11130,
	revenueWeek: [
		{ day: "Mon", value: 8200 },
		{ day: "Tue", value: 11400 },
		{ day: "Wed", value: 9650 },
		{ day: "Thu", value: 13200 },
		{ day: "Fri", value: 16800 },
		{ day: "Sat", value: 19200 },
		{ day: "Sun", value: 14250 },
	],
	ordersByType: [
		{ type: "Dine-in", value: 18 },
		{ type: "Takeaway", value: 12 },
		{ type: "Delivery", value: 8 },
		{ type: "Online", value: 4 },
	],
	topItems: [
		{ name: "Avocado Detox", sold: 24, pct: 85 },
		{ name: "Mango Paradise", sold: 18, pct: 64 },
		{ name: "Quinoa Power Bowl", sold: 14, pct: 50 },
		{ name: "Beetroot Detox", sold: 11, pct: 39 },
		{ name: "Greek Salad", sold: 7, pct: 25 },
	],
};

export const staff: StaffMember[] = [
	{
		id: "s1",
		name: "Haben G.",
		email: "haben@freshpressed.et",
		role: "Owner",
		active: true,
	},
	{
		id: "s2",
		name: "Dawit M.",
		email: "dawit@freshpressed.et",
		role: "Waiter",
		active: true,
	},
	{
		id: "s3",
		name: "Hanna A.",
		email: "hanna@freshpressed.et",
		role: "Waiter",
		active: true,
	},
	{
		id: "s4",
		name: "Yonas T.",
		email: "yonas@freshpressed.et",
		role: "Chef",
		active: true,
	},
];

export const formatETB = (n: number) =>
	`${new Intl.NumberFormat("en-US").format(Math.round(n))} ETB`;

export const statusLabel: Record<OrderStatus, string> = {
	awaiting: "Awaiting",
	pending: "Pending",
	in_kitchen: "In Kitchen",
	ready: "Ready",
	completed: "Completed",
};

export const typeLabel: Record<OrderType, string> = {
	dine_in: "Dine-in",
	takeaway: "Takeaway",
	delivery: "Delivery",
	online: "Online",
};

export const expenseCategories: ExpenseCategory[] = [
	"Ingredients",
	"Utilities",
	"Rent",
	"Staff",
	"Equipment",
	"Other",
];
