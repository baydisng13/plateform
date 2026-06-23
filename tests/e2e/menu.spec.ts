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

	test("can open availability toggle dialog and cancel", async ({ page }) => {
		await page.goto("/menu");
		const firstCard = page.locator("[data-testid='menu-manage-card']").first();
		await expect(firstCard).toBeVisible();
		// JS-click the hidden toggle button inside the hover overlay
		await firstCard.locator("[data-testid='menu-toggle-btn']").evaluate((el) =>
			(el as HTMLElement).click(),
		);
		await expect(page.getByRole("alertdialog")).toBeVisible();
		await page.getByRole("button", { name: /cancel/i }).click();
		await expect(page.getByRole("alertdialog")).not.toBeVisible();
	});

	test("can open add item dialog", async ({ page }) => {
		await page.goto("/menu");
		await page.getByRole("button", { name: "New Item" }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
		await page.keyboard.press("Escape");
	});

	test("add item dialog validates required fields", async ({ page }) => {
		await page.goto("/menu");
		await page.getByRole("button", { name: "New Item" }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
		await page.getByRole("button", { name: /add item|save/i }).click();
		// Dialog stays open on validation failure
		await expect(page.getByRole("dialog")).toBeVisible();
	});
});
