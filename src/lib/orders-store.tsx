import { createContext, useContext, useState, type ReactNode } from "react";
import {
	orders as initialOrders,
	type Order,
	type OrderLine,
	type ItemKitchenStatus,
} from "./mock-data";

interface OrdersStore {
	orders: Order[];
	addOrder: (order: Order) => void;
	updateOrder: (id: string, updates: Partial<Order>) => void;
	removeOrder: (id: string) => void;
	appendItems: (orderId: string, items: OrderLine[]) => void;
	updateItemStatus: (orderId: string, menuItemId: string, status: ItemKitchenStatus) => void;
}

const OrdersContext = createContext<OrdersStore>(null!);

export function OrdersProvider({ children }: { children: ReactNode }) {
	const [orders, setOrders] = useState<Order[]>(initialOrders);

	const addOrder = (order: Order) =>
		setOrders((prev) => [order, ...prev]);

	const updateOrder = (id: string, updates: Partial<Order>) =>
		setOrders((prev) =>
			prev.map((o) => {
				if (o.id !== id) return o;
				const next = { ...o, ...updates };
				// stamp items with waiting status when first sent to kitchen
				if (updates.status === "in_kitchen" && o.status !== "in_kitchen") {
					next.items = next.items.map((item) =>
						item.kitchenStatus ? item : { ...item, kitchenStatus: "waiting" as const },
					);
				}
				return next;
			}),
		);

	const removeOrder = (id: string) =>
		setOrders((prev) => prev.filter((o) => o.id !== id));

	const appendItems = (orderId: string, newItems: OrderLine[]) =>
		setOrders((prev) =>
			prev.map((o) => {
				if (o.id !== orderId) return o;
				const merged = [...o.items];
				for (const ni of newItems) {
					const idx = merged.findIndex((x) => x.menuItemId === ni.menuItemId);
					if (idx >= 0)
						merged[idx] = { ...merged[idx], qty: merged[idx].qty + ni.qty };
					else merged.push({ ...ni, kitchenStatus: o.status === "in_kitchen" ? "waiting" : undefined });
				}
				return { ...o, items: merged };
			}),
		);

	const updateItemStatus = (orderId: string, menuItemId: string, status: ItemKitchenStatus) =>
		setOrders((prev) =>
			prev.map((o) => {
				if (o.id !== orderId) return o;
				return {
					...o,
					items: o.items.map((item) =>
						item.menuItemId === menuItemId ? { ...item, kitchenStatus: status } : item,
					),
				};
			}),
		);

	return (
		<OrdersContext.Provider
			value={{ orders, addOrder, updateOrder, removeOrder, appendItems, updateItemStatus }}
		>
			{children}
		</OrdersContext.Provider>
	);
}

export const useOrders = () => useContext(OrdersContext);
