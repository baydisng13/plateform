import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { getMenuTags, createMenuTag, updateMenuTag, deleteMenuTag } from "@/lib/server/menu";
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

type DbTag = Awaited<ReturnType<typeof getMenuTags>>[number];

export const Route = createFileRoute("/_auth/settings/menu-tags")({
	head: () => ({ meta: [{ title: "Menu Tags — PlateForm" }] }),
	loader: () => getMenuTags(),
	component: MenuTagsPage,
});

const COLOR_OPTIONS = [
	{ label: "Violet", classes: "bg-violet-100 text-violet-700", dot: "bg-violet-500" },
	{ label: "Amber", classes: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
	{ label: "Emerald", classes: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
	{ label: "Rose", classes: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
	{ label: "Sky", classes: "bg-sky-100 text-sky-700", dot: "bg-sky-500" },
	{ label: "Orange", classes: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
	{ label: "Slate", classes: "bg-slate-100 text-slate-700", dot: "bg-slate-500" },
	{ label: "Purple", classes: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
];

function MenuTagsPage() {
	const tags = Route.useLoaderData();
	const router = useRouter();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editItem, setEditItem] = useState<DbTag | null>(null);

	const openNew = () => { setEditItem(null); setDialogOpen(true); };
	const openEdit = (t: DbTag) => { setEditItem(t); setDialogOpen(true); };

	const handleDelete = async (id: string) => {
		await deleteMenuTag({ data: { id } });
		router.invalidate();
	};

	const handleSave = async (name: string, color: string) => {
		if (editItem) {
			await updateMenuTag({ data: { id: editItem.id, name, color } });
		} else {
			await createMenuTag({ data: { name, color } });
		}
		setDialogOpen(false);
		router.invalidate();
	};

	return (
		<div className="mx-auto max-w-2xl p-8">
			<div className="mb-6 flex items-start justify-between">
				<div>
					<h2 className="text-lg font-semibold">Menu Tags</h2>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{tags.length} tags · used to label menu items (e.g. Fasting, Vegan).
					</p>
				</div>
				<Button onClick={openNew}>
					<Plus className="size-4" />
					New Tag
				</Button>
			</div>

			<div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
				{tags.length === 0 ? (
					<div className="flex flex-col items-center gap-2 py-16 text-center">
						<p className="text-sm font-semibold">No tags yet</p>
						<Button variant="outline" size="sm" className="mt-2" onClick={openNew}>
							<Plus className="size-4" /> Add First Tag
						</Button>
					</div>
				) : (
					<ul>
						{tags.map((t) => (
							<li key={t.id} className="flex items-center gap-4 border-b px-5 py-4 last:border-0">
								<span className={cn("rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider", t.color)}>
									{t.name}
								</span>
								<span className="flex-1" />
								{t.isDefault && (
									<span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">default</span>
								)}
								<div className="flex items-center gap-1">
									<button
										type="button"
										onClick={() => openEdit(t)}
										className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
										aria-label={`Edit ${t.name}`}
									>
										<Pencil className="size-3.5" />
									</button>
									{!t.isDefault && (
										<button
											type="button"
											onClick={() => handleDelete(t.id)}
											className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
											aria-label={`Delete ${t.name}`}
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

			<TagDialog
				open={dialogOpen}
				tag={editItem}
				onClose={() => setDialogOpen(false)}
				onSave={handleSave}
			/>
		</div>
	);
}

function TagDialog({
	open,
	tag,
	onClose,
	onSave,
}: {
	open: boolean;
	tag: DbTag | null;
	onClose: () => void;
	onSave: (name: string, color: string) => Promise<void>;
}) {
	const [name, setName] = useState(tag?.name ?? "");
	const [color, setColor] = useState(tag?.color ?? COLOR_OPTIONS[0].classes);
	const [saving, setSaving] = useState(false);

	const handleOpenChange = (v: boolean) => {
		if (!v) onClose();
		else {
			setName(tag?.name ?? "");
			setColor(tag?.color ?? COLOR_OPTIONS[0].classes);
		}
	};

	const handleSave = async () => {
		if (!name.trim()) return;
		setSaving(true);
		await onSave(name.trim(), color);
		setSaving(false);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>{tag ? "Edit Tag" : "New Menu Tag"}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 px-8 pb-8 pt-2">
					<div className="space-y-1.5">
						<Label htmlFor="tag-name">Tag Name</Label>
						<Input id="tag-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fasting" autoFocus />
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
										color === opt.classes ? "scale-110 ring-2 ring-foreground ring-offset-2" : "opacity-70 hover:opacity-100",
									)}
									aria-label={opt.label}
								/>
							))}
						</div>
						{name && (
							<div className="mt-2">
								<span className={cn("rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider", color)}>{name}</span>
							</div>
						)}
					</div>
					<div className="flex gap-2">
						<Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
						<Button onClick={handleSave} disabled={saving} className="flex-1">
							{saving ? "Saving…" : tag ? "Save" : "Add Tag"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
