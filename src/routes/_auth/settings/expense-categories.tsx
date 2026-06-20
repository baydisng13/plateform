import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getExpenseCategories, createExpenseCategory, deleteExpenseCategory } from "@/lib/server/settings";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export const Route = createFileRoute("/_auth/settings/expense-categories")({
	head: () => ({ meta: [{ title: "Expense Categories — PlateForm" }] }),
	loader: () => getExpenseCategories(),
	component: ExpenseCategoriesPage,
});

function ExpenseCategoriesPage() {
	const categories = Route.useLoaderData();
	const router = useRouter();
	const [dialogOpen, setDialogOpen] = useState(false);

	const handleDelete = async (id: string) => {
		await deleteExpenseCategory({ data: { id } });
		router.invalidate();
	};

	const handleSave = async (name: string) => {
		await createExpenseCategory({ data: { name } });
		setDialogOpen(false);
		router.invalidate();
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
				<Button onClick={() => setDialogOpen(true)}>
					<Plus className="size-4" />
					New Category
				</Button>
			</div>

			<div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
				{categories.length === 0 ? (
					<div className="flex flex-col items-center gap-2 py-16 text-center">
						<p className="text-sm font-semibold">No categories</p>
						<Button variant="outline" size="sm" className="mt-2" onClick={() => setDialogOpen(true)}>
							<Plus className="size-4" /> Add First Category
						</Button>
					</div>
				) : (
					<ul>
						{categories.map((c) => (
							<li key={c.id} className="flex items-center gap-4 border-b px-5 py-4 last:border-0">
								<span className="flex-1 text-sm font-semibold">{c.name}</span>
								<button
									type="button"
									onClick={() => handleDelete(c.id)}
									className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
									aria-label={`Delete ${c.name}`}
								>
									<Trash2 className="size-3.5" />
								</button>
							</li>
						))}
					</ul>
				)}
			</div>

			<ExpCatDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onSave={handleSave}
			/>
		</div>
	);
}

function ExpCatDialog({
	open,
	onClose,
	onSave,
}: {
	open: boolean;
	onClose: () => void;
	onSave: (name: string) => Promise<void>;
}) {
	const [name, setName] = useState("");
	const [saving, setSaving] = useState(false);

	const handleOpenChange = (v: boolean) => {
		if (!v) onClose();
		else setName("");
	};

	const handleSave = async () => {
		if (!name.trim()) return;
		setSaving(true);
		await onSave(name.trim());
		setSaving(false);
		setName("");
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>New Expense Category</DialogTitle>
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
					<div className="flex gap-2">
						<Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
						<Button onClick={handleSave} disabled={saving} className="flex-1">
							{saving ? "Saving…" : "Add Category"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
