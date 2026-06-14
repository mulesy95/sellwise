"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Copy,
  Check,
  AlertCircle,
  BookmarkPlus,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/upgrade-modal";
import { PlatformSelector } from "@/components/platform-selector";
import type { Platform } from "@/lib/platforms";
import { PLATFORMS } from "@/lib/platforms";

interface Keyword {
  keyword: string;
  volume: "high" | "medium" | "low";
  competition: "high" | "medium" | "low";
  trend: "up" | "stable" | "down";
}

interface SavedList {
  id: string;
  name: string;
  platform: string;
  keywords: string[];
  volumeData: Array<{ volume: string }>;
}

const volumeConfig = {
  high: {
    label: "High",
    className:
      "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20",
  },
  medium: {
    label: "Med",
    className:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  low: {
    label: "Low",
    className: "bg-muted text-muted-foreground border-border",
  },
};

const competitionConfig = {
  high: {
    label: "High comp",
    className:
      "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20",
  },
  medium: {
    label: "Med comp",
    className:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  low: {
    label: "Low comp",
    className:
      "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20",
  },
};

function computePowerLevel(keywords: Array<{ volume: string }>): "high" | "medium" | "low" {
  if (keywords.length === 0) return "low";
  const highCount = keywords.filter((k) => k.volume === "high").length;
  const ratio = highCount / keywords.length;
  if (ratio >= 0.5) return "high";
  if (ratio >= 0.2) return "medium";
  return "low";
}

const POWER_LEVEL_CONFIG = {
  high: { label: "High power", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
  medium: { label: "Med power", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  low: { label: "Low power", className: "bg-muted text-muted-foreground border-border" },
} as const;

const TrendIcon = ({ trend }: { trend: "up" | "stable" | "down" }) => {
  if (trend === "up")
    return <TrendingUp className="size-3.5 text-emerald-600 dark:text-emerald-400" />;
  if (trend === "down")
    return <TrendingDown className="size-3.5 text-red-600 dark:text-red-400" />;
  return <Minus className="size-3.5 text-muted-foreground" />;
};

const PLATFORM_PLACEHOLDERS: Record<Platform, string> = {
  etsy: "e.g. ceramic mug, macrame wall art, silver ring",
  amazon: "e.g. wireless earbuds, protein powder, yoga mat",
  shopify: "e.g. leather wallet, skincare serum, coffee beans",
  ebay: "e.g. vintage camera, car parts, gaming console",
  woocommerce: "e.g. coffee beans, linen bedding, yoga mat",
  wix: "e.g. handmade candle, art print, jewellery",
  squarespace: "e.g. ceramic vase, linen shirt, wood furniture",
  tiktok: "e.g. skincare routine, aesthetic lamp, viral gadget",
  social: "e.g. handmade gift, home decor, sustainable fashion",
};

const PLATFORM_DESCRIPTIONS: Record<Platform, string> = {
  etsy: "Discover Etsy keywords with occasion, recipient, and style variations.",
  amazon: "Find Amazon keywords with purchase intent and feature-based terms.",
  shopify: "Find Google SEO keywords for organic traffic to your store.",
  ebay: "Discover eBay search terms including condition and compatibility keywords.",
  woocommerce: "Find Google SEO keywords to drive organic traffic to your WooCommerce store.",
  wix: "Find Google SEO keywords that bring shoppers to your Wix store.",
  squarespace: "Find Google SEO keywords that bring buyers to your Squarespace store.",
  tiktok: "Discover trending TikTok search terms and discovery keywords for your product.",
  social: "Find hashtags and discovery terms for Instagram, Pinterest, and Facebook.",
};

export function KeywordsClient({ preferredPlatforms }: { preferredPlatforms: Platform[] }) {
  const searchParams = useSearchParams();
  const [platform, setPlatform] = useState<Platform>("shopify");
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveListName, setSaveListName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [seedValue, setSeedValue] = useState("");
  const didInitRef = useRef(false);

  const visiblePlatforms: Platform[] =
    showAllPlatforms || preferredPlatforms.length === 0
      ? PLATFORMS
      : preferredPlatforms;

  // Read sessionStorage on mount (must be in useEffect — not in useState — to avoid SSR crash)
  useEffect(() => {
    const saved = sessionStorage.getItem("sw_active_platform") as Platform | null;
    if (saved && PLATFORMS.includes(saved)) setPlatform(saved);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset platform if current selection is hidden
  useEffect(() => {
    if (!visiblePlatforms.includes(platform)) {
      setPlatform(visiblePlatforms[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAllPlatforms]);

  useEffect(() => {
    fetch("/api/keyword-lists")
      .then((r) => r.json())
      .then((d) => setSavedLists(d.lists ?? []))
      .catch(() => setSavedLists([]));
  }, []);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    const seed = searchParams.get("seed");
    const urlPlatform = searchParams.get("platform") as Platform | null;
    if (seed) setSeedValue(seed);
    if (urlPlatform && PLATFORMS.includes(urlPlatform)) {
      setPlatform(urlPlatform);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePlatformChange(p: Platform) {
    setPlatform(p);
    setKeywords([]);
    setShowSaveInput(false);
    setSaveListName("");
  }

  async function handleSaveList() {
    const name = saveListName.trim();
    if (!name || keywords.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/keyword-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, platform, keywords }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed to save");
      toast.success(`"${name}" saved to your keyword lists`);
      setShowSaveInput(false);
      setSaveListName("");
      // Refresh saved lists
      fetch("/api/keyword-lists")
        .then((r) => r.json())
        .then((d) => setSavedLists(d.lists ?? []))
        .catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save list");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const keyword = seedValue.trim();
    if (!keyword) return;

    setLoading(true);
    setKeywords([]);
    setError(null);

    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, keyword }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 402) {
          setUpgradeOpen(true);
          return;
        }
        throw new Error(err.error ?? "Something went wrong");
      }

      const data = await res.json();
      setKeywords(data.keywords ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch keywords");
    } finally {
      setLoading(false);
    }
  }

  async function copyKeyword(kw: string) {
    await navigator.clipboard.writeText(kw);
    setCopied(kw);
    toast.success("Copied");
    setTimeout(() => setCopied(null), 2000);
  }

  async function copyAll() {
    await navigator.clipboard.writeText(
      keywords.map((k) => k.keyword).join("\n")
    );
    toast.success("All keywords copied");
  }

  return (
    <div className="space-y-6">
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason="feature" />

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Search className="size-5 text-primary" />
          Keyword Research
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {PLATFORM_DESCRIPTIONS[platform]}
        </p>
      </div>

      <PlatformSelector value={platform} onChange={handlePlatformChange} visiblePlatforms={visiblePlatforms} />
      {preferredPlatforms.length > 0 && (
        <button
          type="button"
          onClick={() => setShowAllPlatforms((v) => !v)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAllPlatforms ? "Show my platforms only" : "Show all platforms"}
        </button>
      )}

      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Seed keyword</CardTitle>
          <CardDescription className="text-xs">
            Enter a product type, material, or style to explore related
            keywords.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="keyword" className="sr-only">
                Keyword
              </Label>
              <Input
                id="keyword"
                name="keyword"
                value={seedValue}
                onChange={(e) => setSeedValue(e.target.value)}
                placeholder={PLATFORM_PLACEHOLDERS[platform]}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="shrink-0">
              {loading ? (
                <Spinner size="md" />
              ) : (
                <>
                  <Search className="size-3.5" />
                  Research
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading && (
        <Card className="flex min-h-48 items-center justify-center border-border/30">
          <CardContent className="text-center">
            <Spinner size="lg" className="mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Finding keywords…</p>
          </CardContent>
        </Card>
      )}

      {keywords.length > 0 && !loading && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{keywords.length} keywords found</CardTitle>
                <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                  Vol = search volume · Comp = competition level · ↑↓ = trend · AI estimates, not live platform data
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={copyAll}
                >
                  <Copy className="size-3" />
                  Copy all
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowSaveInput((v) => !v)}
                >
                  <BookmarkPlus className="size-3" />
                  Save list
                </Button>
              </div>
            </div>
            {showSaveInput && (
              <div className="mt-3 flex gap-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="List name, e.g. Vintage cameras"
                  value={saveListName}
                  onChange={(e) => setSaveListName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveList(); if (e.key === "Escape") setShowSaveInput(false); }}
                  className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleSaveList}
                  disabled={saving || !saveListName.trim()}
                >
                  {saving ? <Spinner size="sm" /> : "Save"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {keywords.map((kw) => (
                <div
                  key={kw.keyword}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-muted/30 transition-colors"
                >
                  <span className="flex-1 text-sm font-medium">
                    {kw.keyword}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={`text-xs h-5 px-1.5 ${volumeConfig[kw.volume].className}`}
                    >
                      {volumeConfig[kw.volume].label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs h-5 px-1.5 ${competitionConfig[kw.competition].className}`}
                    >
                      {competitionConfig[kw.competition].label}
                    </Badge>
                    <TrendIcon trend={kw.trend} />
                    <button
                      onClick={() => copyKeyword(kw.keyword)}
                      className="ml-1 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      title="Copy keyword"
                    >
                      {copied === kw.keyword ? (
                        <Check className="size-3 text-primary" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Keyword search failed</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
          </CardContent>
        </Card>
      )}

      {!loading && keywords.length === 0 && !error && (
        <div className="rounded-xl border border-border/40 bg-muted/20 p-6 text-center space-y-3">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10">
            <Search className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Find keywords buyers actually search for</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Enter a product type above and we&apos;ll return 15 keywords with volume, competition, and trend signals — specific to {platform}.
            </p>
          </div>
          {savedLists.length > 0 && (
            <p className="text-xs text-muted-foreground/60">
              You have {savedLists.length} saved list{savedLists.length !== 1 ? "s" : ""} — use them in the optimiser via the keyword picker.
            </p>
          )}
        </div>
      )}

      {savedLists.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="size-4 text-muted-foreground" />
              Saved keyword lists
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {savedLists.map((list) => {
                const level = computePowerLevel(list.volumeData ?? []);
                const cfg = POWER_LEVEL_CONFIG[level];
                return (
                  <div key={list.id} className="flex items-center gap-3 px-6 py-3">
                    <span className="flex-1 text-sm font-medium">{list.name}</span>
                    <span className="text-xs text-muted-foreground">{list.keywords.length} keywords</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-5 px-1.5 font-semibold ${cfg.className}`}
                    >
                      {cfg.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
