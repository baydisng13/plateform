import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq, ne } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { env } from "@/env";

export const getStaff = createServerFn({ method: "GET" }).handler(async () => {
	return db.select({
		id: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
		createdAt: user.createdAt,
	}).from(user);
});

export const inviteStaff = createServerFn({ method: "POST" })
	.inputValidator(
		z.object({
			name: z.string().min(1),
			email: z.string().email(),
			role: z.enum(["owner", "waiter", "chef"]),
		}),
	)
	.handler(async ({ data }) => {
		// Create user with a temporary password; they must reset via email
		const tempPassword = Math.random().toString(36).slice(-12) + "A1!";
		await auth.api.signUpEmail({
			body: {
				name: data.name,
				email: data.email,
				password: tempPassword,
			},
		});

		// Set role
		const [created] = await db.select().from(user).where(eq(user.email, data.email)).limit(1);
		if (created) {
			await db.update(user).set({ role: data.role }).where(eq(user.id, created.id));
		}

		// Send password reset so they can set their own password
		await auth.api.forgetPassword({
			body: { email: data.email, redirectTo: `${env.BETTER_AUTH_URL}/reset-password` },
		});

		return { success: true };
	});

export const updateStaffRole = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string(), role: z.enum(["owner", "waiter", "chef"]) }))
	.handler(async ({ data }) => {
		const [updated] = await db
			.update(user)
			.set({ role: data.role })
			.where(eq(user.id, data.id))
			.returning();
		return updated;
	});

export const deactivateStaff = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		// Delete user — Better Auth cascades sessions/accounts
		await db.delete(user).where(eq(user.id, data.id));
	});
