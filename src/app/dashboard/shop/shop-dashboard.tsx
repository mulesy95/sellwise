"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Store, Sparkles, ExternalLink, RefreshCw, ArrowRight,
  Lock, AlertCircle, Unplug, X, Copy, Check, Plus, ChevronRight, ImagePlus,
  History, RotateCcw, ArrowLeftRight,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ShopifyProduct } from "@/lib/shopify";

interface Shop {
  id: string;
  shop_name: string;
  shop_url: string;
  shop_id: string;
  platform: string;
  created_at: string;
}

interface ShopifyResult {
  metaTitle?: string;
  metaDescription?: string;
  productTitle?: string;
  description?: string;
}

interface HistoryEntry {
  id: string;
  created_at: string;
  output: Record<string, string>;
  previous_content: Record<string, string> | null;
  platform: string;
}

// ─── SEO score ────────────────────────────────────────────────────────────────

type SeoScore = "good" | "fair" | "poor";

function calcSeoScore(p: ShopifyProduct): SeoScore {
  const text = p.body_html?.replace(/<[^>]+>/g, "").trim() ?? "";
  const words = text.split(/\s+/).filter(Boolean).length;
  const titleLen = p.title.length;
  let score = 0;
  if (titleLen >= 25 && titleLen <= 70) score += 35;
  else if (titleLen > 5) score += 15;
  if (words >= 100) score += 40;
  else if (words >= 30) score += 20;
  else if (words > 0) score += 5;
  if (p.images?.length > 0) score += 25;
  if (score >= 75) return "good";
  if (score >= 40) return "fair";
  return "poor";
}

const SCORE_CONFIG: Record<SeoScore, { label: string; dot: string; badge: string }> = {
  good: {
    label: "Good",
    dot: "bg-emerald-500",
    badge: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  fair: {
    label: "Could improve",
    dot: "bg-amber-500",
    badge: "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  poor: {
    label: "Needs work",
    dot: "bg-red-500",
    badge: "text-red-700 dark:text-red-400 bg-red-500/10 border-red-500/20",
  },
};

const PLATFORM_LABELS: Record<string, string> = {
  etsy: "Etsy", amazon: "Amazon", shopify: "Shopify", ebay: "eBay",
  woocommerce: "WooCommerce", wix: "Wix", squarespace: "Squarespace",
  tiktok: "TikTok Shop", social: "Social",
};

const ALL_PLATFORMS = ["etsy", "amazon", "shopify", "ebay", "woocommerce", "wix", "squarespace", "tiktok", "social"] as const;

function getMigrateResultFields(targetPlatform: string, result: Record<string, unknown>) {
  const str = (v: unknown) => (Array.isArray(v) ? v.join(", ") : String(v ?? ""));
  switch (targetPlatform) {
    case "etsy":
      return [
        { label: "Title", value: str(result.title), maxLen: 140 },
        { label: "Tags (13)", value: Array.isArray(result.tags) ? result.tags.join(", ") : str(result.tags) },
        { label: "Description", value: str(result.description) },
      ];
    case "amazon":
      return [
        { label: "Title", value: str(result.title), maxLen: 200 },
        { label: "Bullets", value: Array.isArray(result.bullets) ? result.bullets.join("\n") : str(result.bullets) },
        { label: "Backend keywords", value: str(result.backendKeywords), maxLen: 250 },
        { label: "Description", value: str(result.description) },
      ];
    case "shopify":
      return [
        { label: "Meta title", value: str(result.metaTitle), maxLen: 60 },
        { label: "Meta description", value: str(result.metaDescription), maxLen: 160 },
        { label: "Product title", value: str(result.productTitle) },
        { label: "Description", value: str(result.description) },
      ];
    case "ebay":
      return [
        { label: "Title", value: str(result.title), maxLen: 80 },
        { label: "Description", value: str(result.description) },
      ];
    case "woocommerce":
      return [
        { label: "SEO title", value: str(result.seoTitle), maxLen: 60 },
        { label: "SEO description", value: str(result.seoDescription), maxLen: 160 },
        { label: "Product title", value: str(result.productTitle) },
        { label: "Short description", value: str(result.shortDescription), maxLen: 150 },
        { label: "Description", value: str(result.description) },
      ];
    case "wix":
    case "squarespace":
      return [
        { label: "SEO title", value: str(result.seoTitle), maxLen: 60 },
        { label: "SEO description", value: str(result.seoDescription), maxLen: 160 },
        { label: "Product title", value: str(result.productTitle) },
        { label: "Description", value: str(result.description) },
      ];
    case "tiktok":
      return [
        { label: "Title", value: str(result.title), maxLen: 100 },
        { label: "Description", value: str(result.description) },
      ];
    case "social":
      return [
        { label: "Caption", value: str(result.caption), maxLen: 125 },
        { label: "Post copy", value: str(result.postCopy) },
        { label: "Hashtags", value: Array.isArray(result.hashtags) ? result.hashtags.map((h: unknown) => `#${h}`).join(" ") : str(result.hashtags) },
      ];
    default:
      return [];
  }
}

function sortByScore(products: ShopifyProduct[]): ShopifyProduct[] {
  const order: Record<SeoScore, number> = { poor: 0, fair: 1, good: 2 };
  return [...products].sort((a, b) => order[calcSeoScore(a)] - order[calcSeoScore(b)]);
}

// ─── Client-side image resize (keeps base64 small for AI + upload) ────────────

async function resizeImageToBase64(
  file: File,
  maxPx = 1500,
  quality = 0.9
): Promise<{ base64: string; mediaType: "image/jpeg" }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve({ base64: canvas.toDataURL("image/jpeg", quality).split(",")[1], mediaType: "image/jpeg" });
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button
      onClick={copy}
      className="ml-auto shrink-0 rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Copy"
    >
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
    </button>
  );
}

// ─── Editable result field ────────────────────────────────────────────────────

function ResultField({
  label,
  value,
  onChange,
  maxLen,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLen?: number;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1">
          {maxLen && (
            <span className={cn("text-[10px] tabular-nums", value.length > maxLen ? "text-destructive" : "text-muted-foreground/60")}>
              {value.length}/{maxLen}
            </span>
          )}
          <CopyBtn text={value} />
        </div>
      </div>
      {multiline ? (
        <textarea
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full resize-none rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      )}
    </div>
  );
}

// ─── Products summary bar ─────────────────────────────────────────────────────

function ProductsSummary({ products }: { products: ShopifyProduct[] }) {
  const scores = products.map(calcSeoScore);
  const poor = scores.filter((s) => s === "poor").length;
  const fair = scores.filter((s) => s === "fair").length;
  const good = scores.filter((s) => s === "good").length;

  if (products.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border/40 bg-muted/20 px-4 py-2.5 text-sm">
      <span className="font-medium">{products.length} products</span>
      {poor > 0 && (
        <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
          <span className="size-2 rounded-full bg-red-500 inline-block" />
          {poor} need attention
        </span>
      )}
      {fair > 0 && (
        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
          <span className="size-2 rounded-full bg-amber-500 inline-block" />
          {fair} could improve
        </span>
      )}
      {good > 0 && (
        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <span className="size-2 rounded-full bg-emerald-500 inline-block" />
          {good} looking good
        </span>
      )}
    </div>
  );
}

// ─── Product row ──────────────────────────────────────────────────────────────

function ProductRow({
  product,
  canOptimise,
  onOptimise,
  onMigrate,
  onLocked,
  onViewHistory,
  lastOptimisedAt,
}: {
  product: ShopifyProduct;
  canOptimise: boolean;
  onOptimise: (p: ShopifyProduct) => void;
  onMigrate: (p: ShopifyProduct) => void;
  onLocked: () => void;
  onViewHistory?: (p: ShopifyProduct) => void;
  lastOptimisedAt?: string;
}) {
  const image = product.images?.[0]?.src;
  const price = product.variants?.[0]?.price;
  const score = calcSeoScore(product);
  const { label, dot, badge } = SCORE_CONFIG[score];

  const optimisedLabel = lastOptimisedAt
    ? `Optimised ${new Date(lastOptimisedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}`
    : null;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
      {image ? (
        <img src={image} alt={product.title} className="size-10 rounded-md object-cover shrink-0 bg-muted" />
      ) : (
        <div className="size-10 rounded-md bg-muted shrink-0 flex items-center justify-center">
          <Store className="size-4 text-muted-foreground/40" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{product.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {price && <span className="text-xs text-muted-foreground">${price}</span>}
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium", badge)}>
            <span className={cn("size-1.5 rounded-full", dot)} />
            {label}
          </span>
          {optimisedLabel && (
            <button
              onClick={() => onViewHistory?.(product)}
              className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-2"
            >
              <History className="size-2.5" />
              {optimisedLabel}
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          size="sm"
          variant={score === "poor" ? "default" : "outline"}
          className="text-xs h-7"
          onClick={() => canOptimise ? onOptimise(product) : onLocked()}
        >
          {canOptimise ? (
            <><Sparkles className="size-3.5" />Optimise</>
          ) : (
            <><Lock className="size-3.5" />Optimise</>
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs h-7 px-2 text-muted-foreground"
          onClick={() => canOptimise ? onMigrate(product) : onLocked()}
          title="Migrate to another platform"
        >
          <ArrowLeftRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Cross-platform push (Studio) ────────────────────────────────────────────

interface CrossState {
  status: "idle" | "loading" | "done" | "error";
  result: Record<string, unknown> | null;
  pushed: boolean;
  ebayPrice: string;
  creating: boolean;
  error?: string;
}

function CrossPlatformPush({
  product,
  sourcePlatform,
  connectedShops,
}: {
  product: ShopifyProduct;
  sourcePlatform: string;
  connectedShops: Shop[];
}) {
  const [states, setStates] = useState<Record<string, CrossState>>(() => {
    const init: Record<string, CrossState> = {};
    for (const shop of connectedShops) {
      init[shop.id] = {
        status: "idle",
        result: null,
        pushed: false,
        ebayPrice: product.variants?.[0]?.price ?? "",
        creating: false,
      };
    }
    return init;
  });

  const existingText = product.body_html?.replace(/<[^>]+>/g, "").trim() ?? "";

  function setState(shopId: string, patch: Partial<CrossState>) {
    setStates((prev) => ({ ...prev, [shopId]: { ...prev[shopId], ...patch } }));
  }

  async function handleOptimiseFor(shop: Shop) {
    setState(shop.id, { status: "loading", result: null });
    try {
      const body: Record<string, string> = {
        sourcePlatform,
        targetPlatform: shop.platform,
        title: product.title,
      };
      if (["shopify", "woocommerce", "wix", "squarespace"].includes(sourcePlatform)) {
        body.productCopy = existingText.slice(0, 2000);
      } else {
        body.description = existingText.slice(0, 2000);
      }
      const res = await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Migration failed");
      setState(shop.id, { status: "done", result: data.result });
    } catch (err) {
      setState(shop.id, { status: "error", error: err instanceof Error ? err.message : "Failed" });
    }
  }

  async function handlePushToEbay(shop: Shop) {
    const state = states[shop.id];
    if (!state.result) return;
    const price = parseFloat(state.ebayPrice);
    if (isNaN(price) || price <= 0) { toast.error("Enter a valid price for eBay"); return; }
    setState(shop.id, { creating: true });
    try {
      const res = await fetch("/api/ebay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          title: String(state.result.title ?? product.title).slice(0, 80),
          description: String(state.result.description ?? ""),
          price,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(
        <span>
          Listed on eBay!{" "}
          <a href={data.listingUrl} target="_blank" rel="noopener noreferrer" className="underline">
            View listing
          </a>
        </span>
      );
      setState(shop.id, { pushed: true, creating: false });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create eBay listing");
      setState(shop.id, { creating: false });
    }
  }

  async function handlePushToShopify(shop: Shop) {
    const state = states[shop.id];
    if (!state.result) return;
    setState(shop.id, { creating: true });
    try {
      const res = await fetch("/api/shopify/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          title: String(state.result.productTitle ?? state.result.title ?? product.title),
          body_html: String(state.result.description ?? ""),
          metaTitle: String(state.result.metaTitle ?? ""),
          metaDescription: String(state.result.metaDescription ?? ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(
        <span>
          Draft created in {shop.shop_name}.{" "}
          <a href={data.adminUrl} target="_blank" rel="noopener noreferrer" className="underline">
            Open in Shopify
          </a>
        </span>
      );
      setState(shop.id, { pushed: true, creating: false });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create product");
      setState(shop.id, { creating: false });
    }
  }

  return (
    <div className="mt-4 border-t border-border/40 pt-4 space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Also push to connected stores
      </p>
      {connectedShops.map((shop) => {
        const state = states[shop.id];
        const label = PLATFORM_LABELS[shop.platform] ?? shop.platform;
        return (
          <div key={shop.id} className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{shop.shop_name}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
              {state.status === "idle" && (
                <Button size="sm" variant="outline" className="text-xs h-7 shrink-0" onClick={() => handleOptimiseFor(shop)}>
                  <Sparkles className="size-3" />
                  Optimise for {label}
                </Button>
              )}
              {state.status === "loading" && <Spinner size="sm" className="shrink-0" />}
              {state.pushed && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Check className="size-3" />Pushed
                </span>
              )}
              {state.status === "error" && (
                <button onClick={() => handleOptimiseFor(shop)} className="text-xs text-destructive underline shrink-0">
                  Retry
                </button>
              )}
            </div>

            {state.status === "done" && state.result && !state.pushed && (
              <div className="space-y-2">
                <div className="rounded-md bg-background/60 px-2.5 py-2">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Title</p>
                  <p className="text-xs line-clamp-2">
                    {String(state.result.title ?? state.result.productTitle ?? "")}
                  </p>
                </div>
                {shop.platform === "ebay" && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-muted-foreground">Price (listing price)</label>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="29.99"
                        value={state.ebayPrice}
                        onChange={(e) => setState(shop.id, { ebayPrice: e.target.value })}
                        className="mt-0.5 w-full rounded-md border border-border/50 bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <Button size="sm" className="text-xs h-8 mt-4 shrink-0" onClick={() => handlePushToEbay(shop)} disabled={state.creating}>
                      {state.creating ? <Spinner size="sm" /> : "Create on eBay"}
                    </Button>
                  </div>
                )}
                {shop.platform === "shopify" && (
                  <Button size="sm" className="text-xs w-full h-7" onClick={() => handlePushToShopify(shop)} disabled={state.creating}>
                    {state.creating ? <Spinner size="sm" /> : <><Store className="size-3" />Create draft in {shop.shop_name}</>}
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Optimise slide-out panel ─────────────────────────────────────────────────

function OptimisePanel({
  product,
  plan,
  shopId,
  platform,
  allShops,
  onClose,
}: {
  product: ShopifyProduct;
  plan: string;
  shopId: string;
  platform: string;
  allShops: Shop[];
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    metaTitle: string;
    metaDescription: string;
    productTitle: string;
    description: string;
  } | null>(null);
  const [pushing, setPushing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{
    base64: string;
    mediaType: "image/jpeg";
    filename: string;
    previewUrl: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isStudio = plan === "studio";
  const isShopify = platform === "shopify";
  const otherConnectedShops = allShops.filter((s) => s.id !== shopId);

  const existingText = product.body_html?.replace(/<[^>]+>/g, "").trim() ?? "";
  const imageUrl = product.images?.[0]?.src;

  useEffect(() => {
    return () => { if (uploadedImage) URL.revokeObjectURL(uploadedImage.previewUrl); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    try {
      const previewUrl = URL.createObjectURL(file);
      const { base64, mediaType } = await resizeImageToBase64(file);
      if (uploadedImage) URL.revokeObjectURL(uploadedImage.previewUrl);
      setUploadedImage({ base64, mediaType, filename: file.name, previewUrl });
    } catch {
      toast.error("Failed to process image");
    }
  }

  function removeUploadedImage() {
    if (uploadedImage) URL.revokeObjectURL(uploadedImage.previewUrl);
    setUploadedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleOptimise() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/optimise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          productName: product.title,
          existingContent: existingText.slice(0, 800),
          productId: product.id,
          shopId,
          ...(uploadedImage
            ? { imageBase64: uploadedImage.base64, imageMediaType: uploadedImage.mediaType }
            : imageUrl
            ? { imageUrl }
            : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to optimise");
      setResult({
        metaTitle: data.metaTitle ?? "",
        metaDescription: data.metaDescription ?? "",
        productTitle: (data.productTitle ?? data.title ?? "") as string,
        description: data.description ?? "",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to optimise");
    } finally {
      setLoading(false);
    }
  }

  async function handlePush() {
    if (!result) return;
    setPushing(true);
    try {
      const pushBody = isShopify
        ? { productId: product.id, shopId, title: result.productTitle, body_html: result.description }
        : { itemId: product.id, shopId, title: result.productTitle, description: result.description };

      const requests: Promise<Response>[] = [
        fetch(isShopify ? "/api/shopify/push" : "/api/ebay/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pushBody),
        }),
      ];

      if (isShopify && isStudio && result.metaTitle && result.metaDescription) {
        requests.push(
          fetch("/api/shopify/seo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: product.id,
              shopId,
              metaTitle: result.metaTitle,
              metaDescription: result.metaDescription,
            }),
          })
        );
      }

      if (uploadedImage && isShopify) {
        requests.push(
          fetch("/api/shopify/media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: product.id,
              shopId,
              imageBase64: uploadedImage.base64,
              imageMediaType: uploadedImage.mediaType,
              filename: uploadedImage.filename,
            }),
          })
        );
      }

      const responses = await Promise.all(requests);
      for (const res of responses) {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to push");
        }
      }

      toast.success(
        isShopify
          ? uploadedImage
            ? "Content, SEO and image pushed to Shopify"
            : isStudio
            ? "Content and SEO pushed to Shopify"
            : "Product updated in Shopify"
          : "Listing updated on eBay"
      );
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to push");
    } finally {
      setPushing(false);
    }
  }

  async function copyAll() {
    if (!result) return;
    const lines = isShopify
      ? [
          `META TITLE:\n${result.metaTitle}`,
          `META DESCRIPTION:\n${result.metaDescription}`,
          `PRODUCT TITLE:\n${result.productTitle}`,
          `DESCRIPTION:\n${result.description}`,
        ]
      : [
          `TITLE:\n${result.productTitle}`,
          `DESCRIPTION:\n${result.description}`,
        ];
    await navigator.clipboard.writeText(lines.join("\n\n"));
    toast.success("All fields copied");
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-card border-l border-border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="optimise-panel-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {imageUrl && (
              <img src={imageUrl} alt="" className="size-8 rounded-md object-cover shrink-0" />
            )}
            <div className="min-w-0">
              <h2 id="optimise-panel-title" className="text-sm font-semibold truncate">
                {product.title}
              </h2>
              <p className="text-xs text-muted-foreground">{platform === "shopify" ? "Shopify" : "eBay"} listing optimiser</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-4 shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 divide-y divide-border/50 lg:grid-cols-2 lg:divide-x lg:divide-y-0 h-full">
            {/* Current listing */}
            <div className="p-6 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current listing</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Title</p>
                  <p className="text-sm bg-muted/30 rounded-md px-3 py-2">{product.title}</p>
                </div>
                {isShopify && <div>
                  <p className="text-xs text-muted-foreground mb-1">Images</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {uploadedImage ? (
                    <div className="space-y-2">
                      <div className="relative inline-block">
                        <img src={uploadedImage.previewUrl} alt="Uploaded" className="h-20 w-auto rounded-md object-cover border border-border/40" />
                        <button
                          onClick={removeUploadedImage}
                          className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-white"
                          aria-label="Remove image"
                        >
                          <X className="size-2.5" />
                        </button>
                      </div>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        Ready — AI will analyse this and it will be pushed to Shopify with your content.
                      </p>
                    </div>
                  ) : product.images && product.images.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex gap-1.5 flex-wrap">
                        {product.images.slice(0, 5).map((img, i) => (
                          <img key={i} src={img.src} alt="" className="size-12 rounded-md object-cover bg-muted border border-border/40" />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                        <AlertCircle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          No product images. Upload one and the AI will use it to write accurate copy — then push it to Shopify with your content.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs w-full" onClick={() => fileInputRef.current?.click()}>
                        <ImagePlus className="size-3.5" />
                        Upload image
                      </Button>
                    </div>
                  )}
                </div>}

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  {existingText ? (
                    <p className="text-sm bg-muted/30 rounded-md px-3 py-2 leading-relaxed whitespace-pre-wrap">
                      {existingText}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/60 bg-muted/20 rounded-md px-3 py-2 italic">
                      No description — AI will generate one from scratch.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Optimised result */}
            <div className="p-6 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI optimised</p>

              {!result && !loading && (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="size-5 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {existingText
                      ? "AI will analyse and improve your existing listing."
                      : "AI will generate an optimised listing from your product name."}
                  </p>
                  {!imageUrl && !uploadedImage && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 max-w-[220px]">
                      No images found. Upload a photo on the left for more accurate copy.
                    </p>
                  )}
                  <Button onClick={handleOptimise} className="mt-1">
                    <Sparkles className="size-3.5" />
                    Generate optimised listing
                  </Button>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <Spinner size="lg" />
                  <p className="text-sm text-muted-foreground" aria-live="polite">
                    {existingText ? "Analysing and improving your listing…" : "Generating optimised listing…"}
                  </p>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  {isShopify && (
                    <>
                      <ResultField
                        label="Meta title"
                        value={result.metaTitle}
                        onChange={(v) => setResult((r) => r && { ...r, metaTitle: v })}
                        maxLen={60}
                      />
                      <ResultField
                        label="Meta description"
                        value={result.metaDescription}
                        onChange={(v) => setResult((r) => r && { ...r, metaDescription: v })}
                        maxLen={160}
                      />
                    </>
                  )}
                  <ResultField
                    label={isShopify ? "Product title" : "Title"}
                    value={result.productTitle}
                    onChange={(v) => setResult((r) => r && { ...r, productTitle: v })}
                    maxLen={isShopify ? undefined : 80}
                  />
                  <ResultField
                    label="Description"
                    value={result.description}
                    onChange={(v) => setResult((r) => r && { ...r, description: v })}
                    multiline
                  />
                  {isStudio && otherConnectedShops.length > 0 && (
                    <CrossPlatformPush
                      product={product}
                      sourcePlatform={platform}
                      connectedShops={otherConnectedShops}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        {result && (
          <>
            {!isStudio && (
              <div className="shrink-0 border-t border-primary/20 bg-primary/5 px-6 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">Push live without copy-paste</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Studio applies this directly to {isShopify ? "Shopify" : "eBay"} — one click, done.
                  </p>
                </div>
                <a href="/pricing" className={cn(buttonVariants({ size: "sm" }), "shrink-0 text-xs whitespace-nowrap")}>
                  Upgrade to Studio <ArrowRight className="size-3.5" />
                </a>
              </div>
            )}
            <div className="shrink-0 border-t border-border px-6 py-4 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setResult(null)} className="text-xs">
                Regenerate
              </Button>
              <Button variant="ghost" size="sm" onClick={copyAll} className="text-xs">
                <Copy className="size-3.5" />
                Copy all
              </Button>
              <div className="flex-1" />
              {isStudio && (
                <Button size="sm" onClick={handlePush} disabled={pushing}>
                  {pushing
                    ? <><Spinner size="sm" className="mr-1.5" />Applying…</>
                    : isShopify && uploadedImage
                    ? "Apply content + image"
                    : isShopify
                    ? "Apply to Shopify"
                    : "Apply to eBay"}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── History slide-out panel ──────────────────────────────────────────────────

function HistoryPanel({
  product,
  shopId,
  plan,
  platform,
  onClose,
}: {
  product: ShopifyProduct;
  shopId: string;
  plan: string;
  platform: string;
  onClose: () => void;
}) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [reverting, setReverting] = useState<string | null>(null);
  const isStudio = plan === "studio";

  useEffect(() => {
    fetch(
      `/api/optimisations/product?productId=${encodeURIComponent(product.id)}&shopId=${encodeURIComponent(shopId)}`
    )
      .then((r) => r.json())
      .then((d) => setEntries(d.history ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [product.id, shopId]);

  async function handleRevert(entry: HistoryEntry) {
    if (!confirm("Revert this listing to its original content before the optimisation?")) return;
    setReverting(entry.id);
    try {
      const endpoint = platform === "ebay" ? "/api/ebay/revert" : "/api/shopify/revert";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optimisationId: entry.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to revert");
      toast.success("Listing reverted to original");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revert");
    } finally {
      setReverting(null);
    }
  }

  const imageUrl = product.images?.[0]?.src;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-card border-l border-border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-panel-title"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {imageUrl && (
              <img src={imageUrl} alt="" className="size-8 rounded-md object-cover shrink-0" />
            )}
            <div className="min-w-0">
              <h2 id="history-panel-title" className="text-sm font-semibold truncate">
                {product.title}
              </h2>
              <p className="text-xs text-muted-foreground">Optimisation history</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-4 shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground">Loading history…</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <History className="size-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium">No push history yet</p>
              <p className="text-xs text-muted-foreground/70">
                Once you optimise and push this listing, each version is saved here so you can revert any time.
              </p>
            </div>
          ) : (
            entries.map((entry) => {
              const isEbay = platform === "ebay";
              const title = entry.output?.title ?? "";
              const body = isEbay ? entry.output?.description : entry.output?.body_html;
              const canRevert = !!entry.previous_content;
              const date = new Date(entry.created_at).toLocaleString("en-AU", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={entry.id} className="rounded-xl border border-border/40 bg-muted/10 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-muted-foreground pt-0.5">{date}</p>
                    {isStudio ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 shrink-0"
                        disabled={!canRevert || reverting === entry.id}
                        onClick={() => canRevert && void handleRevert(entry)}
                        title={
                          canRevert
                            ? "Revert to the content before this optimisation"
                            : "No snapshot available for this entry"
                        }
                      >
                        {reverting === entry.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <><RotateCcw className="size-3" />Revert</>
                        )}
                      </Button>
                    ) : (
                      <a
                        href="/pricing"
                        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "text-xs h-7 shrink-0")}
                      >
                        <Lock className="size-3" />Studio to revert
                      </a>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Title pushed
                      </p>
                      <p className="text-xs bg-background/60 rounded-md px-2.5 py-2 line-clamp-2">
                        {title || "—"}
                      </p>
                    </div>
                    {body && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Description pushed
                        </p>
                        <p className="text-xs bg-background/60 rounded-md px-2.5 py-2 line-clamp-3 leading-relaxed">
                          {body.replace(/<[^>]+>/g, "").trim()}
                        </p>
                      </div>
                    )}
                    {!canRevert && (
                      <p className="text-[10px] text-muted-foreground/60 italic">
                        No snapshot for this entry — revert unavailable.
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

// ─── Migrate panel ────────────────────────────────────────────────────────────

function MigratePanel({
  product,
  sourcePlatform,
  allShops,
  plan,
  onClose,
}: {
  product: ShopifyProduct;
  sourcePlatform: string;
  allShops: Shop[];
  plan: string;
  onClose: () => void;
}) {
  const [targetPlatform, setTargetPlatform] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [creating, setCreating] = useState(false);
  const [ebayPrice, setEbayPrice] = useState("");
  const [ebayCategoryId, setEbayCategoryId] = useState("");
  const [ebaySuggestedCats, setEbaySuggestedCats] = useState<{ categoryId: string; categoryName: string; categoryParentName?: string }[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const isStudio = plan === "studio";

  async function suggestEbayCategories() {
    const title = result ? String(result.title ?? product.title) : product.title;
    if (!title) return;
    setLoadingCats(true);
    try {
      const res = await fetch(`/api/ebay/suggest-category?title=${encodeURIComponent(title.slice(0, 350))}`);
      const data = await res.json();
      setEbaySuggestedCats(data.categories ?? []);
    } catch {
      // silently ignore
    } finally {
      setLoadingCats(false);
    }
  }

  const existingText = product.body_html?.replace(/<[^>]+>/g, "").trim() ?? "";
  const imageUrl = product.images?.[0]?.src;

  // Map connected shops by platform (excluding source)
  const connectedByPlatform = useMemo(() => {
    const map: Record<string, Shop> = {};
    for (const shop of allShops) {
      if (shop.platform !== sourcePlatform) map[shop.platform] = shop;
    }
    return map;
  }, [allShops, sourcePlatform]);

  const availableTargets = ALL_PLATFORMS.filter((p) => p !== sourcePlatform);

  async function handleMigrate() {
    if (!targetPlatform) return;
    setLoading(true);
    setResult(null);
    const body: Record<string, string> = {
      sourcePlatform,
      targetPlatform,
      title: product.title,
    };
    if (sourcePlatform === "shopify" || sourcePlatform === "woocommerce" || sourcePlatform === "wix" || sourcePlatform === "squarespace") {
      body.productCopy = existingText.slice(0, 2000);
    } else {
      body.description = existingText.slice(0, 2000);
    }
    try {
      const res = await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Migration failed");
      setResult(data.result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Migration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOnShopify(targetShop: Shop) {
    if (!result) return;
    setCreating(true);
    try {
      const res = await fetch("/api/shopify/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: targetShop.id,
          title: String(result.productTitle ?? result.title ?? product.title),
          body_html: String(result.description ?? ""),
          metaTitle: String(result.metaTitle ?? ""),
          metaDescription: String(result.metaDescription ?? ""),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      toast.success(
        <span>
          Draft created in {targetShop.shop_name}.{" "}
          <a href={data.adminUrl} target="_blank" rel="noopener noreferrer" className="underline">
            Open in Shopify
          </a>
        </span>
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create product");
    } finally {
      setCreating(false);
    }
  }

  async function copyAll() {
    if (!result || !targetPlatform) return;
    const fields = getMigrateResultFields(targetPlatform, result);
    const text = fields.map((f) => `${f.label.toUpperCase()}:\n${f.value}`).join("\n\n");
    await navigator.clipboard.writeText(text);
    toast.success("All fields copied");
  }

  async function handleCreateOnEbay(targetShop: Shop) {
    if (!result) return;
    const price = parseFloat(ebayPrice);
    if (isNaN(price) || price <= 0) { toast.error("Enter a valid price"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/ebay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: targetShop.id,
          title: String(result.title ?? product.title).slice(0, 80),
          description: String(result.description ?? ""),
          price,
          categoryId: ebayCategoryId.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create");
      toast.success(
        <span>
          Listed on eBay!{" "}
          <a href={data.listingUrl} target="_blank" rel="noopener noreferrer" className="underline">
            View listing
          </a>
        </span>
      );
      setEbayPrice("");
      setEbayCategoryId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create eBay listing");
    } finally {
      setCreating(false);
    }
  }

  const resultFields = result && targetPlatform ? getMigrateResultFields(targetPlatform, result) : [];
  const targetShopify = targetPlatform === "shopify" ? connectedByPlatform["shopify"] : null;
  const targetEbay = targetPlatform === "ebay" ? connectedByPlatform["ebay"] : null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-card border-l border-border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="migrate-panel-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {imageUrl && (
              <img src={imageUrl} alt="" className="size-8 rounded-md object-cover shrink-0" />
            )}
            <div className="min-w-0">
              <h2 id="migrate-panel-title" className="text-sm font-semibold truncate">
                {product.title}
              </h2>
              <p className="text-xs text-muted-foreground">Migrate to another platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-4 shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Source summary */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Source — {PLATFORM_LABELS[sourcePlatform]}
              </p>
              <div className="rounded-lg border border-border/40 bg-muted/20 px-4 py-3 space-y-1.5">
                <p className="text-sm font-medium">{product.title}</p>
                {existingText && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {existingText}
                  </p>
                )}
              </div>
            </div>

            {/* Target platform picker */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Migrate to
              </p>
              <div className="flex flex-wrap gap-2">
                {availableTargets.map((p) => {
                  const isConnected = !!connectedByPlatform[p];
                  const isSelected = targetPlatform === p;
                  return (
                    <button
                      key={p}
                      onClick={() => { setTargetPlatform(p); setResult(null); }}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted text-muted-foreground hover:text-foreground hover:border-foreground/30"
                      )}
                    >
                      {PLATFORM_LABELS[p]}
                      {isConnected && (
                        <span
                          className={cn("size-1.5 rounded-full shrink-0", isSelected ? "bg-primary-foreground/70" : "bg-emerald-500")}
                          title="You have a connected store on this platform"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              {Object.keys(connectedByPlatform).length > 0 && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  <span className="inline-block size-1.5 rounded-full bg-emerald-500 mr-1 align-middle" />
                  Green dot = you have a connected store on that platform
                </p>
              )}
            </div>

            {/* Migrate button */}
            {targetPlatform && !result && !loading && (
              <Button onClick={handleMigrate} className="w-full">
                <ArrowLeftRight className="size-3.5" />
                Migrate to {PLATFORM_LABELS[targetPlatform]}
              </Button>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <Spinner size="lg" />
                <p className="text-sm text-muted-foreground">
                  Reformatting for {targetPlatform ? PLATFORM_LABELS[targetPlatform] : "target platform"}…
                </p>
              </div>
            )}

            {/* Result */}
            {result && targetPlatform && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {PLATFORM_LABELS[targetPlatform]} listing
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={copyAll}>
                      <Copy className="size-3" />
                      Copy all
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleMigrate} disabled={loading}>
                      Regenerate
                    </Button>
                  </div>
                </div>

                {resultFields.map((field) => (
                  <ResultField
                    key={field.label}
                    label={field.label}
                    value={field.value}
                    onChange={() => {}}
                    maxLen={field.maxLen}
                    multiline={field.label.toLowerCase().includes("description") || field.label.toLowerCase().includes("copy") || field.label.toLowerCase().includes("bullets")}
                  />
                ))}

                {/* Deploy section */}
                {isStudio && targetShopify && (
                  <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-2.5">
                    <p className="text-xs font-semibold text-foreground">Deploy to {targetShopify.shop_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Creates a draft product in your Shopify store with this content — finish it by adding price and images in Shopify admin.
                    </p>
                    <Button
                      size="sm"
                      className="text-xs"
                      onClick={() => handleCreateOnShopify(targetShopify)}
                      disabled={creating}
                    >
                      {creating ? <Spinner size="sm" /> : <><Store className="size-3.5" />Create draft in Shopify</>}
                    </Button>
                  </div>
                )}

                {isStudio && targetEbay && (
                  <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Create on eBay</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Set a price to publish this listing to {targetEbay.shop_name}. Category defaults to "Everything Else" — you can recategorise in Seller Hub after.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1 block">Price *</label>
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="29.99"
                          value={ebayPrice}
                          onChange={(e) => setEbayPrice(e.target.value)}
                          className="w-full rounded-md border border-border/50 bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1 flex items-center justify-between">
                          <span>Category ID{" "}
                            <a
                              href="https://www.ebay.com.au/sch/allcategories/all-categories"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline normal-case"
                            >
                              browse
                            </a>
                          </span>
                          <button
                            type="button"
                            onClick={suggestEbayCategories}
                            disabled={loadingCats}
                            className="text-[10px] normal-case text-primary hover:underline disabled:opacity-50"
                          >
                            {loadingCats ? "Suggesting…" : "Auto-suggest"}
                          </button>
                        </label>
                        <input
                          type="text"
                          placeholder="Optional (default: 99)"
                          value={ebayCategoryId}
                          onChange={(e) => setEbayCategoryId(e.target.value)}
                          className="w-full rounded-md border border-border/50 bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        {ebaySuggestedCats.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {ebaySuggestedCats.map((cat) => (
                              <button
                                key={cat.categoryId}
                                type="button"
                                onClick={() => { setEbayCategoryId(cat.categoryId); setEbaySuggestedCats([]); }}
                                className="rounded border border-border/60 bg-muted px-2 py-0.5 text-[11px] text-left hover:border-primary hover:text-primary transition-colors"
                                title={cat.categoryParentName ? `${cat.categoryParentName} > ${cat.categoryName}` : cat.categoryName}
                              >
                                {cat.categoryName}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="text-xs w-full"
                      onClick={() => handleCreateOnEbay(targetEbay)}
                      disabled={creating || !ebayPrice || parseFloat(ebayPrice) <= 0}
                    >
                      {creating ? <Spinner size="sm" /> : <><Store className="size-3.5" />Create on eBay</>}
                    </Button>
                  </div>
                )}

                {!isStudio && (targetShopify || connectedByPlatform[targetPlatform]) && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold">Deploy directly to your store</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Studio pushes migrated content straight to your connected store — no copy-paste.</p>
                    </div>
                    <a href="/pricing" className={cn(buttonVariants({ size: "sm" }), "shrink-0 text-xs whitespace-nowrap")}>
                      Upgrade to Studio <ArrowRight className="size-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Connect form ─────────────────────────────────────────────────────────────

function ConnectForm() {
  const [tab, setTab] = useState<"shopify" | "ebay">("shopify");
  const [shopUrl, setShopUrl] = useState("");
  const [connecting, setConnecting] = useState(false);

  function handleShopify() {
    if (!shopUrl.trim()) return;
    setConnecting(true);
    window.location.href = `/api/shopify/connect?shop=${encodeURIComponent(shopUrl.trim())}`;
  }

  function handleEbay(sandbox = false) {
    setConnecting(true);
    window.location.href = sandbox ? "/api/ebay/connect?sandbox=true" : "/api/ebay/connect";
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-8 space-y-5 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Store className="size-4 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold">Connect a store</h2>
          <p className="text-xs text-muted-foreground">Choose your platform to get started.</p>
        </div>
      </div>

      <div className="flex rounded-lg border border-border/60 p-1 gap-1">
        {(["shopify", "ebay"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setTab(p)}
            className={cn(
              "flex-1 rounded-md py-1.5 text-sm font-medium transition-colors capitalize",
              tab === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p === "shopify" ? "Shopify" : "eBay"}
          </button>
        ))}
      </div>

      {tab === "shopify" ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Enter your store URL to connect via OAuth.</p>
          <div className="flex gap-2">
            <Input
              placeholder="yourstore.myshopify.com"
              value={shopUrl}
              onChange={(e) => setShopUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleShopify(); }}
              disabled={connecting}
            />
            <Button onClick={handleShopify} disabled={!shopUrl.trim() || connecting}>
              {connecting ? <Spinner size="md" /> : "Connect"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Connect your eBay seller account via OAuth. You&apos;ll be redirected to eBay to authorise access.
          </p>
          <Button className="w-full" onClick={() => handleEbay(false)} disabled={connecting}>
            {connecting ? <Spinner size="md" /> : "Connect eBay account"}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleEbay(true)} disabled={connecting}>
            {connecting ? <Spinner size="md" /> : "Connect sandbox account"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Use sandbox to test with dummy listings before connecting your live store.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Store tabs ───────────────────────────────────────────────────────────────

function StoreTabs({
  shops,
  activeId,
  onSelect,
  canAddMore,
  showingConnect,
  onConnectClick,
}: {
  shops: Shop[];
  activeId: string;
  onSelect: (id: string) => void;
  canAddMore: boolean;
  showingConnect: boolean;
  onConnectClick: () => void;
}) {
  return (
    <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
      {shops.map((shop) => (
        <button
          key={shop.id}
          onClick={() => onSelect(shop.id)}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
            activeId === shop.id && !showingConnect
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Store className="size-3.5" />
          {shop.shop_name}
        </button>
      ))}

      {canAddMore ? (
        <button
          onClick={onConnectClick}
          className={cn(
            "flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
            showingConnect
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Plus className="size-3.5" />
          Connect store
        </button>
      ) : (
        <a
          href="/pricing"
          className="flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-muted-foreground/50"
          title="Upgrade to Studio for unlimited stores"
        >
          <Lock className="size-3.5" />
          Connect store
        </a>
      )}
    </div>
  );
}

// ─── Products panel for a single shop ────────────────────────────────────────

function ShopProductsPanel({
  shopId,
  plan,
  platform,
  canOptimise,
  onUpgrade,
  autoProductId,
  allShops,
}: {
  shopId: string;
  plan: string;
  platform: string;
  canOptimise: boolean;
  onUpgrade: () => void;
  autoProductId?: string;
  allShops: Shop[];
}) {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);
  const [historyProduct, setHistoryProduct] = useState<ShopifyProduct | null>(null);
  const [migrateProduct, setMigrateProduct] = useState<ShopifyProduct | null>(null);
  const [history, setHistory] = useState<Record<string, string>>({});
  const autoOpened = useRef(false);

  const fetchProducts = useCallback(async (cursor?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ shopId });
      if (cursor) params.set("cursor", cursor);
      const endpoint = platform === "ebay" ? "/api/ebay/listings" : "/api/shopify/listings";
      const res = await fetch(`${endpoint}?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load products");
      // eBay returns { listings }, Shopify returns { products }
      const items: ShopifyProduct[] = data.listings ?? data.products ?? [];
      if (cursor) {
        setProducts((p) => [...p, ...items]);
      } else {
        setProducts(sortByScore(items));
      }
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [shopId, platform]);

  useEffect(() => {
    fetchProducts();
    fetch(`/api/optimisations/history?shopId=${shopId}`)
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, string> = {};
        for (const h of d.history ?? []) map[h.productId] = h.optimisedAt;
        setHistory(map);
      })
      .catch(() => {});
  }, [fetchProducts, shopId]);

  useEffect(() => {
    if (!autoProductId || autoOpened.current || products.length === 0) return;
    const match = products.find((p) => p.id === autoProductId);
    if (match) {
      setSelectedProduct(match);
      autoOpened.current = true;
    }
  }, [products, autoProductId]);

  const sorted = products; // already sorted on fetch

  return (
    <>
      {selectedProduct && (
        <OptimisePanel
          product={selectedProduct}
          plan={plan}
          shopId={shopId}
          platform={platform}
          allShops={allShops}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      {historyProduct && (
        <HistoryPanel
          product={historyProduct}
          shopId={shopId}
          plan={plan}
          platform={platform}
          onClose={() => setHistoryProduct(null)}
        />
      )}
      {migrateProduct && (
        <MigratePanel
          product={migrateProduct}
          sourcePlatform={platform}
          allShops={allShops}
          plan={plan}
          onClose={() => setMigrateProduct(null)}
        />
      )}

      <div className="space-y-4">
        <ProductsSummary products={sorted} />

        {!canOptimise && sorted.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-center justify-between gap-4">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <span className="font-medium">
                {sorted.filter((p) => calcSeoScore(p) === "poor").length} listings need attention
              </span>{" "}
              — upgrade to Growth to start optimising.
            </p>
            <a href="/pricing" className={cn(buttonVariants({ size: "sm" }), "shrink-0 text-xs")}>
              Upgrade <ChevronRight className="size-3" />
            </a>
          </div>
        )}

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Products</CardTitle>
              <button
                onClick={() => fetchProducts()}
                disabled={loading}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Refresh"
              >
                <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {loading && products.length === 0 ? (
              <div className="py-8 text-center">
                <Spinner size="lg" className="mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Loading products…</p>
              </div>
            ) : error ? (
              <div className="flex items-start gap-3 py-4">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Failed to load products</p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                </div>
                <button onClick={() => fetchProducts()} className="text-xs text-primary hover:underline shrink-0">
                  Retry
                </button>
              </div>
            ) : products.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No products found.</p>
            ) : (
              <>
                {sorted.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={p}
                    canOptimise={canOptimise}
                    onOptimise={setSelectedProduct}
                    onMigrate={setMigrateProduct}
                    onLocked={onUpgrade}
                    onViewHistory={setHistoryProduct}
                    lastOptimisedAt={history[p.id]}
                  />
                ))}
                {nextCursor && (
                  <Button
                    variant="outline"
                    className="w-full mt-3 text-xs"
                    onClick={() => fetchProducts(nextCursor)}
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" /> : "Load more"}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {plan !== "studio" && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center justify-between py-4 gap-4">
              <div>
                <p className="text-sm font-medium">Stop copy-pasting. Push listings live from here.</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Studio sends your optimised content directly to {platform === "shopify" ? "Shopify" : "eBay"} — one click, no tab switching.
                </p>
              </div>
              <a href="/pricing" className={cn(buttonVariants({ size: "sm" }), "shrink-0 whitespace-nowrap")}>
                Upgrade to Studio <ArrowRight className="size-3.5" />
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

// ─── Locked state ─────────────────────────────────────────────────────────────

function LockedState() {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="rounded-xl border border-border/50 bg-card p-8 text-center space-y-5">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Store className="size-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">Connect your store</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            See every product&apos;s SEO health at a glance. Fix underperforming listings in seconds, not hours.
          </p>
        </div>
        <ul className="space-y-2.5 text-left text-sm">
          {[
            { text: "SEO score on every product — see which listings are costing you sales", strong: true },
            { text: "Sorted by urgency — worst performers always at the top" },
            { text: "One-click optimise — AI rewrites using your existing description as context" },
            { text: "Side-by-side comparison — current vs optimised before you commit" },
            { text: "Push directly to Shopify or eBay with no copy-paste (Studio)" },
          ].map(({ text, strong }) => (
            <li key={text} className="flex items-start gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span className={strong ? "font-medium" : "text-muted-foreground"}>{text}</span>
            </li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="rounded-lg border border-border/50 p-3 text-center">
            <p className="font-semibold">Growth</p>
            <p className="text-xs text-muted-foreground mt-0.5">1 store · $29/mo</p>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
            <p className="font-semibold">Studio</p>
            <p className="text-xs text-muted-foreground mt-0.5">Unlimited stores · $79/mo</p>
          </div>
        </div>
        <a href="/pricing" className={buttonVariants({ className: "w-full" })}>
          Upgrade to Growth <ArrowRight className="size-3.5" />
        </a>
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export function ShopDashboard({
  plan,
  shops,
  connected,
  error,
  autoProductId,
  autoShopId,
}: {
  plan: string;
  shops: Shop[];
  connected: boolean;
  error?: string;
  autoProductId?: string;
  autoShopId?: string;
}) {
  const canAccess = plan === "growth" || plan === "studio";
  const isStudio = plan === "studio";
  const maxShops = isStudio ? Infinity : 1;
  const canAddMore = isStudio || shops.length < maxShops;
  const canOptimise = canAccess;

  const initialShopId = useMemo(() => {
    if (autoShopId && shops.find((s) => s.id === autoShopId)) return autoShopId;
    return shops[0]?.id ?? "";
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [activeShopId, setActiveShopId] = useState<string>(initialShopId);
  const [showConnect, setShowConnect] = useState(shops.length === 0 && canAccess);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (connected) toast.success("Store connected!");
    if (error === "connection_failed") toast.error("Connection failed. Please try again.");
    if (error === "upgrade_required") toast.error("Upgrade to Growth or Studio to connect a shop.");
  }, [connected, error]);

  function handleSelectShop(id: string) {
    setActiveShopId(id);
    setShowConnect(false);
  }

  function handleConnectClick() {
    setShowConnect(true);
    setActiveShopId("");
  }

  async function handleDisconnect(shop: Shop) {
    if (!confirm(`Disconnect ${shop.shop_name}? You can reconnect at any time.`)) return;
    try {
      const endpoint = shop.platform === "ebay" ? "/api/ebay/disconnect" : "/api/shopify/disconnect";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: shop.id }),
      });
      if (!res.ok) throw new Error();
      window.location.reload();
    } catch {
      toast.error("Failed to disconnect. Please try again.");
    }
  }

  const activeShop = shops.find((s) => s.id === activeShopId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Store className="size-5 text-primary" />
          My Shop
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your store to see SEO scores and optimise listings without copy-paste.
        </p>
      </div>

      {!canAccess ? (
        <LockedState />
      ) : shops.length === 0 && !showConnect ? (
        <ConnectForm />
      ) : (
        <div className="space-y-5">
          {/* Store tabs — only shown when there's at least one shop or can connect */}
          {(shops.length > 0 || showConnect) && (
            <div className="space-y-0">
              <StoreTabs
                shops={shops}
                activeId={activeShopId}
                onSelect={handleSelectShop}
                canAddMore={canAddMore}
                showingConnect={showConnect}
                onConnectClick={handleConnectClick}
              />

              {/* Active shop header bar */}
              {activeShop && !showConnect && (
                <div className="flex items-center justify-between rounded-b-none rounded-t-none border-x border-b border-border/50 bg-muted/20 px-4 py-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Connected</span>
                    <span className="text-border">·</span>
                    <a
                      href={`https://${activeShop.shop_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {activeShop.shop_url}
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                  <button
                    onClick={() => handleDisconnect(activeShop)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Unplug className="size-3" />
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          {showConnect ? (
            <ConnectForm />
          ) : activeShop ? (
            <ShopProductsPanel
              shopId={activeShop.id}
              plan={plan}
              platform={activeShop.platform}
              canOptimise={canOptimise}
              onUpgrade={() => setUpgradeOpen(true)}
              autoProductId={activeShop.id === (autoShopId ?? activeShop.id) ? autoProductId : undefined}
              allShops={shops}
            />
          ) : null}
        </div>
      )}

      {/* Upgrade modal fallback */}
      {upgradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl bg-card border border-border p-6 space-y-4">
            <h2 className="font-semibold">Upgrade to optimise</h2>
            <p className="text-sm text-muted-foreground">
              Growth and Studio plans unlock AI optimisation for all your connected store products.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setUpgradeOpen(false)}>
                Cancel
              </Button>
              <a href="/pricing" className={cn(buttonVariants(), "flex-1")}>
                View plans
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
