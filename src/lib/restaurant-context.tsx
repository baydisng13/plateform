import { createContext, useContext } from "react";

export const RestaurantContext = createContext<{ initial: string; name: string }>({
	initial: "P",
	name: "PlateForm",
});

export const useRestaurant = () => useContext(RestaurantContext);
