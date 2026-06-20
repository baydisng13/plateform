import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { getExpenses, createExpense } from "@/lib/server/expenses";
import { getExpenseCategories } from "@/lib/server/settings";
import { formatETB } from "@/lib/utils";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_auth/expenses")({
	head: () => ({ meta: [{ title: "Expenses — PlateForm" }] }),
	loader: async () => {
		const [expenses, categories] = await Promise.all([
			getExpenses({ data: undefined }),
			getExpenseCategories(),
		]);
		return { expenses, categories };
	},
	component: ExpensesPage,
});

function ExpensesPage() {
	const { expenses, categories } = Route.useLoaderData();
	const router = useRouter();
	const [catFilter, setCatFilter] = useState<string>("all");
	const [dialogOpen, setDialogOpen] = useState(false);

	const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
	const visible = expenses.filter((e) => catFilter === "all" || e.categoryId === catFilter);
	const total = visible.reduce((s, e) => s + e.amount, 0);
	const monthTotal = expenses.reduce((s, e) => s + e.amount, 0);

	const byCat = categories.map((c) => ({
		id: c.id,
		name: c.name,
		value: expenses.filter((e) => e.categoryId === c.id).reduce((s, e) => s + e.amount, 0),
	}));

	const handleAddExpense = async (data: { amount: number; categoryId: string; description: string }) => {
		await createExpense({ data: { ...data, date: new Date().toISOString() } });
		setDialogOpen(false);
		router.invalidate();
	};

	return (
		<AppShell>
			<PageHeader
				title="Expenses"
				subtitle="Log and review business expenses"
				right={
					<Button onClick={() => setDialogOpen(true)} size="sm">
						<Plus className="size-4" strokeWidth={2.5} />
						Log Expense
					</Button>
				}
			/>
			<div className="flex flex-1 overflow-hidden">
				<div className="flex-1 overflow-y-auto p-6">
					<div className="grid grid-cols-3 gap-4">
						<KPI label="This Month" value={formatETB(monthTotal)} sub={`${expenses.length} entries`} />
						<KPI label="Filtered Total" value={formatETB(total)} sub={`${visible.length} entries`} />
						<KPI
							label="Avg / Entry"
							value={formatETB(monthTotal / Math.max(expenses.length, 1))}
							sub="All categories"
						/>
					</div>

					<div className="mt-6 flex flex-wrap gap-2">
						{[{ id: "all", name: "All" }, ...categories].map((c) => (
							<button
								key={c.id}
								type="button"
								onClick={() => setCatFilter(c.id)}
								className={cn(
									"rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
									catFilter === c.id
										? "bg-foreground text-background"
										: "bg-muted text-muted-foreground hover:text-foreground",
								)}
							>
								{c.name}
							</button>
						))}
					</div>

					<div className="mt-4 overflow-hidden rounded-2xl border bg-card">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-muted/60 text-left">
									<th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Description</th>
									<th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Category</th>
									<th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Date</th>
									<th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
								</tr>
							</thead>
							<tbody>
								{visible.length === 0 ? (
									<tr>
										<td colSpan={4} className="px-5 py-12 text-center text-sm text-muted-foreground">
											No expenses found.
										</td>
									</tr>
								) : (
									visible.map((e) => (
										<tr key={e.id} className="border-b last:border-0">
											<td className="px-5 py-4 font-medium">{e.description ?? "—"}</td>
											<td className="px-5 py-4">
												<span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
													{e.categoryId ? (catMap[e.categoryId] ?? "Unknown") : "Uncategorized"}
												</span>
											</td>
											<td className="px-5 py-4 text-muted-foreground">
												{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
											</td>
											<td className="px-5 py-4 text-right font-bold tabular-nums">{formatETB(e.amount)}</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>

				<aside className="hidden w-72 shrink-0 border-l bg-card p-6 lg:block">
					<h2 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
						Breakdown
					</h2>
					<div className="space-y-3">
						{byCat
							.sort((a, b) => b.value - a.value)
							.map((c) => {
								const pct = monthTotal === 0 ? 0 : (c.value / monthTotal) * 100;
								return (
									<div key={c.id}>
										<div className="mb-1 flex justify-between text-xs">
											<span className="font-semibold">{c.name}</span>
											<span className="font-mono tabular-nums text-muted-foreground">{formatETB(c.value)}</span>
										</div>
										<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
											<div className="h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} />
										</div>
									</div>
								);
							})}
					</div>
				</aside>
			</div>

			<LogExpenseDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onSave={handleAddExpense}
				categories={categories}
			/>
		</AppShell>
	);
}

function KPI({ label, value, sub }: { label: string; value: string; sub: string }) {
	return (
		<div className="rounded-2xl border bg-card p-5 shadow-sm">
			<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
			<p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
			<p className="mt-1 text-xs text-muted-foreground">{sub}</p>
		</div>
	);
}

function LogExpenseDialog({
	open,
	onClose,
	onSave,
	categories,
}: {
	open: boolean;
	onClose: () => void;
	onSave: (e: { amount: number; categoryId: string; description: string }) => Promise<void>;
	categories: Array<{ id: string; name: string }>;
}) {
	const [amount, setAmount] = useState("");
	const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
	const [description, setDescription] = useState("");
	const [saving, setSaving] = useState(false);

	const handleSave = async () => {
		if (!amount || !description) return;
		setSaving(true);
		await onSave({ amount: Number(amount), categoryId, description });
		setSaving(false);
		setAmount("");
		setDescription("");
	};

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Log Expense</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 px-8 pb-8 pt-2">
					<div className="space-y-1.5">
						<Label htmlFor="exp-desc">Description</Label>
						<Input
							id="exp-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="e.g. Mango, avocado (Shola Market)"
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label>Category</Label>
							<Select value={categoryId} onValueChange={setCategoryId}>
								<SelectTrigger>
									<SelectValue placeholder="Select category" />
								</SelectTrigger>
								<SelectContent>
									{categories.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{c.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="exp-amount">Amount (ETB)</Label>
							<Input
								id="exp-amount"
								type="number"
								min={0}
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								placeholder="e.g. 1850"
							/>
						</div>
					</div>
					<div className="flex gap-2 pt-1">
						<Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
						<Button onClick={handleSave} disabled={saving} className="flex-1">
							{saving ? "Saving…" : "Log Expense"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
