"use client";

import { useState, useEffect, useCallback } from "react";
import { Store, Plus, Sparkles, ExternalLink, RefreshCw, ArrowRight, Lock } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
  platform: string;
  created_at: string;
}

interface OptimiseResult {
  metaTitle?: string;
  metaDescription?: string;
  productTitle?: string;
  description?: string;
}

function ConnectForm({ plan }: { plan: string }) {
  const [shopUrl, setShopUrl] = useState("");
  const canConnect = plan === "growth" || plan === "studio";

  if (!canConnect) {
    return (
      <div className="rounded-xl border border-border/50 p-8 text-center space-y-3">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
          <Lock className="size-5 text-muted-foreground" />
        </div>
        <h2 className="font-semibold">Connect your Shopify store</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Connecting your shop and running live audits is available on Growth and Studio plans.
        </p>
        <a href="/pricing" className={buttonVariants()}>
          Upgrade to connect <ArrowRight className="size-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 p-8 text-center space-y-4 max-w-md mx-auto">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
        <Store className="size-5 text-primary" />
      </div>
      <div className="space-y-1">
        <h2 className="font-semibold">Connect your Shopify store</h2>
        <p className="text-sm text-muted-foreground">
          Enter your store URL to connect. We'll read your products and run live audits.
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="yourstore.myshopify.com"
          value={shopUrl}
          onChange={(e) => setShopUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && shopUrl.trim()) {
              window.location.href = `/api/shopify/connect?shop=${encodeURIComponent(shopUrl.trim())}`;
            }
          }}
        />
        <Button
          onClick={() => {
            if (shopUrl.trim()) {
              window.location.href = `/api/shopify/connect?shop=${encodeURIComponent(shopUrl.trim())}`;
            }
          }}
          disabled={!shopUrl.trim()}
        >
          Connect
        </Button>
      </div>
    </div>
  );
}

function ProductRow({
  product,
  plan,
  onOptimise,
}: {
  product: ShopifyProduct;
  plan: string;
  onOptimise: (product: ShopifyProduct) => void;
}) {
  const image = product.images?.[0]?.src;
  const price = product.variants?.[0]?.price;
  const isStudio = plan === "studio";

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
      {image ? (
        <img src={image} alt={product.title} className="size-10 rounded-md object-cover shrink-0 bg-muted" />
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
        <Badge variant={product.status === "active" ? "default" : "secondary"} className="text-xs capitalize">
          {product.status}
        </Badge>
        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onOptimise(product)}>
          <Sparkles className="size-3" />
          Optimise
        </Button>
      </div>
    </div>
  );
}

function OptimisePanel({
  product,
  plan,
  onClose,
  shopUrl,
}: {
  product: ShopifyProduct;
  plan: string;
  onClose: () => void;
  shopUrl: string;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimiseResult | null>(null);
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
          title: result.productTitle,
          body_html: result.description,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-background rounded-xl border border-border shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-sm">Optimise listing</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">Close</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Product</p>
            <p className="text-sm font-medium">{product.title}</p>
          </div>

          {!result && (
            <Button onClick={handleOptimise} disabled={loading} className="w-full">
              {loading ? (
                <><span className="size-3.5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground mr-2" />Optimising...</>
              ) : (
                <><Sparkles className="size-3.5" />Generate optimised listing</>
              )}
            </Button>
          )}

          {result && (
            <div className="space-y-3">
              {result.metaTitle && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Meta title</p>
                  <p className="text-sm bg-muted/40 rounded-md p-2">{result.metaTitle}</p>
                </div>
              )}
              {result.metaDescription && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Meta description</p>
                  <p className="text-sm bg-muted/40 rounded-md p-2">{result.metaDescription}</p>
                </div>
              )}
              {result.productTitle && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Product title</p>
                  <p className="text-sm bg-muted/40 rounded-md p-2">{result.productTitle}</p>
                </div>
              )}
              {result.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-sm bg-muted/40 rounded-md p-2 whitespace-pre-wrap line-clamp-4">{result.description}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1 text-xs" onClick={() => setResult(null)}>
                  Regenerate
                </Button>
                {isStudio ? (
                  <Button className="flex-1 text-xs" onClick={handlePush} disabled={pushing}>
                    {pushing ? "Applying..." : "Apply to Shopify"}
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

export function ShopDashboard({
  plan,
  shop,
  connected,
  error,
}: {
  plan: string;
  shop: Shop | null;
  connected: boolean;
  error?: string;
}) {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [nextPageInfo, setNextPageInfo] = useState<string | undefined>();
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);

  const fetchProducts = useCallback(async (pageInfo?: string) => {
    setLoadingProducts(true);
    try {
      const params = pageInfo ? `?page_info=${pageInfo}` : "";
      const res = await fetch(`/api/shopify/listings${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (pageInfo) {
        setProducts((p) => [...p, ...data.products]);
      } else {
        setProducts(data.products ?? []);
      }
      setNextPageInfo(data.nextPageInfo);
    } catch (err) {
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    if (shop) fetchProducts();
  }, [shop, fetchProducts]);

  useEffect(() => {
    if (connected) toast.success("Shopify store connected!");
    if (error === "connection_failed") toast.error("Connection failed. Please try again.");
    if (error === "upgrade_required") toast.error("Upgrade to Growth or Studio to connect a shop.");
  }, [connected, error]);

  return (
    <div className="space-y-6">
      {selectedProduct && (
        <OptimisePanel
          product={selectedProduct}
          plan={plan}
          shopUrl={shop?.shop_url ?? ""}
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

      {!shop ? (
        <ConnectForm plan={plan} />
      ) : (
        <div className="space-y-4">
          {/* Connected shop header */}
          <div className="flex items-center justify-between rounded-xl border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-primary/10">
                <Store className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{shop.shop_name}</p>
                <p className="text-xs text-muted-foreground">{shop.shop_url}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs text-green-600 border-green-500/30">Connected</Badge>
              <Button variant="ghost" size="icon-sm" onClick={() => fetchProducts()} disabled={loadingProducts}>
                <RefreshCw className={cn("size-3.5", loadingProducts && "animate-spin")} />
              </Button>
              <a href={`https://${shop.shop_url}`} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>

          {/* Products */}
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Products</CardTitle>
                  <CardDescription className="text-xs">{products.length} loaded</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingProducts && products.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <div className="mx-auto mb-3 size-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                  Loading products...
                </div>
              ) : products.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No products found.</p>
              ) : (
                <>
                  {products.map((p) => (
                    <ProductRow key={p.id} product={p} plan={plan} onOptimise={setSelectedProduct} />
                  ))}
                  {nextPageInfo && (
                    <Button
                      variant="outline"
                      className="w-full mt-3 text-xs"
                      onClick={() => fetchProducts(nextPageInfo)}
                      disabled={loadingProducts}
                    >
                      Load more
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {plan !== "studio" && (
            <div className="rounded-xl border border-border/50 bg-muted/30 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Push optimisations directly to Shopify</p>
                <p className="text-xs text-muted-foreground mt-0.5">Apply AI improvements without copy-paste. Studio plan only.</p>
              </div>
              <a href="/pricing" className={buttonVariants({ size: "sm" })}>
                Upgrade to Studio <ArrowRight className="size-3.5" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
