import { db } from "../src/db";
import { user } from "../src/db/schema";
import { auth } from "../src/lib/auth";
import { eq } from "drizzle-orm";

const NAME = "Admin";
const EMAIL = "baydisng13@gmail.com";
const PASSWORD = "ZAQ!1qaz";

async function main() {
	await auth.api.signUpEmail({
		body: { name: NAME, email: EMAIL, password: PASSWORD },
	});

	await db.update(user).set({ role: "owner" }).where(eq(user.email, EMAIL));

	const [created] = await db.select().from(user).where(eq(user.email, EMAIL));
	console.log("Owner created:", created.id, created.email, created.role);
	process.exit(0);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
