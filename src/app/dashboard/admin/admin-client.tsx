"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Send, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface BetaCode {
  id: string;
  code: string;
  label: string;
  used_count: number;
  max_uses: number;
  created_at: string;
}

export function AdminClient({ initialCodes }: { initialCodes: BetaCode[] }) {
  const [codes, setCodes] = useState<BetaCode[]>(initialCodes);
  const [newLabel, setNewLabel] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("10");
  const [creating, setCreating] = useState(false);

  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [sending, setSending] = useState(false);

  const [copied, setCopied] = useState<string | null>(null);

  async function createCode() {
    if (!newLabel.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/beta-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel, max_uses: parseInt(newMaxUses) || 10 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCodes((prev) => [data, ...prev]);
      setNewLabel("");
      setNewMaxUses("10");
      toast.success(`Code ${data.code} created`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create code");
    } finally {
      setCreating(false);
    }
  }

  async function sendInvite() {
    if (!inviteEmail || !inviteCode) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: inviteFirstName || null,
          email: inviteEmail,
          code: inviteCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteFirstName("");
      setInviteEmail("");
      setInviteCode("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setSending(false);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage beta invite codes and send invites.</p>
      </div>

      {/* Create code */}
      <div className="rounded-xl border border-border p-6">
        <h2 className="mb-4 text-sm font-semibold">Create invite code</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Label (e.g. Friends, Etsy group)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="flex-1"
          />
          <Input
            type="number"
            min={1}
            placeholder="Max uses"
            value={newMaxUses}
            onChange={(e) => setNewMaxUses(e.target.value)}
            className="w-28"
          />
          <Button onClick={createCode} disabled={creating || !newLabel.trim()} className="shrink-0">
            {creating ? (
              <span className="size-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
            ) : (
              <><Plus className="size-4 mr-1.5" />Create</>
            )}
          </Button>
        </div>
      </div>

      {/* Send invite */}
      <div className="rounded-xl border border-border p-6">
        <h2 className="mb-4 text-sm font-semibold">Send invite email</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="First name (optional)"
            value={inviteFirstName}
            onChange={(e) => setInviteFirstName(e.target.value)}
            className="w-40"
          />
          <Input
            type="email"
            placeholder="their@email.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1"
          />
          <select
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select code</option>
            {codes.map((c) => (
              <option key={c.id} value={c.code} disabled={c.used_count >= c.max_uses}>
                {c.code} — {c.label} ({c.used_count}/{c.max_uses})
              </option>
            ))}
          </select>
          <Button onClick={sendInvite} disabled={sending || !inviteEmail || !inviteCode} className="shrink-0">
            {sending ? (
              <span className="size-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
            ) : (
              <><Send className="size-4 mr-1.5" />Send</>
            )}
          </Button>
        </div>
      </div>

      {/* Codes table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">All codes</h2>
        </div>
        {codes.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground text-center">No codes yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Label</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Created</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {codes.map((c) => {
                const full = c.used_count >= c.max_uses;
                return (
                  <tr key={c.id}>
                    <td className="px-6 py-3 font-mono font-semibold tracking-wide">{c.code}</td>
                    <td className="px-6 py-3 text-muted-foreground">{c.label}</td>
                    <td className="px-6 py-3">
                      <Badge
                        variant="outline"
                        className={full ? "border-destructive/40 text-destructive" : "border-primary/30 text-primary"}
                      >
                        {c.used_count} / {c.max_uses}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground text-xs">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => copyCode(c.code)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copied === c.code ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
                        {copied === c.code ? "Copied" : "Copy"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
