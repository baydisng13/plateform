import { defineEventHandler } from "nitro/h3";

export default defineEventHandler(() => {
	return { status: "ok", timestamp: new Date().toISOString() };
});
