import { getRequest } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";

type Role = "owner" | "waiter" | "chef";

export async function requireAuth() {
	const request = getRequest();
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session?.user) throw new Error("Unauthorized");
	return session.user as typeof session.user & { role: Role };
}

export async function requireRole(...roles: Role[]) {
	const user = await requireAuth();
	if (!roles.includes(user.role as Role)) throw new Error("Forbidden");
	return user;
}

export async function requireOwner() {
	return requireRole("owner");
}
