"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sparkles, Copy, Check, RotateCcw, RefreshCw, Download, ImagePlus, X, Lock, AlertCircle, ChevronDown, ThumbsUp, ThumbsDown, Lightbulb, Search, Plus, TrendingUp, ExternalLink, Share2, History, Upload, Store } from "lucide-react";
import { UpgradeModal } from "@/components/upgrade-modal";
import { Spinner } from "@/components/ui/spinner";
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
import { PLATFORMS, PLATFORM_LABELS } from "@/lib/platforms";
import { shareScore as nativeShareScore, buildShareLinks } from "@/lib/share-score";
import { ListingDiff } from "@/components/listing-diff";
import { scoreOptimisedListing, scoreWithBreakdown } from "@/lib/listing-score";
import type { ScoredListing, ScoreDeduction } from "@/lib/listing-score";
import { showBigLiftToast } from "@/components/big-lift-toast";
import { cn } from "@/lib/utils";
import { getFieldHint } from "@/lib/field-hints";

interface ChangeNote {
  field: string;
  reason: string;
}

interface ShopRecord {
  id: string;
  shop_name: string;
  platform: string;
}

interface PickableProduct {
  id: string;
  title: string;
}

interface OptimisedListing {
  id?: string;
  platform: Platform;
  title?: string;
  tags?: string[];
  bullets?: string[];
  backendKeywords?: string;
  metaTitle?: string;
  metaDescription?: string;
  productTitle?: string;
  shortDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
  caption?: string;
  postCopy?: string;
  hashtags?: string[];
  itemSpecifics?: Record<string, string>;
  description?: string;
  original?: Record<string, string | string[]>;
  changes?: ChangeNote[];
  topPercent?: boolean;
}

interface TabConfig {
  id: string;
  label: string;
  fieldKey: keyof Omit<OptimisedListing, "platform" | "original" | "changes">;
  content: string | string[];
  maxChars?: number;
  isTags?: boolean;
  isBullets?: boolean;
}

function getResultTabs(result: OptimisedListing): TabConfig[] {
  switch (result.platform) {
    case "etsy":
      return [
        { id: "title", label: "Title", fieldKey: "title", content: result.title ?? "", maxChars: 140 },
        { id: "tags", label: "Tags", fieldKey: "tags", content: result.tags ?? [], isTags: true },
        { id: "description", label: "Description", fieldKey: "description", content: result.description ?? "" },
      ];
    case "amazon":
      return [
        { id: "title", label: "Title", fieldKey: "title", content: result.title ?? "", maxChars: 200 },
        { id: "bullets", label: "Bullets", fieldKey: "bullets", content: result.bullets ?? [], isBullets: true },
        { id: "backend", label: "Search Terms", fieldKey: "backendKeywords", content: result.backendKeywords ?? "", maxChars: 250 },
        { id: "description", label: "Description", fieldKey: "description", content: result.description ?? "" },
      ];
    case "shopify":
      return [
        { id: "metaTitle", label: "Meta Title", fieldKey: "metaTitle", content: result.metaTitle ?? "", maxChars: 60 },
        { id: "metaDesc", label: "Meta Desc", fieldKey: "metaDescription", content: result.metaDescription ?? "", maxChars: 160 },
        { id: "productTitle", label: "Product Title", fieldKey: "productTitle", content: result.productTitle ?? "" },
        { id: "description", label: "Description", fieldKey: "description", content: result.description ?? "" },
      ];
    case "ebay":
      return [
        { id: "title", label: "Title", fieldKey: "title", content: result.title ?? "", maxChars: 80 },
        { id: "description", label: "Description", fieldKey: "description", content: result.description ?? "" },
        ...(result.itemSpecifics && Object.keys(result.itemSpecifics).length > 0
          ? [{ id: "itemSpecifics", label: "Item Specifics", fieldKey: "itemSpecifics" as const, content: Object.entries(result.itemSpecifics).map(([k, v]) => `${k}: ${v}`).join("\n") }]
          : []),
      ];
    case "woocommerce":
      return [
        { id: "seoTitle", label: "SEO Title", fieldKey: "seoTitle", content: result.seoTitle ?? "", maxChars: 60 },
        { id: "seoDesc", label: "SEO Desc", fieldKey: "seoDescription", content: result.seoDescription ?? "", maxChars: 160 },
        { id: "productTitle", label: "Product Title", fieldKey: "productTitle", content: result.productTitle ?? "" },
        { id: "shortDesc", label: "Short Desc", fieldKey: "shortDescription", content: result.shortDescription ?? "", maxChars: 150 },
        { id: "description", label: "Description", fieldKey: "description", content: result.description ?? "" },
      ];
    case "wix":
    case "squarespace":
      return [
        { id: "seoTitle", label: "SEO Title", fieldKey: "seoTitle", content: result.seoTitle ?? "", maxChars: 60 },
        { id: "seoDesc", label: "SEO Desc", fieldKey: "seoDescription", content: result.seoDescription ?? "", maxChars: 160 },
        { id: "productTitle", label: "Product Title", fieldKey: "productTitle", content: result.productTitle ?? "" },
        { id: "description", label: "Description", fieldKey: "description", content: result.description ?? "" },
      ];
    case "tiktok":
      return [
        { id: "title", label: "Title", fieldKey: "title", content: result.title ?? "", maxChars: 100 },
        { id: "description", label: "Description", fieldKey: "description", content: result.description ?? "" },
      ];
    case "social":
      return [
        { id: "caption", label: "Caption", fieldKey: "caption", content: result.caption ?? "", maxChars: 125 },
        { id: "postCopy", label: "Post Copy", fieldKey: "postCopy", content: result.postCopy ?? "" },
        { id: "hashtags", label: "Hashtags", fieldKey: "hashtags", content: result.hashtags ?? [], isTags: true },
      ];
  }
}

const HIGH_SCORE_NOTES: string[] = [
  "That title is front-loaded well — the algorithm will notice.",
  "Strong keyword density without reading like a keyword list.",
  "The description opens on the right detail.",
  "Clean and specific — exactly what platform search rewards.",
  "Good structure. The first line does the heavy lifting.",
];

function getMicroNote(id: string | undefined, score: number): string | null {
  if (!id || score < 80) return null;
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  if (hash % 10 > 2) return null; // ~70% suppressed, ~30% shown
  return HIGH_SCORE_NOTES[hash % HIGH_SCORE_NOTES.length];
}

const PLATFORM_DESCRIPTIONS: Record<Platform, string> = {
  etsy: "Get an SEO-optimised title, 13 tags, and description.",
  amazon: "Get a keyword-rich title, 5 bullet points, backend keywords, and description.",
  shopify: "Get a meta title, meta description, product title, and page copy.",
  ebay: "Get an optimised listing title and item description.",
  woocommerce: "Get a product title, short description, full copy, and Yoast/Rank Math SEO fields.",
  wix: "Get a product title, full page copy, and SEO title and description for your Wix store.",
  squarespace: "Get a product title, elevated page copy, and SEO title and description for your Squarespace store.",
  tiktok: "Get a keyword-rich TikTok Shop title and scroll-stopping product description.",
  social: "Get a scroll-stopping caption, full post copy, and hashtags for Instagram, Facebook, or Pinterest.",
};

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

const LOADING_STEPS: Record<Platform, string[]> = {
  etsy: ["Analysing your product…", "Researching Etsy keywords…", "Writing your title…", "Crafting your 13 tags…", "Writing your description…"],
  amazon: ["Analysing your product…", "Researching Amazon keywords…", "Writing your title…", "Crafting bullet points…", "Writing your description…"],
  shopify: ["Analysing your product…", "Researching SEO keywords…", "Writing meta title and description…", "Writing product copy…"],
  ebay: ["Analysing your product…", "Researching eBay keywords…", "Writing your title and description…"],
  woocommerce: ["Analysing your product…", "Researching Google keywords…", "Writing SEO title and description…", "Writing product copy…"],
  wix: ["Analysing your product…", "Researching keywords…", "Writing SEO fields…", "Writing product copy…"],
  squarespace: ["Analysing your product…", "Researching keywords…", "Writing SEO fields…", "Writing product copy…"],
  tiktok: ["Analysing your product…", "Researching TikTok trends…", "Writing your listing…"],
  social: ["Analysing your product…", "Writing your caption hook…", "Crafting hashtags…"],
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

const HOP_PLATFORMS: { id: Platform; label: string }[] = [
  { id: "etsy", label: "Etsy" },
  { id: "amazon", label: "Amazon" },
  { id: "shopify", label: "Shopify" },
  { id: "ebay", label: "eBay" },
];

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

interface KeywordList {
  id: string;
  name: string;
  keywords: string[];
}

interface FormValues {
  productName: string;
  materials: string;
  style: string;
  targetBuyer: string;
  existingContent: string;
}

const FORM_STORAGE_KEY = "optimise:form";

function useCountUp(target: number, duration = 1100): number {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    setCount(0);
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return count;
}

function ScoreDisplay({ before, after }: { before?: number; after: number }) {
  const displayAfter = useCountUp(after);
  const color = (s: number) =>
    s >= 70 ? "text-emerald-600 dark:text-emerald-400"
    : s >= 40 ? "text-amber-600 dark:text-amber-400"
    : "text-red-600 dark:text-red-400";
  const delta = before !== undefined ? after - before : null;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-4 py-3">
      {before !== undefined && (
        <>
          <div className="text-center">
            <p className={cn("text-2xl font-bold tabular-nums leading-none", color(before))}>{before}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Before</p>
          </div>
          <span className="text-muted-foreground/50">→</span>
        </>
      )}
      <div className="text-center">
        <p className={cn("text-2xl font-bold tabular-nums leading-none", color(displayAfter))}>{displayAfter}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{before !== undefined ? "After" : "SEO Score"}</p>
      </div>
      {delta !== null && (
        <div className={cn("text-xs font-semibold", delta >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
          {delta >= 0 ? "+" : ""}{delta}
        </div>
      )}
      <div className="ml-auto text-[10px] text-muted-foreground/50">/ 100</div>
    </div>
  );
}

function ScoreDeductionsList({ deductions }: { deductions: ScoreDeduction[] }) {
  if (deductions.length === 0) return null;
  return (
    <div className="space-y-1.5 px-1">
      {deductions.map((d, i) => (
        <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
          <span className="shrink-0 font-medium text-destructive/80">−{d.points}</span>
          <span>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function serialiseResult(result: OptimisedListing): string {
  const parts: string[] = [];
  if (result.title) parts.push(`Title: ${result.title}`);
  if (result.metaTitle) parts.push(`Meta Title: ${result.metaTitle}`);
  if (result.metaDescription) parts.push(`Meta Description: ${result.metaDescription}`);
  if (result.productTitle) parts.push(`Product Title: ${result.productTitle}`);
  if (result.seoTitle) parts.push(`SEO Title: ${result.seoTitle}`);
  if (result.seoDescription) parts.push(`SEO Description: ${result.seoDescription}`);
  if (result.tags?.length) parts.push(`Tags: ${result.tags.join(", ")}`);
  if (result.bullets?.length) parts.push(`Bullet Points:\n${result.bullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}`);
  if (result.backendKeywords) parts.push(`Backend Keywords: ${result.backendKeywords}`);
  if (result.description) parts.push(`Description:\n${result.description}`);
  if (result.caption) parts.push(`Caption: ${result.caption}`);
  if (result.postCopy) parts.push(`Post Copy:\n${result.postCopy}`);
  if (result.hashtags?.length) parts.push(`Hashtags: ${result.hashtags.join(" ")}`);
  return parts.join("\n\n");
}

function buildImproveInstruction(deductions: ScoreDeduction[]): string {
  if (deductions.length === 0) return "";
  return `\n\n---\nPlease specifically address these issues in your revision:\n${deductions.map((d) => `- ${d.label}`).join("\n")}`;
}

function RescuePanel({ deductions, onImprove, onReset }: {
  deductions: ScoreDeduction[];
  onImprove: () => void;
  onReset: () => void;
}) {
  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
          Score under 60 — here&apos;s what to fix
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          onClick={onImprove}
          className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-background p-3 text-xs hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors text-left w-full"
        >
          <RefreshCw className="size-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium text-amber-700 dark:text-amber-400">Improve this listing</p>
            <p className="text-muted-foreground mt-0.5">
              {deductions.length > 0
                ? `We'll pre-fill the form with the specific fixes needed and re-run.`
                : "We'll load the output back into the form so you can refine it."}
            </p>
          </div>
        </button>
        <Link
          href="/dashboard/keywords"
          className="flex items-start gap-2 rounded-md border border-border/60 bg-background p-3 text-xs hover:border-border hover:bg-muted/30 transition-colors"
        >
          <Search className="size-3.5 shrink-0 mt-0.5 text-muted-foreground" />
          <div>
            <p className="font-medium">Research keywords first</p>
            <p className="text-muted-foreground mt-0.5">Pull 15 keywords, come back and add them to get a higher score.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function WhatNextStrip({ onReset, hideKeywords }: { onReset: () => void; hideKeywords?: boolean }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
      <p className="text-xs font-medium text-muted-foreground">What next?</p>
      <div className={`grid gap-2 ${hideKeywords ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        {!hideKeywords && (
          <Link
            href="/dashboard/keywords"
            className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-3 py-2 text-xs font-medium hover:border-border hover:bg-muted/30 transition-colors"
          >
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            Research keywords
          </Link>
        )}
        <button
          onClick={onReset}
          className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-3 py-2 text-xs font-medium hover:border-border hover:bg-muted/30 transition-colors text-left w-full"
        >
          <Plus className="size-3.5 shrink-0 text-muted-foreground" />
          Start a new listing
        </button>
        <Link
          href="/dashboard/history"
          className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-3 py-2 text-xs font-medium hover:border-border hover:bg-muted/30 transition-colors"
        >
          <History className="size-3.5 shrink-0 text-muted-foreground" />
          View history
        </Link>
      </div>
    </div>
  );
}

function PushToShopModal({
  result,
  platform,
  shops,
  onClose,
}: {
  result: OptimisedListing;
  platform: Platform;
  shops: ShopRecord[];
  onClose: () => void;
}) {
  const [selectedShopId, setSelectedShopId] = useState<string>(
    shops.length === 1 ? shops[0].id : ""
  );
  const [products, setProducts] = useState<PickableProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!selectedShopId) return;
    setProducts([]);
    setSelectedProductId("");
    setProductsLoading(true);
    const url = platform === "shopify"
      ? `/api/shopify/listings?shopId=${selectedShopId}`
      : `/api/ebay/listings?shopId=${selectedShopId}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        const items: PickableProduct[] = platform === "shopify"
          ? (d.products ?? []).map((p: { id: string; title: string }) => ({ id: p.id, title: p.title }))
          : (d.listings ?? []).map((l: { id: string; title: string }) => ({ id: l.id, title: l.title }));
        setProducts(items);
      })
      .catch(() => setError("Could not load listings. Check your store connection."))
      .finally(() => setProductsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShopId]);

  async function handlePush() {
    if (!selectedProductId || !selectedShopId) return;
    setPushing(true);
    setError(null);
    try {
      let res: Response;
      if (platform === "shopify") {
        res = await fetch("/api/shopify/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopId: selectedShopId,
            productId: selectedProductId,
            title: result.productTitle ?? result.title,
            body_html: result.description,
          }),
        });
      } else {
        res = await fetch("/api/ebay/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopId: selectedShopId,
            itemId: selectedProductId,
            title: result.title,
            description: result.description,
          }),
        });
      }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Push failed");
      }
      setDone(true);
      toast.success("Listing updated in your shop");
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Push failed. Please try again.");
    } finally {
      setPushing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Push to shop</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Select a product to update with this {platform === "shopify" ? "title and description" : "title and description"}.
            </CardDescription>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors ml-2 shrink-0">
            <X className="size-4" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          {shops.length > 1 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Store</p>
              <div className="space-y-1">
                {shops.map((shop) => (
                  <button
                    key={shop.id}
                    onClick={() => setSelectedShopId(shop.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm text-left transition-colors",
                      selectedShopId === shop.id
                        ? "border-primary/50 bg-primary/5 text-foreground"
                        : "border-border/60 text-muted-foreground hover:border-border hover:bg-muted/30"
                    )}
                  >
                    <Store className="size-3.5 shrink-0" />
                    {shop.shop_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedShopId && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Select product to update</p>
              {productsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Spinner size="md" />
                </div>
              ) : products.length === 0 && !error ? (
                <p className="text-xs text-muted-foreground py-2">No listings found in this store.</p>
              ) : (
                <div className="max-h-52 overflow-y-auto rounded-md border border-border/50">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProductId(p.id)}
                      className={cn(
                        "w-full px-3 py-2.5 text-xs text-left transition-colors border-b border-border/40 last:border-b-0",
                        selectedProductId === p.id
                          ? "bg-primary/10 text-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      )}
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="flex items-start gap-1.5 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
              {error}
            </p>
          )}

          {done && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <Check className="size-3.5" />
              Listing updated successfully
            </p>
          )}
        </CardContent>
        <div className="flex justify-end gap-2 px-6 pb-5">
          <Button variant="outline" size="sm" onClick={onClose} className="h-7 text-xs" disabled={pushing}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs gap-1.5"
            disabled={!selectedProductId || pushing || done}
            onClick={handlePush}
          >
            {pushing ? (
              <><Spinner size="sm" />Pushing…</>
            ) : (
              <><Upload className="size-3" />Push to shop</>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function TrialBanner() {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-medium">Want to do this for every listing?</p>
        <p className="text-xs text-muted-foreground">Start a 7-day free trial. No card required.</p>
      </div>
      <Link
        href="/pricing?trial=true"
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
      >
        Start free trial
      </Link>
    </div>
  );
}

export function OptimiseClient({
  plan,
  preferredPlatforms,
  connectedShops = [],
}: {
  plan: string;
  preferredPlatforms: Platform[];
  connectedShops?: ShopRecord[];
}) {
  const searchParams = useSearchParams();

  const [platform, setPlatform] = useState<Platform>((searchParams.get("platform") ?? "shopify") as Platform);
  const [formValues, setFormValues] = useState<FormValues>({
    productName: searchParams.get("productName") ?? "",
    materials: searchParams.get("materials") ?? "",
    style: searchParams.get("style") ?? "",
    targetBuyer: searchParams.get("targetBuyer") ?? "",
    existingContent: searchParams.get("existingContent") ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimisedListing | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<"limit" | "feature" | "trial_expired">("limit");
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<ImageMediaType>("image/jpeg");
  const [keywordLists, setKeywordLists] = useState<KeywordList[]>([]);
  const [keywordsValue, setKeywordsValue] = useState(searchParams.get("keywords") ?? "");
  const [showListPicker, setShowListPicker] = useState(false);
  const [showMoreDetail, setShowMoreDetail] = useState(true);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [lockedDesc, setLockedDesc] = useState<string | undefined>(undefined);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [animReveal, setAnimReveal] = useState(0);
  const [pushModalOpen, setPushModalOpen] = useState(false);
  const [showShareFallback, setShowShareFallback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  type SuggestionState = { text: string; loading: boolean };
  const [suggestions, setSuggestions] = useState<Record<"style" | "targetBuyer", SuggestionState>>({
    style: { text: "", loading: false },
    targetBuyer: { text: "", loading: false },
  });
  const suggestionCache = useRef<Map<string, string>>(new Map());
  const suggestionAbortRefs = useRef<Record<"style" | "targetBuyer", AbortController | null>>({
    style: null,
    targetBuyer: null,
  });

  const visiblePlatforms: Platform[] =
    showAllPlatforms || preferredPlatforms.length === 0
      ? PLATFORMS
      : preferredPlatforms;

  // Reset platform if current selection is hidden
  useEffect(() => {
    if (!visiblePlatforms.includes(platform)) {
      setPlatform(visiblePlatforms[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAllPlatforms]);
  const loadingStep = useLoadingStep(loading, platform);
  const canUploadImage = plan !== "free";

  // Read localStorage on mount to sync platform (must be in useEffect — not render body — to avoid SSR crash)
  useEffect(() => {
    if (!searchParams.get("platform")) {
      const saved = localStorage.getItem("sw_active_platform") as Platform | null;
      if (saved && PLATFORMS.includes(saved)) setPlatform(saved);
    }
    // Also check for prefill written by audit "Optimise this listing" (FIX 4)
    const prefill = sessionStorage.getItem("sw:optimise:prefill");
    if (prefill) {
      try {
        const data = JSON.parse(prefill) as Record<string, string>;
        sessionStorage.removeItem("sw:optimise:prefill");
        if (data.platform && PLATFORMS.includes(data.platform as Platform)) {
          setPlatform(data.platform as Platform);
        }
        setFormValues((v) => ({
          ...v,
          productName: data.productName ?? v.productName,
          materials: data.materials ?? v.materials,
          style: data.style ?? v.style,
          targetBuyer: data.targetBuyer ?? v.targetBuyer,
          existingContent: data.existingContent ?? v.existingContent,
        }));
        if (data.keywords) setKeywordsValue(data.keywords);
      } catch {
        // ignore bad prefill data
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore form from localStorage only when no URL params pre-fill
  useEffect(() => {
    if (!searchParams.get("productName")) {
      try {
        const saved = localStorage.getItem(FORM_STORAGE_KEY);
        if (saved) setFormValues(JSON.parse(saved));
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist form to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formValues));
    } catch {}
  }, [formValues]);

  useEffect(() => {
    fetch(`/api/keyword-lists?platform=${platform}`)
      .then((r) => r.json())
      .then((d) => setKeywordLists(d.lists ?? []))
      .catch(() => setKeywordLists([]));
  }, [platform]);

  useEffect(() => {
    setSuggestions({ style: { text: "", loading: false }, targetBuyer: { text: "", loading: false } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues.productName, platform]);

  // Abort in-flight suggestion requests on unmount
  useEffect(() => {
    return () => {
      suggestionAbortRefs.current.style?.abort();
      suggestionAbortRefs.current.targetBuyer?.abort();
    };
  }, []);

  // Staggered reveal animation — fires each time a new result arrives
  useEffect(() => {
    if (!result) { setAnimReveal(0); return; }
    setAnimReveal(0);
    const tabs = getResultTabs(result);
    const timers = tabs.map((_, i) =>
      setTimeout(() => setAnimReveal(i + 1), i * 60)
    );
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  function setField(key: keyof FormValues) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormValues((v) => ({ ...v, [key]: e.target.value }));
  }

  async function submitFeedback(value: "up" | "down") {
    if (!result?.id) return;
    setSubmittingFeedback(true);
    const previous = feedback;
    const next = feedback === value ? null : value;
    setFeedback(next);
    try {
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optimisationId: result.id, feedback: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setFeedback(previous);
      toast.error("Could not save feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  }

  function handlePlatformChange(p: Platform) {
    setPlatform(p);
    localStorage.setItem("sw_active_platform", p);
    setResult(null);
    setKeywordsValue("");
    setShowListPicker(false);
    setFormValues((v) => ({ ...v, existingContent: "" }));
    setSuggestions({ style: { text: "", loading: false }, targetBuyer: { text: "", loading: false } });
  }

  function handleReset() {
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleShareScore(score: number, before: number | null) {
    const triggered = await nativeShareScore({
      score,
      platform: PLATFORM_LABELS[platform],
      before,
      shareUrl: "https://sellwise.au",
    });
    if (!triggered) setShowShareFallback(true);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image must be under 20 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const result = await compressImage(dataUrl).catch(() => {
        toast.error("Could not read the image. Try a different file.");
        return null;
      });
      if (!result) return;
      setImagePreview(result.dataUrl);
      setImageBase64(result.b64);
      setImageMediaType(result.mediaType);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function compressImage(dataUrl: string): Promise<{ dataUrl: string; b64: string; mediaType: ImageMediaType }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.onload = () => {
        const MAX_DIM = 1568; // Anthropic's recommended max dimension
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        // Target ~3.5MB base64 budget (Anthropic max is 5MB, leave headroom for the rest of the request)
        const TARGET_BYTES = 3.5 * 1024 * 1024;
        let quality = 0.85;
        let compressed = canvas.toDataURL("image/jpeg", quality);
        // Each base64 char ≈ 0.75 bytes
        while (compressed.length * 0.75 > TARGET_BYTES && quality > 0.3) {
          quality = Math.round((quality - 0.1) * 10) / 10;
          compressed = canvas.toDataURL("image/jpeg", quality);
        }
        const b64 = compressed.split(",")[1];
        resolve({ dataUrl: compressed, b64, mediaType: "image/jpeg" });
      };
      img.src = dataUrl;
    });
  }

  function clearImage() {
    setImagePreview(null);
    setImageBase64(null);
  }

  async function fetchSuggestion(field: "style" | "targetBuyer") {
    const productName = formValues.productName.trim();
    if (!productName) return;
    const cacheKey = `${platform}:${field}:${productName.toLowerCase()}`;
    if (suggestionCache.current.has(cacheKey)) {
      setSuggestions((prev) => ({
        ...prev,
        [field]: { text: suggestionCache.current.get(cacheKey)!, loading: false },
      }));
      return;
    }
    // Abort any previous in-flight request for this field
    suggestionAbortRefs.current[field]?.abort();
    const controller = new AbortController();
    suggestionAbortRefs.current[field] = controller;
    setSuggestions((prev) => ({ ...prev, [field]: { text: "", loading: true } }));
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          productName,
          field,
          currentValue: field === "style" ? formValues.style : formValues.targetBuyer,
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.suggestion && !controller.signal.aborted) {
        suggestionCache.current.set(cacheKey, data.suggestion);
        setSuggestions((prev) => ({ ...prev, [field]: { text: data.suggestion, loading: false } }));
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setSuggestions((prev) => ({ ...prev, [field]: { text: "", loading: false } }));
    }
  }

  function buildPayload(targetPlatform?: Platform): Record<string, unknown> {
    const data: Record<string, unknown> = {
      platform: targetPlatform ?? platform,
      ...formValues,
      keywords: keywordsValue,
    };
    if (imageBase64 && canUploadImage) {
      data.imageBase64 = imageBase64;
      data.imageMediaType = imageMediaType;
    }
    return data;
  }

  async function callOptimiseAPI(data: Record<string, unknown>) {
    const previousResult = result;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/optimise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        if (res.status === 402) {
          setResult(previousResult);
          setUpgradeReason(err.code === "TRIAL_EXPIRED" ? "trial_expired" : "limit");
          setUpgradeOpen(true);
          return;
        }
        const code = err.error ?? "";
        if (code === "LIMIT_EXCEEDED") throw new Error("You've used all your optimisations this month. Don't let your listings fall behind — upgrade to keep going.");
        if (code === "FEATURE_GATED") throw new Error("This feature is on paid plans. Start a 7-day trial — no card needed.");
        if (code === "AI_UNAVAILABLE") throw new Error("Our AI is temporarily unavailable. Please try again in a moment.");
        throw new Error(code || "Something went wrong. Please try again — if it keeps happening, check our status page.");
      }
      const json = await res.json();
      setResult(json);
      setFeedback(null);

      // Big Lift toast — fires on re-optimisation (existingContent provided) when score improves 30+
      const newAfterScore = scoreOptimisedListing(json as ScoredListing, { userKeywords: keywordsValue });
      const newBeforeScore =
        json.original != null
          ? scoreOptimisedListing({
              platform: json.platform as Platform,
              ...(json.original as Record<string, unknown>),
            } as ScoredListing)
          : null;
      if (newBeforeScore !== null && newAfterScore - newBeforeScore >= 30) {
        showBigLiftToast(newAfterScore - newBeforeScore);
      }

      window.dispatchEvent(new Event("sellwise:optimised"));
      void fetch("/api/streak", { method: "POST" }).catch(() => null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again — if it keeps happening, check our status page.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await callOptimiseAPI(buildPayload());
  }

  async function regenerate() {
    if (!formValues.productName.trim()) return;
    await callOptimiseAPI(buildPayload());
  }

  async function hopToPlatform(targetPlatform: Platform) {
    if (!formValues.productName.trim()) return;
    setPlatform(targetPlatform);
    await callOptimiseAPI(buildPayload(targetPlatform));
  }

  async function copyAll() {
    if (!result || displayTabs.length === 0) return;
    const parts = displayTabs.map((tab) => {
      if (tab.isTags || tab.isBullets) {
        const arr = tab.content as string[];
        return `${tab.label.toUpperCase()}:\n${arr.join(tab.isTags ? ", " : "\n")}`;
      }
      return `${tab.label.toUpperCase()}:\n${tab.content as string}`;
    });
    await navigator.clipboard.writeText(parts.join("\n\n"));
    toast.success("Full listing copied");
  }

  function downloadListing() {
    if (!result || displayTabs.length === 0) return;
    const header = `SellWise — ${result.platform.charAt(0).toUpperCase() + result.platform.slice(1)} Listing\n${"═".repeat(44)}\n\n`;
    const parts = displayTabs.map((tab) => {
      const divider = "─".repeat(tab.label.length);
      if (Array.isArray(tab.content)) {
        return `${tab.label}\n${divider}\n${(tab.content as string[]).join("\n")}`;
      }
      return `${tab.label}\n${divider}\n${tab.content as string}`;
    });
    const blob = new Blob([header + parts.join("\n\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sellwise-${result.platform}-listing.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function copyToClipboard(text: string, field: string) {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  }

  const tabs = result ? getResultTabs(result) : [];
  const scoreResult = result ? scoreWithBreakdown(result as ScoredListing, { userKeywords: keywordsValue }) : null;
  const afterScore = scoreResult?.score ?? null;
  const afterDeductions = scoreResult?.deductions ?? [];

  const handleImprove = () => {
    if (!result) return;
    const serialised = serialiseResult(result);
    const hints = buildImproveInstruction(afterDeductions);
    setFormValues((v) => ({ ...v, existingContent: serialised + hints }));
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const beforeScore = (result?.original && result?.platform)
    ? scoreOptimisedListing({ platform: result.platform, ...result.original } as ScoredListing)
    : null;
  const hopOptions = HOP_PLATFORMS.filter((p) => p.id !== platform);
  const platformShops = connectedShops.filter((s) => s.platform === platform);
  const canPushToShop = plan === "studio" && platformShops.length > 0 && ["shopify", "ebay"].includes(platform);

  const productWordCount = formValues.productName.trim().split(/\s+/).filter(Boolean).length;
  const platformHint = PLATFORM_HINTS[platform];
  const activeHint =
    productWordCount >= 3 && platformHint && !formValues[platformHint.field]
      ? platformHint.hint
      : null;

  const DESCRIPTION_WORD_LIMIT = 80;
  const fullDescription: string = result?.description ?? "";
  const descriptionWords = fullDescription.trim().split(/\s+/).filter(Boolean);
  const isDescriptionLocked = plan === "free" && result !== null && descriptionWords.length > DESCRIPTION_WORD_LIMIT;
  const displayDescription = isDescriptionLocked
    ? descriptionWords.slice(0, DESCRIPTION_WORD_LIMIT).join(" ") + "…"
    : fullDescription;
  const displayTabs = isDescriptionLocked
    ? tabs.map((tab) =>
        tab.fieldKey === "description"
          ? { ...tab, content: displayDescription }
          : tab
      )
    : tabs;

  return (
    <div className="space-y-6">
      {pushModalOpen && result && (
        <PushToShopModal
          result={result}
          platform={platform}
          shops={platformShops}
          onClose={() => setPushModalOpen(false)}
        />
      )}
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => {
          setUpgradeOpen(false);
          setLockedDesc(undefined);
        }}
        reason={upgradeReason}
        lockedDescription={upgradeReason === "limit" ? lockedDesc : undefined}
      />

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Sparkles className="size-5 text-primary" />
          Listing Optimiser
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
            <form
              onSubmit={handleSubmit}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  (e.currentTarget as HTMLFormElement).requestSubmit();
                }
              }}
              className={cn("space-y-4", loading && "pointer-events-none opacity-60")}
            >
              <div className="space-y-1.5">
                <Label htmlFor="productName">
                  Product name / what it is{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="productName"
                  name="productName"
                  placeholder="e.g. Handmade ceramic coffee mug"
                  value={formValues.productName}
                  onChange={setField("productName")}
                  required
                />
                <p className="text-[11px] text-muted-foreground/70">{getFieldHint(platform, "productName")}</p>
              </div>
              {/* Existing listing textarea */}
              <div className="space-y-1.5">
                <Label htmlFor="existingContent">
                  Your existing listing{" "}
                  <span className="text-muted-foreground font-normal">(optional — paste to improve)</span>
                </Label>
                <textarea
                  id="existingContent"
                  name="existingContent"
                  rows={5}
                  placeholder={"Paste your current title, description, tags — everything you have.\nThe AI will improve what's there, not invent anything new."}
                  value={formValues.existingContent}
                  onChange={(e) => setFormValues((v) => ({ ...v, existingContent: e.target.value }))}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none font-mono text-xs leading-relaxed"
                />
                {formValues.existingContent.trim() ? (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    Improve mode — AI will rewrite against this content only.
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground/60">
                    Without this, the AI generates a draft — review carefully before publishing.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowMoreDetail((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown className={`size-3.5 transition-transform ${showMoreDetail ? "rotate-180" : ""}`} />
                {showMoreDetail ? "Less detail" : "Add more detail"}
                <span className="text-muted-foreground/50">(materials, style, target buyer, photo)</span>
              </button>

              {showMoreDetail && (
                <>
              <div className="space-y-1.5">
                <Label htmlFor="materials">Materials &amp; techniques</Label>
                <Input
                  id="materials"
                  name="materials"
                  placeholder="e.g. Stoneware clay, hand-thrown, food-safe glaze"
                  value={formValues.materials}
                  onChange={setField("materials")}
                />
                <p className="text-[11px] text-muted-foreground/70">{getFieldHint(platform, "materials")}</p>
                {imagePreview && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-2.5 py-2">
                    <AlertCircle className="size-3 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      AI uses exactly what you type here — even with a photo uploaded, this text takes priority over what the AI sees in the image.
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="style">Style &amp; aesthetic</Label>
                  {formValues.productName.trim() && (
                    <button
                      type="button"
                      onClick={() => fetchSuggestion("style")}
                      disabled={suggestions.style.loading}
                      className="flex items-center gap-1 text-[11px] text-primary hover:opacity-80 disabled:opacity-40 transition-opacity"
                    >
                      <Sparkles className="size-3" />
                      Suggest
                    </button>
                  )}
                </div>
                <Input
                  id="style"
                  name="style"
                  placeholder="e.g. Minimalist, rustic, boho, cottagecore"
                  value={formValues.style}
                  onChange={setField("style")}
                />
                {!suggestions.style.loading && !suggestions.style.text && (
                  <p className="text-[11px] text-muted-foreground/70">{getFieldHint(platform, "style")}</p>
                )}
                {suggestions.style.loading && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Spinner size="sm" />
                    Generating suggestion...
                  </p>
                )}
                {suggestions.style.text && !suggestions.style.loading && (
                  <div className="flex items-start gap-2 rounded-md border border-primary/15 bg-primary/5 px-2.5 py-2">
                    <p className="text-[11px] text-muted-foreground flex-1">{suggestions.style.text}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setFormValues((v) => ({ ...v, style: suggestions.style.text }));
                        setSuggestions((prev) => ({ ...prev, style: { text: "", loading: false } }));
                      }}
                      className="text-[11px] text-primary font-semibold hover:opacity-80 shrink-0 transition-opacity"
                    >
                      Use this
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="targetBuyer">Target buyer / occasion</Label>
                  {formValues.productName.trim() && (
                    <button
                      type="button"
                      onClick={() => fetchSuggestion("targetBuyer")}
                      disabled={suggestions.targetBuyer.loading}
                      className="flex items-center gap-1 text-[11px] text-primary hover:opacity-80 disabled:opacity-40 transition-opacity"
                    >
                      <Sparkles className="size-3" />
                      Suggest
                    </button>
                  )}
                </div>
                <Input
                  id="targetBuyer"
                  name="targetBuyer"
                  placeholder="e.g. Coffee lovers, housewarming gift, office decor"
                  value={formValues.targetBuyer}
                  onChange={setField("targetBuyer")}
                />
                {!suggestions.targetBuyer.loading && !suggestions.targetBuyer.text && (
                  <p className="text-[11px] text-muted-foreground/70">{getFieldHint(platform, "targetBuyer")}</p>
                )}
                {suggestions.targetBuyer.loading && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Spinner size="sm" />
                    Generating suggestion...
                  </p>
                )}
                {suggestions.targetBuyer.text && !suggestions.targetBuyer.loading && (
                  <div className="flex items-start gap-2 rounded-md border border-primary/15 bg-primary/5 px-2.5 py-2">
                    <p className="text-[11px] text-muted-foreground flex-1">{suggestions.targetBuyer.text}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setFormValues((v) => ({ ...v, targetBuyer: suggestions.targetBuyer.text }));
                        setSuggestions((prev) => ({ ...prev, targetBuyer: { text: "", loading: false } }));
                      }}
                      className="text-[11px] text-primary font-semibold hover:opacity-80 shrink-0 transition-opacity"
                    >
                      Use this
                    </button>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="keywords">Keywords to include (optional)</Label>
                  {keywordLists.length > 0 && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowListPicker((v) => !v)}
                        className="text-[11px] text-primary hover:underline"
                      >
                        Use saved list
                      </button>
                      {showListPicker && (
                        <div className="absolute right-0 top-5 z-10 min-w-[180px] rounded-lg border border-border bg-card shadow-lg py-1">
                          {keywordLists.map((list) => (
                            <button
                              key={list.id}
                              type="button"
                              onClick={() => {
                                setKeywordsValue(list.keywords.slice(0, 10).join(", "));
                                setShowListPicker(false);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs hover:bg-muted transition-colors"
                            >
                              <span className="font-medium">{list.name}</span>
                              <span className="text-muted-foreground ml-1">({list.keywords.length})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Input
                  id="keywords"
                  name="keywords"
                  value={keywordsValue}
                  onChange={(e) => setKeywordsValue(e.target.value)}
                  placeholder="e.g. unique mug, pottery gift, handmade gift"
                />
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground/70">{getFieldHint(platform, "keywords")}</p>
                  {formValues.productName.trim() && (
                    <Link
                      href={`/dashboard/keywords?seed=${encodeURIComponent(formValues.productName.trim())}&platform=${platform}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-primary hover:opacity-80 shrink-0 transition-opacity"
                    >
                      <ExternalLink className="size-3" />
                      Research keywords
                    </Link>
                  )}
                </div>
              </div>

              {/* Product photo */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label>Product photo</Label>
                  {!canUploadImage && (
                    <Badge variant="outline" className="h-4 rounded px-1 py-0 text-[10px] text-primary border-primary/30">
                      Starter+
                    </Badge>
                  )}
                </div>
                {canUploadImage ? (
                  imagePreview ? (
                    <div className="relative overflow-hidden rounded-lg border border-border/50">
                      <img
                        src={imagePreview}
                        alt="Product"
                        className="max-h-36 w-full bg-muted/30 object-contain p-2"
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-background/90 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-5 text-center transition-colors hover:bg-muted/40"
                      >
                        <ImagePlus className="size-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Click to add a product photo</span>
                        <span className="text-[10px] text-muted-foreground/60">Clear lighting, full product visible. JPEG, PNG or WebP, max 10 MB.</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => setUpgradeOpen(true)}
                    className="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-5 text-center opacity-60 transition-opacity hover:opacity-80"
                  >
                    <Lock className="size-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Add a photo for more accurate results</span>
                    <span className="text-[10px] text-muted-foreground/60">Available on Starter and above</span>
                  </button>
                )}
              </div>
                </>
              )}

              {activeHint && (
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Lightbulb className="size-3.5 shrink-0 mt-0.5 text-amber-500" />
                  {activeHint}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <><Spinner size="sm" className="mr-2" />Optimising…</>
                ) : (
                  <><Sparkles className="size-3.5" />Optimise listing</>
                )}
              </Button>
              <p className="text-center text-[10px] text-muted-foreground/40">
                ⌘/Ctrl+Enter to submit
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {!result && !loading && error && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="flex items-start gap-3 py-4">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Optimisation failed</p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
              </CardContent>
            </Card>
          )}

          {!result && !loading && !error && (
            <Card className="flex min-h-64 items-center justify-center border-border/30 border-dashed">
              <CardContent className="text-center">
                <Sparkles className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Fill in your product details and click{" "}
                  <span className="font-medium text-foreground">Optimise listing</span>.
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Your AI-generated listing will appear here.
                </p>
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card className="flex min-h-64 items-center justify-center border-border/30">
              <CardContent className="text-center">
                <Spinner size="lg" className="mx-auto mb-4" />
                <p className="text-sm font-medium" aria-live="polite">{loadingStep}</p>
                <p className="mt-1 text-xs text-muted-foreground">This takes around 10 seconds</p>
              </CardContent>
            </Card>
          )}

          {result && displayTabs.length > 0 && (
            <>
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {result.original ? "Improved listing" : "Generated draft"}
                    {!result.original && (
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-400/40 bg-amber-500/5">
                        Verify before publishing
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={copyAll} className="h-7 gap-1 text-xs">
                      <Copy className="size-3" />Copy all
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={regenerate}
                      disabled={loading}
                      title="Generate a different version with the same inputs"
                      className="h-7 gap-1.5 text-xs text-muted-foreground"
                    >
                      <RefreshCw className="size-3" />Try again
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResult(null)}
                      disabled={loading}
                      title="Clear the result and start a new listing"
                      className="h-7 gap-1.5 text-xs text-muted-foreground"
                    >
                      <RotateCcw className="size-3" />Clear result
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={displayTabs[0].id}>
                    <TabsList className="w-full">
                      {displayTabs.map((tab) => (
                        <TabsTrigger key={tab.id} value={tab.id} className="flex-1 text-xs">
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {displayTabs.map((tab, tabIdx) => (
                      <TabsContent key={tab.id} value={tab.id} className="mt-4 focus-visible:outline-none">
                        <div
                          style={{ transitionDelay: `${tabIdx * 60}ms` }}
                          className={cn(
                            "space-y-3 transition-all duration-300",
                            animReveal > tabIdx ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                          )}
                        >
                        {tab.isTags && Array.isArray(tab.content) ? (
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-wrap gap-1.5">
                                {(tab.content as string[]).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                ))}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => copyToClipboard((tab.content as string[]).join(", "), tab.id)}
                              >
                                {copiedField === tab.id ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
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
                                  <li key={i} className="text-xs leading-relaxed">{bullet}</li>
                                ))}
                              </ol>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => copyToClipboard((tab.content as string[]).join("\n"), tab.id)}
                              >
                                {copiedField === tab.id ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
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
                              {tab.fieldKey === "description" && isDescriptionLocked ? (
                                <div className="relative flex-1">
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{tab.content as string}</p>
                                  <div className="mt-2 flex flex-col items-center gap-2">
                                    <div className="w-full h-8 bg-gradient-to-b from-transparent to-background/60 -mt-8 pointer-events-none" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setLockedDesc(fullDescription);
                                        setUpgradeOpen(true);
                                      }}
                                      className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                                    >
                                      <Lock className="size-3 shrink-0" />
                                      Unlock full description
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="flex-1 whitespace-pre-wrap text-sm leading-relaxed">
                                  {tab.content as string}
                                </p>
                              )}
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => copyToClipboard(tab.content as string, tab.id)}
                              >
                                {copiedField === tab.id ? <Check className="size-3.5 text-primary" /> : <Copy className="size-3.5" />}
                              </Button>
                            </div>
                            <Separator />
                            {tab.maxChars ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{(tab.content as string).length} / {tab.maxChars} characters</span>
                                  <span className={(tab.content as string).length <= tab.maxChars ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
                                    {(tab.content as string).length <= tab.maxChars ? "✓ Within limit" : "Too long"}
                                  </span>
                                </div>
                                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all duration-300",
                                      (tab.content as string).length > tab.maxChars
                                        ? "bg-destructive"
                                        : (tab.content as string).length / tab.maxChars >= 0.9
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                    )}
                                    style={{ width: `${Math.min(100, ((tab.content as string).length / tab.maxChars) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">{(tab.content as string).length} characters</p>
                            )}
                          </>
                        )}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

              {/* Platform hop */}
              {formValues.productName.trim() && hopOptions.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap px-1">
                  <span className="text-xs text-muted-foreground shrink-0">Also try:</span>
                  {hopOptions.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => hopToPlatform(p.id)}
                      disabled={loading}
                      className="rounded-full border border-border/60 bg-muted/40 px-3 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}

              {afterScore !== null && (
                <>
                  <ScoreDisplay
                    before={beforeScore ?? undefined}
                    after={afterScore}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Under 60 needs work · 60–79 is solid · 80+ is competitive
                  </p>
                  <ScoreDeductionsList deductions={afterDeductions} />
                  {(() => {
                    const note = getMicroNote(result?.id, afterScore);
                    return note ? (
                      <p className="text-xs text-muted-foreground/70 italic px-1">
                        {note}
                      </p>
                    ) : null;
                  })()}
                  {result?.topPercent && (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      <TrendingUp className="size-3" />
                      Top 5% on {PLATFORM_LABELS[platform]} this week
                    </div>
                  )}
                  {afterScore >= 60 && !showShareFallback && (
                    <div className="flex justify-center pt-1">
                      <button
                        onClick={() => handleShareScore(afterScore, beforeScore)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Share2 className="size-3" />
                        Share your score
                      </button>
                    </div>
                  )}
                  {afterScore >= 60 && showShareFallback && (() => {
                    const links = buildShareLinks(afterScore, PLATFORM_LABELS[platform], beforeScore, "https://sellwise.au");
                    return (
                      <div className="rounded-lg border border-border/50 bg-muted/10 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-muted-foreground">Share your score</p>
                          <button onClick={() => setShowShareFallback(false)} className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                            <X className="size-3" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <a href={links.twitter} target="_blank" rel="noopener noreferrer"
                             className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted/30 transition-colors">
                            𝕏 Post
                          </a>
                          <a href={links.facebook} target="_blank" rel="noopener noreferrer"
                             className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted/30 transition-colors">
                            Facebook
                          </a>
                          <button
                            onClick={() => { navigator.clipboard.writeText(links.caption).catch(() => null); toast.success("Copied"); }}
                            className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted/30 transition-colors"
                          >
                            <Copy className="size-3" /> Copy text
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}

              {result.original && result.changes && (
                <ListingDiff
                  tabs={displayTabs}
                  original={result.original}
                  changes={result.changes}
                />
              )}

              {afterScore !== null && afterScore < 60 && (
                <RescuePanel
                  deductions={afterDeductions}
                  onImprove={handleImprove}
                  onReset={handleReset}
                />
              )}

              {result !== null && canPushToShop && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                  onClick={() => setPushModalOpen(true)}
                >
                  <Upload className="size-3.5" />
                  Push to {platformShops.length === 1 ? platformShops[0].shop_name : "shop"}
                </Button>
              )}

              {result !== null && (
                <WhatNextStrip onReset={handleReset} hideKeywords={afterScore !== null && afterScore < 60} />
              )}

              {result !== null && plan === "free" && <TrialBanner />}

              {/* Utility links */}
              <div className="flex items-center gap-4 px-1">
                <button
                  onClick={downloadListing}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Download className="size-3" />Download .txt
                </button>
                {result?.id && (
                  <>
                    <span className="text-muted-foreground/30 text-xs">·</span>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span className="text-xs">Helpful?</span>
                      <button
                        onClick={() => submitFeedback("up")}
                        disabled={submittingFeedback}
                        className={cn(
                          "rounded p-1 transition-colors hover:text-foreground",
                          feedback === "up" && "text-emerald-500"
                        )}
                        title="This result was helpful"
                        aria-label="This result was helpful"
                      >
                        <ThumbsUp className="size-3.5" />
                      </button>
                      <button
                        onClick={() => submitFeedback("down")}
                        disabled={submittingFeedback}
                        className={cn(
                          "rounded p-1 transition-colors hover:text-foreground",
                          feedback === "down" && "text-destructive"
                        )}
                        title="This result wasn't helpful"
                        aria-label="This result wasn't helpful"
                      >
                        <ThumbsDown className="size-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
}
