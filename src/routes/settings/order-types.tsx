import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/settings/order-types")({
	head: () => ({ meta: [{ title: "Order Types — Fresh & Pressed" }] }),
	component: OrderTypesPage,
});

const ORDER_TYPES = [
	{
		key: "dine_in" as const,
		label: "Dine-in",
		description: "Customers eat at the restaurant with a table number.",
	},
	{
		key: "takeaway" as const,
		label: "Takeaway",
		description: "Customer picks up their order at the counter.",
	},
	{
		key: "delivery" as const,
		label: "Delivery",
		description: "Staff delivers the order to the customer's address.",
	},
	{
		key: "online" as const,
		label: "Online Orders",
		description:
			"Customers place orders via the public order page. Staff confirms by phone.",
	},
] as const;

function OrderTypesPage() {
	const [enabled, setEnabled] = useState({
		dine_in: true,
		takeaway: true,
		delivery: true,
		online: true,
	});

	const toggle = (key: keyof typeof enabled) =>
		setEnabled((s) => ({ ...s, [key]: !s[key] }));

	return (
		<div className="mx-auto max-w-2xl p-8">
			<div className="mb-6">
				<h2 className="text-lg font-semibold">Order Types</h2>
				<p className="mt-0.5 text-sm text-muted-foreground">
					Enable or disable the order types available in your restaurant.
				</p>
			</div>

			<div className="rounded-3xl border bg-card p-6 shadow-sm">
				<div className="space-y-2">
					{ORDER_TYPES.map((type) => (
						<div
							key={type.key}
							className="flex items-center justify-between rounded-xl border bg-muted/30 px-5 py-4"
						>
							<div>
								<p className="text-sm font-semibold">{type.label}</p>
								<p className="mt-0.5 text-xs text-muted-foreground">
									{type.description}
								</p>
							</div>
							<Switch
								checked={enabled[type.key]}
								onCheckedChange={() => toggle(type.key)}
							/>
						</div>
					))}
				</div>

				<p className="mt-4 rounded-xl bg-muted px-4 py-3 text-xs text-muted-foreground">
					Changes take effect immediately. Disabled types won't appear when
					creating new orders.
				</p>
			</div>
		</div>
	);
}
