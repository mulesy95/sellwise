# SellWise — Product Brief for Feasibility Review

## What It Is

SellWise is an AI-powered listing optimiser for online sellers. It takes a seller's product details (title, description, category, materials, optional images) and generates platform-specific SEO-optimised titles, tags, bullet points, and descriptions using Claude AI.

The core pitch: sellers spend hours writing listings and have no good way to know whether their copy is hurting or helping their search rank. SellWise automates that and enforces each platform's specific format rules (character limits, tag counts, keyword strategy) that sellers typically don't know or don't follow consistently.

**Tagline**: Sell smarter on every platform.

**Status**: Fully built, deployed to sellwise.au, behind a coming-soon page. Not yet publicly launched. Sole founder, Adelaide, no external funding, no team.

---

## Target Market and Platform Priority

**Primary launch target: Shopify sellers.** Shopify has the most accessible API (no approval needed), the most technically savvy seller base, and the clearest willingness to pay for SaaS tools. Store connect is fully built.

**Secondary target: eBay sellers.** eBay has 17.6M global sellers and no meaningful AI tool competing in this space. Store connect is fully built. eBay sellers are generally less tech-forward than Shopify sellers.

**Supported for manual use (paste your listing, get optimised copy): all four platforms** -- Etsy, Amazon, Shopify, eBay. No store connect for Etsy or Amazon.

### Platform Constraints

| Platform | Store Connect | Manual Optimiser | Notes |
|----------|--------------|-----------------|-------|
| Shopify | Built (OAuth, read/write, SEO metafields) | Yes | Primary target |
| eBay | Built (Trading API OAuth, read/write) | Yes | Secondary target |
| Etsy | Permanently unavailable | Yes | Developer app banned before launch |
| Amazon | Not built (deferred) | Yes | SP-API too complex for now |

The Etsy ban is a real constraint. The developer app was permanently banned before launch. Etsy sellers can use the manual optimiser (paste their listing, get back optimised copy) but there is no store connect and no automated access to Etsy data.

---

## Features

### 1. Listing Optimiser (primary feature)
Input: product name, description, category, style, material, optional image upload. Output: platform-specific optimised title, tags or bullet points, and description.

Enforces format rules per platform:
- Etsy: exactly 13 tags, max 20 chars each, 140-char title
- eBay: 80-char title, scannable description with condition stated
- Amazon: 200-char title, 5 bullet points at 255 chars each, 250-byte backend keywords
- Shopify: 60-char meta title, 160-char meta description, full product description

All four platforms available for manual use. Gated by usage limits per plan.

### 2. Keyword Research
Seed keyword + platform selector. Returns 15 keywords with estimated volume, competition level, and trend indicators. Platform-aware prompts (Etsy focuses on occasion/style; Amazon on purchase intent; eBay on model/condition specifics). Saved keyword lists can be pulled directly into the optimiser input.

### 3. Listing Audit
- **URL mode**: Shopify only -- paste a Shopify product URL, fetch via `/products.json`, run AI audit
- **Manual mode**: all platforms -- paste title, tags/bullets, description, get a 0-100 SEO score with breakdown by section and a quick-wins list
- Shareable score cards with og:image (sellers can share their score)

### 4. My Shop (Store Connect)
**Shopify:**
- OAuth connect, read all products
- Optimise individual listings (slide-out panel, AI side-by-side vs current)
- Push content back to Shopify (Studio only)
- Push SEO metafields (meta_title + meta_description) directly to the product's SEO fields (Studio only -- no competitor does this)
- Per-product optimisation history with revert capability

**eBay:**
- OAuth connect via Trading API
- Read active listings
- Push revised title/description back (Studio only)
- Sandbox account support (users can connect a sandbox eBay account to test before going live)
- Per-product history with revert

### 5. Optimisation History
Every optimisation is saved. Users can browse before/after for any listing, filter by platform, re-optimise from history, archive entries, or revert a pushed change.

### 6. Platform Migration Tool
User pastes a listing from one platform, selects a target platform, AI reformats the copy for the new platform's requirements. No API access needed -- pure AI transformation. Main use case: seller expanding from Etsy to eBay or Shopify.

### 7. Bulk Optimiser
CSV upload of up to 200 listings, sequential AI processing with a live progress bar, download results as CSV. Growth and Studio plans only.

---

## Pricing

| Plan | Monthly | Annual | Key Limits |
|------|---------|--------|-----------|
| Free | $0 | $0 | 1 optimisation/month, optimiser only |
| Starter | $19 | ~$15.80 | 50 optimisations/month, all features except store connect |
| Growth | $29 | ~$24.20 | Unlimited optimisations, 1 connected store, 100/day cap |
| Studio | $79 | ~$65.80 | Unlimited, unlimited stores, push-back to platforms, 250/day cap |
| Agency | $249 | Contact us | Manual onboarding |

- 7-day free trial of Growth, no card required
- Annual = 2 months free
- Stripe live mode, all price IDs configured in production

---

## Market Size

| Platform | Active sellers |
|----------|---------------|
| Shopify | ~2.5M active stores / 5.9M live sites |
| eBay | ~17.6M sellers globally |
| Etsy | 5.6M active sellers |
| Amazon (3P) | ~1.9M active worldwide |

Estimated unique sellers across all platforms (after ~35% overlap): ~30M globally. Realistic English-speaking SAM: ~15-18M.

---

## Unit Economics

**AI cost per optimisation:** ~$0.027 (Claude Sonnet, ~2K input tokens + 500 output tokens)

**Platform running costs at current scale:** ~$22/month (Supabase free tier, Vercel, Resend). Scales to roughly $200-500/month at 1,000 paying users, mostly AI API costs. Gross margin ~99% at current scale.

**Year 1 funnel model (base case -- unvalidated assumptions):**
- Year 1 reach (1% of SAM via content/community/ads): 150K visitors
- Landing to signup (5%): 7,500
- Signup to trial activation (65%): 4,875
- Trial to paid (15%): ~731 paying customers
- Blended ARPU ~$28/month: ~$246K ARR end of Year 1
- Expected tier mix: Starter 55-65%, Growth 20-30%, Studio 8-15%

No customers yet. These are planning assumptions.

---

## Competition

| Tool | Platform | Price | Weakness |
|------|----------|-------|---------|
| eRank | Etsy only | ~$10-30/mo | No AI, dated UI |
| Marmalead | Etsy only | Similar | No AI |
| Sale Samurai | Etsy + Amazon | ~$10/mo | Limited AI |
| Helium 10 | Amazon only | $39-249/mo | Complex, expensive, Amazon-only |
| Jungle Scout | Amazon only | $49+/mo | Data-heavy, no copy AI |
| Alura | Etsy only | ~$13-30/mo | Etsy-only |
| ChatGPT (direct) | Any | $20/mo | No platform rules, no format enforcement, no store connect |

No tool does Shopify + eBay store connect with AI-native copy generation in one product. No meaningful AI tool exists specifically for eBay sellers.

---

## What Is Not Built Yet (pre-launch targets)

- Amazon SP-API store connect (high complexity -- Login with Amazon OAuth + SP-API Listings)
- WooCommerce store connect (REST API)
- TikTok Shop store connect (Seller API)
- Bulk product optimisation for connected stores (optimise all store products at once via GraphQL -- different from the CSV bulk tool)
- Empty/error states on several pages
- og:image for landing and pricing pages

## Removed

- Competitor analysis feature (was built, then cut -- no page, no API route)

---

## Key Risks and Open Questions

1. **Etsy exclusion**: Etsy has the most passionate seller community and is a natural early-adopter market. The permanent API ban removes store connect. Is the manual optimiser compelling enough as a standalone for Etsy sellers, or does the lack of store connect make it a hard sell?

2. **Shopify app competition**: Shopify has a large existing app ecosystem. How many listing-optimisation or AI copy apps already exist in the Shopify App Store, and is the differentiation (AI-native, multi-platform, SEO metafield push) strong enough to stand out?

3. **eBay seller behaviour**: eBay sellers are generally less tech-forward than Shopify sellers. Will they pay $29-79/month for a SaaS tool, and where do you find them?

4. **Trial conversion**: 7-day trial, no card required. What is a realistic trial-to-paid conversion rate for this type of tool with no existing social proof?

5. **No viral loop**: There is no built-in sharing or referral mechanic that drives organic growth. (A referral system exists technically but is not a core growth strategy.) Growth depends on community posts, SEO, and cold outreach. What is a realistic CAC?

6. **Pricing bracket**: $19/mo Starter limits to 50 optimisations. Is that too tight for a seller to feel value before hitting the wall? Or is it too generous -- does a seller have 50 listings they actively want to rewrite?

7. **The "so what" on SEO metafield push**: This is the main Studio differentiator. Sellers who don't understand what a meta title is will not value this. Does this differentiator land for the actual target user?

8. **Platform API risk**: eBay and Shopify can change their API terms. The store-connect value proposition depends on continued access. eBay in particular has a history of deprecating APIs (the Finding API was shut down in February 2025 with little notice).

9. **AI quality ceiling**: Output is only as good as the input. Sellers with vague product details (no material, no brand, no size) will get vague optimisations. How much of the tool's value depends on the quality of input the seller provides?
