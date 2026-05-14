"use client";

import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { resetPassword } from "@/lib/supabase/actions";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, null);
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
          Sell<span className="text-primary">wise</span>
        </div>
        <p className="text-sm text-muted-foreground">Choose a new password</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={action} onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {errorMessage}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
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
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <span className="mr-2 inline-block size-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Updating password…
              </>
            ) : (
              "Set new password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
