"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Scissors,
  Clock,
  Download,
  Shirt,
  ImageIcon,
  Sparkles,
  Check,
  ArrowRight,
  Copy,
  Gem,
  Home,
  Leaf,
  Star,
  Coffee,
  Heart,
  Palette,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PLATFORMS, PLATFORM_LABELS, type Platform } from "@/lib/platforms";
import { toast } from "sonner";

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

interface OptimiseResult {
  title?: string;
  tags?: string[];
  bullets?: string[];
  metaTitle?: string;
  metaDescription?: string;
  description?: string;
}

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
  const [activePlatform, setActivePlatform] = useState<Platform>("etsy");
  const [productName, setProductName] = useState("");
  const [optimising, setOptimising] = useState(false);
  const [result, setResult] = useState<OptimiseResult | null>(null);
  const [copied, setCopied] = useState(false);

  function toggleCategory(id: string) {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function togglePlatform(p: Platform) {
    setPlatforms((prev) => {
      const next = prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p];
      // keep activePlatform in sync — default to first selected
      if (!next.includes(activePlatform)) {
        setActivePlatform(next[0] ?? "etsy");
      }
      return next;
    });
  }

  async function markComplete() {
    await fetch("/api/onboarding/complete", { method: "POST" });
  }

  async function finish() {
    await markComplete();
    router.push("/dashboard");
  }

  async function skip() {
    await markComplete();
    router.push("/dashboard");
  }

  function goToStep2() {
    // default activePlatform to first selected, or etsy if none picked
    setActivePlatform(platforms[0] ?? "etsy");
    setStep(2);
  }

  async function handleOptimise() {
    if (!productName.trim()) return;
    setOptimising(true);
    setResult(null);
    try {
      const res = await fetch("/api/optimise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: activePlatform, productName: productName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        toast.error(data.error ?? "Something went wrong");
      }
    } catch {
      toast.error("Failed to connect. Please try again.");
    } finally {
      setOptimising(false);
    }
  }

  async function copyTitle() {
    if (!result?.title) return;
    await navigator.clipboard.writeText(result.title);
    setCopied(true);
    toast.success("Copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        {/* Logo */}
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
                onClick={goToStep2}
                disabled={categories.length === 0}
              >
                Continue
                <ArrowRight className="size-3.5" />
              </Button>
              <button
                type="button"
                onClick={skip}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip setup
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                See it in action
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter a product name and we&apos;ll generate an optimised listing.
              </p>
            </div>

            {/* Platform picker for step 2 — only show if they selected platforms */}
            {platforms.length > 1 && (
              <div className="flex justify-center">
                <div className="inline-flex rounded-lg border border-border bg-muted p-1 gap-0.5">
                  {platforms.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setActivePlatform(p); setResult(null); }}
                      className={cn(
                        "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                        activePlatform === p
                          ? "bg-background text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {PLATFORM_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {platforms.length === 0 && (
              <p className="text-center text-xs text-muted-foreground">
                Optimising for{" "}
                <span className="font-medium text-foreground">
                  {PLATFORM_LABELS[activePlatform]}
                </span>
              </p>
            )}

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Handmade ceramic coffee mug"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleOptimise()}
                  className="flex-1"
                />
                <Button
                  onClick={handleOptimise}
                  disabled={optimising || !productName.trim()}
                  className="shrink-0"
                >
                  {optimising ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
                  ) : (
                    <>
                      <Sparkles className="size-3.5" />
                      Optimise
                    </>
                  )}
                </Button>
              </div>

              {optimising && (
                <div className="rounded-xl border border-border/40 bg-muted/30 p-6 text-center">
                  <div className="mx-auto mb-2 size-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                  <p className="text-xs text-muted-foreground">
                    Generating your listing…
                  </p>
                </div>
              )}

              {result && !optimising && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  {result.title && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Title
                        </p>
                        <button
                          onClick={copyTitle}
                          className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copied ? (
                            <Check className="size-3 text-green-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm font-medium leading-relaxed">
                        {result.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {result.title.length} chars
                      </p>
                    </div>
                  )}

                  {result.tags && result.tags.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">
                        Tags
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {result.tags.slice(0, 6).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {result.tags.length > 6 && (
                          <Badge variant="secondary" className="text-xs">
                            +{result.tags.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {result.bullets && result.bullets.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">
                        Bullet points
                      </p>
                      <ul className="space-y-1">
                        {result.bullets.slice(0, 2).map((b, i) => (
                          <li key={i} className="text-xs leading-relaxed flex gap-2">
                            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.metaTitle && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Meta title
                      </p>
                      <p className="text-sm font-medium">{result.metaTitle}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => setStep(3)}
                variant={result ? "default" : "outline"}
              >
                {result ? (
                  <>
                    Continue
                    <ArrowRight className="size-3.5" />
                  </>
                ) : (
                  "Skip this step"
                )}
              </Button>
              {result && (
                <button
                  type="button"
                  onClick={skip}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip to dashboard
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3 */}
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
                  desc: "Paste any listing URL and get a better version instantly.",
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
