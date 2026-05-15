"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
        Enter your invite code to get in, or log back into your existing account below.
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
          {loading ? (
            <span className="size-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
          ) : (
            "Get access"
          )}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>

      <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
        <span>Already have an account?</span>
        <a href="/login" className="font-medium text-primary hover:underline">Log in</a>
      </div>
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
