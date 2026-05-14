# SellWise — Project Knowledge Base

## Overview
AI-powered SEO and listing optimiser for online sellers. Generates optimised titles, tags, bullet points, and descriptions using Claude AI — built platform-aware from day one.

**Stack**: Next.js 16, React 19, Tailwind 4, TypeScript, Supabase, Stripe, Claude API
**Repo**: github.com/[user]/sellwise
**Local path**: C:\Dev\Projects\sellwise
**Previously**: etsyai

---

## Vision
SellWise is the AI co-pilot for online sellers — wherever they sell. Start with Etsy (fastest path to revenue, weakest existing tooling), expand to Amazon FBA, Shopify, and beyond. Platform-agnostic positioning from day one, Etsy-first execution.

**Tagline**: *Sell smarter on every platform.*

---

## Problem We're Solving
Online sellers spend hours writing listings. SEO is opaque — each platform has its own algorithm, rules, and quirks. Existing tools are platform-specific, stale, and not AI-native. Sellers will pay $29–79/mo for something that saves them 2–3 hours per listing and measurably improves search rank.

---

## Target Users
- Etsy sellers with 10–200 active listings (MVP)
- Amazon FBA sellers managing 5–50 ASINs (Phase 2)
- Shopify / DTC brand owners (Phase 3)
- Non-technical; often mobile; time-poor
- Primary pain: writing titles/tags/bullets that actually rank
- Secondary pain: keeping listings fresh after algorithm updates

---

## Platform Roadmap

| Phase | Platform | Key output format | Timeline |
|-------|----------|-------------------|----------|
| MVP | Etsy | Title (140c) + 13 tags + description | Weeks 1–6 |
| Phase 2 | Amazon FBA | Title + 5 bullet points + backend keywords | Months 2–3 |
| Phase 3 | Shopify | Meta title + meta description + product copy | Months 3–4 |
| Future | eBay, Walmart, TikTok Shop | Platform-specific formats | TBD |

---

## Core Features (MVP — Etsy)

### 1. Listing Optimiser (primary feature)
- Platform selector (Etsy default, Amazon + Shopify disabled with "coming soon" badge)
- Input: product title, description, category, style, material
- Output: optimised title with char counter, 13 tags as chips, description
- Copy buttons per field, SEO score badge (0–100), improvement tips
- Usage check before API call, increment after success, upgrade modal if limit hit

### 2. Keyword Research
- Seed keyword input + platform selector
- Returns 15 keywords with volume/competition/trend indicators
- Platform-aware: Etsy occasion/style patterns vs Amazon purchase intent
- Save to keyword list (persisted in Supabase)

### 3. Competitor Peek
- Etsy listing URL input
- Server-side fetch → extract title + tags from page HTML
- Side-by-side: their listing vs AI-optimised version
- "Beat this listing" generates a better version automatically

### 4. Listing Audit
- Inputs: title, tags (comma separated), description
- Score 0–100 with breakdown: title / tags / description
- Quick wins list — specific, actionable fixes

### 5. Dashboard
- Usage bar (X / limit used this month)
- Recent optimisations history
- Subscription status + upgrade prompt

---

## Platform Output Formats

### Etsy
```typescript
interface EtsyOutput {
  title: string        // max 140 chars, keyword-front-loaded
  tags: string[]       // exactly 13, each max 20 chars
  description: string  // 300–500 chars, first 160 critical for search snippets
}
```

### Amazon FBA (Phase 2)
```typescript
interface AmazonOutput {
  title: string             // max 200 chars, brand first
  bullets: string[]         // exactly 5, max 255 chars each, benefit-led
  backend_keywords: string  // max 250 bytes, space-separated, no repeats
  description: string       // max 2000 chars, HTML allowed
}
```

### Shopify (Phase 3)
```typescript
interface ShopifyOutput {
  meta_title: string        // max 60 chars
  meta_description: string  // max 160 chars, click-optimised
  product_title: string     // clean, conversion-focused
  description: string       // full HTML product description
}
```

---

## Monetisation

| Plan | Price | Features | Target user |
|------|-------|----------|-------------|
| Free | $0 | 3 optimisations/mo (optimiser only) | Try before buying |
| Starter | $19/mo | 50 optimisations/mo + all features (keywords, competitor, audit) | Part-time sellers |
| Growth | $29/mo | Unlimited + all features | Full-time sellers |
| Studio | $79/mo | Unlimited + unlimited shops + push-back to platforms (coming soon — Phase 6) | Power users / agencies |

- Stripe Billing, monthly/annual toggle (annual = 2 months free)
- 7-day free trial of Growth tier, no card required
- Upgrade modal triggered on usage limit hit

---

## Technical Architecture

### App Router structure
```
/src/app
  /(auth)
    /login
    /signup
    /forgot-password
  /(dashboard)
    /page.tsx                — dashboard home
    /optimise/page.tsx       — listing optimiser
    /keywords/page.tsx       — keyword research
    /competitor/page.tsx     — competitor analysis
    /audit/page.tsx          — listing audit
    /settings/page.tsx       — account + billing
  /api
    /optimise/route.ts       — Claude API (platform-aware)
    /keywords/route.ts
    /competitor/route.ts
    /audit/route.ts
    /stripe/webhook/route.ts
    /stripe/create-checkout/route.ts
    /stripe/portal/route.ts
  /(marketing)
    /page.tsx                — landing page
    /pricing/page.tsx
```

### Database — Supabase
```sql
-- platform enum used throughout
platform: 'etsy' | 'amazon' | 'shopify' | 'ebay'

profiles        (id, email, plan, usage_count, usage_reset_at, stripe_customer_id, trial_ends_at)
optimisations   (id, user_id, platform, input jsonb, output jsonb, score, is_saved, created_at)
keyword_lists   (id, user_id, platform, name, keywords jsonb, created_at)
shops           (id, user_id, platform, shop_name, shop_url, is_primary)
```

### AI — Claude claude-sonnet-4-20250514
- All calls server-side only (never expose API key to client)
- Platform-aware system prompts (see prompts section below)
- Structured JSON output enforced via schema in prompt
- Per-user rate limiting in middleware

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 16 (App Router) | Full-stack, Vercel deploy |
| Language | TypeScript | Type safety |
| Styling | Tailwind 4 + shadcn | Speed + accessibility |
| Database | Supabase | Auth + DB + free tier |
| Payments | Stripe | Subscriptions + portal |
| AI | Claude claude-sonnet-4-20250514 | Best copy quality |
| Deploy | Vercel | Zero-config Next.js |
| Email | Resend | Simple API, reliable delivery |
| Analytics | PostHog | Product analytics + feature flags |

---

## Environment Variables
```env
# Anthropic
ANTHROPIC_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_STARTER_PRICE_ID=
STRIPE_GROWTH_PRICE_ID=
STRIPE_STUDIO_PRICE_ID=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email
RESEND_API_KEY=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## Platform-Aware Claude Prompts

```typescript
const SYSTEM_PROMPTS: Record<Platform, string> = {
  etsy: `You are an expert Etsy SEO consultant with deep knowledge of the
Etsy Cassini search algorithm. You specialise in titles (140 chars,
keyword-front-loaded), tags (exactly 13, max 20 chars each, long-tail phrases),
and descriptions (first 160 chars critical for search snippets).
Buyers search by occasion, recipient, and style — not just product type.
Respond in valid JSON only.`,

  amazon: `You are an expert Amazon FBA listing specialist with deep knowledge of
the A9/A10 algorithm. You specialise in titles (200 chars, brand first),
5 bullet points (255 chars each, benefit-led, keyword-rich), and backend
keywords (250 bytes, no repetition). Focus on purchase intent keywords.
Respond in valid JSON only.`,

  shopify: `You are an expert Shopify SEO and conversion copywriter. You specialise
in meta titles (60 chars), meta descriptions (160 chars, click-optimised),
and product descriptions that balance SEO with conversion.
Respond in valid JSON only.`,
}
```

---

## Shared TypeScript Types

```typescript
export type Platform = 'etsy' | 'amazon' | 'shopify' | 'ebay'

export interface OptimiseRequest {
  platform: Platform
  title?: string
  description?: string
  category?: string
  style?: string
  material?: string
}

export interface OptimisationResult {
  platform: Platform
  etsy_title?: string
  etsy_tags?: string[]
  amazon_title?: string
  amazon_bullets?: string[]
  amazon_backend_keywords?: string
  shopify_meta_title?: string
  shopify_meta_description?: string
  description: string
  score: number
  improvements: string[]
}

export type Plan = 'free' | 'starter' | 'growth' | 'studio'

export const PLAN_LIMITS: Record<Plan, { optimisations: number | null; price: number }> = {
  free:    { optimisations: 3,    price: 0  },
  starter: { optimisations: 50,   price: 19 },
  growth:  { optimisations: null, price: 29 },
  studio:  { optimisations: null, price: 79 },
}
```

---

## Build Progress

Update this as work is completed. Tick `[x]` when done, add notes inline where useful.
Claude Code should update this file at the end of every session.

### Phase 1 — Foundation
- [x] create-next-app scaffold (Next 16, React 19, Tailwind 4, TypeScript)
- [x] package.json clean + correct dependencies installed
- [x] shadcn init + core components (button, input, label, card, tabs, badge, progress, toast, separator)
- [x] Supabase project created + schema migrated
- [x] Auth working (email/password sign-in/sign-up/sign-out, route protection)
- [x] Dashboard shell + sidebar nav with usage bar
- [x] Deployed to Vercel (staging)

### Phase 2 — Core AI Features
- [x] Listing Optimiser page + /api/optimise route
- [x] Keyword Research page + /api/keywords route — 15 keywords with volume/competition/trend
- [x] Competitor Peek page + /api/competitor route — cheerio scrape + side-by-side AI comparison
- [x] Listing Audit page + /api/audit route — 0-100 score with title/tags/description breakdown
- [x] Usage tracking (checkLimit + incrementUsage, separate counters per type)
- [x] Upgrade modal component (reusable, triggered on 402 across all features)
- [x] Feature gating — keywords/competitor/audit locked behind Starter+; free tier gets optimiser only (1 use/mo)
- [x] FeatureGate server component — free users see locked gate with upgrade CTA, no API call wasted

### Phase 3 — Monetisation
- [x] Stripe products + prices created in Stripe sandbox + price IDs in .env.local
- [x] /api/stripe/webhook (checkout.session.completed, subscription.updated, subscription.deleted)
- [x] /api/stripe/create-checkout (accepts plan + billing period, resolves price ID server-side)
- [x] /api/stripe/portal
- [x] Pricing page (/pricing) with monthly/annual toggle
- [x] Plan enforcement on all API routes (via checkLimit in each route)
- [x] 7-day free trial flow — trial_ends_at set on signup, Growth limits during trial, trial banner in dashboard
- [x] "Manage billing" in /settings — real plan/usage data + Stripe portal button

### Phase 4 — Polish + Launch
- [x] Marketing landing page
- [ ] Onboarding flow (3-step post-signup)
- [ ] Email sequences via Resend (welcome, trial expiry, first optimisation)
- [ ] Empty / error / loading states throughout
- [ ] SEO meta + og tags + sitemap
- [ ] Production deploy + domain
- [ ] Launch posts drafted (r/Etsy, Facebook groups)

### Phase 5 — Amazon FBA
- [ ] Amazon platform unlocked in selector
- [ ] Amazon output format + prompts wired up
- [ ] ASIN URL competitor scraper
- [ ] FBA fee / profitability calculator
- [ ] Pricing page updated

### Phase 6 — Store API Integration (Studio flagship)
The goal: sellers connect their shop once and SellWise reads all their live listings, runs bulk audits, and can push optimised content back directly. No more copy-paste.

**Etsy OAuth API**
- [ ] OAuth 2.0 flow — connect Etsy shop (`/api/etsy/connect`, callback, token storage in `shops` table)
- [ ] Read all active listings via Etsy API (`GET /v3/application/shops/{shopId}/listings/active`)
- [ ] Bulk audit dashboard — paginated table of every listing with live SEO score badge
- [ ] "Fix this" action — open optimiser pre-filled with the listing's current content
- [ ] Push optimised content back via Etsy API (`PATCH /v3/application/listings/{listingId}`) — Studio only

**Amazon SP-API** (Phase 5 prerequisite)
- [ ] SP-API OAuth via Login with Amazon (LWA) — connect seller account
- [ ] Read ASIN catalogue + listing content
- [ ] Bulk audit across all ASINs
- [ ] Push updated listing content back — Studio only

**Shopify App** (Phase 3 prerequisite)
- [ ] Shopify OAuth + custom app install flow
- [ ] Read all products via Admin API
- [ ] Push updated meta title / meta description / product copy — Studio only

**Tiering**
- Growth: connect 1 shop, read listings, bulk audit (view only)
- Studio: connect unlimited shops, push updates back to the platform

**Kickoff prompt for this phase:**
```
Read CLAUDE.md for full project context.

Build Phase 6 — Etsy store integration:

1. OAuth connect flow
   - GET /api/etsy/connect — redirect to Etsy OAuth with scope listings_r listings_w
   - GET /api/etsy/callback — exchange code for tokens, store in shops table
   - "Connect your Etsy shop" button in /settings

2. Listings dashboard (/dashboard/shop)
   - Fetch all active listings for connected shop (paginated)
   - Table: listing title, thumbnail, price, SEO score badge (audit each listing lazily)
   - "Optimise" button per row — opens optimiser pre-filled
   - Bulk audit: "Audit all" queues background jobs, updates scores

3. Push-back (Studio only)
   - "Apply" button on optimised result → PATCH listing on Etsy
   - Feature gate: Studio plan only, show lock for Growth users

Etsy API docs: https://developers.etsy.com/documentation/
Store tokens in shops table: { user_id, platform, shop_id, shop_name, access_token, refresh_token, expires_at }
```

---

## Claude Code — Weekly Kickoff Prompts

Paste the relevant prompt at the start of each new Claude Code session.
Always starts: "Read docs/claude.md for full project context."

---

### Week 1 — Foundation

```
Read docs/claude.md for full project context.

Build the Week 1 foundation for SellWise:

1. Fix dependencies
   - Delete node_modules and package-lock.json
   - Keep Next 16 + React 19 + Tailwind 4 from create-next-app, don't downgrade
   - Add: @anthropic-ai/sdk @supabase/ssr @supabase/supabase-js stripe resend zod
     lucide-react tailwind-merge clsx
   - npm install
   - npx shadcn@latest init (style: Default, color: Slate, CSS variables: yes)
   - npx shadcn@latest add button input label card tabs badge progress toast separator

2. Supabase
   - Create src/lib/supabase/client.ts and server.ts using @supabase/ssr
   - Schema: profiles, optimisations, keyword_lists, shops tables
     all with platform field ('etsy' | 'amazon' | 'shopify' | 'ebay')
   - RLS policies: users can only access their own rows
   - Trigger: auto-create profile row on auth.users insert

3. Auth pages
   - /login — email + password, Google OAuth button, link to /signup
   - /signup — email + password + name, Google OAuth, link to /login
   - /forgot-password — email input, Supabase reset link
   - Middleware: protect all /(dashboard) routes, redirect to /login if unauthed

4. Dashboard shell
   - Sidebar: Dashboard, Optimise, Keywords, Competitor, Audit, Settings
   - Platform indicator in sidebar (Etsy active, others "coming soon")
   - Top bar: page title + user avatar dropdown (profile, billing, sign out)
   - Dashboard home: usage card, recent optimisations (empty state), quick actions
   - Mobile responsive

5. Deploy
   - Push to GitHub (create repo if needed)
   - Connect to Vercel, add env vars, deploy staging

Update Build Progress in docs/claude.md after each task. Commit to GitHub after each major step.
```

---

### Week 2 — Core AI Features

```
Read docs/claude.md for full project context.

Build the core AI features:

1. Listing Optimiser (/optimise)
   - Platform selector (Etsy active; Amazon + Shopify disabled with "coming soon")
   - Input form: product title, description, category, style, material
   - API route /api/optimise — server-side Claude call, use system prompt from claude.md
   - Output: title + char counter (140 max), 13 tag chips, description textarea
   - Copy button per field, SEO score badge (green ≥70, amber 40–69, red <40)
   - Improvement tips list
   - Check usage limit before call → 402 triggers upgrade modal
   - On success: increment usage_count, save row to optimisations table

2. Keyword Research (/keywords)
   - Seed keyword input + platform selector
   - API route /api/keywords — 15 results with volume/competition/trend
   - Cards: colour-coded volume pill, competition pill, trend arrow
   - Save list → prompt for name → persist to keyword_lists table
   - Saved lists shown in sidebar or tab

3. Competitor Peek (/competitor)
   - Etsy listing URL input with validation
   - Server-side fetch, extract title + tags from HTML (use cheerio)
   - API route /api/competitor — analyse + generate better version
   - Side-by-side: "Their listing" vs "Optimised version"
   - Copy buttons on optimised side

4. Listing Audit (/audit)
   - Inputs: title, tags (comma separated), description (all optional)
   - API route /api/audit — 0–100 score with breakdown
   - Score display + section breakdown (title 0–40, tags 0–35, description 0–25)
   - Quick wins: 3–5 specific fixes

5. Reusable upgrade modal
   - Triggered anywhere a 402 is returned
   - Shows plan cards for Growth + Studio with upgrade CTA to /pricing

Update Build Progress in docs/claude.md after each feature. Commit to GitHub.
```

---

### Week 3 — Monetisation

```
Read docs/claude.md for full project context.

Build monetisation:

1. Stripe setup
   - Create products + prices in Stripe dashboard:
     Starter $19/mo + $190/yr, Growth $39/mo + $390/yr, Studio $79/mo + $790/yr
   - Add price IDs to .env.local

2. /api/stripe/webhook
   - Verify signature with STRIPE_WEBHOOK_SECRET
   - checkout.session.completed → update profiles: plan + stripe_customer_id
   - customer.subscription.updated → update plan
   - customer.subscription.deleted → downgrade to 'free'

3. /api/stripe/create-checkout
   - Checkout session with user email + supabase user ID as metadata
   - Accept price_id query param (monthly or annual)
   - Success → /dashboard?upgraded=true, Cancel → /pricing

4. /api/stripe/portal
   - Create billing portal session for user's stripe_customer_id
   - Redirect to portal URL

5. Pricing page (/pricing)
   - Monthly / annual toggle (annual saves ~17%, show badge)
   - Plan cards: Free, Starter, Growth (highlighted), Studio
   - Feature comparison table
   - CTAs call /api/stripe/create-checkout with correct price ID

6. Plan enforcement
   - Middleware on all /api/optimise, /api/keywords, /api/competitor, /api/audit
   - Check usage_count vs PLAN_LIMITS (from shared/types.ts)
   - Return 402 { error: 'limit_reached', used, limit } if over

7. Free trial
   - On signup: trial_ends_at = now + 7 days, treat as Growth in middleware
   - Trial banner in dashboard: "X days left in your trial"
   - Expiry: downgrade to free

8. /settings billing section
   - Current plan, usage this month, "Manage billing" → Stripe portal

Update Build Progress in docs/claude.md after each task. Commit to GitHub.
```

---

### Week 4 — Polish + Launch

```
Read docs/claude.md for full project context.

Polish and launch:

1. Marketing landing page (/)
   - Hero: headline + subheadline + "Start free" CTA
   - Platform logos: Etsy (live), Amazon + Shopify (coming soon)
   - Feature highlights with screenshots or mockups
   - Pricing section (mirrors /pricing)
   - Footer: links, legal

2. Onboarding (3 steps post-signup)
   - Step 1: "What do you sell?" (type + platform)
   - Step 2: "Try your first optimisation" (inline mini-optimiser)
   - Step 3: "You're all set!" → dashboard
   - Skip available at all steps

3. Emails via Resend
   - Welcome (on signup)
   - Trial day 5: upgrade nudge
   - Trial expired: downgrade notice
   - First optimisation complete: encouragement + tips

4. Empty / error / loading states
   - Dashboard empty state with CTA
   - Optimiser loading: animated steps ("Analysing keywords...", "Writing your title...")
   - API error: friendly message + retry
   - Competitor URL fail: specific error message

5. SEO
   - og:title, og:description, og:image on landing + pricing
   - /sitemap.xml, robots.txt

6. Pre-launch
   - All env vars in Vercel production
   - Stripe live mode
   - Supabase RLS verified
   - Custom domain configured
   - Test full signup → trial → optimise → upgrade flow end to end

Update Build Progress in docs/claude.md. Prepare launch post copy for r/Etsy.
```

---

### Phase 5 — Amazon FBA Expansion

```
Read docs/claude.md for full project context.

Etsy MVP is live and generating revenue. Expand to Amazon FBA:

1. Unlock Amazon in platform selector (remove "coming soon")

2. Amazon Listing Optimiser
   - Wire up Amazon system prompt from claude.md
   - Output format: title (200c) + 5 bullets (255c each) + backend keywords + description
   - UI adapts to show bullets instead of tags when Amazon is selected

3. Amazon Competitor Peek
   - Parse amazon.com/dp/ URLs
   - Extract title + bullets from product page
   - Side-by-side comparison with AI version

4. FBA Fee Calculator (/tools/fba-calculator)
   - Inputs: product cost, selling price, weight, dimensions, category
   - Calculate: FBA fee, referral fee, net margin, ROI
   - Flag the Apr 2026 3.5% surcharge impact
   - "Optimise this listing" CTA

5. Amazon keyword research
   - Purchase-intent patterns (vs Etsy occasion-based)
   - PPC competition indicator

6. Update pricing + landing pages for Amazon messaging

Update Build Progress in docs/claude.md throughout. Commit to GitHub.
```

---

## Competitor Landscape

| Tool | Platform | Weakness | Our edge |
|------|----------|----------|----------|
| Erank | Etsy only | No AI, dated UI | AI-native, multiplatform |
| Marmalead | Etsy only | Expensive, no AI | Better value, AI-first |
| Helium 10 | Amazon only | Complex, expensive ($99+) | Simpler UX, multi-platform |
| Jungle Scout | Amazon only | Data-heavy, overwhelming | Focused on listing copy |
| ChatGPT direct | Any | No platform rules, no structure | Purpose-built, enforces format |

---

## Go-To-Market

- **Launch channels**: r/Etsy, r/EtsySellers, Etsy seller Facebook groups, TikTok demos
- **Hook**: results-first social proof — "tested on 10 listings, views up 40%"
- **Pricing anchor**: cheaper than Marmalead, smarter than ChatGPT
- **Expansion signal**: track which users ask about Amazon → triggers Phase 5

---

## Key Metrics

- MRR, churn, trial → paid conversion
- Optimisations per user per month (engagement)
- Platform distribution across users
- Time to first optimisation post-signup (onboarding friction)
- NPS (monthly in-app prompt)

---

## Session Log

| Date | Work Done |
|------|-----------|
| 2026-05-12 | Initial ideation, market research, revenue model comparison |
| 2026-05-12 | Full MVP spec created (as EtsyAI) |
| 2026-05-12 | Renamed to SellWise, multiplatform architecture added |
| 2026-05-12 | create-next-app scaffolded, dependency conflicts hit |
| 2026-05-13 | claude.md rebuilt as live spec with all week kickoff prompts |
| 2026-05-13 | Phase 2 complete — Keyword Research, Competitor Peek, Listing Audit + reusable upgrade modal |
| 2026-05-13 | Phase 3 complete — Stripe checkout/portal/webhook, pricing page, 7-day trial, settings billing section |
| 2026-05-13 | Freemium strategy locked in — feature gating on keywords/competitor/audit (Starter+), free limit lowered to 1, FeatureGate server component added |
| 2026-05-13 | Phase 6 planned — Etsy/Amazon/Shopify store API integration (Growth: read+audit, Studio: push back) |
