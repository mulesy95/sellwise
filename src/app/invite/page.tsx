"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

function InviteForm() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkError = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/beta/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid code");
        return;
      }

      router.push("/login");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <a href="/" className="mb-6 text-3xl font-extrabold tracking-tight text-foreground">
        Sell<span className="text-primary">Wise</span>
      </a>

      <h1 className="mb-1 text-xl font-semibold text-foreground">Beta access</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Already have an account?{" "}
        <a href="/login" className="font-medium text-primary hover:underline">
          Sign in here
        </a>
        . New? Enter your invite code below.
      </p>

      {linkError === "invalid" && (
        <p className="mb-4 text-sm text-destructive">
          That invite link is invalid or has expired. Enter your code manually below.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
        <Input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ENTER CODE"
          className="font-mono tracking-widest text-center text-lg h-12"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !code.trim()} className="w-full">
          {loading ? <Spinner size="md" /> : "Get access"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>

      <p className="mt-6 text-xs text-muted-foreground/60">
        Your code is single-use and tied to one account.
      </p>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense>
      <InviteForm />
    </Suspense>
  );
}
