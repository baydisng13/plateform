import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Plus, Minus, Search, Trash2, ShoppingCart } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { getMenuItems, getMenuCategories } from "@/lib/server/menu";
import { getTables } from "@/lib/server/settings";
import { createOrder } from "@/lib/server/orders";
import { MenuPosCard } from "@/components/menu-pos-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatETB } from "@/lib/utils";
import { cn } from "@/lib/utils";

type OrderType = "dine_in" | "takeaway" | "delivery";

export const Route = createFileRoute("/_auth/new-order")({
	head: () => ({ meta: [{ title: "New Order — PlateForm" }] }),
	loader: async () => {
		const [menuItems, menuCategories, tables] = await Promise.all([
			getMenuItems(),
			getMenuCategories(),
			getTables(),
		]);
		return { menuItems: menuItems.filter((m) => m.available), menuCategories, tables };
	},
	component: NewOrderPage,
});

interface CartLine {
	id: string;
	name: string;
	qty: number;
	price: number;
}

function NewOrderPage() {
	const { menuItems, menuCategories, tables } = Route.useLoaderData();
	const navigate = useNavigate();
	const [cat, setCat] = useState<string>("all");
	const [query, setQuery] = useState("");
	const [cart, setCart] = useState<CartLine[]>([]);
	const [type, setType] = useState<OrderType>("dine_in");
	const [table, setTable] = useState<number>(tables[0]?.number ?? 1);
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");
	const [notes, setNotes] = useState("");
	const [placing, setPlacing] = useState(false);
	const [cartOpen, setCartOpen] = useState(false);

	const visible = useMemo(
		() =>
			menuItems.filter(
				(m) =>
					(cat === "all" || m.categoryId === cat) &&
					(query.length === 0 || m.name.toLowerCase().includes(query.toLowerCase())),
			),
		[menuItems, cat, query],
	);

	const subtotal = cart.reduce((s, l) => s + l.qty * l.price, 0);
	const totalQty = cart.reduce((s, l) => s + l.qty, 0);

	const add = (m: (typeof menuItems)[number]) =>
		setCart((c) => {
			const existing = c.find((x) => x.id === m.id);
			if (existing) return c.map((x) => (x.id === m.id ? { ...x, qty: x.qty + 1 } : x));
			return [...c, { id: m.id, name: m.name, qty: 1, price: m.price }];
		});
	const dec = (id: string) =>
		setCart((c) => c.map((x) => (x.id === id ? { ...x, qty: x.qty - 1 } : x)).filter((x) => x.qty > 0));
	const inc = (id: string) => setCart((c) => c.map((x) => (x.id === id ? { ...x, qty: x.qty + 1 } : x)));
	const remove = (id: string) => setCart((c) => c.filter((x) => x.id !== id));

	const placeOrder = async () => {
		if (cart.length === 0 || placing) return;
		setPlacing(true);
		await createOrder({
			data: {
				type,
				tableNumber: type === "dine_in" ? table : undefined,
				customerPhone: phone || undefined,
				address: address || undefined,
				notes: notes || undefined,
				items: cart.map((l) => ({
					menuItemId: l.id,
					name: l.name,
					quantity: l.qty,
					unitPrice: l.price,
				})),
			},
		});
		setPlacing(false);
		void navigate({ to: "/" });
	};

	const cartPanelProps = {
		cart, type, table, phone, address, notes, subtotal, placing, tables,
		setType, setTable, setPhone, setAddress, setNotes,
		onDec: dec, onInc: inc, onRemove: remove, onPlace: placeOrder,
	};

	return (
		<AppShell>
			<PageHeader title="New Order" subtitle="Select items and confirm" />

			<div className="flex flex-1 overflow-hidden">
				{/* Menu section — full width on mobile, flex-1 on desktop */}
				<section className="flex flex-1 flex-col overflow-hidden">
					<div className="flex items-center gap-3 border-b px-4 py-3">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Search menu…"
								className="pl-10"
							/>
						</div>
					</div>

					<div className="flex gap-2 overflow-x-auto px-4 py-2.5 border-b">
						<CatChip active={cat === "all"} onClick={() => setCat("all")}>All</CatChip>
						{menuCategories.map((c) => (
							<CatChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
								{c.name}
							</CatChip>
						))}
					</div>

					<div className="grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto p-4 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
						{visible.map((m) => {
							const cartQty = cart.find((x) => x.id === m.id)?.qty;
							return (
								<MenuPosCard
									key={m.id}
									name={m.name}
									color={m.color}
									price={m.price}
									available={m.available}
									cartQty={cartQty}
									onClick={() => add(m)}
								/>
							);
						})}
					</div>
				</section>

				{/* Desktop cart sidebar */}
				<aside className="hidden md:flex w-[360px] shrink-0 flex-col border-l bg-card">
					<CartPanel {...cartPanelProps} />
				</aside>
			</div>

			{/* Mobile floating cart bar */}
			{cart.length > 0 && (
				<div className="md:hidden fixed bottom-16 left-0 right-0 z-40 px-4 pb-2">
					<button
						type="button"
						onClick={() => setCartOpen(true)}
						className="flex w-full items-center justify-between rounded-2xl bg-foreground px-5 py-4 text-background shadow-xl"
					>
						<div className="flex items-center gap-3">
							<span className="grid size-7 place-items-center rounded-lg bg-white/20 text-sm font-bold">
								{totalQty}
							</span>
							<div className="flex items-center gap-2">
								<ShoppingCart className="size-4" />
								<span className="text-sm font-semibold">View Cart</span>
							</div>
						</div>
						<span className="text-sm font-bold tabular-nums">{formatETB(subtotal)}</span>
					</button>
				</div>
			)}

			{/* Mobile cart sheet */}
			<Sheet open={cartOpen} onOpenChange={setCartOpen}>
				<SheetContent side="bottom" className="md:hidden h-[90vh] rounded-t-3xl p-0 flex flex-col">
					<SheetHeader className="border-b px-6 py-4 shrink-0">
						<SheetTitle className="text-left">
							Current Order
							<span className="ml-2 text-sm font-normal text-muted-foreground">
								{totalQty} {totalQty === 1 ? "item" : "items"}
							</span>
						</SheetTitle>
					</SheetHeader>
					<div className="flex-1 overflow-y-auto">
						<CartPanel {...cartPanelProps} />
					</div>
				</SheetContent>
			</Sheet>
		</AppShell>
	);
}

type CartPanelProps = {
	cart: CartLine[];
	type: OrderType;
	table: number;
	phone: string;
	address: string;
	notes: string;
	subtotal: number;
	placing: boolean;
	tables: Array<{ id: string; number: number }>;
	setType: (t: OrderType) => void;
	setTable: (n: number) => void;
	setPhone: (v: string) => void;
	setAddress: (v: string) => void;
	setNotes: (v: string) => void;
	onDec: (id: string) => void;
	onInc: (id: string) => void;
	onRemove: (id: string) => void;
	onPlace: () => void;
};

function CartPanel({
	cart, type, table, phone, address, notes, subtotal, placing, tables,
	setType, setTable, setPhone, setAddress, setNotes,
	onDec, onInc, onRemove, onPlace,
}: CartPanelProps) {
	return (
		<>
			{/* Order type */}
			<div className="border-b px-5 py-4 shrink-0">
				<p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
					Order Type
				</p>
				<div className="grid grid-cols-3 gap-2">
					{(["dine_in", "takeaway", "delivery"] as OrderType[]).map((t) => (
						<button
							key={t}
							type="button"
							onClick={() => setType(t)}
							className={cn(
								"rounded-lg px-2 py-2 text-xs font-semibold transition-all",
								type === t
									? "bg-foreground text-background"
									: "bg-muted text-muted-foreground hover:text-foreground",
							)}
						>
							{t === "dine_in" ? "Dine-in" : t === "takeaway" ? "Takeaway" : "Delivery"}
						</button>
					))}
				</div>

				{type === "dine_in" && (
					<div className="mt-3">
						<p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
							Table
						</p>
						<div className="flex flex-wrap gap-1.5">
							{tables.map((t) => (
								<button
									key={t.id}
									type="button"
									onClick={() => setTable(t.number)}
									className={cn(
										"grid size-9 place-items-center rounded-lg text-xs font-bold transition-all",
										table === t.number
											? "bg-primary text-primary-foreground"
											: "bg-muted text-muted-foreground hover:text-foreground",
									)}
								>
									{t.number}
								</button>
							))}
						</div>
					</div>
				)}

				{(type === "delivery" || type === "takeaway") && (
					<div className="mt-3 space-y-2">
						<Input
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							placeholder="+251 9… customer phone"
						/>
						{type === "delivery" && (
							<Input
								value={address}
								onChange={(e) => setAddress(e.target.value)}
								placeholder="Delivery address"
							/>
						)}
					</div>
				)}

				<div className="mt-2">
					<Input
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						placeholder="Order notes (optional)"
					/>
				</div>
			</div>

			{/* Cart items */}
			<div className="flex-1 overflow-y-auto px-5 py-4">
				{cart.length === 0 ? (
					<p className="py-12 text-center text-sm text-muted-foreground">
						Tap any item to add it.
					</p>
				) : (
					<ul className="space-y-3">
						{cart.map((l) => (
							<li key={l.id} className="flex items-center gap-3">
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold">{l.name}</p>
									<p className="text-xs text-muted-foreground tabular-nums">
										{formatETB(l.price)} each
									</p>
								</div>
								<div className="flex items-center gap-1.5 rounded-lg bg-muted p-1">
									<button
										type="button"
										onClick={() => onDec(l.id)}
										className="grid size-7 place-items-center rounded-md bg-card text-foreground active:scale-90"
										aria-label="Decrease"
									>
										<Minus className="size-3.5" strokeWidth={2.5} />
									</button>
									<span className="w-5 text-center text-sm font-bold tabular-nums">{l.qty}</span>
									<button
										type="button"
										onClick={() => onInc(l.id)}
										className="grid size-7 place-items-center rounded-md bg-foreground text-background active:scale-90"
										aria-label="Increase"
									>
										<Plus className="size-3.5" strokeWidth={2.5} />
									</button>
								</div>
								<button
									type="button"
									onClick={() => onRemove(l.id)}
									className="text-muted-foreground hover:text-destructive"
									aria-label="Remove"
								>
									<Trash2 className="size-4" />
								</button>
							</li>
						))}
					</ul>
				)}
			</div>

			{/* Footer */}
			<div className="border-t bg-muted/40 px-5 py-4 shrink-0">
				<div className="mb-4 space-y-1.5">
					<Row label="Subtotal" value={formatETB(subtotal)} />
					<Row label="Service fee" value="—" muted />
					<div className="flex items-baseline justify-between border-t pt-2">
						<span className="text-sm font-bold">Total</span>
						<span className="text-xl font-bold tabular-nums">{formatETB(subtotal)}</span>
					</div>
				</div>
				<Button
					disabled={cart.length === 0 || placing}
					className="w-full"
					size="lg"
					onClick={onPlace}
				>
					{placing ? "Placing…" : "Place Order"}
				</Button>
			</div>
		</>
	);
}

function CatChip({
	children,
	active,
	onClick,
}: {
	children: React.ReactNode;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
				active ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground",
			)}
		>
			{children}
		</button>
	);
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
	return (
		<div className="flex justify-between text-sm">
			<span className={muted ? "text-muted-foreground" : ""}>{label}</span>
			<span className={muted ? "tabular-nums text-muted-foreground" : "tabular-nums"}>{value}</span>
		</div>
	);
}
