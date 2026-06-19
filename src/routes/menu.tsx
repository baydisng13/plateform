import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { MenuManageCard } from "@/components/menu-manage-card";
import {
	menuCategories,
	menuItems as initialItems,
	formatETB,
	type MenuItem,
} from "@/lib/mock-data";
import { useTags } from "@/lib/tags-store";
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

export const Route = createFileRoute("/menu")({
	head: () => ({ meta: [{ title: "Menu — Fresh & Pressed" }] }),
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
	const { tags } = useTags();
	const [items, setItems] = useState<MenuItem[]>(initialItems);
	const [cat, setCat] = useState<string>("all");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editItem, setEditItem] = useState<MenuItem | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
	const [toggleTarget, setToggleTarget] = useState<MenuItem | null>(null);

	const visible = items.filter((m) => cat === "all" || m.categoryId === cat);

	const confirmToggle = () => {
		if (!toggleTarget) return;
		setItems((arr) =>
			arr.map((x) =>
				x.id === toggleTarget.id ? { ...x, available: !x.available } : x,
			),
		);
		setToggleTarget(null);
	};

	const confirmDelete = () => {
		if (!deleteTarget) return;
		setItems((arr) => arr.filter((x) => x.id !== deleteTarget.id));
		setDeleteTarget(null);
	};

	const openNew = () => { setEditItem(null); setDialogOpen(true); };
	const openEdit = (item: MenuItem) => { setEditItem(item); setDialogOpen(true); };

	const saveItem = (data: Omit<MenuItem, "id"> & { tagIds?: string[] }) => {
		if (editItem) {
			setItems((arr) =>
				arr.map((x) => (x.id === editItem.id ? { ...x, ...data } : x)),
			);
		} else {
			setItems((arr) => [...arr, { ...data, id: `m${Date.now()}` }]);
		}
		setDialogOpen(false);
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
				{/* Category sidebar */}
				<aside className="w-56 shrink-0 border-r bg-card p-4">
					<p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
						Categories
					</p>
					<button
						type="button"
						onClick={() => setCat("all")}
						className={cn(
							"flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all",
							cat === "all"
								? "bg-muted text-foreground"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						All items
						<span className="font-mono text-xs">{items.length}</span>
					</button>
					{menuCategories.map((c) => {
						const count = items.filter((x) => x.categoryId === c.id).length;
						return (
							<button
								key={c.id}
								type="button"
								onClick={() => setCat(c.id)}
								className={cn(
									"mt-0.5 flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all",
									cat === c.id
										? "bg-muted text-foreground"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								<span className="truncate">{c.name}</span>
								<span className="font-mono text-xs">{count}</span>
							</button>
						);
					})}
				</aside>

				{/* Grid — same card size/shape as MenuPosCard */}
				<div className="grid flex-1 grid-cols-2 content-start gap-4 overflow-y-auto p-6 md:grid-cols-3 xl:grid-cols-5">
					{visible.map((m) => {
						const catName =
							menuCategories.find((c) => c.id === m.categoryId)?.name ?? m.categoryId;
						return (
							<MenuManageCard
								key={m.id}
								name={m.name}
								description={m.description}
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

			{/* Edit / New dialog */}
			<MenuItemDialog
				open={dialogOpen}
				item={editItem}
				allTags={tags}
				onClose={() => setDialogOpen(false)}
				onSave={saveItem}
			/>

			{/* Toggle confirmation */}
			<AlertDialog
				open={!!toggleTarget}
				onOpenChange={(v) => !v && setToggleTarget(null)}
			>
				<AlertDialogContent className="sm:max-w-sm">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{toggleTarget?.available ? "Mark as sold out?" : "Mark as available?"}
						</AlertDialogTitle>
					</AlertDialogHeader>

					{toggleTarget && (
						<div className="px-6 pb-2">
							{/* Item preview */}
							<div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
								<div
									className={cn(
										"grid size-10 shrink-0 place-items-center rounded-xl text-lg font-bold",
										toggleTarget.color,
									)}
								>
									{toggleTarget.name.charAt(0)}
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold">{toggleTarget.name}</p>
									<p className="text-xs text-muted-foreground">
										{formatETB(toggleTarget.price)}
									</p>
								</div>
								<span
									className={cn(
										"shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
										toggleTarget.available
											? "bg-primary/10 text-primary"
											: "bg-muted text-muted-foreground",
									)}
								>
									{toggleTarget.available ? "Available" : "Sold out"}
								</span>
							</div>

							{/* What will change */}
							<div
								className={cn(
									"mt-3 flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm",
									toggleTarget.available
										? "bg-amber-50 text-amber-900"
										: "bg-primary/5 text-primary",
								)}
							>
								<span className="mt-0.5 text-base">
									{toggleTarget.available ? "⚠️" : "✅"}
								</span>
								<p>
									{toggleTarget.available
										? "Customers won't be able to order this item until you mark it available again."
										: "This item will immediately appear as orderable in new orders."}
								</p>
							</div>
						</div>
					)}

					<AlertDialogFooter className="px-6 pb-6">
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className={cn(
								toggleTarget?.available
									? "bg-amber-500 text-white hover:bg-amber-600"
									: "bg-primary text-primary-foreground hover:bg-primary/90",
							)}
							onClick={confirmToggle}
						>
							{toggleTarget?.available ? "Mark Sold Out" : "Mark Available"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Delete confirmation */}
			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={(v) => !v && setDeleteTarget(null)}
			>
				<AlertDialogContent className="sm:max-w-sm">
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this item?</AlertDialogTitle>
					</AlertDialogHeader>

					{deleteTarget && (
						<div className="px-6 pb-2">
							{/* Item preview */}
							<div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
								<div
									className={cn(
										"grid size-10 shrink-0 place-items-center rounded-xl text-lg font-bold",
										deleteTarget.color,
									)}
								>
									{deleteTarget.name.charAt(0)}
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold">{deleteTarget.name}</p>
									{deleteTarget.description && (
										<p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
											{deleteTarget.description}
										</p>
									)}
									<p className="text-xs font-semibold text-primary">
										{formatETB(deleteTarget.price)}
									</p>
								</div>
							</div>

							{/* Warning */}
							<div className="mt-3 flex items-start gap-2.5 rounded-xl bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
								<span className="mt-0.5 text-base">🗑️</span>
								<p>
									This item will be <strong>permanently deleted</strong> from the
									menu. This cannot be undone.
								</p>
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
	allTags,
	onClose,
	onSave,
}: {
	open: boolean;
	item: MenuItem | null;
	allTags: import("@/lib/mock-data").MenuTag[];
	onClose: () => void;
	onSave: (data: Omit<MenuItem, "id"> & { tagIds?: string[] }) => void;
}) {
	const [name, setName] = useState(item?.name ?? "");
	const [description, setDescription] = useState(item?.description ?? "");
	const [categoryId, setCategoryId] = useState(item?.categoryId ?? "juices");
	const [price, setPrice] = useState(String(item?.price ?? ""));
	const [available, setAvailable] = useState(item?.available ?? true);
	const [tagIds, setTagIds] = useState<string[]>(item?.tagIds ?? []);

	const isEdit = !!item;

	const handleOpenChange = (v: boolean) => {
		if (!v) onClose();
		else {
			setName(item?.name ?? "");
			setDescription(item?.description ?? "");
			setCategoryId(item?.categoryId ?? "juices");
			setPrice(String(item?.price ?? ""));
			setAvailable(item?.available ?? true);
			setTagIds(item?.tagIds ?? []);
		}
	};

	const toggleTag = (id: string) =>
		setTagIds((prev) =>
			prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
		);

	const handleSave = () => {
		if (!name || !price) return;
		onSave({
			name,
			description,
			categoryId,
			price: Number(price),
			color: ITEM_COLORS[Math.floor(Math.random() * ITEM_COLORS.length)],
			available,
			tagIds,
		});
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{isEdit ? "Edit Item" : "New Menu Item"}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 px-8 pb-8 pt-2">
					<div className="space-y-1.5">
						<Label htmlFor="item-name">Name</Label>
						<Input
							id="item-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Avocado Detox"
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="item-desc">Description</Label>
						<Input
							id="item-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Ingredients, tasting notes…"
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label>Category</Label>
							<Select value={categoryId} onValueChange={setCategoryId}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									{menuCategories.map((c) => (
										<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="item-price">Price (ETB)</Label>
							<Input
								id="item-price"
								type="number"
								min={0}
								value={price}
								onChange={(e) => setPrice(e.target.value)}
								placeholder="e.g. 220"
							/>
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
						<Button onClick={handleSave} className="flex-1">
							{isEdit ? "Save Changes" : "Add Item"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
