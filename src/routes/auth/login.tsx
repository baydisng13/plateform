import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/login")({
	head: () => ({ meta: [{ title: "Sign In — PlateForm" }] }),
	beforeLoad: async ({ context }) => {
		if (context.session?.user) throw redirect({ to: "/" });
	},
	component: LoginPage,
});

function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		const result = await signIn.email({ email, password });
		setLoading(false);
		if (result.error) {
			setError(result.error.message ?? "Invalid credentials");
		} else {
			await router.navigate({ to: "/" });
		}
	};

	return (
		<div className="grid min-h-screen place-items-center bg-muted/30 px-4">
			<div className="w-full max-w-sm">
				<div className="mb-8 text-center">
					<div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
						P
					</div>
					<h1 className="text-xl font-bold">Welcome back</h1>
					<p className="mt-1 text-sm text-muted-foreground">Sign in to PlateForm</p>
				</div>

				<form onSubmit={handleSubmit} className="rounded-3xl border bg-card p-8 shadow-sm">
					<div className="space-y-4">
						<div className="space-y-1.5">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								autoComplete="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
								required
							/>
						</div>
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label htmlFor="password">Password</Label>
								<a
									href="/auth/forgot-password"
									className="text-xs text-muted-foreground hover:text-foreground"
								>
									Forgot password?
								</a>
							</div>
							<Input
								id="password"
								type="password"
								autoComplete="current-password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
								required
							/>
						</div>
						{error && (
							<p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
								{error}
							</p>
						)}
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Signing in…" : "Sign In"}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
