"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceStatus {
  status: "ok" | "degraded" | "down";
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
}

interface Banner {
  id: string;
  level: "degraded" | "down";
  message: string;
}

const SERVICE_MESSAGES: Record<string, { degraded: string; down: string }> = {
  ai: {
    degraded: "AI engine is running slowly — responses may take longer than usual.",
    down: "AI engine is unavailable — listing generation and audits are offline right now.",
  },
  database: {
    degraded: "Database is responding slowly — some features may be delayed.",
    down: "Database is unreachable — the app may not function correctly.",
  },
  payments: {
    degraded: "Payment processor is experiencing issues — billing may be affected.",
    down: "Payment processor is down — upgrades and billing are unavailable right now.",
  },
};

export function ServiceStatusBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/health");
        if (!res.ok) return;
        const data: HealthData = await res.json();
        const next: Banner[] = [];

        for (const [key, msgs] of Object.entries(SERVICE_MESSAGES)) {
          const svc = data.services[key as keyof HealthData["services"]];
          if (!svc || svc.status === "ok") continue;
          next.push({
            id: `${key}-${svc.status}`,
            level: svc.status,
            message: svc.message
              ? `${svc.status === "down" ? msgs.down : msgs.degraded} (${svc.message})`
              : svc.status === "down"
              ? msgs.down
              : msgs.degraded,
          });
        }

        setBanners(next);
      } catch {
        // health check failure is silent — don't noisily alert users
      }
    }

    void check();
    const interval = setInterval(() => void check(), 60_000);
    return () => clearInterval(interval);
  }, []);

  const visible = banners.filter((b) => !dismissed.has(b.id));
  if (visible.length === 0) return null;

  return (
    <div className="shrink-0">
      {visible.map((banner) => (
        <div
          key={banner.id}
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 text-sm",
            banner.level === "down"
              ? "bg-red-600 text-white"
              : "bg-amber-500 text-white"
          )}
        >
          {banner.level === "down" ? (
            <XCircle className="size-4 shrink-0" />
          ) : (
            <AlertTriangle className="size-4 shrink-0" />
          )}
          <span className="flex-1">
            {banner.message}{" "}
            <a
              href="/status"
              className="underline underline-offset-2 opacity-90 hover:opacity-100"
            >
              View status
            </a>
          </span>
          <button
            onClick={() => setDismissed((prev) => new Set([...prev, banner.id]))}
            className="shrink-0 rounded p-0.5 hover:bg-white/20 transition-colors"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
