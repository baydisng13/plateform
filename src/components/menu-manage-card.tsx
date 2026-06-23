import { Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { formatETB, type MenuTag } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface MenuManageCardProps {
	name: string;
	description?: string;
	color: string;
	price: number;
	available: boolean;
	categoryName: string;
	tags?: MenuTag[];
	onEdit: () => void;
	onDelete: () => void;
	onToggle: () => void;
}

export function MenuManageCard({
	name,
	description,
	color,
	price,
	available,
	categoryName,
	tags = [],
	onEdit,
	onDelete,
	onToggle,
}: MenuManageCardProps) {
	return (
		<article data-testid="menu-manage-card" className="group relative flex flex-col rounded-2xl border shadow-sm">
			{/* Header */}
			<div
				className={cn(
					"relative flex aspect-[4/3] items-center justify-center rounded-t-2xl text-2xl font-bold",
					color,
				)}
			>
				{name.charAt(0)}

				{/* Sold-out overlay */}
				{!available && (
					<div className="absolute inset-0 grid place-items-center bg-foreground/30 backdrop-blur-sm">
						<span className="rounded-full bg-destructive px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
							Sold out
						</span>
					</div>
				)}

				{/* Action overlay — on hover */}
				<div className="absolute inset-0 flex items-end justify-between gap-1.5 rounded-t-2xl bg-foreground/50 p-2 opacity-0 backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100">
					<button
						type="button"
						onClick={onToggle}
						data-testid="menu-toggle-btn"
						title={available ? "Mark sold out" : "Mark available"}
						className={cn(
							"flex items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
							available
								? "bg-primary text-primary-foreground hover:bg-primary/90"
								: "bg-muted text-foreground hover:bg-muted/80",
						)}
					>
						{available
							? <><ToggleRight className="size-3" /> On</>
							: <><ToggleLeft className="size-3" /> Off</>
						}
					</button>
					<div className="flex gap-1">
						<button
							type="button"
							onClick={onEdit}
							className="grid size-7 place-items-center rounded-lg bg-background/90 text-foreground transition-colors hover:bg-background"
							aria-label="Edit"
						>
							<Pencil className="size-3.5" />
						</button>
						<button
							type="button"
							onClick={onDelete}
							className="grid size-7 place-items-center rounded-lg bg-background/90 text-foreground transition-colors hover:bg-destructive hover:text-white"
							aria-label="Delete"
						>
							<Trash2 className="size-3.5" />
						</button>
					</div>
				</div>
			</div>

			{/* Body */}
			<div className="p-2.5">
				<p className="truncate text-xs font-semibold leading-tight">{name}</p>
				{description && (
					<p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
						{description}
					</p>
				)}
				{tags.length > 0 && (
					<div className="mt-1.5 flex flex-wrap gap-1">
						{tags.map((t) => (
							<span
								key={t.id}
								className={cn(
									"rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider",
									t.color,
								)}
							>
								{t.name}
							</span>
						))}
					</div>
				)}
				<div className="mt-1.5 flex items-center justify-between gap-1">
					<p className="text-xs font-bold tabular-nums text-primary">
						{formatETB(price)}
					</p>
					<span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
						{categoryName}
					</span>
				</div>
			</div>
		</article>
	);
}
