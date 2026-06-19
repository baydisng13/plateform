import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { dashboard, formatETB } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analytics")({
	head: () => ({ meta: [{ title: "Analytics — Fresh & Pressed" }] }),
	component: AnalyticsPage,
});

function AnalyticsPage() {
	const [range, setRange] = useState<"today" | "week" | "month">("today");
	const max = Math.max(...dashboard.revenueWeek.map((d) => d.value));
	const orderTotal = dashboard.ordersByType.reduce((s, x) => s + x.value, 0);

	return (
		<AppShell>
			<PageHeader
				title="Analytics"
				subtitle="Performance overview"
				right={
					<div className="flex rounded-xl bg-muted p-1">
						{(["today", "week", "month"] as const).map((r) => (
							<button
								key={r}
								type="button"
								onClick={() => setRange(r)}
								className={cn(
									"rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all",
									range === r
										? "bg-background text-foreground shadow-sm"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{r}
							</button>
						))}
					</div>
				}
			/>
			<div className="flex-1 overflow-y-auto p-6">
				{/* KPI row */}
				<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
					<KPI
						label="Revenue"
						value={formatETB(dashboard.revenueToday)}
						delta="+12%"
						up
					/>
					<KPI
						label="Orders"
						value={String(dashboard.ordersToday)}
						delta="+4"
						up
					/>
					<KPI
						label="Expenses"
						value={formatETB(dashboard.expensesToday)}
						delta="-3%"
						up
					/>
					<KPI
						label="Net Profit"
						value={formatETB(dashboard.netToday)}
						delta="+18%"
						up
						tone="primary"
					/>
				</div>

				<div className="mt-6 grid gap-6 lg:grid-cols-3">
					{/* Revenue bar chart */}
					<section className="col-span-2 rounded-3xl border bg-card p-6 shadow-sm">
						<div className="mb-6 flex items-end justify-between">
							<div>
								<h3 className="text-base font-semibold">Revenue this week</h3>
								<p className="mt-0.5 text-xs text-muted-foreground">
									Daily revenue in ETB
								</p>
							</div>
							<div className="text-right">
								<p className="text-2xl font-bold tabular-nums">
									{formatETB(
										dashboard.revenueWeek.reduce((s, d) => s + d.value, 0),
									)}
								</p>
								<p className="text-[11px] font-semibold text-primary">
									+22% vs last week
								</p>
							</div>
						</div>
						<div className="flex h-48 items-end gap-3">
							{dashboard.revenueWeek.map((d, i) => {
								const h = (d.value / max) * 100;
								const isToday = i === dashboard.revenueWeek.length - 1;
								return (
									<div
										key={d.day}
										className="flex flex-1 flex-col items-center gap-2"
									>
										<div className="flex w-full flex-1 items-end">
											<div
												className={cn(
													"w-full rounded-t-md transition-all",
													isToday ? "bg-primary" : "bg-muted",
												)}
												style={{ height: `${h}%` }}
												title={formatETB(d.value)}
											/>
										</div>
										<span
											className={cn(
												"text-[11px] font-semibold",
												isToday ? "text-foreground" : "text-muted-foreground",
											)}
										>
											{d.day}
										</span>
									</div>
								);
							})}
						</div>
					</section>

					{/* Orders by type */}
					<section className="rounded-3xl border bg-card p-6 shadow-sm">
						<h3 className="mb-1 text-base font-semibold">Orders by type</h3>
						<p className="mb-5 text-xs text-muted-foreground">Today</p>
						<div className="space-y-4">
							{dashboard.ordersByType.map((o) => {
								const pct = (o.value / orderTotal) * 100;
								return (
									<div key={o.type}>
										<div className="mb-1.5 flex justify-between text-xs">
											<span className="font-semibold">{o.type}</span>
											<span className="font-mono tabular-nums">
												{o.value}{" "}
												<span className="text-muted-foreground">
													({Math.round(pct)}%)
												</span>
											</span>
										</div>
										<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
											<div
												className="h-full rounded-full bg-foreground"
												style={{ width: `${pct}%` }}
											/>
										</div>
									</div>
								);
							})}
						</div>
					</section>
				</div>

				<div className="mt-6 grid gap-6 lg:grid-cols-3">
					{/* Top items */}
					<section className="col-span-2 rounded-3xl border bg-card p-6 shadow-sm">
						<h3 className="mb-5 text-base font-semibold">Top selling items</h3>
						<div className="space-y-4">
							{dashboard.topItems.map((it, i) => (
								<div key={it.name} className="flex items-center gap-4">
									<div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-sm font-bold tabular-nums">
										#{i + 1}
									</div>
									<div className="min-w-0 flex-1">
										<div className="mb-1 flex justify-between text-sm">
											<span className="truncate font-semibold">{it.name}</span>
											<span className="font-mono text-muted-foreground tabular-nums">
												{it.sold} sold
											</span>
										</div>
										<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
											<div
												className="h-full rounded-full bg-primary"
												style={{ width: `${it.pct}%` }}
											/>
										</div>
									</div>
								</div>
							))}
						</div>
					</section>

					{/* Net profit card */}
					<section className="rounded-3xl bg-foreground p-6 text-background shadow-sm">
						<p className="text-[11px] font-bold uppercase tracking-widest text-background/60">
							Net Profit Today
						</p>
						<p className="mt-3 text-4xl font-bold tabular-nums">
							{formatETB(dashboard.netToday)}
						</p>
						<p className="mt-2 text-sm text-background/70">
							After {formatETB(dashboard.expensesToday)} in expenses
						</p>
						<div className="mt-6 rounded-2xl bg-background/10 p-4">
							<p className="text-[11px] font-bold uppercase tracking-widest text-background/60">
								Best hour
							</p>
							<p className="mt-1 text-lg font-semibold">12:00 – 13:00</p>
							<p className="text-xs text-background/60">
								2,840 ETB in 11 orders
							</p>
						</div>
					</section>
				</div>
			</div>
		</AppShell>
	);
}

function KPI({
	label,
	value,
	delta,
	up,
	tone = "default",
}: {
	label: string;
	value: string;
	delta: string;
	up: boolean;
	tone?: "default" | "primary";
}) {
	return (
		<div
			className={cn(
				"rounded-2xl border p-5 shadow-sm",
				tone === "primary"
					? "border-primary/20 bg-primary/[0.05]"
					: "border-border bg-card",
			)}
		>
			<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
				{label}
			</p>
			<p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
			<p
				className={cn(
					"mt-1 inline-flex items-center gap-1 text-[11px] font-semibold",
					up ? "text-primary" : "text-destructive",
				)}
			>
				{up ? (
					<TrendingUp className="size-3" />
				) : (
					<TrendingDown className="size-3" />
				)}
				{delta} vs yesterday
			</p>
		</div>
	);
}
