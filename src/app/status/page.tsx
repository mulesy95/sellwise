"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceStatus {
  status: "ok" | "degraded" | "down";
  latency?: number;
  message?: string;
}

interface HealthData {
  services: {
    app: ServiceStatus;
    database: ServiceStatus;
    ai: ServiceStatus;
    payments: ServiceStatus;
  };
  overall: "ok" | "degraded" | "down";
  checkedAt: string;
}

const SERVICE_LABELS: Record<string, { name: string; statusUrl?: string }> = {
  app: { name: "Application" },
  database: { name: "Database", statusUrl: "https://status.supabase.com" },
  ai: { name: "AI Engine", statusUrl: "https://status.anthropic.com" },
  payments: { name: "Payments", statusUrl: "https://status.stripe.com" },
};

const STATUS_CONFIG = {
  ok: {
    icon: CheckCircle2,
    label: "Operational",
    dot: "bg-green-500",
    text: "text-green-700 dark:text-green-400",
    card: "border-green-500/20 bg-green-500/5",
  },
  degraded: {
    icon: AlertTriangle,
    label: "Degraded",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    card: "border-amber-500/20 bg-amber-500/5",
  },
  down: {
    icon: XCircle,
    label: "Outage",
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
    card: "border-red-500/20 bg-red-500/5",
  },
};

const OVERALL_BANNER = {
  ok: {
    bg: "bg-green-500/10 border-green-500/20",
    text: "text-green-700 dark:text-green-300",
    message: "All systems operational",
  },
  degraded: {
    bg: "bg-amber-500/10 border-amber-500/20",
    text: "text-amber-700 dark:text-amber-300",
    message: "Some systems are degraded",
  },
  down: {
    bg: "bg-red-500/10 border-red-500/20",
    text: "text-red-700 dark:text-red-300",
    message: "Service disruption detected",
  },
};

function StatusIcon({ status, className }: { status: "ok" | "degraded" | "down"; className?: string }) {
  const Icon = STATUS_CONFIG[status].icon;
  return <Icon className={cn("size-5", STATUS_CONFIG[status].text, className)} />;
}

export default function StatusPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const refresh = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        setData(await res.json());
        setSecondsAgo(0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (!data) return;
    const tick = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => clearInterval(tick);
  }, [data]);

  const overall = data?.overall ?? "ok";
  const banner = OVERALL_BANNER[overall];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight">System Status</h1>
          <p className="mt-2 text-muted-foreground">
            Live health of SellWise services
          </p>
        </div>

        {/* Overall status banner */}
        <div className={cn("mb-8 rounded-xl border px-5 py-4 text-center font-medium", banner.bg, banner.text)}>
          {loading && !data ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Checking services...
            </span>
          ) : (
            banner.message
          )}
        </div>

        {/* Service cards */}
        <div className="space-y-3">
          {(Object.entries(SERVICE_LABELS) as [keyof HealthData["services"], typeof SERVICE_LABELS[string]][]).map(
            ([key, meta]) => {
              const svc = data?.services[key];
              const status = svc?.status ?? "ok";
              const cfg = STATUS_CONFIG[status];

              return (
                <div
                  key={key}
                  className={cn(
                    "rounded-xl border px-5 py-4 transition-colors",
                    svc ? cfg.card : "border-border/30 bg-card"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {svc ? (
                        <StatusIcon status={status} />
                      ) : (
                        <div className="size-5 animate-pulse rounded-full bg-muted" />
                      )}
                      <div>
                        <p className="font-medium">{meta.name}</p>
                        {svc?.message && (
                          <p className="text-xs text-muted-foreground">{svc.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {svc?.latency !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {svc.latency}ms
                        </span>
                      )}
                      {svc ? (
                        <span className={cn("text-sm font-medium", cfg.text)}>
                          {cfg.label}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Checking...</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {data
              ? secondsAgo === 0
                ? "Just updated"
                : `Updated ${secondsAgo}s ago · refreshes every 30s`
              : "Loading..."}
          </span>
          <button
            onClick={() => void refresh(true)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={cn("size-3", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* Vendor status links */}
        <div className="mt-8 border-t pt-6">
          <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Vendor status pages
          </p>
          <div className="flex flex-wrap gap-3">
            {Object.values(SERVICE_LABELS)
              .filter((s) => s.statusUrl)
              .map((s) => (
                <a
                  key={s.statusUrl}
                  href={s.statusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  {s.name}
                </a>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
