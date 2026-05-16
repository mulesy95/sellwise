# SellWise — Project Knowledge Base

## Overview
AI-powered SEO and listing optimiser for online sellers. Generates optimised titles, tags, bullet points, and descriptions using Claude AI — built platform-aware from day one.

**Stack**: Next.js 16, React 19, Tailwind 4, TypeScript, Supabase, Stripe, Claude API
**Repo**: github.com/mulesy95/sellwise
**Local path**: C:\Dev\Projects\sellwise
**Previously**: etsyai

---

## Vision
SellWise is the AI co-pilot for online sellers — wherever they sell. Platform-agnostic positioning, execution prioritised by API accessibility and market size.

**Tagline**: *Sell smarter on every platform.*

---

## Platform Compliance Rules — READ BEFORE BUILDING

This section is non-negotiable. Always verify before building any data access feature.

### Etsy
- **API access: PERMANENTLY BANNED.** The `sellwise` developer app is listed under "Banned Apps" on Brad's Etsy developer account. Do not reapply, do not create a new account, do not circumvent.
- **URL scraping: BANNED.** Etsy ToS explicitly prohibits automated access to listing pages.
- **What IS allowed**: Helping Etsy sellers write better listings when they paste their own content. Mentioning "Etsy" in marketing copy (nominative fair use). The listing optimiser, keywords, and manual audit all work fine.
- **What IS NOT allowed**: Any automated access to etsy.com, any use of Etsy API/data with AI, any store connect feature.

### Amazon
- **URL scraping: BANNED.** Amazon's ToS explicitly prohibits all automated access. Active litigation (2025–26) against scrapers.
- **PA-API: DEPRECATED.** Being shut down May 2026. Do not build on it.
- **SP-API: LEGITIMATE** for seller-connected workflows. Sellers authorise SellWise to access their own account. Requires seller to have an Amazon Seller account.
- **Competitor research via API**: No public competitor listing API exists. SP-API only accesses the connected seller's own data.
- **Status**: URL mode blocked in competitor + audit. SP-API store integration is a future phase (high complexity, defer).

### eBay
- **URL scraping: BANNED.** eBay ToS explicitly prohibits automated access. Aggressive enforcement via fingerprinting.
- **Shopping API (GetSingleItem): LEGITIMATE.** Free, instant AppID. Can fetch a public listing by item ID — replaces URL scraping legitimately.
- **Browse API: LEGITIMATE.** Replaces the decommissioned Finding API (shut down Feb 2025). Search listings by keyword for competitor research.
- **Trading API: LEGITIMATE** for seller-connected workflows. Full read/write access to seller's own listings.
- **Developer Program**: Very easy — ~1 business day approval. Easiest platform to integrate with officially.
- **Status**: URL scraping blocked. eBay Shopping/Browse API integration is next priority after Shopify is solid.

### Shopify
- **HTML scraping: RISKY.** No explicit platform-wide ban, but individual stores may have terms. DMCA exposure on images.
- **`/products.json` endpoint: LEGITIMATE.** Public endpoint Shopify exposes by default. Returns structured product data, no auth required. Use this instead of HTML scraping.
- **Admin GraphQL API: LEGITIMATE** for seller-connected workflows (OAuth). Required for new apps from April 2025 — do not use REST Admin API.
- **Store integration: BUILT.** OAuth connect, product listing, push-back all built. Needs migration from REST to GraphQL.
- **Status**: HTML scraping in competitor tool should be replaced with `/products.json`. Store integration working but REST-based — migrate to GraphQL.

---

## Problem We're Solving
Online sellers spend hours writing listings. SEO is opaque — each platform has its own algorithm, rules, and quirks. Existing tools are platform-specific, stale, and not AI-native. Sellers will pay $29–79/mo for something that saves them 2–3 hours per listing and measurably improves search rank.

---

## Target Users
- Etsy sellers (manual paste optimiser — full support, no store connect)
- eBay sellers (full support coming via official APIs)
- Shopify / DTC brand owners (store connect built)
- Amazon FBA sellers (manual optimiser works, store connect deferred)
- Non-technical; often mobile; time-poor
- Primary pain: writing titles/tags/bullets that actually rank
- Secondary pain: keeping listings fresh after algorithm updates

---

## Platform Roadmap

| Phase | Platform | Approach | Status |
|-------|----------|----------|--------|
| MVP | Etsy | Manual paste optimiser only (no API, no scraping) | Live |
| Current | Shopify | Store connect (OAuth) + competitor via /products.json | Store connect built, scraper to fix |
| Next | eBay | Shopping/Browse API for competitor + Trading API for store connect | To build |
| Future | Amazon | SP-API store connect (high complexity) | Deferred |
| Never | Etsy API | Permanently banned | — |

---

## Core Features

### 1. Listing Optimiser (primary feature)
- Platform selector (Etsy, Amazon, Shopify, eBay all active for manual optimisation)
- Input: product title, description, category, style, material
- Output: optimised title with char counter, tags/bullets, description
- Copy buttons per field, SEO score badge (0–100), improvement tips
- Usage check before API call, increment after success, upgrade modal if limit hit

### 2. Keyword Research
- Seed keyword input + platform selector
- Returns 15 keywords with volume/competition/trend indicators
- Platform-aware prompts (Etsy occasion/style vs Amazon purchase intent vs eBay specifics)
- Save to keyword list (persisted in Supabase)

### 3. Competitor Peek
- URL input — Shopify only via `/products.json` (legitimate public endpoint)
- Amazon/eBay: "coming soon via official API" message (Shopping API for eBay, nothing public for Amazon)
- Etsy: blocked with redirect to manual audit
- Side-by-side: their listing vs AI-optimised version

### 4. Listing Audit
- **URL mode**: Shopify only (via scraping currently — migrate to `/products.json`)
- **Manual mode**: all platforms — paste title, tags/bullets, description → score 0–100
- Score breakdown per platform section, quick wins list

### 5. My Shop (store connect)
- Shopify: OAuth connect, product list, optimise per product, push back (Studio only) — BUILT
- eBay: Trading API connect — TO BUILD (next priority)
- Amazon: SP-API — DEFERRED
- Etsy: PERMANENTLY UNAVAILABLE

### 6. Dashboard
- Usage bar (X / limit used this month)
- Personal greeting (Welcome back, [First Name])
- Quick actions grid
- Subscription status + upgrade prompt

---

## New Features Identified (from API research, 2026-05-16)

### eBay Shopping API — Competitor Research (HIGH PRIORITY)
Extract item ID from eBay URL → call `GetSingleItem` via official Shopping API → return title, description, specifics, price. Replaces the banned URL scraping with a legitimate equivalent. Free, instant AppID, no auth required.

### eBay Browse API — Competitor Search
Search eBay by keyword to surface competing listings. Helps sellers understand what they're up against. No auth required for basic access.

### Shopify `/products.json` — Competitor Research (REPLACE CURRENT SCRAPER)
Replace the current HTML scraping in the competitor route with a fetch to `{storeUrl}/products.json`. Structured data, no auth, no scraping risk.

### Shopify SEO Metafield Push (STUDIO DIFFERENTIATOR)
When a seller connects their Shopify store, write the AI-generated meta title and meta description directly to the product's SEO metafields via GraphQL (`title_tag` and `description_tag`). No copy-paste. This is a genuine Studio tier differentiator — no competitor offers this.

### Platform Migration Tool
"I sell on Etsy — help me list this on Amazon too." User pastes their Etsy listing, selects a target platform, AI reformats for the new platform's requirements. No API access needed — pure AI transformation. High value, easy to build.

### Bulk Listing Optimiser (Growth/Studio)
Upload a CSV of listings → AI generates optimised versions for each → download results. High value for sellers with 50+ listings. No API access needed.

### eBay Store Connect (Trading API)
OAuth connect for eBay sellers. Read active listings, surface SEO scores, allow optimise-and-push-back. Easiest platform to get approved (~1 business day). Build after Shopify GraphQL migration.

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

### Amazon FBA
```typescript
interface AmazonOutput {
  title: string             // max 200 chars, brand first
  bullets: string[]         // exactly 5, max 255 chars each, benefit-led
  backend_keywords: string  // max 250 bytes, space-separated, no repeats
  description: string       // max 2000 chars, HTML allowed
}
```

### Shopify
```typescript
interface ShopifyOutput {
  meta_title: string        // max 60 chars
  meta_description: string  // max 160 chars, click-optimised
  product_title: string     // clean, conversion-focused
  description: string       // full HTML product description
}
```

### eBay
```typescript
interface EbayOutput {
  title: string        // max 80 chars, keyword-front-loaded, specific product details
  description: string  // condition stated, key specs in short lines, shipping/returns note
}
```

---

## Monetisation

| Plan | Price | Features | Target user |
|------|-------|----------|-------------|
| Free | $0 | 1 optimisation/mo (optimiser only) | Try before buying |
| Starter | $19/mo | 50 optimisations/mo + all features (keywords, competitor, audit) | Part-time sellers |
| Growth | $29/mo | Unlimited + all features + connect 1 shop | Full-time sellers |
| Studio | $79/mo | Unlimited + unlimited shops + push-back to platforms | Power users / agencies |

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
    /competitor/page.tsx     — competitor analysis (Shopify URL + manual)
    /audit/page.tsx          — listing audit (Shopify URL + manual all platforms)
    /shop/page.tsx           — connected store dashboard
    /settings/page.tsx       — account + billing
    /admin/page.tsx          — admin panel (is_admin only)
  /api
    /optimise/route.ts       — Claude API (platform-aware)
    /keywords/route.ts
    /competitor/route.ts     — Shopify /products.json + manual (Amazon/eBay/Etsy blocked)
    /audit/route.ts          — Shopify URL + manual (Amazon/eBay/Etsy blocked for URL)
    /shopify/connect         — OAuth initiation
    /shopify/callback        — OAuth token exchange
    /shopify/listings        — fetch connected store products
    /shopify/push            — push optimised content back (Studio)
    /health/route.ts         — service health check
    /stripe/webhook/route.ts
    /stripe/create-checkout/route.ts
    /stripe/portal/route.ts
  /(marketing)
    /page.tsx                — landing page
    /pricing/page.tsx
    /status/page.tsx         — service status
    /invite/page.tsx         — invite-only signup
```

### Database — Supabase
```sql
platform: 'etsy' | 'amazon' | 'shopify' | 'ebay'

profiles        (id, email, plan, usage_count, usage_reset_at, stripe_customer_id, trial_ends_at, is_admin)
optimisations   (id, user_id, platform, input jsonb, output jsonb, score, is_saved, created_at)
keyword_lists   (id, user_id, platform, name, keywords jsonb, created_at)
shops           (id, user_id, platform, shop_name, shop_url, shop_id, access_token, is_primary)
waitlist        (id, email, name, platform, created_at)
invite_codes    (id, code, token, max_uses, used_count, created_at)
```

### AI — claude-sonnet-4-6
- All calls server-side only
- Platform-aware system prompts
- Structured JSON output enforced via prompt schema
- Per-user rate limiting (20 req/min sliding window)

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 16 (App Router) | Full-stack, Vercel deploy |
| Language | TypeScript | Type safety |
| Styling | Tailwind 4 + shadcn | Speed + accessibility |
| Database | Supabase | Auth + DB + free tier |
| Payments | Stripe | Subscriptions + portal |
| AI | claude-sonnet-4-6 | Best copy quality |
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

# Shopify (custom app — already configured)
SHOPIFY_CLIENT_ID=
SHOPIFY_CLIENT_SECRET=

# eBay (to add when building eBay integration)
EBAY_APP_ID=
EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://sellwise.au

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

  ebay: `You are an expert eBay listing specialist with deep knowledge of Cassini
search. You specialise in titles (max 80 chars, keyword-front-loaded,
specific product details including brand/model/size/condition) and
descriptions (condition clearly stated, key specs in short lines,
shipping and returns mentioned). Respond in valid JSON only.`,
}
```

---

## Build Progress

### Phase 1 — Foundation
- [x] create-next-app scaffold (Next 16, React 19, Tailwind 4, TypeScript)
- [x] package.json clean + correct dependencies installed
- [x] shadcn init + core components
- [x] Supabase project created + schema migrated
- [x] Auth working (email/password sign-in/sign-up/sign-out, route protection)
- [x] Dashboard shell + sidebar nav with usage bar
- [x] Deployed to Vercel

### Phase 2 — Core AI Features
- [x] Listing Optimiser page + /api/optimise route
- [x] Keyword Research page + /api/keywords route
- [x] Competitor Peek page + /api/competitor route (Shopify URL only; Amazon/eBay/Etsy blocked)
- [x] Listing Audit page + /api/audit route (Shopify URL + manual all platforms)
- [x] Usage tracking (separate counters per feature type)
- [x] Upgrade modal component (reusable, triggered on 402)
- [x] Feature gating (keywords/competitor/audit behind Starter+)
- [x] FeatureGate server component

### Phase 3 — Monetisation
- [x] Stripe products + prices (live mode configured)
- [x] /api/stripe/webhook
- [x] /api/stripe/create-checkout
- [x] /api/stripe/portal
- [x] Pricing page with monthly/annual toggle
- [x] Plan enforcement on all API routes
- [x] 7-day free trial flow
- [x] /settings billing section

### Phase 4 — Polish + Launch
- [x] Marketing landing page
- [x] Onboarding flow (3-step post-signup)
- [x] Email sequences via Resend
- [x] Service health endpoint (/api/health) + status page (/status)
- [x] Service status banners in dashboard
- [x] Admin dashboard with invite code management
- [x] /invite page (invite-only signup)
- [ ] Empty / error / loading states throughout
- [ ] SEO meta + og tags + sitemap
- [ ] Production deploy + domain
- [ ] Launch posts drafted

### Phase 5 — eBay Integration (NEXT)
Priority: eBay is easiest platform to integrate legitimately (~1 day approval).

**Competitor research (no auth needed):**
- [ ] Register for eBay Developer Program (free, ~1 day approval) — get AppID
- [ ] Replace eBay URL scraping with Shopping API `GetSingleItem` — extract item ID from URL, call official API, return listing data
- [ ] eBay Browse API — search competitor listings by keyword

**Store connect (Trading API):**
- [ ] eBay OAuth flow — connect seller account (similar pattern to Shopify)
- [ ] Read seller's active listings via `GetSellerList`
- [ ] Optimise panel per listing (pre-filled with current content)
- [ ] Push updated title/description back via `ReviseFixedPriceItem` — Studio only

**Kickoff prompt:**
```
Read CLAUDE.md for full project context, especially the Platform Compliance Rules section.

Build Phase 5 — eBay integration using official APIs only (no scraping):

1. eBay Developer Program
   - Register at developer.ebay.com (free). Get AppID + ClientID + ClientSecret.
   - Add EBAY_APP_ID, EBAY_CLIENT_ID, EBAY_CLIENT_SECRET to .env.local + Vercel.

2. Competitor research via Shopping API
   - In /api/competitor: when platform is "ebay", extract item ID from URL and call:
     GET https://open.api.ebay.com/shopping?callname=GetSingleItem&ItemID={id}&appid={EBAY_APP_ID}&version=967&IncludeSelector=Description,Details,ItemSpecifics
   - Remove the "coming soon" block, replace with real API call.
   - In competitor-client.tsx: eBay URLs now work properly — show detected platform.

3. eBay store connect
   - OAuth flow similar to Shopify: /api/ebay/connect + /api/ebay/callback
   - Store token in shops table (platform: 'ebay')
   - Add eBay tab to /dashboard/shop alongside Shopify
   - Trading API: GetSellerList to read listings, ReviseFixedPriceItem to push back

eBay API docs: https://developer.ebay.com/api-docs/buy/browse/overview.html
Shopping API: https://developer.ebay.com/devzone/shopping/docs/callref/index.html
Trading API: https://developer.ebay.com/api-docs/user-guides/static/trading-user-guide-landing.html
```

### Phase 6 — Shopify Enhancements
- [ ] Replace competitor HTML scraping with `/products.json` endpoint
- [ ] Migrate Shopify Admin API from REST to GraphQL (REST deprecated April 2025)
- [ ] SEO metafield push — write `title_tag` + `description_tag` directly to Shopify products via GraphQL (Studio differentiator)
- [ ] Bulk product optimisation — GraphQL bulk mutations for all products at once

**Kickoff prompt:**
```
Read CLAUDE.md for full project context, especially the Platform Compliance Rules section.

Build Phase 6 — Shopify enhancements:

1. Replace competitor HTML scraping with /products.json
   - In /api/competitor when platform is "shopify": fetch {storeUrl}/products.json
   - Parse the JSON response for title, body_html (description)
   - Remove cheerio dependency from Shopify path

2. Migrate Shopify Admin API to GraphQL
   - Current REST-based /api/shopify/listings and /api/shopify/push use deprecated REST
   - Rewrite to use GraphQL Admin API (2026-01 version)
   - Products query: fetch id, title, descriptionHtml, status, variants, images, onlineStoreUrl
   - Product update mutation: update title and descriptionHtml

3. SEO metafield push (Studio only)
   - After optimising a Shopify product, offer "Push SEO" button (Studio only)
   - GraphQL mutation: set title_tag metafield (meta title, max 60 chars)
   - GraphQL mutation: set description_tag metafield (meta description, max 160 chars)
   - This writes directly to the product's SEO settings in Shopify — no copy-paste

Shopify GraphQL docs: https://shopify.dev/docs/api/admin-graphql/latest
SEO metafields: https://shopify.dev/docs/apps/build/marketing-analytics/optimize-storefront-seo
```

### Phase 7 — New Features (No API Access Required)
- [ ] Platform Migration Tool — paste Etsy listing → select target platform → AI reformats for Amazon/Shopify/eBay. Pure AI, no API needed. High value.
- [ ] Bulk Listing Optimiser — CSV upload → AI optimises all listings → download results. Growth/Studio.
- [ ] Saved results history — track audits over time, show SEO score improvements

### Phase 8 — Amazon SP-API (Future, High Complexity)
- [ ] Amazon Seller Central OAuth via Login with Amazon (LWA)
- [ ] SP-API Listings API — read seller's own ASINs and listing content
- [ ] Bulk audit across all ASINs
- [ ] Push updated content back via Listings API — Studio only
- Note: No public competitor research API. Competitor analysis for Amazon remains manual paste only.

---

## Competitor Landscape

| Tool | Platform | Weakness | Our edge |
|------|----------|----------|----------|
| Erank | Etsy only | No AI, dated UI | AI-native, multiplatform |
| Marmalead | Etsy only | Expensive, no AI | Better value, AI-first |
| Helium 10 | Amazon only | Complex, expensive ($99+) | Simpler UX, multi-platform |
| Jungle Scout | Amazon only | Data-heavy, overwhelming | Focused on listing copy |
| ChatGPT direct | Any | No platform rules, no structure | Purpose-built, enforces format |
| None | eBay | No good AI tool exists for eBay | First mover advantage |

---

## Go-To-Market

- **Primary launch channels**: Shopify seller communities, eBay seller forums, r/EtsySellers (for manual optimiser), TikTok demos
- **Hook**: results-first — "tested on 10 listings, views up 40%"
- **Pricing anchor**: cheaper than Marmalead, smarter than ChatGPT
- **eBay angle**: no competing AI tool exists for eBay — first mover opportunity
- **Expansion signal**: track platform distribution → prioritise roadmap by where users actually sell

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
| 2026-05-14 | Marketing landing page built and deployed |
| 2026-05-16 | Etsy developer app permanently banned — removed all Etsy API routes, scraping, and store connect. Manual paste optimiser for Etsy sellers remains fully functional. |
| 2026-05-16 | Full platform compliance audit — Amazon + eBay URL scraping blocked (ToS violation). Shopify URL mode only. Competitor tool now Shopify-only for URL analysis. |
| 2026-05-16 | Platform API research complete — eBay Shopping/Browse/Trading APIs all legitimate and easy to access. Shopify /products.json + GraphQL is the clean path. Amazon SP-API deferred. |
| 2026-05-16 | CLAUDE.md rewritten with compliance rules, revised roadmap, new feature opportunities, and updated kickoff prompts. |
