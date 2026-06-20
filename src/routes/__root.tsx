import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { Session } from "@/lib/auth";
import appCss from "../styles.css?url";

const SITE_TITLE = "PlateForm";
const SITE_DESCRIPTION = "Restaurant management system.";

interface RouterContext {
	queryClient: QueryClient;
	session: Session | null;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{ title: SITE_TITLE },
			{ name: "description", content: SITE_DESCRIPTION },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	component: RootLayout,
});

function RootLayout() {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<Outlet />
				<Toaster richColors position="top-right" />
				<TanStackDevtools
					config={{ position: "bottom-right" }}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
