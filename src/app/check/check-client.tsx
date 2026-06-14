"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CheckResult {
  score: number;
  label: string;
  improvements: { field: string; issue: string; fix: string }[];
  platform: string;
}

function scoreColour(score: number) {
  if (score >= 70) return "text-emerald-500";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
}

export function CheckClient() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setResult(data as CheckResult);
      }
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          How healthy is your listing?
        </h1>
        <p className="text-sm text-muted-foreground">
          Paste a Shopify product URL. Takes about 10 seconds. No account needed.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://yourstore.myshopify.com/products/your-product"
          required
          className="h-11"
        />
        <Button type="submit" className="w-full" disabled={loading || !url.trim()}>
          {loading ? "Checking your listing..." : "Check my listing"}
          {!loading && <ArrowRight className="size-3.5" />}
        </Button>
      </form>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {result && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <div
              className={cn(
                "text-7xl font-bold tabular-nums leading-none",
                scoreColour(result.score)
              )}
            >
              {result.score}
            </div>
            <p className="text-base font-semibold">{result.label}</p>
            <p className="text-xs text-muted-foreground">out of 100</p>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3 text-center">
            {result.improvements.length > 0 ? (
              <p className="text-sm font-medium">
                {result.improvements.length} improvement
                {result.improvements.length !== 1 ? "s" : ""} found.
              </p>
            ) : (
              <p className="text-sm font-medium">Your listing looks solid.</p>
            )}
            <p className="text-xs text-muted-foreground">
              {result.improvements.length > 0
                ? "Create a free account to see exactly what to fix and re-check as you improve it."
                : "Create a free account to run the full optimiser and see if there is more to gain."}
            </p>
            <Link href="/signup?ref=check">
              <Button className="w-full">
                {result.improvements.length > 0
                  ? `See all ${result.improvements.length} improvements`
                  : "Try the full optimiser"}
                <ExternalLink className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
