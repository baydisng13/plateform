import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { env } from "@/env";
import * as schema from "@/db/schema";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification,
		},
	}),

	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,

	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		sendResetPassword: async ({ user: u, url }) => {
			const { Resend } = await import("resend");
			const resend = new Resend(env.RESEND_API_KEY);
			await resend.emails.send({
				from: env.RESEND_FROM_EMAIL,
				to: u.email,
				subject: "Reset your password — PlateForm",
				html: `
					<p>Hi ${u.name},</p>
					<p>Click the link below to reset your password. This link expires in 1 hour.</p>
					<p><a href="${url}" style="color:#16a34a;font-weight:bold;">Reset Password</a></p>
					<p style="color:#6b7280;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
				`,
			});
		},
	},

	user: {
		additionalFields: {
			role: {
				type: "string",
				defaultValue: "waiter",
				input: false,
			},
		},
	},

	trustedOrigins: [env.BETTER_AUTH_URL],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
