import { cn } from "@/lib/utils";
import type { OrderStatus, OrderType } from "@/lib/mock-data";
import { statusLabel, typeLabel } from "@/lib/mock-data";

const statusStyle: Record<OrderStatus, string> = {
	awaiting: "bg-status-awaiting-bg text-status-awaiting",
	pending: "bg-status-pending-bg text-status-pending",
	in_kitchen: "bg-status-kitchen-bg text-status-kitchen",
	ready: "bg-primary/15 text-primary",
	completed: "bg-status-done-bg text-status-done",
};

export function StatusPill({ status }: { status: OrderStatus }) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
				statusStyle[status],
			)}
		>
			{statusLabel[status]}
		</span>
	);
}

const typeStyle: Record<OrderType, string> = {
	dine_in: "bg-blue-50 text-blue-700",
	takeaway: "bg-amber-50 text-amber-700",
	delivery: "bg-violet-50 text-violet-700",
	online: "bg-orange-50 text-orange-700",
};

export function TypePill({ type }: { type: OrderType }) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
				typeStyle[type],
			)}
		>
			{typeLabel[type]}
		</span>
	);
}
