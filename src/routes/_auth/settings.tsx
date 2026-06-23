import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { Store, ToggleLeft, MessageSquare, Users, UtensilsCrossed, LayoutGrid, Receipt, Tag } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_auth/settings")({
	beforeLoad: ({ location }) => {
		if (location.pathname === "/settings" || location.pathname === "/settings/") {
			throw redirect({ to: "/settings/restaurant" });
		}
	},
	component: SettingsLayout,
});

const settingsNav = [
	{ to: "/settings/restaurant", label: "Restaurant", icon: Store },
	{ to: "/settings/order-types", label: "Order Types", icon: ToggleLeft },
	{ to: "/settings/telegram", label: "Telegram", icon: MessageSquare },
	{ to: "/settings/staff", label: "Staff", icon: Users },
	{ to: "/settings/categories", label: "Menu Categories", icon: UtensilsCrossed },
	{ to: "/settings/tables", label: "Tables", icon: LayoutGrid },
	{ to: "/settings/expense-categories", label: "Expense Categories", icon: Receipt },
	{ to: "/settings/menu-tags", label: "Menu Tags", icon: Tag },
] as const;

function SettingsLayout() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<AppShell>
			<PageHeader title="Settings" subtitle="Restaurant, staff and integrations" />

			{/* Mobile: horizontal pill strip */}
			<div className="md:hidden flex gap-2 overflow-x-auto border-b bg-card px-4 py-2 shrink-0">
				{settingsNav.map((item) => {
					const Icon = item.icon;
					const active = pathname.startsWith(item.to);
					return (
						<Link
							key={item.to}
							to={item.to}
							className={cn(
								"flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
								active
									? "bg-foreground text-background"
									: "bg-muted text-muted-foreground hover:text-foreground",
							)}
						>
							<Icon className="size-3.5" strokeWidth={2} />
							{item.label}
						</Link>
					);
				})}
			</div>

			<div className="flex flex-1 overflow-hidden">
				{/* Desktop: sidebar */}
				<aside className="hidden md:block w-56 shrink-0 border-r bg-card p-4">
					<p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
						Settings
					</p>
					<nav className="space-y-0.5">
						{settingsNav.map((item) => {
							const Icon = item.icon;
							const active = pathname.startsWith(item.to);
							return (
								<Link
									key={item.to}
									to={item.to}
									className={cn(
										"flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
										active
											? "bg-muted text-foreground"
											: "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
									)}
								>
									<Icon className="size-4 shrink-0" strokeWidth={2} />
									{item.label}
								</Link>
							);
						})}
					</nav>
				</aside>

				<div className="flex-1 overflow-y-auto">
					<Outlet />
				</div>
			</div>
		</AppShell>
	);
}
