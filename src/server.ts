import {
	createStartHandler,
	defaultStreamHandler,
} from "@tanstack/react-start/server";
import { auth } from "./lib/auth";

const startFetch = createStartHandler(defaultStreamHandler);

export default {
	async fetch(request: Request) {
		const url = new URL(request.url);
		if (url.pathname.startsWith("/api/auth/")) {
			return auth.handler(request);
		}
		return startFetch(request);
	},
};
