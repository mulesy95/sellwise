# SellWise Product Bibles Audit

**Date:** 2026-06-14  
**Method:** Each book/framework interrogated against SellWise's current state. Todos extracted per source, then consolidated into a prioritised master list at the end.

**SellWise current state at time of audit:**
- AI listing optimiser (9 platforms), keyword research, listing audit, My Shop (Shopify + eBay connect), bulk optimiser, migration tool, history + feedback, score breakdown + improve flow, brand voice, dashboard widgets (streaks, badges, shop health, milestones)
- Free: 1 optimisation/month · Starter $19 · Growth $29 · Studio $79
- Not launched. Coming soon page live. Full landing page built.

---

## 1. Don't Make Me Think — Steve Krug

**Core thesis:** Good design is self-evident. Users don't read — they scan. Every question mark in a user's head is friction that erodes confidence and increases drop-off.

**Interrogation:**

*Landing page:* Does the value prop land in under 5 seconds? "Sell smarter on every platform" is a tagline, not a value proposition. A first-time seller landing from Google needs to know immediately what SellWise does and why it matters to them. The before/after Etsy section (just added) helps. But the hero section needs to pass the 5-second test independently.

*Onboarding:* The 3-step flow (platform → brand voice → demo) is conceptually clear but untested. Step 2 (brand voice) asks sellers to describe their writing style — which many won't know how to answer. This is a question mark in the user's head.

*Optimiser form:* "Existing content / improve mode" is a field label that requires explanation. "Product description" is ambiguous on Shopify (is it the meta description or the body?). "Category, style, material" sounds like three fields merged into one.

*Result panel:* The score is a number with deductions now visible — good. But what does 78 mean? Is that good? Is 60 the target? Users calibrate against an anchor they don't have yet.

*Navigation:* "My Shop" / "Optimise" / "Keywords" / "Audit" — do sellers know the difference between optimise and audit on first visit? Probably not.

*Mobile:* SellWise is a tool for time-poor sellers. Many will use it on iPhone between tasks. Has any mobile walk-through been done?

**Todos:**
- [ ] 5-second test: show landing page hero to 5 strangers for 5 seconds — ask what SellWise does. If they can't say it, rewrite the hero.
- [ ] Add score anchor text: "Scores below 60 need work. Above 80 is competitive." Next to or below the score badge.
- [ ] Rename "Existing content / improve mode" → "Paste your current listing (optional)" or similar plain language.
- [ ] Clarify Shopify form: separate "product body description" from "SEO meta description" in the form labels if needed.
- [ ] Add nav tooltips or descriptions: on first visit, show brief subtitles under nav items explaining what each tool does.
- [ ] Complete a mobile walk-through: sign up → onboard → first optimisation → see result, on iPhone. Fix everything that requires pinching, squinting, or mis-tapping.
- [ ] Audit all error messages: "Failed to generate keywords" → "We couldn't generate keywords right now — please try again." Every error should tell the user what to do next.
- [ ] Onboarding step 2 (brand voice): add examples. "E.g. warm and conversational, or professional and direct." Reduce the blank-page problem.

---

## 2. Thinking, Fast and Slow — Daniel Kahneman

**Core thesis:** Humans have two thinking systems. System 1 is fast, automatic, emotional, and makes most decisions. System 2 is slow, deliberate, and effortful. Good product design works with System 1 first.

**Interrogation:**

*Score badge:* The animated count-up hitting a number is a System 1 hit. Red = bad, green = good registers instantly. This is already working well.

*Deductions list:* "−8 Banned words used: 'beautiful'" is System 1 readable. Red number, plain language consequence. Good.

*Pricing:* Loss aversion means losses hurt ~2x more than equivalent gains. "Upgrade to get unlimited" is gain framing. "You're running out — keep going" is loss framing. Loss framing converts better. Check all upgrade touchpoints.

*Upgrade modal:* "You've used all X optimisations this month" is neutral. "You'll lose momentum if you stop now" or "Don't let your listings fall behind" is loss-framed and stronger.

*Anchoring:* The Agency tier at $249/mo anchors the perception of Studio ($79) as reasonable. This is already in the pricing page as a 5-card grid. But does Agency appear visually first (left) or is it buried? It should anchor left.

*Peak-end rule:* People remember experiences by their peak moment and their final moment — not the average. What is the peak moment in a SellWise session? Currently: the score animation hitting a high number + BigLiftToast if 30+ pt delta. The end moment: the "What next?" strip. These need to be excellent.

*Cognitive ease:* Things that are easier to process feel more true and more positive. Complex dashboards create cognitive load. The current dashboard has usage bar, greeting, quick actions, My Shop widget, streak widget, milestone widget, activity stat, 7-day trial banner. That's a lot. Which of these are genuinely useful vs noise?

*WYSIATI (What You See Is All There Is):* Sellers judge SellWise by what they can see in the first session. If the first optimisation result looks mediocre, they'll assume the tool is mediocre — they won't know the prompt could be better with more context.

**Todos:**
- [ ] Audit all upgrade/limit messaging for loss framing. Rewrite to lead with what the seller loses by stopping, not what they gain by upgrading.
- [ ] Trial expiry email: use loss framing. "Your trial ends tomorrow — your store connection and saved keyword lists will be locked."
- [ ] Check Agency tier position on pricing page: it should be leftmost to anchor high first.
- [ ] Dashboard clutter audit: rank each dashboard widget by "would a seller miss this if it was gone?" Remove anything that scores low. Less is more — cognitive ease.
- [ ] Engineer the peak moment: on a high score (85+), the experience should feel genuinely celebratory. Is BigLiftToast enough? Is there a sound? A more pronounced animation? (Revisit with game design lens.)
- [ ] End moment: the "What next?" strip is the last thing a seller sees after optimising. Make sure it has clear direction, not generic options.
- [ ] First optimisation quality: prompt sellers to give more context before submitting. "The more you add, the better the output." Reduce WYSIATI risk.

---

## 3. Ogilvy on Advertising — David Ogilvy

**Core thesis:** Research first. Headlines are 80% of the work. Specific facts beat vague claims. The consumer is not stupid — don't treat them that way. Every ad should do a job.

**Interrogation:**

*Headlines:* "Sell smarter on every platform" is smooth but vague. Ogilvy would hate it. He'd want something specific: "Write Etsy listings that rank — in 30 seconds." Or: "Your Shopify meta title is probably wrong. Here's the fix." The best headline names the reader, their problem, and the mechanism.

*Specificity:* SellWise's landing page (from memory) makes soft claims. Ogilvy demanded numbers: not "saves time" but "saves 2 hours per listing." Not "better rankings" but "13 tags instead of your current 5." SellWise already generates before/after comparisons — those numbers exist in the result. Use them.

*AI output quality:* Ogilvy cared deeply about the work itself. The copy SellWise generates is the product. If it reads like AI, it's failing. The WRITING_RULES hardening is directionally right, but the quality bar should be Ogilvy-level: specific, benefit-led, no weasel words, credible claims only.

*Testimonials:* Ogilvy trusted the voice of the customer above everything. SellWise has zero testimonials because it hasn't launched. This needs to be addressed in the first month. One specific testimonial with a number ("My Etsy views went up 40% in 3 weeks — Sarah, jewelry seller, Melbourne") beats any headline we can write.

*CTAs:* Ogilvy was a direct response man. Every ad asked for something specific. "Get started" is weak. "See your score free" is specific. "Optimise your first listing free" is specific and value-first.

*Emails:* Subject lines are headlines. "Your weekly SellWise update" is terrible. "3 of your listings have scores under 60" is Ogilvy — specific, personal, actionable.

**Todos:**
- [ ] Rewrite landing page headline: test 3 specific alternatives against the current tagline. Lead with reader identity + specific problem + mechanism. Aim for "Your [platform] listings aren't ranking because of X. SellWise fixes it in Y."
- [ ] Replace all vague claims with specific numbers. Audit landing page and pricing page for "better", "smarter", "faster" — replace with actual figures from real outputs.
- [ ] Collect 5 testimonials in the first 30 days post-launch. Ask specifically for: before metric, after metric, time frame. One line of copy is worth more than a paragraph of our own.
- [ ] Audit all email subject lines. Every subject line should be a Ogilvy headline — specific, personal, benefit-led.
- [ ] AI output quality audit: run 10 real products through the optimiser, across 3 platforms. Score the output by Ogilvy's standard: is every claim specific? Is any word vague or hollow? Fix the prompts that produce generic output.
- [ ] Rewrite primary CTA from "Get started" (if that's current) to something specific and value-first.

---

## 4. Inspired — Marty Cagan

**Core thesis:** Great products come from teams that discover before they build. The four risks — value, usability, feasibility, viability — must all be addressed. Output (features shipped) is not outcome (behaviour changed). Continuous discovery keeps you honest.

**Interrogation:**

*Current risk profile:* 
- Value risk: HIGH. SellWise hasn't launched. We don't know yet if sellers will pay $29/mo for this. The tool works, but "works" and "pays" are different questions.
- Usability risk: MEDIUM. Untested with real sellers at scale. The 3 resets done (Tymika, Brad) are not a substitute for unbiased user testing.
- Feasibility risk: LOW. Stack is proven, AI is working, integrations are built.
- Viability risk: LOW-MEDIUM. Unit economics look fine at current Claude API costs. Stripe is live.

*Outcome vs output:* The sprint A-F series shipped a lot. But what's the outcome we're measuring? Are sellers scoring higher on second optimisations than first? Are they returning the next week? Are they connecting stores after seeing the tool? These outcomes aren't being actively tracked yet.

*Product vision:* "SellWise is the AI co-pilot for online sellers — wherever they sell." That's directionally right. But a compelling product vision is something the team rallies around for 3–5 years. Is this it? It needs to be specific enough to make hard decisions against.

*Discovery:* Brad hasn't done formal user interviews yet. The Tymika reset suggests a real user is being recruited for testing — this is the right instinct. But 1 tester is not discovery.

**Todos:**
- [ ] Define the one metric that matters most right now (OMTM). Suggestion: "% of new users who complete a second optimisation within 7 days." This captures both acquisition and value delivery.
- [ ] Run 5 seller interviews before launch using The Mom Test format (see book 9). Focus on: how they currently write listings, what's painful, what they've tried.
- [ ] Define a 3-year product vision statement specific enough to make roadmap decisions against. "AI co-pilot for online sellers" is the direction — make it more vivid and specific.
- [ ] For each item on the backlog, explicitly state which of the 4 risks is highest. Don't build without knowing which risk you're retiring.
- [ ] Set up basic outcome tracking: second-optimisation rate, 7-day return rate, trial→paid conversion. PostHog is installed — use it.
- [ ] Run a 5-person unmoderated usability test before launch. Task: "You sell jewellery on Etsy. Use SellWise to optimise this listing." Record and watch.

---

## 5. Breakthrough Advertising — Eugene Schwartz

**Core thesis:** Five levels of market awareness. Copy must meet the prospect at their exact awareness level — not higher, not lower. You can't create desire; you can only channel it.

**The five levels:**
1. Unaware — doesn't know they have a problem
2. Problem-aware — knows their listings underperform, doesn't know why
3. Solution-aware — knows AI tools exist for this, hasn't found SellWise
4. Product-aware — has heard of SellWise, hasn't bought
5. Most aware — knows SellWise, just needs the right offer

**Interrogation:**

*Who is landing on sellwise.au?*
- Organic search: "how to improve Etsy listings" → Problem-aware
- Organic search: "AI Etsy listing tool" → Solution-aware
- Referral from seller community: → Solution or Product-aware
- Retargeting: → Product-aware

*Current landing page:* Reads like it's written for solution-aware and product-aware visitors — it assumes the visitor knows AI tools for listings are a thing. The hero doesn't name the problem first.

*The mechanism:* SellWise's unique mechanism is "platform-specific AI that applies each algorithm's ranking rules to every word it writes." This should be named and repeated. Not "AI" generically, but "the only tool that knows Etsy's 13-tag rule, eBay's 80-character title limit, and Shopify's meta format — and writes to all of them."

*Separate audiences:* A Shopify seller and an Etsy seller have completely different problems and different awareness levels. The landing page currently tries to serve both from the same hero.

**Todos:**
- [ ] Map the traffic sources before launch: where will visitors come from? Assign an awareness level to each source.
- [ ] Rewrite hero section for problem-aware visitors: lead with the problem ("Your listings aren't ranking. Here's why — and how to fix it in 30 seconds."), then introduce the mechanism, then the product.
- [ ] Write a mechanism statement and use it consistently: "SellWise is the only tool that applies each platform's specific ranking algorithm to every word it writes."
- [ ] Add platform-specific landing pages or sections for Shopify and eBay (the two live integrations). Each speaks to a different awareness level and pain point.
- [ ] Pricing page: visitors here are product-aware or most-aware. Don't re-sell the category — just show the offer clearly with the right tier highlighted.
- [ ] Future paid ads: write problem-aware copy for cold audiences (Meta/TikTok), solution-aware copy for search (Google), product-aware copy for retargeting.

---

## 6. Influence — Robert Cialdini

**The six principles:** Reciprocity, Commitment & Consistency, Social Proof, Authority, Liking, Scarcity.

**Interrogation:**

*Reciprocity:* The /check free health check gives value before asking for anything. The free optimisation tier gives one result. Both are strong reciprocity plays. But: is the free value actually surprising and valuable? Or expected?

*Social proof:* Zero user count, zero testimonials, zero case studies at launch. This is the biggest gap. "Join X sellers" is empty if X is 0. We need to manufacture legitimate social proof from early users.

*Authority:* Nothing on the site currently signals that SellWise knows what it's talking about. No "built by someone who's studied Etsy's algorithm" type claim. No data, no methodology visible to users.

*Commitment & Consistency:* Once a seller connects their Shopify store, they're invested. Once they save keyword lists, they're invested. Once they've done 5 optimisations, they've self-identified as a SellWise user. The onboarding milestone (connecting store, adding brand voice) is a commitment device.

*Scarcity:* Trial countdown is the main scarcity lever. 7 days. Is this visible enough in the dashboard? Is there a day-3 email and a day-6 email?

*Liking:* Does SellWise's brand voice feel like someone you'd want to take advice from? It should feel like a knowledgeable seller friend, not a corporate tool.

**Todos:**
- [ ] Pre-launch: recruit 10 sellers as beta users. Get testimonials. Even "I tried it on 3 Etsy listings and the score went from 48 to 82 — the keyword coverage was eye-opening" is gold.
- [ ] Add a user/optimisation count to the landing page once real numbers exist. "X sellers have optimised Y listings with SellWise."
- [ ] Authority signal: add a short credibility statement — the research behind the scoring, the platform rules baked into the prompts, specific algorithm knowledge.
- [ ] Trial countdown: show days remaining prominently in the dashboard. Day 3 reminder email. Day 6 urgency email (loss framing from Kahneman).
- [ ] Commitment milestones: celebrate when users connect their first store, save their first keyword list, hit 5 optimisations. Each milestone deepens commitment and makes leaving feel like a loss.
- [ ] Brand voice audit: read 5 in-app messages out loud. Do they sound like a knowledgeable, warm seller friend? Or a startup trying to sound smart?

---

## 7. Building a StoryBrand — Donald Miller

**Framework:** Hero has a problem → meets a guide → guide gives a plan → hero takes action → success or failure.

**The three levels of problem:**
- External: listings don't rank, losing sales
- Internal: feeling like a bad writer, not knowing why it's not working
- Philosophical: sellers deserve to succeed without a marketing degree

**Interrogation:**

*Current landing page:* Leads with the product, not the hero's problem. SellWise is positioned as the subject of the story, not the guide. The hero (the seller) is not named or acknowledged first.

*Internal problem:* This is the most powerful. Sellers don't just have a traffic problem — they feel inadequate as copywriters. The relief of "the tool knows what to write" is partly functional (better listings) and partly emotional (I don't have to figure this out alone). The current copy doesn't address this emotional layer.

*The plan:* Miller says guides give a 3-step plan to remove confusion. "Here's how SellWise works: 1) Paste your product. 2) Get an AI-optimised listing in 30 seconds. 3) Push it live." Simple, clear, removes friction from the decision.

*Direct CTA vs transitional CTA:* Direct = "Start free trial". Transitional = "Check your listing score free" (no commitment, just value). Both should exist on the landing page. Transitional CTA converts cold traffic; direct CTA converts warm traffic.

*Failure stakes:* The cost of NOT using SellWise should be stated. "Every week with underoptimised listings is a week of sales going to competitors who've done the work."

**Todos:**
- [ ] Rewrite landing page hero: lead with the seller's problem and internal feeling, not the product features. "You're spending hours writing listings that don't rank. It's not your writing — it's the algorithm."
- [ ] Add a simple 3-step plan to the landing page: Paste → Optimise → Publish. Remove every other word of explanation.
- [ ] Add a transitional CTA alongside the main "Start free trial": "Check your first listing free — no card required."
- [ ] Add failure stakes section: specific cost of leaving listings unoptimised (views lost, sales missed, competitors winning).
- [ ] Add success vision: what does winning look like? "More views, more sales, more time back. Without hiring a copywriter."
- [ ] Audit in-app copy for SellWise-as-hero language. Change "SellWise generates your optimised listing" → "Here's your optimised listing" (seller is the hero receiving the result).

---

## 8. Obviously Awesome — April Dunford

**Framework:** Positioning has 5 components — competitive alternatives, unique attributes, value, target customers, market category.

**Interrogation:**

*Competitive alternatives:* What do sellers use today if SellWise doesn't exist?
- Etsy sellers: Erank, Marmalead, ChatGPT raw, do it manually
- Amazon sellers: Helium 10, Jungle Scout, ChatGPT raw
- Shopify sellers: nothing purpose-built — they just write copy themselves or hire someone
- eBay sellers: nothing purpose-built at all

*Unique attributes:* Platform-specific rules baked into the AI. All platforms in one tool. Store connect + push-back (Studio). Scoring against platform criteria. Brand voice injection.

*Value (from attributes):* Rankings improve because the output follows each platform's specific algorithm. Time saved because it's instant and structured. Confidence because the score tells you if it's actually good.

*Target customer:* Multi-platform sellers, or sellers who want to expand beyond one platform. Shopify + eBay sellers who don't have any AI tool yet. eBay sellers specifically — first-mover.

*Market category:* "AI listing writer" vs "listing optimiser" vs "SEO tool for sellers". "SEO tool" is too generic. "AI listing writer" undersells the optimisation/scoring angle. "Listing optimiser" is probably best — it implies both the writing and the measurement.

*Current positioning gap:* The landing page doesn't explicitly name who SellWise is for. "Online sellers" is too broad. The best positioning narrows to a specific user who immediately thinks "that's me."

**Todos:**
- [ ] Write a positioning statement: "[SellWise] is the [listing optimiser] for [multi-platform sellers] who want [better rankings without the guesswork], unlike [ChatGPT or single-platform tools] because [it knows each platform's specific algorithm rules]."
- [ ] Add "Not for everyone" copy to pricing or landing: this forces positioning. "SellWise is built for active sellers on Shopify, eBay, Etsy, and Amazon — not for one-product stores who optimise once and forget."
- [ ] Add a competitor comparison table to the pricing page: vs Erank (Etsy only, no AI), vs Helium 10 (Amazon only, $99+), vs ChatGPT (no platform rules, no scoring). This is honest and converts well with product-aware visitors.
- [ ] Lead with eBay specifically in one channel: no competing AI tool for eBay sellers is a genuine first-mover positioning. Own this lane.
- [ ] Decide on and lock in market category: "listing optimiser" — use this consistently in all copy, meta descriptions, and PR.

---

## 9. The Mom Test — Rob Fitzpatrick

**Core thesis:** Customers will lie to you politely. Ask about their life, not your idea. Good customer research uncovers real problems, actual behaviour, and what people currently use — not what they say they'd use.

**Interrogation:**

*What SellWise needs to know before launch:*
- Do sellers actually feel the pain of writing listings, or do they just say they do?
- What do they currently use? How often? Do they pay for it?
- When was the last time they spent significant time on a listing? What was the context?
- What would make them stop using SellWise after trying it?

*Bad questions to avoid:*
- "Would you use a tool that optimises your listings?" (too hypothetical)
- "What do you think of SellWise?" (too complimentary-prone)
- "Would you pay $29/month for this?" (people say yes to be polite)

*Good questions to ask:*
- "Walk me through the last listing you wrote. How long did it take?"
- "What did you do to try to rank it better?"
- "Have you ever paid for any seller tools? Which ones? Still using them?"
- "What's the most painful part of selling on [platform] for you?"

**Todos:**
- [ ] Before launch: conduct 5 Mom Test interviews with real sellers (Etsy, Shopify, eBay mix). Record and transcribe. Share findings.
- [ ] Create a 10-question interview script using Mom Test principles. No leading questions.
- [ ] After launch: set up a 30-day post-signup interview sequence. "Can I get 20 minutes with you?" Email to first 20 signups.
- [ ] Track what sellers actually do, not what they say they'll do. PostHog funnel: landing → signup → first optimisation → second optimisation → upgrade. The numbers tell the real story.

---

## 10. Continuous Discovery Habits — Teresa Torres

**Core thesis:** Product discovery isn't a phase — it's a weekly habit. Opportunity solution trees connect user outcomes to product solutions. Interview at least one customer per week.

**Interrogation:**

*Current state:* No formal discovery process. Features are built from intuition, game design principles, and competitive research — all valid, but not grounded in continuous user feedback.

*Opportunity solution tree for SellWise:*
- Desired outcome: "More sellers return to SellWise in week 2 than week 1"
- Opportunities: listings score too low on first try (trust lost) / unclear what to do after optimising / don't remember to come back / connected store but never used it
- Solutions: score breakdown + improve flow (just shipped) / stronger "What next?" / weekly digest (shipped) / shop health widget (shipped)

*What's not answered yet:* Why do trial users who complete one optimisation NOT convert to paid? This is the critical question.

**Todos:**
- [ ] After launch: commit to 1 seller conversation per week. 20 minutes. Record it.
- [ ] Build an opportunity solution tree around the primary outcome metric (second optimisation rate).
- [ ] Set up an exit survey for trial users who don't convert. "What would have made you upgrade?" One question. Massive signal.
- [ ] Review PostHog data weekly: where do users drop off? What features do paying users use that free users don't?

---

## 11. The Design of Everyday Things — Don Norman

**Core thesis:** Good design makes the right action obvious and errors impossible. Affordances, signifiers, feedback, mapping, and conceptual models determine whether users understand what to do.

**Interrogation:**

*Affordances:* Does every interactive element look interactive? Are buttons obviously buttons? Are links obviously links?

*Signifiers:* Do form fields tell you what to put in them? Does the character counter on the title field tell you what the limit means?

*Feedback:* Does every action have immediate visible response? Clicking "Optimise" shows a spinner — good. Does saving a keyword list confirm visually? Does copying a result field confirm?

*Conceptual model:* Does a new user understand the mental model of SellWise? Input → AI → score + result → improve or copy/publish. Is this communicated anywhere before they use it?

*Error prevention:* Can users submit the optimiser with no product name? Can they exceed platform character limits by pasting into fields?

**Todos:**
- [ ] Add character counters to all constrained output fields (Etsy title: 140, eBay title: 80, Shopify meta title: 60, meta description: 160). Show remaining chars, colour-code when over.
- [ ] Add a brief "how it works" step to the optimiser form — 3 icons or a one-liner. Sets the conceptual model before submission.
- [ ] Audit copy buttons: do they visually confirm after clicking? (Check mark animation exists — verify it's consistent across all fields.)
- [ ] Prevent submission with empty product name: already likely gated but verify.
- [ ] Test every form field with a real user who's never seen SellWise. Do they know what to type?

---

## 12. Nudge — Thaler & Sunstein

**Core thesis:** Defaults are decisions. Choice architecture shapes behaviour without removing freedom. The easiest path is the path most taken.

**Interrogation:**

*Platform default:* Currently defaults to Shopify across all tools. But if a user's onboarding platforms are set, the tool should default to their primary platform — not a generic one.

*Save results:* History is fire-and-forget (every optimisation is saved). This is the right default — opt-out is better than opt-in for history.

*Brand voice:* If auto-derived brand voice exists (Sprint F), should it be applied automatically or should users have to opt in? Auto-apply is the stronger nudge — but it needs to be communicated.

*Keyword pre-fill:* If the user last used a keyword list on Shopify, should it pre-populate on next visit? Saves a step, nudges toward richer inputs.

*Upgrade path:* When a user hits their limit, what's the default next action? Is the upgrade button the obvious path, or is it buried?

**Todos:**
- [ ] Use onboarding platform selection to set default platform across all tools (already partially done via sessionStorage — but should it be persisted to profile and loaded on login?).
- [ ] Add "last used" keyword list pre-population: if a user has a saved list for the current platform, offer to pre-fill it on optimiser load.
- [ ] Upgrade path audit: when a user hits their limit, count the number of clicks to complete an upgrade. Should be 1-2 clicks maximum.
- [ ] Auto-apply brand voice: if auto-derived voice exists but no manual voice is set, apply it silently. Add a subtle "Using your brand voice" indicator rather than asking for permission.
- [ ] Default improve mode: if a user clicks "Improve this listing" after a low score, the existingContent field is pre-filled (just shipped). Good — this is a nudge toward richer inputs.

---

## 13. Predictably Irrational — Dan Ariely

**Core thesis:** Humans make consistently irrational decisions. The lure of free, anchoring, social norms vs market norms, and self-herding are all predictable and exploitable by good design.

**Interrogation:**

*Free tier:* 1 optimisation/month is a legitimate free tier. But is it enough to get value, and not enough to stay free? One optimisation shows what the tool does. If the result is good, the desire to do more is immediate. This seems calibrated correctly.

*Anchoring:* The order on the pricing page matters. Agency ($249) → Studio ($79) → Growth ($29) → Starter ($19) → Free makes $79 look like a bargain. Is this the current order?

*Self-herding:* Once a user has done 3 optimisations, they've established a pattern of behaviour. They'll expect to do more. The streak widget (Sprint C) exploits this — don't break your streak.

*Social norms vs market norms:* Ariely's research shows that introducing price destroys the social norm. The free tier creates goodwill (social norm: SellWise is helping me). Once they hit the limit and see a paywall, it switches to market norm. This transition needs to feel fair, not jarring.

**Todos:**
- [ ] Verify Agency tier is positioned leftmost (or most prominent) on the pricing page to anchor high.
- [ ] Paywall transition: make hitting the limit feel respectful, not punitive. "You've done great work this month. Ready to keep going?" is better than "You've reached your limit."
- [ ] Self-herding milestone: after 3 optimisations, surface a prompt: "You've optimised 3 listings — sellers who do 5 see measurably better results." Nudges them to continue the pattern.
- [ ] Review the free tier: if a user gets 1 free optimisation and it's mediocre (bad input, wrong platform), they'll self-herd away. Consider a guided first optimisation experience.

---

## 14. Designing for Emotion — Aarron Walter

**Core thesis:** Maslow's hierarchy applied to products: functional → reliable → usable → pleasurable. You can't skip levels. Delight without function is annoying.

**Interrogation:**

*SellWise's current position:* Functional ✓ (the AI works, results are generated, scores are calculated). Reliable ✓ (error handling, rate limits, health endpoint). Usable: ⚠️ (mostly usable but untested at scale — see Krug above). Pleasurable: partially ✓ (animations, BigLiftToast, micro-notes, brand voice — all Sprint A-C work).

*The risk:* We've added a lot of delight features (sprints) before completing usability testing. If the tool isn't reliably usable, delight layers feel hollow or even condescending.

**Todos:**
- [ ] Complete usability testing (Krug tier) before adding more delight features.
- [ ] Audit the emotional arc of a first session: what does the user feel at each step? Map it out.
- [ ] Ensure every error state has a human, warm error message — not a cold system message. Errors are where emotional design matters most.

---

## 15. Hooked — Nir Eyal

**Trigger → Action → Variable Reward → Investment**

**Interrogation:**

*External triggers (Sprint E shipped):* Weekly digest email ✓. Could also include push notifications (future) or in-app prompts tied to events ("You haven't optimised a listing in 7 days").

*Actions:* The core action (optimise a listing) requires high effort — you need product info, possibly an image. This is a friction point. Lower-effort actions (check score on /check, research keywords) could be the gateway to the main action.

*Variable rewards:* BigLiftToast ✓. HIGH_SCORE_NOTES ✓. Score animation ✓. Peer comparison badge ✓. The keyword power level badge is a variable reward. These are all working.

*Investment:* Store connect ✓. Brand voice ✓. Keyword lists ✓. History ✓. Badges + streak ✓. The more a user invests, the stickier SellWise becomes.

*Internal trigger:* What emotion or situation triggers a seller to open SellWise without an external prompt? "I just listed a new product" or "My views are down this week." SellWise needs to be associated with these moments.

**Todos:**
- [ ] Map the internal trigger: interview sellers about when they think about optimising. Design notifications and email timing around those moments.
- [ ] Lower the action barrier: /check is a zero-friction action (just a URL). Make this the top-of-funnel entry point more aggressively.
- [ ] "New listing" trigger: can SellWise detect when a connected Shopify store adds a new product and prompt optimisation? (Growth/Studio feature, requires webhook or polling.)
- [ ] Investment milestones: surface investment accumulation to the user — "You have 3 saved keyword lists, 12 optimisations in your history, and your brand voice is set. SellWise is getting smarter about your store."

---

## 16. Atomic Habits — James Clear

**Make it obvious · Make it attractive · Make it easy · Make it satisfying**

**Interrogation:**

*Obvious:* Weekly digest email shows what needs attention — good. But is SellWise top-of-mind when a seller is actually listing a product? The habit needs a trigger tied to the listing creation moment.

*Attractive:* Score animation, BigLiftToast, streaks, badges — all making it attractive to return. The "top 5% this week" peer badge is an attractive reward.

*Easy:* The optimiser form requires meaningful input. This is unavoidable for quality output. But re-optimising from history (one click) is easy. Keyword picker pre-population is easy. These reduce friction for repeat use.

*Satisfying:* Streak widget ✓. Score count-up ✓. Push to store (immediate satisfaction of seeing it live) ✓.

*Identity:* Clear's key insight — habits built on identity ("I'm the kind of seller who keeps their listings optimised") are more durable than those built on outcomes.

**Todos:**
- [ ] Identity language: after 5 optimisations, surface: "You're in the top tier of sellers who keep their listings optimised." Reinforce the identity, not just the action.
- [ ] Habit stacking prompt: "When you add a new product to your store, optimise it in SellWise before publishing." Say this explicitly in onboarding and in the weekly digest.
- [ ] Re-optimise from history: verify this is one click. It should be the easiest action in the entire app.
- [ ] "Satisfying" audit: what happens immediately after pushing an optimisation to Shopify/eBay? Is there a satisfying confirmation moment? Should be.

---

## 17. Traction — Gabriel Weinberg & Justin Mares

**The Bullseye framework: test many channels, double down on the one or two that work.**

**The 19 traction channels include:** SEO, content marketing, social ads, search ads, community building, PR, existing platforms, viral marketing, email, affiliate, partnerships, trade shows, unconventional PR, etc.

**Interrogation:**

*Most promising channels for SellWise at launch:*

1. **SEO / content:** "how to write [platform] product descriptions" and "best [platform] listing tools" are high-intent searches. SellWise could own educational content (Etsy title tips, eBay listing guide, Shopify SEO guide) while ranking for tool-comparison searches.

2. **Existing platforms (communities):** Reddit (r/EtsySellers, r/shopify, r/Flipping), Facebook Groups (eBay sellers groups, Shopify communities), Discord servers. These are pre-built audiences of the exact target user.

3. **Viral / word-of-mouth:** Shareable score cards already built. "I got 84/100 on my Etsy listing using SellWise" is shareable in seller communities. The /check URL is shareable for unsolicited feedback.

4. **PR:** "First AI tool built specifically for eBay sellers" is a genuine news angle. eBay has millions of sellers and no competing tool.

5. **Email:** Weekly digest is a retention channel, not acquisition. But referral from digest ("Share with a seller friend") is acquisition.

**Todos:**
- [ ] Before launch: pick 2-3 channels to test. Don't spread across all 19. Suggestion: content SEO + seller communities + shareable score cards.
- [ ] Write 5 SEO content articles targeting high-intent searches: "how to write an Etsy title that ranks", "eBay listing tips 2026", "Shopify product description SEO guide." Publish pre-launch.
- [ ] Community playbook: identify 5 Facebook Groups and 2 subreddits. Engage authentically for 4 weeks before mentioning SellWise. Then a genuine "I built this" post.
- [ ] Make score cards more shareable: add a "Share your score" button to the result panel with a pre-drafted tweet/post.
- [ ] eBay PR angle: pitch to eBay seller news sites and podcasts. "First AI optimiser built specifically for eBay" is a real story.

---

## 18. Contagious — Jonah Berger

**STEPPS: Social Currency · Triggers · Emotion · Public · Practical Value · Stories**

**Interrogation:**

*Social currency:* Does using/sharing SellWise make a seller look good? Score sharing is already built but underused. "I scored 89/100 on my new Etsy listing" is a flex in seller communities.

*Triggers:* What environmental cue reminds sellers to use or talk about SellWise? "New listing" is the trigger — whenever they list, SellWise should come to mind. This is a habit design + marketing challenge.

*Emotion:* Does SellWise provoke high-arousal emotion? Surprise (the tool is much better than I expected), excitement (the score jumped 30 points), anxiety (my score is 45 — fix it). These are word-of-mouth drivers.

*Public:* Can the behaviour of using SellWise be seen by others? The score card is the main shareable asset. "Optimised by SellWise" is a potential badge for listing descriptions (controversial — worth testing).

*Practical value:* "News you can use." The weekly digest with specific listings to fix is high practical value. The score with deductions is high practical value — actionable, specific.

*Stories:* "I was spending 2 hours per listing and my views were flat. A friend sent me this link. I ran my top 10 listings through it and my views doubled in a week." That's the story. SellWise needs to collect and tell these.

**Todos:**
- [ ] Add "Share your score" prominently in the result panel. Pre-draft shareable copy. Make it one click.
- [ ] "Optimised with SellWise" social share prompt: after pushing to store, offer: "Share that you just optimised this listing." Opt-in, not forced.
- [ ] Collect origin stories from early users. One good story on the landing page is worth 10 feature bullets.
- [ ] Referral mechanic: "Give a seller friend 7 days free" — referrer gets extra optimisations. Simple, practical value for both parties.

---

## Master To-Do List — Prioritised

### Tier 1: Pre-launch blockers (must happen before launch)

- [ ] **5-second test:** Show hero section to 5 strangers. If they can't say what SellWise does, rewrite the hero.
- [ ] **5 Mom Test interviews:** Talk to 5 real sellers before launch. Use the Mom Test format — ask about their life, not your idea.
- [ ] **Unmoderated usability test:** 5 users, task: "Optimise this listing." Watch every hesitation.
- [ ] **Landing page rewrite:** Hero → seller's problem (not product). Add 3-step plan. Add transitional CTA. Add failure stakes. Lead with pain, introduce mechanism, show result.
- [ ] **Specificity audit:** Replace every vague claim ("better", "smarter") with a specific number from real output. "13 tags instead of 5" not "more tags."
- [ ] **Score anchor text:** Add explanation next to score badge: "Under 60 needs work. Over 80 is competitive."
- [ ] **AI output quality audit:** Run 10 products through 3 platforms. Rate every output by Ogilvy's standard. Fix prompts that produce generic, vague, or hollow copy.
- [ ] **Mobile walk-through:** Complete a full first-session on iPhone. Fix every friction point.
- [ ] **Error messages:** Audit all error states. Every message should tell the user what to do next — no bare technical errors.

### Tier 2: First 30 days post-launch

- [ ] **5 testimonials:** Within 30 days of launch, collect 5 testimonials with numbers. One metric, before and after, from a real seller.
- [ ] **User/optimisation count:** Add live count to landing page once real numbers exist.
- [ ] **Upgrade messaging audit:** Rewrite every limit-hit message with loss framing. "Don't lose momentum" not "Upgrade for more."
- [ ] **Trial countdown:** Make days remaining visible in the dashboard. Day 3 + Day 6 emails.
- [ ] **Primary CTA:** Change from "Get started" to something specific and value-first.
- [ ] **Email subject lines:** Rewrite all transactional and nurture emails with Ogilvy headline standards — specific, personal, actionable.
- [ ] **Pricing page order:** Verify Agency ($249) anchors left. Add competitor comparison table.
- [ ] **Positioning statement:** Write, test, and lock in the positioning statement. Use consistently across all copy.
- [ ] **Platform-specific landing sections:** Add Shopify and eBay seller specific sections or pages.
- [ ] **Character counters:** Add to all constrained output fields (Etsy title 140, eBay title 80, Shopify meta 60/160).
- [ ] **Paywall transition tone:** Make hitting the limit feel respectful — "great work this month" framing.
- [ ] **eBay PR push:** Pitch "first AI optimiser built for eBay sellers" to seller news sites and podcasts.
- [ ] **Community engagement:** Identify 5 Facebook Groups + 2 subreddits. Engage for 4 weeks authentically before any mention of SellWise.
- [ ] **SEO content:** Publish 5 educational articles targeting high-intent listing-related searches.
- [ ] **Share score button:** Add prominently to result panel with pre-drafted social copy.
- [ ] **Referral mechanic:** "Give a seller friend 7 days free" — simple, reciprocal.

### Tier 3: Ongoing / post-launch iteration

- [ ] **Weekly discovery habit:** 1 seller conversation per week after launch. 20 minutes. Record it.
- [ ] **Exit survey:** Set up one-question exit survey for trial users who don't convert.
- [ ] **OMTM:** Define and track the one metric that matters most (suggestion: second-optimisation rate within 7 days).
- [ ] **Opportunity solution tree:** Build for the primary outcome metric. Review monthly.
- [ ] **Dashboard clutter audit:** Remove any widget that doesn't earn its place. Cognitive ease is a retention feature.
- [ ] **Platform default persistence:** Persist user's primary platform to profile (not just sessionStorage) — applies correctly on every login.
- [ ] **"New listing" trigger:** Explore Shopify webhook to detect new products and prompt optimisation. (Studio feature.)
- [ ] **Investment milestone copy:** After 5 optimisations / 3 saved lists / store connected — surface the investment accumulation to the user.
- [ ] **Identity language:** After 5 optimisations, add identity reinforcement: "You're the kind of seller who keeps their listings competitive."
- [ ] **Mechanism statement:** Write and lock in: "SellWise is the only tool that applies each platform's specific ranking algorithm to every word it writes." Use this on landing, pricing, and in PR.
- [ ] **Bullseye exercise:** Formally run the Traction Bullseye — identify which 2-3 channels to test first and set success metrics.
- [ ] **3-year product vision:** Write a specific, vivid product vision statement. Use it to make roadmap decisions against.

---

## Cross-Bible Conflicts and Resolutions

**Conflict:** Game design (variable rewards, delight) vs Walter (earn delight through usability first).  
**Resolution:** Complete the usability testing sprint before adding more game mechanics.

**Conflict:** Kahneman (reduce cognitive load, simplify dashboard) vs Eyal (investment phase wants more hooks).  
**Resolution:** Investment features (store connect, brand voice, lists) are low-cognitive-load features already in place. New features must justify dashboard presence before being added.

**Conflict:** Cialdini social proof (need numbers) vs Dunford positioning (narrow target is better than broad).  
**Resolution:** Social proof should be platform-specific ("X Shopify sellers" not just "X sellers") — supports both principles simultaneously.
