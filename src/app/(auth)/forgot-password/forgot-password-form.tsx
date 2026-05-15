"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Turnstile } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { forgotPassword } from "@/lib/supabase/actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPassword, null);

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-2 text-center">
        <div className="mb-2 text-2xl font-bold tracking-tight">
          Sell<span className="text-primary">Wise</span>
        </div>
        <p className="text-sm text-muted-foreground">Reset your password</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {state?.success ? (
          <div className="space-y-4">
            <div className="rounded-md border border-green-500/50 bg-green-500/10 px-3 py-3 text-sm text-green-700 dark:text-green-400">
              Check your email — we&apos;ve sent a password reset link.
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Didn&apos;t get it? Check your spam folder or{" "}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="text-primary hover:underline"
              >
                try again
              </button>
              .
            </p>
          </div>
        ) : (
          <form action={action} className="space-y-4">
            {state?.error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {state.error}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a link to reset your
              password.
            </p>
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
            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
              <Turnstile siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? (
                <>
                  <span className="mr-2 inline-block size-3.5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
                  Sending…
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>
        )}
        <p className="text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
