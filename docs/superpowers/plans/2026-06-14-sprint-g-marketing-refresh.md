# Sprint G — Marketing Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update all public-facing copy (landing page, pricing page, welcome email, trial nudge email) to accurately reflect the product that shipped in Sprints A–F, fix a live free-tier limit bug (shows "3" but the real limit is 1), and surface /check and brand voice as new user entry points.

**Architecture:** Copy-only changes across four existing files. No new routes, no DB changes, no new components. Each task is self-contained — commits can be made independently.

**Tech Stack:** Next.js 16, TypeScript, React 19 (JSX), Resend-compatible inline HTML emails

---

## File Map

**Modify only:**
- `src/components/marketing-landing.tsx` — public landing page component
- `src/app/pricing/pricing-client.tsx` — pricing page feature lists
- `src/lib/emails/welcome.ts` — welcome email sent on signup
- `src/lib/emails/trial-nudge.ts` — "2 days left" trial expiry nudge email

---

## What changed in Sprints A–F that affects copy

| Sprint | Feature | Copy gap |
|--------|---------|----------|
| A | Upgrade modal, rescue CTAs, trial banner | No copy gap in marketing — internal only |
| B | Score trends, milestones, keyword power badge | Not yet surfaced in marketing features list |
| C | Streaks, badges, BigLiftToast | Not surfaced in marketing |
| D | Brand voice (onboarding step 2 + Settings) | No mention anywhere public |
| E | /check public health check, weekly digest | No mention on landing or pricing |
| F | brand_voice_auto (learns from results) | No mention anywhere public |
| Pre-launch | Free limit is 1/mo | Landing + pricing both say "3/month" — live bug |
| Pre-launch | Competitor Peek removed from product | trial-nudge email still lists it as a loss |

---

### Task 1: Landing page — fix free limit + add /check CTA + add brand voice feature

**File:** `src/components/marketing-landing.tsx`

**Changes:**
1. Fix the pricing grid copy: "3 optimisations / month" → "1 optimisation / month"
2. Add a `/check` teaser line between the hero CTA and the feature section
3. Add Brand Voice to the FEATURES array (6th card)

- [ ] **Step 1: Fix the free tier copy in the pricing mini-grid**

Find (around line 177):
```tsx
<p className="text-xs text-muted-foreground">3 optimisations / month</p>
```

Replace with:
```tsx
<p className="text-xs text-muted-foreground">1 optimisation / month</p>
```

- [ ] **Step 2: Add /check teaser strip between hero and features section**

After the closing `</section>` for the HERO (around line 141), before the `{/* FEATURES */}` comment, insert:

```tsx
      {/* /CHECK TEASER */}
      <div className="border-t border-border bg-muted/30 px-5 md:px-10 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
          <p className="text-xs text-muted-foreground">
            Already have a Shopify listing? Check its SEO score in 10 seconds — no account needed.
          </p>
          <Link
            href="/check"
            className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity shrink-0"
          >
            Free listing health check →
          </Link>
        </div>
      </div>
```

- [ ] **Step 3: Add Brand Voice to the FEATURES constant**

Find the `FEATURES` array (around line 12). Add a 6th entry after the Store Connect entry:

```tsx
import { Sparkles, Search, BarChart3, ArrowLeftRight, Store, Brain } from "lucide-react";
```

(Add `Brain` to the existing lucide import.)

Then add to the FEATURES array after the Store object:

```tsx
  {
    icon: Brain,
    title: "Learns your voice",
    desc: "Approve results you like and SellWise picks up your tone. After a few optimisations, it writes the way you do.",
  },
```

- [ ] **Step 4: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/marketing-landing.tsx
git commit -m "feat(marketing): fix free limit copy, add /check teaser, add brand voice feature card"
```

---

### Task 2: Pricing page — fix free limit + surface /check + add brand voice + remove stale refs

**File:** `src/app/pricing/pricing-client.tsx`

**Changes:**
1. Fix free tier: "3 optimisations / month" → "1 optimisation / month"
2. Add /check mention to free tier features
3. Add brand voice to Growth and Studio features
4. Add score trend / history mention to Growth

- [ ] **Step 1: Fix the free tier feature list**

Find the `features` object (around line 14). The `free` array currently reads:

```typescript
  free: [
    "3 optimisations / month",
    "All platforms via manual entry",
    "AI title, tags and description",
  ],
```

Replace with:

```typescript
  free: [
    "1 optimisation / month",
    "All platforms via manual entry",
    "AI title, tags, bullets and description",
    "Free Shopify listing health check at /check — no account needed",
  ],
```

- [ ] **Step 2: Add brand voice + score history to Growth features**

Find the `growth` array (around line 28):

```typescript
  growth: [
    "Unlimited optimisations",
    "Unlimited keyword research",
    "Unlimited listing audits",
    "Bulk optimiser — upload CSV, download results",
    "Connect 1 store — view SEO scores and optimise",
    "Priority support",
  ],
```

Replace with:

```typescript
  growth: [
    "Unlimited optimisations",
    "Unlimited keyword research",
    "Unlimited listing audits",
    "Optimisation history with before / after scores",
    "Brand voice — SellWise learns your writing style from results you approve",
    "Bulk optimiser — upload CSV, download results",
    "Connect 1 store — view SEO scores and optimise",
    "Priority support",
  ],
```

- [ ] **Step 3: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/pricing/pricing-client.tsx
git commit -m "feat(pricing): fix free limit, add /check + brand voice to feature lists"
```

---

### Task 3: Welcome email — reflect 3-step onboarding and new features

**File:** `src/lib/emails/welcome.ts`

**Changes:**
1. Update the intro paragraph to reference the onboarding flow (brand voice capture)
2. Update the "What's included" bullet list to be current

The welcome email is sent immediately on signup. Onboarding (3 steps: platform, brand voice, all-set demo) happens right after. The email should prime them for the onboarding, not duplicate it.

- [ ] **Step 1: Update the welcome email body**

Replace the entire `welcomeEmail` function body with:

```typescript
export function welcomeEmail(firstName: string | null, email: string): { subject: string; html: string } {
  const name = firstName ?? "there";

  const html = emailLayout(`
    <tr><td style="padding:32px 32px 20px">
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111111;line-height:1.3">
        Welcome, ${name}.
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.6">
        You're on a <strong>7-day free trial of Growth</strong> — unlimited optimisations, keyword research, and listing audits.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.6">
        First up: the setup takes 30 seconds. Pick your platforms, tell us a little about your brand voice, and we'll show you what SellWise can do.
      </p>
      <a href="${appUrl}/dashboard"
         style="display:inline-block;background:#f0873b;color:#1a1a1a;text-decoration:none;font-size:14px;font-weight:700;padding:13px 24px;border-radius:8px">
        Set up your account →
      </a>
    </td></tr>

    <tr><td style="padding:0 32px 32px">
      <p style="margin:0 0 12px;font-size:11px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.06em">
        What's included in your trial
      </p>
      ${[
        "Listing Optimiser: platform-optimised titles, tags, bullets and descriptions",
        "Keyword Research: 15 keywords with volume &amp; competition data",
        "Listing Audit: a score out of 100 with a prioritised fix list",
        "Brand voice: tell SellWise how you write and it shapes every output",
        "Optimisation history: see before &amp; after scores for every listing",
      ].map(f => `
      <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px" role="presentation">
        <tr>
          <td width="20" valign="top" style="padding-top:2px">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#f0873b;margin-top:4px"></span>
          </td>
          <td style="font-size:14px;color:#333333;line-height:1.5">${f}</td>
        </tr>
      </table>`).join("")}
    </td></tr>
  `, accountUnsubscribeUrl(email));

  return {
    subject: "Welcome to SellWise. Your 7-day trial has started.",
    html,
  };
}
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/emails/welcome.ts
git commit -m "feat(email): update welcome email to reflect 3-step onboarding and brand voice"
```

---

### Task 4: Trial nudge email — remove competitor analysis ref, fix free limit

**File:** `src/lib/emails/trial-nudge.ts`

**Changes:**
1. Remove "no competitor analysis" from the downgrade consequences (the Competitor Peek feature was removed from the product in May 2026)
2. Fix "3 optimisations per month" → "1 optimisation per month"
3. Update the Growth feature list to reflect current reality

- [ ] **Step 1: Update the trial nudge email body**

Replace the entire `trialNudgeEmail` function body with:

```typescript
export function trialNudgeEmail(firstName: string | null, email: string): { subject: string; html: string } {
  const name = firstName ?? "there";

  const html = emailLayout(`
    <tr><td style="padding:32px 32px 20px">
      <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#f0873b;text-transform:uppercase;letter-spacing:0.06em">
        2 days left
      </p>
      <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111111;line-height:1.3">
        Your free trial ends soon, ${name}
      </h1>
      <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.6">
        Your 7-day Growth trial ends in 2 days. After that you'll drop to the Free plan — 1 optimisation per month, no keyword research, no listing audits.
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.6">
        Upgrade now to keep everything running.
      </p>
      <a href="${appUrl}/pricing"
         style="display:inline-block;background:#f0873b;color:#1a1a1a;text-decoration:none;font-size:14px;font-weight:700;padding:13px 24px;border-radius:8px">
        Upgrade to keep access →
      </a>
    </td></tr>

    <tr><td style="padding:0 32px 32px">
      <p style="margin:0 0 12px;font-size:11px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.06em">
        What you'll keep with Growth at $29/mo
      </p>
      ${[
        "Unlimited listing optimisations",
        "Unlimited keyword research",
        "Unlimited listing audits",
        "Optimisation history with before &amp; after scores",
        "Brand voice — SellWise learns your style from results you approve",
        "Priority support",
      ].map(f => `
      <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px" role="presentation">
        <tr>
          <td width="20" valign="top">
            <span style="font-size:14px;color:#f0873b;font-weight:700">✓</span>
          </td>
          <td style="font-size:14px;color:#333333;line-height:1.5">${f}</td>
        </tr>
      </table>`).join("")}
      <p style="margin:16px 0 0;font-size:13px;color:#777777">
        Or try <a href="${appUrl}/pricing" style="color:#f0873b;text-decoration:none">Starter at $19/mo</a>. 50 optimisations plus all tools.
      </p>
    </td></tr>
  `, accountUnsubscribeUrl(email));

  return {
    subject: "2 days left on your SellWise trial",
    html,
  };
}
```

- [ ] **Step 2: Type-check**

```
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/emails/trial-nudge.ts
git commit -m "fix(email): remove competitor analysis ref, fix free limit to 1/mo in trial nudge"
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
| Fix "3 optimisations" bug on landing page | Task 1, Step 1 |
| Add /check teaser to landing page | Task 1, Step 2 |
| Add brand voice to landing page features | Task 1, Step 3 |
| Fix "3 optimisations" bug on pricing page | Task 2, Step 1 |
| Surface /check on pricing page (free tier) | Task 2, Step 1 |
| Add brand voice + history to Growth features | Task 2, Step 2 |
| Update welcome email for 3-step onboarding + brand voice | Task 3, Step 1 |
| Remove "competitor analysis" from trial nudge | Task 4, Step 1 |
| Fix "3 optimisations per month" in trial nudge | Task 4, Step 1 |

**Placeholder scan:** None. Every step contains the complete replacement code.

**Type consistency:** No types are defined or referenced across tasks. All changes are string literals and JSX — no cross-task type dependencies.

**What is NOT in this plan (intentional):**
- Streaks/badges on marketing pages — not enough context for visitors; save for post-launch social proof
- Weekly digest mention on pricing — it's an automatic benefit, not a selling point
- Studio feature changes — Studio already lists its differentiators clearly; no gaps identified
- Onboarding page copy — Sprint D already updated it as part of the 3-step implementation
