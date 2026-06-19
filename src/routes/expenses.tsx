import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AppShell, PageHeader } from "@/components/app-shell";
import {
	expenses as data,
	formatETB,
	expenseCategories,
	type Expense,
	type ExpenseCategory,
} from "@/lib/mock-data";
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

export const Route = createFileRoute("/expenses")({
	head: () => ({ meta: [{ title: "Expenses — Fresh & Pressed" }] }),
	component: ExpensesPage,
});

const catColor: Record<ExpenseCategory, string> = {
	Ingredients: "bg-emerald-100 text-emerald-700",
	Utilities: "bg-sky-100 text-sky-700",
	Rent: "bg-violet-100 text-violet-700",
	Staff: "bg-amber-100 text-amber-700",
	Equipment: "bg-rose-100 text-rose-700",
	Other: "bg-slate-100 text-slate-700",
};

function ExpensesPage() {
	const [expenses, setExpenses] = useState<Expense[]>(data);
	const [cat, setCat] = useState<ExpenseCategory | "All">("All");
	const [dialogOpen, setDialogOpen] = useState(false);

	const visible = expenses.filter((e) => cat === "All" || e.category === cat);
	const total = visible.reduce((s, e) => s + e.amount, 0);
	const monthTotal = expenses.reduce((s, e) => s + e.amount, 0);

	const byCat = expenseCategories.map((c) => ({
		category: c,
		value: expenses
			.filter((e) => e.category === c)
			.reduce((s, e) => s + e.amount, 0),
	}));

	const addExpense = (e: Omit<Expense, "id" | "date">) => {
		setExpenses((arr) => [
			{
				...e,
				id: `e${Date.now()}`,
				date: new Date().toISOString(),
			},
			...arr,
		]);
		setDialogOpen(false);
	};

	const filters: Array<ExpenseCategory | "All"> = ["All", ...expenseCategories];

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
						<KPI
							label="This Month"
							value={formatETB(monthTotal)}
							sub={`${expenses.length} entries`}
						/>
						<KPI
							label="Filtered Total"
							value={formatETB(total)}
							sub={`${visible.length} entries`}
						/>
						<KPI
							label="Avg / Entry"
							value={formatETB(monthTotal / Math.max(expenses.length, 1))}
							sub="All categories"
						/>
					</div>

					<div className="mt-6 flex flex-wrap gap-2">
						{filters.map((c) => (
							<button
								key={c}
								type="button"
								onClick={() => setCat(c)}
								className={cn(
									"rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
									cat === c
										? "bg-foreground text-background"
										: "bg-muted text-muted-foreground hover:text-foreground",
								)}
							>
								{c}
							</button>
						))}
					</div>

					<div className="mt-4 overflow-hidden rounded-2xl border bg-card">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-muted/60 text-left">
									<th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
										Description
									</th>
									<th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
										Category
									</th>
									<th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
										Date
									</th>
									<th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
										Amount
									</th>
								</tr>
							</thead>
							<tbody>
								{visible.length === 0 ? (
									<tr>
										<td
											colSpan={4}
											className="px-5 py-12 text-center text-sm text-muted-foreground"
										>
											No expenses found.
										</td>
									</tr>
								) : (
									visible.map((e) => (
										<tr key={e.id} className="border-b last:border-0">
											<td className="px-5 py-4 font-medium">
												{e.description}
											</td>
											<td className="px-5 py-4">
												<span
													className={cn(
														"rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
														catColor[e.category],
													)}
												>
													{e.category}
												</span>
											</td>
											<td className="px-5 py-4 text-muted-foreground">
												{new Date(e.date).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
												})}
											</td>
											<td className="px-5 py-4 text-right font-bold tabular-nums">
												{formatETB(e.amount)}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* Breakdown sidebar */}
				<aside className="hidden w-72 shrink-0 border-l bg-card p-6 lg:block">
					<h2 className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
						Breakdown
					</h2>
					<div className="space-y-3">
						{byCat
							.sort((a, b) => b.value - a.value)
							.map((c) => {
								const pct =
									monthTotal === 0
										? 0
										: (c.value / monthTotal) * 100;
								return (
									<div key={c.category}>
										<div className="mb-1 flex justify-between text-xs">
											<span className="font-semibold">{c.category}</span>
											<span className="font-mono tabular-nums text-muted-foreground">
												{formatETB(c.value)}
											</span>
										</div>
										<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
											<div
												className="h-full rounded-full bg-foreground"
												style={{ width: `${pct}%` }}
											/>
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
				onSave={addExpense}
			/>
		</AppShell>
	);
}

function KPI({
	label,
	value,
	sub,
}: {
	label: string;
	value: string;
	sub: string;
}) {
	return (
		<div className="rounded-2xl border bg-card p-5 shadow-sm">
			<p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
				{label}
			</p>
			<p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
			<p className="mt-1 text-xs text-muted-foreground">{sub}</p>
		</div>
	);
}

function LogExpenseDialog({
	open,
	onClose,
	onSave,
}: {
	open: boolean;
	onClose: () => void;
	onSave: (e: Omit<Expense, "id" | "date">) => void;
}) {
	const [amount, setAmount] = useState("");
	const [category, setCategory] = useState<ExpenseCategory>("Ingredients");
	const [description, setDescription] = useState("");

	const handleSave = () => {
		if (!amount || !description) return;
		onSave({ amount: Number(amount), category, description });
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
							<Select
								value={category}
								onValueChange={(v) => setCategory(v as ExpenseCategory)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{expenseCategories.map((c) => (
										<SelectItem key={c} value={c}>
											{c}
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
						<Button variant="outline" onClick={onClose} className="flex-1">
							Cancel
						</Button>
						<Button onClick={handleSave} className="flex-1">
							Log Expense
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
