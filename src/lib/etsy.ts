import crypto from "crypto";

const CLIENT_ID = process.env.ETSY_CLIENT_ID!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sellwise.au";
const REDIRECT_URI = `${APP_URL}/api/etsy/callback`;
const SCOPES = "listings_r listings_w";
const API_BASE = "https://openapi.etsy.com/v3";

export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export function getEtsyAuthUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `https://www.etsy.com/oauth/connect?${params.toString()}`;
}

export async function exchangeEtsyCode(
  code: string,
  codeVerifier: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch("https://api.etsy.com/v3/public/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code,
      code_verifier: codeVerifier,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Etsy token exchange failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function refreshEtsyToken(
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch("https://api.etsy.com/v3/public/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`Etsy token refresh failed: ${res.status}`);
  return res.json();
}

function etsyHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "x-api-key": CLIENT_ID,
  };
}

export async function getEtsyMe(
  accessToken: string
): Promise<{ user_id: number; login_name: string }> {
  const res = await fetch(`${API_BASE}/application/users/me`, {
    headers: etsyHeaders(accessToken),
  });
  if (!res.ok) throw new Error(`Etsy /users/me failed: ${res.status}`);
  return res.json();
}

export async function getEtsyShopForUser(
  userId: number,
  accessToken: string
): Promise<EtsyShop> {
  const res = await fetch(`${API_BASE}/application/users/${userId}/shops`, {
    headers: etsyHeaders(accessToken),
  });
  if (!res.ok) throw new Error(`Etsy shop lookup failed: ${res.status}`);
  return res.json();
}

export async function getEtsyListings(
  shopId: number,
  accessToken: string,
  offset = 0
): Promise<{ results: EtsyListing[]; count: number }> {
  const params = new URLSearchParams({
    limit: "25",
    offset: String(offset),
    includes: "Images",
  });
  const res = await fetch(
    `${API_BASE}/application/shops/${shopId}/listings/active?${params}`,
    { headers: etsyHeaders(accessToken) }
  );
  if (!res.ok) throw new Error(`Etsy listings fetch failed: ${res.status}`);
  return res.json();
}

export async function updateEtsyListing(
  listingId: number,
  accessToken: string,
  updates: { title?: string; description?: string; tags?: string[] }
): Promise<void> {
  const res = await fetch(`${API_BASE}/application/listings/${listingId}`, {
    method: "PATCH",
    headers: {
      ...etsyHeaders(accessToken),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Etsy listing update failed: ${res.status} ${text}`);
  }
}

export interface EtsyShop {
  shop_id: number;
  shop_name: string;
  url: string;
}

export interface EtsyListing {
  listing_id: number;
  title: string;
  description: string;
  price: { amount: number; divisor: number; currency_code: string };
  tags: string[];
  images: Array<{ url_570xN: string }>;
  state: string;
  url: string;
}
