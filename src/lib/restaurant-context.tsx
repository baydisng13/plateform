import { createContext, useContext } from "react";

export interface RestaurantInfo {
	initial: string;
	name: string;
	ordersCount: number;
	kitchenCount: number;
}

export const RestaurantContext = createContext<RestaurantInfo>({
	initial: "P",
	name: "PlateForm",
	ordersCount: 0,
	kitchenCount: 0,
});

export const useRestaurant = () => useContext(RestaurantContext);
