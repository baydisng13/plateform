import { formatETB } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface MenuPosCardProps {
	name: string;
	color: string;
	price: number;
	available?: boolean;
	cartQty?: number;
	onClick: () => void;
}

export function MenuPosCard({
	name,
	color,
	price,
	available = true,
	cartQty,
	onClick,
}: MenuPosCardProps) {
	return (
		<button
			type="button"
			data-testid="menu-pos-card"
			onClick={() => available && onClick()}
			disabled={!available}
			className={cn(
				"group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-all",
				available
					? "hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
					: "opacity-50",
			)}
		>
			<div
				className={cn(
					"relative flex aspect-[4/3] items-center justify-center text-2xl font-bold",
					color,
				)}
			>
				{name.charAt(0)}
				{!available && (
					<div className="absolute inset-0 grid place-items-center bg-foreground/30 backdrop-blur-sm">
						<span className="rounded-full bg-destructive px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
							Sold out
						</span>
					</div>
				)}
				{cartQty != null && cartQty > 0 && (
					<span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow">
						{cartQty}
					</span>
				)}
			</div>
			<div className="p-2.5">
				<p className="truncate text-xs font-semibold leading-tight">{name}</p>
				<p className="mt-0.5 text-xs font-bold tabular-nums text-primary">
					{formatETB(price)}
				</p>
			</div>
		</button>
	);
}
