import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { MessageSquare, CheckCircle2, Trash2, UserPlus } from "lucide-react";
import { getTelegramSettings, saveTelegramSettings } from "@/lib/server/settings";
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
type Contact = { id: string; name: string; username: string; role: string; chatId: string };

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
							<li key={c.id} className="flex items-center gap-3 rounded-2xl border px-4 py-3">
								<div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-200 to-emerald-400 text-xs font-bold text-white">
									{c.name.charAt(0)}
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold leading-tight">{c.name}</p>
									<p className="text-xs text-muted-foreground">@{c.username}</p>
								</div>
								<span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", roleColor[c.role] ?? "bg-muted text-muted-foreground")}>
									{c.role}
								</span>
								<div className="flex items-center gap-1">
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
							</li>
						))}
					</ul>
				)}

				<div className="mt-5 flex items-center justify-end">
					<Button onClick={handleSave} disabled={saving} className="gap-2">
						{saved ? <><CheckCircle2 className="size-4" /> Saved</> : saving ? "Saving…" : "Save Config"}
					</Button>
				</div>
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
												<span>@{c.username}</span>
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
	const [username, setUsername] = useState(contact?.username ?? "");
	const [role, setRole] = useState(contact?.role ?? "waiter");
	const [chatId, setChatId] = useState(contact?.chatId ?? "");

	const handleOpenChange = (v: boolean) => {
		if (!v) onClose();
		else {
			setName(contact?.name ?? "");
			setUsername(contact?.username ?? "");
			setRole(contact?.role ?? "waiter");
			setChatId(contact?.chatId ?? "");
		}
	};

	const handleSave = () => {
		if (!name.trim() || !username.trim()) return;
		onSave({ name: name.trim(), username: username.trim().replace(/^@/, ""), role, chatId });
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{contact ? "Edit Contact" : "Add Contact"}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 px-8 pb-8 pt-2">
					<div className="space-y-1.5">
						<Label htmlFor="ct-name">Full Name</Label>
						<Input id="ct-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dawit Mulugeta" />
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="ct-username">Telegram Username</Label>
						<div className="relative">
							<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
							<Input
								id="ct-username"
								value={username}
								onChange={(e) => setUsername(e.target.value.replace(/^@/, ""))}
								placeholder="username"
								className="pl-7"
							/>
						</div>
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
						<Input id="ct-chatid" value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="-100xxxxxxxxxx" />
						<p className="text-xs text-muted-foreground">
							Forward a message from this person to @userinfobot to get their chat ID.
						</p>
					</div>
					<div className="flex gap-2 pt-1">
						<Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
						<Button onClick={handleSave} className="flex-1">{contact ? "Save Changes" : "Add Contact"}</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
