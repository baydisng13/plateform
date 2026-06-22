import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MessageSquare, CheckCircle2, Trash2, UserPlus, Link, RefreshCw, AlertCircle, Send } from "lucide-react";
import { getTelegramSettings, saveTelegramSettings, registerTelegramWebhook, checkTelegramWebhook, sendTestMessage } from "@/lib/server/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type DbSettings = Awaited<ReturnType<typeof getTelegramSettings>>;
type Contact = { id: string; name: string; role: string; chatId: string };

export const Route = createFileRoute("/_auth/settings/telegram")({
	head: () => ({ meta: [{ title: "Telegram — PlateForm" }] }),
	loader: () => getTelegramSettings(),
	component: TelegramPage,
});

type NotifConfig = {
	key: string;
	label: string;
	description: string;
	enabled: boolean;
	recipients: string[];
};

const NOTIF_DEFAULTS: NotifConfig[] = [
	{ key: "new_order", label: "New order received", description: "Sent when any order arrives in the system", enabled: true, recipients: [] },
	{ key: "online_confirm", label: "Online order needs confirmation", description: "Sent when an online order awaits a call-back", enabled: true, recipients: [] },
	{ key: "order_ready", label: "Order ready", description: "Sent when chef marks an order as ready", enabled: true, recipients: [] },
	{ key: "payment_confirmed", label: "Payment confirmed", description: "Sent after waiter confirms payment", enabled: true, recipients: [] },
];

const roleColor: Record<string, string> = {
	owner: "bg-primary/10 text-primary",
	chef: "bg-amber-100 text-amber-700",
	waiter: "bg-sky-100 text-sky-700",
};

function TelegramPage() {
	const settings = Route.useLoaderData() as DbSettings;
	const router = useRouter();

	const [token, setToken] = useState("");
	const [contacts, setContacts] = useState<Contact[]>(settings?.contacts ?? []);
	const [notifs, setNotifs] = useState<NotifConfig[]>(NOTIF_DEFAULTS);
	const [contactDialog, setContactDialog] = useState(false);
	const [editContact, setEditContact] = useState<Contact | null>(null);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	type WebhookStatus = { url: string; pending_update_count: number; last_error_message?: string; last_error_date?: number } | null;
	const [testingContact, setTestingContact] = useState<string | null>(null); // contact id being tested
	const [testResults, setTestResults] = useState<Record<string, "ok" | "error" | string>>({}); // id → result

	const handleTestMessage = async (contactId: string, chatId: string) => {
		if (!chatId) {
			setTestResults((r) => ({ ...r, [contactId]: "No chat ID set for this contact." }));
			return;
		}
		setTestingContact(contactId);
		try {
			await sendTestMessage({ data: { chatId } });
			setTestResults((r) => ({ ...r, [contactId]: "ok" }));
		} catch (e) {
			setTestResults((r) => ({ ...r, [contactId]: e instanceof Error ? e.message : "Failed" }));
		} finally {
			setTestingContact(null);
		}
	};

	const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | undefined>(undefined);
	const [webhookLoading, setWebhookLoading] = useState<"register" | "check" | null>(null);
	const [webhookError, setWebhookError] = useState<string | null>(null);
	const [webhookSuccess, setWebhookSuccess] = useState<string | null>(null);

	const toggleNotif = (key: string) =>
		setNotifs((arr) => arr.map((n) => (n.key === key ? { ...n, enabled: !n.enabled } : n)));

	const toggleRecipient = (key: string, contactId: string) =>
		setNotifs((arr) =>
			arr.map((n) => {
				if (n.key !== key) return n;
				const has = n.recipients.includes(contactId);
				return { ...n, recipients: has ? n.recipients.filter((x) => x !== contactId) : [...n.recipients, contactId] };
			}),
		);

	const saveContact = (data: Omit<Contact, "id">) => {
		if (editContact) {
			setContacts((arr) => arr.map((c) => (c.id === editContact.id ? { ...c, ...data } : c)));
		} else {
			setContacts((arr) => [...arr, { ...data, id: `c${Date.now()}` }]);
		}
		setContactDialog(false);
		setEditContact(null);
	};

	const removeContact = (id: string) => {
		setContacts((arr) => arr.filter((c) => c.id !== id));
		setNotifs((arr) => arr.map((n) => ({ ...n, recipients: n.recipients.filter((r) => r !== id) })));
	};

	const handleRegisterWebhook = async () => {
		setWebhookLoading("register");
		setWebhookError(null);
		setWebhookSuccess(null);
		try {
			const result = await registerTelegramWebhook({ data: undefined });
			setWebhookSuccess(`✅ ${result.description}\n${result.webhookUrl}`);
			await handleCheckWebhook();
		} catch (e) {
			setWebhookError(e instanceof Error ? e.message : "Unknown error");
		} finally {
			setWebhookLoading(null);
		}
	};

	const handleCheckWebhook = async () => {
		setWebhookLoading("check");
		setWebhookError(null);
		try {
			const result = await checkTelegramWebhook({ data: undefined });
			setWebhookStatus(result as WebhookStatus);
		} catch (e) {
			setWebhookError(e instanceof Error ? e.message : "Unknown error");
		} finally {
			setWebhookLoading(null);
		}
	};

	const handleSave = async () => {
		setSaving(true);
		const ownerChatIds = contacts.filter((c) => c.role === "owner").map((c) => c.chatId).filter(Boolean);
		const chefChatIds = contacts.filter((c) => c.role === "chef").map((c) => c.chatId).filter(Boolean);
		const waiterChatIds = contacts.filter((c) => c.role === "waiter").map((c) => c.chatId).filter(Boolean);

		await saveTelegramSettings({
			data: {
				...(token ? { botToken: token } : {}),
				contacts,
				ownerChatIds,
				chefChatIds,
				waiterChatIds,
			},
		});
		setSaving(false);
		setSaved(true);
		setToken("");
		setTimeout(() => setSaved(false), 2500);
		router.invalidate();
	};

	return (
		<div className="mx-auto max-w-2xl space-y-6 p-8">
			<div>
				<h2 className="text-lg font-semibold">Telegram Integration</h2>
				<p className="mt-0.5 text-sm text-muted-foreground">
					Connect a bot to receive real-time notifications and run commands.
				</p>
			</div>

			<div className="rounded-3xl border bg-card p-6 shadow-sm">
				<div className="mb-4 flex items-center gap-2">
					<MessageSquare className="size-4 text-primary" strokeWidth={2} />
					<h3 className="text-sm font-semibold">Bot Token</h3>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="tg-token">Bot Token</Label>
					<Input
						id="tg-token"
						type="password"
						value={token}
						onChange={(e) => setToken(e.target.value)}
						placeholder={settings?.hasToken ? "Token saved — enter new to replace" : "7xxxxxxxx:AAxxxxxxxxxxxxxxxxxxxxxx"}
					/>
					<p className="text-xs text-muted-foreground">
						Create a bot via @BotFather on Telegram.
					</p>
				</div>
			</div>

			{/* Webhook registration */}
			<div className="rounded-3xl border bg-card p-6 shadow-sm">
				<div className="mb-4 flex items-center gap-2">
					<Link className="size-4 text-primary" strokeWidth={2} />
					<h3 className="text-sm font-semibold">Webhook</h3>
				</div>

				<p className="mb-4 text-sm text-muted-foreground">
					Register your app URL with Telegram so the bot receives messages.
					Requires a saved bot token.
				</p>

				<div className="mb-4 rounded-xl bg-muted px-4 py-2.5">
					<p className="font-mono text-xs text-muted-foreground break-all">
						{typeof window !== "undefined" ? `${window.location.origin}/api/telegram/webhook` : "/api/telegram/webhook"}
					</p>
				</div>

				{webhookStatus !== undefined && (
					<div className={cn(
						"mb-4 rounded-xl border px-4 py-3 text-sm",
						webhookStatus?.last_error_message
							? "border-destructive/30 bg-destructive/5 text-destructive"
							: webhookStatus?.url
								? "border-primary/30 bg-primary/5 text-primary"
								: "border-muted bg-muted/50 text-muted-foreground",
					)}>
						{webhookStatus?.url ? (
							<div className="space-y-1">
								<p className="font-semibold">✅ Webhook active</p>
								<p className="font-mono text-xs break-all">{webhookStatus.url}</p>
								{webhookStatus.pending_update_count > 0 && (
									<p className="text-xs">{webhookStatus.pending_update_count} pending updates</p>
								)}
								{webhookStatus.last_error_message && (
									<p className="flex items-start gap-1.5 text-xs text-destructive">
										<AlertCircle className="mt-0.5 size-3 shrink-0" />
										Last error: {webhookStatus.last_error_message}
									</p>
								)}
							</div>
						) : (
							<p>⚠️ No webhook registered</p>
						)}
					</div>
				)}

				{webhookError && (
					<div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						<AlertCircle className="mt-0.5 size-4 shrink-0" />
						<span>{webhookError}</span>
					</div>
				)}

				{webhookSuccess && (
					<div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary whitespace-pre-line">
						{webhookSuccess}
					</div>
				)}

				<div className="flex gap-2">
					<Button
						onClick={handleRegisterWebhook}
						disabled={webhookLoading !== null || !settings?.hasToken}
						className="flex-1 gap-2"
					>
						{webhookLoading === "register" ? (
							<><RefreshCw className="size-3.5 animate-spin" /> Registering…</>
						) : (
							<><Link className="size-3.5" /> Register Webhook</>
						)}
					</Button>
					<Button
						variant="outline"
						onClick={handleCheckWebhook}
						disabled={webhookLoading !== null || !settings?.hasToken}
						className="gap-2"
					>
						{webhookLoading === "check" ? (
							<RefreshCw className="size-3.5 animate-spin" />
						) : (
							<RefreshCw className="size-3.5" />
						)}
						Check Status
					</Button>
				</div>

				{!settings?.hasToken && (
					<p className="mt-2 text-center text-xs text-muted-foreground">Save a bot token first to register the webhook.</p>
				)}
			</div>

			<div className="rounded-3xl border bg-card p-6 shadow-sm">
				<div className="mb-4 flex items-start justify-between">
					<div>
						<h3 className="text-sm font-semibold">Contacts</h3>
						<p className="mt-0.5 text-xs text-muted-foreground">
							Add staff members who should receive Telegram notifications.
						</p>
					</div>
					<Button
						size="sm"
						variant="outline"
						onClick={() => { setEditContact(null); setContactDialog(true); }}
					>
						<UserPlus className="size-3.5" />
						Add Contact
					</Button>
				</div>

				{contacts.length === 0 ? (
					<p className="py-6 text-center text-sm text-muted-foreground">No contacts yet.</p>
				) : (
					<ul className="space-y-2">
						{contacts.map((c) => (
							<li key={c.id} className="rounded-2xl border px-4 py-3">
								<div className="flex items-center gap-3">
									<div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-200 to-emerald-400 text-xs font-bold text-white">
										{c.name.charAt(0)}
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-semibold leading-tight">{c.name}</p>
										<p className="font-mono text-xs text-muted-foreground">{c.chatId || "no chat ID set"}</p>
									</div>
									<span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", roleColor[c.role] ?? "bg-muted text-muted-foreground")}>
										{c.role}
									</span>
									<div className="flex items-center gap-1">
										<button
											type="button"
											onClick={() => handleTestMessage(c.id, c.chatId)}
											disabled={testingContact === c.id || !settings?.hasToken}
											className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
											title={!settings?.hasToken ? "Save token first" : !c.chatId ? "Add chat ID first" : "Send test message"}
										>
											{testingContact === c.id ? (
												<RefreshCw className="size-3 animate-spin" />
											) : (
												<Send className="size-3" />
											)}
											Test
										</button>
										<button
											type="button"
											onClick={() => { setEditContact(c); setContactDialog(true); }}
											className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
										>
											Edit
										</button>
										<button
											type="button"
											onClick={() => removeContact(c.id)}
											className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
											aria-label="Remove contact"
										>
											<Trash2 className="size-3.5" />
										</button>
									</div>
								</div>
								{testResults[c.id] && (
									<p className={cn(
										"mt-2 flex items-center gap-1.5 text-xs",
										testResults[c.id] === "ok" ? "text-primary" : "text-destructive",
									)}>
										{testResults[c.id] === "ok" ? (
											<><CheckCircle2 className="size-3" /> Message delivered.</>
										) : (
											<><AlertCircle className="size-3" /> {testResults[c.id]}</>
										)}
									</p>
								)}
							</li>
						))}
					</ul>
				)}

			</div>

			<div className="rounded-3xl border bg-card p-6 shadow-sm">
				<h3 className="mb-1 text-sm font-semibold">Notifications</h3>
				<p className="mb-4 text-xs text-muted-foreground">
					Toggle each notification and choose which contacts receive it.
				</p>
				{contacts.length === 0 && (
					<p className="mb-4 rounded-xl bg-muted px-4 py-3 text-xs text-muted-foreground">
						Add contacts above to assign notification recipients.
					</p>
				)}
				<div className="space-y-3">
					{notifs.map((n) => (
						<div key={n.key} className={cn("rounded-2xl border p-4 transition-opacity", !n.enabled && "opacity-50")}>
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0 flex-1">
									<p className="text-sm font-semibold">{n.label}</p>
									<p className="mt-0.5 text-xs text-muted-foreground">{n.description}</p>
								</div>
								<Switch checked={n.enabled} onCheckedChange={() => toggleNotif(n.key)} />
							</div>
							{n.enabled && contacts.length > 0 && (
								<div className="mt-3 flex flex-wrap items-center gap-1.5">
									<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notify:</span>
									{contacts.map((c) => {
										const active = n.recipients.includes(c.id);
										return (
											<button
												key={c.id}
												type="button"
												onClick={() => toggleRecipient(n.key, c.id)}
												className={cn(
													"flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all",
													active ? roleColor[c.role] ?? "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
												)}
											>
												<span>{c.name}</span>
												{active && <span className="rounded-full px-1 py-0 text-[9px] font-bold uppercase opacity-60">{c.role}</span>}
											</button>
										);
									})}
								</div>
							)}
						</div>
					))}
				</div>
			</div>

			<div className="rounded-3xl border bg-card p-6 shadow-sm">
				<h3 className="mb-4 text-sm font-semibold">Available Bot Commands</h3>
				<div className="space-y-1.5">
					{[
						{ cmd: "/orders", desc: "List today's active orders", role: "owner" },
						{ cmd: "/summary", desc: "Today's sales summary", role: "owner" },
						{ cmd: "/weekly", desc: "Weekly revenue breakdown", role: "owner" },
						{ cmd: "/pending", desc: "Orders awaiting action", role: "owner" },
						{ cmd: "/kitchen", desc: "Current in-kitchen orders", role: "chef" },
						{ cmd: "/ready [order_id]", desc: "Mark order as ready", role: "chef" },
						{ cmd: "/myid", desc: "Get your Telegram chat ID", role: "anyone" },
					].map((c) => (
						<div key={c.cmd} className="flex items-center gap-3 rounded-lg px-3 py-2">
							<code className="shrink-0 rounded bg-muted px-2 py-0.5 font-mono text-xs">{c.cmd}</code>
							<span className="flex-1 text-sm text-muted-foreground">{c.desc}</span>
							<span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", roleColor[c.role] ?? "bg-muted text-muted-foreground")}>
								{c.role}
							</span>
						</div>
					))}
				</div>
			</div>

			<div className="flex items-center justify-end">
				<Button onClick={handleSave} disabled={saving} className="gap-2">
					{saved ? <><CheckCircle2 className="size-4" /> Saved</> : saving ? "Saving…" : "Save Settings"}
				</Button>
			</div>

			<ContactDialog
				open={contactDialog}
				contact={editContact}
				onClose={() => { setContactDialog(false); setEditContact(null); }}
				onSave={saveContact}
			/>
		</div>
	);
}

function ContactDialog({
	open,
	contact,
	onClose,
	onSave,
}: {
	open: boolean;
	contact: Contact | null;
	onClose: () => void;
	onSave: (data: Omit<Contact, "id">) => void;
}) {
	const [name, setName] = useState(contact?.name ?? "");
	const [role, setRole] = useState(contact?.role ?? "waiter");
	const [chatId, setChatId] = useState(contact?.chatId ?? "");

	useEffect(() => {
		setName(contact?.name ?? "");
		setRole(contact?.role ?? "waiter");
		setChatId(contact?.chatId ?? "");
	}, [contact, open]);

	const handleOpenChange = (v: boolean) => {
		if (!v) onClose();
	};

	const handleSave = () => {
		if (!name.trim()) return;
		onSave({ name: name.trim(), role, chatId });
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{contact ? "Edit Contact" : "Add Contact"}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 px-8 pb-8 pt-2">
					<div className="space-y-1.5">
						<Label htmlFor="ct-name">Name</Label>
						<Input id="ct-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dawit Mulugeta" />
					</div>
					<div className="space-y-1.5">
						<Label>Role</Label>
						<Select value={role} onValueChange={setRole}>
							<SelectTrigger><SelectValue /></SelectTrigger>
							<SelectContent>
								<SelectItem value="owner">Owner</SelectItem>
								<SelectItem value="chef">Chef</SelectItem>
								<SelectItem value="waiter">Waiter</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="ct-chatid">Chat ID</Label>
						<Input id="ct-chatid" value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="e.g. 123456789" />
						<div className="rounded-xl bg-muted px-3 py-2.5 text-xs text-muted-foreground space-y-1">
							<p className="font-semibold text-foreground">How to get your Chat ID:</p>
							<p>1. Open Telegram and message the bot.</p>
							<p>2. Send <code className="rounded bg-background px-1 font-mono">/myid</code> — the bot replies with your chat ID.</p>
							<p>3. Paste the number here.</p>
						</div>
					</div>
					<div className="flex gap-2 pt-1">
						<Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
						<Button onClick={handleSave} disabled={!name.trim()} className="flex-1">{contact ? "Save Changes" : "Add Contact"}</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
