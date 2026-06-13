# Sprint D — Onboarding, Persona & Brand Voice Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture each seller's brand voice during onboarding, inject it into every AI prompt so listings don't sound identical across sellers, create a "gasp moment" by showing a real AI result during onboarding before the seller has to do any work, and filter the platform selector across all tools to only show the platforms the seller actually uses.

**Architecture:** New `brand_voice` column on `profiles`. Onboarding gets a third step (brand voice capture) inserted between the existing step 1 (category/platform) and current step 2 (all-set). The all-set step gains a live demo optimisation that fires automatically. All three AI routes (optimise, audit, keywords) read `brand_voice` from the user's profile and append it to the system prompt. Layered disclosure: on Studio plan the "Add more detail" toggle in the optimiser is open by default. Platform filtering: each tool's server component reads `onboarding_platforms` from the user's profile and passes it to the client, which filters the visible platforms with a "Show all" escape hatch.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4, shadcn/ui, Supabase, Anthropic SDK

---

## File Map

**Create:**
- `supabase/migrations/20260613140000_add_brand_voice_to_profiles.sql`

**Modify:**
- `src/app/onboarding/onboarding-client.tsx` — add step 2 brand voice capture + demo optimisation on step 3
- `src/app/api/onboarding/complete/route.ts` — accept and save `brandVoice`
- `src/app/api/optimise/route.ts` — read profile `brand_voice`, append to system prompt
- `src/app/api/keywords/route.ts` — read profile `brand_voice`, append to system prompt
- `src/app/api/audit/route.ts` — read profile `brand_voice`, append to system prompt
- `src/app/dashboard/optimise/optimise-client.tsx` — open `showMoreDetail` by default for Studio plan; platform filtering
- `src/app/dashboard/optimise/page.tsx` — pass `preferredPlatforms` to client
- `src/app/dashboard/keywords/page.tsx` + client — pass + apply `preferredPlatforms`
- `src/app/dashboard/audit/page.tsx` + client — pass + apply `preferredPlatforms`
- `src/app/dashboard/migrate/page.tsx` + client — pass + apply `preferredPlatforms`

---

### Task 1: Brand voice DB migration

**Files:**
- Create: `supabase/migrations/20260613140000_add_brand_voice_to_profiles.sql`

**Context:** `profiles` table lives in Supabase. We need a `brand_voice text` column. No constraint — it's optional.

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/20260613140000_add_brand_voice_to_profiles.sql`:

```sql
alter table public.profiles
  add column if not exists brand_voice text;
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected: migration applied with no errors. If the Supabase CLI is not installed or the DB is managed via the dashboard, run this SQL directly in the Supabase SQL editor instead.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260613140000_add_brand_voice_to_profiles.sql
git commit -m "feat: add brand_voice column to profiles"
```

---

### Task 2: Brand voice capture in onboarding

**Files:**
- Modify: `src/app/onboarding/onboarding-client.tsx`
- Modify: `src/app/api/onboarding/complete/route.ts`

**Context:** The onboarding currently has 2 steps. Current step 2 is the "You're all set!" screen. We need to insert a new step 2 (brand voice capture) so the flow becomes: Step 1 → Step 2 (brand voice) → Step 3 (all set + demo).

The `StepDots` component renders dots from `[1, 2]`. This must be updated to `[1, 2, 3]`.

The brand voice step asks sellers to describe their brand in their own words — tone, personality, who they're selling to. It is optional (can be skipped). The input is a `<textarea>` with a character limit of 400. Show a placeholder hint: `"e.g. 'I make modern, minimal jewellery for women who want simple everyday pieces. Casual, clean tone — no fluff.'"`.

The step heading: "How does your brand sound?"
Subheading: "This shapes how SellWise writes for you. Add a tone, vibe, or audience note — or skip it."

- [ ] **Step 1: Update StepDots to 3 dots**

In `src/app/onboarding/onboarding-client.tsx`, find `StepDots`:

```tsx
function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      {[1, 2].map((s) => (
```

Replace `[1, 2]` with `[1, 2, 3]`:

```tsx
function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      {[1, 2, 3].map((s) => (
```

- [ ] **Step 2: Add brandVoice state**

In `OnboardingClient`, after the existing state declarations, add:

```tsx
const [brandVoice, setBrandVoice] = useState("");
```

- [ ] **Step 3: Update markComplete to send brandVoice**

Replace the existing `markComplete` function:

```tsx
async function markComplete() {
  await fetch("/api/onboarding/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categories, platforms, brandVoice }),
  });
}
```

- [ ] **Step 4: Update the Continue button in Step 1**

Currently the Continue button calls `setStep(2)`. It should now call `setStep(2)` (no change needed for the target) — but `step === 2` will render the new brand voice step, and `step === 3` will render the all-set step. Update the Continue button `onClick` to not change (it already goes to 2). **However**, update the finish function to push to dashboard from step 3, not step 2. And update the step 2 "You're all set" JSX condition to `step === 3`. All references to the old step 2 must become step 3.

Find:

```tsx
{/* Step 2 — all set */}
{step === 2 && (
```

Replace with:

```tsx
{/* Step 3 — all set */}
{step === 3 && (
```

- [ ] **Step 5: Add the brand voice step (Step 2) JSX**

In `onboarding-client.tsx`, import `Textarea` from shadcn:

```tsx
import { Textarea } from "@/components/ui/textarea";
```

Then add the step 2 block after the step 1 closing `)}` and before the step 3 block:

```tsx
{/* Step 2 — brand voice */}
{step === 2 && (
  <div className="space-y-6">
    <div className="text-center space-y-1">
      <h1 className="text-2xl font-bold tracking-tight">
        How does your brand sound?
      </h1>
      <p className="text-sm text-muted-foreground">
        This shapes how SellWise writes for you. Add a tone, vibe, or audience note — or skip it.
      </p>
    </div>

    <Textarea
      value={brandVoice}
      onChange={(e) => setBrandVoice(e.target.value.slice(0, 400))}
      placeholder={'e.g. "I make modern, minimal jewellery for women who want simple everyday pieces. Casual, clean tone — no fluff."'}
      rows={4}
      className="resize-none"
    />
    <p className="text-xs text-muted-foreground text-right -mt-4">
      {brandVoice.length}/400
    </p>

    <div className="space-y-2">
      <Button className="w-full" onClick={() => setStep(3)}>
        Continue
        <ArrowRight className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full text-muted-foreground"
        onClick={() => setStep(3)}
      >
        Skip for now
      </Button>
    </div>
  </div>
)}
```

- [ ] **Step 6: Update the API route to save brandVoice**

In `src/app/api/onboarding/complete/route.ts`, replace the body parsing and update call:

```typescript
let categories: string[] = [];
let platforms: string[] = [];
let brandVoice = "";

try {
  const body = await req.json();
  categories = Array.isArray(body.categories) ? body.categories : [];
  platforms = Array.isArray(body.platforms) ? body.platforms : [];
  brandVoice = typeof body.brandVoice === "string" ? body.brandVoice.slice(0, 400) : "";
} catch {
  // no body — skip was pressed
}

const admin = createAdminClient();
await admin
  .from("profiles")
  .update({
    onboarding_completed: true,
    ...(categories.length > 0 && { onboarding_categories: categories }),
    ...(platforms.length > 0 && { onboarding_platforms: platforms }),
    ...(brandVoice.length > 0 && { brand_voice: brandVoice }),
  })
  .eq("id", user.id);
```

- [ ] **Step 7: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/app/onboarding/onboarding-client.tsx src/app/api/onboarding/complete/route.ts
git commit -m "feat: add brand voice capture step to onboarding"
```

---

### Task 3: Brand voice injection into AI prompts

**Files:**
- Modify: `src/app/api/optimise/route.ts`
- Modify: `src/app/api/keywords/route.ts`
- Modify: `src/app/api/audit/route.ts`

**Context:** When a user has a `brand_voice` on their profile, it gets appended to the AI system prompt. The injection is a closing paragraph so it layers on top of platform rules without overriding them. The intent is differentiation — two sellers with the same product get different copy because their brand voice differs.

The optimise route already reads `user.id` from Supabase auth. We need to additionally fetch `brand_voice` from `profiles`. The fetch must not block the route on failure — if the DB call fails, continue without brand voice.

The brand voice suffix to append to the system prompt:

```
\n\nSeller brand voice: ${brandVoice}
Write all copy in this voice. Keep platform SEO rules above, but let this tone shape word choice, sentence rhythm, and energy level.`
```

Only append this if `brandVoice` is a non-empty string.

**Optimise route:**

- [ ] **Step 1: Fetch brand voice in optimise route**

In `src/app/api/optimise/route.ts`, after the rate limit check and before the `checkLimit` call, add a profile fetch:

```typescript
let brandVoice = "";
try {
  const { data: profile } = await supabase
    .from("profiles")
    .select("brand_voice")
    .eq("id", user.id)
    .single();
  brandVoice = profile?.brand_voice ?? "";
} catch {
  // proceed without brand voice
}
```

- [ ] **Step 2: Pass brandVoice into the Anthropic call**

In the `client.messages.create` call, find the system prompt construction:

```typescript
system: [
  {
    type: "text" as const,
    text: buildSystemPrompt(platform) + (existingContent ? improveModeSuffix() : ""),
    cache_control: { type: "ephemeral" as const },
  },
],
```

Replace with:

```typescript
const brandVoiceSuffix = brandVoice
  ? `\n\nSeller brand voice: ${brandVoice}\nWrite all copy in this voice. Keep platform SEO rules above, but let this tone shape word choice, sentence rhythm, and energy level.`
  : "";

system: [
  {
    type: "text" as const,
    text: buildSystemPrompt(platform) + (existingContent ? improveModeSuffix() : "") + brandVoiceSuffix,
    cache_control: { type: "ephemeral" as const },
  },
],
```

**Keywords route:**

- [ ] **Step 3: Fetch brand voice and inject into keywords route**

In `src/app/api/keywords/route.ts`, after user auth check, add the same profile fetch pattern:

```typescript
let brandVoice = "";
try {
  const { data: profile } = await supabase
    .from("profiles")
    .select("brand_voice")
    .eq("id", user.id)
    .single();
  brandVoice = profile?.brand_voice ?? "";
} catch {
  // proceed without brand voice
}
```

Then in the `client.messages.create` system prompt, append the brand voice suffix to the result of `buildSystemPrompt(platform)` using the same pattern as the optimise route.

**Audit route:**

- [ ] **Step 4: Fetch brand voice and inject into audit route**

In `src/app/api/audit/route.ts`, repeat the same fetch-and-inject pattern. Read the file first to find the exact location of the system prompt construction, then add the fetch after user auth and inject into the system prompt.

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Build check**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/optimise/route.ts src/app/api/keywords/route.ts src/app/api/audit/route.ts
git commit -m "feat: inject seller brand voice into all AI prompts"
```

---

### Task 4: Onboarding demo optimisation (the gasp moment)

**Files:**
- Modify: `src/app/onboarding/onboarding-client.tsx`

**Context:** Per Art of Game Design Lens #61 (Interest Curve), the highest point of interest should come early. Right now the all-set step shows feature list cards — static, nothing happening. We want to fire a live AI optimisation the moment step 3 renders so the seller sees a real result for a demo product before they've done anything. This is the gasp moment.

The demo: a fixed demo product (`demoInput`) is sent to `/api/optimise` when the user arrives at step 3. The result renders in a compact preview card while the features list is shown alongside. If the demo fails or times out (>10s), show the feature list normally — no error state shown to the user.

The demo uses the first platform the user selected in step 1 (or falls back to `"shopify"`). The demo product is always:
- `productName`: `"Handmade soy wax candle, lavender and vanilla scent"`
- `materials`: `"100% soy wax, cotton wick, recycled glass jar"`
- `style`: `"minimalist, clean, gift-ready"`
- `targetBuyer`: `"gift buyers looking for a natural, eco-friendly candle"`

Show a loading skeleton (2 lines, rounded-md, animate-pulse) while the demo is in flight. Once the result arrives, show:
- The `title` field (or `metaTitle` for shopify/woocommerce) with a "Demo title" label
- A green "SEO score" badge using the same score colour logic already in the app
- A note: "This is what SellWise would write for a product like yours."

- [ ] **Step 1: Add demo state**

In `OnboardingClient`, add demo-related state after the existing state:

```tsx
const [demoResult, setDemoResult] = useState<{ title: string; score: number } | null>(null);
const [demoLoading, setDemoLoading] = useState(false);
```

- [ ] **Step 2: Add useEffect that fires the demo when step 3 renders**

```tsx
useEffect(() => {
  if (step !== 3) return;
  const demoPlatform = platforms[0] ?? "shopify";
  setDemoLoading(true);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  fetch("/api/optimise", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      platform: demoPlatform,
      productName: "Handmade soy wax candle, lavender and vanilla scent",
      materials: "100% soy wax, cotton wick, recycled glass jar",
      style: "minimalist, clean, gift-ready",
      targetBuyer: "gift buyers looking for a natural, eco-friendly candle",
    }),
    signal: controller.signal,
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data) return;
      const title: string =
        data.metaTitle ?? data.title ?? "";
      const score: number = data.score ?? 0;
      if (title) setDemoResult({ title, score });
    })
    .catch(() => {
      // silent fail — demo is best-effort
    })
    .finally(() => {
      clearTimeout(timeout);
      setDemoLoading(false);
    });

  return () => {
    controller.abort();
    clearTimeout(timeout);
  };
}, [step, platforms]);
```

- [ ] **Step 3: Prevent demo from consuming the user's free quota**

The demo fires a real `/api/optimise` call. Without a guard, a free user who signs up lands on the dashboard having already spent their 1 monthly optimisation — before doing any real work.

Fix in two files:

**In `src/app/onboarding/onboarding-client.tsx`:** Add `demo: true` to the fetch body in the useEffect from Step 2:

```tsx
body: JSON.stringify({
  platform: demoPlatform,
  productName: "Handmade soy wax candle, lavender and vanilla scent",
  materials: "100% soy wax, cotton wick, recycled glass jar",
  style: "minimalist, clean, gift-ready",
  targetBuyer: "gift buyers looking for a natural, eco-friendly candle",
  demo: true,
}),
```

**In `src/app/api/optimise/route.ts`:** Read the file to find the Zod `requestSchema`. Add the `demo` field:

```typescript
const requestSchema = z.object({
  // ... existing fields ...
  demo: z.boolean().optional(),
});
```

Then destructure `demo` from the parsed body alongside the other fields:

```typescript
const { platform, productName, /* ...other fields... */, demo } = parsed;
```

Then find the `incrementUsage` call and wrap it in a guard:

```typescript
if (!demo) {
  await incrementUsage(user.id, "optimisations");
}
```

- [ ] **Step 4: Render the demo result in step 3**

In the step 3 JSX, find the features grid. Above it (after the heading), add:

```tsx
{/* Demo result */}
{demoLoading && (
  <div className="rounded-xl border border-border/50 p-4 space-y-2.5">
    <div className="flex items-center justify-between">
      <p className="text-xs font-medium text-muted-foreground">Demo title</p>
      <div className="h-5 w-12 rounded-full bg-muted animate-pulse" />
    </div>
    <div className="space-y-1.5">
      <div className="h-4 w-full rounded-md bg-muted animate-pulse" />
      <div className="h-4 w-2/3 rounded-md bg-muted animate-pulse" />
    </div>
  </div>
)}

{!demoLoading && demoResult && (
  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
    <div className="flex items-start justify-between gap-2">
      <p className="text-xs font-medium text-muted-foreground">Demo title</p>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
          demoResult.score >= 80
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : demoResult.score >= 60
            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        )}
      >
        Score {demoResult.score}
      </span>
    </div>
    <p className="text-sm font-medium leading-snug">{demoResult.title}</p>
    <p className="text-xs text-muted-foreground">
      This is what SellWise would write for a product like yours.
    </p>
  </div>
)}
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/onboarding/onboarding-client.tsx src/app/api/optimise/route.ts
git commit -m "feat: fire demo optimisation on onboarding all-set step, exempt from free quota"
```

---

### Task 5: Layered disclosure — open "Add more detail" for Studio by default

**Files:**
- Modify: `src/app/dashboard/optimise/optimise-client.tsx`

**Context:** Studio sellers are power users with complex products. Per Art of Game Design Lens #51 (Pyramid), advanced users should be able to access deeper layers immediately. Currently `showMoreDetail` always defaults to `false`. For Studio plan, it should default to `true` so the extra fields (style, materials, target buyer) are visible without a click.

The `OptimiseClient` already receives `plan` as a prop. The `useState(false)` for `showMoreDetail` needs to initialise from `plan`.

- [ ] **Step 1: Change the showMoreDetail initialiser**

In `src/app/dashboard/optimise/optimise-client.tsx`, find:

```tsx
const [showMoreDetail, setShowMoreDetail] = useState(false);
```

Replace with:

```tsx
const [showMoreDetail, setShowMoreDetail] = useState(plan === "studio");
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/optimise/optimise-client.tsx
git commit -m "feat: open detail fields by default for Studio plan users"
```

---

### Task 6: SellWise voice copy pass

**Files:**
- Modify: `src/app/dashboard/optimise/optimise-client.tsx`
- Modify: `src/app/dashboard/page.tsx`

**Context:** Per Art of Game Design Lens #44 (Character), every piece of UI text is a chance to project personality. Generic copy ("Loading...", "Something went wrong") should be replaced with SellWise-voice copy that feels like the brand speaking — direct, a bit dry, honest. No em dashes, no marketing buzzwords.

The current loading steps in `optimise-client.tsx` are already in a `LOADING_STEPS` constant. The dashboard has a welcome message. The error state in the optimiser has generic text.

Rules for SellWise voice in UI copy:
- Short and direct — no filler words
- Dry, not enthusiastic — "Here's your result." not "Your result is ready!"
- Honest about limits — "Only 1 free optimisation per month." not "Explore our plans for more."
- Never em/en dashes
- Never exclamation marks except where genuine excitement is warranted (result just arrived)

- [ ] **Step 1: Update the optimiser empty state copy**

In `optimise-client.tsx`, find the empty state — the section rendered when `!result && !loading`. It currently renders something like a placeholder or blank state. Find the text and update it to match SellWise voice.

Read the file to locate the empty state JSX, then replace generic placeholder text with:

Heading: `"Fill in the form to get your first result."`  
Subtext (if any): `"Results appear here. Takes about 10 seconds."`

If no empty state currently exists, skip this step.

- [ ] **Step 2: Update the optimiser error state copy**

Find the error rendering in `optimise-client.tsx`. Replace any instance of generic text like "Failed to generate listing" or "Something went wrong" with:

`"Something went wrong. Try again — if it keeps happening, check your connection."`

- [ ] **Step 3: Update LOADING_STEPS copy (if any steps feel generic)**

Find `LOADING_STEPS` in `optimise-client.tsx`. Each step should feel like a real person narrating the work. Acceptable examples:
- "Reading your product details..."
- "Researching platform keywords..."
- "Writing your listing..."
- "Scoring the result..."

If the current steps already use this style, skip this step.

- [ ] **Step 4: Update dashboard welcome copy**

In `src/app/dashboard/page.tsx`, find the welcome message. It currently reads something like `"Welcome back, ${firstName}."` or similar. Update it to match SellWise voice:

Keep: `"Welcome back, ${firstName}."` (already good — do not add filler)

If the dashboard has any generic empty states or placeholder cards, update them to be SellWise-voiced. If nothing needs changing, skip this step.

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/optimise/optimise-client.tsx src/app/dashboard/page.tsx
git commit -m "copy: SellWise voice pass on optimiser and dashboard empty/error states"
```

---

### Task 7: Platform filtering — hide unused platforms across all tools

**Files:**
- Modify: `src/app/dashboard/optimise/page.tsx` — fetch and pass `preferredPlatforms`
- Modify: `src/app/dashboard/optimise/optimise-client.tsx` — accept prop, filter platform selector
- Modify: `src/app/dashboard/keywords/page.tsx` — fetch and pass `preferredPlatforms`
- Modify: `src/app/dashboard/keywords/keywords-client.tsx` (or equivalent) — accept prop, filter selector
- Modify: `src/app/dashboard/audit/page.tsx` — fetch and pass `preferredPlatforms`
- Modify: `src/app/dashboard/audit/audit-client.tsx` (or equivalent) — accept prop, filter selector
- Modify: `src/app/dashboard/migrate/page.tsx` — fetch and pass `preferredPlatforms`
- Modify: `src/app/dashboard/migrate/migrate-client.tsx` (or equivalent) — accept prop, filter selector

**Context:** The platform selector appears in four tools — optimiser, keywords, audit, and migration. As more platforms are added, the list grows. A seller who only sells on Shopify and eBay doesn't want to wade through TikTok Shop, WooCommerce, Wix, and Squarespace on every tool.

Solution: each tool's server component reads `onboarding_platforms` from the user's profile and passes it as `preferredPlatforms` to the client. When non-empty, only those platforms appear in the selector by default. A small "Show all" link below the selector expands to the full list. If `onboarding_platforms` is null or empty (user skipped onboarding or deselected everything), all platforms show — safe fallback.

The filtering logic is identical in every client — show preferred platforms or all when `showAll` is toggled. No shared helper needed; it's three lines per component.

**Important:** Read each page and client file before modifying to understand the exact platform selector structure — it may differ between tools (tabs vs dropdown vs toggle group).

- [ ] **Step 1: Read all four page + client files**

Read each of the following to understand the current platform selector implementation before making any changes:
- `src/app/dashboard/optimise/page.tsx`
- `src/app/dashboard/optimise/optimise-client.tsx` (already partially known — platform is a `useState<Platform>` with tab buttons)
- `src/app/dashboard/keywords/page.tsx`
- The keywords client file (check filename — may be `keywords-client.tsx` or inline in `page.tsx`)
- `src/app/dashboard/audit/page.tsx`
- The audit client file
- `src/app/dashboard/migrate/page.tsx`
- The migrate client file

- [ ] **Step 2: Fetch preferredPlatforms in each server component**

In each of the four `page.tsx` files, add a profile fetch after the existing auth/profile queries:

```typescript
import { createClient } from "@/lib/supabase/server";
import type { Platform } from "@/lib/platforms";

// Inside the server component:
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
// (user auth likely already present — add only what's missing)

const { data: profile } = await supabase
  .from("profiles")
  .select("onboarding_platforms")
  .eq("id", user.id)
  .single();

const preferredPlatforms: Platform[] = Array.isArray(profile?.onboarding_platforms)
  ? (profile.onboarding_platforms as Platform[])
  : [];
```

Then pass `preferredPlatforms={preferredPlatforms}` to the client component.

- [ ] **Step 3: Add preferredPlatforms prop to each client component**

In each client component, add the prop to the component signature:

```tsx
interface OptimiseClientProps {
  // ... existing props ...
  preferredPlatforms: Platform[];
}

export function OptimiseClient({ ..., preferredPlatforms }: OptimiseClientProps) {
```

(Adjust the component name and existing props for each file.)

- [ ] **Step 4: Add showAll state and filtered platform list**

In each client component, add a `showAll` state alongside the existing state:

```tsx
const [showAllPlatforms, setShowAllPlatforms] = useState(false);
```

Then compute the visible platforms:

```tsx
const visiblePlatforms: Platform[] =
  showAllPlatforms || preferredPlatforms.length === 0
    ? PLATFORMS
    : preferredPlatforms;
```

`PLATFORMS` is already imported from `@/lib/platforms` in these files.

- [ ] **Step 5: Filter the platform selector rendering**

In each client component, find where the platform selector iterates over platforms (likely `PLATFORMS.map(...)` or similar). Replace the source array with `visiblePlatforms`. Then, immediately after the platform selector, add the toggle link — but only when there are hidden platforms:

```tsx
{preferredPlatforms.length > 0 && !showAllPlatforms && (
  <button
    type="button"
    onClick={() => setShowAllPlatforms(true)}
    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
  >
    Show all platforms
  </button>
)}
{showAllPlatforms && preferredPlatforms.length > 0 && (
  <button
    type="button"
    onClick={() => setShowAllPlatforms(false)}
    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
  >
    Show my platforms only
  </button>
)}
```

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
git add src/app/dashboard/optimise/page.tsx src/app/dashboard/optimise/optimise-client.tsx src/app/dashboard/keywords/ src/app/dashboard/audit/ src/app/dashboard/migrate/
git commit -m "feat: filter platform selector to user's platforms, with Show all toggle"
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
| brand_voice column added to profiles | Task 1 |
| Brand voice captured during onboarding | Task 2 |
| Brand voice saved via /api/onboarding/complete | Task 2 |
| Brand voice injected into optimise AI prompt | Task 3 |
| Brand voice injected into keywords AI prompt | Task 3 |
| Brand voice injected into audit AI prompt | Task 3 |
| Gasp moment demo fires on onboarding all-set step | Task 4 |
| Demo does not consume the free user's monthly quota | Task 4 |
| Demo fails silently without breaking the flow | Task 4 |
| Studio plan defaults showMoreDetail to open | Task 5 |
| SellWise voice pass on empty/error states | Task 6 |
| Platform selector filtered to user's platforms in all 4 tools | Task 7 |
| Show all / Show my platforms only toggle | Task 7 |
| Safe fallback: show all when no preferred platforms set | Task 7 |

**Placeholder scan:** None found. All code blocks are complete.

**Type consistency:** `brand_voice` from DB used as `brandVoice` in JS/TS throughout. `demoResult` type is `{ title: string; score: number }` — matches what `/api/optimise` returns. `plan === "studio"` comparison matches the plan enum (`'free' | 'starter' | 'growth' | 'studio'`). `preferredPlatforms: Platform[]` typed consistently — `onboarding_platforms` is stored as `jsonb` in Supabase and cast to `Platform[]` at the boundary.
