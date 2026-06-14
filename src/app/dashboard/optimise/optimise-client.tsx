"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Sparkles, Copy, Check, RotateCcw, RefreshCw, Download, BarChart3, ImagePlus, X, Lock, AlertCircle, ChevronDown, ThumbsUp, ThumbsDown, Lightbulb, Search, ArrowLeftRight, Plus, TrendingUp } from "lucide-react";
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
import { PLATFORM_LABELS } from "@/lib/platforms";
import { ListingDiff } from "@/components/listing-diff";
import { scoreOptimisedListing } from "@/lib/listing-score";
import type { ScoredListing } from "@/lib/listing-score";
import { showBigLiftToast } from "@/components/big-lift-toast";
import { cn } from "@/lib/utils";

interface ChangeNote {
  field: string;
  reason: string;
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
        { id: "backend", label: "Backend Keys", fieldKey: "backendKeywords", content: result.backendKeywords ?? "" },
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

function ScoreDisplay({ before, after }: { before?: number; after: number }) {
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
        <p className={cn("text-2xl font-bold tabular-nums leading-none", color(after))}>{after}</p>
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

function RescuePanel({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
          Score under 60 — a few things to try
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Link
          href="/dashboard/keywords"
          className="flex items-start gap-2 rounded-md border border-border/60 bg-background p-3 text-xs hover:border-border hover:bg-muted/30 transition-colors"
        >
          <Search className="size-3.5 shrink-0 mt-0.5 text-muted-foreground" />
          <div>
            <p className="font-medium">Research keywords first</p>
            <p className="text-muted-foreground mt-0.5">Pull 15 keywords, then come back and add them to the form.</p>
          </div>
        </Link>
        <Link
          href="/dashboard/audit"
          className="flex items-start gap-2 rounded-md border border-border/60 bg-background p-3 text-xs hover:border-border hover:bg-muted/30 transition-colors"
        >
          <BarChart3 className="size-3.5 shrink-0 mt-0.5 text-muted-foreground" />
          <div>
            <p className="font-medium">Audit the listing instead</p>
            <p className="text-muted-foreground mt-0.5">Paste your existing listing and get a breakdown of specific fixes.</p>
          </div>
        </Link>
        <button
          onClick={onReset}
          className="flex items-start gap-2 rounded-md border border-border/60 bg-background p-3 text-xs hover:border-border hover:bg-muted/30 transition-colors text-left w-full"
        >
          <ArrowLeftRight className="size-3.5 shrink-0 mt-0.5 text-muted-foreground" />
          <div>
            <p className="font-medium">Try a different platform</p>
            <p className="text-muted-foreground mt-0.5">We&apos;ll scroll you back to the top so you can pick a different platform and re-run.</p>
          </div>
        </button>
      </div>
    </div>
  );
}

function WhatNextStrip({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
      <p className="text-xs font-medium text-muted-foreground">What next?</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <Link
          href="/dashboard/keywords"
          className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-3 py-2 text-xs font-medium hover:border-border hover:bg-muted/30 transition-colors"
        >
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          Research keywords
        </Link>
        <Link
          href="/dashboard/audit"
          className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-3 py-2 text-xs font-medium hover:border-border hover:bg-muted/30 transition-colors"
        >
          <BarChart3 className="size-3.5 shrink-0 text-muted-foreground" />
          Audit this listing
        </Link>
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

export function OptimiseClient({ plan }: { plan: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initPlatform = (searchParams.get("platform") ?? sessionStorage.getItem("sw_active_platform") ?? "shopify") as Platform;

  const [platform, setPlatform] = useState<Platform>(initPlatform);
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
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<ImageMediaType>("image/jpeg");
  const [keywordLists, setKeywordLists] = useState<KeywordList[]>([]);
  const [keywordsValue, setKeywordsValue] = useState(searchParams.get("keywords") ?? "");
  const [showListPicker, setShowListPicker] = useState(false);
  const [showMoreDetail, setShowMoreDetail] = useState(plan === "studio");
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [lockedDesc, setLockedDesc] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingStep = useLoadingStep(loading, platform);
  const canUploadImage = plan !== "free";

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
    setResult(null);
    setKeywordsValue("");
    setShowListPicker(false);
    setFormValues((v) => ({ ...v, existingContent: "" }));
  }

  function handleReset() {
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const [header, b64] = dataUrl.split(",");
      const type = (header.match(/:(.*?);/)?.[1] ?? "image/jpeg") as ImageMediaType;
      setImagePreview(dataUrl);
      setImageBase64(b64);
      setImageMediaType(type);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function clearImage() {
    setImagePreview(null);
    setImageBase64(null);
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
          setUpgradeOpen(true);
          return;
        }
        throw new Error(err.error ?? "Something went wrong");
      }
      const json = await res.json();
      setResult(json);
      setFeedback(null);

      // Big Lift toast — fires on re-optimisation (existingContent provided) when score improves 30+
      const newAfterScore = scoreOptimisedListing(json as ScoredListing);
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
      setError(err instanceof Error ? err.message : "Something went wrong. Try again, if it keeps happening, check your connection.");
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

  function scoreThisListing() {
    if (!result) return;
    try {
      sessionStorage.setItem("audit:prefill", JSON.stringify(result));
    } catch {}
    router.push("/dashboard/audit");
  }

  async function copyToClipboard(text: string, field: string) {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  }

  const tabs = result ? getResultTabs(result) : [];
  const afterScore = result ? scoreOptimisedListing(result as ScoredListing) : null;
  const beforeScore = (result?.original && result?.platform)
    ? scoreOptimisedListing({ platform: result.platform, ...result.original } as ScoredListing)
    : null;
  const hopOptions = HOP_PLATFORMS.filter((p) => p.id !== platform);

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
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => {
          setUpgradeOpen(false);
          setLockedDesc(undefined);
        }}
        reason="limit"
        lockedDescription={lockedDesc}
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
            <form
              onSubmit={handleSubmit}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  (e.currentTarget as HTMLFormElement).requestSubmit();
                }
              }}
              className="space-y-4"
            >
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
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="style">Style &amp; aesthetic</Label>
                <Input
                  id="style"
                  name="style"
                  placeholder="e.g. Minimalist, rustic, boho, cottagecore"
                  value={formValues.style}
                  onChange={setField("style")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="targetBuyer">Target buyer / occasion</Label>
                <Input
                  id="targetBuyer"
                  name="targetBuyer"
                  placeholder="e.g. Coffee lovers, housewarming gift, office decor"
                  value={formValues.targetBuyer}
                  onChange={setField("targetBuyer")}
                />
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
                      className="h-7 gap-1.5 text-xs text-muted-foreground"
                    >
                      <RotateCcw className="size-3" />New
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

                    {displayTabs.map((tab) => (
                      <TabsContent key={tab.id} value={tab.id} className="mt-4 space-y-3">
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
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

              {afterScore !== null && (
                <>
                  <ScoreDisplay
                    before={beforeScore ?? undefined}
                    after={afterScore}
                  />
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
                <RescuePanel onReset={handleReset} />
              )}

              {result !== null && (
                <WhatNextStrip onReset={handleReset} />
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
                <span className="text-muted-foreground/30 text-xs">·</span>
                <button
                  onClick={scoreThisListing}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BarChart3 className="size-3" />Score this listing
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
