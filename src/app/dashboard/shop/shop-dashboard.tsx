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
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import type { EtsyListing } from "@/lib/etsy";

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

interface EtsyResult {
  title?: string;
  tags?: string[];
  description?: string;
}

// ─── Shopify connect form ────────────────────────────────────────────────────

function ShopifyConnectForm({ plan }: { plan: string }) {
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
          Connecting your shop is available on Growth and Studio plans.
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
          Enter your store URL to connect. We&apos;ll read your products and run live audits.
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

// ─── Etsy connect button ─────────────────────────────────────────────────────

function EtsyConnectButton({ plan }: { plan: string }) {
  const canConnect = plan === "growth" || plan === "studio";

  if (!canConnect) {
    return (
      <div className="rounded-xl border border-border/50 p-8 text-center space-y-3">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
          <Lock className="size-5 text-muted-foreground" />
        </div>
        <h2 className="font-semibold">Connect your Etsy shop</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Connecting your shop is available on Growth and Studio plans.
        </p>
        <a href="/pricing" className={buttonVariants()}>
          Upgrade to connect <ArrowRight className="size-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 p-8 text-center space-y-4 max-w-md mx-auto">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#F1641E]/10">
        <Store className="size-5 text-[#F1641E]" />
      </div>
      <div className="space-y-1">
        <h2 className="font-semibold">Connect your Etsy shop</h2>
        <p className="text-sm text-muted-foreground">
          We&apos;ll read your active listings and generate SEO-optimised copy for each one.
        </p>
      </div>
      <a href="/api/etsy/connect" className={buttonVariants()}>
        Connect with Etsy
        <ArrowRight className="size-3.5" />
      </a>
    </div>
  );
}

// ─── Shopify product row + optimise panel ────────────────────────────────────

function ShopifyProductRow({
  product,
  plan,
  onOptimise,
}: {
  product: ShopifyProduct;
  plan: string;
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
          <Sparkles className="size-3" />
          Optimise
        </Button>
      </div>
    </div>
  );
}

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
    <OptimisePanelShell title={product.title} onClose={onClose}>
      {!result ? (
        <Button onClick={handleOptimise} disabled={loading} className="w-full">
          {loading ? (
            <>
              <span className="size-3.5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground mr-2" />
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
    </OptimisePanelShell>
  );
}

// ─── Etsy listing row + optimise panel ───────────────────────────────────────

function EtsyListingRow({
  listing,
  onOptimise,
}: {
  listing: EtsyListing;
  onOptimise: (l: EtsyListing) => void;
}) {
  const image = listing.images?.[0]?.url_570xN;
  const price = listing.price
    ? `${listing.price.currency_code} ${(listing.price.amount / listing.price.divisor).toFixed(2)}`
    : "";

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
      {image ? (
        <img
          src={image}
          alt={listing.title}
          className="size-10 rounded-md object-cover shrink-0 bg-muted"
        />
      ) : (
        <div className="size-10 rounded-md bg-muted shrink-0 flex items-center justify-center">
          <Store className="size-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{listing.title}</p>
        <p className="text-xs text-muted-foreground">{price}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={listing.url}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        >
          <ExternalLink className="size-3.5" />
        </a>
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7"
          onClick={() => onOptimise(listing)}
        >
          <Sparkles className="size-3" />
          Optimise
        </Button>
      </div>
    </div>
  );
}

function EtsyOptimisePanel({
  listing,
  plan,
  onClose,
}: {
  listing: EtsyListing;
  plan: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EtsyResult | null>(null);
  const [pushing, setPushing] = useState(false);
  const isStudio = plan === "studio";

  async function handleOptimise() {
    setLoading(true);
    setResult(null);
    try {
      const imageUrl = listing.images?.[0]?.url_570xN;
      const res = await fetch("/api/optimise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: "etsy",
          productName: listing.title,
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
      const res = await fetch("/api/etsy/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.listing_id,
          title: result?.title,
          description: result?.description,
          tags: result?.tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to push");
      toast.success("Listing updated on Etsy");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to push");
    } finally {
      setPushing(false);
    }
  }

  return (
    <OptimisePanelShell title={listing.title} onClose={onClose}>
      {!result ? (
        <Button onClick={handleOptimise} disabled={loading} className="w-full">
          {loading ? (
            <>
              <span className="size-3.5 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground mr-2" />
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
          {result.title && <ResultField label="Title" value={String(result.title)} />}
          {Array.isArray(result.tags) && result.tags.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Tags</p>
              <div className="flex flex-wrap gap-1">
                {(result.tags as string[]).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {result.description && (
            <ResultField label="Description" value={String(result.description)} clamp />
          )}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 text-xs" onClick={() => setResult(null)}>
              Regenerate
            </Button>
            {isStudio ? (
              <Button className="flex-1 text-xs" onClick={handlePush} disabled={pushing}>
                {pushing ? "Applying..." : "Apply to Etsy"}
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
    </OptimisePanelShell>
  );
}

// ─── Shared panel primitives ──────────────────────────────────────────────────

function OptimisePanelShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-background rounded-xl border border-border shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-sm">Optimise listing</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            Close
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Listing</p>
            <p className="text-sm font-medium line-clamp-2">{title}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

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
      <p
        className={cn(
          "text-sm bg-muted/40 rounded-md p-2",
          clamp && "line-clamp-4"
        )}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export function ShopDashboard({
  plan,
  etsyShop,
  shopifyShop,
  connected,
  connectedPlatform,
  error,
  errorPlatform,
}: {
  plan: string;
  etsyShop: Shop | null;
  shopifyShop: Shop | null;
  connected: boolean;
  connectedPlatform?: "etsy" | "shopify";
  error?: string;
  errorPlatform?: "etsy" | "shopify";
}) {
  const defaultTab =
    connectedPlatform ?? (etsyShop ? "etsy" : shopifyShop ? "shopify" : "etsy");
  const [tab, setTab] = useState<"etsy" | "shopify">(defaultTab);

  // Etsy state
  const [etsyListings, setEtsyListings] = useState<EtsyListing[]>([]);
  const [etsyOffset, setEtsyOffset] = useState(0);
  const [etsyTotal, setEtsyTotal] = useState(0);
  const [loadingEtsy, setLoadingEtsy] = useState(false);
  const [etsyError, setEtsyError] = useState<string | null>(null);
  const [selectedEtsyListing, setSelectedEtsyListing] = useState<EtsyListing | null>(null);

  // Shopify state
  const [shopifyProducts, setShopifyProducts] = useState<ShopifyProduct[]>([]);
  const [nextPageInfo, setNextPageInfo] = useState<string | undefined>();
  const [loadingShopify, setLoadingShopify] = useState(false);
  const [shopifyError, setShopifyError] = useState<string | null>(null);
  const [selectedShopifyProduct, setSelectedShopifyProduct] = useState<ShopifyProduct | null>(null);

  const fetchEtsyListings = useCallback(async (offset = 0) => {
    setLoadingEtsy(true);
    setEtsyError(null);
    try {
      const res = await fetch(`/api/etsy/listings?offset=${offset}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load listings");
      if (offset > 0) {
        setEtsyListings((prev) => [...prev, ...(data.listings ?? [])]);
      } else {
        setEtsyListings(data.listings ?? []);
      }
      setEtsyTotal(data.count ?? 0);
      setEtsyOffset(offset + (data.listings?.length ?? 0));
    } catch (err) {
      setEtsyError(err instanceof Error ? err.message : "Failed to load Etsy listings");
    } finally {
      setLoadingEtsy(false);
    }
  }, []);

  const fetchShopifyProducts = useCallback(async (pageInfo?: string) => {
    setLoadingShopify(true);
    setShopifyError(null);
    try {
      const params = pageInfo ? `?page_info=${pageInfo}` : "";
      const res = await fetch(`/api/shopify/listings${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load products");
      if (pageInfo) {
        setShopifyProducts((p) => [...p, ...data.products]);
      } else {
        setShopifyProducts(data.products ?? []);
      }
      setNextPageInfo(data.nextPageInfo);
    } catch (err) {
      setShopifyError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoadingShopify(false);
    }
  }, []);

  useEffect(() => {
    if (etsyShop && tab === "etsy") fetchEtsyListings(0);
  }, [etsyShop, tab, fetchEtsyListings]);

  useEffect(() => {
    if (shopifyShop && tab === "shopify") fetchShopifyProducts();
  }, [shopifyShop, tab, fetchShopifyProducts]);

  useEffect(() => {
    if (connected) {
      toast.success(
        connectedPlatform === "etsy"
          ? "Etsy shop connected!"
          : "Shopify store connected!"
      );
    }
    if (error === "connection_failed") {
      toast.error(
        `${errorPlatform === "etsy" ? "Etsy" : "Shopify"} connection failed. Please try again.`
      );
    }
    if (error === "upgrade_required") {
      toast.error("Upgrade to Growth or Studio to connect a shop.");
    }
  }, [connected, error, connectedPlatform, errorPlatform]);

  return (
    <div className="space-y-6">
      {/* Optimise panels */}
      {selectedEtsyListing && (
        <EtsyOptimisePanel
          listing={selectedEtsyListing}
          plan={plan}
          onClose={() => setSelectedEtsyListing(null)}
        />
      )}
      {selectedShopifyProduct && (
        <ShopifyOptimisePanel
          product={selectedShopifyProduct}
          plan={plan}
          onClose={() => setSelectedShopifyProduct(null)}
        />
      )}

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Store className="size-5 text-primary" />
          My Shop
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your stores to audit and optimise listings directly.
        </p>
      </div>

      {/* Platform tabs */}
      <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/30 p-1 w-fit">
        {(["etsy", "shopify"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setTab(p)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors",
              tab === p
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {p === "etsy" ? "Etsy" : "Shopify"}
            {p === "etsy" && etsyShop && (
              <span className="ml-1.5 inline-flex size-1.5 rounded-full bg-green-500" />
            )}
            {p === "shopify" && shopifyShop && (
              <span className="ml-1.5 inline-flex size-1.5 rounded-full bg-green-500" />
            )}
          </button>
        ))}
      </div>

      {/* Etsy tab */}
      {tab === "etsy" && (
        <>
          {!etsyShop ? (
            <EtsyConnectButton plan={plan} />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-border/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-md bg-[#F1641E]/10">
                    <Store className="size-4 text-[#F1641E]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{etsyShop.shop_name}</p>
                    <a
                      href={etsyShop.shop_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      {etsyShop.shop_url}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs text-green-600 border-green-500/30"
                  >
                    Connected
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => fetchEtsyListings(0)}
                    disabled={loadingEtsy}
                  >
                    <RefreshCw
                      className={cn("size-3.5", loadingEtsy && "animate-spin")}
                    />
                  </Button>
                </div>
              </div>

              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Active listings</CardTitle>
                  <CardDescription className="text-xs">
                    {etsyListings.length} loaded{etsyTotal > 0 ? ` of ${etsyTotal}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingEtsy && etsyListings.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      <div className="mx-auto mb-3 size-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                      Loading listings...
                    </div>
                  ) : etsyError ? (
                    <div className="flex items-start gap-3 py-4">
                      <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">Failed to load listings</p>
                        <p className="text-xs text-muted-foreground">{etsyError}</p>
                      </div>
                      <button onClick={() => fetchEtsyListings(0)} className="text-xs text-primary hover:underline">Retry</button>
                    </div>
                  ) : etsyListings.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No active listings found.
                    </p>
                  ) : (
                    <>
                      {etsyListings.map((l) => (
                        <EtsyListingRow
                          key={l.listing_id}
                          listing={l}
                          onOptimise={setSelectedEtsyListing}
                        />
                      ))}
                      {etsyListings.length < etsyTotal && (
                        <Button
                          variant="outline"
                          className="w-full mt-3 text-xs"
                          onClick={() => fetchEtsyListings(etsyOffset)}
                          disabled={loadingEtsy}
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
                    <p className="text-sm font-medium">
                      Push optimisations directly to Etsy
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Apply AI improvements without copy-paste. Studio plan only.
                    </p>
                  </div>
                  <a href="/pricing" className={buttonVariants({ size: "sm" })}>
                    Upgrade to Studio <ArrowRight className="size-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Shopify tab */}
      {tab === "shopify" && (
        <>
          {!shopifyShop ? (
            <ShopifyConnectForm plan={plan} />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-border/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-md bg-primary/10">
                    <Store className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{shopifyShop.shop_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {shopifyShop.shop_url}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs text-green-600 border-green-500/30"
                  >
                    Connected
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => fetchShopifyProducts()}
                    disabled={loadingShopify}
                  >
                    <RefreshCw
                      className={cn("size-3.5", loadingShopify && "animate-spin")}
                    />
                  </Button>
                  <a
                    href={`https://${shopifyShop.shop_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>

              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Products</CardTitle>
                  <CardDescription className="text-xs">
                    {shopifyProducts.length} loaded
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingShopify && shopifyProducts.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      <div className="mx-auto mb-3 size-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                      Loading products...
                    </div>
                  ) : shopifyError ? (
                    <div className="flex items-start gap-3 py-4">
                      <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">Failed to load products</p>
                        <p className="text-xs text-muted-foreground">{shopifyError}</p>
                      </div>
                      <button onClick={() => fetchShopifyProducts()} className="text-xs text-primary hover:underline">Retry</button>
                    </div>
                  ) : shopifyProducts.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No products found.
                    </p>
                  ) : (
                    <>
                      {shopifyProducts.map((p) => (
                        <ShopifyProductRow
                          key={p.id}
                          product={p}
                          plan={plan}
                          onOptimise={setSelectedShopifyProduct}
                        />
                      ))}
                      {nextPageInfo && (
                        <Button
                          variant="outline"
                          className="w-full mt-3 text-xs"
                          onClick={() => fetchShopifyProducts(nextPageInfo)}
                          disabled={loadingShopify}
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
                    <p className="text-sm font-medium">
                      Push optimisations directly to Shopify
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Apply AI improvements without copy-paste. Studio plan only.
                    </p>
                  </div>
                  <a href="/pricing" className={buttonVariants({ size: "sm" })}>
                    Upgrade to Studio <ArrowRight className="size-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
