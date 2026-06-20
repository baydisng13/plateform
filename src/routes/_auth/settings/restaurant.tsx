import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { getRestaurantSettings, saveRestaurantSettings } from "@/lib/server/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_auth/settings/restaurant")({
	head: () => ({ meta: [{ title: "Restaurant Settings — PlateForm" }] }),
	loader: () => getRestaurantSettings(),
	component: RestaurantSettingsPage,
});

function RestaurantSettingsPage() {
	const settings = Route.useLoaderData();
	const router = useRouter();
	const [name, setName] = useState(settings?.name ?? "");
	const [saving, setSaving] = useState(false);

	const handleSave = async () => {
		setSaving(true);
		await saveRestaurantSettings({ data: { name } });
		setSaving(false);
		router.invalidate();
	};

	return (
		<div className="mx-auto max-w-2xl p-8">
			<div className="mb-6">
				<h2 className="text-lg font-semibold">Restaurant Info</h2>
				<p className="mt-0.5 text-sm text-muted-foreground">Basic details about your restaurant.</p>
			</div>

			<div className="rounded-3xl border bg-card p-6 shadow-sm">
				<div className="mb-6 flex items-center gap-4">
					<div className="grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md">
						<span className="text-2xl font-bold">{name.charAt(0) || "P"}</span>
					</div>
					<div>
						<p className="text-sm font-semibold">Logo</p>
						<p className="text-xs text-muted-foreground">PNG or JPG, at least 256×256px</p>
						<Button variant="outline" size="sm" className="mt-2">Upload Logo</Button>
					</div>
				</div>

				<div className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="rest-name">Restaurant Name</Label>
						<Input id="rest-name" value={name} onChange={(e) => setName(e.target.value)} />
					</div>
				</div>

				<div className="mt-6 flex justify-end">
					<Button onClick={handleSave} disabled={saving}>
						{saving ? "Saving…" : "Save Changes"}
					</Button>
				</div>
			</div>
		</div>
	);
}
