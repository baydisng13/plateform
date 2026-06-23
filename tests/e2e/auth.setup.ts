import { test as setup, expect } from "@playwright/test";
import path from "node:path";

const authFile = path.join(import.meta.dirname, ".auth/user.json");

setup("authenticate as owner", async ({ page }) => {
	await page.goto("/auth/login");
	await page.getByLabel(/email/i).fill("baydisng13@gmail.com");
	await page.getByLabel(/password/i).fill("ZAQ!1qaz");
	await page.getByRole("button", { name: /sign in|log in/i }).click();
	await expect(page).toHaveURL("/", { timeout: 10_000 });
	await page.context().storageState({ path: authFile });
});
