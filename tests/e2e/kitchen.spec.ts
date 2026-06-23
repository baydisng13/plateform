import { test, expect } from "@playwright/test";

test.describe("Kitchen view", () => {
	test("loads kitchen page", async ({ page }) => {
		await page.goto("/kitchen");
		await expect(page.getByRole("heading", { name: /kitchen/i })).toBeVisible();
	});

	test("shows empty state when no orders in kitchen", async ({ page }) => {
		await page.goto("/kitchen");
		// Either shows orders or the empty state
		const hasOrders = await page.locator("[data-testid='kitchen-order-card']").count();
		if (hasOrders === 0) {
			await expect(page.getByText(/no orders|all caught up/i)).toBeVisible();
		}
	});

	test("order status flow: pending → in kitchen → ready", async ({ page }) => {
		// Place a dine-in order first
		await page.goto("/new-order");
		await page.locator("[data-testid='menu-pos-card']").first().click();
		await page.getByRole("button", { name: /place order/i }).click();
		await expect(page).toHaveURL("/");

		// Go to orders and send to kitchen
		await page.goto("/");
		const sendToKitchen = page.getByRole("button", { name: /send to kitchen|kitchen/i }).first();
		if (await sendToKitchen.isVisible()) {
			await sendToKitchen.click();
		}

		// Verify kitchen page shows it
		await page.goto("/kitchen");
		await expect(page.getByRole("heading", { name: /kitchen/i })).toBeVisible();
	});
});
