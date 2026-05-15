const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!;
const SCOPES = "read_products,write_products,read_inventory,read_orders";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sellwise.au";
const REDIRECT_URI = `${APP_URL}/api/shopify/callback`;

export function getShopifyAuthUrl(shop: string, state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: REDIRECT_URI,
    state,
    "grant_options[]": "per-user",
  });
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

export async function exchangeShopifyCode(
  shop: string,
  code: string
): Promise<{ access_token: string; scope: string }> {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code }),
  });
  if (!res.ok) throw new Error(`Shopify token exchange failed: ${res.status}`);
  return res.json();
}

export async function getShopInfo(shop: string, accessToken: string) {
  const res = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
    headers: { "X-Shopify-Access-Token": accessToken },
  });
  if (!res.ok) throw new Error(`Failed to fetch shop info: ${res.status}`);
  const data = await res.json();
  return data.shop as { id: number; name: string; myshopify_domain: string };
}

export async function getShopifyProducts(
  shop: string,
  accessToken: string,
  limit = 50,
  pageInfo?: string
): Promise<{ products: ShopifyProduct[]; nextPageInfo?: string }> {
  const params = new URLSearchParams({ limit: String(limit), fields: "id,title,body_html,status,variants,images" });
  if (pageInfo) params.set("page_info", pageInfo);

  const res = await fetch(`https://${shop}/admin/api/2024-01/products.json?${params}`, {
    headers: { "X-Shopify-Access-Token": accessToken },
  });
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);

  const linkHeader = res.headers.get("link");
  const nextMatch = linkHeader?.match(/<[^>]*page_info=([^&>]+)[^>]*>;\s*rel="next"/);
  const nextPageInfo = nextMatch?.[1];

  const data = await res.json();
  return { products: data.products, nextPageInfo };
}

export async function pushShopifyProduct(
  shop: string,
  accessToken: string,
  productId: number,
  updates: { title?: string; body_html?: string; metafields?: ShopifyMetafield[] }
): Promise<void> {
  const res = await fetch(`https://${shop}/admin/api/2024-01/products/${productId}.json`, {
    method: "PUT",
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ product: { id: productId, ...updates } }),
  });
  if (!res.ok) throw new Error(`Failed to update product: ${res.status}`);
}

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  status: string;
  variants: { price: string }[];
  images: { src: string }[];
}

export interface ShopifyMetafield {
  namespace: string;
  key: string;
  value: string;
  type: string;
}

export function normaliseShopDomain(input: string): string {
  return input
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .trim();
}
