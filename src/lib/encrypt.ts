import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "@/env";

const ALGO = "aes-256-gcm";
const KEY = Buffer.from(env.ENCRYPTION_KEY, "hex");

export function encrypt(plain: string): string {
	const iv = randomBytes(12);
	const cipher = createCipheriv(ALGO, KEY, iv);
	const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
	const tag = cipher.getAuthTag();
	return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decrypt(encoded: string): string {
	const buf = Buffer.from(encoded, "base64");
	const iv = buf.subarray(0, 12);
	const tag = buf.subarray(12, 28);
	const encrypted = buf.subarray(28);
	const decipher = createDecipheriv(ALGO, KEY, iv);
	decipher.setAuthTag(tag);
	return decipher.update(encrypted) + decipher.final("utf8");
}
