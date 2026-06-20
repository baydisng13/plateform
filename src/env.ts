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

	runtimeEnv: {
		SERVER_URL: process.env.SERVER_URL,
		DATABASE_URL: process.env.DATABASE_URL,
		RESEND_API_KEY: process.env.RESEND_API_KEY,
		RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
		BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
		ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
		VITE_APP_TITLE: import.meta.env.VITE_APP_TITLE,
		VITE_APP_URL: import.meta.env.VITE_APP_URL,
	},
	emptyStringAsUndefined: true,
});
