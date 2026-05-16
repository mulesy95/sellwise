"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Store, Sparkles, ExternalLink, RefreshCw, ArrowRight,
  Lock, AlertCircle, Unplug, X, Copy, Check, Plus, ChevronRight, ImagePlus,
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
  onLocked,
}: {
  product: ShopifyProduct;
  canOptimise: boolean;
  onOptimise: (p: ShopifyProduct) => void;
  onLocked: () => void;
}) {
  const image = product.images?.[0]?.src;
  const price = product.variants?.[0]?.price;
  const score = calcSeoScore(product);
  const { label, dot, badge } = SCORE_CONFIG[score];

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
        </div>
      </div>
      <Button
        size="sm"
        variant={score === "poor" ? "default" : "outline"}
        className="text-xs h-7 shrink-0"
        onClick={() => canOptimise ? onOptimise(product) : onLocked()}
      >
        {canOptimise ? (
          <><Sparkles className="size-3.5" />Optimise</>
        ) : (
          <><Lock className="size-3.5" />Optimise</>
        )}
      </Button>
    </div>
  );
}

// ─── Optimise slide-out panel ─────────────────────────────────────────────────

function OptimisePanel({
  product,
  plan,
  shopId,
  onClose,
}: {
  product: ShopifyProduct;
  plan: string;
  shopId: string;
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
          platform: "shopify",
          productName: product.title,
          existingContent: existingText.slice(0, 800),
          // Uploaded image takes precedence over existing Shopify image URL
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
        productTitle: data.productTitle ?? "",
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
      const requests: Promise<Response>[] = [
        fetch("/api/shopify/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, shopId, title: result.productTitle, body_html: result.description }),
        }),
      ];

      if (uploadedImage) {
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

      toast.success(uploadedImage ? "Content and image pushed to Shopify" : "Product updated in Shopify");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to push");
    } finally {
      setPushing(false);
    }
  }

  async function copyAll() {
    if (!result) return;
    const text = [
      `META TITLE:\n${result.metaTitle}`,
      `META DESCRIPTION:\n${result.metaDescription}`,
      `PRODUCT TITLE:\n${result.productTitle}`,
      `DESCRIPTION:\n${result.description}`,
    ].join("\n\n");
    await navigator.clipboard.writeText(text);
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
              <p className="text-xs text-muted-foreground">Shopify listing optimiser</p>
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
                <div>
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
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  {existingText ? (
                    <p className="text-sm bg-muted/30 rounded-md px-3 py-2 line-clamp-6 leading-relaxed">
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
                  <ResultField
                    label="Product title"
                    value={result.productTitle}
                    onChange={(v) => setResult((r) => r && { ...r, productTitle: v })}
                  />
                  <ResultField
                    label="Description"
                    value={result.description}
                    onChange={(v) => setResult((r) => r && { ...r, description: v })}
                    multiline
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        {result && (
          <div className="shrink-0 border-t border-border px-6 py-4 flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setResult(null)} className="text-xs">
              Regenerate
            </Button>
            <Button variant="ghost" size="sm" onClick={copyAll} className="text-xs">
              <Copy className="size-3.5" />
              Copy all
            </Button>
            <div className="flex-1" />
            {isStudio ? (
              <Button size="sm" onClick={handlePush} disabled={pushing}>
                {pushing
                  ? <><Spinner size="sm" className="mr-1.5" />Applying…</>
                  : uploadedImage
                  ? "Apply content + image"
                  : "Apply to Shopify"}
              </Button>
            ) : (
              <a href="/pricing" className={cn(buttonVariants({ size: "sm" }), "text-xs")}>
                <Lock className="size-3.5" />
                Studio to apply
              </a>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Connect form ─────────────────────────────────────────────────────────────

function ConnectForm() {
  const [shopUrl, setShopUrl] = useState("");
  const [connecting, setConnecting] = useState(false);

  function handleConnect() {
    if (!shopUrl.trim()) return;
    setConnecting(true);
    window.location.href = `/api/shopify/connect?shop=${encodeURIComponent(shopUrl.trim())}`;
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-8 text-center space-y-4 max-w-md mx-auto">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
        <Store className="size-5 text-primary" />
      </div>
      <div className="space-y-1">
        <h2 className="font-semibold">Connect a Shopify store</h2>
        <p className="text-sm text-muted-foreground">
          Enter your store URL to connect. We&apos;ll read your products and let you optimise them with AI.
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="yourstore.myshopify.com"
          value={shopUrl}
          onChange={(e) => setShopUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleConnect(); }}
          disabled={connecting}
        />
        <Button onClick={handleConnect} disabled={!shopUrl.trim() || connecting}>
          {connecting ? <Spinner size="md" /> : "Connect"}
        </Button>
      </div>
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
  canOptimise,
  onUpgrade,
}: {
  shopId: string;
  plan: string;
  canOptimise: boolean;
  onUpgrade: () => void;
}) {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);

  const fetchProducts = useCallback(async (cursor?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ shopId });
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/shopify/listings?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load products");
      if (cursor) {
        setProducts((p) => [...p, ...data.products]);
      } else {
        setProducts(sortByScore(data.products ?? []));
      }
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const sorted = products; // already sorted on fetch

  return (
    <>
      {selectedProduct && (
        <OptimisePanel
          product={selectedProduct}
          plan={plan}
          shopId={shopId}
          onClose={() => setSelectedProduct(null)}
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
                    onLocked={onUpgrade}
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
          <Card className="border-border/50">
            <CardContent className="flex items-center justify-between py-4 gap-4">
              <div>
                <p className="text-sm font-medium">Apply changes directly to Shopify</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No copy-paste. Optimise and push with one click. Studio plan only.
                </p>
              </div>
              <a href="/pricing" className={cn(buttonVariants({ size: "sm" }), "shrink-0")}>
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
          <h2 className="font-semibold text-lg">Connect your Shopify store</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            See every product&apos;s SEO health at a glance. Fix underperforming listings in seconds — not hours.
          </p>
        </div>
        <ul className="space-y-2.5 text-left text-sm">
          {[
            { text: "SEO score on every product — see which listings are costing you sales", strong: true },
            { text: "Sorted by urgency — worst performers always at the top" },
            { text: "One-click optimise — AI rewrites using your existing description as context" },
            { text: "Side-by-side comparison — current vs optimised before you commit" },
            { text: "Push directly to Shopify with no copy-paste (Studio)" },
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
}: {
  plan: string;
  shops: Shop[];
  connected: boolean;
  error?: string;
}) {
  const canAccess = plan === "growth" || plan === "studio";
  const isStudio = plan === "studio";
  const maxShops = isStudio ? Infinity : 1;
  const canAddMore = isStudio || shops.length < maxShops;
  const canOptimise = canAccess;

  const [activeShopId, setActiveShopId] = useState<string>(shops[0]?.id ?? "");
  const [showConnect, setShowConnect] = useState(shops.length === 0 && canAccess);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (connected) toast.success("Shopify store connected!");
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
      const res = await fetch("/api/shopify/disconnect", {
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
              canOptimise={canOptimise}
              onUpgrade={() => setUpgradeOpen(true)}
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
