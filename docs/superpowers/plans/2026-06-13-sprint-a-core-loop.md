# Sprint A — Core Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten the core optimiser loop: reframe upgrade prompts as progression not failure, rescue sellers who get a low score with lateral options, add proactive form hints so sellers know what to add before they submit, and close the extraction gap — free users should get enough value to trust the tool but not so much they have no reason to upgrade.

**Architecture:** All changes are UI-only or copy-only. No new API routes, no DB migrations. The upgrade modal gets copy reframing. The optimise client gets two new UI sections — a "rescue" panel below low-score results, and a platform-aware hint above the submit button.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4, shadcn/ui

---

## File Map

**Modify:**
- `src/components/upgrade-modal.tsx` — reframe "limit" copy to progression framing
- `src/app/dashboard/optimise/optimise-client.tsx` — rescue CTAs + input-phase hints

---

### Task 1: Upgrade modal progression reframing

**Files:**
- Modify: `src/components/upgrade-modal.tsx`

**Context:** Currently when a free user hits their monthly limit the modal says "You've used your free optimisations this month" and "Upgrade to keep going." Per the game design analysis, hitting a limit should feel like reaching the next level, not running out. The reframe: "You've outgrown this plan" + "You're ready for the next level."

The modal has `reason?: "limit" | "feature"`. The `isLimit` branch is what needs reframing. Do not change the "feature" branch.

- [ ] **Step 1: Update the heading and subtext for the limit reason**

In `src/components/upgrade-modal.tsx`, find the `<h2>` and `<p>` inside the header section. Replace:

```tsx
<h2 id="upgrade-modal-title" className="text-base font-bold">
  {isLimit
    ? "You've used your free optimisations this month"
    : "This feature is on paid plans"}
</h2>
<p className="text-sm text-muted-foreground mt-1">
  {isLimit
    ? "Upgrade to keep going — and unlock everything below."
    : "All paid plans include a 7-day free trial. No card required to start."}
</p>
```

With:

```tsx
<h2 id="upgrade-modal-title" className="text-base font-bold">
  {isLimit
    ? "You've outgrown this plan"
    : "This feature is on paid plans"}
</h2>
<p className="text-sm text-muted-foreground mt-1">
  {isLimit
    ? "You're ready for the next level. Here's what opens up:"
    : "All paid plans include a 7-day free trial. No card required to start."}
</p>
```

- [ ] **Step 2: Update the footer trial copy to match the new tone**

In the same file, find the footer `<p>` at the bottom of the modal:

```tsx
<p className="text-xs text-muted-foreground">7-day free trial. Cancel anytime.</p>
```

Replace with:

```tsx
<p className="text-xs text-muted-foreground">Start free for 7 days. No card required.</p>
```

- [ ] **Step 3: Run type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/upgrade-modal.tsx
git commit -m "feat: reframe upgrade modal limit as progression to next level"
```

---

### Task 2: Rescue stuck user CTAs on low scores

**Files:**
- Modify: `src/app/dashboard/optimise/optimise-client.tsx`

**Context:** When a seller gets a low SEO score (< 60) on their optimised result, they currently have no guidance on what to do next. Per the game design analysis (Parallelism, Lens #50), users who can't crack one puzzle should always have another to try so they don't quit. Show three lateral CTAs below the result tabs when `afterScore < 60`.

The three options are:
1. Research keywords first — link to `/dashboard/keywords?platform={platform}`
2. Audit the existing listing instead — link to `/dashboard/audit`
3. Try a different platform — scroll back up to the platform selector (a button that clears the result and focuses the platform selector)

`afterScore` is already computed from `scoreOptimisedListing` and is in scope in the render. `result` holds the optimised listing. `platform` is in state.

- [ ] **Step 1: Add the rescue panel import**

At the top of `src/app/dashboard/optimise/optimise-client.tsx`, add `Lightbulb` to the lucide-react import:

```tsx
import {
  // ... existing imports ...
  Lightbulb,
} from "lucide-react";
```

- [ ] **Step 2: Add the RescuePanel component above OptimiseClient**

Add this component just above the `export function OptimiseClient` declaration:

```tsx
function RescuePanel({ platform, onReset }: { platform: Platform; onReset: () => void }) {
  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
          Score under 60 — a few things to try
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <a
          href={`/dashboard/keywords?platform=${platform}`}
          className="flex items-start gap-2 rounded-md border border-border/60 bg-background p-3 text-xs hover:border-border hover:bg-muted/30 transition-colors"
        >
          <Search className="size-3.5 shrink-0 mt-0.5 text-muted-foreground" />
          <div>
            <p className="font-medium">Research keywords first</p>
            <p className="text-muted-foreground mt-0.5">Pull 15 keywords, then come back and add them to the form.</p>
          </div>
        </a>
        <a
          href="/dashboard/audit"
          className="flex items-start gap-2 rounded-md border border-border/60 bg-background p-3 text-xs hover:border-border hover:bg-muted/30 transition-colors"
        >
          <BarChart3 className="size-3.5 shrink-0 mt-0.5 text-muted-foreground" />
          <div>
            <p className="font-medium">Audit the listing instead</p>
            <p className="text-muted-foreground mt-0.5">Paste your existing listing and get a breakdown of specific fixes.</p>
          </div>
        </a>
        <button
          onClick={onReset}
          className="flex items-start gap-2 rounded-md border border-border/60 bg-background p-3 text-xs hover:border-border hover:bg-muted/30 transition-colors text-left w-full"
        >
          <ArrowLeftRight className="size-3.5 shrink-0 mt-0.5 text-muted-foreground" />
          <div>
            <p className="font-medium">Try a different platform</p>
            <p className="text-muted-foreground mt-0.5">Different platforms rank differently — the same product may score higher elsewhere.</p>
          </div>
        </button>
      </div>
    </div>
  );
}
```

Note: `Search`, `BarChart3`, `ArrowLeftRight` are already imported. Add `Lightbulb` in Step 1.

- [ ] **Step 3: Add onReset handler in OptimiseClient**

In `OptimiseClient`, add a `handleReset` function that clears the result and scrolls to the top of the page:

```tsx
function handleReset() {
  setResult(null);
  setError(null);
  window.scrollTo({ top: 0, behavior: "smooth" });
}
```

Place it near the other handler functions (alongside `handlePlatformChange`).

- [ ] **Step 4: Render RescuePanel in the result area**

In the JSX, find where `afterScore` is rendered (the `ScoreDisplay` component call). The rescue panel should render after the tabs/result card but before the feedback buttons, only when `afterScore !== null && afterScore < 60`.

Find the section with `{afterScore !== null && <ScoreDisplay ... />}` and after the closing tab/card block, add:

```tsx
{afterScore !== null && afterScore < 60 && (
  <RescuePanel platform={platform} onReset={handleReset} />
)}
```

- [ ] **Step 5: Build check**

```bash
npm run build
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/optimise/optimise-client.tsx
git commit -m "feat: show rescue CTAs on low-score optimisation results"
```

---

### Task 3: Input-phase form hints

**Files:**
- Modify: `src/app/dashboard/optimise/optimise-client.tsx`

**Context:** When a seller fills in only the product name and submits, they often get a lower score because the AI had nothing to work with. Per the game design analysis (Indirect Control, Lens #72), the system should guide sellers toward better inputs before they hit Optimise — not after. Show one platform-aware hint above the Optimise button when `productName` has at least 3 words but a key platform field is empty.

The hint is static (not AI-generated) — a single sentence per platform pointing to the most impactful missing field.

- [ ] **Step 1: Define PLATFORM_HINTS constant**

Add this constant near the top of `optimise-client.tsx` (after the `PLATFORM_DESCRIPTIONS` constant):

```tsx
const PLATFORM_HINTS: Partial<Record<Platform, { field: keyof FormValues; hint: string }>> = {
  etsy: {
    field: "targetBuyer",
    hint: "Adding a target buyer (e.g. \"birthday gift for mum\") helps rank for occasion searches on Etsy.",
  },
  amazon: {
    field: "materials",
    hint: "Adding materials or key features improves keyword matching for Amazon purchase-intent searches.",
  },
  shopify: {
    field: "style",
    hint: "Adding style or aesthetic details improves Google SEO relevance for your product page.",
  },
  ebay: {
    field: "materials",
    hint: "Adding brand, model, or condition improves matching with eBay's item-specific filters.",
  },
  woocommerce: {
    field: "style",
    hint: "Describing the style or use case helps Google match the right search queries.",
  },
  tiktok: {
    field: "targetBuyer",
    hint: "Adding who this is for helps the description connect with the right TikTok audience.",
  },
  social: {
    field: "targetBuyer",
    hint: "Describing who this is for makes the caption and hashtags more targeted.",
  },
};
```

- [ ] **Step 2: Compute the active hint**

In `OptimiseClient`, compute `activeHint` from the current form state. Place this just above the `return` statement:

```tsx
const productWordCount = formValues.productName.trim().split(/\s+/).filter(Boolean).length;
const platformHint = PLATFORM_HINTS[platform];
const activeHint =
  productWordCount >= 3 && platformHint && !formValues[platformHint.field]
    ? platformHint.hint
    : null;
```

- [ ] **Step 3: Render the hint above the submit button**

In the form JSX, find the `<Button type="submit">` Optimise button. Directly above it (still inside the form), add:

```tsx
{activeHint && (
  <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
    <Lightbulb className="size-3.5 shrink-0 mt-0.5 text-amber-500" />
    {activeHint}
  </p>
)}
```

`Lightbulb` was already imported in Task 2. If tasks are implemented in order, it is available. If not, add it to the lucide-react import.

- [ ] **Step 4: Write unit tests**

Create `src/tests/platform-hints.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

// Extract pure logic for testing — mirrors the component computation
const PLATFORM_HINTS: Record<string, { field: string; hint: string }> = {
  etsy: { field: "targetBuyer", hint: "Adding a target buyer" },
  amazon: { field: "materials", hint: "Adding materials" },
  shopify: { field: "style", hint: "Adding style" },
  ebay: { field: "materials", hint: "Adding brand, model" },
};

function computeHint(
  platform: string,
  formValues: Record<string, string>
): string | null {
  const wordCount = formValues.productName?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  const hint = PLATFORM_HINTS[platform];
  if (wordCount >= 3 && hint && !formValues[hint.field]) return hint.hint;
  return null;
}

describe("input-phase hint logic", () => {
  it("shows hint when product name has 3+ words and target field is empty", () => {
    const result = computeHint("etsy", {
      productName: "Handmade ceramic mug",
      targetBuyer: "",
    });
    expect(result).toContain("target buyer");
  });

  it("does not show hint when product name has fewer than 3 words", () => {
    const result = computeHint("etsy", {
      productName: "Ceramic mug",
      targetBuyer: "",
    });
    expect(result).toBeNull();
  });

  it("does not show hint when the target field is already filled", () => {
    const result = computeHint("etsy", {
      productName: "Handmade ceramic mug",
      targetBuyer: "birthday gift for mum",
    });
    expect(result).toBeNull();
  });

  it("shows material hint for amazon", () => {
    const result = computeHint("amazon", {
      productName: "Wireless noise cancelling headphones",
      materials: "",
    });
    expect(result).toContain("materials");
  });

  it("does not show hint for platform with no entry in PLATFORM_HINTS", () => {
    const result = computeHint("wix", {
      productName: "Handmade ceramic mug",
      style: "",
    });
    expect(result).toBeNull(); // wix not in test map
  });
});
```

- [ ] **Step 5: Run tests**

```bash
npm test
```

Expected: 5 tests pass.

- [ ] **Step 6: Build check**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboard/optimise/optimise-client.tsx src/tests/platform-hints.test.ts
git commit -m "feat: input-phase form hints guide sellers toward better submissions"
```

---

### Task 4: Free tier description truncation + upgrade modal content preview

**Files:**
- Modify: `src/components/upgrade-modal.tsx` — add `lockedDescription?: string` prop; render blurred preview when `isLimit`
- Modify: `src/app/dashboard/optimise/optimise-client.tsx` — truncate description for free users; wire locked description into modal

**Context:** Free users receive a 100% complete result including the full description — 150–300 words of the hardest content to write. This enables extraction: copy everything and leave with no reason to upgrade. The fix: the description is clipped at 80 words with a gradient fade and a lock icon below. When the user clicks the lock, the upgrade modal fires — and instead of a generic "you've run out" message, it shows their specific blurred description: "Here's what we wrote for you. Upgrade to unlock it." This is the moment of maximum conversion motivation: the content exists, it looks good, they can almost read it.

The `UpgradeModal` already receives `reason="limit"` from the optimiser. Changes to the modal: (1) accept a `lockedDescription` prop, (2) render a blurred preview between the header and the locked features grid when `isLimit && lockedDescription`. The `plan` prop and `setShowUpgrade` are already in scope inside `OptimiseClient`.

- [ ] **Step 1: Add lockedDescription prop to UpgradeModal**

In `src/components/upgrade-modal.tsx`, find the props interface or the function signature. The modal currently takes `open`, `onClose`, and `reason`. Add `lockedDescription`:

```tsx
interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason?: "limit" | "feature";
  lockedDescription?: string;
}

export function UpgradeModal({ open, onClose, reason = "feature", lockedDescription }: UpgradeModalProps) {
```

- [ ] **Step 2: Render the blurred description preview in the modal**

In `upgrade-modal.tsx`, find the header section (the block with `<h2 id="upgrade-modal-title">` and the subtext `<p>` below it). After the closing `</p>` of the subtext and before the locked features grid (or the plan cards section), insert:

```tsx
{isLimit && lockedDescription && (
  <div className="relative overflow-hidden rounded-md border border-border/50 bg-muted/20 p-3 space-y-1">
    <p className="text-[11px] font-medium text-muted-foreground">Here's what we wrote for you</p>
    <p className="text-sm leading-relaxed blur-[3px] select-none line-clamp-4 pointer-events-none">
      {lockedDescription}
    </p>
    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background/90 to-transparent pointer-events-none" />
  </div>
)}
```

- [ ] **Step 3: Compute the truncated description in OptimiseClient**

In `src/app/dashboard/optimise/optimise-client.tsx`, just above the `return` statement, add:

```tsx
const DESCRIPTION_WORD_LIMIT = 80;
const fullDescription: string = result?.description ?? "";
const descriptionWords = fullDescription.trim().split(/\s+/).filter(Boolean);
const isDescriptionLocked = plan === "free" && result !== null && descriptionWords.length > DESCRIPTION_WORD_LIMIT;
const displayDescription = isDescriptionLocked
  ? descriptionWords.slice(0, DESCRIPTION_WORD_LIMIT).join(" ") + "…"
  : fullDescription;
```

- [ ] **Step 4: Add lockedDesc state**

In `OptimiseClient`, add a state variable alongside the other `useState` calls:

```tsx
const [lockedDesc, setLockedDesc] = useState<string | undefined>(undefined);
```

- [ ] **Step 5: Replace description tab content with truncated version + lock**

Find where `result.description` is rendered in the description tab (either inside `getResultTabs()` or inline in the result JSX). Replace the description output with:

```tsx
<div className="relative">
  <p className="text-sm leading-relaxed whitespace-pre-wrap">{displayDescription}</p>
  {isDescriptionLocked && (
    <div className="mt-2 flex flex-col items-center gap-2">
      <div className="w-full h-8 bg-gradient-to-b from-transparent to-background/60 -mt-8 pointer-events-none" />
      <button
        type="button"
        onClick={() => {
          setLockedDesc(fullDescription);
          setShowUpgrade(true);
        }}
        className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors"
      >
        <Lock className="size-3 shrink-0" />
        Unlock full description
      </button>
    </div>
  )}
</div>
```

Note: `Lock` is already imported in `optimise-client.tsx`. `setShowUpgrade` is already in scope.

- [ ] **Step 6: Pass lockedDesc to UpgradeModal**

Find the `<UpgradeModal>` render in `optimise-client.tsx`. Update it to pass `lockedDescription` and clear it on close:

```tsx
<UpgradeModal
  open={showUpgrade}
  onClose={() => {
    setShowUpgrade(false);
    setLockedDesc(undefined);
  }}
  reason="limit"
  lockedDescription={lockedDesc}
/>
```

- [ ] **Step 7: Build check**

```bash
npm run build
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/components/upgrade-modal.tsx src/app/dashboard/optimise/optimise-client.tsx
git commit -m "feat: truncate description for free users + blurred preview in upgrade modal"
```

---

### Task 5: Post-result "What next?" CTA strip

**Files:**
- Modify: `src/app/dashboard/optimise/optimise-client.tsx`

**Context:** After a successful optimisation — especially a high-scoring one — sellers have nowhere obvious to go. They copy their content, close the tab, and come back days later or never. The "What next?" strip provides three clear forward actions to keep sellers in the product after a win.

This is distinct from `RescuePanel` (which appears only at score < 60, amber-tinted, framed as recovery). This strip appears after EVERY result regardless of score, framed as momentum. When score < 60, both RescuePanel and WhatNextStrip will render — the RescuePanel above (recovery), the WhatNextStrip below (progression).

The three actions:
1. **Research keywords** — link to `/dashboard/keywords?platform={platform}` (pre-selects the same platform)
2. **Audit this listing** — link to `/dashboard/audit`
3. **Start a new listing** — `onClick` calls `handleReset()` (already added in Task 2) to clear form and scroll to top

- [ ] **Step 1: Add Plus to the lucide-react import**

In the `import { ... } from "lucide-react"` block at the top of `optimise-client.tsx`, add `Plus`.

- [ ] **Step 2: Add the WhatNextStrip component above OptimiseClient**

Add this component after the `RescuePanel` component and before the `export function OptimiseClient` declaration:

```tsx
function WhatNextStrip({ platform, onReset }: { platform: Platform; onReset: () => void }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
      <p className="text-xs font-medium text-muted-foreground">What next?</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <a
          href={`/dashboard/keywords?platform=${platform}`}
          className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-3 py-2 text-xs font-medium hover:border-border hover:bg-muted/30 transition-colors"
        >
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          Research keywords
        </a>
        <a
          href="/dashboard/audit"
          className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-3 py-2 text-xs font-medium hover:border-border hover:bg-muted/30 transition-colors"
        >
          <BarChart3 className="size-3.5 shrink-0 text-muted-foreground" />
          Audit this listing
        </a>
        <button
          onClick={onReset}
          className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-3 py-2 text-xs font-medium hover:border-border hover:bg-muted/30 transition-colors text-left w-full"
        >
          <Plus className="size-3.5 shrink-0 text-muted-foreground" />
          Start a new listing
        </button>
      </div>
    </div>
  );
}
```

Note: `Search` and `BarChart3` are already imported (used by `RescuePanel`). `Plus` was added in Step 1.

- [ ] **Step 3: Render WhatNextStrip after the result tabs**

In the JSX result area, after the `RescuePanel` block (which already renders conditionally when `afterScore < 60`), add:

```tsx
{result !== null && (
  <WhatNextStrip platform={platform} onReset={handleReset} />
)}
```

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/optimise/optimise-client.tsx
git commit -m "feat: what-next CTA strip shown after every optimisation result"
```

---

### Task 6: Free user trial hook

**Files:**
- Modify: `src/app/dashboard/optimise/optimise-client.tsx`

**Context:** A free user has just seen a real, high-quality result. This is the highest-conversion moment in the entire free experience — the user has confirmed the tool works and is holding the output in their hands. Currently the page just ends. No nudge, no next step, no reason to click anything except close the tab.

Show a prominent trial banner below the result, rendered only for `plan === "free"` users when `result !== null`. It is the last element before the feedback buttons — the final call to action after value delivery.

Copy: "Want to do this for every listing? Start a 7-day free trial. No card required."

This is not an interruption — it appears after the content, framed as the natural next step.

- [ ] **Step 1: Add TrialBanner component above OptimiseClient**

Add this component after the `WhatNextStrip` component and before `export function OptimiseClient`:

```tsx
function TrialBanner() {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-medium">Want to do this for every listing?</p>
        <p className="text-xs text-muted-foreground">Start a 7-day free trial. No card required.</p>
      </div>
      <a
        href="/pricing?trial=true"
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
      >
        Start free trial
      </a>
    </div>
  );
}
```

- [ ] **Step 2: Render TrialBanner for free users**

In the JSX result area, after the `WhatNextStrip` block, add:

```tsx
{result !== null && plan === "free" && <TrialBanner />}
```

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/optimise/optimise-client.tsx
git commit -m "feat: trial conversion banner for free users after their result"
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
| Upgrade modal limit copy reframed as progression | Task 1 |
| Rescue CTAs shown when score < 60 | Task 2 |
| Three lateral options: keywords, audit, reset platform | Task 2 |
| Platform-aware input hint when key field is empty | Task 3 |
| Hint suppressed when product name < 3 words | Task 3 |
| Hint suppressed when target field already filled | Task 3 |
| Description truncated at 80 words for free users | Task 4 |
| Blurred description preview shown in upgrade modal | Task 4 |
| Post-result "What next?" CTA strip after every result | Task 5 |
| Trial conversion banner for free users post-result | Task 6 |

**Placeholder scan:** None found.

**Type consistency:** `keyof FormValues` used correctly. `Platform` type used throughout. `lockedDescription?: string` prop added consistently to `UpgradeModal` interface and call site. `displayDescription` and `isDescriptionLocked` computed from `result?.description` and `plan` — both already in scope.
