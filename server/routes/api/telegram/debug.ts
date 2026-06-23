import { defineEventHandler } from "nitro/h3";
import { db } from "../../../../src/db";
import { telegramSettings } from "../../../../src/db/schema";
import { decrypt } from "../../../../src/lib/encrypt";

export default defineEventHandler(async (_event) => {
	const result: Record<string, unknown> = {};

	try {
		const [s] = await db.select().from(telegramSettings).limit(1);
		result.hasRow = !!s;
		result.hasToken = !!s?.botTokenEncrypted;
		result.contacts = s?.contacts ?? [];
		result.ownerChatIds = s?.ownerChatIds ?? [];

		if (s?.botTokenEncrypted) {
			try {
				const token = decrypt(s.botTokenEncrypted);
				result.decryptOk = true;
				result.tokenPrefix = token.slice(0, 10) + "...";

				const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
				const json = (await res.json()) as { ok: boolean; result?: { username: string; id: number }; description?: string };
				result.telegramGetMe = json.ok ? { ok: true, username: json.result?.username, id: json.result?.id } : { ok: false, error: json.description };
			} catch (e) {
				result.decryptOk = false;
				result.decryptError = String(e);
			}
		}
	} catch (e) {
		result.dbError = String(e);
	}

	return result;
});
