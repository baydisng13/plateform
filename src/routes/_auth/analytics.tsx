import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, TrendingDown } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { getDailyStats } from "@/lib/server/orders";
import { formatETB } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_auth/analytics")({
	head: () => ({ meta: [{ title: "Analytics — PlateForm" }] }),
	loader: () => getDailyStats(),
	component: AnalyticsPage,
});

function AnalyticsPage() {
	const stats = Route.useLoaderData();

	return (
		<AppShell>
			<PageHeader title="Analytics" subtitle="Performance overview" />
			<div className="flex-1 overflow-y-auto p-6">
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

				<div className="mt-8 rounded-3xl border bg-card p-8 text-center shadow-sm">
					<p className="text-sm text-muted-foreground">
						Completed orders today: <span className="font-semibold">{stats.completedToday}</span>
					</p>
					<p className="mt-2 text-xs text-muted-foreground">
						Detailed charts and historical analytics coming soon.
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
