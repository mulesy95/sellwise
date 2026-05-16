"use client";

import { useState } from "react";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Copy,
  Check,
  AlertCircle,
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

interface Keyword {
  keyword: string;
  volume: "high" | "medium" | "low";
  competition: "high" | "medium" | "low";
  trend: "up" | "stable" | "down";
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
};

const PLATFORM_DESCRIPTIONS: Record<Platform, string> = {
  etsy: "Discover Etsy keywords with occasion, recipient, and style variations.",
  amazon: "Find Amazon keywords with purchase intent and feature-based terms.",
  shopify: "Find Google SEO keywords for organic traffic to your store.",
  ebay: "Discover eBay search terms including condition and compatibility keywords.",
};

export function KeywordsClient() {
  const [platform, setPlatform] = useState<Platform>("etsy");
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  function handlePlatformChange(p: Platform) {
    setPlatform(p);
    setKeywords([]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const keyword = (
      e.currentTarget.elements.namedItem("keyword") as HTMLInputElement
    ).value.trim();
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
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Search className="size-5 text-primary" />
          Keyword Research
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {PLATFORM_DESCRIPTIONS[platform]}
        </p>
      </div>

      <PlatformSelector value={platform} onChange={handlePlatformChange} />

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
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">{keywords.length} keywords found</CardTitle>
              <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                Vol = search volume · Comp = how many competitors · ↑↓ = trend
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={copyAll}
            >
              <Copy className="size-3" />
              Copy all
            </Button>
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
        <Card className="flex min-h-48 items-center justify-center border-border/30 border-dashed">
          <CardContent className="text-center">
            <Search className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Type a product keyword above and click <span className="font-medium text-foreground">Research</span>.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              You'll get 15 keywords ranked by search volume and competition.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
