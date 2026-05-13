"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to open billing portal");
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={loading}>
      {loading ? (
        <span className="size-3.5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      ) : (
        "Manage billing"
      )}
    </Button>
  );
}
