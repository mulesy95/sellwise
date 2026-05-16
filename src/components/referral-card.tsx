"use client";

import { useState } from "react";
import { Copy, Check, Gift } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Props {
  link: string;
  total: number;
  rewarded: number;
}

export function ReferralCard({ link, total, rewarded }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied.");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gift className="size-4 text-primary" />
          <CardTitle className="text-base">Invite a friend, earn a week free</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Share your link. When a friend signs up and runs their first optimisation, you both get 7 days of Starter access — no card required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Link row */}
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
          <span className="flex-1 truncate text-sm font-mono text-muted-foreground">
            {link}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={copy}
            aria-label="Copy referral link"
          >
            {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-center">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {total === 1 ? "friend joined" : "friends joined"}
            </div>
          </div>
          <div className="rounded-lg border border-border/40 bg-muted/20 p-3 text-center">
            <div className="text-2xl font-bold text-primary">{rewarded}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {rewarded === 1 ? "week earned" : "weeks earned"}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground/70">
          Rewards stack — refer 3 friends and get 3 extra weeks.
        </p>
      </CardContent>
    </Card>
  );
}
