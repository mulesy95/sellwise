const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!;
const SCOPES = "read_products,write_products,read_inventory,read_orders";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sellwise.au";
const REDIRECT_URI = `${APP_URL}/api/shopify/callback`;
const API_VERSION = "2026-01";

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

// ─── GraphQL helper ───────────────────────────────────────────────────────────

async function shopifyGraphQL<T>(
  shop: string,
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`https://${shop}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify GraphQL request failed: ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

// ─── Shop info ────────────────────────────────────────────────────────────────

export async function getShopInfo(shop: string, accessToken: string) {
  const data = await shopifyGraphQL<{
    shop: { id: string; name: string; myshopifyDomain: string };
  }>(
    shop,
    accessToken,
    `{ shop { id name myshopifyDomain } }`
  );
  return {
    id: data.shop.id,
    name: data.shop.name,
    myshopify_domain: data.shop.myshopifyDomain,
  };
}

// ─── Products ─────────────────────────────────────────────────────────────────

const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        node {
          id
          title
          descriptionHtml
          status
          variants(first: 1) {
            edges { node { price } }
          }
          images(first: 1) {
            edges { node { url } }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export async function getShopifyProducts(
  shop: string,
  accessToken: string,
  limit = 50,
  cursor?: string
): Promise<{ products: ShopifyProduct[]; nextCursor?: string }> {
  const data = await shopifyGraphQL<{
    products: {
      edges: {
        node: {
          id: string;
          title: string;
          descriptionHtml: string;
          status: string;
          variants: { edges: { node: { price: string } }[] };
          images: { edges: { node: { url: string } }[] };
        };
      }[];
      pageInfo: { hasNextPage: boolean; endCursor: string };
    };
  }>(shop, accessToken, PRODUCTS_QUERY, { first: limit, after: cursor ?? null });

  const products: ShopifyProduct[] = data.products.edges.map(({ node }) => ({
    id: node.id,
    title: node.title,
    body_html: node.descriptionHtml,
    status: node.status.toLowerCase(),
    variants: node.variants.edges.map((e) => ({ price: e.node.price })),
    images: node.images.edges.map((e) => ({ src: e.node.url })),
  }));

  const nextCursor = data.products.pageInfo.hasNextPage
    ? data.products.pageInfo.endCursor
    : undefined;

  return { products, nextCursor };
}

// ─── Push product update ──────────────────────────────────────────────────────

const PRODUCT_UPDATE_MUTATION = `
  mutation productUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product { id }
      userErrors { field message }
    }
  }
`;

export async function pushShopifyProduct(
  shop: string,
  accessToken: string,
  productId: string,
  updates: { title?: string; body_html?: string }
): Promise<void> {
  const input: Record<string, unknown> = { id: productId };
  if (updates.title) input.title = updates.title;
  if (updates.body_html) input.descriptionHtml = updates.body_html;

  const data = await shopifyGraphQL<{
    productUpdate: {
      product: { id: string } | null;
      userErrors: { field: string[]; message: string }[];
    };
  }>(shop, accessToken, PRODUCT_UPDATE_MUTATION, { input });

  const errors = data.productUpdate.userErrors;
  if (errors.length) throw new Error(errors[0].message);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShopifyProduct {
  id: string;
  title: string;
  body_html: string;
  status: string;
  variants: { price: string }[];
  images: { src: string }[];
}

export function normaliseShopDomain(input: string): string {
  return input
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .trim();
}
