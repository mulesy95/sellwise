"use client";

import { useEffect, useState } from "react";
import { calcSeoScore } from "@/lib/seo-score";
import type { ShopifyProduct } from "@/lib/shopify";

interface Counts {
  poor: number;
  fair: number;
  good: number;
}

export function ShopHealthCounts({ shop }: { shop: { id: string; platform: string } }) {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    const endpoint = shop.platform === "ebay" ? "/api/ebay/listings" : "/api/shopify/listings";
    fetch(`${endpoint}?shopId=${encodeURIComponent(shop.id)}`)
      .then((r) => r.json())
      .then((d) => {
        const items: ShopifyProduct[] = d.listings ?? d.products ?? [];
        const poor = items.filter((p) => calcSeoScore(p) === "poor").length;
        const fair = items.filter((p) => calcSeoScore(p) === "fair").length;
        const good = items.filter((p) => calcSeoScore(p) === "good").length;
        setCounts({ poor, fair, good });
      })
      .catch(() => {});
  }, [shop.id, shop.platform]);

  if (!counts) {
    return (
      <span className="text-xs text-muted-foreground capitalize">
        {shop.platform} · Loading health…
      </span>
    );
  }

  const parts: React.ReactNode[] = [];
  if (counts.poor > 0) {
    parts.push(
      <span key="poor" className="text-red-600 dark:text-red-400 font-medium">
        {counts.poor} need attention
      </span>
    );
  }
  if (counts.fair > 0) {
    parts.push(
      <span key="fair" className="text-amber-600 dark:text-amber-400">
        {counts.fair} could improve
      </span>
    );
  }
  if (counts.poor === 0 && counts.fair === 0 && counts.good > 0) {
    parts.push(
      <span key="good" className="text-emerald-600 dark:text-emerald-400">
        {counts.good} looking good
      </span>
    );
  }

  if (parts.length === 0) {
    return (
      <span className="text-xs text-muted-foreground capitalize">
        {shop.platform} · No products found
      </span>
    );
  }

  return (
    <span className="text-xs flex items-center gap-1.5 flex-wrap">
      <span className="text-muted-foreground capitalize">{shop.platform} ·</span>
      {parts.reduce<React.ReactNode[]>((acc, el, i) => [...acc, ...(i > 0 ? [<span key={`sep-${i}`} className="text-muted-foreground/50">·</span>] : []), el], [])}
    </span>
  );
}
