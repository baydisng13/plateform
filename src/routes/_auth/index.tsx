import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
	Plus,
	Minus,
	Phone,
	X,
	Clock,
	Search,
	UtensilsCrossed,
	Camera,
	Upload,
	ImageIcon,
	CheckCheck,
	Trash2,
	FileText,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { StatusPill, TypePill } from "@/components/status-pill";
import { formatETB } from "@/lib/utils";
import {
	getActiveOrders,
	updateOrderStatus,
	deleteOrder,
	appendOrderItems,
	confirmPayment,
	getDailyStats,
} from "@/lib/server/orders";
import { getMenuItems, getMenuCategories } from "@/lib/server/menu";
import { MenuPosCard } from "@/components/menu-pos-card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type DbOrder = Awaited<ReturnType<typeof getActiveOrders>>[number];
type DbMenuItem = Awaited<ReturnType<typeof getMenuItems>>[number];
type DbCategory = Awaited<ReturnType<typeof getMenuCategories>>[number];
type DbStats = Awaited<ReturnType<typeof getDailyStats>>;
type OrderStatus = DbOrder["status"];
type PaymentMethod = "cash" | "telebirr" | "cbe" | "boa";

interface CartLine {
	id: string;
	name: string;
	qty: number;
	price: number;
}

export const Route = createFileRoute("/_auth/")({
	head: () => ({
		meta: [
			{ title: "Orders — PlateForm" },
			{ name: "description", content: "Active orders for staff." },
		],
	}),
	loader: async () => {
		const [orders, menuItemsList, categories, stats] = await Promise.all([
			getActiveOrders(),
			getMenuItems(),
			getMenuCategories(),
			getDailyStats(),
		]);
		return { orders, menuItemsList, categories, stats };
	},
	component: OrdersPage,
});

const FILTERS = [
	{ key: "all", label: "All" },
	{ key: "dine_in", label: "Dine-in" },
	{ key: "takeaway", label: "Takeaway" },
	{ key: "delivery", label: "Delivery" },
	{ key: "online", label: "Online" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function OrdersPage() {
	const { orders, menuItemsList, categories, stats } = Route.useLoaderData();
	const router = useRouter();
	const [filter, setFilter] = useState<FilterKey>("all");
	const [payOrder, setPayOrder] = useState<DbOrder | null>(null);
	const [addItemsTarget, setAddItemsTarget] = useState<DbOrder | null>(null);
	const [confirmTarget, setConfirmTarget] = useState<DbOrder | null>(null);
	const [confirmAllOpen, setConfirmAllOpen] = useState(false);

	const visible = useMemo(
		() => orders.filter((o) => o.status !== "completed" && (filter === "all" || o.type === filter)),
		[orders, filter],
	);

	const today = new Date().toLocaleDateString("en-US", {
		weekday: "long",
		month: "short",
		day: "numeric",
	});

	const handleStatusChange = async (orderId: string, status: OrderStatus) => {
		await updateOrderStatus({ data: { id: orderId, status } });
		router.invalidate();
	};

	const handlePayment = async (
		orderId: string,
		method: PaymentMethod,
		amountReceived?: number,
		tip?: number,
	) => {
		await confirmPayment({ data: { orderId, method, amountReceived, tip } });
		setPayOrder(null);
		router.invalidate();
	};

	const awaitingOrders = orders.filter((o) => o.status === "awaiting");

	const handleConfirmOrder = async (orderId: string, deliveryNote: string) => {
		await updateOrderStatus({
			data: { id: orderId, status: "pending", deliveryNote: deliveryNote || undefined },
		});
		setConfirmTarget(null);
		setConfirmAllOpen(false);
		router.invalidate();
	};

	const handleConfirmAll = async (deliveryNote: string) => {
		await Promise.all(
			awaitingOrders.map((o) =>
				updateOrderStatus({
					data: { id: o.id, status: "pending", deliveryNote: deliveryNote || undefined },
				}),
			),
		);
		setConfirmAllOpen(false);
		router.invalidate();
	};

	const handleRejectAll = async () => {
		await Promise.all(awaitingOrders.map((o) => deleteOrder({ data: { id: o.id } })));
		router.invalidate();
	};

	const handleAddItems = async (orderId: string, items: CartLine[]) => {
		await appendOrderItems({
			data: {
				orderId,
				items: items.map((l) => ({ name: l.name, quantity: l.qty, unitPrice: l.price })),
			},
		});
		setAddItemsTarget(null);
		router.invalidate();
	};

	const handleRejectOrder = async (orderId: string) => {
		await deleteOrder({ data: { id: orderId } });
		router.invalidate();
	};

	return (
		<AppShell>
			<PageHeader
				title="Active Orders"
				subtitle={today}
				right={
					<>
						<div className="hidden sm:flex rounded-xl bg-muted p-1">
							{FILTERS.map((f) => (
								<button
									key={f.key}
									type="button"
									onClick={() => setFilter(f.key)}
									className={cn(
										"rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
										filter === f.key
											? "bg-background text-foreground shadow-sm"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									{f.label}
								</button>
							))}
						</div>
						<Button asChild size="sm">
							<Link to="/new-order">
								<Plus className="size-4" strokeWidth={2.5} />
								<span className="hidden sm:inline">New Order</span>
							</Link>
						</Button>
					</>
				}
			/>

			{/* Mobile-only filter strip */}
			<div className="sm:hidden flex gap-2 overflow-x-auto border-b bg-card px-4 py-2 shrink-0">
				{FILTERS.map((f) => (
					<button
						key={f.key}
						type="button"
						onClick={() => setFilter(f.key)}
						className={cn(
							"shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
							filter === f.key
								? "bg-foreground text-background"
								: "bg-muted text-muted-foreground",
						)}
					>
						{f.label}
					</button>
				))}
			</div>

			<div className="flex flex-1 overflow-hidden">
				<div className="flex-1 overflow-y-auto p-4 sm:p-6">
					{awaitingOrders.length > 0 && (
						<div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
							<div className="flex items-center gap-2">
								<span className="size-2 animate-pulse rounded-full bg-orange-500" />
								<p className="text-sm font-semibold text-orange-900">
									{awaitingOrders.length} awaiting confirmation
								</p>
							</div>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={handleRejectAll}
									className="border-destructive/30 text-destructive hover:bg-destructive hover:text-white"
								>
									<Trash2 className="size-3.5" />
									<span className="hidden sm:inline">Reject All</span>
								</Button>
								<Button
									size="sm"
									onClick={() => setConfirmAllOpen(true)}
									className="bg-orange-500 text-white hover:bg-orange-600"
								>
									<CheckCheck className="size-3.5" />
									<span className="hidden sm:inline">Confirm All</span>
								</Button>
							</div>
						</div>
					)}
					{visible.length === 0 ? (
						<EmptyState />
					) : (
						<div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
							{visible.map((o) => (
								<OrderCard
									key={o.id}
									order={o}
									onPay={() => setPayOrder(o)}
									onAddItems={() => setAddItemsTarget(o)}
									onStatusChange={handleStatusChange}
									onReject={() => handleRejectOrder(o.id)}
									onConfirm={() => setConfirmTarget(o)}
								/>
							))}
						</div>
					)}
				</div>
				<RightRail orders={orders} stats={stats} />
			</div>

			{payOrder && (
				<PaymentDialog
					order={payOrder}
					open
					onClose={() => setPayOrder(null)}
					onConfirm={(method, amountReceived, tip) =>
						handlePayment(payOrder.id, method, amountReceived, tip)
					}
				/>
			)}

			{addItemsTarget && (
				<AddItemsSheet
					order={addItemsTarget}
					menuItems={menuItemsList}
					categories={categories}
					onClose={() => setAddItemsTarget(null)}
					onConfirm={(items) => handleAddItems(addItemsTarget.id, items)}
				/>
			)}

			{confirmTarget && (
				<ConfirmOrderDialog
					order={confirmTarget}
					open
					onClose={() => setConfirmTarget(null)}
					onConfirm={(note) => handleConfirmOrder(confirmTarget.id, note)}
				/>
			)}

			<ConfirmAllDialog
				open={confirmAllOpen}
				count={awaitingOrders.length}
				onClose={() => setConfirmAllOpen(false)}
				onConfirm={handleConfirmAll}
			/>
		</AppShell>
	);
}

function OrderCard({
	order,
	onPay,
	onAddItems,
	onStatusChange,
	onReject,
	onConfirm,
}: {
	order: DbOrder;
	onPay: () => void;
	onAddItems: () => void;
	onStatusChange: (id: string, s: OrderStatus) => void;
	onReject: () => void;
	onConfirm: () => void;
}) {
	const total = order.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
	const isAwaiting = order.status === "awaiting";
	const isReady = order.status === "ready";

	return (
		<article
			className={cn(
				"flex flex-col rounded-3xl border p-5 shadow-soft transition-transform",
				isAwaiting
					? "border-orange-200 bg-orange-50/50"
					: isReady
						? "border-primary/20 bg-primary/[0.03]"
						: "border-border bg-card",
			)}
		>
			<div className="mb-4 flex items-center justify-between gap-2">
				<StatusPill status={order.status} />
				<span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
					<Clock className="size-3" />
					{order.elapsedMin}m ago
				</span>
			</div>

			<div className="mb-4 flex items-center gap-3">
				<div
					className={cn(
						"grid size-12 shrink-0 place-items-center rounded-2xl text-sm font-bold",
						isAwaiting
							? "bg-orange-100 text-orange-600"
							: isReady
								? "bg-primary/10 text-primary"
								: "bg-muted text-foreground",
					)}
				>
					{order.type === "dine_in" && order.tableNumber
						? `T${order.tableNumber}`
						: order.type === "online"
							? "ON"
							: order.type === "delivery"
								? "DL"
								: "TK"}
				</div>
				<div className="min-w-0 flex-1">
					<h3 className="truncate text-sm font-semibold">
						{order.tableNumber
							? `Table #${String(order.tableNumber).padStart(2, "0")}`
							: order.customerPhone || order.id}
					</h3>
					<p className="truncate text-xs text-muted-foreground">
						<TypeInline order={order} />
					</p>
				</div>
				<TypePill type={order.type} />
			</div>

			<ul className="mb-4 space-y-1.5">
				{order.items.map((item) => {
					const ks = item.kitchenStatus;
					return (
						<li key={item.id} className="flex items-center justify-between gap-3 text-sm">
							<span
								className={cn(
									"min-w-0 truncate",
									ks === "ready" ? "text-muted-foreground line-through" : "text-foreground/80",
								)}
							>
								<span className="font-mono text-muted-foreground">{item.quantity}×</span>{" "}
								{item.name}
							</span>
							<div className="flex shrink-0 items-center gap-2">
								{ks && (
									<span
										className={cn(
											"rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
											ks === "waiting" && "bg-muted text-muted-foreground",
											ks === "cooking" && "bg-orange-100 text-orange-700",
											ks === "ready" && "bg-primary/10 text-primary",
										)}
									>
										{ks === "cooking" ? "🔥" : ks === "ready" ? "✓" : "—"} {ks}
									</span>
								)}
								<span className="font-medium tabular-nums">
									{formatETB(item.quantity * item.unitPrice)}
								</span>
							</div>
						</li>
					);
				})}
			</ul>

			{order.notes ? (
				<p className="mb-4 rounded-lg bg-muted px-3 py-2 text-[11px] italic text-muted-foreground">
					Note: {order.notes}
				</p>
			) : null}

			<div className="mt-auto flex items-center justify-between border-t pt-4">
				<span className="text-xs font-semibold text-muted-foreground">Total</span>
				<span className="text-sm font-bold tabular-nums">{formatETB(total)}</span>
			</div>

			<div className="mt-4 space-y-2">
				<OrderActions
					order={order}
					onPay={onPay}
					onStatusChange={onStatusChange}
					onReject={onReject}
					onConfirm={onConfirm}
				/>
				{(order.status === "pending" || order.status === "in_kitchen") && (
					<button
						type="button"
						onClick={onAddItems}
						className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
					>
						<Plus className="size-3.5" strokeWidth={2.5} />
						Add Items to Tab
					</button>
				)}
			</div>
		</article>
	);
}

function TypeInline({ order }: { order: DbOrder }) {
	if (order.type === "dine_in") return <>Dine-in</>;
	if (order.type === "delivery") return <>Delivery • {order.address}</>;
	if (order.type === "online") return <>Online • {order.address || "Pickup"}</>;
	return <>Takeaway • {order.customerName || order.customerPhone}</>;
}

function OrderActions({
	order,
	onPay,
	onStatusChange,
	onReject,
	onConfirm,
}: {
	order: DbOrder;
	onPay: () => void;
	onStatusChange: (id: string, s: OrderStatus) => void;
	onReject: () => void;
	onConfirm: () => void;
}) {
	switch (order.status) {
		case "awaiting":
			return (
				<div className="flex gap-2">
					<button
						type="button"
						onClick={onConfirm}
						className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold text-white shadow-md shadow-orange-200 active:scale-[0.98]"
					>
						<Phone className="size-4" /> Confirm
					</button>
					<button
						type="button"
						onClick={onReject}
						className="grid place-items-center rounded-xl border bg-card px-3 text-muted-foreground transition-colors hover:text-destructive"
						aria-label="Reject order"
					>
						<X className="size-4" />
					</button>
				</div>
			);
		case "pending":
			return (
				<button
					type="button"
					onClick={() => onStatusChange(order.id, "in_kitchen")}
					className="w-full rounded-xl bg-foreground py-3 text-sm font-semibold text-background active:scale-[0.98]"
				>
					Send to Kitchen
				</button>
			);
		case "in_kitchen": {
			const doneCount = order.items.filter((i) => i.kitchenStatus === "ready").length;
			const total = order.items.length;
			const allReady = doneCount === total;
			return (
				<div className={cn("flex items-center justify-between rounded-xl px-4 py-3", allReady ? "bg-primary/10" : "bg-muted")}>
					<span className={cn("text-xs font-semibold", allReady ? "text-primary" : "text-muted-foreground")}>
						{allReady ? "All items ready!" : `Preparing… ${doneCount}/${total} done`}
					</span>
					<div className="flex -space-x-1.5">
						<div className="size-6 rounded-full bg-primary ring-2 ring-card" />
						<div className="size-6 rounded-full bg-orange-400 ring-2 ring-card" />
					</div>
				</div>
			);
		}
		case "ready":
			return (
				<button
					type="button"
					onClick={onPay}
					className="w-full rounded-xl border-2 border-primary bg-card py-3 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground active:scale-[0.98]"
				>
					Confirm Payment
				</button>
			);
		default:
			return null;
	}
}

function AddItemsSheet({
	order,
	menuItems,
	categories,
	onClose,
	onConfirm,
}: {
	order: DbOrder;
	menuItems: DbMenuItem[];
	categories: DbCategory[];
	onClose: () => void;
	onConfirm: (items: CartLine[]) => void;
}) {
	const [cat, setCat] = useState("all");
	const [query, setQuery] = useState("");
	const [newItems, setNewItems] = useState<CartLine[]>([]);

	const visible = useMemo(
		() =>
			menuItems.filter(
				(m) =>
					m.available &&
					(cat === "all" || m.categoryId === cat) &&
					(query.length === 0 || m.name.toLowerCase().includes(query.toLowerCase())),
			),
		[menuItems, cat, query],
	);

	const add = (m: DbMenuItem) =>
		setNewItems((c) => {
			const ex = c.find((x) => x.id === m.id);
			if (ex) return c.map((x) => (x.id === m.id ? { ...x, qty: x.qty + 1 } : x));
			return [...c, { id: m.id, name: m.name, qty: 1, price: m.price }];
		});

	const dec = (id: string) =>
		setNewItems((c) => c.map((x) => (x.id === id ? { ...x, qty: x.qty - 1 } : x)).filter((x) => x.qty > 0));

	const inc = (id: string) =>
		setNewItems((c) => c.map((x) => (x.id === id ? { ...x, qty: x.qty + 1 } : x)));

	const orderLabel = order.tableNumber
		? `Table #${String(order.tableNumber).padStart(2, "0")}`
		: order.customerPhone || order.id;

	const subtotal = newItems.reduce((s, l) => s + l.qty * l.price, 0);

	return (
		<Sheet open onOpenChange={(v) => !v && onClose()}>
			<SheetContent side="right" className="flex w-full max-w-3xl flex-col p-0 sm:max-w-3xl">
				<SheetHeader className="border-b px-6 py-4">
					<SheetTitle className="flex items-center gap-2">
						<UtensilsCrossed className="size-4 text-primary" />
						Add to {orderLabel}
						<span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
							{order.items.length} item{order.items.length !== 1 ? "s" : ""} already on tab
						</span>
					</SheetTitle>
				</SheetHeader>

				<div className="flex flex-1 overflow-hidden">
					<section className="flex flex-1 flex-col overflow-hidden">
						<div className="border-b px-4 py-3">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder="Search menu…"
									className="pl-10"
								/>
							</div>
						</div>
						<div className="flex gap-2 overflow-x-auto border-b px-4 py-3">
							<CatChip active={cat === "all"} onClick={() => setCat("all")}>All</CatChip>
							{categories.map((c) => (
								<CatChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
									{c.name}
								</CatChip>
							))}
						</div>
						<div className="grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto p-4 md:grid-cols-3">
							{visible.map((m) => {
								const cartQty = newItems.find((x) => x.id === m.id)?.qty;
								return (
									<MenuPosCard
										key={m.id}
										name={m.name}
										color={m.color}
										price={m.price}
										cartQty={cartQty}
										onClick={() => add(m)}
									/>
								);
							})}
						</div>
					</section>

					<aside className="flex w-64 shrink-0 flex-col border-l bg-card">
						<div className="border-b px-4 py-3">
							<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Adding to Tab</p>
						</div>
						<div className="border-b bg-muted/40 px-4 py-3">
							<p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Already on tab</p>
							<ul className="space-y-1">
								{order.items.map((item) => (
									<li key={item.id} className="flex justify-between text-xs text-muted-foreground">
										<span className="truncate">{item.quantity}× {item.name}</span>
										<span className="tabular-nums">{formatETB(item.quantity * item.unitPrice)}</span>
									</li>
								))}
							</ul>
						</div>
						<div className="flex-1 overflow-y-auto px-4 py-3">
							{newItems.length === 0 ? (
								<p className="py-6 text-center text-xs text-muted-foreground">Tap any item to add it.</p>
							) : (
								<ul className="space-y-2">
									{newItems.map((l) => (
										<li key={l.id} className="flex items-center gap-2">
											<div className="min-w-0 flex-1">
												<p className="truncate text-xs font-semibold">{l.name}</p>
												<p className="text-[10px] text-muted-foreground tabular-nums">{formatETB(l.price)}</p>
											</div>
											<div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
												<button type="button" onClick={() => dec(l.id)} className="grid size-6 place-items-center rounded-md bg-card text-foreground active:scale-90">
													<Minus className="size-3" strokeWidth={2.5} />
												</button>
												<span className="w-4 text-center text-xs font-bold tabular-nums">{l.qty}</span>
												<button type="button" onClick={() => inc(l.id)} className="grid size-6 place-items-center rounded-md bg-foreground text-background active:scale-90">
													<Plus className="size-3" strokeWidth={2.5} />
												</button>
											</div>
										</li>
									))}
								</ul>
							)}
						</div>
						<div className="border-t bg-muted/40 px-4 py-4">
							{newItems.length > 0 && (
								<div className="mb-3 flex justify-between text-sm">
									<span className="font-semibold">New items</span>
									<span className="font-bold tabular-nums">{formatETB(subtotal)}</span>
								</div>
							)}
							<Button className="w-full" disabled={newItems.length === 0} onClick={() => onConfirm(newItems)}>
								Add {newItems.length > 0 ? `${newItems.reduce((s, l) => s + l.qty, 0)} items` : "Items"} to Tab
							</Button>
						</div>
					</aside>
				</div>
			</SheetContent>
		</Sheet>
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

function PaymentDialog({
	order,
	open,
	onClose,
	onConfirm,
}: {
	order: DbOrder;
	open: boolean;
	onClose: () => void;
	onConfirm: (method: PaymentMethod, amountReceived?: number, tip?: number) => void;
}) {
	const [method, setMethod] = useState<PaymentMethod>("cash");
	const [photoPreview, setPhotoPreview] = useState<string | null>(null);
	const [amountReceived, setAmountReceived] = useState("");

	const total = order.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
	const received = parseFloat(amountReceived) || 0;
	const tip = received > total ? received - total : 0;
	const change = received > 0 && received < total ? total - received : 0;

	const methods: Array<{ key: PaymentMethod; label: string }> = [
		{ key: "cash", label: "Cash" },
		{ key: "telebirr", label: "Telebirr" },
		{ key: "cbe", label: "CBE" },
		{ key: "boa", label: "BOA" },
	];

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setPhotoPreview(URL.createObjectURL(file));
	};

	const isCash = method === "cash";
	const canConfirm = isCash || !!photoPreview;

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Confirm Payment</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 px-8 pb-8 pt-2">
					<div className="rounded-xl bg-muted p-4">
						<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order Total</p>
						<p className="mt-1 text-2xl font-bold tabular-nums">{formatETB(total)}</p>
						<ul className="mt-3 space-y-1 border-t pt-3">
							{order.items.map((item) => (
								<li key={item.id} className="flex justify-between text-xs text-muted-foreground">
									<span>{item.quantity}× {item.name}</span>
									<span className="tabular-nums">{formatETB(item.quantity * item.unitPrice)}</span>
								</li>
							))}
						</ul>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="amount-received">Amount Received (ETB)</Label>
						<Input
							id="amount-received"
							type="number"
							min={0}
							value={amountReceived}
							onChange={(e) => setAmountReceived(e.target.value)}
							placeholder={String(total)}
						/>
						{received > 0 && (
							<div className="grid grid-cols-2 gap-2 pt-1">
								{tip > 0 && (
									<div className="rounded-xl bg-primary/10 px-3 py-2 text-center">
										<p className="text-[10px] font-bold uppercase tracking-wider text-primary">Tip</p>
										<p className="mt-0.5 text-base font-bold tabular-nums text-primary">+{formatETB(tip)}</p>
									</div>
								)}
								{change > 0 && (
									<div className="rounded-xl bg-amber-50 px-3 py-2 text-center">
										<p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Change</p>
										<p className="mt-0.5 text-base font-bold tabular-nums text-amber-700">{formatETB(change)}</p>
									</div>
								)}
								{received >= total && tip === 0 && (
									<div className="col-span-2 rounded-xl bg-muted px-3 py-2 text-center">
										<p className="text-xs font-semibold text-muted-foreground">Exact amount — no change</p>
									</div>
								)}
							</div>
						)}
					</div>

					<div className="space-y-2">
						<Label>Payment</Label>
						<div className="grid grid-cols-4 gap-2">
							{methods.map((m) => (
								<button
									key={m.key}
									type="button"
									onClick={() => setMethod(m.key)}
									className={cn(
										"rounded-xl py-2.5 text-xs font-semibold transition-all",
										method === m.key ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground",
									)}
								>
									{m.label}
								</button>
							))}
						</div>
					</div>

					{!isCash && (
						<div className="space-y-3">
							<Label>Payment Proof</Label>
							{photoPreview ? (
								<div className="relative overflow-hidden rounded-xl border">
									<img src={photoPreview} alt="Payment proof" className="w-full object-cover" style={{ maxHeight: 180 }} />
									<button
										type="button"
										onClick={() => setPhotoPreview(null)}
										className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur-sm"
									>
										<X className="size-4" />
									</button>
									<div className="absolute bottom-2 right-2 flex gap-1.5">
										<label className="flex cursor-pointer items-center gap-1 rounded-lg bg-background/80 px-2.5 py-1.5 text-xs font-semibold backdrop-blur-sm">
											<input type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleFileChange} />
											<Camera className="size-3" /> Retake
										</label>
										<label className="flex cursor-pointer items-center gap-1 rounded-lg bg-background/80 px-2.5 py-1.5 text-xs font-semibold backdrop-blur-sm">
											<input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
											<Upload className="size-3" /> Replace
										</label>
									</div>
								</div>
							) : (
								<div className="grid grid-cols-2 gap-2">
									<label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 py-6 text-sm font-semibold text-muted-foreground transition-all hover:border-primary hover:text-primary">
										<input type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleFileChange} />
										<Camera className="size-6" />
										Take Photo
									</label>
									<label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 py-6 text-sm font-semibold text-muted-foreground transition-all hover:border-primary hover:text-primary">
										<input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
										<ImageIcon className="size-6" />
										Upload
									</label>
								</div>
							)}
						</div>
					)}

					<div className="flex gap-2 pt-1">
						<Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
						<Button
							disabled={!canConfirm}
							onClick={() => onConfirm(method, received > 0 ? received : undefined, tip > 0 ? tip : undefined)}
							className="flex-1"
						>
							Confirm Payment
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function ConfirmOrderDialog({
	order,
	open,
	onClose,
	onConfirm,
}: {
	order: DbOrder;
	open: boolean;
	onClose: () => void;
	onConfirm: (note: string) => void;
}) {
	const [note, setNote] = useState("");

	const handleOpenChange = (v: boolean) => {
		if (!v) { onClose(); setNote(""); }
	};

	const label = order.tableNumber
		? `Table #${String(order.tableNumber).padStart(2, "0")}`
		: order.customerPhone || order.id;

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Phone className="size-4 text-orange-500" />
						Confirm Order
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 px-6 pb-6 pt-2">
					<div className="flex items-center gap-3 rounded-xl border bg-muted/40 px-4 py-3">
						<div className="grid size-9 shrink-0 place-items-center rounded-xl bg-orange-100 text-sm font-bold text-orange-600">
							{order.type === "dine_in" && order.tableNumber ? `T${order.tableNumber}` : "OR"}
						</div>
						<div className="min-w-0">
							<p className="truncate text-sm font-semibold">{label}</p>
							<p className="text-xs text-muted-foreground">
								{order.items.length} item{order.items.length !== 1 ? "s" : ""} · {formatETB(order.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0))}
							</p>
						</div>
					</div>
					<div className="space-y-1.5">
						<Label className="flex items-center gap-1.5">
							<FileText className="size-3.5 text-muted-foreground" />
							Delivery Note
							<span className="text-[10px] font-normal text-muted-foreground">(optional)</span>
						</Label>
						<Textarea
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder="e.g. No onions, extra sauce, call on arrival…"
							className="resize-none"
							rows={3}
						/>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
						<Button onClick={() => { onConfirm(note); setNote(""); }} className="flex-1 bg-orange-500 text-white hover:bg-orange-600">
							Confirm Order
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function ConfirmAllDialog({
	open,
	count,
	onClose,
	onConfirm,
}: {
	open: boolean;
	count: number;
	onClose: () => void;
	onConfirm: (note: string) => void;
}) {
	const [note, setNote] = useState("");

	const handleOpenChange = (v: boolean) => {
		if (!v) { onClose(); setNote(""); }
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<CheckCheck className="size-4 text-orange-500" />
						Confirm All Awaiting
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 px-6 pb-6 pt-2">
					<div className="rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-900">
						This will confirm <strong>{count} order{count !== 1 ? "s" : ""}</strong> and move them to the pending queue.
					</div>
					<div className="space-y-1.5">
						<Label className="flex items-center gap-1.5">
							<FileText className="size-3.5 text-muted-foreground" />
							Delivery Note
							<span className="text-[10px] font-normal text-muted-foreground">(applied to all)</span>
						</Label>
						<Textarea
							value={note}
							onChange={(e) => setNote(e.target.value)}
							placeholder="e.g. No onions, extra sauce…"
							className="resize-none"
							rows={2}
						/>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
						<Button onClick={() => { onConfirm(note); setNote(""); }} className="flex-1 bg-orange-500 text-white hover:bg-orange-600">
							Confirm All
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function EmptyState() {
	return (
		<div className="grid h-full place-items-center">
			<div className="text-center">
				<div className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl bg-muted">
					<Plus className="size-7 text-muted-foreground" />
				</div>
				<h3 className="text-base font-semibold">No active orders</h3>
				<p className="mt-1 text-sm text-muted-foreground">New orders will appear here in real time.</p>
			</div>
		</div>
	);
}

function RightRail({ orders, stats }: { orders: DbOrder[]; stats: DbStats }) {
	const grouped: Record<OrderStatus, number> = {
		awaiting: 0,
		pending: 0,
		in_kitchen: 0,
		ready: 0,
		completed: 0,
	};
	orders.forEach((o) => (grouped[o.status] += 1));

	return (
		<aside className="hidden w-72 shrink-0 flex-col border-l bg-card lg:flex">
			<div className="overflow-y-auto p-6">
				<p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
					Today's Performance
				</p>
				<div className="grid grid-cols-2 gap-3">
					<Stat label="Sales" value={formatETB(stats.revenueToday)} sub={`${stats.ordersToday} orders`} />
					<Stat label="Net Profit" value={formatETB(stats.netToday)} sub="After expenses" />
				</div>

				<p className="mb-3 mt-8 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
					By Status
				</p>
				<div className="space-y-2">
					{(["awaiting", "pending", "in_kitchen", "ready", "completed"] as OrderStatus[]).map((s) => (
						<div key={s} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2.5">
							<StatusPill status={s} />
							<span className="font-mono text-sm font-semibold tabular-nums">{grouped[s]}</span>
						</div>
					))}
				</div>
			</div>
		</aside>
	);
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
	return (
		<div className="rounded-2xl bg-muted p-4">
			<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
			<p className="mt-1 text-sm font-bold tabular-nums leading-tight">{value}</p>
			<p className="mt-0.5 text-[10px] font-medium text-primary">{sub}</p>
		</div>
	);
}
