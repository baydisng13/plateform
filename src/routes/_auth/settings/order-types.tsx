import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { getRestaurantSettings, saveRestaurantSettings } from "@/lib/server/settings";

type DbSettings = Awaited<ReturnType<typeof getRestaurantSettings>>;

export const Route = createFileRoute("/_auth/settings/order-types")({
	head: () => ({ meta: [{ title: "Order Types — PlateForm" }] }),
	loader: () => getRestaurantSettings(),
	component: OrderTypesPage,
});

const ORDER_TYPES = [
	{ key: "dine_in", label: "Dine-in", description: "Customers eat at the restaurant with a table number." },
	{ key: "takeaway", label: "Takeaway", description: "Customer picks up their order at the counter." },
	{ key: "delivery", label: "Delivery", description: "Staff delivers the order to the customer's address." },
	{ key: "online", label: "Online Orders", description: "Customers place orders via the public order page. Staff confirms by phone." },
] as const;

const DEFAULT_ENABLED = ["dine_in", "takeaway", "delivery", "online"];

function OrderTypesPage() {
	const settings = Route.useLoaderData() as DbSettings;
	const router = useRouter();

	const initialEnabled = settings?.orderTypesEnabled ?? DEFAULT_ENABLED;
	const [enabled, setEnabled] = useState<string[]>(initialEnabled);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	const toggle = (key: string) =>
		setEnabled((arr) =>
			arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key],
		);

	const handleSave = async () => {
		setSaving(true);
		await saveRestaurantSettings({
			data: {
				name: settings?.name ?? "",
				logoUrl: settings?.logoUrl ?? undefined,
				operatingHours: settings?.operatingHours ?? undefined,
				orderTypesEnabled: enabled,
			},
		});
		setSaving(false);
		setSaved(true);
		setTimeout(() => setSaved(false), 2500);
		router.invalidate();
	};

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
								<p className="mt-0.5 text-xs text-muted-foreground">{type.description}</p>
							</div>
							<Switch
								checked={enabled.includes(type.key)}
								onCheckedChange={() => toggle(type.key)}
							/>
						</div>
					))}
				</div>

				<div className="mt-5 flex items-center justify-between">
					<p className="text-xs text-muted-foreground">
						Disabled types won't appear when creating new orders.
					</p>
					<Button onClick={handleSave} disabled={saving} className="gap-2">
						{saved ? <><CheckCircle2 className="size-4" /> Saved</> : saving ? "Saving…" : "Save Changes"}
					</Button>
				</div>
			</div>
		</div>
	);
}
