import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		SERVER_URL: z.string().url().optional(),
		DATABASE_URL: z.string(),
		RESEND_API_KEY: z.string(),
		RESEND_FROM_EMAIL: z.string().email(),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.string().url(),
		ENCRYPTION_KEY: z.string().length(64),

	},

	clientPrefix: "VITE_",

	client: {
		VITE_APP_TITLE: z.string().min(1).optional(),
		VITE_APP_URL: z.string().url().optional(),
	},

	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true,
});
