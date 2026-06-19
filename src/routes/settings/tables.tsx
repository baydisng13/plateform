import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings/tables")({
	head: () => ({ meta: [{ title: "Tables — Fresh & Pressed" }] }),
	component: TablesPage,
});

interface TableItem {
	id: string;
	number: number;
	label: string;
	capacity: number;
	active: boolean;
}

const initialTables: TableItem[] = [
	{ id: "t1", number: 1, label: "Table 1", capacity: 2, active: true },
	{ id: "t2", number: 2, label: "Table 2", capacity: 4, active: true },
	{ id: "t3", number: 3, label: "Table 3", capacity: 4, active: true },
	{ id: "t4", number: 4, label: "Table 4", capacity: 6, active: true },
	{ id: "t5", number: 5, label: "Table 5", capacity: 2, active: true },
	{ id: "t6", number: 6, label: "Window Table", capacity: 2, active: true },
	{ id: "t7", number: 7, label: "Table 7", capacity: 8, active: true },
	{ id: "t8", number: 8, label: "Terrace 1", capacity: 4, active: false },
];

function TablesPage() {
	const [tables, setTables] = useState<TableItem[]>(initialTables);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editItem, setEditItem] = useState<TableItem | null>(null);

	const openNew = () => {
		setEditItem(null);
		setDialogOpen(true);
	};
	const openEdit = (t: TableItem) => {
		setEditItem(t);
		setDialogOpen(true);
	};
	const deleteTable = (id: string) =>
		setTables((arr) => arr.filter((t) => t.id !== id));
	const toggleActive = (id: string) =>
		setTables((arr) =>
			arr.map((t) => (t.id === id ? { ...t, active: !t.active } : t)),
		);

	const save = (data: Omit<TableItem, "id">) => {
		if (editItem) {
			setTables((arr) =>
				arr.map((t) => (t.id === editItem.id ? { ...t, ...data } : t)),
			);
		} else {
			setTables((arr) => [...arr, { ...data, id: `t${Date.now()}` }]);
		}
		setDialogOpen(false);
	};

	const activeCount = tables.filter((t) => t.active).length;

	return (
		<div className="mx-auto max-w-3xl p-8">
			<div className="mb-6 flex items-start justify-between">
				<div>
					<h2 className="text-lg font-semibold">Tables</h2>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{activeCount} active · {tables.length} total
					</p>
				</div>
				<Button onClick={openNew}>
					<Plus className="size-4" />
					Add Table
				</Button>
			</div>

			{/* Table grid */}
			<div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
				{tables.map((t) => (
					<div
						key={t.id}
						className={cn(
							"group relative flex flex-col items-center rounded-2xl border p-4 shadow-sm transition-all",
							t.active ? "bg-card" : "bg-muted/40 opacity-60",
						)}
					>
						<div
							className={cn(
								"mb-2 grid size-12 place-items-center rounded-xl text-lg font-bold",
								t.active
									? "bg-primary/10 text-primary"
									: "bg-muted text-muted-foreground",
							)}
						>
							{t.number}
						</div>
						<p className="text-center text-xs font-semibold leading-tight">
							{t.label}
						</p>
						<p className="mt-0.5 text-[10px] text-muted-foreground">
							{t.capacity} seats
						</p>

						{/* Hover actions */}
						<div className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
							<button
								type="button"
								onClick={() => openEdit(t)}
								className="grid size-7 place-items-center rounded-lg bg-background shadow-sm text-muted-foreground hover:text-foreground"
								aria-label="Edit"
							>
								<Pencil className="size-3.5" />
							</button>
							<button
								type="button"
								onClick={() => toggleActive(t.id)}
								className={cn(
									"grid size-7 place-items-center rounded-lg shadow-sm text-xs font-bold",
									t.active
										? "bg-background text-muted-foreground hover:text-destructive"
										: "bg-primary text-primary-foreground",
								)}
								aria-label={t.active ? "Deactivate" : "Activate"}
							>
								{t.active ? "—" : "✓"}
							</button>
							<button
								type="button"
								onClick={() => deleteTable(t.id)}
								className="grid size-7 place-items-center rounded-lg bg-background shadow-sm text-muted-foreground hover:text-destructive"
								aria-label="Delete"
							>
								<Trash2 className="size-3.5" />
							</button>
						</div>
					</div>
				))}

				{/* Add table shortcut */}
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
				onSave={save}
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
	item: TableItem | null;
	onClose: () => void;
	onSave: (data: Omit<TableItem, "id">) => void;
	nextNumber: number;
}) {
	const [number, setNumber] = useState(String(item?.number ?? nextNumber));
	const [label, setLabel] = useState(item?.label ?? "");
	const [capacity, setCapacity] = useState(String(item?.capacity ?? 4));
	const [active] = useState(item?.active ?? true);

	const handleSave = () => {
		if (!number) return;
		const num = Number(number);
		onSave({
			number: num,
			label: label || `Table ${num}`,
			capacity: Number(capacity) || 4,
			active,
		});
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
							<Input
								id="tbl-number"
								type="number"
								min={1}
								value={number}
								onChange={(e) => setNumber(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="tbl-capacity">Seats</Label>
							<Input
								id="tbl-capacity"
								type="number"
								min={1}
								max={20}
								value={capacity}
								onChange={(e) => setCapacity(e.target.value)}
							/>
						</div>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="tbl-label">Label (optional)</Label>
						<Input
							id="tbl-label"
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							placeholder={`Table ${number || nextNumber}`}
						/>
						<p className="text-xs text-muted-foreground">
							Custom name, e.g. "Window Table" or "Terrace 1"
						</p>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" onClick={onClose} className="flex-1">
							Cancel
						</Button>
						<Button onClick={handleSave} className="flex-1">
							{item ? "Save" : "Add Table"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
