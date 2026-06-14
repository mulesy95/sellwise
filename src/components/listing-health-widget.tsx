"use client";

import { useEffect, useState } from "react";
import { ScoreTrendChart } from "@/components/score-trend-chart";

interface HealthData {
  apexScore: number;
  trend: Array<{ week: string; avg: number }>;
  productCount: number;
}

function scoreColor(s: number) {
  if (s >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (s >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function scoreLabel(s: number) {
  if (s >= 70) return "Good";
  if (s >= 40) return "Needs work";
  return "Poor";
}

export function ListingHealthWidget({ shopId }: { shopId: string }) {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/shop-health?shopId=${shopId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [shopId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="size-4 animate-spin rounded-full border-2 border-border border-t-foreground" />
      </div>
    );
  }

  if (!data || data.productCount === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        Optimise some listings to see your shop health score.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <span className={`text-4xl font-bold tabular-nums leading-none ${scoreColor(data.apexScore)}`}>
          {data.apexScore}
        </span>
        <div className="mb-1 space-y-0.5">
          <p className={`text-xs font-semibold ${scoreColor(data.apexScore)}`}>
            {scoreLabel(data.apexScore)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            avg across {data.productCount} product{data.productCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="ml-auto text-[10px] text-muted-foreground/50">/ 100</div>
      </div>
      {data.trend.length >= 2 && (
        <ScoreTrendChart data={data.trend} className="mt-1" />
      )}
    </div>
  );
}
