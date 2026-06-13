# Sprint F — Evolving Brand Voice Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make SellWise's AI output get measurably better for each seller the more they use it. After a seller has 5+ thumbs-up optimisations, automatically derive a brand voice description from those approved outputs and surface it in Settings so the seller can see and refine what the system has learned.

**Architecture:** A new `brand_voice_auto` column on `profiles` stores the system-derived voice (separate from the user-written `brand_voice` set in onboarding). A new API route `/api/brand-voice/refresh` runs a Claude prompt over the user's most recent thumbs-up outputs and writes the result back to `brand_voice_auto`. The optimise/audit/keywords routes use `brand_voice_auto ?? brand_voice` — user-set voice wins, auto-derived is the fallback. Settings page shows both, with a "Refresh" button for the auto-derived one.

**Dependencies:** Requires Sprint D (brand voice migration and onboarding) to be shipped first. The `brand_voice` column from Sprint D is a prerequisite. The thumbs-up feedback system from Task 5 (product quality sprint) must also be in place — the `feedback` column on `optimisations` is used here.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4, shadcn/ui, Supabase, Anthropic SDK

---

## File Map

**Create:**
- `supabase/migrations/20260613170000_add_brand_voice_auto_to_profiles.sql`
- `src/app/api/brand-voice/refresh/route.ts` — derive voice from approved outputs

**Modify:**
- `src/app/api/optimise/route.ts` — use `brand_voice_auto ?? brand_voice` fallback
- `src/app/api/keywords/route.ts` — same fallback
- `src/app/api/audit/route.ts` — same fallback
- `src/app/dashboard/settings/page.tsx` — show both voice fields + Refresh button

---

### Task 1: brand_voice_auto DB migration

**Files:**
- Create: `supabase/migrations/20260613170000_add_brand_voice_auto_to_profiles.sql`

**Context:** The auto-derived voice is stored separately from the user-written voice so we never silently overwrite what the seller explicitly told us. The seller can see both, can wipe the auto-derived one, and the system always prefers the user-written version.

- [ ] **Step 1: Create the migration**

Create `supabase/migrations/20260613170000_add_brand_voice_auto_to_profiles.sql`:

```sql
alter table public.profiles
  add column if not exists brand_voice_auto text;
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase db push
```

Expected: applies cleanly. If using the Supabase dashboard, run the SQL directly in the SQL editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260613170000_add_brand_voice_auto_to_profiles.sql
git commit -m "feat: add brand_voice_auto column for system-derived seller voice"
```

---

### Task 2: /api/brand-voice/refresh route

**Files:**
- Create: `src/app/api/brand-voice/refresh/route.ts`

**Context:** This route fetches the user's most recent 10 thumbs-up optimisations, extracts the AI-generated title and description from each, feeds them into a Claude prompt, and writes the result back to `profiles.brand_voice_auto`. It requires auth. If fewer than 5 thumbs-up results exist, it returns `{ ok: false, reason: "not_enough_data" }` — the UI handles this gracefully.

The Claude model for this route: `claude-haiku-4-5-20251001` — it's a purely mechanical text analysis with no creative judgment needed.

The prompt derives the voice from outputs the seller approved, not from inputs they wrote. This is important: the AI learns what kind of writing the seller liked, not what they described about themselves. The two may diverge (a seller may describe themselves as "casual" but have consistently approved formal, detailed copy).

- [ ] **Step 1: Create the route**

Create `src/app/api/brand-voice/refresh/route.ts`:

```typescript
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const client = new Anthropic();

const MIN_APPROVED = 5;
const MAX_SAMPLES = 10;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Fetch the most recent thumbs-up optimisations
  const { data: approved } = await supabase
    .from("optimisations")
    .select("output, platform")
    .eq("user_id", user.id)
    .eq("feedback", "up")
    .order("created_at", { ascending: false })
    .limit(MAX_SAMPLES);

  if (!approved || approved.length < MIN_APPROVED) {
    return NextResponse.json({ ok: false, reason: "not_enough_data", count: approved?.length ?? 0 });
  }

  // Extract title + description from each approved output
  const samples = approved
    .map((row) => {
      const out = row.output as Record<string, unknown>;
      const title = (out.title ?? out.metaTitle ?? out.productTitle ?? "") as string;
      const description = (out.description ?? out.postCopy ?? "") as string;
      const platform = row.platform as string;
      return `Platform: ${platform}\nTitle: ${title.slice(0, 200)}\nDescription: ${description.slice(0, 400)}`;
    })
    .join("\n\n---\n\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: `You analyse approved product listing copy to identify a seller's brand voice. Based on the examples provided, write a 2–3 sentence brand voice description that captures:
- Tone (e.g. warm/direct/playful/formal)
- Sentence rhythm (short punchy lines vs flowing descriptions)
- What they emphasise (specs/emotions/audience/occasion)
- Any consistent vocabulary patterns

Write only the voice description. No preamble, no "This seller uses..." opener. Write it as a brief for a copywriter: "Short, direct sentences. Led by emotional occasion rather than product specs. Casual and warm — reads like a message from a friend, not a brand."`,
    messages: [
      {
        role: "user",
        content: `Here are ${approved.length} listings this seller approved:\n\n${samples}`,
      },
    ],
  });

  const derivedVoice =
    message.content[0].type === "text" ? message.content[0].text.trim() : null;

  if (!derivedVoice) {
    return NextResponse.json({ ok: false, reason: "ai_parse_failed" }, { status: 500 });
  }

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ brand_voice_auto: derivedVoice })
    .eq("id", user.id);

  return NextResponse.json({ ok: true, voice: derivedVoice });
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/brand-voice/refresh/route.ts
git commit -m "feat: /api/brand-voice/refresh derives seller voice from approved optimisations"
```

---

### Task 3: AI prompt fallback — brand_voice_auto

**Files:**
- Modify: `src/app/api/optimise/route.ts`
- Modify: `src/app/api/keywords/route.ts`
- Modify: `src/app/api/audit/route.ts`

**Context:** Sprint D already injects `brand_voice` (user-set) into all three AI routes. Now we add `brand_voice_auto` as a fallback: if the user hasn't written their own voice but the system has derived one from their approved outputs, use that. The user-set voice always wins — it reflects explicit intent. The auto-derived voice fills in when the field is blank.

In each route, the profile fetch currently reads `brand_voice`. Update it to also read `brand_voice_auto`, then use: `brandVoice = profile.brand_voice ?? profile.brand_voice_auto ?? ""`.

- [ ] **Step 1: Update profile fetch in optimise route**

In `src/app/api/optimise/route.ts`, find the profile fetch added in Sprint D:

```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("brand_voice")
  .eq("id", user.id)
  .single();
brandVoice = profile?.brand_voice ?? "";
```

Replace with:

```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("brand_voice, brand_voice_auto")
  .eq("id", user.id)
  .single();
brandVoice = profile?.brand_voice ?? profile?.brand_voice_auto ?? "";
```

- [ ] **Step 2: Update profile fetch in keywords route**

In `src/app/api/keywords/route.ts`, find and update the same profile fetch pattern to select `brand_voice, brand_voice_auto` and use the `??` fallback chain.

- [ ] **Step 3: Update profile fetch in audit route**

In `src/app/api/audit/route.ts`, find and update the same profile fetch pattern.

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/optimise/route.ts src/app/api/keywords/route.ts src/app/api/audit/route.ts
git commit -m "feat: fall back to auto-derived brand voice when user hasn't written their own"
```

---

### Task 4: Brand voice UI in Settings

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx`

**Context:** The seller needs to see what the system has learned about them and trust it. Surfacing `brand_voice_auto` in Settings — labelled "Learned from your results" with a "Refresh" button — closes the loop. The seller can see whether the AI has misread their voice and override it by filling in the manual voice field. The "Refresh" button calls `/api/brand-voice/refresh`.

Read `src/app/dashboard/settings/page.tsx` first to understand the current layout before making changes. The settings page uses a standard form structure — add the brand voice section as a new card below the existing account fields.

- [ ] **Step 1: Read the settings page**

Read `src/app/dashboard/settings/page.tsx` to understand the current structure before modifying.

- [ ] **Step 2: Add brand voice section**

The settings page needs to:
1. Fetch `brand_voice` and `brand_voice_auto` from the user's profile (server component)
2. Render a "Brand voice" card with two subsections

The card structure:

```tsx
<section className="rounded-xl border border-border/60 p-5 space-y-5">
  <div>
    <h2 className="text-sm font-semibold">Brand voice</h2>
    <p className="text-xs text-muted-foreground mt-0.5">
      SellWise uses this to shape how it writes for you. Your own description always takes priority.
    </p>
  </div>

  {/* User-written voice */}
  <div className="space-y-2">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
      Your description
    </label>
    <BrandVoiceForm currentVoice={brandVoice} />
    <p className="text-xs text-muted-foreground">
      Write it like a brief: tone, rhythm, who you're writing for.
    </p>
  </div>

  {/* Auto-derived voice */}
  <div className="space-y-2">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
      Learned from your results
    </label>
    {brandVoiceAuto ? (
      <div className="rounded-md border border-border/50 bg-muted/30 p-3 text-sm text-muted-foreground leading-relaxed">
        {brandVoiceAuto}
      </div>
    ) : (
      <p className="text-xs text-muted-foreground">
        Not enough data yet. Approve 5+ optimisations with the thumbs-up to generate this.
      </p>
    )}
    <RefreshVoiceButton />
  </div>
</section>
```

- [ ] **Step 3: Create BrandVoiceForm client component (inline in settings file)**

Add a `BrandVoiceForm` client component that saves the user-written voice via a PATCH to `/api/profile`:

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function BrandVoiceForm({ currentVoice }: { currentVoice: string | null }) {
  const [voice, setVoice] = useState(currentVoice ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand_voice: voice || null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Brand voice saved.");
    } catch {
      toast.error("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={voice}
        onChange={(e) => setVoice(e.target.value.slice(0, 400))}
        placeholder={'e.g. "Short, direct sentences. Warm and personal. Led by occasion rather than product specs."'}
        rows={3}
        className="resize-none text-sm"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{voice.length}/400</span>
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
```

Check if a `/api/profile` PATCH route exists in the codebase before implementing. If it does not exist, create `src/app/api/profile/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const patchSchema = z.object({
  brand_voice: z.string().max(400).nullable().optional(),
  full_name: z.string().max(100).optional(),
});

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Create RefreshVoiceButton client component (inline in settings file)**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function RefreshVoiceButton() {
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/brand-voice/refresh", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.reason === "not_enough_data") {
          toast(`Need ${5 - (data.count ?? 0)} more approved results to generate this.`);
        } else {
          toast.error("Could not refresh. Try again.");
        }
        return;
      }
      toast.success("Brand voice updated from your recent results.");
      // Reload to show updated voice
      window.location.reload();
    } catch {
      toast.error("Could not refresh. Try again.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={refresh}
      disabled={refreshing}
      className="gap-1.5"
    >
      <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
      {refreshing ? "Refreshing..." : "Refresh from results"}
    </Button>
  );
}
```

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
git add src/app/dashboard/settings/page.tsx src/app/api/brand-voice/refresh/route.ts
git commit -m "feat: brand voice settings UI with auto-derived voice and manual override"
```

If `/api/profile` was created:
```bash
git add src/app/api/profile/route.ts
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
| brand_voice_auto column on profiles | Task 1 |
| /api/brand-voice/refresh derives voice from thumbs-up outputs | Task 2 |
| Returns not_enough_data when fewer than 5 approved results | Task 2 |
| Uses Haiku model (mechanical text analysis) | Task 2 |
| optimise route uses brand_voice_auto as fallback | Task 3 |
| keywords route uses brand_voice_auto as fallback | Task 3 |
| audit route uses brand_voice_auto as fallback | Task 3 |
| User-set voice always wins over auto-derived | Task 3 |
| Settings shows both voice fields | Task 4 |
| Refresh button calls /api/brand-voice/refresh | Task 4 |
| User can edit and save manual voice from settings | Task 4 |

**Placeholder scan:** None found. All code blocks are complete.

**Type consistency:** `brand_voice_auto` field name matches the migration column name exactly. The `??` fallback chain `profile.brand_voice ?? profile.brand_voice_auto ?? ""` is correct — user-set wins, auto-derived is fallback, empty string if neither.

**Prerequisite check:** Sprint D must be shipped before this sprint. Specifically: `brand_voice` column must exist on `profiles`, and the thumbs-up `feedback` column must exist on `optimisations` (from the product quality sprint). Both are confirmed as shipped.
