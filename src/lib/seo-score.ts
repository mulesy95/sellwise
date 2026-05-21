import type { ShopifyProduct } from "@/lib/shopify";

export type SeoScore = "good" | "fair" | "poor";

export function calcSeoScore(p: ShopifyProduct): SeoScore {
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
