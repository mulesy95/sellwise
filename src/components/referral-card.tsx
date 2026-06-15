"use client";

import { useState } from "react";
import { Copy, Check, Gift, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Props {
  link: string;
  total: number;
  rewarded: number;
}

export function ReferralCard({ link, total, rewarded }: Props) {
  const [copied, setCopied] = useState<"link" | "message" | null>(null);

  const draftMessage = `I've been using SellWise to optimise my listings — it takes about 30 seconds and gives you a score out of 100. My referral link gives you 7 days free, no card needed: ${link}`;

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied("link");
    toast.success("Referral link copied");
    setTimeout(() => setCopied(null), 2000);
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(draftMessage);
    setCopied("message");
    toast.success("Message copied — paste anywhere");
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gift className="size-4 text-primary" />
          <CardTitle className="text-base">Give a friend 7 days free</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Share your link. When they sign up and run their first optimisation, you both get 7 days of Starter access — keyword research, audits, 50 optimisations. No card needed.
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
            onClick={copyLink}
            aria-label="Copy referral link"
          >
            {copied === "link" ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
          </Button>
        </div>

        {/* Pre-drafted message */}
        <button
          type="button"
          onClick={copyMessage}
          className="flex w-full items-start gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
        >
          <div className="mt-0.5 shrink-0">
            {copied === "message"
              ? <Check className="size-3.5 text-emerald-500" />
              : <MessageSquare className="size-3.5 text-muted-foreground" />
            }
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium mb-0.5">Copy message to share</p>
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{draftMessage}</p>
          </div>
        </button>

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
          Rewards stack — refer 3 friends and earn 3 extra weeks.
        </p>
      </CardContent>
    </Card>
  );
}
