"use client";

import { useState, useEffect, useCallback } from "react";
import { History, ChevronDown, ChevronUp, Copy, Check, RefreshCw, Loader2, Archive, ArchiveRestore, ThumbsUp, ThumbsDown, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import type { Platform } from "@/lib/platforms";
import { ListingDiff, FIELD_LABELS } from "@/components/listing-diff";

interface Optimisation {
  id: string;
  platform: Platform;
  product_id?: string | null;
  shop_id?: string | null;
  input: {
    productName?: string;
    materials?: string;
    style?: string;
    targetBuyer?: string;
    keywords?: string;
  };
  output: Record<string, unknown>;
  score: number | null;
  created_at: string;
  is_archived: boolean;
  feedback?: "up" | "down" | null;
}

const PLATFORM_CONFIG: Record<Platform, { label: string; className: string }> = {
  etsy:        { label: "Etsy",        className: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/25" },
  amazon:      { label: "Amazon",      className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/25" },
  shopify:     { label: "Shopify",     className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25" },
  ebay:        { label: "eBay",        className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25" },
  woocommerce: { label: "WooCommerce", className: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/25" },
  wix:         { label: "Wix",         className: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/25" },
  squarespace: { label: "Squarespace", className: "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/25" },
  tiktok:      { label: "TikTok Shop", className: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/25" },
  social:      { label: "Social",      className: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/25" },
};

const SCORE_CONFIG = (score: number) =>
  score >= 70 ? { label: `${score}`, className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25" }
  : score >= 40 ? { label: `${score}`, className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25" }
  : { label: `${score}`, className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25" };

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: diffDays > 365 ? "numeric" : undefined });
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(label ? `${label} copied` : "Copied");
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      className="ml-1 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
      title="Copy"
    >
      {copied ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
    </button>
  );
}

function OutputField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <CopyButton value={value} label={label} />
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  );
}

function PlatformOutput({ platform, output }: { platform: Platform; output: Record<string, unknown> }) {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

  if (platform === "etsy") {
    return (
      <div className="space-y-4">
        <OutputField label="Title" value={str(output.title)} />
        {arr(output.tags).length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Tags</span>
              <CopyButton value={arr(output.tags).join(", ")} label="Tags" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {arr(output.tags).map((t) => (
                <span key={t} className="rounded border border-border bg-muted px-2 py-0.5 text-xs">{t}</span>
              ))}
            </div>
          </div>
        )}
        <OutputField label="Description" value={str(output.description)} />
      </div>
    );
  }

  if (platform === "amazon") {
    return (
      <div className="space-y-4">
        <OutputField label="Title" value={str(output.title)} />
        {arr(output.bullets).length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Bullet Points</span>
              <CopyButton value={arr(output.bullets).join("\n")} label="Bullets" />
            </div>
            <ul className="space-y-1.5">
              {arr(output.bullets).map((b, i) => (
                <li key={i} className="text-sm leading-relaxed pl-3 border-l-2 border-border">{b}</li>
              ))}
            </ul>
          </div>
        )}
        {str(output.backendKeywords) && <OutputField label="Backend Keywords" value={str(output.backendKeywords)} />}
        <OutputField label="Description" value={str(output.description)} />
      </div>
    );
  }

  if (platform === "shopify" || platform === "wix" || platform === "squarespace") {
    return (
      <div className="space-y-4">
        <OutputField label="Product Title" value={str(output.productTitle)} />
        <OutputField label={platform === "shopify" ? "Meta Title" : "SEO Title"} value={str(output.metaTitle ?? output.seoTitle)} />
        <OutputField label={platform === "shopify" ? "Meta Description" : "SEO Description"} value={str(output.metaDescription ?? output.seoDescription)} />
        <OutputField label="Description" value={str(output.description)} />
      </div>
    );
  }

  if (platform === "woocommerce") {
    return (
      <div className="space-y-4">
        <OutputField label="Product Title" value={str(output.productTitle)} />
        <OutputField label="SEO Title" value={str(output.seoTitle)} />
        <OutputField label="SEO Description" value={str(output.seoDescription)} />
        {str(output.shortDescription) && <OutputField label="Short Description" value={str(output.shortDescription)} />}
        <OutputField label="Description" value={str(output.description)} />
      </div>
    );
  }

  if (platform === "tiktok") {
    return (
      <div className="space-y-4">
        <OutputField label="Title" value={str(output.title)} />
        <OutputField label="Description" value={str(output.description)} />
      </div>
    );
  }

  if (platform === "social") {
    return (
      <div className="space-y-4">
        <OutputField label="Caption" value={str(output.caption)} />
        <OutputField label="Post Copy" value={str(output.postCopy)} />
        {arr(output.hashtags).length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Hashtags</span>
              <CopyButton value={arr(output.hashtags).map((h) => `#${h}`).join(" ")} label="Hashtags" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {arr(output.hashtags).map((h) => (
                <span key={h} className="rounded border border-border bg-muted px-2 py-0.5 text-xs">#{h}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // eBay (and any unknown platform)
  return (
    <div className="space-y-4">
      <OutputField label="Title" value={str(output.title)} />
      <OutputField label="Description" value={str(output.description)} />
    </div>
  );
}

function InputSummary({ input }: { input: Optimisation["input"] }) {
  const fields = [
    input.productName && { label: "Product", value: input.productName },
    input.materials && { label: "Materials", value: input.materials },
    input.style && { label: "Style", value: input.style },
    input.targetBuyer && { label: "Target buyer", value: input.targetBuyer },
    input.keywords && { label: "Keywords", value: input.keywords },
  ].filter(Boolean) as { label: string; value: string }[];

  if (fields.length === 0) return <p className="text-sm text-muted-foreground italic">No input recorded</p>;

  return (
    <div className="space-y-3">
      {fields.map((f) => (
        <div key={f.label} className="space-y-0.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{f.label}</span>
          <p className="text-sm text-foreground">{f.value}</p>
        </div>
      ))}
    </div>
  );
}

function GhostHistoryRow() {
  return (
    <div className="relative flex items-center gap-3 rounded-lg border border-border/40 bg-muted/10 p-4 overflow-hidden">
      <div className="size-8 rounded-full bg-muted/60 shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center gap-2">
          <div className="h-3 w-24 rounded bg-muted/70 blur-[2px]" />
          <div className="h-3 w-16 rounded bg-muted/60 blur-[2px]" />
        </div>
        <div className="h-3 w-3/4 rounded bg-muted/50 blur-[2px]" />
      </div>
      <div className="h-6 w-12 rounded-full bg-muted/60 blur-[2px] shrink-0" />
      <div className="absolute inset-0 flex items-center justify-center bg-background/40">
        <a href="/pricing" className="flex items-center gap-1.5 rounded-md bg-background border border-border/60 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shadow-sm">
          <Lock className="size-3" />
          Upgrade to unlock
        </a>
      </div>
    </div>
  );
}

function HistoryListingDiff({ output }: { output: Record<string, unknown> }) {
  const original = output.original as Record<string, string | string[]>;
  const changeNotes = Array.isArray(output.changes)
    ? (output.changes as Array<{ field: string; reason: string }>)
    : [];

  const tabs = Object.keys(original)
    .filter((key) => {
      const newVal = output[key];
      return newVal !== undefined && newVal !== null;
    })
    .map((key) => {
      const newVal = output[key];
      const content = Array.isArray(newVal)
        ? newVal.map(String)
        : typeof newVal === "string"
        ? newVal
        : "";
      return {
        id: key,
        label: FIELD_LABELS[key] ?? key,
        fieldKey: key,
        content: content as string | string[],
        isTags: key === "tags",
        isBullets: key === "bullets",
      };
    });

  return <ListingDiff tabs={tabs} original={original} changes={changeNotes} />;
}

function OptimisationCard({
  opt,
  onArchiveToggle,
  feedbackMap,
  onFeedback,
  submittingFeedbackId,
}: {
  opt: Optimisation;
  onArchiveToggle: (id: string) => void;
  feedbackMap: Record<string, "up" | "down" | null>;
  onFeedback: (id: string, value: "up" | "down") => void;
  submittingFeedbackId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [archiving, setArchiving] = useState(false);

  async function handleArchive(e: React.MouseEvent) {
    e.stopPropagation();
    setArchiving(true);
    try {
      const res = await fetch("/api/optimisations/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: opt.id, archived: !opt.is_archived }),
      });
      if (!res.ok) throw new Error();
      onArchiveToggle(opt.id);
    } catch {
      toast.error("Failed to update");
    } finally {
      setArchiving(false);
    }
  }
  const platformCfg = PLATFORM_CONFIG[opt.platform];
  const productName = opt.input?.productName ?? "Untitled product";
  const outputTitle = (() => {
    const o = opt.output;
    return typeof o?.title === "string" ? o.title
      : typeof o?.productTitle === "string" ? o.productTitle
      : null;
  })();

  const isShopEntry = !!(opt.product_id && opt.shop_id);
  const reoptimiseHref = (() => {
    if (isShopEntry) {
      return `/dashboard/shop?productId=${encodeURIComponent(opt.product_id!)}&shopId=${encodeURIComponent(opt.shop_id!)}`;
    }
    const p = new URLSearchParams({ platform: opt.platform });
    if (opt.input.productName) p.set("productName", opt.input.productName);
    if (opt.input.materials) p.set("materials", opt.input.materials);
    if (opt.input.style) p.set("style", opt.input.style);
    if (opt.input.targetBuyer) p.set("targetBuyer", opt.input.targetBuyer);
    if (opt.input.keywords) p.set("keywords", opt.input.keywords);
    return `/dashboard/optimise?${p.toString()}`;
  })();

  return (
    <Card className={cn("border-border/50 transition-all", expanded && "border-border")}>
      <button
        className="w-full text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3 px-5 py-4">
          <Badge variant="outline" className={cn("text-xs h-5 px-1.5 shrink-0", platformCfg.className)}>
            {platformCfg.label}
          </Badge>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{productName}</p>
            {outputTitle && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{outputTitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {opt.score != null && (
              <Badge variant="outline" className={cn("text-xs h-5 px-1.5", SCORE_CONFIG(opt.score).className)}>
                {SCORE_CONFIG(opt.score).label}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{formatDate(opt.created_at)}</span>
            {expanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50 px-5 py-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{formatDate(opt.created_at)} · {new Date(opt.created_at).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleArchive}
                disabled={archiving}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {archiving ? <Loader2 className="size-3 animate-spin" /> : opt.is_archived ? <ArchiveRestore className="size-3" /> : <Archive className="size-3" />}
                {opt.is_archived ? "Restore" : "Archive"}
              </button>
              <a
                href={reoptimiseHref}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <RefreshCw className="size-3" />
                {isShopEntry ? "Re-optimise in My Shop" : "Re-optimise"}
              </a>
              <div className="flex items-center gap-1 text-muted-foreground ml-auto">
                <span className="text-[11px]">Helpful?</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onFeedback(opt.id, "up"); }}
                  disabled={submittingFeedbackId === opt.id}
                  className={cn(
                    "rounded p-1 transition-colors hover:text-foreground",
                    (feedbackMap[opt.id] ?? opt.feedback) === "up" && "text-emerald-500"
                  )}
                  title="This result was helpful"
                  aria-label="This result was helpful"
                >
                  <ThumbsUp className="size-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onFeedback(opt.id, "down"); }}
                  disabled={submittingFeedbackId === opt.id}
                  className={cn(
                    "rounded p-1 transition-colors hover:text-foreground",
                    (feedbackMap[opt.id] ?? opt.feedback) === "down" && "text-destructive"
                  )}
                  title="This result wasn't helpful"
                  aria-label="This result wasn't helpful"
                >
                  <ThumbsDown className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          {opt.output.original && typeof opt.output.original === "object" ? (
            // Improve-mode result: show before/after diff
            <HistoryListingDiff output={opt.output} />
          ) : (
            // Fresh optimisation: show input vs output side by side
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Original input</h4>
                <InputSummary input={opt.input} />
              </div>
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI output</h4>
                <PlatformOutput platform={opt.platform} output={opt.output} />
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

const PLATFORMS: { value: Platform | "all"; label: string }[] = [
  { value: "all", label: "All platforms" },
  { value: "etsy", label: "Etsy" },
  { value: "amazon", label: "Amazon" },
  { value: "shopify", label: "Shopify" },
  { value: "ebay", label: "eBay" },
  { value: "woocommerce", label: "WooCommerce" },
  { value: "wix", label: "Wix" },
  { value: "squarespace", label: "Squarespace" },
  { value: "tiktok", label: "TikTok Shop" },
  { value: "social", label: "Social" },
];

export function HistoryClient() {
  const [optimisations, setOptimisations] = useState<Optimisation[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [showArchived, setShowArchived] = useState(false);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, "up" | "down" | null>>({});
  const [submittingFeedbackId, setSubmittingFeedbackId] = useState<string | null>(null);
  const [plan, setPlan] = useState<string>("free");

  const submitFeedback = useCallback(async (optimisationId: string, value: "up" | "down") => {
    const current = feedbackMap[optimisationId] ?? null;
    const next = current === value ? null : value;
    setSubmittingFeedbackId(optimisationId);
    setFeedbackMap((m) => ({ ...m, [optimisationId]: next }));
    try {
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optimisationId, feedback: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setFeedbackMap((m) => ({ ...m, [optimisationId]: current }));
      toast.error("Could not save feedback");
    } finally {
      setSubmittingFeedbackId(null);
    }
  }, [feedbackMap]);

  const fetchPage = useCallback(async (pg: number, plat: Platform | "all", replace: boolean, archived: boolean) => {
    const setter = replace ? setLoading : setLoadingMore;
    setter(true);
    try {
      const params = new URLSearchParams({ page: String(pg) });
      if (plat !== "all") params.set("platform", plat);
      if (archived) params.set("archived", "1");
      const res = await fetch(`/api/optimisations?${params}`);
      if (!res.ok) throw new Error("Failed to load history");
      const data = await res.json();
      setOptimisations((prev) => replace ? data.optimisations : [...prev, ...data.optimisations]);
      setTotal(data.total);
      setHasMore(data.hasMore);
      setPage(pg);
      if (replace && data.plan) setPlan(data.plan);
      const initial: Record<string, "up" | "down" | null> = {};
      for (const o of data.optimisations as Optimisation[]) {
        if (o.feedback) initial[o.id] = o.feedback;
      }
      setFeedbackMap((m) => replace ? initial : { ...m, ...initial });
    } catch {
      toast.error("Could not load history");
    } finally {
      setter(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(0, platform, true, showArchived);
  }, [platform, fetchPage, showArchived]);

  function handleArchiveToggle(id: string) {
    setOptimisations((prev) => prev.filter((o) => o.id !== id));
    setTotal((t) => Math.max(0, t - 1));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <History className="size-5 text-primary" />
            Optimisation History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every listing you have optimised, with the original input and AI output side by side.
          </p>
        </div>
        {total > 0 && (
          <span className="text-sm text-muted-foreground shrink-0 pt-1">{total} total</span>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPlatform(p.value)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              platform === p.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
            )}
          >
            {p.label}
          </button>
        ))}
        <div className="ml-auto">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              showArchived
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
            )}
          >
            <Archive className="size-3" />
            {showArchived ? "Viewing archived" : "Archived"}
          </button>
        </div>
      </div>

      {loading ? (
        <Card className="flex min-h-64 items-center justify-center border-border/30">
          <CardContent className="text-center py-12">
            <Spinner size="lg" className="mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading history…</p>
          </CardContent>
        </Card>
      ) : optimisations.length === 0 ? (
        <Card className="flex min-h-64 items-center justify-center border-border/30 border-dashed">
          <CardContent className="text-center py-12 max-w-xs mx-auto">
            <History className="mx-auto mb-3 size-8 text-muted-foreground/40" />
            {showArchived ? (
              <>
                <p className="text-sm text-muted-foreground font-medium">No archived optimisations</p>
                <button onClick={() => setShowArchived(false)} className="mt-3 text-xs text-primary hover:underline">
                  Back to active
                </button>
              </>
            ) : platform !== "all" ? (
              <>
                <p className="text-sm text-muted-foreground font-medium">No {PLATFORM_CONFIG[platform as Platform].label} results yet</p>
                <p className="mt-1 text-xs text-muted-foreground/70">Run the optimiser on a {PLATFORM_CONFIG[platform as Platform].label} listing to see it here.</p>
                <button onClick={() => setPlatform("all")} className="mt-3 text-xs text-primary hover:underline">
                  Show all platforms
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">Your results will live here</p>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Every listing you optimise is saved with the original input and AI output side by side — so you can copy, compare, and re-run any time.
                </p>
                <a href="/dashboard/optimise" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                  Optimise your first listing
                </a>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {optimisations.map((opt) => (
              <OptimisationCard
                key={opt.id}
                opt={opt}
                onArchiveToggle={handleArchiveToggle}
                feedbackMap={feedbackMap}
                onFeedback={submitFeedback}
                submittingFeedbackId={submittingFeedbackId}
              />
            ))}
          </div>

          {plan === "free" && (
            <div className="space-y-2 mt-2">
              <GhostHistoryRow />
              <GhostHistoryRow />
              <GhostHistoryRow />
              <div className="rounded-lg border border-border/50 bg-muted/20 p-4 text-center space-y-2">
                <p className="text-sm font-medium">You&apos;re losing history — upgrade to keep all your results.</p>
                <p className="text-xs text-muted-foreground">
                  Free plan keeps 1 result. Paid plans keep everything — including every before and after.
                </p>
                <a
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  See plans
                </a>
              </div>
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchPage(page + 1, platform, false, showArchived)}
                disabled={loadingMore}
              >
                {loadingMore ? <><Loader2 className="size-3.5 animate-spin" /> Loading…</> : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
