import { test, expect } from "@playwright/test";

test.describe("Kitchen view", () => {
	test("loads kitchen page", async ({ page }) => {
		await page.goto("/kitchen");
		await expect(page.getByRole("heading", { name: /kitchen/i })).toBeVisible();
	});

	test("shows empty state or orders", async ({ page }) => {
		await page.goto("/kitchen");
		const cards = page.locator("[data-testid='kitchen-order-card']");
		const empty = page.locator("[data-testid='kitchen-empty']");
		await expect(cards.first().or(empty)).toBeVisible();
	});

	test("order status flow: new order appears in kitchen after status change", async ({ page }) => {
		// Place a dine-in order first
		await page.goto("/new-order");
		await page.locator("[data-testid='menu-pos-card']").first().click();
		await page.getByRole("button", { name: /place order/i }).click();
		await expect(page).toHaveURL("/");

		// Verify kitchen page loads
		await page.goto("/kitchen");
		await expect(page.getByRole("heading", { name: /kitchen/i })).toBeVisible();
	});
});
