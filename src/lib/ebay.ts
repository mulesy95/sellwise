const CLIENT_ID = process.env.EBAY_CLIENT_ID!;
const CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET!;
const APP_ID = process.env.EBAY_APP_ID!;
const RU_NAME = process.env.EBAY_RU_NAME!;
const SITE_ID = process.env.EBAY_SITE_ID ?? "0"; // 0=US, 15=AU
const API_COMPAT = "967";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sellwise.au";
export const EBAY_CALLBACK_URI = `${APP_URL}/api/ebay/callback`;

const SCOPES = [
  "https://api.ebay.com/oauth/api_scope",
  "https://api.ebay.com/oauth/api_scope/sell.inventory",
  "https://api.ebay.com/oauth/api_scope/sell.account",
].join(" ");

// ─── OAuth ────────────────────────────────────────────────────────────────────

export function getEbayAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: RU_NAME,
    response_type: "code",
    scope: SCOPES,
    state,
  });
  return `https://auth.ebay.com/oauth2/authorize?${params}`;
}

export async function exchangeEbayCode(
  code: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: RU_NAME,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay token exchange failed: ${res.status} — ${text}`);
  }
  return res.json();
}

export async function refreshEbayToken(
  refreshToken: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: SCOPES,
    }),
  });
  if (!res.ok) throw new Error(`eBay token refresh failed: ${res.status}`);
  return res.json();
}

// ─── App token (for Browse API — no user auth needed) ─────────────────────────

let cachedAppToken: { token: string; expiresAt: number } | null = null;

async function getAppToken(): Promise<string> {
  if (cachedAppToken && Date.now() < cachedAppToken.expiresAt - 60_000) {
    return cachedAppToken.token;
  }
  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "https://api.ebay.com/oauth/api_scope",
    }),
  });
  if (!res.ok) throw new Error(`eBay app token error: ${res.status}`);
  const data = await res.json();
  cachedAppToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

// ─── Shopping API — competitor research (no user auth) ────────────────────────

export function extractEbayItemId(url: string): string | null {
  // Handles /itm/123456789012 and /itm/title/123456789012
  const match = url.match(/\/itm\/(?:[^/?#]+\/)?(\d{8,13})/);
  return match ? match[1] : null;
}

export interface EbayShoppingItem {
  title: string;
  description: string;
  price?: string;
  imageUrl?: string;
  itemSpecifics: Record<string, string>;
  condition?: string;
}

export async function getEbayItem(itemId: string): Promise<EbayShoppingItem> {
  const params = new URLSearchParams({
    callname: "GetSingleItem",
    ItemID: itemId,
    appid: APP_ID,
    version: API_COMPAT,
    IncludeSelector: "Description,Details,ItemSpecifics",
    responseencoding: "JSON",
  });

  const res = await fetch(`https://open.api.ebay.com/shopping?${params}`);
  if (!res.ok) throw new Error(`eBay Shopping API error: ${res.status}`);

  const data = await res.json();
  if (data.Ack === "Failure") throw new Error(data.Errors?.[0]?.LongMessage ?? "eBay item not found");

  const item = data.Item;
  if (!item) throw new Error("Item not found");

  const specifics: Record<string, string> = {};
  const nameValues = item.ItemSpecifics?.NameValueList;
  if (Array.isArray(nameValues)) {
    for (const nv of nameValues) {
      if (nv.Name && nv.Value?.[0]) specifics[nv.Name] = nv.Value[0];
    }
  } else if (nameValues?.Name) {
    specifics[nameValues.Name] = nameValues.Value?.[0] ?? "";
  }

  const rawDesc: string = item.Description ?? "";
  const description = rawDesc.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1500);

  return {
    title: item.Title ?? "",
    description,
    price: item.ConvertedCurrentPrice?.Value
      ? `${item.ConvertedCurrentPrice.Value} ${item.ConvertedCurrentPrice["@currencyID"] ?? ""}`.trim()
      : undefined,
    imageUrl: item.GalleryURL ?? item.PictureURL?.[0] ?? undefined,
    itemSpecifics: specifics,
    condition: item.ConditionDisplayName ?? undefined,
  };
}

// ─── Browse API — keyword search ──────────────────────────────────────────────

export interface EbaySearchResult {
  itemId: string;
  title: string;
  price: string;
  imageUrl?: string;
  condition?: string;
  itemWebUrl: string;
}

export async function searchEbayItems(
  keyword: string,
  limit = 10
): Promise<EbaySearchResult[]> {
  const token = await getAppToken();
  const params = new URLSearchParams({ q: keyword, limit: String(limit) });
  const res = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`, {
    headers: { Authorization: `Bearer ${token}`, "X-EBAY-C-MARKETPLACE-ID": "EBAY_US" },
  });
  if (!res.ok) throw new Error(`eBay Browse API error: ${res.status}`);
  const data = await res.json();

  return (data.itemSummaries ?? []).map((item: Record<string, unknown>) => ({
    itemId: String(item.itemId ?? ""),
    title: String(item.title ?? ""),
    price: (() => {
      const p = item.price as Record<string, string> | undefined;
      return p ? `${p.value} ${p.currency}` : "N/A";
    })(),
    imageUrl: (item.image as Record<string, string> | undefined)?.imageUrl,
    condition: item.condition ? String(item.condition) : undefined,
    itemWebUrl: String(item.itemWebUrl ?? ""),
  }));
}

// ─── XML helpers for Trading API ─────────────────────────────────────────────

function xmlValue(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}(?:[^>]*)>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!m) return "";
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)]]>/g, "$1").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function xmlBlocks(xml: string, tag: string): string[] {
  const blocks: string[] = [];
  const open = `<${tag}`;
  const close = `</${tag}>`;
  let pos = 0;
  while (true) {
    const start = xml.indexOf(open, pos);
    if (start === -1) break;
    const end = xml.indexOf(close, start);
    if (end === -1) break;
    blocks.push(xml.slice(start, end + close.length));
    pos = end + close.length;
  }
  return blocks;
}

// ─── Trading API — seller listings + revise ───────────────────────────────────

export interface EbayListing {
  id: string;
  title: string;
  body_html: string;
  status: string;
  variants: { price: string }[];
  images: { src: string }[];
}

async function tradingCall(callName: string, body: string, userToken: string): Promise<string> {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<${callName}Request xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials><eBayAuthToken>${userToken}</eBayAuthToken></RequesterCredentials>
  ${body}
</${callName}Request>`;

  const res = await fetch("https://api.ebay.com/ws/api.dll", {
    method: "POST",
    headers: {
      "X-EBAY-API-SITEID": SITE_ID,
      "X-EBAY-API-COMPATIBILITY-LEVEL": API_COMPAT,
      "X-EBAY-API-CALL-NAME": callName,
      "X-EBAY-API-IAF-TOKEN": userToken,
      "Content-Type": "text/xml",
    },
    body: xml,
  });
  if (!res.ok) throw new Error(`eBay Trading API error: ${res.status}`);
  return res.text();
}

export async function getEbayListings(
  userToken: string,
  limit = 50
): Promise<EbayListing[]> {
  const today = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const xml = await tradingCall(
    "GetSellerList",
    `<StartTimeFrom>${startDate}T00:00:00.000Z</StartTimeFrom>
     <StartTimeTo>${today}T23:59:59.000Z</StartTimeTo>
     <Pagination><EntriesPerPage>${limit}</EntriesPerPage><PageNumber>1</PageNumber></Pagination>
     <DetailLevel>ReturnAll</DetailLevel>
     <GranularityLevel>Fine</GranularityLevel>`,
    userToken
  );

  const ack = xmlValue(xml, "Ack");
  if (ack === "Failure") throw new Error(xmlValue(xml, "LongMessage") || "GetSellerList failed");

  return xmlBlocks(xml, "Item").map((item) => {
    const rawDesc = xmlValue(item, "Description");
    const price = xmlValue(item, "CurrentPrice") || xmlValue(item, "StartPrice") || "0";
    const images = xmlBlocks(item, "PictureURL").map((block) => ({
      src: block.replace(/<[^>]+>/g, "").trim(),
    }));

    return {
      id: xmlValue(item, "ItemID"),
      title: xmlValue(item, "Title"),
      body_html: rawDesc,
      status: xmlValue(item, "ListingStatus").toLowerCase() || "active",
      variants: [{ price }],
      images,
    };
  }).filter((l) => l.id && l.title);
}

export async function getEbayCurrentItem(
  userToken: string,
  itemId: string
): Promise<{ title: string; description: string } | null> {
  try {
    const xml = await tradingCall(
      "GetItem",
      `<ItemID>${itemId}</ItemID><DetailLevel>ReturnAll</DetailLevel>`,
      userToken
    );
    const ack = xmlValue(xml, "Ack");
    if (ack === "Failure") return null;
    return {
      title: xmlValue(xml, "Title"),
      description: xmlValue(xml, "Description"),
    };
  } catch {
    return null;
  }
}

export async function reviseEbayItem(
  userToken: string,
  itemId: string,
  updates: { title?: string; description?: string }
): Promise<void> {
  const titleXml = updates.title ? `<Title>${updates.title.slice(0, 80)}</Title>` : "";
  const descXml = updates.description ? `<Description><![CDATA[${updates.description}]]></Description>` : "";

  const xml = await tradingCall(
    "ReviseFixedPriceItem",
    `<Item><ItemID>${itemId}</ItemID>${titleXml}${descXml}</Item>`,
    userToken
  );

  const ack = xmlValue(xml, "Ack");
  if (ack === "Failure") throw new Error(xmlValue(xml, "LongMessage") || "ReviseFixedPriceItem failed");
}

export function normaliseEbayDomain(_input: string): string {
  return "ebay";
}
