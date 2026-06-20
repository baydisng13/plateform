import { db } from "@/db";
import { telegramSettings } from "@/db/schema";
import { decrypt } from "@/lib/encrypt";
import { Bot } from "grammy";

let _bot: Bot | null = null;

async function getBot(): Promise<Bot | null> {
	try {
		const [settings] = await db.select().from(telegramSettings).limit(1);
		if (!settings?.botTokenEncrypted) return null;
		const token = decrypt(settings.botTokenEncrypted);
		if (!_bot) _bot = new Bot(token);
		return _bot;
	} catch {
		return null;
	}
}

async function getChatIds(): Promise<string[]> {
	try {
		const [settings] = await db.select().from(telegramSettings).limit(1);
		if (!settings) return [];
		return [
			...(settings.ownerChatIds ?? []),
			...(settings.chefChatIds ?? []),
		];
	} catch {
		return [];
	}
}

export async function sendTelegramNotification(message: string): Promise<void> {
	try {
		const bot = await getBot();
		if (!bot) return;
		const chatIds = await getChatIds();
		await Promise.allSettled(chatIds.map((id) => bot.api.sendMessage(id, message)));
	} catch {
		// Telegram is best-effort — never block order flow
	}
}

export async function sendToWaiters(message: string): Promise<void> {
	try {
		const bot = await getBot();
		if (!bot) return;
		const [settings] = await db.select().from(telegramSettings).limit(1);
		const chatIds = settings?.waiterChatIds ?? [];
		await Promise.allSettled(chatIds.map((id) => bot.api.sendMessage(id, message)));
	} catch {}
}

export async function sendToOwner(message: string): Promise<void> {
	try {
		const bot = await getBot();
		if (!bot) return;
		const [settings] = await db.select().from(telegramSettings).limit(1);
		const chatIds = settings?.ownerChatIds ?? [];
		await Promise.allSettled(chatIds.map((id) => bot.api.sendMessage(id, message)));
	} catch {}
}

// Reset cached bot instance when token changes
export function resetBotCache(): void {
	_bot = null;
}
