"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Scissors,
  Clock,
  Download,
  Shirt,
  Sparkles,
  Check,
  ArrowRight,
  Gem,
  Home,
  Leaf,
  Star,
  Coffee,
  Heart,
  Palette,
  Search,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLATFORMS, PLATFORM_LABELS, type Platform } from "@/lib/platforms";

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
      {[1, 2].map((s) => (
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
      body: JSON.stringify({ categories, platforms }),
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
            Sell<span className="text-primary">Wise</span><span className="text-[0.55em] align-super">™</span>
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

        {/* Step 2 — all set */}
        {step === 2 && (
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

            <div className="grid gap-2 text-left">
              {[
                {
                  icon: Sparkles,
                  title: "Listing Optimiser",
                  desc: "Generate SEO-optimised titles, tags, and descriptions.",
                },
                {
                  icon: ImageIcon,
                  title: "Competitor Peek",
                  desc: "Paste a Shopify listing URL and get an AI-optimised version side by side.",
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
              Free plan: 1 optimisation per month. Upgrade anytime for unlimited access.
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
