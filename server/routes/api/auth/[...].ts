import { defineEventHandler, toRequest } from "nitro/h3";
import { auth } from "../../../../src/lib/auth";

export default defineEventHandler(async (event) => {
	const request = toRequest(event);
	return auth.handler(request);
});
