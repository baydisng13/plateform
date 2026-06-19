import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
	UserPlus,
	Search,
	MoreHorizontal,
	Pencil,
	Trash2,
	Power,
	ShieldCheck,
	Mail,
} from "lucide-react";
import {
	staff as initialStaff,
	type StaffMember,
	type StaffRole,
} from "@/lib/mock-data";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings/staff")({
	head: () => ({ meta: [{ title: "Staff — Fresh & Pressed" }] }),
	component: StaffPage,
});

const roleColor: Record<StaffRole, string> = {
	Owner: "bg-primary/10 text-primary",
	Waiter: "bg-sky-100 text-sky-700",
	Chef: "bg-amber-100 text-amber-700",
};

type DialogMode = "invite" | "edit";

function StaffPage() {
	const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
	const [search, setSearch] = useState("");
	const [dialogMode, setDialogMode] = useState<DialogMode>("invite");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
	const [removeTarget, setRemoveTarget] = useState<StaffMember | null>(null);

	const filtered = staff.filter(
		(s) =>
			s.name.toLowerCase().includes(search.toLowerCase()) ||
			s.email.toLowerCase().includes(search.toLowerCase()),
	);

	const openInvite = () => {
		setDialogMode("invite");
		setEditTarget(null);
		setDialogOpen(true);
	};

	const openEdit = (s: StaffMember) => {
		setDialogMode("edit");
		setEditTarget(s);
		setDialogOpen(true);
	};

	const toggleActive = (id: string) =>
		setStaff((arr) =>
			arr.map((x) => (x.id === id ? { ...x, active: !x.active } : x)),
		);

	const removeStaff = (id: string) =>
		setStaff((arr) => arr.filter((x) => x.id !== id));

	const handleSave = (data: Omit<StaffMember, "id" | "active">) => {
		if (dialogMode === "edit" && editTarget) {
			setStaff((arr) =>
				arr.map((x) => (x.id === editTarget.id ? { ...x, ...data } : x)),
			);
		} else {
			setStaff((arr) => [
				...arr,
				{ ...data, id: `s${Date.now()}`, active: true },
			]);
		}
		setDialogOpen(false);
	};

	const activeCount = staff.filter((s) => s.active).length;

	return (
		<div className="mx-auto max-w-3xl p-8">
			<div className="mb-6 flex items-start justify-between">
				<div>
					<h2 className="text-lg font-semibold">Staff</h2>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{activeCount} active · {staff.length} total
					</p>
				</div>
				<Button onClick={openInvite}>
					<UserPlus className="size-4" />
					Invite Staff
				</Button>
			</div>

			{/* Role stats */}
			<div className="mb-6 grid grid-cols-3 gap-3">
				{(["Owner", "Waiter", "Chef"] as StaffRole[]).map((role) => {
					const active = staff.filter(
						(s) => s.role === role && s.active,
					).length;
					const total = staff.filter((s) => s.role === role).length;
					return (
						<div key={role} className="rounded-2xl border bg-card p-4 shadow-sm">
							<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
								{role}s
							</p>
							<p className="mt-1 text-2xl font-bold">{active}</p>
							{total !== active && (
								<p className="mt-0.5 text-xs text-muted-foreground">
									{total - active} inactive
								</p>
							)}
						</div>
					);
				})}
			</div>

			{/* Table */}
			<div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
				<div className="border-b px-5 py-4">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search by name or email…"
							className="pl-10"
						/>
					</div>
				</div>

				<table className="w-full text-sm">
					<thead>
						<tr className="bg-muted/60 text-left">
							<th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
								Staff Member
							</th>
							<th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
								Role
							</th>
							<th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
								Status
							</th>
							<th className="w-12 px-5 py-3" />
						</tr>
					</thead>
					<tbody>
						{filtered.map((s) => (
							<tr key={s.id} className="group border-t">
								<td className="px-5 py-4">
									<div className="flex items-center gap-3">
										<div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-200 to-emerald-400 text-sm font-bold text-white">
											{s.name.charAt(0)}
										</div>
										<div>
											<p className="font-semibold leading-tight">{s.name}</p>
											<p className="text-xs text-muted-foreground">{s.email}</p>
										</div>
									</div>
								</td>
								<td className="px-5 py-4">
									<span
										className={cn(
											"rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
											roleColor[s.role],
										)}
									>
										{s.role}
									</span>
								</td>
								<td className="px-5 py-4">
									<span
										className={cn(
											"inline-flex items-center gap-1.5 text-xs font-semibold",
											s.active ? "text-primary" : "text-muted-foreground",
										)}
									>
										<span
											className={cn(
												"size-1.5 rounded-full",
												s.active ? "bg-primary" : "bg-muted-foreground",
											)}
										/>
										{s.active ? "Active" : "Inactive"}
									</span>
								</td>
								<td className="px-5 py-4 text-right">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<button
												type="button"
												className="grid size-8 place-items-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
												aria-label="Actions"
											>
												<MoreHorizontal className="size-4" />
											</button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-44">
											<DropdownMenuItem onClick={() => openEdit(s)}>
												<Pencil className="mr-2 size-3.5" />
												Edit Details
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => {
													/* mock: resend invite */
												}}
											>
												<Mail className="mr-2 size-3.5" />
												Resend Invite
											</DropdownMenuItem>
											{s.role !== "Owner" && (
												<>
													<DropdownMenuItem
														onClick={() => toggleActive(s.id)}
													>
														<Power className="mr-2 size-3.5" />
														{s.active ? "Deactivate" : "Activate"}
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														className="text-destructive focus:text-destructive"
														onClick={() => setRemoveTarget(s)}
													>
														<Trash2 className="mr-2 size-3.5" />
														Remove
													</DropdownMenuItem>
												</>
											)}
											{s.role === "Owner" && (
												<DropdownMenuItem disabled>
													<ShieldCheck className="mr-2 size-3.5" />
													Owner (protected)
												</DropdownMenuItem>
											)}
										</DropdownMenuContent>
									</DropdownMenu>
								</td>
							</tr>
						))}
						{filtered.length === 0 && (
							<tr>
								<td
									colSpan={4}
									className="px-5 py-12 text-center text-sm text-muted-foreground"
								>
									No staff found.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{/* Invite / Edit dialog */}
			<StaffDialog
				open={dialogOpen}
				mode={dialogMode}
				staff={editTarget}
				onClose={() => setDialogOpen(false)}
				onSave={handleSave}
			/>

			{/* Remove confirmation */}
			<AlertDialog
				open={!!removeTarget}
				onOpenChange={(v) => !v && setRemoveTarget(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove {removeTarget?.name}?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently remove {removeTarget?.name} from your staff
							list. They will lose access immediately.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-white hover:bg-destructive/90"
							onClick={() => {
								if (removeTarget) removeStaff(removeTarget.id);
								setRemoveTarget(null);
							}}
						>
							Remove
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function StaffDialog({
	open,
	mode,
	staff,
	onClose,
	onSave,
}: {
	open: boolean;
	mode: DialogMode;
	staff: StaffMember | null;
	onClose: () => void;
	onSave: (data: Omit<StaffMember, "id" | "active">) => void;
}) {
	const [name, setName] = useState(staff?.name ?? "");
	const [email, setEmail] = useState(staff?.email ?? "");
	const [role, setRole] = useState<StaffRole>(staff?.role ?? "Waiter");

	const isEdit = mode === "edit";

	const handleOpenChange = (v: boolean) => {
		if (!v) onClose();
		else {
			setName(staff?.name ?? "");
			setEmail(staff?.email ?? "");
			setRole(staff?.role ?? "Waiter");
		}
	};

	const handleSave = () => {
		if (!name || !email) return;
		onSave({ name, email, role });
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? `Edit ${staff?.name}` : "Invite Staff Member"}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 px-8 pb-8 pt-2">
					<div className="space-y-1.5">
						<Label htmlFor="sf-name">Full Name</Label>
						<Input
							id="sf-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Dawit Mulugeta"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="sf-email">Email Address</Label>
						<Input
							id="sf-email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="dawit@freshpressed.et"
						/>
					</div>
					<div className="space-y-1.5">
						<Label>Role</Label>
						<Select
							value={role}
							onValueChange={(v) => setRole(v as StaffRole)}
							disabled={staff?.role === "Owner"}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="Waiter">Waiter</SelectItem>
								<SelectItem value="Chef">Chef</SelectItem>
								{staff?.role === "Owner" && (
									<SelectItem value="Owner">Owner</SelectItem>
								)}
							</SelectContent>
						</Select>
					</div>

					{!isEdit && (
						<p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
							An invitation email will be sent to the provided address.
						</p>
					)}

					<div className="flex gap-2 pt-1">
						<Button variant="outline" onClick={onClose} className="flex-1">
							Cancel
						</Button>
						<Button onClick={handleSave} className="flex-1">
							{isEdit ? "Save Changes" : "Send Invite"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
