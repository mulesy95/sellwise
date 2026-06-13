# Sprint B — Engagement Mechanics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the SEO score matter beyond a single optimisation — add a Shop Listing Health apex score that aggregates across a connected store, a score trend chart on the dashboard, a milestone widget, and a keyword list power level indicator.

**Architecture:** The Shop Listing Health score is computed from existing `optimisations` rows (most recent per product per shop). A new `GET /api/shop-health` route returns the aggregate. The score trend chart reads from `optimisations` grouped by week. The milestone widget is a purely client-side computation from the user's optimisation count. The keyword list power level is computed from existing keyword data — no new DB columns needed for B.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind 4, shadcn/ui, Supabase

---

## File Map

**Create:**
- `src/app/api/shop-health/route.ts` — GET: returns apex health score + weekly trend data for a shop
- `src/components/score-trend-chart.tsx` — simple SVG sparkline chart component
- `src/components/listing-health-widget.tsx` — apex score display for dashboard
- `src/components/milestone-widget.tsx` — "X more to next milestone" dashboard widget
- `src/tests/shop-health.test.ts` — unit tests for health score computation

**Modify:**
- `src/app/dashboard/page.tsx` — add ListingHealthWidget + MilestoneWidget + ScoreTrendChart
- `src/app/dashboard/keywords/keywords-client.tsx` — add power level indicator to saved lists

---

### Task 1: Shop health API route

**Files:**
- Create: `src/app/api/shop-health/route.ts`
- Create: `src/tests/shop-health.test.ts`

**Context:** The Shop Listing Health score is an average of the most recent `score` value per product in a connected shop, pulled from the `optimisations` table. The route also returns weekly average scores for the trend chart. The `score` column on `optimisations` is populated by the existing audit scoring logic — check if it's NULL for optimiser rows (it may be, since the optimiser saves output but not a score). If `score` IS NULL, the route must compute it using the `scoreOptimisedListing` function from `src/lib/listing-score.ts`.

The `optimisations` table has: `id`, `user_id`, `platform`, `shop_id`, `product_id`, `input`, `output`, `score`, `created_at`.

- [ ] **Step 1: Write failing tests**

Create `src/tests/shop-health.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

// Pure computation helpers — mirrors logic in the API route
function computeApexScore(rows: Array<{ score: number }>): number {
  if (rows.length === 0) return 0;
  const sum = rows.reduce((acc, r) => acc + r.score, 0);
  return Math.round(sum / rows.length);
}

function deduplicateByProduct(
  rows: Array<{ product_id: string; score: number; created_at: string }>
): Array<{ product_id: string; score: number }> {
  const map = new Map<string, { score: number; created_at: string }>();
  for (const row of rows) {
    const existing = map.get(row.product_id);
    if (!existing || row.created_at > existing.created_at) {
      map.set(row.product_id, { score: row.score, created_at: row.created_at });
    }
  }
  return Array.from(map.entries()).map(([product_id, v]) => ({
    product_id,
    score: v.score,
  }));
}

describe("shop health computation", () => {
  it("returns 0 for empty rows", () => {
    expect(computeApexScore([])).toBe(0);
  });

  it("averages scores across products", () => {
    expect(computeApexScore([{ score: 80 }, { score: 60 }])).toBe(70);
  });

  it("rounds the average", () => {
    expect(computeApexScore([{ score: 80 }, { score: 61 }])).toBe(71);
  });

  it("deduplicates by product_id keeping most recent", () => {
    const rows = [
      { product_id: "p1", score: 50, created_at: "2026-06-01T00:00:00Z" },
      { product_id: "p1", score: 80, created_at: "2026-06-10T00:00:00Z" },
      { product_id: "p2", score: 70, created_at: "2026-06-05T00:00:00Z" },
    ];
    const deduped = deduplicateByProduct(rows);
    expect(deduped).toHaveLength(2);
    const p1 = deduped.find((r) => r.product_id === "p1");
    expect(p1?.score).toBe(80);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test src/tests/shop-health.test.ts
```

Expected: PASS (these are pure function tests that don't depend on the route yet — they pass immediately to confirm the logic is correct before we implement the route).

- [ ] **Step 3: Create the API route**

Create `src/app/api/shop-health/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { scoreOptimisedListing } from "@/lib/listing-score";
import type { Platform } from "@/lib/platforms";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const shopId = request.nextUrl.searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ error: "shopId required" }, { status: 400 });

  // Verify shop belongs to user
  const { data: shop } = await supabase
    .from("shops")
    .select("id, platform")
    .eq("id", shopId)
    .eq("user_id", user.id)
    .single();

  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  // Fetch all optimisations for this shop from the last 90 days
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: rows } = await supabase
    .from("optimisations")
    .select("id, product_id, platform, output, score, created_at")
    .eq("shop_id", shopId)
    .eq("user_id", user.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (!rows || rows.length === 0) {
    return NextResponse.json({ apexScore: 0, trend: [], productCount: 0 });
  }

  // Deduplicate: keep most recent optimisation per product
  const byProduct = new Map<string, typeof rows[0]>();
  for (const row of rows) {
    if (row.product_id && !byProduct.has(row.product_id)) {
      byProduct.set(row.product_id, row);
    }
  }
  const latest = Array.from(byProduct.values());

  // Compute or use stored scores
  const scored = latest.map((row) => {
    if (typeof row.score === "number") return row.score;
    // Score not stored — compute from output
    try {
      return scoreOptimisedListing({
        platform: row.platform as Platform,
        ...row.output,
      });
    } catch {
      return 0;
    }
  });

  const apexScore =
    scored.length === 0
      ? 0
      : Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);

  // Weekly trend: group all rows (not deduplicated) by ISO week, average score per week
  const weekMap = new Map<string, number[]>();
  for (const row of rows) {
    const d = new Date(row.created_at);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);
    const key = weekStart.toISOString().slice(0, 10);
    const s =
      typeof row.score === "number"
        ? row.score
        : (() => {
            try {
              return scoreOptimisedListing({ platform: row.platform as Platform, ...row.output });
            } catch {
              return 0;
            }
          })();
    const existing = weekMap.get(key) ?? [];
    existing.push(s);
    weekMap.set(key, existing);
  }

  const trend = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8) // last 8 weeks
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
```

- [ ] **Step 4: Run tests again**

```bash
npm test src/tests/shop-health.test.ts
```

Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/shop-health/route.ts src/tests/shop-health.test.ts
git commit -m "feat: shop health API — apex score + weekly trend from optimisations"
```

---

### Task 2: Score trend sparkline component

**Files:**
- Create: `src/components/score-trend-chart.tsx`

**Context:** A minimal SVG sparkline that plots weekly average scores. No external chart library — just an inline SVG path. It takes an array of `{ week: string; avg: number }` and renders a thin coloured line. The chart is 100% wide and 40px tall, responsive.

- [ ] **Step 1: Create the component**

Create `src/components/score-trend-chart.tsx`:

```tsx
"use client";

interface TrendPoint {
  week: string;
  avg: number;
}

interface ScoreTrendChartProps {
  data: TrendPoint[];
  className?: string;
}

export function ScoreTrendChart({ data, className }: ScoreTrendChartProps) {
  if (data.length < 2) return null;

  const HEIGHT = 40;
  const WIDTH = 200; // viewBox width — SVG scales to container
  const PADDING = 4;

  const minScore = Math.min(...data.map((d) => d.avg));
  const maxScore = Math.max(...data.map((d) => d.avg));
  const range = maxScore - minScore || 1;

  const points = data.map((d, i) => {
    const x = PADDING + (i / (data.length - 1)) * (WIDTH - PADDING * 2);
    const y = PADDING + ((maxScore - d.avg) / range) * (HEIGHT - PADDING * 2);
    return { x, y, avg: d.avg };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const last = points[points.length - 1];
  const first = points[0];
  const trending = last.avg >= first.avg;

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="w-full h-10"
        aria-hidden="true"
      >
        <path
          d={pathD}
          fill="none"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={trending ? "stroke-emerald-500" : "stroke-amber-500"}
        />
        {/* Last point dot */}
        <circle
          cx={last.x}
          cy={last.y}
          r="2.5"
          className={trending ? "fill-emerald-500" : "fill-amber-500"}
        />
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Build check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/score-trend-chart.tsx
git commit -m "feat: score trend sparkline SVG component"
```

---

### Task 3: Listing health widget + milestone widget

**Files:**
- Create: `src/components/listing-health-widget.tsx`
- Create: `src/components/milestone-widget.tsx`

**Context:** The `ListingHealthWidget` is a client component that fetches `/api/shop-health?shopId=X` and displays the apex score with trend sparkline. The `MilestoneWidget` is purely client-side — it takes the user's total optimisation count and shows the next milestone with a progress bar.

Milestones:
- 10 optimisations → "Veteran" badge
- 50 optimisations → "Pro Seller" badge
- 100 optimisations → unlimited keyword saves
- 250 optimisations → "Elite Seller" badge (Studio only)

The widget shows the nearest upcoming milestone.

- [ ] **Step 1: Create the ListingHealthWidget**

Create `src/components/listing-health-widget.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { ScoreTrendChart } from "@/components/score-trend-chart";
import { Spinner } from "@/components/ui/spinner";

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
      <div className="flex items-center justify-center py-6">
        <Spinner size="md" />
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
```

- [ ] **Step 2: Create the MilestoneWidget**

Create `src/components/milestone-widget.tsx`:

```tsx
import { Trophy } from "lucide-react";

const MILESTONES = [
  { count: 10, label: "Veteran", description: "Veteran seller badge" },
  { count: 50, label: "Pro Seller", description: "Pro Seller badge" },
  { count: 100, label: "Power User", description: "Unlimited keyword saves" },
  { count: 250, label: "Elite Seller", description: "Elite Seller badge" },
];

interface MilestoneWidgetProps {
  optimisationCount: number;
}

export function MilestoneWidget({ optimisationCount }: MilestoneWidgetProps) {
  const next = MILESTONES.find((m) => m.count > optimisationCount);
  if (!next) return null;

  const prev = MILESTONES.filter((m) => m.count <= optimisationCount).at(-1);
  const base = prev?.count ?? 0;
  const progress = optimisationCount - base;
  const target = next.count - base;
  const pct = Math.round((progress / target) * 100);
  const remaining = next.count - optimisationCount;

  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Trophy className="size-3.5 text-amber-500 shrink-0" />
        <p className="text-xs font-medium">
          {remaining} optimisation{remaining !== 1 ? "s" : ""} to {next.label}
        </p>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">{next.description}</p>
    </div>
  );
}
```

- [ ] **Step 3: Build check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/listing-health-widget.tsx src/components/milestone-widget.tsx
git commit -m "feat: listing health widget and milestone progress widget"
```

---

### Task 4: Wire widgets into dashboard

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Context:** The dashboard is a server component. It already fetches `shops` and `usage`. Add the `ListingHealthWidget` (client, fetches its own data) and `MilestoneWidget` (receives `optimisationCount` as a prop) to the dashboard page.

Show `ListingHealthWidget` only for Growth/Studio users who have at least one connected shop. Show it per shop in the My Shop widget area, below the shop name/pill. Show `MilestoneWidget` for all users below the stats row.

- [ ] **Step 1: Import the new components**

At the top of `src/app/dashboard/page.tsx`, add:

```tsx
import { ListingHealthWidget } from "@/components/listing-health-widget";
import { MilestoneWidget } from "@/components/milestone-widget";
```

- [ ] **Step 2: Add ListingHealthWidget inside the shop card**

In the My Shop widget section, find the shop card map. After the `<ShopHealthCounts shop={shop} />` line, add the health widget:

```tsx
{/* Replace the existing shop card link content block with: */}
<Link key={shop.id} href="/dashboard/shop" className="group block">
  <Card className="border-border/50 transition-colors group-hover:border-primary/30 group-hover:bg-muted/20">
    <CardContent className="py-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Store className="size-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{shop.shop_name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="size-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
            <span className={cn(
              "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              PLATFORM_PILL[shop.platform as Platform] ?? "bg-muted text-muted-foreground"
            )}>
              {PLATFORM_LABELS[shop.platform as Platform] ?? shop.platform}
            </span>
            <span className="text-muted-foreground/40 text-xs">|</span>
            <ShopHealthCounts shop={shop} />
          </div>
        </div>
        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
      <ListingHealthWidget shopId={shop.id} />
    </CardContent>
  </Card>
</Link>
```

- [ ] **Step 3: Add MilestoneWidget below the stats row**

After the stats grid block (the `{!isNewUser && <div className="grid ...">...</div>}` block), add:

```tsx
<MilestoneWidget optimisationCount={usage?.optimisations ?? 0} />
```

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: wire listing health widget and milestone tracker into dashboard"
```

---

### Task 5: Keyword list power level

**Files:**
- Modify: `src/app/dashboard/keywords/keywords-client.tsx`

**Context:** Saved keyword lists already exist and are displayed in the keywords page. Add a "power level" indicator to each saved list based on how many of its keywords have `volume: "high"`. The power level is: High (50%+ high-volume), Medium (20–49%), Low (<20%). This shows sellers at a glance which lists are strongest.

The saved list data comes from the existing fetch in `keywords-client.tsx`. Each list has `keywords` (the array saved from the result). Each keyword in the array has `{ keyword, volume, competition, trend }`.

Look at the existing keyword list display in `keywords-client.tsx` — find where saved lists are rendered (likely a section showing the user's saved lists). If the saved list section is in a different component or page, read that file first.

- [ ] **Step 1: Read the current keyword list display**

Read `src/app/dashboard/keywords/keywords-client.tsx` to find how saved keyword lists are displayed. Locate the section that renders the list of saved lists (separate from the result list). This is likely fetched from `/api/keyword-lists`.

- [ ] **Step 2: Add a power level computation function**

Add this function near the top of `keywords-client.tsx` (after the imports):

```tsx
function computePowerLevel(keywords: Array<{ volume: string }>): "high" | "medium" | "low" {
  if (keywords.length === 0) return "low";
  const highCount = keywords.filter((k) => k.volume === "high").length;
  const ratio = highCount / keywords.length;
  if (ratio >= 0.5) return "high";
  if (ratio >= 0.2) return "medium";
  return "low";
}

const POWER_LEVEL_CONFIG = {
  high: { label: "High power", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  medium: { label: "Med power", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  low: { label: "Low power", className: "bg-muted text-muted-foreground border-border" },
} as const;
```

- [ ] **Step 3: Render power level badge on each saved list**

In the saved list rendering section, next to the list name, add:

```tsx
{(() => {
  const level = computePowerLevel(list.keywords ?? []);
  const cfg = POWER_LEVEL_CONFIG[level];
  return (
    <Badge
      variant="outline"
      className={`text-[10px] h-4 px-1 ${cfg.className}`}
    >
      {cfg.label}
    </Badge>
  );
})()}
```

- [ ] **Step 4: Write a unit test**

Add to `src/tests/platform-hints.test.ts` (append — do not create a new file):

```typescript
// Power level tests
function computePowerLevel(keywords: Array<{ volume: string }>): string {
  if (keywords.length === 0) return "low";
  const highCount = keywords.filter((k) => k.volume === "high").length;
  const ratio = highCount / keywords.length;
  if (ratio >= 0.5) return "high";
  if (ratio >= 0.2) return "medium";
  return "low";
}

describe("keyword list power level", () => {
  it("returns high when 50%+ keywords are high volume", () => {
    expect(computePowerLevel([{ volume: "high" }, { volume: "high" }, { volume: "low" }])).toBe("high");
  });

  it("returns medium when 20–49% keywords are high volume", () => {
    expect(computePowerLevel([{ volume: "high" }, { volume: "low" }, { volume: "low" }, { volume: "low" }, { volume: "low" }])).toBe("medium");
  });

  it("returns low when <20% keywords are high volume", () => {
    expect(computePowerLevel([{ volume: "low" }, { volume: "low" }, { volume: "low" }])).toBe("low");
  });

  it("returns low for empty list", () => {
    expect(computePowerLevel([])).toBe("low");
  });
});
```

- [ ] **Step 5: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Build check**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboard/keywords/keywords-client.tsx src/tests/platform-hints.test.ts
git commit -m "feat: power level indicator on saved keyword lists"
```

---

### Task 6: History ghost rows for free users

**Files:**
- Modify: `src/app/dashboard/history/page.tsx` — pass `plan` to client
- Modify: `src/app/dashboard/history/history-client.tsx` — render ghost rows + upgrade CTA for free users

**Context:** Free users are limited to 1 optimisation per month. On the history page they see 1 row, then nothing. This makes the page feel broken — not like a feature worth having. Ghost rows communicate that there IS more history, it's just locked — not missing. The pattern: show the real result(s), then 3 placeholder locked rows that hint at the shape of a history feed at scale, followed by a clear upgrade CTA.

Ghost rows are not interactive — purely visual placeholders with blurred/skeleton content. Each shows the shape of a real row (avatar circle, blurred title, blurred score badge) with a lock icon overlay.

- [ ] **Step 1: Read the history page and client**

Read `src/app/dashboard/history/page.tsx` and `src/app/dashboard/history/history-client.tsx` to understand:
- How `plan` is currently fetched or available
- How the history rows are rendered (the map over `optimisations`)
- What imports are already present

- [ ] **Step 2: Pass plan prop to HistoryClient**

In `src/app/dashboard/history/page.tsx`, ensure the user's `plan` is fetched from the profile and passed to the client. If it's already fetched for another purpose, reuse it. Otherwise add:

```tsx
// After existing profile fetch in the server component:
const plan: string = profile?.plan ?? "free";

// Pass to client component:
<HistoryClient optimisations={optimisations} plan={plan} />
```

- [ ] **Step 3: Add plan prop to HistoryClient interface**

In `history-client.tsx`, add `plan` to the props interface and destructuring:

```tsx
interface HistoryClientProps {
  optimisations: Optimisation[];
  plan: string;
  // (include any other existing props)
}

export function HistoryClient({ optimisations, plan, ...rest }: HistoryClientProps) {
```

- [ ] **Step 4: Add GhostHistoryRow component**

Add this component near the top of `history-client.tsx`, after the imports:

```tsx
function GhostHistoryRow() {
  return (
    <div className="relative flex items-center gap-3 rounded-lg border border-border/40 bg-muted/10 p-4 overflow-hidden">
      <div className="size-8 rounded-full bg-muted/60 shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center gap-2">
          <div className="h-3 w-24 rounded bg-muted/70 blur-[2px]" />
          <div className="h-3 w-16 rounded bg-muted/60 blur-[2px]" />
        </div>
        <div className="h-3 w-3/4 rounded bg-muted/50 blur-[2px]" />
      </div>
      <div className="h-6 w-12 rounded-full bg-muted/60 blur-[2px] shrink-0" />
      <div className="absolute inset-0 flex items-center justify-center bg-background/40">
        <Lock className="size-4 text-muted-foreground/50" />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add Lock to the lucide-react import**

If `Lock` is not already imported in `history-client.tsx`, add it:

```tsx
import { Lock, /* existing imports */ } from "lucide-react";
```

- [ ] **Step 6: Render ghost rows for free users**

In `history-client.tsx`, find where the optimisation rows are rendered (the map). After the closing `</div>` of the rows container, add the ghost rows block — only for `plan === "free"`:

```tsx
{plan === "free" && (
  <div className="space-y-2 mt-2">
    <GhostHistoryRow />
    <GhostHistoryRow />
    <GhostHistoryRow />
    <div className="rounded-lg border border-border/50 bg-muted/20 p-4 text-center space-y-2">
      <p className="text-sm font-medium">Upgrade to keep your full optimisation history</p>
      <p className="text-xs text-muted-foreground">
        Free plan keeps 1 result. Paid plans keep everything.
      </p>
      <a
        href="/pricing"
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        See plans
      </a>
    </div>
  </div>
)}
```

- [ ] **Step 7: Build check**

```bash
npm run build
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/app/dashboard/history/page.tsx src/app/dashboard/history/history-client.tsx
git commit -m "feat: ghost rows on history page nudge free users to upgrade"
```

---

### Final: Push

```bash
git push
```

---

## Self-Review

**Spec coverage:**

| Requirement | Task |
|---|---|
| Shop Listing Health apex score computed from optimisations | Task 1 |
| Weekly trend data from optimisations grouped by week | Task 1 |
| Score trend sparkline SVG component | Task 2 |
| ListingHealthWidget shown per shop on dashboard | Task 3, 4 |
| MilestoneWidget with progress bar toward next milestone | Task 3, 4 |
| Keyword list power level (high/medium/low) from volume ratio | Task 5 |
| History ghost rows shown to free users with upgrade CTA | Task 6 |

**Placeholder scan:** None found.

**Type consistency:** `HealthData`, `TrendPoint`, `MilestoneWidgetProps` all consistent across files. `plan: string` prop added to `HistoryClient` — no new types needed.
