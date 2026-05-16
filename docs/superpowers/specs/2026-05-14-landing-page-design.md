# Landing Page Design Spec
Date: 2026-05-14

## Goal
Replace the current `/` redirect-to-dashboard with a real marketing page that converts cold visitors into signups.

## Structure
Short product-first layout: hero → 3 features → pricing strip → final CTA → footer.
No social proof section (none available yet). No platform badges.

---

## Sections

### 1. Nav
- Logo: "SellWise" (text, bold)
- Links: Features (anchor to features section) | Pricing (anchor to pricing section) | Sign in (→ /login)
- CTA button: "Try free" → /signup
- Sticky on scroll, no background blur needed

### 2. Hero (centred)
- No platform badge
- Headline: "Post listings that buyers actually find."
- Subhead: "Tell us what you sell. We'll write the listing."
- Primary CTA: "Try free for 7 days" → /signup
- Secondary text: "No card needed"
- Below CTA: product output card (see below)

#### Product output card
Centred, max-width ~520px, shows a sample optimised Etsy listing:
- Label: "Sample output"
- SEO score badge: "87 / 100" (green)
- Optimised title (full text)
- Tags — all 13 as chips
- Description preview — first 2 lines, fades out
- Static/hardcoded content — not a live API call

### 3. Features (id="features")
Section heading above the three columns: "Everything you need to rank"
Three columns, icon + title + 1-line description:
- Keyword Research — "Find 15 keywords buyers actually search for, with volume, competition and trend signals."
- Competitor Peek — "Paste any marketplace listing URL. See their SEO and get a version that outranks it."
- Listing Audit — "Score your listings 0 to 100 with a breakdown and specific fixes."

### 4. Pricing strip (id="pricing")
- Heading: "Simple pricing, no surprises"
- Subhead: "Start free. Upgrade when you are ready."
- Four plan cards: Free ($0), Starter ($19/mo), Growth ($39/mo, Popular badge), Studio ($79/mo)
- Each card: name, price, one-line description
  - Free: "1 optimisation per month"
  - Starter: "50 optimisations + keywords, audits, competitor"
  - Growth: "Unlimited optimisations + all features"
  - Studio: "Unlimited + multi-shop"
- Below cards: "7-day free trial on all paid plans. No card required to start."
- "See full pricing" link → /pricing

### 5. Final CTA banner
- Heading: "Get your first listing in 30 seconds."
- Subhead: "No setup, no card needed. Just describe your product and go."
- Button: "Start for free" → /signup

### 6. Footer
- Left: "SellWise" wordmark
- Right links: Pricing | Sign in (Privacy and Terms removed until those pages exist)
- Bottom: "© 2026 SellWise"

---

## Technical notes
- File: `src/app/page.tsx` — rewrite (currently just `redirect("/dashboard")`)
- Server component, no "use client" needed (no interactivity except nav links)
- Smooth scroll for anchor links — add `scroll-smooth` to html tag in layout or use `#features` / `#pricing` href anchors
- Dark theme already set globally (`dark` class on html in layout.tsx)
- Reuse existing shadcn components: Badge, Separator, buttonVariants
- No new dependencies needed

## Copy rules
- No em dashes (—) or en dashes (–)
- Plain human language, not marketing-speak
- Short sentences. No hype words ("revolutionary", "powerful", "cutting-edge")
