import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { MenuManageCard } from "@/components/menu-manage-card";
import {
	getMenuItems,
	getMenuCategories,
	getMenuTags,
	createMenuItem,
	updateMenuItem,
	deleteMenuItem,
	toggleMenuItemAvailability,
} from "@/lib/server/menu";
import { formatETB } from "@/lib/utils";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type DbMenuItem = Awaited<ReturnType<typeof getMenuItems>>[number];
type DbMenuCategory = Awaited<ReturnType<typeof getMenuCategories>>[number];
type DbMenuTag = Awaited<ReturnType<typeof getMenuTags>>[number];

export const Route = createFileRoute("/_auth/menu")({
	head: () => ({ meta: [{ title: "Menu — PlateForm" }] }),
	loader: async () => {
		const [items, categories, tags] = await Promise.all([
			getMenuItems(),
			getMenuCategories(),
			getMenuTags(),
		]);
		return { items, categories, tags };
	},
	component: MenuPage,
});

const ITEM_COLORS = [
	"bg-emerald-100 text-emerald-700",
	"bg-amber-100 text-amber-700",
	"bg-rose-100 text-rose-700",
	"bg-sky-100 text-sky-700",
	"bg-violet-100 text-violet-700",
	"bg-orange-100 text-orange-700",
];

function MenuPage() {
	const { items, categories, tags } = Route.useLoaderData();
	const router = useRouter();
	const [cat, setCat] = useState<string>("all");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editItem, setEditItem] = useState<DbMenuItem | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<DbMenuItem | null>(null);
	const [toggleTarget, setToggleTarget] = useState<DbMenuItem | null>(null);

	const visible = items.filter((m) => cat === "all" || m.categoryId === cat);

	const confirmToggle = async () => {
		if (!toggleTarget) return;
		await toggleMenuItemAvailability({ data: { id: toggleTarget.id, available: !toggleTarget.available } });
		setToggleTarget(null);
		router.invalidate();
	};

	const confirmDelete = async () => {
		if (!deleteTarget) return;
		await deleteMenuItem({ data: { id: deleteTarget.id } });
		setDeleteTarget(null);
		router.invalidate();
	};

	const openNew = () => { setEditItem(null); setDialogOpen(true); };
	const openEdit = (item: DbMenuItem) => { setEditItem(item); setDialogOpen(true); };

	const saveItem = async (data: Omit<DbMenuItem, "id" | "createdAt" | "updatedAt"> & { tagIds?: string[] }) => {
		const clean = {
			name: data.name,
			categoryId: data.categoryId,
			price: data.price,
			color: data.color,
			available: data.available,
			description: data.description ?? undefined,
			imageUrl: data.imageUrl ?? undefined,
			tagIds: data.tagIds ?? [],
		};
		if (editItem) {
			await updateMenuItem({ data: { id: editItem.id, ...clean } });
		} else {
			await createMenuItem({ data: clean });
		}
		setDialogOpen(false);
		router.invalidate();
	};

	return (
		<AppShell>
			<PageHeader
				title="Menu"
				subtitle={`${items.filter((x) => x.available).length} of ${items.length} items available`}
				right={
					<Button onClick={openNew} size="sm">
						<Plus className="size-4" strokeWidth={2.5} />
						New Item
					</Button>
				}
			/>
			<div className="flex flex-1 overflow-hidden">
				<aside className="w-56 shrink-0 border-r bg-card p-4">
					<p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
						Categories
					</p>
					<button
						type="button"
						onClick={() => setCat("all")}
						className={cn(
							"flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all",
							cat === "all" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
						)}
					>
						All items
						<span className="font-mono text-xs">{items.length}</span>
					</button>
					{categories.map((c) => {
						const count = items.filter((x) => x.categoryId === c.id).length;
						return (
							<button
								key={c.id}
								type="button"
								onClick={() => setCat(c.id)}
								className={cn(
									"mt-0.5 flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all",
									cat === c.id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
								)}
							>
								<span className="truncate">{c.name}</span>
								<span className="font-mono text-xs">{count}</span>
							</button>
						);
					})}
				</aside>

				<div className="grid flex-1 grid-cols-2 content-start gap-4 overflow-y-auto p-6 md:grid-cols-3 xl:grid-cols-5">
					{visible.map((m) => {
						const catName = categories.find((c) => c.id === m.categoryId)?.name ?? m.categoryId;
						return (
							<MenuManageCard
								key={m.id}
								name={m.name}
								description={m.description ?? undefined}
								color={m.color}
								price={m.price}
								available={m.available}
								categoryName={catName}
								tags={tags.filter((t) => m.tagIds?.includes(t.id))}
								onEdit={() => openEdit(m)}
								onDelete={() => setDeleteTarget(m)}
								onToggle={() => setToggleTarget(m)}
							/>
						);
					})}
				</div>
			</div>

			<MenuItemDialog
				open={dialogOpen}
				item={editItem}
				categories={categories}
				allTags={tags}
				onClose={() => setDialogOpen(false)}
				onSave={saveItem}
			/>

			<AlertDialog open={!!toggleTarget} onOpenChange={(v) => !v && setToggleTarget(null)}>
				<AlertDialogContent className="sm:max-w-sm">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{toggleTarget?.available ? "Mark as sold out?" : "Mark as available?"}
						</AlertDialogTitle>
					</AlertDialogHeader>
					{toggleTarget && (
						<div className="px-6 pb-2">
							<div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
								<div className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-lg font-bold", toggleTarget.color)}>
									{toggleTarget.name.charAt(0)}
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold">{toggleTarget.name}</p>
									<p className="text-xs text-muted-foreground">{formatETB(toggleTarget.price)}</p>
								</div>
							</div>
						</div>
					)}
					<AlertDialogFooter className="px-6 pb-6">
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={confirmToggle}>
							{toggleTarget?.available ? "Mark Sold Out" : "Mark Available"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
				<AlertDialogContent className="sm:max-w-sm">
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this item?</AlertDialogTitle>
					</AlertDialogHeader>
					{deleteTarget && (
						<div className="px-6 pb-2">
							<div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
								<div className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-lg font-bold", deleteTarget.color)}>
									{deleteTarget.name.charAt(0)}
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold">{deleteTarget.name}</p>
									<p className="text-xs font-semibold text-primary">{formatETB(deleteTarget.price)}</p>
								</div>
							</div>
						</div>
					)}
					<AlertDialogFooter className="px-6 pb-6">
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-white hover:bg-destructive/90"
							onClick={confirmDelete}
						>
							Delete Item
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</AppShell>
	);
}

function MenuItemDialog({
	open,
	item,
	categories,
	allTags,
	onClose,
	onSave,
}: {
	open: boolean;
	item: DbMenuItem | null;
	categories: DbMenuCategory[];
	allTags: DbMenuTag[];
	onClose: () => void;
	onSave: (data: Omit<DbMenuItem, "id" | "createdAt" | "updatedAt"> & { tagIds?: string[] }) => Promise<void>;
}) {
	const [name, setName] = useState(item?.name ?? "");
	const [description, setDescription] = useState(item?.description ?? "");
	const [categoryId, setCategoryId] = useState(item?.categoryId ?? categories[0]?.id ?? "");
	const [price, setPrice] = useState(String(item?.price ?? ""));
	const [available, setAvailable] = useState(item?.available ?? true);
	const [tagIds, setTagIds] = useState<string[]>(item?.tagIds ?? []);
	const [saving, setSaving] = useState(false);

	const handleOpenChange = (v: boolean) => {
		if (!v) {
			onClose();
		} else {
			setName(item?.name ?? "");
			setDescription(item?.description ?? "");
			setCategoryId(item?.categoryId ?? categories[0]?.id ?? "");
			setPrice(String(item?.price ?? ""));
			setAvailable(item?.available ?? true);
			setTagIds(item?.tagIds ?? []);
		}
	};

	const toggleTag = (id: string) =>
		setTagIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

	const handleSave = async () => {
		if (!name || !price) return;
		setSaving(true);
		await onSave({
			name,
			description: description || null,
			categoryId,
			price: Number(price),
			color: item?.color ?? ITEM_COLORS[Math.floor(Math.random() * ITEM_COLORS.length)],
			available,
			tagIds,
			imageUrl: item?.imageUrl ?? null,
		});
		setSaving(false);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{item ? "Edit Item" : "New Menu Item"}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 px-8 pb-8 pt-2">
					<div className="space-y-1.5">
						<Label htmlFor="item-name">Name</Label>
						<Input id="item-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Avocado Detox" />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="item-desc">Description</Label>
						<Input id="item-desc" value={description ?? ""} onChange={(e) => setDescription(e.target.value)} placeholder="Ingredients, tasting notes…" />
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label>Category</Label>
							<Select value={categoryId} onValueChange={setCategoryId}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									{categories.map((c) => (
										<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="item-price">Price (ETB)</Label>
							<Input id="item-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 220" />
						</div>
					</div>
					<div className="flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3">
						<span className="text-sm font-medium">Available to order</span>
						<Switch checked={available} onCheckedChange={setAvailable} />
					</div>
					{allTags.length > 0 && (
						<div className="space-y-1.5">
							<Label>Tags</Label>
							<div className="flex flex-wrap gap-2">
								{allTags.map((t) => {
									const selected = tagIds.includes(t.id);
									return (
										<button
											key={t.id}
											type="button"
											onClick={() => toggleTag(t.id)}
											className={cn(
												"rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider transition-all",
												selected
													? cn(t.color, "ring-2 ring-foreground ring-offset-1")
													: "bg-muted text-muted-foreground opacity-60 hover:opacity-100",
											)}
										>
											{t.name}
										</button>
									);
								})}
							</div>
						</div>
					)}
					<div className="flex gap-2 pt-1">
						<Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
						<Button onClick={handleSave} disabled={saving} className="flex-1">
							{saving ? "Saving…" : item ? "Save Changes" : "Add Item"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
