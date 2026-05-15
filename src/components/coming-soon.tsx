"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { joinWaitlist, type WaitlistState } from "@/app/actions/waitlist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ComingSoon() {
  const [state, action, pending] = useActionState<WaitlistState, FormData>(
    joinWaitlist,
    null
  );

  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const router = useRouter();

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCodeError(null);
    setCodeLoading(true);

    try {
      const res = await fetch("/api/beta/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCodeError(data.error ?? "Invalid code");
        return;
      }

      router.push("/signup");
    } catch {
      setCodeError("Something went wrong. Try again.");
    } finally {
      setCodeLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      {/* Wordmark */}
      <h1 className="mb-3 text-5xl font-extrabold tracking-tight text-foreground md:text-6xl">
        Sell<span className="text-primary">Wise</span>
      </h1>

      <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
        Coming Soon
      </p>

      <p className="mb-2 max-w-md text-lg font-medium text-foreground">
        Sell smarter on every platform.
      </p>
      <p className="mb-10 max-w-sm text-sm leading-relaxed text-muted-foreground">
        AI-powered listing optimisation for Etsy, Amazon, Shopify, and more.
        We&apos;re putting the finishing touches on. Leave your email and
        we&apos;ll let you know the moment we launch.
      </p>

      {state?.success ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-6 py-4 text-sm font-medium text-primary">
          You&apos;re on the list. We&apos;ll be in touch soon.
        </div>
      ) : (
        <form action={action} className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
          <Input
            name="email"
            type="email"
            placeholder="your@email.com"
            required
            className="flex-1"
            disabled={pending}
          />
          <Button type="submit" disabled={pending} className="shrink-0">
            {pending ? (
              <span className="size-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
            ) : (
              "Notify me"
            )}
          </Button>
        </form>
      )}

      {state?.error && (
        <p className="mt-3 text-sm text-destructive">{state.error}</p>
      )}

      <p className="mt-8 text-xs text-muted-foreground/50">
        No spam. Just a launch notification.
      </p>

      {/* Invite code panel — shown only when triggered */}
      {showCode && (
        <div className="mt-6 w-full max-w-sm">
          <form onSubmit={handleCodeSubmit} className="flex gap-2">
            <Input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ENTER CODE"
              className="flex-1 font-mono tracking-widest text-center"
              disabled={codeLoading}
            />
            <Button type="submit" variant="outline" disabled={codeLoading || !code.trim()} className="shrink-0">
              {codeLoading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
              ) : (
                "Go"
              )}
            </Button>
          </form>
          {codeError && (
            <p className="mt-2 text-xs text-destructive">{codeError}</p>
          )}
        </div>
      )}

      <div className="mt-10 flex gap-5 text-xs text-muted-foreground/40">
        <a href="/terms" className="hover:text-muted-foreground transition-colors">Terms</a>
        <a href="/privacy" className="hover:text-muted-foreground transition-colors">Privacy</a>
        <button
          onClick={() => { setShowCode(true); setCodeError(null); }}
          className="hover:text-muted-foreground transition-colors"
        >
          Have an invite?
        </button>
      </div>
    </div>
  );
}
