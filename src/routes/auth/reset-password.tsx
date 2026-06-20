import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/reset-password")({
	head: () => ({ meta: [{ title: "Set New Password — PlateForm" }] }),
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const router = useRouter();
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (password !== confirm) { setError("Passwords don't match"); return; }
		if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
		setError("");
		setLoading(true);
		const result = await authClient.resetPassword({ newPassword: password });
		setLoading(false);
		if (result.error) {
			setError(result.error.message ?? "Failed to reset password");
		} else {
			await router.navigate({ to: "/auth/login" });
		}
	};

	return (
		<div className="grid min-h-screen place-items-center bg-muted/30 px-4">
			<div className="w-full max-w-sm">
				<div className="mb-8 text-center">
					<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
						P
					</div>
					<h1 className="text-xl font-bold">Set new password</h1>
					<p className="mt-1 text-sm text-muted-foreground">Choose a strong password</p>
				</div>

				<form onSubmit={handleSubmit} className="rounded-3xl border bg-card p-8 shadow-sm space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="password">New Password</Label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Min. 8 characters"
							required
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="confirm">Confirm Password</Label>
						<Input
							id="confirm"
							type="password"
							value={confirm}
							onChange={(e) => setConfirm(e.target.value)}
							placeholder="Repeat password"
							required
						/>
					</div>
					{error && (
						<p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{error}
						</p>
					)}
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Saving…" : "Set Password"}
					</Button>
				</form>
			</div>
		</div>
	);
}
