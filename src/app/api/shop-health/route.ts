import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scoreOptimisedListing } from "@/lib/listing-score";
import { checkRateLimit } from "@/lib/rate-limit";
import type { Platform } from "@/lib/platforms";

type OptRow = {
  id: string;
  product_id: string | null;
  platform: string | null;
  output: Record<string, unknown> | null;
  score: number | null;
  created_at: string;
};

function resolveScore(row: OptRow, shopPlatform: Platform): number {
  if (typeof row.score === "number") return row.score;
  if (row.output && typeof row.output === "object") {
    const platform = (row.platform as Platform) ?? shopPlatform;
    return scoreOptimisedListing({
      platform,
      ...row.output,
    } as Parameters<typeof scoreOptimisedListing>[0]);
  }
  return 0;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { allowed: rl, retryAfterMs } = checkRateLimit(`shop-health:${user.id}`, 20, 60_000);
  if (!rl) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const shopId = request.nextUrl.searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ error: "shopId required" }, { status: 400 });

  // Verify the shop belongs to the authenticated user
  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("id, platform")
    .eq("id", shopId)
    .eq("user_id", user.id)
    .single();

  if (shopError && shopError.code !== "PGRST116") {
    console.error("shop-health: shops query error", shopError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const shopPlatform = shop.platform as Platform;

  // Fetch all optimisations for this shop over the last 90 days
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: rawRows, error: rowsError } = await supabase
    .from("optimisations")
    .select("id, product_id, platform, output, score, created_at")
    .eq("shop_id", shopId)
    .eq("user_id", user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (rowsError) {
    console.error("shop-health: optimisations query error", rowsError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const rows: OptRow[] = (rawRows ?? []) as OptRow[];

  if (rows.length === 0) {
    return NextResponse.json({ apexScore: 0, trend: [], productCount: 0 });
  }

  // Compute scores once for every row
  const rowsWithScores = rows.map(row => ({
    ...row,
    _score: resolveScore(row, shopPlatform),
  }));

  // Deduplicate: keep most recent optimisation per product (rows are already sorted desc)
  const byProduct = new Map<string, (typeof rowsWithScores)[number]>();
  for (const row of rowsWithScores) {
    if (row.product_id && !byProduct.has(row.product_id)) {
      byProduct.set(row.product_id, row);
    }
  }
  const latest = Array.from(byProduct.values());

  const scored = latest.map(row => row._score);

  const apexScore =
    scored.length === 0
      ? 0
      : Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);

  // Weekly trend: group all rows by week start (Sunday), average score per week
  const weekMap = new Map<string, number[]>();
  for (const row of rowsWithScores) {
    const d = new Date(row.created_at);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const key = weekStart.toISOString().slice(0, 10);
    const existing = weekMap.get(key) ?? [];
    existing.push(row._score);
    weekMap.set(key, existing);
  }

  const trend = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, scores]) => ({
      week,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));

  return NextResponse.json({
    apexScore,
    trend,
    productCount: latest.length,
  });
}
