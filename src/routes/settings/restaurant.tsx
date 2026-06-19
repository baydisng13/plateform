import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { restaurant } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/settings/restaurant")({
	head: () => ({ meta: [{ title: "Restaurant Settings — Fresh & Pressed" }] }),
	component: RestaurantSettingsPage,
});

function RestaurantSettingsPage() {
	const [name, setName] = useState(restaurant.name);
	const [tagline, setTagline] = useState(restaurant.tagline);
	const [hours, setHours] = useState("08:00 – 22:00");
	const [phone, setPhone] = useState("+251 911 000 000");
	const [address, setAddress] = useState("Bole Road, Addis Ababa");

	return (
		<div className="mx-auto max-w-2xl p-8">
			<div className="mb-6">
				<h2 className="text-lg font-semibold">Restaurant Info</h2>
				<p className="mt-0.5 text-sm text-muted-foreground">
					Basic details about your restaurant.
				</p>
			</div>

			<div className="rounded-3xl border bg-card p-6 shadow-sm">
				{/* Logo */}
				<div className="mb-6 flex items-center gap-4">
					<div className="grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md">
						<span className="text-2xl font-bold">{restaurant.initial}</span>
					</div>
					<div>
						<p className="text-sm font-semibold">Logo</p>
						<p className="text-xs text-muted-foreground">
							PNG or JPG, at least 256×256px
						</p>
						<Button variant="outline" size="sm" className="mt-2">
							Upload Logo
						</Button>
					</div>
				</div>

				<div className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="rest-name">Restaurant Name</Label>
						<Input
							id="rest-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="rest-tagline">Tagline</Label>
						<Input
							id="rest-tagline"
							value={tagline}
							onChange={(e) => setTagline(e.target.value)}
							placeholder="Short description of your restaurant"
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1.5">
							<Label htmlFor="rest-hours">Operating Hours</Label>
							<Input
								id="rest-hours"
								value={hours}
								onChange={(e) => setHours(e.target.value)}
								placeholder="08:00 – 22:00"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="rest-phone">Phone</Label>
							<Input
								id="rest-phone"
								type="tel"
								value={phone}
								onChange={(e) => setPhone(e.target.value)}
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="rest-address">Address</Label>
						<Input
							id="rest-address"
							value={address}
							onChange={(e) => setAddress(e.target.value)}
						/>
					</div>
				</div>

				<div className="mt-6 flex justify-end">
					<Button>Save Changes</Button>
				</div>
			</div>
		</div>
	);
}
