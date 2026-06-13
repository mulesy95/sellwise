# Product Quality Sprint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Four product quality features: free tier scoring hook, inline SEO score with before/after dial and character count bars, AI output feedback (thumbs up/down), and eBay item specifics.

**Architecture:** A new pure-function `scoreOptimisedListing()` drives the inline score display — no extra AI call, fast, client-side. The optimise API is updated to return the row `id` so feedback can be tied to specific optimisations. eBay item specifics extend the AI prompt and result type with a structured key-value field.

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase, Vitest (unit tests), Tailwind 4, shadcn/ui

---

## File Map

**Create:**
- `src/lib/listing-score.ts` — `scoreOptimisedListing(listing): number`, pure heuristic, no deps
- `src/tests/listing-score.test.ts` — Vitest unit tests for the score function
- `vitest.config.ts` — Vitest config with `@/` alias resolution
- `src/app/api/feedback/route.ts` — PATCH endpoint, records thumbs up/down on an optimisation row
- `supabase/migrations/20260613120000_add_feedback_to_optimisations.sql` — adds `feedback` column

**Modify:**
- `package.json` — add vitest dev dep + `"test"` script
- `src/app/dashboard/audit/page.tsx` — remove FeatureGate for free users, pass `plan` prop to `AuditClient`
- `src/app/api/audit/route.ts` — remove free-plan block, adjust limit logic for free tier
- `src/app/dashboard/audit/audit-client.tsx` — accept `{ plan: string }` prop, add "Optimise this listing" CTA below results
- `src/app/dashboard/optimise/optimise-client.tsx` — inline score display, char count progress bars, feedback buttons (ThumbsUp/Down)
- `src/app/api/optimise/route.ts` — return `id` in response, update eBay prompt for `itemSpecifics`
- `src/app/dashboard/history/history-client.tsx` — add feedback buttons per row
- `src/components/listing-diff.tsx` — add `itemSpecifics` to `FIELD_LABELS`

---

### Task 1: Free tier audit access

**Files:**
- Modify: `src/app/dashboard/audit/page.tsx`
- Modify: `src/app/api/audit/route.ts`
- Modify: `src/app/dashboard/audit/audit-client.tsx`

**Context:** Currently free users hit a `FeatureGate` on the audit page and the API route also returns 402 for `effectivePlan === "free"`. The goal is to allow free users to audit (see score + improvements) — this is the hook to upsell. The "Optimise this listing" action at the bottom of the result is what gets gated.

- [ ] **Step 1: Update `audit/page.tsx` to pass plan to AuditClient**

Replace the entire file content:

```typescript
// src/app/dashboard/audit/page.tsx
import { createClient } from "@/lib/supabase/server";
import { getUsageData } from "@/lib/usage";
import { AuditClient } from "./audit-client";

export default async function AuditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const usage = await getUsageData(user.id);

  return <AuditClient plan={usage.effectivePlan} />;
}
```

- [ ] **Step 2: Remove free-tier block from `audit/route.ts`**

In `src/app/api/audit/route.ts`, find the block starting at line 270 and remove it entirely:

```typescript
// DELETE this entire block (lines ~270-278):
  const usageData = await getUsageData(user.id);
  if (usageData.effectivePlan === "free") {
    return NextResponse.json(
      {
        error: "Listing audits are available on paid plans.",
        code: "FEATURE_GATED",
      },
      { status: 402 }
    );
  }
```

After removing that block, the remaining logic that uses `used` and `limit` still references `usageData`. Update the audit limit logic to allow free users unlimited audits (the audit is the FOMO hook — cap-free is intentional):

```typescript
  // Replace the limit check block after removing the free-plan block:
  const usageData = await getUsageData(user.id);
  // Free tier: unlimited audits (audit is the upsell hook, not a paid feature)
  const used = usageData.audits;
  const limit = usageData.effectivePlan === "free" ? null : usageData.limit;
  if (limit !== null && used >= limit) {
    return NextResponse.json(
      {
        error: `You've used all ${limit} audits for this month. Upgrade your plan to continue.`,
        code: "LIMIT_EXCEEDED",
      },
      { status: 402 }
    );
  }
```

- [ ] **Step 3: Update `AuditClient` to accept plan prop and add "Optimise this" CTA**

In `src/app/dashboard/audit/audit-client.tsx`, update the function signature:

```typescript
// Change line 180 from:
export function AuditClient() {
// To:
export function AuditClient({ plan }: { plan: string }) {
```

Find the function `buildOptimiseUrl` (it does not exist yet — add it after `copyLink`). Add this helper function after `copyLink()`:

```typescript
  function buildOptimiseUrl() {
    if (!lastPayload || !result) return "/dashboard/optimise";
    const p = detectedPlatform ?? platform;
    const parts = Object.entries(lastPayload)
      .filter(([k]) => k !== "platform" && k !== "url")
      .map(([k, v]) => `${k}: ${v}`)
      .filter(([, v]) => (v as string).trim());
    const existingContent = parts.join("\n\n").slice(0, 2000);
    return `/dashboard/optimise?platform=${p}&existingContent=${encodeURIComponent(existingContent)}`;
  }
```

Then add the CTA at the bottom of the results card. Find the closing of the share block (look for the `</Card>` that closes the results card — after the share section) and add this just before it:

```tsx
              {/* Optimise CTA */}
              <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Ready to fix these issues?
                </p>
                {plan === "free" ? (
                  <Button size="sm" className="h-7 text-xs gap-1.5" onClick={() => setUpgradeOpen(true)}>
                    <Sparkles className="size-3" />
                    Optimise this listing
                  </Button>
                ) : (
                  <Button size="sm" className="h-7 text-xs gap-1.5" asChild>
                    <a href={buildOptimiseUrl()}>
                      <Sparkles className="size-3" />
                      Optimise this listing
                    </a>
                  </Button>
                )}
              </div>
```

Note: `Sparkles` is already imported from lucide-react in this file. `Button` is already imported.

- [ ] **Step 4: Verify type checks pass**

```bash
npx tsc --noEmit
```

Expected: no errors related to the changed files.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/audit/page.tsx src/app/api/audit/route.ts src/app/dashboard/audit/audit-client.tsx
git commit -m "feat: open audit to free users with optimise CTA upsell"
```

---

### Task 2: Listing score function + Vitest setup

**Files:**
- Create: `src/lib/listing-score.ts`
- Create: `src/tests/listing-score.test.ts`
- Create: `vitest.config.ts`
- Modify: `package.json`

**Context:** `scoreOptimisedListing` is a pure heuristic function — no AI call, no Supabase. It scores 0–100 per platform based on field lengths and counts. Used client-side after optimise returns to show before/after score. The function needs to handle the `original` shape (Record<string, string | string[]>) as well as the full OptimisedListing — so it accepts a minimal interface.

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest
```

Expected: vitest appears in `package.json` devDependencies.

- [ ] **Step 2: Add test script to `package.json`**

In `package.json`, add `"test": "vitest run"` to the `"scripts"` block:

```json
"scripts": {
  "dev": "cross-env NODE_OPTIONS=--use-system-ca next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run"
},
```

- [ ] **Step 3: Create `vitest.config.ts`**

```typescript
// vitest.config.ts
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 4: Write the failing test first**

Create `src/tests/listing-score.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { scoreOptimisedListing } from "@/lib/listing-score";

describe("scoreOptimisedListing", () => {
  describe("etsy", () => {
    it("returns 100 for a perfect listing", () => {
      const score = scoreOptimisedListing({
        platform: "etsy",
        title: "Handmade Ceramic Coffee Mug for Coffee Lovers Hand Thrown Stoneware Cup",
        tags: ["ceramic mug", "coffee lover gift", "handmade pottery", "stoneware cup", "minimalist mug",
               "pottery gift", "hand thrown cup", "coffee mug gift", "unique mug", "boho kitchen",
               "artisan mug", "ceramic gift", "handmade mug"],
        description: "A short description that is at least one hundred and fifty words long. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.",
      });
      expect(score).toBe(100);
    });

    it("returns 0 for empty listing", () => {
      expect(scoreOptimisedListing({ platform: "etsy" })).toBe(0);
    });

    it("scores partial listings proportionally", () => {
      const titleOnly = scoreOptimisedListing({
        platform: "etsy",
        title: "Handmade Ceramic Coffee Mug for Coffee Lovers",
      });
      expect(titleOnly).toBeGreaterThan(0);
      expect(titleOnly).toBeLessThan(50);
    });

    it("penalises title over 140 chars", () => {
      const shortTitle = scoreOptimisedListing({
        platform: "etsy",
        title: "Handmade Ceramic Coffee Mug",
      });
      const longTitle = scoreOptimisedListing({
        platform: "etsy",
        title: "A".repeat(141),
      });
      expect(shortTitle).toBeGreaterThanOrEqual(longTitle);
    });

    it("rewards 13 tags over fewer tags", () => {
      const thirteenTags = scoreOptimisedListing({
        platform: "etsy",
        tags: new Array(13).fill("tag"),
      });
      const fiveTags = scoreOptimisedListing({
        platform: "etsy",
        tags: new Array(5).fill("tag"),
      });
      expect(thirteenTags).toBeGreaterThan(fiveTags);
    });
  });

  describe("amazon", () => {
    it("rewards 5 bullets over fewer", () => {
      const five = scoreOptimisedListing({
        platform: "amazon",
        title: "Great Product with Excellent Quality and Long Description of Features",
        bullets: ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"],
      });
      const two = scoreOptimisedListing({
        platform: "amazon",
        title: "Great Product with Excellent Quality and Long Description of Features",
        bullets: ["bullet 1", "bullet 2"],
      });
      expect(five).toBeGreaterThan(two);
    });
  });

  describe("shopify", () => {
    it("rewards meta title in 40-60 char range", () => {
      const optimal = scoreOptimisedListing({
        platform: "shopify",
        metaTitle: "Handmade Ceramic Mug | Free Shipping",
        metaDescription: "A hand-thrown stoneware coffee mug, food-safe glaze, perfect for morning coffee lovers who appreciate artisan pottery.",
      });
      const tooShort = scoreOptimisedListing({
        platform: "shopify",
        metaTitle: "Mug",
        metaDescription: "A hand-thrown stoneware coffee mug, food-safe glaze, perfect for morning coffee lovers who appreciate artisan pottery.",
      });
      expect(optimal).toBeGreaterThan(tooShort);
    });
  });

  describe("ebay", () => {
    it("rewards title in 50-80 char range", () => {
      const good = scoreOptimisedListing({
        platform: "ebay",
        title: "Sony PlayStation 5 Console Disc Edition 825GB Brand New Sealed",
        description: "Brand new sealed PlayStation 5 disc edition. Includes controller and all original accessories. Ready to ship same day.",
      });
      const poor = scoreOptimisedListing({
        platform: "ebay",
        title: "PS5",
      });
      expect(good).toBeGreaterThan(poor);
    });
  });

  describe("social", () => {
    it("scores caption + postCopy + hashtags", () => {
      const full = scoreOptimisedListing({
        platform: "social",
        caption: "Hand-thrown stoneware that holds heat longer than machine-made mugs.",
        postCopy: "Made in small batches from local clay. Food-safe glaze, dishwasher safe. Each piece is unique — no two look exactly alike. Great for gifting or treating yourself to something that lasts. Shop the full collection via link in bio.",
        hashtags: new Array(20).fill("ceramicmug"),
      });
      const empty = scoreOptimisedListing({ platform: "social" });
      expect(full).toBeGreaterThan(empty);
      expect(full).toBeGreaterThan(60);
    });
  });
});
```

- [ ] **Step 5: Run test to confirm it fails**

```bash
npm test
```

Expected: FAIL — `scoreOptimisedListing` not found.

- [ ] **Step 6: Implement `src/lib/listing-score.ts`**

```typescript
// src/lib/listing-score.ts

export interface ScoredListing {
  platform: string;
  title?: string;
  tags?: string[];
  bullets?: string[];
  backendKeywords?: string;
  metaTitle?: string;
  metaDescription?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  caption?: string;
  postCopy?: string;
  hashtags?: string[];
}

function wc(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function scoreOptimisedListing(listing: ScoredListing): number {
  switch (listing.platform) {
    case "etsy": {
      const title = listing.title ?? "";
      const tags = listing.tags ?? [];
      const desc = listing.description ?? "";
      let s = 0;
      if (title.length >= 60 && title.length <= 140) s += 40;
      else if (title.length >= 30) s += 25;
      else if (title.length > 0) s += 10;
      if (tags.length === 13) s += 35;
      else if (tags.length >= 10) s += 25;
      else if (tags.length >= 7) s += 15;
      else if (tags.length > 0) s += 8;
      const w = wc(desc);
      if (w >= 150) s += 25;
      else if (w >= 80) s += 15;
      else if (w >= 30) s += 8;
      else if (w > 0) s += 3;
      return Math.min(100, s);
    }
    case "amazon": {
      const title = listing.title ?? "";
      const bullets = listing.bullets ?? [];
      const backend = listing.backendKeywords ?? "";
      let s = 0;
      if (title.length >= 100 && title.length <= 200) s += 30;
      else if (title.length >= 50) s += 20;
      else if (title.length > 0) s += 8;
      if (bullets.length === 5) s += 40;
      else if (bullets.length === 4) s += 30;
      else if (bullets.length === 3) s += 20;
      else if (bullets.length > 0) s += 10;
      if (backend.length >= 100) s += 30;
      else if (backend.length > 0) s += 15;
      return Math.min(100, s);
    }
    case "shopify": {
      const mt = listing.metaTitle ?? "";
      const md = listing.metaDescription ?? "";
      const desc = listing.description ?? "";
      let s = 0;
      if (mt.length >= 40 && mt.length <= 60) s += 30;
      else if (mt.length >= 20) s += 20;
      else if (mt.length > 0) s += 8;
      if (md.length >= 120 && md.length <= 160) s += 40;
      else if (md.length >= 80) s += 25;
      else if (md.length > 0) s += 10;
      const w = wc(desc);
      if (w >= 150) s += 30;
      else if (w >= 80) s += 20;
      else if (w >= 30) s += 10;
      return Math.min(100, s);
    }
    case "ebay": {
      const title = listing.title ?? "";
      const desc = listing.description ?? "";
      let s = 0;
      if (title.length >= 50 && title.length <= 80) s += 50;
      else if (title.length >= 30) s += 35;
      else if (title.length > 0) s += 15;
      const w = wc(desc);
      if (w >= 100) s += 50;
      else if (w >= 50) s += 35;
      else if (w >= 20) s += 20;
      else if (w > 0) s += 10;
      return Math.min(100, s);
    }
    case "woocommerce":
    case "wix":
    case "squarespace": {
      const st = listing.seoTitle ?? "";
      const sd = listing.seoDescription ?? "";
      const desc = listing.description ?? "";
      let s = 0;
      if (st.length >= 40 && st.length <= 60) s += 30;
      else if (st.length >= 20) s += 20;
      else if (st.length > 0) s += 8;
      if (sd.length >= 120 && sd.length <= 160) s += 40;
      else if (sd.length >= 80) s += 25;
      else if (sd.length > 0) s += 10;
      const w = wc(desc);
      if (w >= 150) s += 30;
      else if (w >= 80) s += 20;
      else if (w >= 30) s += 10;
      return Math.min(100, s);
    }
    case "tiktok": {
      const title = listing.title ?? "";
      const desc = listing.description ?? "";
      let s = 0;
      if (title.length >= 50 && title.length <= 100) s += 50;
      else if (title.length >= 25) s += 35;
      else if (title.length > 0) s += 15;
      const w = wc(desc);
      if (w >= 100) s += 50;
      else if (w >= 50) s += 35;
      else if (w >= 20) s += 20;
      else if (w > 0) s += 10;
      return Math.min(100, s);
    }
    case "social": {
      const caption = listing.caption ?? "";
      const postCopy = listing.postCopy ?? "";
      const hashtags = listing.hashtags ?? [];
      let s = 0;
      if (caption.length >= 60 && caption.length <= 125) s += 40;
      else if (caption.length >= 30) s += 25;
      else if (caption.length > 0) s += 10;
      const w = wc(postCopy);
      if (w >= 80) s += 30;
      else if (w >= 40) s += 20;
      else if (w > 0) s += 10;
      if (hashtags.length >= 15 && hashtags.length <= 25) s += 30;
      else if (hashtags.length >= 8) s += 20;
      else if (hashtags.length > 0) s += 10;
      return Math.min(100, s);
    }
    default:
      return 0;
  }
}
```

- [ ] **Step 7: Run tests to confirm they pass**

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/listing-score.ts src/tests/listing-score.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat: listing score heuristic + vitest setup"
```

---

### Task 3: Inline score display + character count bars in optimise-client

**Files:**
- Modify: `src/app/dashboard/optimise/optimise-client.tsx`
- Modify: `src/app/api/optimise/route.ts` (return `id` in response)

**Context:** After a successful optimise call, show a score display above the diff (or just below the card header). If `result.original` is set (improve mode), also score the original content and show before → after. Character count bars replace the plain text counter for fields that have a `maxChars` limit.

**Score display logic:** compute scores in the component using `scoreOptimisedListing`. The `original` object uses the same field names as `OptimisedListing` (set by the AI in improve mode), so pass `{ platform, ...original }` directly.

- [ ] **Step 1: Update optimise API route to return the row `id`**

In `src/app/api/optimise/route.ts`, find the Supabase insert (around line 342) and change it to return the ID:

```typescript
    // Change from:
    await Promise.all([
      incrementUsage(user.id, "optimisations"),
      supabase.from("optimisations").insert({
        user_id: user.id,
        platform,
        product_id: productId ?? null,
        shop_id: shopId ?? null,
        input: { productName, materials, style, targetBuyer, keywords },
        output: listing,
      }),
    ]);

    // Change to:
    const [, { data: insertedRow }] = await Promise.all([
      incrementUsage(user.id, "optimisations"),
      supabase
        .from("optimisations")
        .insert({
          user_id: user.id,
          platform,
          product_id: productId ?? null,
          shop_id: shopId ?? null,
          input: { productName, materials, style, targetBuyer, keywords },
          output: listing,
        })
        .select("id")
        .single(),
    ]);
    const optimisationId = insertedRow?.id ?? null;
```

Then update the response on the last line of the try block:

```typescript
    // Change from:
    return NextResponse.json({ ...listing, platform, used: used + 1, limit });

    // Change to:
    return NextResponse.json({ ...listing, platform, used: used + 1, limit, id: optimisationId });
```

- [ ] **Step 2: Add `id` to `OptimisedListing` interface in optimise-client.tsx**

In `src/app/dashboard/optimise/optimise-client.tsx`, find the `OptimisedListing` interface (line ~31) and add:

```typescript
interface OptimisedListing {
  id?: string;           // ← add this line
  platform: Platform;
  // ... rest unchanged
```

- [ ] **Step 3: Add `scoreOptimisedListing` import and score computation**

At the top of `optimise-client.tsx`, add the import after existing imports:

```typescript
import { scoreOptimisedListing } from "@/lib/listing-score";
import type { ScoredListing } from "@/lib/listing-score";
```

In the `OptimiseClient` component body, add score computation after the `tabs` line (find `const tabs = result ? getResultTabs(result) : [];` and add after it):

```typescript
  const afterScore = result ? scoreOptimisedListing(result as ScoredListing) : null;
  const beforeScore = (result?.original && result?.platform)
    ? scoreOptimisedListing({ platform: result.platform, ...result.original } as ScoredListing)
    : null;
```

- [ ] **Step 4: Add `ScoreDisplay` inline component**

Add this component function just before `export function OptimiseClient`:

```typescript
function ScoreDisplay({ before, after }: { before?: number; after: number }) {
  const color = (s: number) =>
    s >= 70 ? "text-emerald-600 dark:text-emerald-400"
    : s >= 40 ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400";
  const delta = before !== undefined ? after - before : null;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
      {before !== undefined && (
        <>
          <div className="text-center">
            <p className={cn("text-2xl font-bold tabular-nums leading-none", color(before))}>{before}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Before</p>
          </div>
          <span className="text-muted-foreground/50">→</span>
        </>
      )}
      <div className="text-center">
        <p className={cn("text-2xl font-bold tabular-nums leading-none", color(after))}>{after}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{before !== undefined ? "After" : "SEO Score"}</p>
      </div>
      {delta !== null && (
        <div className={cn("text-xs font-semibold", delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
          {delta >= 0 ? "+" : ""}{delta}
        </div>
      )}
      <div className="ml-auto text-[10px] text-muted-foreground/50">/ 100</div>
    </div>
  );
}
```

Note: `cn` is already imported from `@/lib/utils`.

- [ ] **Step 5: Render score display after the result card**

Find the block in the JSX that renders `{result.original && result.changes && (<ListingDiff .../>)}` and add the ScoreDisplay just before it:

```tsx
              {afterScore !== null && (
                <ScoreDisplay
                  before={beforeScore ?? undefined}
                  after={afterScore}
                />
              )}

              {result.original && result.changes && (
                <ListingDiff
                  tabs={tabs}
                  original={result.original}
                  changes={result.changes}
                />
              )}
```

- [ ] **Step 6: Upgrade character count text to progress bar**

In `optimise-client.tsx`, find the character count section (inside the tab content for non-tag, non-bullet fields). The current code looks like:

```tsx
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                {(tab.content as string).length}
                                {tab.maxChars ? ` / ${tab.maxChars} characters` : " characters"}
                              </span>
                              {tab.maxChars && (
                                <span className={(tab.content as string).length <= tab.maxChars ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
                                  {(tab.content as string).length <= tab.maxChars ? "✓ Within limit" : "Too long"}
                                </span>
                              )}
                            </div>
```

Replace it with:

```tsx
                            {tab.maxChars ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{(tab.content as string).length} / {tab.maxChars} characters</span>
                                  <span className={(tab.content as string).length <= tab.maxChars ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
                                    {(tab.content as string).length <= tab.maxChars ? "✓ Within limit" : "Too long"}
                                  </span>
                                </div>
                                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all duration-300",
                                      (tab.content as string).length > tab.maxChars
                                        ? "bg-destructive"
                                        : (tab.content as string).length / tab.maxChars >= 0.9
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                    )}
                                    style={{ width: `${Math.min(100, ((tab.content as string).length / tab.maxChars) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">{(tab.content as string).length} characters</p>
                            )}
```

- [ ] **Step 7: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/app/dashboard/optimise/optimise-client.tsx src/app/api/optimise/route.ts
git commit -m "feat: inline SEO score dial + character count progress bars"
```

---

### Task 4: Feedback data model

**Files:**
- Create: `supabase/migrations/20260613120000_add_feedback_to_optimisations.sql`
- Create: `src/app/api/feedback/route.ts`

**Context:** Adding a `feedback` column (`'up' | 'down' | null`) to the `optimisations` table so sellers can signal whether they found the AI output useful. This feeds product analytics and will eventually be used for model fine-tuning. The API route uses row-level security via `eq("user_id", user.id)` to ensure users can only update their own rows.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260613120000_add_feedback_to_optimisations.sql`:

```sql
ALTER TABLE optimisations
  ADD COLUMN IF NOT EXISTS feedback text
  CHECK (feedback IN ('up', 'down'));
```

- [ ] **Step 2: Apply migration locally**

```bash
npx supabase db push
```

Expected: migration applied without error. If supabase CLI not installed locally, apply via the Supabase dashboard SQL editor.

- [ ] **Step 3: Write the feedback API route**

Create `src/app/api/feedback/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const requestSchema = z.object({
  optimisationId: z.string().uuid(),
  feedback: z.enum(["up", "down"]).nullable(),
});

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { optimisationId, feedback } = parsed.data;

  const { error } = await supabase
    .from("optimisations")
    .update({ feedback })
    .eq("id", optimisationId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260613120000_add_feedback_to_optimisations.sql src/app/api/feedback/route.ts
git commit -m "feat: feedback column migration + PATCH /api/feedback route"
```

---

### Task 5: Feedback UI

**Files:**
- Modify: `src/app/dashboard/optimise/optimise-client.tsx`
- Modify: `src/app/dashboard/history/history-client.tsx`

**Context:** ThumbsUp/ThumbsDown buttons appear below the result in the optimiser (using `result.id` returned by the API) and next to each entry in history (using `opt.id`). Clicking the same button a second time clears the feedback (toggle behaviour). The history page renders a long list — each row needs its own feedback state, stored in a map keyed by optimisation ID.

- [ ] **Step 1: Add feedback state and handler to optimise-client**

In `src/app/dashboard/optimise/optimise-client.tsx`, add `ThumbsUp` and `ThumbsDown` to the lucide-react import line:

```typescript
import { Sparkles, Copy, Check, RotateCcw, RefreshCw, Download, BarChart3, ImagePlus, X, Lock, AlertCircle, ChevronDown, ThumbsUp, ThumbsDown } from "lucide-react";
```

Add feedback state in the component body (after the `showMoreDetail` state):

```typescript
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
```

When `result` changes (new optimise call), reset the feedback:

```typescript
  // Add inside the handleSubmit function, right after setResult(data):
  setFeedback(null);
```

Add the feedback handler function after `setField`:

```typescript
  async function submitFeedback(value: "up" | "down") {
    if (!result?.id) return;
    const next = feedback === value ? null : value;
    setFeedback(next);
    await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optimisationId: result.id, feedback: next }),
    });
  }
```

- [ ] **Step 2: Render feedback buttons in optimise-client**

In the utility links section (find the block with the Download and "Score this listing" buttons, around the `{/* Utility links */}` comment), add the feedback buttons:

```tsx
              {/* Utility links */}
              <div className="flex items-center gap-4 px-1">
                <button
                  onClick={downloadListing}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Download className="size-3" />Download .txt
                </button>
                <span className="text-muted-foreground/30 text-xs">·</span>
                <button
                  onClick={scoreThisListing}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BarChart3 className="size-3" />Score this listing
                </button>
                {result?.id && (
                  <>
                    <span className="text-muted-foreground/30 text-xs">·</span>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span className="text-xs">Helpful?</span>
                      <button
                        onClick={() => submitFeedback("up")}
                        className={cn(
                          "rounded p-1 transition-colors hover:text-foreground",
                          feedback === "up" && "text-emerald-500"
                        )}
                        title="This result was helpful"
                      >
                        <ThumbsUp className="size-3.5" />
                      </button>
                      <button
                        onClick={() => submitFeedback("down")}
                        className={cn(
                          "rounded p-1 transition-colors hover:text-foreground",
                          feedback === "down" && "text-destructive"
                        )}
                        title="This result wasn't helpful"
                      >
                        <ThumbsDown className="size-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
```

- [ ] **Step 3: Add feedback state to history-client**

In `src/app/dashboard/history/history-client.tsx`:

Add `ThumbsUp` and `ThumbsDown` to the lucide-react import:

```typescript
import { History, ChevronDown, ChevronUp, Copy, Check, ExternalLink, Loader2, Archive, ArchiveRestore, ThumbsUp, ThumbsDown } from "lucide-react";
```

Add feedback state map and handler in the `HistoryClient` component body (after the existing state declarations):

```typescript
  const [feedbackMap, setFeedbackMap] = useState<Record<string, "up" | "down" | null>>({});

  async function submitFeedback(optimisationId: string, value: "up" | "down") {
    const current = feedbackMap[optimisationId] ?? null;
    const next = current === value ? null : value;
    setFeedbackMap((m) => ({ ...m, [optimisationId]: next }));
    await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optimisationId, feedback: next }),
    });
  }
```

Also update the `Optimisation` interface to include the existing `feedback` field:

```typescript
interface Optimisation {
  id: string;
  // ... existing fields ...
  is_archived: boolean;
  feedback?: "up" | "down" | null;  // ← add this
}
```

Initialise feedbackMap from loaded data. In the `loadOptimisations` function (find where `setOptimisations(data)` is called), also initialise the map:

```typescript
    // After setOptimisations(data):
    const initial: Record<string, "up" | "down" | null> = {};
    for (const o of data) {
      if (o.feedback) initial[o.id] = o.feedback as "up" | "down";
    }
    setFeedbackMap(initial);
```

- [ ] **Step 4: Render feedback buttons in history-client**

In the history card for each optimisation, find the footer area where the archive/re-optimise buttons are rendered. The exact location is in the `{expanded && (...)}` section near the bottom of each optimisation card. Add the feedback buttons alongside the utility actions.

Look for the div containing the "Re-optimise" button and the archive button. Add feedback buttons adjacent to them:

```tsx
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    {/* existing re-optimise and archive buttons ... */}
                    
                    <div className="flex items-center gap-1 text-muted-foreground ml-auto">
                      <span className="text-[11px]">Helpful?</span>
                      <button
                        onClick={() => submitFeedback(opt.id, "up")}
                        className={cn(
                          "rounded p-1 transition-colors hover:text-foreground",
                          (feedbackMap[opt.id] ?? opt.feedback) === "up" && "text-emerald-500"
                        )}
                        title="This result was helpful"
                      >
                        <ThumbsUp className="size-3.5" />
                      </button>
                      <button
                        onClick={() => submitFeedback(opt.id, "down")}
                        className={cn(
                          "rounded p-1 transition-colors hover:text-foreground",
                          (feedbackMap[opt.id] ?? opt.feedback) === "down" && "text-destructive"
                        )}
                        title="This result wasn't helpful"
                      >
                        <ThumbsDown className="size-3.5" />
                      </button>
                    </div>
                  </div>
```

Note: `(feedbackMap[opt.id] ?? opt.feedback)` means: use the in-session state if set, otherwise fall back to the persisted value from the DB.

- [ ] **Step 5: Check history API returns feedback column**

In `src/app/api/history/route.ts` (or wherever history is fetched from Supabase), confirm the `feedback` column is included in the select. If the query uses `select("*")`, it will include it automatically. If it uses an explicit column list, add `feedback` to it.

Find the history fetch query and verify it includes `feedback`:

```typescript
// If the select is explicit, e.g.:
.select("id, platform, input, output, score, is_archived, created_at, product_id, shop_id")
// Add feedback:
.select("id, platform, input, output, score, is_archived, feedback, created_at, product_id, shop_id")
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboard/optimise/optimise-client.tsx src/app/dashboard/history/history-client.tsx
git commit -m "feat: thumbs up/down feedback on optimise result and history"
```

---

### Task 6: eBay item specifics

**Files:**
- Modify: `src/app/api/optimise/route.ts`
- Modify: `src/app/dashboard/optimise/optimise-client.tsx`
- Modify: `src/components/listing-diff.tsx`

**Context:** eBay item specifics (Brand, Model, Condition, Colour, MPN, Size) are structured fields that eBay Cassini uses heavily for search matching. Currently the eBay prompt only returns `title` and `description`. Adding `itemSpecifics` as a flat key-value map gives sellers structured data they can copy directly into eBay's item specifics fields. In the UI, item specifics are shown as a dedicated tab with badge-style display for each key-value pair.

- [ ] **Step 1: Update eBay prompt in `route.ts`**

In `src/app/api/optimise/route.ts`, find the `case "ebay":` inside `buildSystemPrompt`. Replace the entire case with:

```typescript
    case "ebay":
      return `You are an expert eBay listing specialist. eBay buyers are comparison shoppers — they search by exact spec and scan listings fast. Your listing must match their search AND give them a reason to choose this listing over 20 identical ones.

The description must:
- Lead with the single most important spec or selling point (brand, model, condition, key feature)
- Use short lines — eBay descriptions are scanned, not read
- State condition clearly and honestly (New, Like New, Used, Good Condition, etc.) — only use condition details that were actually provided, do not invent claims about colour, brightness, fade, or wear that were not stated
- Do NOT include return policy or postage details — eBay displays these separately from structured listing fields
- If the seller has provided limited details, write a short honest description of what is known. Do NOT pad with obvious facts, circular statements that restate the product name (e.g. "The PlayStation 5 is Sony's PlayStation 5 console"), or inferred compatibility claims that were not stated by the seller. A tight 100-word description is better than 200 words of filler.

Return ONLY a valid JSON object:
{
  "title": "max 80 chars — keyword-rich from the start, include brand/model/size/condition if known, no ALL CAPS, be specific",
  "description": "100–200 words, most important spec first, short scannable lines, condition stated if known, product focused — write less if there is less to say",
  "itemSpecifics": {
    "Brand": "brand name or 'Does not apply' if unknown",
    "Model": "model name/number or omit if unknown",
    "Condition": "New / Like New / Good / Acceptable — only if stated by seller",
    "Colour": "colour or omit if unknown",
    "MPN": "manufacturer part number or omit if unknown",
    "Type": "product type or category if helpful"
  }
}

Only include keys in itemSpecifics where you have factual information from the seller's input. Do not invent or guess values. If you have no item specifics at all, include an empty object: "itemSpecifics": {}.

${WRITING_RULES}
- eBay title: buyers search for exact model/spec terms — be specific, not generic
Return only the JSON object, no markdown.`;
```

- [ ] **Step 2: Add `itemSpecifics` to `OptimisedListing` interface**

In `src/app/dashboard/optimise/optimise-client.tsx`, find the `OptimisedListing` interface and add `itemSpecifics`:

```typescript
interface OptimisedListing {
  id?: string;
  platform: Platform;
  title?: string;
  tags?: string[];
  bullets?: string[];
  backendKeywords?: string;
  metaTitle?: string;
  metaDescription?: string;
  productTitle?: string;
  shortDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
  caption?: string;
  postCopy?: string;
  hashtags?: string[];
  description?: string;
  itemSpecifics?: Record<string, string>;  // ← add
  original?: Record<string, string | string[]>;
  changes?: ChangeNote[];
}
```

- [ ] **Step 3: Add item specifics tab to eBay result tabs**

In `getResultTabs`, find the `case "ebay":` and update it:

```typescript
    case "ebay":
      return [
        { id: "title", label: "Title", fieldKey: "title", content: result.title ?? "", maxChars: 80 },
        { id: "description", label: "Description", fieldKey: "description", content: result.description ?? "" },
        ...(result.itemSpecifics && Object.keys(result.itemSpecifics).length > 0
          ? [{ id: "itemSpecifics", label: "Item Specifics", fieldKey: "itemSpecifics" as keyof Omit<OptimisedListing, "platform" | "original" | "changes">, content: Object.entries(result.itemSpecifics).map(([k, v]) => `${k}: ${v}`).join("\n") }]
          : []),
      ];
```

- [ ] **Step 4: Add item specifics display in the tab content**

Currently the tab content for a plain string field renders `<p className="whitespace-pre-wrap text-sm leading-relaxed">`. The item specifics tab will use the same renderer — the content is formatted as `"Brand: Sony\nModel: PlayStation 5\nCondition: New"` which renders well with `whitespace-pre-wrap`.

No additional rendering code is needed. The copy button will copy all key-value pairs as formatted text, which the seller can reference when filling out eBay's structured item specifics fields.

- [ ] **Step 5: Update `FIELD_LABELS` in listing-diff.tsx**

In `src/components/listing-diff.tsx`, add `itemSpecifics` to the `FIELD_LABELS` map:

```typescript
const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  description: "Description",
  tags: "Tags",
  bullets: "Bullet Points",
  backendKeywords: "Backend Keywords",
  metaTitle: "Meta Title",
  metaDescription: "Meta Description",
  productTitle: "Product Title",
  shortDescription: "Short Description",
  seoTitle: "SEO Title",
  seoDescription: "SEO Description",
  caption: "Caption",
  postCopy: "Post Copy",
  hashtags: "Hashtags",
  itemSpecifics: "Item Specifics",  // ← add
};
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. The `fieldKey: "itemSpecifics" as keyof Omit<OptimisedListing, ...>` cast is acceptable here — if TypeScript complains, ensure `itemSpecifics` is present in the `OptimisedListing` interface (done in step 2).

- [ ] **Step 7: Commit**

```bash
git add src/app/api/optimise/route.ts src/app/dashboard/optimise/optimise-client.tsx src/components/listing-diff.tsx
git commit -m "feat: eBay item specifics field in AI output and result UI"
```

---

### Final: Push

```bash
git push
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|---|---|
| Free users can audit (score + improvements) without consuming optimisation credit | Task 1 |
| "Optimise this" CTA below audit result, gated for free users | Task 1 |
| `scoreOptimisedListing()` pure function, covers all 9 platforms | Task 2 |
| Vitest set up and test suite passes | Task 2 |
| Before/after score display on optimise result | Task 3 |
| Score shown when no original (just after) | Task 3 |
| Character count progress bars for fields with maxChars | Task 3 |
| Feedback column added to optimisations table | Task 4 |
| PATCH /api/feedback route, user-scoped | Task 4 |
| Thumbs up/down on optimise result | Task 5 |
| Thumbs up/down on history entries (with persisted state) | Task 5 |
| eBay prompt returns `itemSpecifics` key-value map | Task 6 |
| Item specifics tab shown in eBay optimise result | Task 6 |
| `itemSpecifics` in FIELD_LABELS | Task 6 |

**Placeholder scan:** None found.

**Type consistency check:** `itemSpecifics` is added to `OptimisedListing` before `getResultTabs` references it. `ScoredListing` in `listing-score.ts` does not include `itemSpecifics` — that is correct since `itemSpecifics` is not scored. The `id?: string` field on `OptimisedListing` matches what the optimise route now returns. `feedback` is added to the `Optimisation` interface in history-client before it is read in the map initialiser.
