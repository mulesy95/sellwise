# SellWise — UI Audit & Change Brief

**Purpose:** External review of the current SellWise dashboard UI, captured as scoped tasks for you (Claude Code) to reflect on and act on. This is not a "do all of these" list. Each item has reasoning attached. Where a task says **DECISION NEEDED**, do not implement blindly — surface the trade-off to Brad and let him choose. Where it says **VERIFY FIRST**, check the current behaviour against the claim before changing anything; the reviewer was working from screenshots and may have misread state.

**Context you must hold while doing this:**
- Primary target platform is **Shopify**. eBay is secondary. Everything should bias toward Shopify as the default/hero unless there's a deliberate reason otherwise.
- Store-connect is built for **Shopify and eBay only**. Amazon, WooCommerce, TikTok Shop are *planned/to-build*. **Etsy store-connect is permanently unavailable** (developer app banned). The manual tools (Optimiser, Audit, Migrate) may run for all platforms via AI text formatting, but connect is two platforms only.
- The strategically defensible hero of the product is the **connected-store audit + unified listing view** ("My Shop"), NOT the standalone optimiser. The optimiser is closer to a commodity. Changes should pull the connected-store experience forward, not the standalone optimiser.
- Do not reintroduce any competitor-scraping behaviour. It was removed deliberately (ToS risk; one platform ban already happened).

---

## Priority 1 — Trust & positioning (do these first)

### 1.1 Distinguish connect-capable platforms from manual-only ones
**Problem:** Across Optimiser, Audit, Keywords, Bulk, and Migrate, all platforms (Shopify, eBay, Amazon, Etsy, WooCommerce, Wix, Squarespace, TikTok Shop, Social) render as identical, equally-selectable tabs. A user cannot tell which platforms they can actually *connect a store* to versus which are *paste/manual only* or *not built yet*. The Migrate screen even defaults to Etsy→Amazon — the two platforms with the least real support.

**Why it matters:** This is a trust issue, not a polish issue. An Etsy or Amazon seller who signs up expecting store-connect (because the UI presents Etsy/Amazon identically to Shopify) will hit a wall and feel misled. With no social proof at launch, a misled first user is expensive.

**Change:** Add a visual distinction so the tabs communicate capability. Suggested approach (use judgement): a small "Connect" badge on Shopify and eBay; a "Manual" or "Paste only" treatment on the rest; and a "Soon" treatment on platforms that aren't live for manual either. Keep all platforms available for the manual tools — just make the capability honest at a glance.

**This is the single most important change in this doc. Do not skip it.**

### 1.2 Coming-soon page copy over-claims
**Problem:** The coming-soon subhead reads "AI-powered listing optimisation for Etsy, Amazon, Shopify, and more" — leading with the banned platform (Etsy) and an unbuilt one (Amazon).

**Change:** Reorder to lead with what's real: Shopify and eBay first. Keep "and more" for the roadmap platforms. The tagline "Sell smarter on every platform" can stay as vision, but the supporting copy should not imply full support for platforms that are manual-only or banned.

### 1.3 Make the connected-store value the hero — navigation order
**Problem:** Nav order is Dashboard, Optimiser (badged "Core"), Keywords, Audit, Migrate, Bulk, History, My Shop, Settings, Admin. "My Shop" — the connected-store view that is the actual differentiator — sits 8th, below a CSV bulk tool. The "Core" badge is on the standalone Optimiser, which is the commodity feature.

**Change:** Reorder so the connected-store experience (My Shop) is at or near the top of the nav. **AGREED — proceed with the reorder.** Brad and Claude Code have confirmed this is going ahead.

**Carry-through item — the "Core" badge:** if Optimiser keeps its "Core" badge while My Shop becomes the lead nav item, the nav sends two contradictory signals (top position says "main thing," badge says "no, that's the core thing"). Resolve this as part of the reorder: either move the "Core" badge to My Shop, or drop it entirely, so the hierarchy reads consistently. Do not leave it on Optimiser while promoting My Shop above it.

### 1.4 Surface "needs attention" on the dashboard
**Problem:** The dashboard landing ("Welcome back, Brad") leads with three usage counters (optimisations used, keywords explored, audits run). These are vanity metrics — they show consumption, not what the user should act on. The most valuable signal in the whole app — the My Shop "1 needs attention, 11 could improve" breakdown — is only visible after navigating into My Shop.

**Change:** Pull the connected-store health summary onto the dashboard landing. A new user should immediately see "Your store has 1 listing needing attention and 11 that could improve → start here," not a count of credits used. This turns the dashboard from a usage readout into an action driver and reinforces the audit-led positioning.

### 1.5 My Shop layout — make the hero screen actually do its job
**Problem:** My Shop is the strategically most important screen (the connected-store unified view), but its current layout undersells it. It's a flat vertical list of products in store order, each row identical regardless of health, with the "1 needs attention / 11 could improve / 5 looking good" summary as a thin static line at the top. The job of this screen is "show me what's wrong and let me fix it fast" — a flat list in store-order makes the user hunt for problems instead of surfacing them.

**Why it matters:** This screen IS the activation moment the whole positioning rests on — a seller connects their store and should be looking at their single worst listing within one second. The current layout makes them scroll past fine listings to find the broken one. This is the highest-value layout change in the product; the other tool screens do NOT need layout changes (see "What NOT to do").

**Changes (two core, one optional):**
1. **Default sort/grouping by problem severity.** "Needs attention" items at the top, then "could improve," then "looking good" de-emphasised or collapsed at the bottom. The user should never scroll past good listings to reach a broken one.
2. **Make the summary bar an interactive filter.** The three counts (needs attention / could improve / looking good) should be clickable — tapping "1 needs attention" instantly filters the list to just those items. This turns the summary from a static readout into the control surface.
3. **(Optional) Bulk action.** A "optimise everything that needs attention" action would be powerful, but is a nice-to-have on top of 1 and 2, not a blocker.

**Scope guard:** This layout rethink applies to My Shop ONLY. Do not apply severity-sorting or filter-bars to the other screens — the input→output two-column pattern on Optimiser/Audit/Keywords/Migrate is correct and should be left alone.

### 1.6 Store / platform clarity — make every store's platform visible, and verify context carries — COMPLETE

**Core fix — done (2026-05-22):** Each store tab in the My Shop switcher now shows the store name with the platform label (Shopify/eBay) as a subtitle. The active shop header bar also surfaces the platform inline: "Connected · Shopify · store-url". Platform identity is now visible everywhere a store is referenced.

**Multi-store overflow — verified, no change needed:** The tab strip uses `overflow-x-auto` so 4+ stores scroll horizontally rather than break. Acceptable for now; revisit post-launch if users connect enough stores that horizontal scroll becomes friction.

**Platform context carrying — verified, gap confirmed, fixed (2026-05-22):** Standalone tools were not syncing with My Shop's active store — an eBay user navigating to Keywords would land on Shopify. Fixed via `sessionStorage`: My Shop writes the active store's platform on every shop switch; Optimiser, Keywords, Audit, Bulk, and Migrate all read it on mount and pre-select the matching tab. URL params in Optimiser still take precedence. First-visit fallback remains Shopify.

---

## Priority 2 — Consistency & polish

### 2.1 Default platform tab — VERIFY FIRST
**Claim:** Optimiser defaults to Shopify (correct), but Audit and Keywords appear to default to Etsy.
**Verify:** Check the actual default-selected tab on load for each tool (Optimiser, Audit, Keywords, Bulk, Migrate). The reviewer may have been seeing a manually-clicked Etsy state in the screenshots, not the default.
**Change (only if confirmed inconsistent):** Make every tool default to **Shopify** on load, since Shopify is the primary platform. Do NOT change the per-platform helper text — that text is dynamic and correctly reflects the selected tab (this was confirmed working as intended; the Etsy-specific copy only appears because Etsy was selected).

### 2.2 Referral mechanic — DECISION NEEDED
**Problem:** Settings contains an "Invite a friend, earn a week free" referral block with a referral link and reward tracking. But the product brief explicitly states referrals are "not a core growth strategy" and that there's no viral loop. The UI and the strategy contradict each other.
**Change:** Pick a lane. Either (a) commit to referrals as a growth lever — in which case make it more visible and trigger it post-activation, not buried in Settings — or (b) treat it as out of scope and remove/hide it to reduce clutter. Surface this to Brad; it's a strategy call, not a styling one.

### 2.3 Live-demo image path
**Note (not a code change, a heads-up for Brad):** My Shop currently shows mostly gradient placeholder thumbnails because it's pointed at a test store. When demoing to a real seller, confirm the connected store pulls their *real* product images — the placeholder look would badly undersell the screen in a sales conversation. If real images aren't loading from a connected store, that IS a bug to fix.

---

## Priority 3 — Structural (worth considering, not urgent)

### 3.1 Too many doors into the same room — DEFERRED (decision made)
**Observation:** Optimiser, My Shop, Bulk, and Migrate are all entry points to essentially the same AI engine, plus Audit and Keywords as adjacent tools. The original suggestion was to group the nav into a "My Store" section and a "Tools" section to make the workflow legible.

**Decision (made — do not action now):** Brad and Claude Code have agreed the nav *reorder* (1.3) proceeds, but the *grouping* into sections is **not required at this time** and is deferred. Rationale: with My Shop promoted to the top (1.3), a flat list of ~six items reads fine, and grouping would add structural complexity to solve a problem the reorder largely dissolves. Grouping earns its keep only once a flat list is long enough to confuse, or once real usage shows users fumbling between screens — neither is established yet, and it's easy to add later. Revisit only if post-launch usage shows navigation confusion.

---

## What NOT to do
- Do not remove platforms from the manual tools — manual formatting for all platforms is a real, valid feature. Only make the capability distinction visible (1.1).
- Do not change the dynamic per-platform helper text — it works correctly.
- Do not reintroduce competitor analysis / scraping.
- Do not "reskin" or restyle screens that aren't named here. The visual design (dark theme, orange accent, spacing) was assessed as clean and professional — leave it alone. These changes are about information hierarchy, defaults, and honesty, not aesthetics.

## Scope of this review (what was and wasn't covered)
This audit is based on **logged-in desktop screenshots in a populated, happy-path state**. The findings above are reliable for that scope. The following were **NOT** part of this review and should not be assumed approved — they're flagged for a later pass, not silently endorsed:
- **Mobile / responsive layouts** (Brad reports these are already good; to be audited separately later)
- **Result states** — optimiser output, populated audit score + breakdown, keyword result lists (only empty "fill this in" states were seen)
- **Error states** — failed AI call, failed store connect, malformed CSV upload
- **First-run / empty states** — what a brand-new user sees before connecting a store or running anything
- **Cross-screen flows** — signup → onboarding → connect store → first result (destinations were seen, not the journey)
- **Push-back-to-store interaction** — the confirm/success/revert flow for pushing optimised content to Shopify/eBay (the Studio-tier differentiator)

Treat absence from this doc as "not reviewed," not "fine."

## Reporting back
After acting, report to Brad: which items you implemented, which you skipped and why, and any DECISION NEEDED items awaiting his call. Do not silently rewrite the product brief or other source-of-truth docs as part of this — UI changes only.
