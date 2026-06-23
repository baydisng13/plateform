import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { auth } from "@/lib/auth";
import { getRestaurantSettings } from "@/lib/server/settings";
import { RestaurantContext } from "@/lib/restaurant-context";

const getSession = createServerFn({ method: "GET" }).handler(async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	return session;
});

export const Route = createFileRoute("/_auth")({
	beforeLoad: async ({ context, location }) => {
		const session = await getSession({ data: undefined });
		if (!session?.user) {
			throw redirect({
				to: "/auth/login",
				search: { redirect: location.href },
			});
		}
		return { session };
	},
	loader: () => getRestaurantSettings(),
	component: AuthLayout,
});

function AuthLayout() {
	const settings = Route.useLoaderData();
	const name = settings?.name ?? "PlateForm";
	const initial = name.charAt(0).toUpperCase();
	return (
		<RestaurantContext.Provider value={{ initial, name }}>
			<Outlet />
		</RestaurantContext.Provider>
	);
}
