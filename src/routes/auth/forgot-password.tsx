import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/forgot-password")({
	head: () => ({ meta: [{ title: "Forgot Password — PlateForm" }] }),
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [sent, setSent] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		await authClient.forgetPassword({
			email,
			redirectTo: `${window.location.origin}/auth/reset-password`,
		});
		setLoading(false);
		setSent(true);
	};

	return (
		<div className="grid min-h-screen place-items-center bg-muted/30 px-4">
			<div className="w-full max-w-sm">
				<div className="mb-8 text-center">
					<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
						P
					</div>
					<h1 className="text-xl font-bold">Reset your password</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						We'll send a reset link to your email
					</p>
				</div>

				<div className="rounded-3xl border bg-card p-8 shadow-sm">
					{sent ? (
						<div className="text-center">
							<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
								📧
							</div>
							<p className="font-semibold">Check your inbox</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Reset link sent to <strong>{email}</strong>
							</p>
							<a
								href="/auth/login"
								className="mt-4 block text-sm text-primary hover:underline"
							>
								Back to sign in
							</a>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-1.5">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="you@example.com"
									required
								/>
							</div>
							<Button type="submit" className="w-full" disabled={loading}>
								{loading ? "Sending…" : "Send Reset Link"}
							</Button>
							<a
								href="/auth/login"
								className="block text-center text-sm text-muted-foreground hover:text-foreground"
							>
								Back to sign in
							</a>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}
