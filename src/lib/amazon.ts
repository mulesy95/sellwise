import crypto from "crypto";

const CLIENT_ID = process.env.AMAZON_CLIENT_ID!;
const CLIENT_SECRET = process.env.AMAZON_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sellwise.au";
const REDIRECT_URI = `${APP_URL}/api/amazon/callback`;
const MARKETPLACE_ID = process.env.AMAZON_MARKETPLACE_ID ?? "ATVPDKIKX0DER"; // US default
const SP_API_HOST = "sellingpartnerapi-na.amazon.com";
const SP_API_REGION = "us-east-1";

// ─── OAuth ────────────────────────────────────────────────────────────────────

export function getAmazonAuthUrl(state: string): string {
  const params = new URLSearchParams({
    application_id: CLIENT_ID,
    state,
    redirect_uri: REDIRECT_URI,
    version: "beta", // allows testing while app is pending approval
  });
  return `https://sellercentral.amazon.com/apps/authorize/consent?${params.toString()}`;
}

export async function exchangeAmazonCode(
  code: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amazon token exchange failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function refreshAmazonToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`Amazon token refresh failed: ${res.status}`);
  return res.json();
}

// ─── AWS SigV4 signing ────────────────────────────────────────────────────────

function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data).digest();
}

function signedFetch(
  method: string,
  url: string,
  accessToken: string,
  body = ""
): Record<string, string> {
  const awsKey = process.env.AMAZON_AWS_ACCESS_KEY;
  const awsSecret = process.env.AMAZON_AWS_SECRET_KEY;
  if (!awsKey || !awsSecret) {
    throw new Error("AWS credentials not configured (AMAZON_AWS_ACCESS_KEY / AMAZON_AWS_SECRET_KEY)");
  }

  const parsed = new URL(url);
  const now = new Date();
  const dateTime =
    now.toISOString().replace(/[:\-]/g, "").replace(/\.\d{3}/, "").slice(0, 15) + "Z";
  const date = dateTime.slice(0, 8);

  const baseHeaders: Record<string, string> = {
    host: parsed.host,
    "x-amz-access-token": accessToken,
    "x-amz-date": dateTime,
  };
  if (body) baseHeaders["content-type"] = "application/json";

  const sortedHeaderKeys = Object.keys(baseHeaders).sort();
  const canonicalHeaders =
    sortedHeaderKeys.map((k) => `${k}:${baseHeaders[k]}`).join("\n") + "\n";
  const signedHeaders = sortedHeaderKeys.join(";");

  const queryString = Array.from(parsed.searchParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  const payloadHash = crypto.createHash("sha256").update(body).digest("hex");

  const canonicalRequest = [
    method,
    parsed.pathname,
    queryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const service = "execute-api";
  const credentialScope = `${date}/${SP_API_REGION}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    dateTime,
    credentialScope,
    crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${awsSecret}`, date), SP_API_REGION), service),
    "aws4_request"
  );
  const signature = crypto
    .createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");

  return {
    ...baseHeaders,
    Authorization: `AWS4-HMAC-SHA256 Credential=${awsKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

// ─── SP-API calls ─────────────────────────────────────────────────────────────

export async function getAmazonCatalogItem(
  asin: string,
  accessToken: string
): Promise<AmazonProduct | null> {
  const url = new URL(
    `https://${SP_API_HOST}/catalog/2022-04-01/items/${asin}`
  );
  url.searchParams.set("marketplaceIds", MARKETPLACE_ID);
  url.searchParams.set("includedData", "summaries,images,attributes");

  const headers = signedFetch("GET", url.toString(), accessToken);

  const res = await fetch(url.toString(), { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Catalog item fetch failed: ${res.status}`);

  const data = await res.json();
  const summary = data.summaries?.[0];
  const image = data.images?.[0]?.images?.find((i: { variant: string }) => i.variant === "MAIN");
  const descAttr = data.attributes?.product_description?.[0]?.value;

  return {
    asin,
    title: summary?.itemName ?? asin,
    description: descAttr ?? "",
    imageUrl: image?.link ?? null,
    brand: summary?.brand ?? null,
  };
}

export async function updateAmazonListing(
  sellerId: string,
  sku: string,
  accessToken: string,
  updates: { title?: string; bullets?: string[]; description?: string }
): Promise<void> {
  const url = `https://${SP_API_HOST}/listings/2021-08-01/items/${sellerId}/${encodeURIComponent(sku)}?marketplaceIds=${MARKETPLACE_ID}`;

  const patches = [];
  if (updates.title)
    patches.push({ op: "replace", path: "/attributes/item_name", value: [{ value: updates.title, marketplace_id: MARKETPLACE_ID }] });
  if (updates.bullets)
    patches.push({ op: "replace", path: "/attributes/bullet_point", value: updates.bullets.map((v) => ({ value: v, marketplace_id: MARKETPLACE_ID })) });
  if (updates.description)
    patches.push({ op: "replace", path: "/attributes/product_description", value: [{ value: updates.description, marketplace_id: MARKETPLACE_ID }] });

  const body = JSON.stringify({ productType: "PRODUCT", patches });
  const headers = signedFetch("PATCH", url, accessToken, body);

  const res = await fetch(url, { method: "PATCH", headers, body });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Amazon listing update failed: ${res.status} ${text}`);
  }
}

export interface AmazonProduct {
  asin: string;
  title: string;
  description: string;
  imageUrl: string | null;
  brand: string | null;
}
