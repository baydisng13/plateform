import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
	UserPlus,
	Search,
	MoreHorizontal,
	Pencil,
	Trash2,
	ShieldCheck,
} from "lucide-react";
import { getStaff, inviteStaff, updateStaffRole, deactivateStaff } from "@/lib/server/staff";
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

type DbStaff = Awaited<ReturnType<typeof getStaff>>[number];
type StaffRole = "owner" | "waiter" | "chef";

export const Route = createFileRoute("/_auth/settings/staff")({
	head: () => ({ meta: [{ title: "Staff — PlateForm" }] }),
	loader: () => getStaff(),
	component: StaffPage,
});

const roleColor: Record<StaffRole, string> = {
	owner: "bg-primary/10 text-primary",
	waiter: "bg-sky-100 text-sky-700",
	chef: "bg-amber-100 text-amber-700",
};

function StaffPage() {
	const staff = Route.useLoaderData();
	const router = useRouter();
	const [search, setSearch] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<DbStaff | null>(null);
	const [removeTarget, setRemoveTarget] = useState<DbStaff | null>(null);

	const filtered = staff.filter(
		(s) =>
			s.name.toLowerCase().includes(search.toLowerCase()) ||
			s.email.toLowerCase().includes(search.toLowerCase()),
	);

	const openInvite = () => { setEditTarget(null); setDialogOpen(true); };
	const openEdit = (s: DbStaff) => { setEditTarget(s); setDialogOpen(true); };

	const handleRemove = async () => {
		if (!removeTarget) return;
		await deactivateStaff({ data: { id: removeTarget.id } });
		setRemoveTarget(null);
		router.invalidate();
	};

	const handleSave = async (data: { name: string; email: string; role: StaffRole }) => {
		if (editTarget) {
			await updateStaffRole({ data: { id: editTarget.id, role: data.role } });
		} else {
			await inviteStaff({ data: data });
		}
		setDialogOpen(false);
		router.invalidate();
	};

	return (
		<div className="mx-auto max-w-3xl p-8">
			<div className="mb-6 flex items-start justify-between">
				<div>
					<h2 className="text-lg font-semibold">Staff</h2>
					<p className="mt-0.5 text-sm text-muted-foreground">{staff.length} members</p>
				</div>
				<Button onClick={openInvite}>
					<UserPlus className="size-4" />
					Invite Staff
				</Button>
			</div>

			<div className="mb-6 grid grid-cols-3 gap-3">
				{(["owner", "waiter", "chef"] as StaffRole[]).map((role) => {
					const count = staff.filter((s) => s.role === role).length;
					return (
						<div key={role} className="rounded-2xl border bg-card p-4 shadow-sm">
							<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{role}s</p>
							<p className="mt-1 text-2xl font-bold">{count}</p>
						</div>
					);
				})}
			</div>

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
							<th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Staff Member</th>
							<th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Role</th>
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
									<span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", roleColor[s.role])}>
										{s.role}
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
												Edit Role
											</DropdownMenuItem>
											{s.role !== "owner" && (
												<>
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
											{s.role === "owner" && (
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
								<td colSpan={3} className="px-5 py-12 text-center text-sm text-muted-foreground">
									No staff found.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			<StaffDialog
				open={dialogOpen}
				staff={editTarget}
				onClose={() => setDialogOpen(false)}
				onSave={handleSave}
			/>

			<AlertDialog open={!!removeTarget} onOpenChange={(v) => !v && setRemoveTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove {removeTarget?.name}?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently remove {removeTarget?.name} from your team. They will lose access immediately.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={handleRemove}>
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
	staff,
	onClose,
	onSave,
}: {
	open: boolean;
	staff: DbStaff | null;
	onClose: () => void;
	onSave: (data: { name: string; email: string; role: StaffRole }) => Promise<void>;
}) {
	const [name, setName] = useState(staff?.name ?? "");
	const [email, setEmail] = useState(staff?.email ?? "");
	const [role, setRole] = useState<StaffRole>(staff?.role ?? "waiter");
	const [saving, setSaving] = useState(false);

	const isEdit = !!staff;

	const handleOpenChange = (v: boolean) => {
		if (!v) onClose();
		else {
			setName(staff?.name ?? "");
			setEmail(staff?.email ?? "");
			setRole(staff?.role ?? "waiter");
		}
	};

	const handleSave = async () => {
		if (!name || !email) return;
		setSaving(true);
		await onSave({ name, email, role });
		setSaving(false);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{isEdit ? `Edit ${staff?.name}` : "Invite Staff Member"}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 px-8 pb-8 pt-2">
					{!isEdit && (
						<>
							<div className="space-y-1.5">
								<Label htmlFor="sf-name">Full Name</Label>
								<Input id="sf-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dawit Mulugeta" />
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="sf-email">Email Address</Label>
								<Input id="sf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dawit@restaurant.et" />
							</div>
						</>
					)}
					<div className="space-y-1.5">
						<Label>Role</Label>
						<Select value={role} onValueChange={(v) => setRole(v as StaffRole)} disabled={staff?.role === "owner"}>
							<SelectTrigger><SelectValue /></SelectTrigger>
							<SelectContent>
								<SelectItem value="waiter">Waiter</SelectItem>
								<SelectItem value="chef">Chef</SelectItem>
								{staff?.role === "owner" && <SelectItem value="owner">Owner</SelectItem>}
							</SelectContent>
						</Select>
					</div>
					{!isEdit && (
						<p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
							An invitation email will be sent with a link to set their password.
						</p>
					)}
					<div className="flex gap-2 pt-1">
						<Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
						<Button onClick={handleSave} disabled={saving} className="flex-1">
							{saving ? "Saving…" : isEdit ? "Save Changes" : "Send Invite"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
