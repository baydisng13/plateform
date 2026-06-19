import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, CheckCircle2, ChefHat, Timer, ArrowRight, Flame } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { TypePill } from "@/components/status-pill";
import { useOrders } from "@/lib/orders-store";
import { type ItemKitchenStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/kitchen")({
	head: () => ({ meta: [{ title: "Kitchen — Fresh & Pressed" }] }),
	component: KitchenPage,
});

const ITEM_STATUS_CYCLE: Record<ItemKitchenStatus, ItemKitchenStatus> = {
	waiting: "cooking",
	cooking: "ready",
	ready: "waiting",
};

const itemStatusStyle: Record<ItemKitchenStatus, string> = {
	waiting: "bg-muted text-muted-foreground",
	cooking: "bg-orange-100 text-orange-700 ring-1 ring-orange-300",
	ready: "bg-primary/10 text-primary ring-1 ring-primary/30",
};

const itemStatusIcon: Record<ItemKitchenStatus, string> = {
	waiting: "—",
	cooking: "🔥",
	ready: "✓",
};

function KitchenPage() {
	const { orders, updateOrder, updateItemStatus } = useOrders();
	const [now] = useState(() => new Date());

	const pending = orders.filter((o) => o.status === "pending");
	const inKitchen = orders
		.filter((o) => o.status === "in_kitchen")
		.sort((a, b) => b.elapsedMin - a.elapsedMin);
	const ready = orders.filter((o) => o.status === "ready");

	const avg =
		inKitchen.length === 0
			? 0
			: Math.round(
					inKitchen.reduce((s, t) => s + t.elapsedMin, 0) / inKitchen.length,
				);

	const markReady = (id: string) => updateOrder(id, { status: "ready" });
	const sendToKitchen = (id: string) => updateOrder(id, { status: "in_kitchen" });

	const cycleItem = (orderId: string, menuItemId: string, current: ItemKitchenStatus) =>
		updateItemStatus(orderId, menuItemId, ITEM_STATUS_CYCLE[current]);

	return (
		<AppShell>
			<PageHeader
				title="Kitchen"
				subtitle={`${inKitchen.length} cooking • ${pending.length} queued • avg ${avg}m`}
				right={
					<div className="rounded-xl bg-muted px-4 py-2 font-mono text-sm font-medium text-muted-foreground">
						{now.toLocaleTimeString("en-US", {
							hour: "numeric",
							minute: "2-digit",
						})}
					</div>
				}
			/>

			<div className="flex flex-1 flex-col overflow-hidden">
				{/* Pending queue bar */}
				{pending.length > 0 && (
					<div className="border-b bg-muted/60 px-6 py-3">
						<div className="flex items-center gap-3 overflow-x-auto">
							<span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
								Queue
							</span>
							{pending.map((o) => (
								<button
									key={o.id}
									type="button"
									onClick={() => sendToKitchen(o.id)}
									className="group flex shrink-0 items-center gap-2.5 rounded-xl border bg-card px-3 py-2 text-sm shadow-sm transition-all hover:border-primary hover:shadow-md"
								>
									<span className="font-bold">
										{o.tableNumber
											? `T${o.tableNumber}`
											: o.customerPhone || o.id}
									</span>
									<span className="text-xs text-muted-foreground">
										{o.items.length} item{o.items.length !== 1 ? "s" : ""}
									</span>
									<TypePill type={o.type} />
									<span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-0 transition-opacity group-hover:text-primary group-hover:opacity-100">
										<ArrowRight className="size-3" /> Send
									</span>
								</button>
							))}
						</div>
					</div>
				)}

				<div className="flex flex-1 gap-0 overflow-hidden">
					{/* Active tickets */}
					<div className="flex-1 overflow-y-auto p-6">
						{inKitchen.length === 0 ? (
							<div className="grid h-full place-items-center">
								<div className="text-center">
									<div className="mx-auto mb-4 grid size-16 place-items-center rounded-3xl bg-primary/10">
										<ChefHat className="size-7 text-primary" />
									</div>
									<h3 className="text-base font-semibold">Nothing cooking</h3>
									<p className="mt-1 text-sm text-muted-foreground">
										{pending.length > 0
											? "Send a queued order to the kitchen above."
											: "All caught up!"}
									</p>
								</div>
							</div>
						) : (
							<div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
								{inKitchen.map((t) => {
									const urgent = t.elapsedMin >= 12;
									const warning = t.elapsedMin >= 7 && !urgent;
									const allReady = t.items.every(
										(item) => item.kitchenStatus === "ready",
									);
									const doneCount = t.items.filter(
										(item) => item.kitchenStatus === "ready",
									).length;

									return (
										<article
											key={t.id}
											className={cn(
												"flex flex-col overflow-hidden rounded-3xl shadow-sm",
												urgent
													? "ring-2 ring-orange-400"
													: warning
														? "ring-2 ring-amber-300"
														: "ring-1 ring-border",
											)}
										>
											{/* Header */}
											<header
												className={cn(
													"flex items-center justify-between px-5 py-4",
													urgent
														? "bg-orange-500 text-white"
														: warning
															? "bg-amber-400 text-amber-950"
															: "bg-foreground text-background",
												)}
											>
												<div className="flex items-center gap-3">
													<span className="text-xl font-bold tracking-tight">
														{t.tableNumber
															? `Table ${t.tableNumber}`
															: t.customerPhone || t.id}
													</span>
													{t.waiter && (
														<span className="text-xs font-medium opacity-70">
															{t.waiter}
														</span>
													)}
												</div>
												<div className="flex items-center gap-2">
													<TypePill type={t.type} />
													<span
														className={cn(
															"flex items-center gap-1 font-mono text-sm font-bold tabular-nums",
															urgent
																? "text-white"
																: warning
																	? "text-amber-900"
																	: "text-background",
														)}
													>
														<Timer className="size-3.5" />
														{t.elapsedMin}m
													</span>
												</div>
											</header>

											{/* Progress bar */}
											<div className="h-1 w-full bg-muted">
												<div
													className={cn(
														"h-full transition-all duration-500",
														allReady
															? "bg-primary"
															: urgent
																? "bg-orange-400"
																: "bg-amber-400",
													)}
													style={{
														width: t.items.length
															? `${(doneCount / t.items.length) * 100}%`
															: "0%",
													}}
												/>
											</div>

											{/* Items with per-item status */}
											<div className="flex-1 bg-card px-5 py-4">
												<ul className="space-y-2">
													{t.items.map((item) => {
														const status = item.kitchenStatus ?? "waiting";
														return (
															<li
																key={item.menuItemId}
																className="flex items-center gap-3"
															>
																{/* Qty badge */}
																<span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-sm font-bold tabular-nums">
																	{item.qty}
																</span>

																{/* Name */}
																<span
																	className={cn(
																		"flex-1 text-[15px] font-semibold leading-snug transition-colors",
																		status === "ready" && "text-muted-foreground line-through",
																	)}
																>
																	{item.name}
																</span>

																{/* Status toggle button */}
																<button
																	type="button"
																	onClick={() =>
																		cycleItem(t.id, item.menuItemId, status)
																	}
																	title={`Status: ${status}. Click to advance.`}
																	className={cn(
																		"flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all active:scale-95",
																		itemStatusStyle[status],
																	)}
																>
																	<span>{itemStatusIcon[status]}</span>
																	<span>{status}</span>
																	{status === "cooking" && (
																		<Flame className="size-3" />
																	)}
																</button>
															</li>
														);
													})}
												</ul>

												{t.notes && (
													<div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5">
														<span className="mt-0.5 shrink-0 text-base">📝</span>
														<p className="text-sm font-semibold text-amber-900">
															{t.notes}
														</p>
													</div>
												)}

												{/* Item progress summary */}
												<p className="mt-3 text-[11px] font-semibold text-muted-foreground">
													{doneCount}/{t.items.length} items ready
												</p>
											</div>

											{/* Footer */}
											<footer className="flex items-center justify-between border-t bg-muted/40 px-5 py-3.5">
												<span
													className={cn(
														"flex items-center gap-1.5 text-sm font-semibold",
														urgent
															? "text-orange-600"
															: warning
																? "text-amber-600"
																: "text-muted-foreground",
													)}
												>
													<Clock className="size-4" />
													{urgent
														? "Urgent!"
														: warning
															? "Running long"
															: "On time"}
												</span>
												<button
													type="button"
													onClick={() => markReady(t.id)}
													disabled={!allReady}
													className={cn(
														"flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-md transition-all active:scale-[0.97]",
														allReady
															? "bg-primary text-primary-foreground"
															: "cursor-not-allowed bg-muted text-muted-foreground",
													)}
												>
													<CheckCircle2 className="size-4" />
													{allReady ? "Mark Ready" : `${doneCount}/${t.items.length}`}
												</button>
											</footer>
										</article>
									);
								})}
							</div>
						)}
					</div>

					{/* Ready sidebar */}
					{ready.length > 0 && (
						<aside className="hidden w-56 shrink-0 flex-col border-l bg-card lg:flex">
							<div className="border-b px-4 py-3">
								<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
									Ready to Serve
								</p>
							</div>
							<div className="flex-1 overflow-y-auto p-3">
								<ul className="space-y-2">
									{ready.map((o) => (
										<li
											key={o.id}
											className="flex items-center gap-2.5 rounded-2xl border border-primary/20 bg-primary/[0.04] px-3 py-2.5"
										>
											<CheckCircle2 className="size-4 shrink-0 text-primary" />
											<div className="min-w-0 flex-1">
												<p className="truncate text-sm font-semibold">
													{o.tableNumber
														? `Table ${o.tableNumber}`
														: o.customerPhone || o.id}
												</p>
												<p className="text-xs text-muted-foreground">
													{o.items.length} item
													{o.items.length !== 1 ? "s" : ""}
												</p>
											</div>
										</li>
									))}
								</ul>
							</div>
						</aside>
					)}
				</div>
			</div>
		</AppShell>
	);
}
