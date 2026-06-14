"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function BrandVoiceForm({ currentVoice }: { currentVoice: string | null }) {
  const [voice, setVoice] = useState(currentVoice ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_voice: voice || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Brand voice saved.");
    } catch {
      toast.error("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={voice}
        onChange={(e) => setVoice(e.target.value.slice(0, 400))}
        placeholder={'e.g. "Short, direct sentences. Warm and personal. Led by occasion rather than product specs."'}
        rows={3}
        className="resize-none text-sm"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{voice.length}/400</span>
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

export function RefreshVoiceButton() {
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/brand-voice/refresh", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.reason === "not_enough_data") {
          toast(`Need ${5 - (data.count ?? 0)} more approved results to generate this.`);
        } else {
          toast.error("Could not refresh. Try again.");
        }
        return;
      }
      toast.success("Brand voice updated from your recent results.");
      window.location.reload();
    } catch {
      toast.error("Could not refresh. Try again.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={refresh}
      disabled={refreshing}
      className="gap-1.5"
    >
      <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
      {refreshing ? "Refreshing..." : "Refresh from results"}
    </Button>
  );
}
