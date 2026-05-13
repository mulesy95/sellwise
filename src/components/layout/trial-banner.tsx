"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

export function TrialBanner({ trialEndsAt }: { trialEndsAt: string }) {
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );

  return (
    <div className="flex items-center justify-between gap-3 bg-primary/10 border-b border-primary/20 px-6 py-2 text-sm">
      <div className="flex items-center gap-2">
        <Zap className="size-3.5 text-primary shrink-0" />
        <span>
          <span className="font-medium">
            {daysLeft === 0 ? "Your free trial ends today." : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your free trial.`}
          </span>{" "}
          <span className="text-muted-foreground">Upgrade to keep unlimited access.</span>
        </span>
      </div>
      <Link
        href="/pricing"
        className="shrink-0 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Upgrade now
      </Link>
    </div>
  );
}
