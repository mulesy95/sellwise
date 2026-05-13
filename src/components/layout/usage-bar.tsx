"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
              used >= limit ? "bg-destructive" : "bg-primary"
            )}
            style={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
          />
        </div>
      )}
      {plan === "free" && (
        <Link
          href="/dashboard/settings"
          className="mt-2 block text-center text-primary hover:underline"
        >
          Upgrade →
        </Link>
      )}
    </div>
  );
}
