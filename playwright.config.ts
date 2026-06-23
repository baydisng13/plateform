import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: 1,
	reporter: process.env.CI ? "github" : "list",
	timeout: 60_000,
	use: {
		baseURL: "http://localhost:4000",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "setup",
			testMatch: "**/auth.setup.ts",
		},
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				storageState: "tests/e2e/.auth/user.json",
			},
			dependencies: ["setup"],
		},
	],
	webServer: {
		command: "pnpm dev --port 4000",
		url: "http://localhost:4000",
		reuseExistingServer: true,
		timeout: 120_000,
	},
});
