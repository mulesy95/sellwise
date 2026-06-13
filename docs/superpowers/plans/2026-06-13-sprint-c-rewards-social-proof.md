# Sprint C — Rewards & Social Proof Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add variable rewards to SellWise — Big Lift celebrations when a re-optimisation lifts a score by 30+ points, a badge system (Veteran/Pro/Elite), an optimisation streak counter with weekly goal, SellWise micro-notes on high-score results, and a peer comparison badge showing when a seller is in the top 5% for their platform.

**Architecture:** Badges and streak data live in new columns on `profiles`. Big Lift detection happens client-side by comparing `beforeScore` and `afterScore`. Micro-notes are static strings selected by score bucket — no extra AI call. Peer comparison uses an aggregate query against `optimisations` to find the platform's weekly p95 score.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind 4, shadcn/ui, Supabase

---

## File Map

**Create:**
- `supabase/migrations/20260613130000_add_rewards_to_profiles.sql` — `badges jsonb`, `optimisation_streak int`, `streak_last_date date`, `weekly_goal int`
- `src/app/api/streak/route.ts` — POST: update streak on optimisation completion
- `src/components/big-lift-toast.tsx` — animated celebration shown on 30+ point lift
- `src/tests/rewards.test.ts` — unit tests for streak logic and badge unlock logic

**Modify:**
- `src/app/dashboard/optimise/optimise-client.tsx` — trigger Big Lift celebration, show micro-note, show peer comparison badge
- `src/app/api/optimise/route.ts` — call streak update, check peer comparison p95
- `src/app/dashboard/page.tsx` — add streak widget to dashboard header

---

### Task 1: DB migration for rewards columns

**Files:**
- Create: `supabase/migrations/20260613130000_add_rewards_to_profiles.sql`

**Context:** Three new columns on `profiles`:
- `badges jsonb NOT NULL DEFAULT '[]'` — array of badge slugs the user has earned, e.g. `["veteran", "pro_seller"]`
- `optimisation_streak int NOT NULL DEFAULT 0` — current consecutive weeks with at least `weekly_goal` optimisations
- `streak_last_date date` — the Monday of the most recently counted week
- `weekly_goal int NOT NULL DEFAULT 5` — how many optimisations per week the user wants to hit

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/20260613130000_add_rewards_to_profiles.sql`:

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS optimisation_streak int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_last_date date,
  ADD COLUMN IF NOT EXISTS weekly_goal int NOT NULL DEFAULT 5;
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected: migration applied successfully, no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260613130000_add_rewards_to_profiles.sql
git commit -m "feat: add badges, streak, and weekly_goal columns to profiles"
```

---

### Task 2: Streak update API route

**Files:**
- Create: `src/app/api/streak/route.ts`
- Create: `src/tests/rewards.test.ts`

**Context:** After each successful optimisation, the client POSTs to `/api/streak`. The route checks if the current ISO week already has an entry for the user. If not, it checks whether the user met their `weekly_goal` in the previous week and either increments or resets the streak. It also checks badge unlock conditions.

Badge unlock conditions:
- `veteran`: total optimisations >= 10
- `pro_seller`: total optimisations >= 50
- `power_user`: total optimisations >= 100
- `elite_seller`: total optimisations >= 250

- [ ] **Step 1: Write failing tests**

Create `src/tests/rewards.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

// Pure logic mirrors streak route
function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function computeBadges(totalOptimisations: number, existing: string[]): string[] {
  const earned = [...existing];
  const milestones = [
    { count: 10, badge: "veteran" },
    { count: 50, badge: "pro_seller" },
    { count: 100, badge: "power_user" },
    { count: 250, badge: "elite_seller" },
  ];
  for (const { count, badge } of milestones) {
    if (totalOptimisations >= count && !earned.includes(badge)) {
      earned.push(badge);
    }
  }
  return earned;
}

describe("getMondayOfWeek", () => {
  it("returns Monday for a Wednesday", () => {
    expect(getMondayOfWeek(new Date("2026-06-10"))).toBe("2026-06-08"); // Wed → Mon
  });

  it("returns Monday for a Sunday", () => {
    expect(getMondayOfWeek(new Date("2026-06-14"))).toBe("2026-06-08"); // Sun → previous Mon
  });

  it("returns same day for a Monday", () => {
    expect(getMondayOfWeek(new Date("2026-06-08"))).toBe("2026-06-08");
  });
});

describe("computeBadges", () => {
  it("unlocks veteran at 10 optimisations", () => {
    expect(computeBadges(10, [])).toContain("veteran");
  });

  it("unlocks pro_seller at 50", () => {
    expect(computeBadges(50, [])).toContain("pro_seller");
  });

  it("does not re-add existing badges", () => {
    const result = computeBadges(10, ["veteran"]);
    expect(result.filter((b) => b === "veteran")).toHaveLength(1);
  });

  it("unlocks multiple badges at once", () => {
    const result = computeBadges(100, []);
    expect(result).toContain("veteran");
    expect(result).toContain("pro_seller");
    expect(result).toContain("power_user");
  });

  it("does not unlock badge below threshold", () => {
    expect(computeBadges(9, [])).not.toContain("veteran");
  });
});
```

- [ ] **Step 2: Run tests to confirm they pass**

```bash
npm test src/tests/rewards.test.ts
```

Expected: all 8 tests pass.

- [ ] **Step 3: Create the streak API route**

Create `src/app/api/streak/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function computeBadges(totalOptimisations: number, existing: string[]): string[] {
  const earned = [...existing];
  const milestones = [
    { count: 10, badge: "veteran" },
    { count: 50, badge: "pro_seller" },
    { count: 100, badge: "power_user" },
    { count: 250, badge: "elite_seller" },
  ];
  for (const { count, badge } of milestones) {
    if (totalOptimisations >= count && !earned.includes(badge)) {
      earned.push(badge);
    }
  }
  return earned;
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const admin = createAdminClient();

  const [{ data: profile }, { count: totalCount }] = await Promise.all([
    admin
      .from("profiles")
      .select("badges, optimisation_streak, streak_last_date, weekly_goal")
      .eq("id", user.id)
      .single(),
    admin
      .from("optimisations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  if (!profile) return NextResponse.json({ ok: true });

  const thisWeek = getMondayOfWeek(new Date());
  const total = totalCount ?? 0;

  // Count optimisations this week
  const weekStart = new Date(thisWeek);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { count: weekCount } = await admin
    .from("optimisations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", weekStart.toISOString())
    .lt("created_at", weekEnd.toISOString());

  const metGoalThisWeek = (weekCount ?? 0) >= profile.weekly_goal;

  // Streak logic: if this is a new week and goal was met last week, increment
  let newStreak = profile.optimisation_streak;
  let newLastDate = profile.streak_last_date;

  if (profile.streak_last_date !== thisWeek) {
    if (metGoalThisWeek) {
      // Check if previous week's date was last week's Monday
      const prevWeek = new Date(thisWeek);
      prevWeek.setDate(prevWeek.getDate() - 7);
      const prevWeekStr = prevWeek.toISOString().slice(0, 10);
      const wasConsecutive = profile.streak_last_date === prevWeekStr;
      newStreak = wasConsecutive ? newStreak + 1 : 1;
      newLastDate = thisWeek;
    }
  }

  const newBadges = computeBadges(total, (profile.badges as string[]) ?? []);

  await admin
    .from("profiles")
    .update({
      optimisation_streak: newStreak,
      streak_last_date: newLastDate,
      badges: newBadges,
    })
    .eq("id", user.id);

  const newBadgesEarned = newBadges.filter(
    (b) => !((profile.badges as string[]) ?? []).includes(b)
  );

  return NextResponse.json({
    streak: newStreak,
    badges: newBadges,
    newBadges: newBadgesEarned,
    weekCount: weekCount ?? 0,
    weeklyGoal: profile.weekly_goal,
    metGoal: metGoalThisWeek,
  });
}
```

- [ ] **Step 4: Call streak endpoint from optimise client**

In `src/app/dashboard/optimise/optimise-client.tsx`, in the `handleSubmit` function, after a successful result is set, fire the streak update in the background:

```tsx
// After: setResult(data as OptimisedListing);
void fetch("/api/streak", { method: "POST" }).catch(() => null);
```

This is fire-and-forget — do not await it, do not show errors to the user.

- [ ] **Step 5: Build check**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/streak/route.ts src/tests/rewards.test.ts src/app/dashboard/optimise/optimise-client.tsx
git commit -m "feat: streak tracking and badge unlock API route"
```

---

### Task 3: Big Lift celebration

**Files:**
- Create: `src/components/big-lift-toast.tsx`
- Modify: `src/app/dashboard/optimise/optimise-client.tsx`

**Context:** When a seller re-optimises an existing listing (`beforeScore` is defined) and the lift is 30+ points, show a celebratory toast. The toast uses the existing `sonner` toast library — the `toast.custom()` API allows a custom rendered element. Keep it simple: a short positive message with the score delta.

- [ ] **Step 1: Create the BigLift toast helper**

Create `src/components/big-lift-toast.tsx`:

```tsx
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";

export function showBigLiftToast(delta: number) {
  toast.custom(
    () => (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 shadow-lg">
        <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            Big lift — +{delta} points
          </p>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
            That's a significant improvement.
          </p>
        </div>
      </div>
    ),
    { duration: 5000 }
  );
}
```

- [ ] **Step 2: Trigger the toast in OptimiseClient**

In `src/app/dashboard/optimise/optimise-client.tsx`, import the helper:

```tsx
import { showBigLiftToast } from "@/components/big-lift-toast";
```

In `handleSubmit`, after computing `afterScore` and `beforeScore`, add:

```tsx
// After the result is set and scores are computed
if (beforeScore !== null && afterScore !== null) {
  const delta = afterScore - beforeScore;
  if (delta >= 30) showBigLiftToast(delta);
}
```

`beforeScore` and `afterScore` are already computed from `scoreOptimisedListing` in the render. The scores need to be computed at submission time, not render time. Check how `beforeScore` and `afterScore` are currently computed in the component and ensure they are available inside `handleSubmit` after the result is set. If they are derived from `result` in render (not state), compute them inline after setting the result:

```tsx
const newResult = data as OptimisedListing;
setResult(newResult);

const newAfterScore = scoreOptimisedListing({ platform, ...newResult });
const newBeforeScore = newResult.original
  ? scoreOptimisedListing({ platform, ...newResult.original as Record<string, unknown> })
  : null;

if (newBeforeScore !== null && newAfterScore - newBeforeScore >= 30) {
  showBigLiftToast(newAfterScore - newBeforeScore);
}
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: no errors. If `scoreOptimisedListing` has a type mismatch, cast `newResult.original` appropriately — it is `Record<string, string | string[]>` on `OptimisedListing`.

- [ ] **Step 4: Commit**

```bash
git add src/components/big-lift-toast.tsx src/app/dashboard/optimise/optimise-client.tsx
git commit -m "feat: Big Lift celebration toast on 30+ point score improvement"
```

---

### Task 4: Variable SellWise micro-notes

**Files:**
- Modify: `src/app/dashboard/optimise/optimise-client.tsx`

**Context:** On high-scoring results (score >= 80), show a short, occasional contextual note from SellWise below the score display. The note is static — chosen from a small pool based on score bucket and platform — shown only ~30% of the time (determined by a seeded random on the optimisation ID so it's stable, not flickering on re-render).

- [ ] **Step 1: Add micro-note pools**

In `optimise-client.tsx`, add this constant near the `PLATFORM_DESCRIPTIONS` block:

```tsx
const HIGH_SCORE_NOTES: string[] = [
  "That title is front-loaded well — the algorithm will notice.",
  "Strong keyword density without reading like a keyword list.",
  "The description opens on the right detail.",
  "Clean and specific — exactly what platform search rewards.",
  "Good structure. The first line does the heavy lifting.",
];

function getMicroNote(id: string | undefined, score: number): string | null {
  if (!id || score < 80) return null;
  // Stable pseudo-random from ID — show roughly 30% of the time
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  if (hash % 10 > 2) return null; // ~70% chance of null
  return HIGH_SCORE_NOTES[hash % HIGH_SCORE_NOTES.length];
}
```

- [ ] **Step 2: Render the micro-note below the ScoreDisplay**

In the JSX result area, find where `<ScoreDisplay>` is rendered. Below it, add:

```tsx
{(() => {
  const note = getMicroNote(result?.id, afterScore ?? 0);
  return note ? (
    <p className="text-xs text-muted-foreground/70 italic px-1">
      {note}
    </p>
  ) : null;
})()}
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/optimise/optimise-client.tsx
git commit -m "feat: variable SellWise micro-notes on high-score results"
```

---

### Task 5: Peer comparison badge

**Files:**
- Modify: `src/app/api/optimise/route.ts`
- Modify: `src/app/dashboard/optimise/optimise-client.tsx`

**Context:** When a seller's optimised listing scores in the top 5% of all scores for that platform in the past 7 days, return a `topPercent: true` flag in the API response. The client shows a "Top 5% on [platform] this week" badge below the score.

The p95 threshold is computed server-side: fetch all scores for the platform in the last 7 days, sort them, take the 95th percentile value.

- [ ] **Step 1: Add peer comparison to the optimise route**

In `src/app/api/optimise/route.ts`, in the `POST` handler, after `listing` is parsed and scored, add a peer comparison check. Add this just before the final `return NextResponse.json(...)`:

```typescript
// Peer comparison — is this score in the top 5% for this platform this week?
let topPercent = false;
try {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentScores } = await supabase
    .from("optimisations")
    .select("score")
    .eq("platform", platform)
    .gte("created_at", weekAgo)
    .not("score", "is", null);

  if (recentScores && recentScores.length >= 20) {
    const scores = recentScores
      .map((r) => r.score as number)
      .sort((a, b) => a - b);
    const p95index = Math.floor(scores.length * 0.95);
    const p95 = scores[p95index];
    // Compute the current listing's score
    const { scoreOptimisedListing } = await import("@/lib/listing-score");
    const currentScore = scoreOptimisedListing({ platform, ...listing });
    topPercent = currentScore >= p95;
  }
} catch {
  // Non-critical — silently ignore
}
```

Then update the final return to include `topPercent`:

```typescript
return NextResponse.json({ ...listing, platform, used: used + 1, limit, id: optimisationId, topPercent });
```

- [ ] **Step 2: Add topPercent to OptimisedListing interface**

In `optimise-client.tsx`, add to the `OptimisedListing` interface:

```tsx
topPercent?: boolean;
```

- [ ] **Step 3: Render the peer comparison badge**

Below the micro-note (from Task 4), add:

```tsx
{result?.topPercent && (
  <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
    <TrendingUp className="size-3" />
    Top 5% on {PLATFORM_LABELS[platform]} this week
  </div>
)}
```

`PLATFORM_LABELS` is already imported. `TrendingUp` is already imported.

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/optimise/route.ts src/app/dashboard/optimise/optimise-client.tsx
git commit -m "feat: peer comparison top-5% badge on outstanding scores"
```

---

### Task 6: Streak widget on dashboard

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Context:** Show the user's current optimisation streak and weekly progress in the dashboard header area. The streak data lives in `profiles` — the dashboard server component can fetch it directly.

- [ ] **Step 1: Fetch streak data in DashboardPage**

In `src/app/dashboard/page.tsx`, update the `Promise.all` to also fetch `badges`, `optimisation_streak`, `weekly_goal` from `profiles`:

```typescript
const [usage, shopsResult, profileResult] = await Promise.all([
  user ? getUsageData(user.id) : null,
  user
    ? admin.from("shops").select("id, shop_name, platform").eq("user_id", user.id).order("created_at", { ascending: true })
    : { data: [] },
  user
    ? admin.from("profiles").select("badges, optimisation_streak, weekly_goal").eq("id", user.id).single()
    : { data: null },
]);

const profile = profileResult.data;
const streak = profile?.optimisation_streak ?? 0;
const weeklyGoal = profile?.weekly_goal ?? 5;
const badges = (profile?.badges ?? []) as string[];
```

- [ ] **Step 2: Add streak display to the header**

In the dashboard header section, below the `<p>` subtitle line, add a streak indicator when `streak > 0`:

```tsx
{streak > 0 && (
  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
    <span>🔥</span>
    {streak} week streak
  </div>
)}
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: streak indicator in dashboard header"
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
| DB columns: badges, optimisation_streak, streak_last_date, weekly_goal | Task 1 |
| Streak update API — increment/reset on weekly goal | Task 2 |
| Badge unlocks at 10/50/100/250 optimisations | Task 2 |
| Streak called fire-and-forget after each optimisation | Task 2 |
| Big Lift celebration toast on 30+ point improvement | Task 3 |
| Variable SellWise micro-notes on high-score results (~30% frequency) | Task 4 |
| Peer comparison top-5% badge from platform weekly p95 | Task 5 |
| Streak week fire widget in dashboard header | Task 6 |

**Placeholder scan:** None found.

**Type consistency:** `badges` typed as `string[]` throughout. `topPercent` on `OptimisedListing` and on API response both `boolean`.
