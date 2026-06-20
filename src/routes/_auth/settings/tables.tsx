import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getTables, createTable, updateTable, deleteTable } from "@/lib/server/settings";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
type DbTable = Awaited<ReturnType<typeof getTables>>[number];

export const Route = createFileRoute("/_auth/settings/tables")({
	head: () => ({ meta: [{ title: "Tables — PlateForm" }] }),
	loader: () => getTables(),
	component: TablesPage,
});

function TablesPage() {
	const tables = Route.useLoaderData();
	const router = useRouter();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editItem, setEditItem] = useState<DbTable | null>(null);

	const openNew = () => { setEditItem(null); setDialogOpen(true); };
	const openEdit = (t: DbTable) => { setEditItem(t); setDialogOpen(true); };

	const handleDelete = async (id: string) => {
		await deleteTable({ data: { id } });
		router.invalidate();
	};

	const handleSave = async (data: { number: number; name?: string; capacity?: number }) => {
		if (editItem) {
			await updateTable({ data: { id: editItem.id, ...data } });
		} else {
			await createTable({ data });
		}
		setDialogOpen(false);
		router.invalidate();
	};

	const activeCount = tables.length;

	return (
		<div className="mx-auto max-w-3xl p-8">
			<div className="mb-6 flex items-start justify-between">
				<div>
					<h2 className="text-lg font-semibold">Tables</h2>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{activeCount} table{activeCount !== 1 ? "s" : ""}
					</p>
				</div>
				<Button onClick={openNew}>
					<Plus className="size-4" />
					Add Table
				</Button>
			</div>

			<div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
				{tables.map((t) => (
					<div
						key={t.id}
						className="group relative flex flex-col items-center rounded-2xl border bg-card p-4 shadow-sm transition-all"
					>
						<div className="mb-2 grid size-12 place-items-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
							{t.number}
						</div>
						<p className="text-center text-xs font-semibold leading-tight">{t.name ?? `Table ${t.number}`}</p>
						<p className="mt-0.5 text-[10px] text-muted-foreground">{t.capacity ?? "—"} seats</p>

						<div className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
							<button
								type="button"
								onClick={() => openEdit(t)}
								className="grid size-7 place-items-center rounded-lg bg-background text-muted-foreground shadow-sm hover:text-foreground"
								aria-label="Edit"
							>
								<Pencil className="size-3.5" />
							</button>
							<button
								type="button"
								onClick={() => handleDelete(t.id)}
								className="grid size-7 place-items-center rounded-lg bg-background text-muted-foreground shadow-sm hover:text-destructive"
								aria-label="Delete"
							>
								<Trash2 className="size-3.5" />
							</button>
						</div>
					</div>
				))}

				<button
					type="button"
					onClick={openNew}
					className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
				>
					<Plus className="mb-1 size-6" strokeWidth={1.5} />
					<span className="text-xs font-medium">Add Table</span>
				</button>
			</div>

			<TableDialog
				open={dialogOpen}
				item={editItem}
				onClose={() => setDialogOpen(false)}
				onSave={handleSave}
				nextNumber={Math.max(0, ...tables.map((t) => t.number)) + 1}
			/>
		</div>
	);
}

function TableDialog({
	open,
	item,
	onClose,
	onSave,
	nextNumber,
}: {
	open: boolean;
	item: DbTable | null;
	onClose: () => void;
	onSave: (data: { number: number; name?: string; capacity?: number }) => Promise<void>;
	nextNumber: number;
}) {
	const [number, setNumber] = useState(String(item?.number ?? nextNumber));
	const [name, setName] = useState(item?.name ?? "");
	const [capacity, setCapacity] = useState(String(item?.capacity ?? 4));
	const [saving, setSaving] = useState(false);

	const handleSave = async () => {
		if (!number) return;
		const num = Number(number);
		setSaving(true);
		await onSave({ number: num, name: name || undefined, capacity: Number(capacity) || undefined });
		setSaving(false);
	};

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>{item ? "Edit Table" : "Add Table"}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 px-8 pb-8 pt-2">
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label htmlFor="tbl-number">Table Number</Label>
							<Input id="tbl-number" type="number" min={1} value={number} onChange={(e) => setNumber(e.target.value)} />
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="tbl-capacity">Seats</Label>
							<Input id="tbl-capacity" type="number" min={1} max={20} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
						</div>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="tbl-name">Label (optional)</Label>
						<Input id="tbl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={`Table ${number || nextNumber}`} />
					</div>
					<div className="flex gap-2">
						<Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
						<Button onClick={handleSave} disabled={saving} className="flex-1">
							{saving ? "Saving…" : item ? "Save" : "Add Table"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
