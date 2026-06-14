"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Scissors,
  Clock,
  Download,
  Shirt,
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeftRight,
  Gem,
  Home,
  Leaf,
  Star,
  Coffee,
  Heart,
  Palette,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PLATFORMS, PLATFORM_LABELS, type Platform } from "@/lib/platforms";
import { scoreOptimisedListing } from "@/lib/listing-score";
import type { ScoredListing } from "@/lib/listing-score";

const CATEGORIES = [
  { id: "handmade", label: "Handmade crafts", icon: Scissors },
  { id: "jewelry", label: "Jewelry", icon: Gem },
  { id: "clothing", label: "Clothing & apparel", icon: Shirt },
  { id: "art", label: "Art & prints", icon: Palette },
  { id: "home", label: "Home & decor", icon: Home },
  { id: "digital", label: "Digital downloads", icon: Download },
  { id: "vintage", label: "Vintage & collectibles", icon: Clock },
  { id: "beauty", label: "Beauty & wellness", icon: Leaf },
  { id: "baby", label: "Baby & kids", icon: Star },
  { id: "food", label: "Food & drink", icon: Coffee },
  { id: "pets", label: "Pet supplies", icon: Heart },
  { id: "other", label: "Something else", icon: Sparkles },
];

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      {[1, 2, 3].map((s) => (
        <div
          key={s}
          className={cn(
            "rounded-full transition-all",
            s === current
              ? "size-2.5 bg-primary"
              : s < current
              ? "size-2 bg-primary/40"
              : "size-2 bg-border"
          )}
        />
      ))}
    </div>
  );
}

export function OnboardingClient({ firstName }: { firstName: string | null }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [brandVoice, setBrandVoice] = useState("");
  const [demoResult, setDemoResult] = useState<{ title: string; score: number } | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    if (step !== 3) return;
    const demoPlatform: string = platforms[0] ?? "shopify";
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
        demo: true,
      }),
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const title: string = data.metaTitle ?? data.title ?? "";
        const score: number = scoreOptimisedListing(data as ScoredListing);
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

  function toggleCategory(id: string) {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function togglePlatform(p: Platform) {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function markComplete() {
    await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories, platforms, brandVoice }),
    });
  }

  async function finish() {
    await markComplete();
    router.push("/dashboard");
  }

  async function skip() {
    await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories: [], platforms: [] }),
    });
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <div className="text-2xl font-bold tracking-tight">
            Sell<span className="text-primary">Wise</span>
          </div>
        </div>

        <StepDots current={step} />

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {firstName ? `Welcome, ${firstName}.` : "Welcome."}
              </h1>
              <p className="text-sm text-muted-foreground">
                What do you sell? Pick everything that applies.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {CATEGORIES.map(({ id, label, icon: Icon }) => {
                const selected = categories.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleCategory(id)}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all",
                      selected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                    )}
                  >
                    {selected && (
                      <span className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-2.5" />
                      </span>
                    )}
                    <Icon className="size-5" />
                    <span className="text-center leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground text-center">
                Where do you sell? Pick all your platforms.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {PLATFORMS.map((p) => {
                  const selected = platforms.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                        selected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                      )}
                    >
                      {selected && <Check className="size-3" />}
                      {PLATFORM_LABELS[p]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => {
                  if (platforms.length === 0) {
                    toast("No platform selected — you can add this later in Settings.");
                  }
                  setStep(2);
                }}
                disabled={categories.length === 0}
              >
                Continue
                <ArrowRight className="size-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full text-muted-foreground"
                onClick={skip}
              >
                Skip setup
              </Button>
            </div>
          </div>
        )}

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

            <div className="space-y-1">
              <Textarea
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value.slice(0, 400))}
                placeholder={'e.g. "I make modern, minimal jewellery for women who want simple everyday pieces. Casual, clean tone — no fluff."'}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {brandVoice.length}/400
              </p>
            </div>

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

        {/* Step 3 — all set */}
        {step === 3 && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
              <Check className="size-8 text-primary" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                You&apos;re all set!
              </h1>
              <p className="text-sm text-muted-foreground">
                Here&apos;s everything waiting for you on the dashboard.
              </p>
            </div>

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

            <div className="grid gap-2 text-left">
              {[
                {
                  icon: Sparkles,
                  title: "Listing Optimiser",
                  desc: "Generate SEO-optimised titles, tags, and descriptions.",
                },
                {
                  icon: ArrowLeftRight,
                  title: "Platform Migration",
                  desc: "Reformat any listing for a different marketplace in seconds.",
                },
                {
                  icon: Search,
                  title: "Keyword Research",
                  desc: "Find 15 keywords with volume and competition data.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 rounded-xl border border-border/50 p-3"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground/70">
              Free plan: 3 optimisations per month. Upgrade anytime for unlimited access.
            </p>

            <Button className="w-full" onClick={finish}>
              Go to dashboard
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
