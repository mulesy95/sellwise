"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Store,
  Sparkles,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  Lock,
  AlertCircle,
  Unplug,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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

// ─── Shopify connect form ────────────────────────────────────────────────────

function ShopifyConnectForm({ plan }: { plan: string }) {
  const [shopUrl, setShopUrl] = useState("");
  const [connecting, setConnecting] = useState(false);
  const canConnect = plan === "growth" || plan === "studio";

  function handleConnect() {
    if (!shopUrl.trim()) return;
    setConnecting(true);
    window.location.href = `/api/shopify/connect?shop=${encodeURIComponent(shopUrl.trim())}`;
  }

  if (!canConnect) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border/50 bg-card p-8 text-center space-y-4 max-w-md mx-auto">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Store className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Connect your Shopify store</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Available on Growth and Studio plans. Here&apos;s what you get:
            </p>
          </div>
          <ul className="space-y-2 text-left text-sm text-muted-foreground">
            {[
              "See all your products in one place",
              "Optimise listings with one click — no copy-paste",
              "AI-generated titles, bullets, and descriptions",
              "Push changes directly back to Shopify (Studio only)",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {item}
              </li>
            ))}
          </ul>
          <a href="/pricing" className={buttonVariants({ className: "w-full" })}>
            Upgrade to Growth <ArrowRight className="size-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-8 text-center space-y-4 max-w-md mx-auto">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
        <Store className="size-5 text-primary" />
      </div>
      <div className="space-y-1">
        <h2 className="font-semibold">Connect your Shopify store</h2>
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

// ─── Shopify product row ──────────────────────────────────────────────────────

function ShopifyProductRow({
  product,
  onOptimise,
}: {
  product: ShopifyProduct;
  onOptimise: (p: ShopifyProduct) => void;
}) {
  const image = product.images?.[0]?.src;
  const price = product.variants?.[0]?.price;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
      {image ? (
        <img
          src={image}
          alt={product.title}
          className="size-10 rounded-md object-cover shrink-0 bg-muted"
        />
      ) : (
        <div className="size-10 rounded-md bg-muted shrink-0 flex items-center justify-center">
          <Store className="size-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{product.title}</p>
        <p className="text-xs text-muted-foreground">{price ? `$${price}` : ""}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge
          variant={product.status === "active" ? "default" : "secondary"}
          className="text-xs capitalize"
        >
          {product.status}
        </Badge>
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7"
          onClick={() => onOptimise(product)}
        >
          <Sparkles className="size-3.5" />
          Optimise
        </Button>
      </div>
    </div>
  );
}

// ─── Shopify optimise panel ───────────────────────────────────────────────────

function ShopifyOptimisePanel({
  product,
  plan,
  onClose,
}: {
  product: ShopifyProduct;
  plan: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShopifyResult | null>(null);
  const [pushing, setPushing] = useState(false);
  const isStudio = plan === "studio";

  async function handleOptimise() {
    setLoading(true);
    setResult(null);
    try {
      const imageUrl = product.images?.[0]?.src;
      const res = await fetch("/api/optimise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "shopify",
          productName: product.title,
          ...(imageUrl && { imageUrl }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to optimise");
      setResult(data);
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
      const res = await fetch("/api/shopify/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          title: result?.productTitle,
          body_html: result?.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to push");
      toast.success("Product updated in Shopify");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to push");
    } finally {
      setPushing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="optimise-panel-title"
    >
      <div className="w-full max-w-lg bg-card rounded-xl border border-border shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 id="optimise-panel-title" className="font-semibold text-sm">Optimise listing</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Product</p>
            <p className="text-sm font-medium line-clamp-2">{product.title}</p>
          </div>
          {!result ? (
            <Button onClick={handleOptimise} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Optimising...
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  Generate optimised listing
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              {result.metaTitle && <ResultField label="Meta title" value={String(result.metaTitle)} />}
              {result.metaDescription && <ResultField label="Meta description" value={String(result.metaDescription)} />}
              {result.productTitle && <ResultField label="Product title" value={String(result.productTitle)} />}
              {result.description && <ResultField label="Description" value={String(result.description)} clamp />}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1 text-xs" onClick={() => setResult(null)}>
                  Regenerate
                </Button>
                {isStudio ? (
                  <Button className="flex-1 text-xs" onClick={handlePush} disabled={pushing}>
                    {pushing ? <><Spinner size="sm" className="mr-1.5" />Applying…</> : "Apply to Shopify"}
                  </Button>
                ) : (
                  <a href="/pricing" className={cn(buttonVariants(), "flex-1 text-xs")}>
                    <Lock className="size-3" />
                    Studio to apply
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function ResultField({
  label,
  value,
  clamp,
}: {
  label: string;
  value: string;
  clamp?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <p className={cn("text-sm bg-muted/40 rounded-md p-2", clamp && "line-clamp-4")}>
        {value}
      </p>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export function ShopDashboard({
  plan,
  shopifyShop,
  connected,
  error,
}: {
  plan: string;
  shopifyShop: Shop | null;
  connected: boolean;
  error?: string;
}) {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    if (!shopifyShop) return;
    if (!confirm(`Disconnect ${shopifyShop.shop_name}? You can reconnect at any time.`)) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/shopify/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: shopifyShop.id }),
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      window.location.reload();
    } catch {
      toast.error("Failed to disconnect store. Please try again.");
      setDisconnecting(false);
    }
  }

  const fetchProducts = useCallback(async (cursor?: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
      const res = await fetch(`/api/shopify/listings${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load products");
      if (cursor) {
        setProducts((p) => [...p, ...data.products]);
      } else {
        setProducts(data.products ?? []);
      }
      setNextCursor(data.nextCursor);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (shopifyShop) fetchProducts();
  }, [shopifyShop, fetchProducts]);

  useEffect(() => {
    if (connected) toast.success("Shopify store connected!");
    if (error === "connection_failed") toast.error("Connection failed. Please try again.");
    if (error === "upgrade_required") toast.error("Upgrade to Growth or Studio to connect a shop.");
  }, [connected, error]);

  return (
    <div className="space-y-6">
      {selectedProduct && (
        <ShopifyOptimisePanel
          product={selectedProduct}
          plan={plan}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Store className="size-5 text-primary" />
          My Shop
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your Shopify store to audit and optimise listings directly.
        </p>
      </div>

      {!shopifyShop ? (
        <ShopifyConnectForm plan={plan} />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-primary/10">
                <Store className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{shopifyShop.shop_name}</p>
                <p className="text-xs text-muted-foreground">{shopifyShop.shop_url}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs text-green-600 border-green-500/30">
                Connected
              </Badge>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => fetchProducts()}
                disabled={loading}
              >
                <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              </Button>
              <a
                href={`https://${shopifyShop.shop_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
              >
                <ExternalLink className="size-3.5" />
              </a>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
                title="Disconnect store"
              >
                <Unplug className={cn("size-3.5 text-muted-foreground", disconnecting && "animate-pulse")} />
              </Button>
            </div>
          </div>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Products</CardTitle>
              <CardDescription className="text-xs">{products.length} loaded</CardDescription>
            </CardHeader>
            <CardContent>
              {loading && products.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Spinner size="lg" className="mx-auto mb-3" />
                  Loading products...
                </div>
              ) : loadError ? (
                <div className="flex items-start gap-3 py-4">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-destructive">Failed to load products</p>
                    <p className="text-xs text-muted-foreground">{loadError}</p>
                  </div>
                  <button onClick={() => fetchProducts()} className="text-xs text-primary hover:underline">
                    Retry
                  </button>
                </div>
              ) : products.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No products found.</p>
              ) : (
                <>
                  {products.map((p) => (
                    <ShopifyProductRow key={p.id} product={p} onOptimise={setSelectedProduct} />
                  ))}
                  {nextCursor && (
                    <Button
                      variant="outline"
                      className="w-full mt-3 text-xs"
                      onClick={() => fetchProducts(nextCursor)}
                      disabled={loading}
                    >
                      Load more
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {plan !== "studio" && (
            <Card className="border-border/50">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium">Push optimisations directly to Shopify</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Apply AI improvements without copy-paste. Studio plan only.
                  </p>
                </div>
                <a href="/pricing" className={buttonVariants({ size: "sm" })}>
                  Upgrade to Studio <ArrowRight className="size-3.5" />
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
