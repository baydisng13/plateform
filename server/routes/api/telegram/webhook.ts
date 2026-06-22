import { defineEventHandler, readBody, getHeader, createError } from "nitro/h3";

export default defineEventHandler(async (event) => {
	console.log("[telegram webhook] received request");

	const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
	if (secret) {
		const header = getHeader(event, "x-telegram-bot-api-secret-token");
		if (header !== secret) {
			throw createError({ statusCode: 401, message: "Invalid webhook secret" });
		}
	}

	const body = await readBody(event);

	try {
		const { handleWebhookUpdate } = await import("../../../../src/lib/server/telegram");
		await handleWebhookUpdate(body);
	} catch (err) {
		console.error("[telegram webhook] error:", err);
	}

	return { ok: true };
});
