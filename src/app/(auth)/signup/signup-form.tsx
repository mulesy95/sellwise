"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { signUp } from "@/lib/supabase/actions";

export function SignupForm({ refCode }: { refCode: string | null }) {
  const [state, action, pending] = useActionState(signUp, null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const pw = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirm = (
      form.elements.namedItem("confirmPassword") as HTMLInputElement
    ).value;
    if (pw !== confirm) {
      e.preventDefault();
      setConfirmError("Passwords do not match.");
    } else {
      setConfirmError(null);
    }
  }

  const errorMessage = confirmError ?? state?.error;

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-2 text-center">
        <div className="mb-2 text-2xl font-bold tracking-tight">
          Sell<span className="text-primary">Wise</span>
        </div>
        {refCode ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
            <p className="font-medium text-primary">You were invited!</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sign up and run your first optimisation to unlock 7 days of Starter access — free.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            7-day free trial. No card required.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={action} onSubmit={handleSubmit} className="space-y-4">
          {refCode && (
            <input type="hidden" name="ref_code" value={refCode} />
          )}
          {errorMessage && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {errorMessage}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              type="text"
              name="name"
              placeholder="Jane Smith"
              required
              autoComplete="name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="At least 8 characters"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>
          {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
            <Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Creating account…
              </>
            ) : (
              "Create free account"
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
