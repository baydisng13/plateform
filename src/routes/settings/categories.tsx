import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { menuCategories as initialCategories, type MenuCategory } from "@/lib/mock-data";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/settings/categories")({
	head: () => ({ meta: [{ title: "Menu Categories — Fresh & Pressed" }] }),
	component: CategoriesPage,
});

function CategoriesPage() {
	const [categories, setCategories] =
		useState<MenuCategory[]>(initialCategories);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editItem, setEditItem] = useState<MenuCategory | null>(null);

	const openNew = () => {
		setEditItem(null);
		setDialogOpen(true);
	};
	const openEdit = (c: MenuCategory) => {
		setEditItem(c);
		setDialogOpen(true);
	};
	const deleteCategory = (id: string) =>
		setCategories((arr) => arr.filter((c) => c.id !== id));

	const save = (name: string) => {
		if (editItem) {
			setCategories((arr) =>
				arr.map((c) => (c.id === editItem.id ? { ...c, name } : c)),
			);
		} else {
			const id = name.toLowerCase().replace(/\s+/g, "-");
			setCategories((arr) => [...arr, { id, name }]);
		}
		setDialogOpen(false);
	};

	return (
		<div className="mx-auto max-w-2xl p-8">
			<div className="mb-6 flex items-start justify-between">
				<div>
					<h2 className="text-lg font-semibold">Menu Categories</h2>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{categories.length} categories · used to organise menu items.
					</p>
				</div>
				<Button onClick={openNew}>
					<Plus className="size-4" />
					New Category
				</Button>
			</div>

			<div className="rounded-3xl border bg-card shadow-sm overflow-hidden">
				{categories.length === 0 ? (
					<div className="flex flex-col items-center gap-2 py-16 text-center">
						<p className="text-sm font-semibold">No categories yet</p>
						<p className="text-xs text-muted-foreground">
							Add categories to organise your menu items.
						</p>
						<Button variant="outline" size="sm" className="mt-2" onClick={openNew}>
							<Plus className="size-4" /> Add First Category
						</Button>
					</div>
				) : (
					<ul>
						{categories.map((c, idx) => (
							<li
								key={c.id}
								className="flex items-center gap-3 border-b px-5 py-4 last:border-0"
							>
								<GripVertical
									className="size-4 shrink-0 cursor-grab text-muted-foreground/40"
									strokeWidth={2}
								/>
								<div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-xs font-bold tabular-nums text-muted-foreground">
									{idx + 1}
								</div>
								<span className="flex-1 text-sm font-semibold">{c.name}</span>
								<div className="flex items-center gap-1">
									<button
										type="button"
										onClick={() => openEdit(c)}
										className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
										aria-label={`Edit ${c.name}`}
									>
										<Pencil className="size-3.5" />
									</button>
									<button
										type="button"
										onClick={() => deleteCategory(c.id)}
										className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
										aria-label={`Delete ${c.name}`}
									>
										<Trash2 className="size-3.5" />
									</button>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>

			<CategoryDialog
				open={dialogOpen}
				item={editItem}
				onClose={() => setDialogOpen(false)}
				onSave={save}
			/>
		</div>
	);
}

function CategoryDialog({
	open,
	item,
	onClose,
	onSave,
}: {
	open: boolean;
	item: MenuCategory | null;
	onClose: () => void;
	onSave: (name: string) => void;
}) {
	const [name, setName] = useState(item?.name ?? "");

	const handleOpenChange = (v: boolean) => {
		if (!v) onClose();
		else setName(item?.name ?? "");
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>
						{item ? "Edit Category" : "New Category"}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 px-8 pb-8 pt-2">
					<div className="space-y-1.5">
						<Label htmlFor="cat-name">Category Name</Label>
						<Input
							id="cat-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Cold-Pressed Juices"
							autoFocus
						/>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" onClick={onClose} className="flex-1">
							Cancel
						</Button>
						<Button
							onClick={() => name.trim() && onSave(name.trim())}
							className="flex-1"
						>
							{item ? "Save" : "Add Category"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
