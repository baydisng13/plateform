import { test, expect } from "@playwright/test";

test.describe("Menu management", () => {
	test("loads menu page", async ({ page }) => {
		await page.goto("/menu");
		await expect(page.getByRole("heading", { name: /menu/i })).toBeVisible();
	});

	test("shows menu items", async ({ page }) => {
		await page.goto("/menu");
		await expect(page.locator("[data-testid='menu-manage-card']").first()).toBeVisible();
	});

	test("can toggle item availability", async ({ page }) => {
		await page.goto("/menu");
		const firstToggle = page.getByRole("button", { name: /available|sold out/i }).first();
		await expect(firstToggle).toBeVisible();
		await firstToggle.click();
		// Dialog appears
		await expect(page.getByRole("alertdialog")).toBeVisible();
		// Cancel to avoid mutating data
		await page.getByRole("button", { name: /cancel/i }).click();
	});

	test("can open add item dialog", async ({ page }) => {
		await page.goto("/menu");
		await page.getByRole("button", { name: /add item/i }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
		await expect(page.getByRole("heading", { name: /add|new item/i })).toBeVisible();
		await page.keyboard.press("Escape");
	});

	test("add item dialog validates required fields", async ({ page }) => {
		await page.goto("/menu");
		await page.getByRole("button", { name: /add item/i }).click();
		await page.getByRole("button", { name: /save|create/i }).click();
		// Should stay open (validation fails)
		await expect(page.getByRole("dialog")).toBeVisible();
	});
});
