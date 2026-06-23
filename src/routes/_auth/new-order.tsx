import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Plus, Minus, Search, Trash2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { getMenuItems, getMenuCategories } from "@/lib/server/menu";
import { createOrder } from "@/lib/server/orders";
import { MenuPosCard } from "@/components/menu-pos-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatETB } from "@/lib/utils";
import { cn } from "@/lib/utils";

type OrderType = "dine_in" | "takeaway" | "delivery";

export const Route = createFileRoute("/_auth/new-order")({
	head: () => ({ meta: [{ title: "New Order — PlateForm" }] }),
	loader: async () => {
		const [menuItems, menuCategories] = await Promise.all([
			getMenuItems(),
			getMenuCategories(),
		]);
		return { menuItems: menuItems.filter((m) => m.available), menuCategories };
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
	const { menuItems, menuCategories } = Route.useLoaderData();
	const navigate = useNavigate();
	const [cat, setCat] = useState<string>("all");
	const [query, setQuery] = useState("");
	const [cart, setCart] = useState<CartLine[]>([]);
	const [type, setType] = useState<OrderType>("dine_in");
	const [table, setTable] = useState<number>(1);
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");
	const [notes, setNotes] = useState("");
	const [placing, setPlacing] = useState(false);

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

	return (
		<AppShell>
			<PageHeader title="New Order" subtitle="Select items, set order type, confirm" />
			<div className="flex flex-1 flex-col md:flex-row overflow-hidden">
				<section className="flex flex-1 flex-col overflow-hidden">
					<div className="flex items-center gap-3 border-b px-4 sm:px-6 py-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search menu…" className="pl-10" />
						</div>
					</div>

					<div className="flex gap-2 overflow-x-auto px-4 sm:px-6 py-3">
						<CatChip active={cat === "all"} onClick={() => setCat("all")}>All</CatChip>
						{menuCategories.map((c) => (
							<CatChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
								{c.name}
							</CatChip>
						))}
					</div>

					<div className="grid flex-1 grid-cols-2 content-start gap-4 overflow-y-auto p-4 sm:p-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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

				<aside className="flex w-full md:w-[380px] shrink-0 flex-col border-t md:border-t-0 md:border-l bg-card max-h-[45vh] md:max-h-none">
					<div className="border-b px-4 sm:px-6 py-3 sm:py-5">
						<h2 className="text-base font-semibold">Current Order</h2>
						<p className="mt-0.5 text-xs text-muted-foreground">
							{cart.length} {cart.length === 1 ? "item" : "items"}
						</p>
					</div>

					<div className="border-b px-4 sm:px-6 py-3 sm:py-4">
						<p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Order Type</p>
						<div className="grid grid-cols-3 gap-2">
							{(["dine_in", "takeaway", "delivery"] as OrderType[]).map((t) => (
								<button
									key={t}
									type="button"
									onClick={() => setType(t)}
									className={cn(
										"rounded-lg px-2 py-2 text-xs font-semibold transition-all",
										type === t ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground",
									)}
								>
									{t === "dine_in" ? "Dine-in" : t === "takeaway" ? "Takeaway" : "Delivery"}
								</button>
							))}
						</div>

						{type === "dine_in" && (
							<div className="mt-3">
								<label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
									Table Number
								</label>
								<div className="mt-1.5 flex flex-wrap gap-1.5">
									{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
										<button
											key={n}
											type="button"
											onClick={() => setTable(n)}
											className={cn(
												"grid size-9 place-items-center rounded-lg text-xs font-bold transition-all",
												table === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
											)}
										>
											{n}
										</button>
									))}
								</div>
							</div>
						)}

						{(type === "delivery" || type === "takeaway") && (
							<div className="mt-3 space-y-2">
								<Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251 9… customer phone" />
								{type === "delivery" && (
									<Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address" />
								)}
							</div>
						)}

						<div className="mt-3">
							<Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Order notes (optional)" />
						</div>
					</div>

					<div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
						{cart.length === 0 ? (
							<p className="py-8 text-center text-sm text-muted-foreground">Tap any item to add it.</p>
						) : (
							<ul className="space-y-3">
								{cart.map((l) => (
									<li key={l.id} className="flex items-center gap-3">
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-semibold">{l.name}</p>
											<p className="text-xs text-muted-foreground tabular-nums">{formatETB(l.price)} each</p>
										</div>
										<div className="flex items-center gap-1.5 rounded-lg bg-muted p-1">
											<button type="button" onClick={() => dec(l.id)} className="grid size-7 place-items-center rounded-md bg-card text-foreground active:scale-90" aria-label="Decrease">
												<Minus className="size-3.5" strokeWidth={2.5} />
											</button>
											<span className="w-5 text-center text-sm font-bold tabular-nums">{l.qty}</span>
											<button type="button" onClick={() => inc(l.id)} className="grid size-7 place-items-center rounded-md bg-foreground text-background active:scale-90" aria-label="Increase">
												<Plus className="size-3.5" strokeWidth={2.5} />
											</button>
										</div>
										<button type="button" onClick={() => remove(l.id)} className="text-muted-foreground hover:text-destructive" aria-label="Remove">
											<Trash2 className="size-4" />
										</button>
									</li>
								))}
							</ul>
						)}
					</div>

					<div className="border-t bg-muted/40 px-4 sm:px-6 py-3 sm:py-4">
						<div className="mb-4 space-y-1.5">
							<Row label="Subtotal" value={formatETB(subtotal)} />
							<Row label="Service fee" value="—" muted />
							<div className="flex items-baseline justify-between border-t pt-2">
								<span className="text-sm font-bold">Total</span>
								<span className="text-xl font-bold tabular-nums">{formatETB(subtotal)}</span>
							</div>
						</div>
						<Button disabled={cart.length === 0 || placing} className="w-full" size="lg" onClick={placeOrder}>
							{placing ? "Placing…" : "Place Order"}
						</Button>
					</div>
				</aside>
			</div>
		</AppShell>
	);
}

function CatChip({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
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
