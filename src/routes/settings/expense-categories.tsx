import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { expenseCategories as defaultCategories } from "@/lib/mock-data";
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

export const Route = createFileRoute("/settings/expense-categories")({
	head: () => ({ meta: [{ title: "Expense Categories — Fresh & Pressed" }] }),
	component: ExpenseCategoriesPage,
});

const COLOR_OPTIONS = [
	{ label: "Emerald", classes: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
	{ label: "Sky", classes: "bg-sky-100 text-sky-700", dot: "bg-sky-500" },
	{ label: "Violet", classes: "bg-violet-100 text-violet-700", dot: "bg-violet-500" },
	{ label: "Amber", classes: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
	{ label: "Rose", classes: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
	{ label: "Slate", classes: "bg-slate-100 text-slate-700", dot: "bg-slate-500" },
	{ label: "Orange", classes: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
	{ label: "Purple", classes: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
];

const defaultColorMap: Record<string, string> = {
	Ingredients: "bg-emerald-100 text-emerald-700",
	Utilities: "bg-sky-100 text-sky-700",
	Rent: "bg-violet-100 text-violet-700",
	Staff: "bg-amber-100 text-amber-700",
	Equipment: "bg-rose-100 text-rose-700",
	Other: "bg-slate-100 text-slate-700",
};

interface ExpCat {
	id: string;
	name: string;
	color: string;
	isDefault: boolean;
}

function ExpenseCategoriesPage() {
	const [categories, setCategories] = useState<ExpCat[]>(
		defaultCategories.map((c) => ({
			id: c.toLowerCase(),
			name: c,
			color: defaultColorMap[c] ?? "bg-slate-100 text-slate-700",
			isDefault: true,
		})),
	);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editItem, setEditItem] = useState<ExpCat | null>(null);

	const openNew = () => {
		setEditItem(null);
		setDialogOpen(true);
	};
	const openEdit = (c: ExpCat) => {
		setEditItem(c);
		setDialogOpen(true);
	};
	const deleteCategory = (id: string) =>
		setCategories((arr) => arr.filter((c) => c.id !== id));

	const save = (name: string, color: string) => {
		if (editItem) {
			setCategories((arr) =>
				arr.map((c) => (c.id === editItem.id ? { ...c, name, color } : c)),
			);
		} else {
			setCategories((arr) => [
				...arr,
				{
					id: `ec-${Date.now()}`,
					name,
					color,
					isDefault: false,
				},
			]);
		}
		setDialogOpen(false);
	};

	return (
		<div className="mx-auto max-w-2xl p-8">
			<div className="mb-6 flex items-start justify-between">
				<div>
					<h2 className="text-lg font-semibold">Expense Categories</h2>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{categories.length} categories · used when logging expenses.
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
						<p className="text-sm font-semibold">No categories</p>
						<Button variant="outline" size="sm" className="mt-2" onClick={openNew}>
							<Plus className="size-4" /> Add First Category
						</Button>
					</div>
				) : (
					<ul>
						{categories.map((c) => (
							<li
								key={c.id}
								className="flex items-center gap-4 border-b px-5 py-4 last:border-0"
							>
								<span
									className={cn(
										"rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
										c.color,
									)}
								>
									{c.name}
								</span>
								<span className="flex-1" />
								{c.isDefault && (
									<span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
										default
									</span>
								)}
								<div className="flex items-center gap-1">
									<button
										type="button"
										onClick={() => openEdit(c)}
										className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
										aria-label={`Edit ${c.name}`}
									>
										<Pencil className="size-3.5" />
									</button>
									{!c.isDefault && (
										<button
											type="button"
											onClick={() => deleteCategory(c.id)}
											className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
											aria-label={`Delete ${c.name}`}
										>
											<Trash2 className="size-3.5" />
										</button>
									)}
								</div>
							</li>
						))}
					</ul>
				)}
			</div>

			<ExpCatDialog
				open={dialogOpen}
				item={editItem}
				onClose={() => setDialogOpen(false)}
				onSave={save}
			/>
		</div>
	);
}

function ExpCatDialog({
	open,
	item,
	onClose,
	onSave,
}: {
	open: boolean;
	item: ExpCat | null;
	onClose: () => void;
	onSave: (name: string, color: string) => void;
}) {
	const [name, setName] = useState(item?.name ?? "");
	const [color, setColor] = useState(
		item?.color ?? COLOR_OPTIONS[5].classes,
	);

	const handleOpenChange = (v: boolean) => {
		if (!v) onClose();
		else {
			setName(item?.name ?? "");
			setColor(item?.color ?? COLOR_OPTIONS[5].classes);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>
						{item ? "Edit Category" : "New Expense Category"}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 px-8 pb-8 pt-2">
					<div className="space-y-1.5">
						<Label htmlFor="ec-name">Category Name</Label>
						<Input
							id="ec-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Marketing"
							autoFocus
						/>
					</div>

					<div className="space-y-1.5">
						<Label>Color</Label>
						<div className="flex flex-wrap gap-2">
							{COLOR_OPTIONS.map((opt) => (
								<button
									key={opt.label}
									type="button"
									onClick={() => setColor(opt.classes)}
									className={cn(
										"flex size-8 items-center justify-center rounded-full transition-all",
										opt.dot,
										color === opt.classes
											? "ring-2 ring-offset-2 ring-foreground scale-110"
											: "opacity-70 hover:opacity-100",
									)}
									aria-label={opt.label}
								/>
							))}
						</div>
						{name && (
							<div className="mt-2">
								<span
									className={cn(
										"rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
										color,
									)}
								>
									{name}
								</span>
							</div>
						)}
					</div>

					<div className="flex gap-2">
						<Button variant="outline" onClick={onClose} className="flex-1">
							Cancel
						</Button>
						<Button
							onClick={() => name.trim() && onSave(name.trim(), color)}
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
