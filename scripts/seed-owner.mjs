import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { scryptAsync } from "/Users/macbookairm4/Documents/personal/plateform/plateform/node_modules/.pnpm/@noble+hashes@2.2.0/node_modules/@noble/hashes/scrypt.js";

// Load .env manually
const env = Object.fromEntries(
	readFileSync(new URL("../.env", import.meta.url), "utf8")
		.split("\n")
		.filter((l) => l.includes("=") && !l.startsWith("#"))
		.map((l) => {
			const idx = l.indexOf("=");
			return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
		}),
);

const sql = neon(env.DATABASE_URL);

const NAME = "Admin";
const EMAIL = "baydisng13@gmail.com";
const PASSWORD = "ZAQ!1qaz";

// Better Auth exact params from @better-auth/utils password.mjs
const SCRYPT_CONFIG = { N: 16384, r: 16, p: 1, dkLen: 64 };

function hexEncode(bytes) {
	return Buffer.from(bytes).toString("hex");
}

async function hashPassword(password) {
	const saltBytes = randomBytes(16);
	const salt = hexEncode(saltBytes);
	const key = await scryptAsync(password.normalize("NFKC"), salt, SCRYPT_CONFIG);
	return `${salt}:${hexEncode(key)}`;
}

// Delete any existing user with this email
await sql`DELETE FROM "account" WHERE account_id = ${EMAIL}`;
await sql`DELETE FROM "user" WHERE email = ${EMAIL}`;

const userId = randomBytes(16).toString("hex");
const hashedPassword = await hashPassword(PASSWORD);

await sql`
	INSERT INTO "user" (id, name, email, email_verified, role, created_at, updated_at)
	VALUES (${userId}, ${NAME}, ${EMAIL}, true, 'owner', NOW(), NOW())
`;

const accountId = randomBytes(16).toString("hex");
await sql`
	INSERT INTO "account" (id, account_id, provider_id, user_id, password, created_at, updated_at)
	VALUES (${accountId}, ${EMAIL}, 'credential', ${userId}, ${hashedPassword}, NOW(), NOW())
`;

console.log("✅ Owner created:", userId, EMAIL);
process.exit(0);
