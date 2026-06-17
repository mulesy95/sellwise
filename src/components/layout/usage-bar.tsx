"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface UsageBarProps {
  initialUsed: number;
  initialLimit: number | null;
  plan: string;
  inTrial?: boolean;
}

export function UsageBar({ initialUsed, initialLimit, plan, inTrial = false }: UsageBarProps) {
  const [used, setUsed] = useState(initialUsed);
  const [limit, setLimit] = useState(initialLimit);

  useEffect(() => {
    function onOptimised() {
      fetch("/api/usage")
        .then((r) => r.json())
        .then((data) => {
          setUsed(data.optimisations ?? 0);
          setLimit(data.limit);
        })
        .catch(() => {});
    }

    window.addEventListener("sellwise:optimised", onOptimised);
    return () => window.removeEventListener("sellwise:optimised", onOptimised);
  }, []);

  const remaining = limit !== null ? limit - used : null;
  const atLimit = limit !== null && used >= limit;
  const nearLimit = remaining !== null && remaining > 0 && remaining <= 2;
  const canUpgrade = plan === "free" || plan === "starter";

  return (
    <div className="rounded-md bg-sidebar-accent/50 p-3 text-xs">
      <div className="mb-1.5 flex items-center justify-between font-medium">
        <span className="capitalize">{inTrial ? "Trial (Growth)" : `${plan} plan`}</span>
        <span className="text-muted-foreground">
          {limit === null ? `${used} used` : `${used} / ${limit} used`}
        </span>
      </div>
      {limit !== null && (
        <div className="h-1.5 rounded-full bg-sidebar-border">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              atLimit ? "bg-destructive" : nearLimit ? "bg-amber-500" : "bg-primary"
            )}
            style={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
          />
        </div>
      )}
      {atLimit && canUpgrade ? (
        <div className="mt-2 space-y-1.5">
          <p className="text-muted-foreground">
            Great work this month — upgrade to keep your listings competitive.
          </p>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Upgrade now <ArrowRight className="size-3" />
          </Link>
        </div>
      ) : nearLimit && canUpgrade ? (
        <p className="mt-1.5 font-medium text-amber-600 dark:text-amber-400">
          {remaining === 1 ? "1 optimisation left this month" : `${remaining} optimisations left this month`}
        </p>
      ) : plan === "free" ? (
        <Link
          href="/dashboard/settings"
          className="mt-2 block text-center text-primary hover:underline"
        >
          Upgrade <ArrowRight className="inline size-3 ml-0.5" />
        </Link>
      ) : null}
    </div>
  );
}
