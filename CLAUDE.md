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
- Shopify store owners (PRIMARY — store connect fully built, launch target)
- eBay sellers (SECONDARY — store connect fully built, no competing AI tool exists)
- Etsy sellers (manual paste optimiser only — no store connect, API permanently banned)
- Amazon FBA sellers (manual optimiser works, store connect deferred)
- Non-technical; often mobile; time-poor
- Primary pain: writing titles/tags/bullets that actually rank
- Secondary pain: keeping listings fresh after algorithm updates

---

## Platform Roadmap

Goal: launch with every platform that has a legitimate seller API. Etsy is the only permanent exception.

| Platform | Approach | Status |
|----------|----------|--------|
| Shopify | OAuth, GraphQL, SEO metafield push | Complete |
| eBay | Trading API, OAuth, sandbox support | Complete |
| Amazon | SP-API (Login with Amazon OAuth + Listings API) | To build |
| WooCommerce | REST API store connect | To build |
| TikTok Shop | Seller API | To build |
| Etsy API | Permanently banned | Never |
| Etsy (manual) | Manual paste optimiser | Complete |

---

## Core Features

### 1. Listing Optimiser (primary feature)
- Platform selector (Etsy, Amazon, Shopify, eBay all active for manual optimisation)
- Input: product title, description, category, style, material, optional image upload
- Output: optimised title with char counter, tags/bullets, description
- Copy buttons per field, SEO score badge (0–100), improvement tips
- Usage check before API call, increment after success, upgrade modal if limit hit

### 2. Keyword Research
- Seed keyword input + platform selector
- Returns 15 keywords with volume/competition/trend indicators
- Platform-aware prompts (Etsy occasion/style vs Amazon purchase intent vs eBay specifics)
- Save to keyword list (persisted in Supabase); saved lists pull directly into optimiser

### 3. Listing Audit
- **URL mode**: Shopify only via `/products.json`
- **Manual mode**: all platforms — paste title, tags/bullets, description → score 0–100
- Score breakdown per platform section, quick wins list
- Shareable score cards with og:image

### 4. My Shop (store connect)
- Shopify: OAuth connect, product list, slide-out optimise panel, push content back (Studio), push SEO metafields (Studio), revert to previous version (Studio)
- eBay: Trading API OAuth, read listings, push title/description (Studio), revert (Studio), sandbox account support
- Multi-store tabs (Growth: 1 store, Studio: unlimited)
- Per-product optimisation history with revert
- Amazon: SP-API — DEFERRED
- Etsy: PERMANENTLY UNAVAILABLE

### 5. Optimisation History
- `/dashboard/history` — every optimisation saved, before/after panels, platform filter, pagination
- Archive/restore toggle, re-optimise from history, route to My Shop when product + shop present

### 6. Platform Migration Tool
- `/dashboard/migrate` — paste a listing, select target platform, AI reformats for new platform requirements

### 7. Bulk Optimiser
- `/dashboard/bulk` — CSV upload, sequential AI processing with progress bar, download results CSV
- Growth+ only, max 200 rows

### 8. Dashboard
- Usage bar (X / limit used this month)
- Personal greeting (Welcome back, [First Name])
- Quick actions grid, My Shop widget (Growth/Studio)
- Subscription status + upgrade prompt

### REMOVED — Competitor Peek
Was built, then removed. No page, no API route. Do not reference as a current or planned feature.

---

## Deferred / Future Features

### Amazon SP-API Store Connect (deferred)
High complexity. Requires Login with Amazon (LWA) OAuth + SP-API Listings read/write. No public competitor data API exists — manual paste only for Amazon competitor analysis. Park until post-launch with real user demand signal.

### Shopify Bulk Product Optimisation (lower priority)
GraphQL bulk mutations to optimise all store products at once — different from the CSV bulk tool. Park until Shopify store connect has been used in anger.

### eBay Team Seats / White-label (future)
Agency use case — multiple operator logins per account, white-label output. Deferred.

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
    /audit/page.tsx          — listing audit (Shopify URL + manual all platforms)
    /shop/page.tsx           — connected store dashboard
    /settings/page.tsx       — account + billing
    /admin/page.tsx          — admin panel (is_admin only)
  /api
    /optimise/route.ts       — Claude API (platform-aware)
    /keywords/route.ts
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

# eBay (Trading API OAuth — requires developer.ebay.com registration)
EBAY_APP_ID=
EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=
EBAY_RU_NAME=

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

### Phase 5 — eBay Integration (COMPLETE 2026-05-17, sandbox 2026-05-21)

**Competitor research:**
- [x] eBay Shopping API `GetSingleItem` — extracts item ID from URL, fetches listing data legitimately
- [x] eBay Browse API — keyword competitor search (app token, no user auth)

**Store connect (Trading API):**
- [x] `src/lib/ebay.ts` — full eBay library (Shopping, Browse, Trading APIs + OAuth, no new npm deps)
- [x] `/api/ebay/connect` + `/api/ebay/callback` — OAuth flow; connect accepts `?sandbox=true`
- [x] `/api/ebay/listings` — fetch seller's active listings via Trading API
- [x] `/api/ebay/push` — revise listing via `ReviseFixedPriceItem` (Studio only)
- [x] `/api/ebay/disconnect` — remove eBay shop record
- [x] My Shop: eBay tab in ConnectForm (live + sandbox buttons), platform-aware product panel + optimise panel
- [x] Token auto-refresh on all seller API routes
- [x] `supabase/migrations/20260517110854_add_refresh_token_to_shops.sql`

**Per-shop sandbox support (2026-05-21):**
- [x] `shops.is_sandbox` column (migration applied)
- [x] `ebayConfig(isSandbox)` in `ebay.ts` — selects credentials + endpoints per call
- [x] Shopping/Browse API always production; OAuth + Trading API per-shop
- [x] Sandbox shop_id = `${userId}:sandbox` so live + sandbox can coexist per user
- [x] All Trading API routes pass `is_sandbox` through
- [x] Sandbox env vars in Vercel: `EBAY_SANDBOX_APP_ID`, `EBAY_SANDBOX_CLIENT_ID`, `EBAY_SANDBOX_CLIENT_SECRET`
- [ ] `EBAY_SANDBOX_RU_NAME` — needs sandbox RuName created in eBay portal → `https://sellwise.au/api/ebay/callback`

### Phase 6 — Shopify Enhancements (COMPLETE 2026-05-17)

- [x] Shopify Admin API — already GraphQL from day one (`src/lib/shopify.ts`, API version 2026-01)
- [x] Competitor route — already uses `/products/${handle}.json` (not HTML scraping); cheerio used only to strip HTML tags from body_html JSON field
- [x] **SEO metafield push (Studio only)** — `pushShopifyMetafields()` in `src/lib/shopify.ts`, `/api/shopify/seo` route, pushed in parallel with content from shop dashboard
- [ ] Bulk product optimisation — GraphQL bulk mutations for all products at once (lower priority)

### Phase 7 — Product Quality + Retention (COMPLETE 2026-06-13)

- [x] **Results history page** — `/dashboard/history`, full before/after panels per platform, platform filter, paginated. Every `/api/optimise` call saves to `optimisations` table. Re-optimise link pre-fills form.
- [x] **Keyword → optimiser integration** — saved list picker in optimiser pre-populates keywords input, fetches from `/api/keyword-lists`
- [x] **Agency tier on pricing page** — $249/mo, "Contact us" mailto CTA, 5-card grid (`xl:grid-cols-5`)
- [x] **Feedback system** — thumbs up/down on every optimisation result; `feedback` column on `optimisations` table; PATCH `/api/feedback`; buttons on history page and optimiser result
- [x] **eBay item specifics** — AI returns `itemSpecifics` key-value map in eBay JSON output; displayed in dedicated "Item Specifics" tab; serialised for ListingDiff improve mode

### Phase 8 — New Features
- [x] Platform Migration Tool — `/dashboard/migrate` — already built
- [x] Bulk Listing Optimiser — `/dashboard/bulk` — CSV upload → AI optimises all listings → download results (Growth/Studio) — already built
- [ ] **AI output quality audit** — run real products through all platforms, assess and fix prompts. Do before launch.

### Sprints A–F — Art of Game Design engagement series (PLANNED 2026-06-13)
Plans at `docs/superpowers/plans/2026-06-13-sprint-[a-f]-*.md`. Implement in order — some sprints have dependencies on earlier ones.

- [x] **Sprint A** — Core loop: upgrade modal reframing ("You've outgrown this plan"), rescue CTAs when score < 60, input-phase platform hints above submit button
- [x] **Sprint B** — Engagement mechanics: shop health apex score + trend sparkline, milestone widget, keyword list power level badge
- [x] **Sprint C** — Rewards + social proof: badges/streaks (DB migration), BigLiftToast on 30+ pt improvement, variable micro-notes, peer comparison top-5% badge, streak widget
- [x] **Sprint D** — Onboarding + persona: brand voice capture (onboarding step 2), brand voice injection into all AI prompts, demo gasp moment on all-set step, Studio layered disclosure, SellWise voice copy pass, platform filtering (show only user's platforms across all 4 tools)
- [x] **Sprint E** — Growth + retention: public /check Shopify health check (no auth), weekly digest email (Monday cron), aggregate activity stat on dashboard
- [x] **Sprint F** — Evolving brand voice: auto-derive voice from 5+ thumbs-up results (Haiku model), `brand_voice_auto` fallback column, Settings UI with Refresh button. Depends on Sprint D + feedback system.

### Phase 9 — Amazon SP-API (Future, High Complexity)
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
| 2026-05-16 | My Shop redesign — multi-store tabs, SEO score badges sorted worst-first, slide-out optimise panel, image upload + AI visual analysis + Shopify push, My Shop widget on main dashboard |
| 2026-05-16 | Daily optimisation caps — Growth: 100/day, Studio: 250/day. Atomic SQL reset in RPC. |
| 2026-05-16 | Prompt quality uplift — Shopify (desire-first, mobile-first), Etsy (emotion-first), eBay (scannable, condition-upfront) |
| 2026-05-17 | Phase 5 complete — full eBay integration: Shopping API competitor research, Trading API store connect (OAuth, listings, push-back), /api/ebay/* routes, platform-aware My Shop |
| 2026-05-17 | My Shop platform-aware fixes — eBay result maps title correctly, meta fields hidden for eBay, disconnect routes correctly, all hardcoded Shopify strings removed |
| 2026-05-17 | Phase 6 complete — Shopify SEO metafield push (pushShopifyMetafields, /api/shopify/seo, parallel push in shop dashboard) |
| 2026-05-17 | Phase 7 mostly complete — optimisation history page (/dashboard/history), keyword→optimiser integration, agency tier on pricing page, optimisations + keyword_lists Supabase tables created |
| 2026-05-17 | Prompt hardening — WRITING_RULES: never invent product details not in input or visible in image; write around missing info |
| 2026-05-17 | History page: before/after panels, platform filter, paginated, Re-optimise link pre-fills optimiser form via URL params |
| 2026-05-20 | eBay developer account approved — compliance endpoint live, all production credentials in Vercel |
| 2026-05-21 | Per-shop eBay sandbox support — ebayConfig(isSandbox) helper, is_sandbox on shops table, sandbox OAuth flow, ConnectForm "Connect sandbox account" button, sandbox env vars in Vercel |
| 2026-05-22 | UI audit complete — nav reordered (My Shop to top), all tool defaults → Shopify, coming soon + homepage copy leads with Shopify+eBay, dashboard My Shop widget shows live health counts per shop (lazy-loaded via ShopHealthCounts), My Shop summary bar is now an interactive severity filter, calcSeoScore extracted to src/lib/seo-score.ts |
| 2026-05-22 | UI audit 1.6 — coloured platform pill (PLATFORM_PILL in platforms.ts) on My Shop store tabs and dashboard card; dashboard card layout: store name / ● [pill] | health counts; ShopHealthCounts no longer prefixes platform name; sessionStorage platform sync across all standalone tools |
| 2026-06-13 | Feedback system — thumbs up/down on optimisations (PATCH /api/feedback, `feedback` col on optimisations table); feedback buttons on history page and optimiser result |
| 2026-06-13 | eBay item specifics — AI returns `itemSpecifics` key-value map; displayed in dedicated tab on eBay result; serialised to "Key: Value\n..." string for ListingDiff improve mode |
| 2026-06-13 | Art of Game Design analysis — comprehensive interrogation of Schell's book applied to SellWise; 18+ feature recommendations across personality, feedback loops, engagement, rewards, social proof, onboarding, elder game, growth; saved to docs/superpowers/research/2026-06-13-art-of-game-design-analysis.md |
| 2026-06-13 | Product persona decision — no separate AI persona name needed; SellWise IS the personality; the brand speaks; mascot deferred for future consideration |
| 2026-06-13 | Sprints A–F planned — full 6-sprint implementation series covering all Art of Game Design recommendations. Plans at docs/superpowers/plans/2026-06-13-sprint-[a-f]-*.md |
| 2026-06-14 | Sprint A complete — upgrade modal reframing, RescuePanel (score < 60), PLATFORM_HINTS above submit, free description truncation (80w + gradient fade + UpgradeModal lockedDescription), "What next?" CTA strip, 7-day trial banner |
| 2026-06-14 | Sprint B complete — /api/shop-health apex score + 7-day trend, ScoreTrendChart sparkline, ListingHealthWidget + MilestoneWidget, dashboard wiring, keyword power level badge, history ghost rows for free users |
| 2026-06-14 | Sprint C complete — DB migration (badges/streak/weekly_goal), /api/streak POST, BigLiftToast (30+ pt delta), HIGH_SCORE_NOTES variable micro-notes (~30%), peer comparison top-5% badge, streak widget in dashboard |
| 2026-06-14 | Sprint D complete — brand_voice DB migration, onboarding 3-step (brand voice step 2), brand voice injection in all AI routes (optimise/keywords/audit), demo gasp moment on onboarding step 3 (quota-exempt), Studio default detail view, SellWise voice copy pass, platform filtering across all 4 tools |
| 2026-06-14 | Sprint E complete — public /check Shopify health check (IP rate limited, score+count only, conversion gate), weekly digest email cron (Monday 9am AEST, paid+active users, deduped), aggregate weekly activity stat on dashboard (>= 10 guard) |
| 2026-06-14 | Sprint F complete — brand_voice_auto column; /api/brand-voice/refresh (Haiku, 5+ thumbs-up gate, count-aware toast); brand_voice ?? brand_voice_auto fallback in optimise/keywords/audit routes; Settings UI with BrandVoiceForm + RefreshVoiceButton + auto-derived voice display |
