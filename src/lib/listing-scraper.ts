import * as cheerio from "cheerio";
import type { Platform } from "@/lib/platforms";

export interface ExtractedListing {
  platform: Platform;
  title: string;
  description: string;
  tags?: string[];
  bullets?: string[];
}

// Fetches product data via Shopify's public products.json endpoint (no auth, no scraping)
export async function fetchShopifyProduct(
  listingUrl: string
): Promise<Omit<ExtractedListing, "platform">> {
  const parsed = new URL(listingUrl);
  const handleMatch = parsed.pathname.match(/\/products\/([^/?#]+)/);
  if (!handleMatch) throw new Error("Could not extract product handle from URL");

  const handle = handleMatch[1];
  const apiUrl = `${parsed.origin}/products/${handle}.json`;

  const response = await fetch(apiUrl, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });

  if (response.status === 404) throw new Error("Product not found on this store");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const data = await response.json();
  const product = data?.product;
  if (!product?.title) throw new Error("Could not extract product data");

  // Strip HTML from body_html
  const rawHtml = product.body_html ?? "";
  const description = rawHtml
    ? cheerio.load(rawHtml).text().replace(/\s+/g, " ").trim()
    : "";

  return { title: product.title as string, description };
}
