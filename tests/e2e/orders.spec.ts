import { test, expect } from "@playwright/test";

test.describe("Order creation", () => {
	test("navigates to new order page", async ({ page }) => {
		await page.goto("/new-order");
		await expect(page.getByRole("heading", { name: /new order/i })).toBeVisible();
	});

	test("can select dine-in and choose a table", async ({ page }) => {
		await page.goto("/new-order");
		await page.getByRole("button", { name: /dine.?in/i }).click();
		const tableBtn = page.getByRole("button", { name: "1" }).first();
		await tableBtn.click();
		await expect(tableBtn).toHaveClass(/bg-primary/);
	});

	test("can add items to cart", async ({ page }) => {
		await page.goto("/new-order");
		const firstItem = page.locator("[data-testid='menu-pos-card']").first();
		await firstItem.click();
		await expect(page.getByText(/1 item/i)).toBeVisible();
	});

	test("place order button disabled when cart empty", async ({ page }) => {
		await page.goto("/new-order");
		await expect(page.getByRole("button", { name: /place order/i })).toBeDisabled();
	});

	test("can place a takeaway order and redirects to orders page", async ({ page }) => {
		await page.goto("/new-order");
		await page.getByRole("button", { name: /takeaway/i }).click();
		await page.getByPlaceholder(/customer phone/i).fill("+251912345678");

		// Add first available item
		await page.locator("[data-testid='menu-pos-card']").first().click();

		await page.getByRole("button", { name: /place order/i }).click();
		await expect(page).toHaveURL("/", { timeout: 10_000 });
	});
});

test.describe("Orders list", () => {
	test("loads orders page", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("heading", { name: /orders/i })).toBeVisible();
	});

	test("shows filter tabs", async ({ page }) => {
		await page.goto("/");
		await expect(page.getByRole("button", { name: /all/i })).toBeVisible();
	});
});
