export type Platform = "etsy" | "amazon" | "shopify" | "ebay" | "woocommerce" | "wix" | "squarespace" | "tiktok" | "social";

export const PLATFORMS: Platform[] = ["shopify", "ebay", "amazon", "etsy", "woocommerce", "wix", "squarespace", "tiktok", "social"];

// Which platforms have store connect built vs manual-only
export type PlatformCapability = "connect" | "manual";

export const PLATFORM_CAPABILITY: Record<Platform, PlatformCapability> = {
  shopify:     "connect",
  ebay:        "connect",
  amazon:      "manual",
  etsy:        "manual",
  woocommerce: "manual",
  wix:         "manual",
  squarespace: "manual",
  tiktok:      "manual",
  social:      "manual",
};

export const PLATFORM_PILL: Partial<Record<Platform, string>> = {
  shopify:     "bg-green-500/15 text-green-700 dark:text-green-400",
  ebay:        "bg-red-500/15 text-red-700 dark:text-red-400",
  amazon:      "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  etsy:        "bg-orange-400/15 text-orange-600 dark:text-orange-400",
  woocommerce: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
};

export const PLATFORM_LABELS: Record<Platform, string> = {
  etsy: "Etsy",
  amazon: "Amazon",
  shopify: "Shopify",
  ebay: "eBay",
  woocommerce: "WooCommerce",
  wix: "Wix",
  squarespace: "Squarespace",
  tiktok: "TikTok Shop",
  social: "Social",
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
  woocommerce: [
    { key: "metaTitleScore", label: "SEO Title", max: 30 },
    { key: "metaDescScore", label: "SEO Description", max: 40 },
    { key: "copyScore", label: "Product Copy", max: 30 },
  ],
  wix: [
    { key: "metaTitleScore", label: "SEO Title", max: 30 },
    { key: "metaDescScore", label: "SEO Description", max: 40 },
    { key: "copyScore", label: "Product Copy", max: 30 },
  ],
  squarespace: [
    { key: "metaTitleScore", label: "SEO Title", max: 30 },
    { key: "metaDescScore", label: "SEO Description", max: 40 },
    { key: "copyScore", label: "Product Copy", max: 30 },
  ],
  tiktok: [
    { key: "titleScore", label: "Title", max: 50 },
    { key: "descriptionScore", label: "Description", max: 50 },
  ],
  social: [
    { key: "captionScore", label: "Caption", max: 40 },
    { key: "hashtagScore", label: "Hashtags", max: 30 },
    { key: "copyScore", label: "Post Copy", max: 30 },
  ],
};

export const PLATFORM_URL_EXAMPLES: Partial<Record<Platform, string>> = {
  shopify: "https://yourstore.com/products/product-name",
};

export function detectPlatformFromUrl(url: string): Platform | null {
  if (/etsy\.com\/listing\/\d+/.test(url)) return "etsy";
  if (/amazon\.[a-z.]+\/(dp\/[A-Z0-9]{10}|[^/]+\/dp\/[A-Z0-9]{10})/.test(url))
    return "amazon";
  if (/ebay\.[a-z.]+\/itm\//.test(url)) return "ebay";
  if (/\/products\//.test(url)) return "shopify";
  return null;
}
