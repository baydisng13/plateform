import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ShoppingCart, Plus, Minus, X, CheckCircle2 } from "lucide-react";
import {
	menuCategories,
	menuItems,
	formatETB,
	restaurant,
} from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/order")({
	head: () => ({
		meta: [
			{ title: `Order — ${restaurant.name}` },
			{
				name: "description",
				content: "Browse the menu and place your order online.",
			},
		],
	}),
	component: PublicOrderPage,
});

interface CartLine {
	id: string;
	name: string;
	qty: number;
	price: number;
	color: string;
}

type Step = "browse" | "checkout" | "confirmed";

function PublicOrderPage() {
	const [cat, setCat] = useState<string>("all");
	const [cart, setCart] = useState<CartLine[]>([]);
	const [phone, setPhone] = useState("");
	const [step, setStep] = useState<Step>("browse");
	const [cartOpen, setCartOpen] = useState(false);

	const visible = useMemo(
		() => menuItems.filter((m) => cat === "all" || m.categoryId === cat),
		[cat],
	);

	const subtotal = cart.reduce((s, l) => s + l.qty * l.price, 0);
	const itemCount = cart.reduce((s, l) => s + l.qty, 0);

	const add = (m: (typeof menuItems)[number]) =>
		setCart((c) => {
			const existing = c.find((x) => x.id === m.id);
			if (existing)
				return c.map((x) => (x.id === m.id ? { ...x, qty: x.qty + 1 } : x));
			return [
				...c,
				{ id: m.id, name: m.name, qty: 1, price: m.price, color: m.color },
			];
		});

	const dec = (id: string) =>
		setCart((c) =>
			c
				.map((x) => (x.id === id ? { ...x, qty: x.qty - 1 } : x))
				.filter((x) => x.qty > 0),
		);

	const remove = (id: string) => setCart((c) => c.filter((x) => x.id !== id));

	const placeOrder = () => {
		if (!phone) return;
		setStep("confirmed");
		setCartOpen(false);
	};

	if (step === "confirmed") {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background px-4">
				<div className="max-w-sm text-center">
					<div className="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-primary/10">
						<CheckCircle2 className="size-10 text-primary" />
					</div>
					<h1 className="text-2xl font-bold">Order Placed!</h1>
					<p className="mt-3 text-muted-foreground">
						We received your order. Our team will call{" "}
						<span className="font-semibold text-foreground">{phone}</span> shortly
						to confirm.
					</p>
					<p className="mt-2 text-sm text-muted-foreground">
						Estimated wait: 20–35 minutes.
					</p>
					<Button
						className="mt-8 w-full"
						onClick={() => {
							setStep("browse");
							setCart([]);
							setPhone("");
						}}
					>
						Order Again
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-md">
				<div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
					<div className="flex items-center gap-3">
						<div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
							<span className="text-sm font-bold">{restaurant.initial}</span>
						</div>
						<div>
							<p className="text-sm font-bold">{restaurant.name}</p>
							<p className="text-xs text-muted-foreground">
								{restaurant.tagline}
							</p>
						</div>
					</div>

					<Sheet open={cartOpen} onOpenChange={setCartOpen}>
						<SheetTrigger asChild>
							<button
								type="button"
								className="relative flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background"
							>
								<ShoppingCart className="size-4" />
								Cart
								{itemCount > 0 && (
									<span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
										{itemCount}
									</span>
								)}
							</button>
						</SheetTrigger>
						<SheetContent className="flex flex-col">
							<SheetHeader>
								<SheetTitle>Your Cart</SheetTitle>
							</SheetHeader>

							{cart.length === 0 ? (
								<div className="flex flex-1 items-center justify-center">
									<p className="text-sm text-muted-foreground">
										Your cart is empty.
									</p>
								</div>
							) : (
								<>
									<div className="flex-1 overflow-y-auto py-4">
										<ul className="space-y-4">
											{cart.map((l) => (
												<li
													key={l.id}
													className="flex items-center gap-3"
												>
													<div
														className={cn(
															"grid size-10 shrink-0 place-items-center rounded-xl text-lg font-bold",
															l.color,
														)}
													>
														{l.name.charAt(0)}
													</div>
													<div className="min-w-0 flex-1">
														<p className="truncate text-sm font-semibold">
															{l.name}
														</p>
														<p className="text-xs text-muted-foreground">
															{formatETB(l.price)} each
														</p>
													</div>
													<div className="flex items-center gap-1.5 rounded-lg bg-muted p-1">
														<button
															type="button"
															onClick={() => dec(l.id)}
															className="grid size-6 place-items-center rounded-md bg-card text-foreground"
														>
															<Minus className="size-3" strokeWidth={2.5} />
														</button>
														<span className="w-4 text-center text-sm font-bold">
															{l.qty}
														</span>
														<button
															type="button"
															onClick={() => add(menuItems.find((m) => m.id === l.id)!)}
															className="grid size-6 place-items-center rounded-md bg-foreground text-background"
														>
															<Plus className="size-3" strokeWidth={2.5} />
														</button>
													</div>
													<button
														type="button"
														onClick={() => remove(l.id)}
														className="text-muted-foreground hover:text-destructive"
													>
														<X className="size-4" />
													</button>
												</li>
											))}
										</ul>
									</div>

									<div className="border-t pt-4 space-y-4">
										<div className="flex items-baseline justify-between">
											<span className="text-sm font-semibold">Total</span>
											<span className="text-xl font-bold tabular-nums">
												{formatETB(subtotal)}
											</span>
										</div>

										{step === "browse" && (
											<div className="space-y-2">
												<Label htmlFor="pub-phone">Your phone number</Label>
												<Input
													id="pub-phone"
													type="tel"
													value={phone}
													onChange={(e) => setPhone(e.target.value)}
													placeholder="+251 9…"
												/>
											</div>
										)}

										<Button
											className="w-full"
											size="lg"
											onClick={placeOrder}
											disabled={!phone}
										>
											Place Order
										</Button>
										<p className="text-center text-xs text-muted-foreground">
											We'll call you to confirm your order.
										</p>
									</div>
								</>
							)}
						</SheetContent>
					</Sheet>
				</div>
			</header>

			{/* Category filter */}
			<div className="border-b bg-card">
				<div className="mx-auto max-w-4xl overflow-x-auto px-4">
					<div className="flex gap-1 py-3">
						<button
							type="button"
							onClick={() => setCat("all")}
							className={cn(
								"shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
								cat === "all"
									? "bg-foreground text-background"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							All
						</button>
						{menuCategories.map((c) => (
							<button
								key={c.id}
								type="button"
								onClick={() => setCat(c.id)}
								className={cn(
									"shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
									cat === c.id
										? "bg-foreground text-background"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{c.name}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Menu grid */}
			<main className="mx-auto max-w-4xl px-4 py-8">
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
					{visible.map((m) => {
						const inCart = cart.find((c) => c.id === m.id);
						return (
							<article
								key={m.id}
								className={cn(
									"flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all",
									!m.available && "opacity-60",
								)}
							>
								<div
									className={cn(
										"flex aspect-[4/3] items-center justify-center text-4xl font-bold",
										m.color,
									)}
								>
									{m.name.charAt(0)}
								</div>
								<div className="flex flex-1 flex-col p-4">
									<h3 className="text-sm font-semibold">{m.name}</h3>
									<p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
										{m.description}
									</p>
									<div className="mt-3 flex items-center justify-between">
										<span className="text-sm font-bold tabular-nums">
											{formatETB(m.price)}
										</span>
										{m.available ? (
											inCart ? (
												<div className="flex items-center gap-1 rounded-lg bg-muted p-0.5">
													<button
														type="button"
														onClick={() => dec(m.id)}
														className="grid size-6 place-items-center rounded-md bg-card"
													>
														<Minus className="size-3" strokeWidth={2.5} />
													</button>
													<span className="w-4 text-center text-xs font-bold">
														{inCart.qty}
													</span>
													<button
														type="button"
														onClick={() => add(m)}
														className="grid size-6 place-items-center rounded-md bg-foreground text-background"
													>
														<Plus className="size-3" strokeWidth={2.5} />
													</button>
												</div>
											) : (
												<button
													type="button"
													onClick={() => add(m)}
													className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground"
												>
													<Plus className="size-3.5" strokeWidth={2.5} />
												</button>
											)
										) : (
											<span className="text-[10px] font-bold uppercase tracking-wider text-destructive">
												Sold out
											</span>
										)}
									</div>
								</div>
							</article>
						);
					})}
				</div>
			</main>
		</div>
	);
}
