import { readFileSync } from "node:fs";
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

const [existing] = await sql`SELECT id FROM restaurant_settings LIMIT 1`;
if (existing) {
	await sql`UPDATE restaurant_settings SET name = 'PlateForm', updated_at = NOW() WHERE id = 'singleton'`;
	console.log("Updated restaurant name -> PlateForm");
} else {
	await sql`INSERT INTO restaurant_settings (id, name, created_at, updated_at) VALUES ('singleton', 'PlateForm', NOW(), NOW())`;
	console.log("Seeded restaurant name -> PlateForm");
}
