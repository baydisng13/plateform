import { defineEventHandler, readBody, getHeader, createError } from "nitro/h3";
import { handleWebhookUpdate } from "../../../../src/lib/server/telegram";

export default defineEventHandler(async (event) => {
	const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
	if (secret) {
		const header = getHeader(event, "x-telegram-bot-api-secret-token");
		if (header !== secret) {
			throw createError({ statusCode: 401, message: "Invalid webhook secret" });
		}
	}

	const body = await readBody(event);

	try {
		await handleWebhookUpdate(body);
	} catch (err) {
		console.error("[telegram webhook] handleWebhookUpdate error:", err);
	}

	return { ok: true };
});
