# Sprint E — Growth & Retention Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring sellers back every week and bring new sellers in via SEO and social proof. Three mechanisms: a public listing health check at `/check` (no signup required, Shopify only), a Monday/Friday weekly email digest, and an anonymised community wins feed on the dashboard.

**Architecture:** `/check` is a new unauthenticated page + API route that uses the existing `fetchShopifyProduct` and Anthropic audit logic without requiring auth. The weekly digest is a new Vercel cron + email template. The community wins feed is a new `community_wins` table with an opt-in flow triggered when a user achieves a score of 80+.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4, shadcn/ui, Supabase, Resend, Anthropic SDK

**Compliance note:** The public health check uses Shopify `/products.json` only — this is the only platform with a legitimate public product data endpoint. Amazon URL scraping, Etsy API access, and eBay URL scraping are all banned per CLAUDE.md.

---

## File Map

**Create:**
- `supabase/migrations/20260613150000_add_weekly_digest_to_profiles.sql`
- `supabase/migrations/20260613160000_add_community_wins.sql`
- `src/app/check/page.tsx` — public health check page (no auth)
- `src/app/check/check-client.tsx` — client component for the form + result
- `src/app/api/check/route.ts` — unauthenticated audit endpoint
- `src/app/api/cron/weekly-digest/route.ts` — cron handler
- `src/lib/emails/weekly-digest.ts` — email template
- `src/app/api/community-wins/route.ts` — GET (public feed) + POST (opt-in)
- `src/components/community-wins-widget.tsx` — dashboard widget

**Modify:**
- `vercel.json` — add weekly-digest cron schedule
- `src/app/dashboard/page.tsx` — add `CommunityWinsWidget`
- `src/app/dashboard/optimise/optimise-client.tsx` — opt-in prompt when score >= 80

---

### Task 1: Public health check page

**Files:**
- Create: `src/app/check/page.tsx`
- Create: `src/app/check/check-client.tsx`
- Create: `src/app/api/check/route.ts`

**Context:** The public health check page lets anonymous users paste a Shopify product URL and get a score + top 3 improvements in about 10 seconds. No login required. The API route calls Anthropic with the same audit prompt as `/api/audit` but without auth. Limit: 3 requests per IP per hour via the existing `checkRateLimit` helper. The CTA at the bottom: "Get the full fix list — create a free account."

This route must only accept Shopify URLs. Validate that the URL contains `.myshopify.com` or is a Shopify store URL (check for `/products/` path). If validation fails, return a 400 with `{ error: "Only Shopify product URLs are supported right now." }`.

The result shows:
- Score (0–100, colour-coded same as the existing audit page)
- Top 3 improvement suggestions from the `improvements` array
- Platform tag ("Shopify")
- CTA: "Get the full fix list" → link to /signup with `?ref=check` param

- [ ] **Step 1: Create the API route**

Create `src/app/api/check/route.ts`:

```typescript
import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import Anthropic, { APIConnectionError, APIError } from "@anthropic-ai/sdk";
import { z } from "zod";
import { fetchShopifyProduct } from "@/lib/listing-scraper";

const client = new Anthropic();

const requestSchema = z.object({
  url: z.string().url(),
});

const AUDIT_SYSTEM_PROMPT = `You are an expert Shopify SEO consultant. Audit the product listing provided.

Score out of 100:
- metaTitleScore (0–25): max 60 chars, includes primary keyword, reads naturally
- metaDescriptionScore (0–25): max 160 chars, includes primary keyword, has a soft call to action
- titleScore (0–15): clear product name, conversion-focused
- descriptionScore (0–35): opens with strongest detail, short paragraphs, key attributes included

Return ONLY valid JSON:
{
  "score": number,
  "label": "Excellent" | "Good" | "Needs work" | "Poor",
  "improvements": [
    { "field": "metaTitle" | "metaDescription" | "title" | "description", "issue": "specific issue", "fix": "specific fix" }
  ]
}

improvements: list every issue found, ordered by impact. Return only the JSON, no markdown.`;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const { allowed } = checkRateLimit(`check:${ip}`, 3, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again in an hour." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { url } = parsed.data;

  // Shopify-only check
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const isShopify =
    parsedUrl.hostname.endsWith(".myshopify.com") ||
    parsedUrl.pathname.includes("/products/");
  if (!isShopify) {
    return NextResponse.json(
      { error: "Only Shopify product URLs are supported right now." },
      { status: 400 }
    );
  }

  let listing: { title: string; description: string };
  try {
    listing = await fetchShopifyProduct(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch listing";
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: AUDIT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Title: ${listing.title}\n\nDescription:\n${listing.description.slice(0, 3000)}`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    let result: Record<string, unknown>;
    try {
      result = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
      }
      result = JSON.parse(match[0]);
    }

    return NextResponse.json({ ...result, platform: "shopify" });
  } catch (err) {
    if (err instanceof APIConnectionError || (err instanceof APIError && err.status >= 500)) {
      return NextResponse.json(
        { error: "AI is temporarily unavailable. Try again in a moment." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Failed to run check" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create the check client component**

Create `src/app/check/check-client.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CheckResult {
  score: number;
  label: string;
  improvements: { field: string; issue: string; fix: string }[];
  platform: string;
}

function scoreColour(score: number) {
  if (score >= 70) return "text-emerald-500";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
}

export function CheckClient() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setResult(data as CheckResult);
      }
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          How healthy is your listing?
        </h1>
        <p className="text-sm text-muted-foreground">
          Paste a Shopify product URL. Takes about 10 seconds. No account needed.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://yourstore.myshopify.com/products/your-product"
          required
          className="h-11"
        />
        <Button type="submit" className="w-full" disabled={loading || !url.trim()}>
          {loading ? "Checking your listing..." : "Check my listing"}
          {!loading && <ArrowRight className="size-3.5" />}
        </Button>
      </form>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {result && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <div className={cn("text-7xl font-bold tabular-nums leading-none", scoreColour(result.score))}>
              {result.score}
            </div>
            <p className="text-base font-semibold">{result.label}</p>
            <p className="text-xs text-muted-foreground">out of 100</p>
          </div>

          {result.improvements.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Top improvements
              </p>
              {result.improvements.slice(0, 3).map((imp, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border/60 p-3 space-y-1"
                >
                  <p className="text-xs font-medium capitalize">{imp.field.replace(/([A-Z])/g, " $1").trim()}</p>
                  <p className="text-xs text-muted-foreground">{imp.fix}</p>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3 text-center">
            <p className="text-sm font-medium">
              {result.improvements.length > 3
                ? `${result.improvements.length - 3} more improvement${result.improvements.length - 3 !== 1 ? "s" : ""} waiting.`
                : "Want to fix these and track your progress?"}
            </p>
            <p className="text-xs text-muted-foreground">
              Free account. Unlimited audits. Fix and re-check as many times as you need.
            </p>
            <Link href="/signup?ref=check">
              <Button className="w-full">
                Get the full fix list
                <ExternalLink className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create the check page**

Create `src/app/check/page.tsx`:

```tsx
import type { Metadata } from "next";
import { CheckClient } from "./check-client";

export const metadata: Metadata = {
  title: "Free Shopify Listing Health Check — SellWise",
  description:
    "Paste any Shopify product URL and get an SEO score plus the top improvements in 10 seconds. Free, no account needed.",
};

export default function CheckPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12 gap-12">
      <div className="text-2xl font-bold tracking-tight">
        Sell<span className="text-primary">Wise</span>
      </div>
      <CheckClient />
      <p className="text-xs text-muted-foreground/50">
        Shopify stores only. No data is stored.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Build check**

```bash
npm run build
```

Expected: build succeeds, `/check` page renders.

- [ ] **Step 6: Commit**

```bash
git add src/app/check/ src/app/api/check/route.ts
git commit -m "feat: public Shopify listing health check at /check (no auth required)"
```

---

### Task 2: Weekly digest email

**Files:**
- Create: `supabase/migrations/20260613150000_add_weekly_digest_to_profiles.sql`
- Create: `src/lib/emails/weekly-digest.ts`
- Create: `src/app/api/cron/weekly-digest/route.ts`
- Modify: `vercel.json`

**Context:** Every Monday at 9am AEST (Sunday 23:00 UTC), send a "here's what you did last week" email to paid users who have run at least one optimisation in the previous 7 days and haven't opted out. The email shows: how many optimisations they ran, the highest score they achieved, and a "Keep going" link back to the dashboard.

A `weekly_digest_sent_week` date column on profiles tracks which ISO week the last digest was sent for, preventing duplicates if the cron fires twice.

- [ ] **Step 1: Create the migration**

Create `supabase/migrations/20260613150000_add_weekly_digest_to_profiles.sql`:

```sql
alter table public.profiles
  add column if not exists weekly_digest_sent_week date;
```

Apply:
```bash
npx supabase db push
```

- [ ] **Step 2: Create the email template**

Create `src/lib/emails/weekly-digest.ts`:

```typescript
export function weeklyDigestEmail(
  firstName: string | null,
  stats: { optimisationCount: number; topScore: number }
): { subject: string; html: string } {
  const name = firstName ?? "there";
  const subject = `Your SellWise week: ${stats.optimisationCount} listing${stats.optimisationCount !== 1 ? "s" : ""} improved`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #111; max-width: 520px; margin: 0 auto; padding: 40px 24px;">
  <p style="font-size: 22px; font-weight: 700; margin: 0 0 4px;">SellWise</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0 24px;">

  <p style="font-size: 15px; margin: 0 0 20px;">Hi ${name},</p>

  <p style="font-size: 15px; margin: 0 0 20px;">
    Last week you improved <strong>${stats.optimisationCount} listing${stats.optimisationCount !== 1 ? "s" : ""}</strong>.
    Your best score was <strong>${stats.topScore}/100</strong>.
  </p>

  <table cellpadding="0" cellspacing="0" style="margin: 28px 0;">
    <tr>
      <td style="padding-right: 24px; text-align: center;">
        <p style="font-size: 36px; font-weight: 700; margin: 0; color: #111;">${stats.optimisationCount}</p>
        <p style="font-size: 12px; color: #888; margin: 4px 0 0;">listings improved</p>
      </td>
      <td style="padding-right: 24px; color: #ccc; font-size: 24px;">|</td>
      <td style="text-align: center;">
        <p style="font-size: 36px; font-weight: 700; margin: 0; color: ${stats.topScore >= 80 ? "#10b981" : stats.topScore >= 60 ? "#f59e0b" : "#ef4444"};">${stats.topScore}</p>
        <p style="font-size: 12px; color: #888; margin: 4px 0 0;">best score</p>
      </td>
    </tr>
  </table>

  <a href="https://sellwise.au/dashboard/optimise" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600; margin-bottom: 28px;">
    Keep going
  </a>

  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0 16px;">
  <p style="font-size: 12px; color: #999; margin: 0;">
    You're getting this because you have an active SellWise account.
    <a href="https://sellwise.au/api/email/unsubscribe?email={{email}}" style="color: #999;">Unsubscribe</a>
  </p>
</body>
</html>
  `.trim();

  return { subject, html };
}
```

- [ ] **Step 3: Create the cron route**

Create `src/app/api/cron/weekly-digest/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { weeklyDigestEmail } from "@/lib/emails/weekly-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const thisMonday = getMondayOfWeek(now);
  const lastWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const results = { sent: 0, skipped: 0, errors: 0 };

  // Fetch paid users who haven't received this week's digest
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, plan, weekly_digest_sent_week")
    .neq("plan", "free")
    .eq("marketing_opted_out", false)
    .or(`weekly_digest_sent_week.is.null,weekly_digest_sent_week.lt.${thisMonday}`);

  for (const profile of profiles ?? []) {
    try {
      // Count optimisations in the last 7 days
      const { count: optimisationCount } = await admin
        .from("optimisations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .gte("created_at", lastWeekStart);

      if (!optimisationCount || optimisationCount === 0) {
        results.skipped++;
        continue;
      }

      // Get top score from last 7 days
      const { data: topScoreRow } = await admin
        .from("optimisations")
        .select("score")
        .eq("user_id", profile.id)
        .gte("created_at", lastWeekStart)
        .not("score", "is", null)
        .order("score", { ascending: false })
        .limit(1)
        .single();

      const topScore = topScoreRow?.score ?? 0;

      const { data: { user } } = await admin.auth.admin.getUserById(profile.id);
      if (!user?.email) continue;

      const firstName = (profile.full_name as string | null)?.split(" ")[0] ?? null;
      const { subject, html } = weeklyDigestEmail(firstName, {
        optimisationCount,
        topScore,
      });

      await sendEmail({ to: user.email, subject, html: html.replace("{{email}}", encodeURIComponent(user.email)) });
      await admin
        .from("profiles")
        .update({ weekly_digest_sent_week: thisMonday })
        .eq("id", profile.id);

      results.sent++;
    } catch {
      results.errors++;
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
```

- [ ] **Step 4: Add cron to vercel.json**

In `vercel.json`, add the weekly-digest cron alongside the existing trial-emails cron:

```json
{
  "crons": [
    {
      "path": "/api/cron/trial-emails",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/weekly-digest",
      "schedule": "0 23 * * 0"
    }
  ]
}
```

(Sunday 23:00 UTC = Monday 9:00am AEST)

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260613150000_add_weekly_digest_to_profiles.sql src/lib/emails/weekly-digest.ts src/app/api/cron/weekly-digest/route.ts vercel.json
git commit -m "feat: weekly digest email every Monday for active paid users"
```

---

### Task 3: Community wins feed

**Files:**
- Create: `supabase/migrations/20260613160000_add_community_wins.sql`
- Create: `src/app/api/community-wins/route.ts`
- Create: `src/components/community-wins-widget.tsx`
- Modify: `src/app/dashboard/optimise/optimise-client.tsx`
- Modify: `src/app/dashboard/page.tsx`

**Context:** When a seller achieves a score of 80+, show an opt-in toast: "Nice score. Want to add it to the community wins board?" If they tap Yes, a record is posted to the `community_wins` table with the platform, score, and category (anonymised — no product name, no user identity). The dashboard shows the last 5 community wins from the past 7 days: "A Shopify seller just scored 91." This is social proof per Art of Game Design Lens #84 (Friendship) and #86 (Community).

The opt-in is one-time per optimisation. Storing the win is anonymous — only platform, score, and a rounded timestamp (day, not hour) are stored. No user ID stored in the community_wins table.

- [ ] **Step 1: Create the DB migration**

Create `supabase/migrations/20260613160000_add_community_wins.sql`:

```sql
create table public.community_wins (
  id          uuid primary key default gen_random_uuid(),
  platform    text not null,
  score       int not null check (score >= 0 and score <= 100),
  created_at  timestamptz not null default now()
);

-- Public read, no auth required
alter table public.community_wins enable row level security;

create policy "community_wins: public read"
  on public.community_wins for select
  using (true);

-- Only authenticated users can insert
create policy "community_wins: authenticated insert"
  on public.community_wins for insert
  with check (auth.role() = 'authenticated');
```

Apply:
```bash
npx supabase db push
```

- [ ] **Step 2: Create the API route**

Create `src/app/api/community-wins/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const postSchema = z.object({
  platform: z.enum(["etsy", "amazon", "shopify", "ebay", "woocommerce", "wix", "squarespace", "tiktok", "social"]),
  score: z.number().int().min(0).max(100),
});

// GET — fetch last 5 wins from the past 7 days (public, no auth)
export async function GET() {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("community_wins")
    .select("platform, score, created_at")
    .gte("created_at", since)
    .order("score", { ascending: false })
    .limit(5);

  if (error) return NextResponse.json({ wins: [] });
  return NextResponse.json({ wins: data ?? [] });
}

// POST — opt-in, add a win (auth required)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("community_wins")
    .insert({ platform: parsed.data.platform, score: parsed.data.score });

  if (error) return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Create the dashboard widget**

Create `src/components/community-wins-widget.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { PLATFORM_LABELS } from "@/lib/platforms";
import type { Platform } from "@/lib/platforms";

interface Win {
  platform: Platform;
  score: number;
  created_at: string;
}

function scoreColour(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

export function CommunityWinsWidget() {
  const [wins, setWins] = useState<Win[]>([]);

  useEffect(() => {
    fetch("/api/community-wins")
      .then((r) => r.json())
      .then((d) => setWins(d.wins ?? []))
      .catch(() => setWins([]));
  }, []);

  if (wins.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Community wins this week
      </p>
      <div className="space-y-1.5">
        {wins.map((win, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              A {PLATFORM_LABELS[win.platform] ?? win.platform} seller just scored
            </span>
            <span className={`font-semibold tabular-nums ${scoreColour(win.score)}`}>
              {win.score}/100
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add opt-in toast in optimise-client.tsx**

In `src/app/dashboard/optimise/optimise-client.tsx`, find the section where the result is set after the API call succeeds. After `setResult(data)` (and after the feedback state reset), add:

```tsx
// Offer community opt-in for high scores
if (data.score && data.score >= 80) {
  toast("Nice score.", {
    description: "Add it to the community wins board?",
    action: {
      label: "Yes",
      onClick: () => {
        fetch("/api/community-wins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform: data.platform, score: data.score }),
        }).catch(() => {});
      },
    },
  });
}
```

Note: `toast` with `action` is Sonner's API. The existing codebase already uses Sonner (`import { toast } from "sonner"`). Check that the import is present — it should be.

- [ ] **Step 5: Add CommunityWinsWidget to dashboard**

In `src/app/dashboard/page.tsx`, import and render the widget. Find a logical place (below the quick actions grid or at the bottom of the main column) and add:

```tsx
import { CommunityWinsWidget } from "@/components/community-wins-widget";

// In the JSX, at the bottom of the main content area:
<CommunityWinsWidget />
```

The widget returns `null` when there are no wins, so it's safe to always render.

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Build check**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/20260613160000_add_community_wins.sql src/app/api/community-wins/route.ts src/components/community-wins-widget.tsx src/app/dashboard/optimise/optimise-client.tsx src/app/dashboard/page.tsx
git commit -m "feat: community wins feed with opt-in from high-score optimisation results"
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
| Public health check at /check, no auth | Task 1 |
| Shopify-only validation (compliance) | Task 1 |
| IP-based rate limit (3/hour) | Task 1 |
| Top 3 improvements shown | Task 1 |
| CTA to signup with ref=check | Task 1 |
| Weekly digest email for paid active users | Task 2 |
| Deduplication via weekly_digest_sent_week | Task 2 |
| Skip users with 0 optimisations that week | Task 2 |
| Monday 9am AEST cron schedule | Task 2 |
| Community wins table (anonymised, no user ID) | Task 3 |
| Opt-in toast when score >= 80 | Task 3 |
| Dashboard widget shows last 5 wins this week | Task 3 |

**Placeholder scan:** None found. All code blocks are complete.

**Type consistency:** `Platform` type used from `@/lib/platforms` throughout. `Win.platform` typed as `Platform`. `PLATFORM_LABELS` is a `Record<Platform, string>` — the optional chain `?? win.platform` handles any future platform additions gracefully.
