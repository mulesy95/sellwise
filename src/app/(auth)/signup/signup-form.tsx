"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { signUp } from "@/lib/supabase/actions";

export function SignupForm() {
  const [state, action, pending] = useActionState(signUp, null);

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-2 text-center">
        <div className="mb-2 text-2xl font-bold tracking-tight">
          Sell<span className="text-primary">wise</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Start with 3 free optimisations
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={action} className="space-y-4">
          {state?.error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {state.error}
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
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <span className="mr-2 inline-block size-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
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
