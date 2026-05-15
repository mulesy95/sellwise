"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Copy, Check, RotateCcw } from "lucide-react";
import { UpgradeModal } from "@/components/upgrade-modal";
import { PlatformSelector } from "@/components/platform-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { Platform } from "@/lib/platforms";

interface OptimisedListing {
  platform: Platform;
  // Etsy
  title?: string;
  tags?: string[];
  // Amazon
  bullets?: string[];
  backendKeywords?: string;
  // Shopify
  metaTitle?: string;
  metaDescription?: string;
  productTitle?: string;
  // Shared
  description?: string;
}

interface TabConfig {
  id: string;
  label: string;
  content: string | string[];
  maxChars?: number;
  isTags?: boolean;
  isBullets?: boolean;
}

function getResultTabs(result: OptimisedListing): TabConfig[] {
  switch (result.platform) {
    case "etsy":
      return [
        { id: "title", label: "Title", content: result.title ?? "", maxChars: 140 },
        { id: "tags", label: "Tags", content: result.tags ?? [], isTags: true },
        { id: "description", label: "Description", content: result.description ?? "" },
      ];
    case "amazon":
      return [
        { id: "title", label: "Title", content: result.title ?? "", maxChars: 200 },
        { id: "bullets", label: "Bullets", content: result.bullets ?? [], isBullets: true },
        { id: "backend", label: "Backend Keys", content: result.backendKeywords ?? "" },
        { id: "description", label: "Description", content: result.description ?? "" },
      ];
    case "shopify":
      return [
        { id: "metaTitle", label: "Meta Title", content: result.metaTitle ?? "", maxChars: 60 },
        { id: "metaDesc", label: "Meta Desc", content: result.metaDescription ?? "", maxChars: 160 },
        { id: "productTitle", label: "Product Title", content: result.productTitle ?? "" },
        { id: "description", label: "Description", content: result.description ?? "" },
      ];
    case "ebay":
      return [
        { id: "title", label: "Title", content: result.title ?? "", maxChars: 80 },
        { id: "description", label: "Description", content: result.description ?? "" },
      ];
  }
}

const PLATFORM_DESCRIPTIONS: Record<Platform, string> = {
  etsy: "Get an SEO-optimised title, 13 tags, and description.",
  amazon: "Get a keyword-rich title, 5 bullet points, backend keywords, and description.",
  shopify: "Get a meta title, meta description, product title, and page copy.",
  ebay: "Get an optimised listing title and item description.",
};

const LOADING_STEPS: Record<Platform, string[]> = {
  etsy: [
    "Analysing your product…",
    "Researching Etsy keywords…",
    "Writing your title…",
    "Crafting your 13 tags…",
    "Writing your description…",
  ],
  amazon: [
    "Analysing your product…",
    "Researching Amazon keywords…",
    "Writing your title…",
    "Crafting bullet points…",
    "Writing your description…",
  ],
  shopify: [
    "Analysing your product…",
    "Researching SEO keywords…",
    "Writing meta title and description…",
    "Writing product copy…",
  ],
  ebay: [
    "Analysing your product…",
    "Researching eBay keywords…",
    "Writing your title and description…",
  ],
};

function useLoadingStep(loading: boolean, platform: Platform) {
  const [step, setStep] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loading) {
      setStep(0);
      const steps = LOADING_STEPS[platform];
      intervalRef.current = setInterval(() => {
        setStep((s) => (s + 1 < steps.length ? s + 1 : s));
      }, 1800);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setStep(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loading, platform]);

  return LOADING_STEPS[platform][step];
}

export default function OptimisePage() {
  const [platform, setPlatform] = useState<Platform>("etsy");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimisedListing | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const loadingStep = useLoadingStep(loading, platform);

  function handlePlatformChange(p: Platform) {
    setPlatform(p);
    setResult(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const form = e.currentTarget;
    const data = {
      platform,
      productName: (form.elements.namedItem("productName") as HTMLInputElement).value,
      materials: (form.elements.namedItem("materials") as HTMLInputElement).value,
      style: (form.elements.namedItem("style") as HTMLInputElement).value,
      targetBuyer: (form.elements.namedItem("targetBuyer") as HTMLInputElement).value,
      keywords: (form.elements.namedItem("keywords") as HTMLInputElement).value,
    };

    try {
      const res = await fetch("/api/optimise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 402) {
          setUpgradeOpen(true);
          return;
        }
        throw new Error(err.error ?? "Something went wrong");
      }

      const json = await res.json();
      setResult(json);
      window.dispatchEvent(new Event("sellwise:optimised"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to optimise");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string, field: string) {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  }

  const tabs = result ? getResultTabs(result) : [];

  return (
    <div className="space-y-6">
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Sparkles className="size-5 text-primary" />
          Listing Optimiser
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {PLATFORM_DESCRIPTIONS[platform]}
        </p>
      </div>

      <PlatformSelector value={platform} onChange={handlePlatformChange} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input form */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Product details</CardTitle>
            <CardDescription className="text-xs">
              The more detail you give, the better the results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="productName">
                  Product name / what it is{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="productName"
                  name="productName"
                  placeholder="e.g. Handmade ceramic coffee mug"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="materials">Materials &amp; techniques</Label>
                <Input
                  id="materials"
                  name="materials"
                  placeholder="e.g. Stoneware clay, hand-thrown, food-safe glaze"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="style">Style &amp; aesthetic</Label>
                <Input
                  id="style"
                  name="style"
                  placeholder="e.g. Minimalist, rustic, boho, cottagecore"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="targetBuyer">Target buyer / occasion</Label>
                <Input
                  id="targetBuyer"
                  name="targetBuyer"
                  placeholder="e.g. Coffee lovers, housewarming gift, office decor"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="keywords">Keywords to include (optional)</Label>
                <Input
                  id="keywords"
                  name="keywords"
                  placeholder="e.g. unique mug, pottery gift, handmade gift"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <span className="mr-2 inline-block size-3.5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
                    Optimising…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    Optimise listing
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {!result && !loading && (
            <Card className="flex min-h-64 items-center justify-center border-border/30 border-dashed">
              <CardContent className="text-center">
                <Sparkles className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Your optimised listing will appear here.
                </p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="flex min-h-64 items-center justify-center border-border/30">
              <CardContent className="text-center">
                <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                <p className="text-sm font-medium">{loadingStep}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This takes around 10 seconds
                </p>
              </CardContent>
            </Card>
          )}

          {result && tabs.length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Optimised listing</CardTitle>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setResult(null)}
                  title="Start over"
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={tabs[0].id}>
                  <TabsList className="w-full">
                    {tabs.map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="flex-1 text-xs"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {tabs.map((tab) => (
                    <TabsContent key={tab.id} value={tab.id} className="mt-4 space-y-3">
                      {tab.isTags && Array.isArray(tab.content) ? (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-wrap gap-1.5">
                              {(tab.content as string[]).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                copyToClipboard(
                                  (tab.content as string[]).join(", "),
                                  tab.id
                                )
                              }
                            >
                              {copiedField === tab.id ? (
                                <Check className="size-3.5 text-green-500" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </Button>
                          </div>
                          <Separator />
                          <p className="text-xs text-muted-foreground">
                            {(tab.content as string[]).length} / 13 tags
                          </p>
                        </>
                      ) : tab.isBullets && Array.isArray(tab.content) ? (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <ol className="flex-1 space-y-2 list-decimal list-inside">
                              {(tab.content as string[]).map((bullet, i) => (
                                <li key={i} className="text-xs leading-relaxed">
                                  {bullet}
                                </li>
                              ))}
                            </ol>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                copyToClipboard(
                                  (tab.content as string[]).join("\n"),
                                  tab.id
                                )
                              }
                            >
                              {copiedField === tab.id ? (
                                <Check className="size-3.5 text-green-500" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </Button>
                          </div>
                          <Separator />
                          <p className="text-xs text-muted-foreground">
                            {(tab.content as string[]).length} / 5 bullets
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed">
                              {tab.content as string}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                copyToClipboard(tab.content as string, tab.id)
                              }
                            >
                              {copiedField === tab.id ? (
                                <Check className="size-3.5 text-green-500" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </Button>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {(tab.content as string).length}
                              {tab.maxChars ? ` / ${tab.maxChars} characters` : " characters"}
                            </span>
                            {tab.maxChars && (
                              <span
                                className={
                                  (tab.content as string).length <= tab.maxChars
                                    ? "text-green-500"
                                    : "text-destructive"
                                }
                              >
                                {(tab.content as string).length <= tab.maxChars
                                  ? "✓ Good"
                                  : "Too long"}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
