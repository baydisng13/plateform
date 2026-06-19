import { Link, useRouterState } from "@tanstack/react-router";
import {
	LayoutGrid,
	ChefHat,
	Plus,
	UtensilsCrossed,
	Receipt,
	BarChart3,
	Settings,
	Bell,
} from "lucide-react";
import type { ReactNode } from "react";
import { restaurant } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const nav: Array<{
	to: string;
	label: string;
	icon: typeof LayoutGrid;
	badge?: number;
}> = [
	{ to: "/", label: "Orders", icon: LayoutGrid, badge: 3 },
	{ to: "/kitchen", label: "Kitchen", icon: ChefHat, badge: 2 },
	{ to: "/new-order", label: "New Order", icon: Plus },
	{ to: "/menu", label: "Menu", icon: UtensilsCrossed },
	{ to: "/expenses", label: "Expenses", icon: Receipt },
	{ to: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function AppShell({ children }: { children: ReactNode }) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
			<aside className="flex w-24 shrink-0 flex-col items-center border-r bg-card py-6">
				<Link
					to="/"
					className="mb-8 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg"
					aria-label="Fresh & Pressed home"
				>
					<span className="text-xl font-bold">{restaurant.initial}</span>
				</Link>

				<nav className="flex flex-1 flex-col gap-1">
					{nav.map((item) => {
						const Icon = item.icon;
						const active =
							item.to === "/"
								? pathname === "/"
								: pathname.startsWith(item.to);
						return (
							<Link
								key={item.to}
								to={item.to}
								className="group relative flex flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-colors"
							>
								<div
									className={cn(
										"relative grid size-11 place-items-center rounded-xl transition-all",
										active
											? "bg-primary text-primary-foreground shadow-md"
											: "bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground",
									)}
								>
									<Icon className="size-5" strokeWidth={2.2} />
									{item.badge ? (
										<span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-orange-500 text-[9px] font-bold text-white ring-2 ring-card">
											{item.badge}
										</span>
									) : null}
								</div>
								<span
									className={cn(
										"text-[10px] font-semibold tracking-tight",
										active ? "text-foreground" : "text-muted-foreground",
									)}
								>
									{item.label}
								</span>
							</Link>
						);
					})}
				</nav>

				<div className="mt-4 flex flex-col items-center gap-3">
					<Link
						to="/settings"
						className={cn(
							"grid size-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
							pathname === "/settings" && "bg-muted text-foreground",
						)}
						aria-label="Settings"
					>
						<Settings className="size-5" strokeWidth={2} />
					</Link>
					<div
						className="size-10 rounded-full bg-gradient-to-br from-emerald-200 to-emerald-400 ring-2 ring-border ring-offset-2"
						aria-label="Owner avatar"
					/>
				</div>
			</aside>

			<main className="flex flex-1 flex-col overflow-hidden">{children}</main>
		</div>
	);
}

export function PageHeader({
	title,
	subtitle,
	right,
}: {
	title: string;
	subtitle?: string;
	right?: ReactNode;
}) {
	return (
		<header className="flex h-20 shrink-0 items-center justify-between border-b bg-card/80 px-8 backdrop-blur-md">
			<div className="min-w-0">
				<h1 className="truncate text-xl font-semibold tracking-tight">
					{title}
				</h1>
				{subtitle ? (
					<p className="mt-0.5 text-xs font-medium text-muted-foreground">
						{subtitle}
					</p>
				) : null}
			</div>
			<div className="flex items-center gap-3">
				<button
					className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground transition-colors hover:text-foreground active:scale-[0.97]"
					aria-label="Notifications"
					type="button"
				>
					<Bell className="size-5" strokeWidth={2} />
				</button>
				{right}
			</div>
		</header>
	);
}
