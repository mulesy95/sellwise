export type Platform = "etsy" | "amazon" | "shopify" | "ebay";

export const PLATFORMS: Platform[] = ["etsy", "amazon", "shopify", "ebay"];

export const PLATFORM_LABELS: Record<Platform, string> = {
  etsy: "Etsy",
  amazon: "Amazon",
  shopify: "Shopify",
  ebay: "eBay",
};

export const AUDIT_SECTIONS: Record<
  Platform,
  Array<{ key: string; label: string; max: number }>
> = {
  etsy: [
    { key: "titleScore", label: "Title", max: 40 },
    { key: "tagsScore", label: "Tags", max: 35 },
    { key: "descriptionScore", label: "Description", max: 25 },
  ],
  amazon: [
    { key: "titleScore", label: "Title", max: 30 },
    { key: "bulletsScore", label: "Bullet Points", max: 40 },
    { key: "backendScore", label: "Backend Keywords", max: 30 },
  ],
  shopify: [
    { key: "metaTitleScore", label: "Meta Title", max: 30 },
    { key: "metaDescScore", label: "Meta Description", max: 40 },
    { key: "copyScore", label: "Product Copy", max: 30 },
  ],
  ebay: [
    { key: "titleScore", label: "Title", max: 50 },
    { key: "descriptionScore", label: "Description", max: 50 },
  ],
};

export const PLATFORM_URL_EXAMPLES: Partial<Record<Platform, string>> = {
  amazon: "https://www.amazon.com/dp/B08N5WRWNW",
  shopify: "https://yourstore.com/products/product-name",
  ebay: "https://www.ebay.com/itm/123456789",
};

export function detectPlatformFromUrl(url: string): Platform | null {
  if (/etsy\.com\/listing\/\d+/.test(url)) return "etsy";
  if (/amazon\.[a-z.]+\/(dp\/[A-Z0-9]{10}|[^/]+\/dp\/[A-Z0-9]{10})/.test(url))
    return "amazon";
  if (/ebay\.[a-z.]+\/itm\//.test(url)) return "ebay";
  if (/\/products\//.test(url)) return "shopify";
  return null;
}
