import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface ServiceStatus {
  status: "ok" | "degraded" | "down";
  latency?: number;
  message?: string;
}

interface HealthResponse {
  services: {
    app: ServiceStatus;
    database: ServiceStatus;
    ai: ServiceStatus;
    payments: ServiceStatus;
  };
  overall: "ok" | "degraded" | "down";
  checkedAt: string;
}

function withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    ),
  ]);
}

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const admin = createAdminClient();
    const result = await Promise.race([
      admin.from("profiles").select("id").limit(1),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 4000)
      ),
    ]);
    const latency = Date.now() - start;
    if (result.error) return { status: "down", latency, message: result.error.message };
    return { status: latency > 2000 ? "degraded" : "ok", latency };
  } catch {
    return { status: "down", latency: Date.now() - start, message: "Unreachable" };
  }
}

async function checkStatusPage(url: string): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const res = await withTimeout(
      () =>
        fetch(url, {
          signal: AbortSignal.timeout(4000),
          headers: { "User-Agent": "SellWise-HealthCheck/1.0" },
        }),
      4500
    );
    const latency = Date.now() - start;
    if (!res.ok) return { status: "degraded", latency, message: `HTTP ${res.status}` };
    const data = await res.json() as { status?: { indicator?: string; description?: string } };
    const indicator = data?.status?.indicator;
    if (indicator === "none") return { status: "ok", latency };
    if (indicator === "minor") return { status: "degraded", latency, message: data?.status?.description };
    if (indicator === "maintenance") return { status: "degraded", latency, message: data?.status?.description ?? "Maintenance in progress" };
    if (indicator) return { status: "down", latency, message: data?.status?.description ?? "Incident reported" };
    return { status: "ok", latency };
  } catch {
    return { status: "degraded", latency: Date.now() - start, message: "Status page unreachable" };
  }
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const [dbResult, aiResult, paymentsResult] = await Promise.allSettled([
    checkDatabase(),
    checkStatusPage("https://status.anthropic.com/api/v2/status.json"),
    checkStatusPage("https://status.stripe.com/api/v2/status.json"),
  ]);

  const services = {
    app: { status: "ok" as const },
    database:
      dbResult.status === "fulfilled"
        ? dbResult.value
        : { status: "down" as const, message: "Check failed" },
    ai:
      aiResult.status === "fulfilled"
        ? aiResult.value
        : { status: "degraded" as const, message: "Status unreachable" },
    payments:
      paymentsResult.status === "fulfilled"
        ? paymentsResult.value
        : { status: "degraded" as const, message: "Status unreachable" },
  };

  const statuses = Object.values(services).map((s) => s.status);
  const overall = statuses.includes("down")
    ? "down"
    : statuses.includes("degraded")
    ? "degraded"
    : "ok";

  return NextResponse.json(
    { services, overall, checkedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
