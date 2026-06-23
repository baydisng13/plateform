import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { neon } from "@neondatabase/serverless";

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

const tables = [1, 2, 3, 4, 5, 6];

for (const number of tables) {
	const id = randomBytes(8).toString("hex");
	await sql`
		INSERT INTO "tables" (id, number, created_at)
		VALUES (${id}, ${number}, NOW())
		ON CONFLICT (number) DO NOTHING
	`;
	console.log(`✅ Table ${number} seeded`);
}

process.exit(0);
