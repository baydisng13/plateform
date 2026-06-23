import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, TrendingDown } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { getDailyStats, getWeeklyStats } from "@/lib/server/orders";
import { formatETB } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_auth/analytics")({
	head: () => ({ meta: [{ title: "Analytics — PlateForm" }] }),
	loader: async () => {
		const [daily, weekly] = await Promise.all([getDailyStats(), getWeeklyStats()]);
		return { daily, weekly };
	},
	component: AnalyticsPage,
});

function AnalyticsPage() {
	const { daily: stats, weekly } = Route.useLoaderData();
	const maxRevenue = Math.max(...weekly.map((d) => d.revenue), 1);
	const maxExpenses = Math.max(...weekly.map((d) => d.expensesTotal), 1);
	const maxBar = Math.max(maxRevenue, maxExpenses);

	return (
		<AppShell>
			<PageHeader title="Analytics" subtitle="Performance overview" />
			<div className="flex-1 overflow-y-auto p-4 sm:p-6">
				<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
					<KPI label="Revenue" value={formatETB(stats.revenueToday)} delta="today" up />
					<KPI label="Orders" value={String(stats.ordersToday)} delta="today" up />
					<KPI label="Expenses" value={formatETB(stats.expensesToday)} delta="today" up={false} />
					<KPI
						label="Net Profit"
						value={formatETB(stats.netToday)}
						delta="today"
						up={stats.netToday >= 0}
						tone="primary"
					/>
				</div>

				{/* 7-day chart */}
				<div className="mt-6 rounded-3xl border bg-card p-6 shadow-sm">
					<div className="mb-5 flex items-center justify-between">
						<h2 className="text-sm font-semibold">Last 7 Days</h2>
						<div className="flex items-center gap-4 text-[11px] font-semibold text-muted-foreground">
							<span className="flex items-center gap-1.5">
								<span className="inline-block size-2.5 rounded-sm bg-primary" /> Revenue
							</span>
							<span className="flex items-center gap-1.5">
								<span className="inline-block size-2.5 rounded-sm bg-destructive/60" /> Expenses
							</span>
						</div>
					</div>
					<div className="flex h-40 items-end gap-2">
						{weekly.map((day) => {
							const revPct = maxBar === 0 ? 0 : (day.revenue / maxBar) * 100;
							const expPct = maxBar === 0 ? 0 : (day.expensesTotal / maxBar) * 100;
							return (
								<div key={day.date} className="group flex flex-1 flex-col items-center gap-1">
									<div className="relative flex w-full flex-1 items-end gap-0.5 rounded-t-sm">
										<div
											className="flex-1 rounded-t-sm bg-primary transition-all"
											style={{ height: `${revPct}%` }}
											title={`Revenue: ${formatETB(day.revenue)}`}
										/>
										<div
											className="flex-1 rounded-t-sm bg-destructive/60 transition-all"
											style={{ height: `${expPct}%` }}
											title={`Expenses: ${formatETB(day.expensesTotal)}`}
										/>
									</div>
									<span className="text-[9px] font-medium text-muted-foreground leading-tight text-center">
										{day.date.split(",")[0]}
									</span>
								</div>
							);
						})}
					</div>
				</div>

				{/* Orders summary row */}
				<div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
					{weekly.map((day) => (
						<div key={day.date} className="rounded-2xl border bg-card p-4">
							<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
								{day.date.split(",")[0]}
							</p>
							<p className="mt-1.5 text-lg font-bold tabular-nums">{day.ordersCount}</p>
							<p className="text-[10px] text-muted-foreground">orders</p>
						</div>
					))}
				</div>

				<div className="mt-4 rounded-2xl border bg-card p-5 text-center">
					<p className="text-sm text-muted-foreground">
						Completed today: <span className="font-semibold">{stats.completedToday}</span>
					</p>
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
				{up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
				{delta}
			</p>
		</div>
	);
}
