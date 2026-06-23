import { test, expect } from "@playwright/test";

test.describe("Settings navigation", () => {
	test("loads settings page", async ({ page }) => {
		await page.goto("/settings");
		await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();
	});

	test("can navigate to restaurant settings", async ({ page }) => {
		await page.goto("/settings/restaurant");
		await expect(page.getByRole("heading", { name: /restaurant/i })).toBeVisible();
	});

	test("restaurant settings shows name field", async ({ page }) => {
		await page.goto("/settings/restaurant");
		await expect(page.getByLabel(/restaurant name/i)).toBeVisible();
	});

	test("can navigate to tables settings", async ({ page }) => {
		await page.goto("/settings/tables");
		await expect(page.getByRole("heading", { name: /tables/i })).toBeVisible();
	});

	test("tables page shows seeded tables", async ({ page }) => {
		await page.goto("/settings/tables");
		await expect(page.getByText(/table.*1|#1/i).first()).toBeVisible();
	});

	test("can open add table dialog", async ({ page }) => {
		await page.goto("/settings/tables");
		await page.getByRole("button", { name: /add table/i }).click();
		await expect(page.getByRole("dialog")).toBeVisible();
		await page.keyboard.press("Escape");
	});

	test("can navigate to expense categories", async ({ page }) => {
		await page.goto("/settings/expense-categories");
		await expect(page.getByRole("heading", { name: /expense/i })).toBeVisible();
	});

	test("can navigate to staff settings", async ({ page }) => {
		await page.goto("/settings/staff");
		await expect(page.getByRole("heading", { name: /staff/i })).toBeVisible();
	});
});
