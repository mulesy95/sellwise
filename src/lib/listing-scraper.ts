import * as cheerio from "cheerio";
import type { Platform } from "@/lib/platforms";

export interface ExtractedListing {
  platform: Platform;
  title: string;
  description: string;
  tags?: string[];
  bullets?: string[];
}

export async function fetchListingPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

export function extractListing(
  platform: Platform,
  html: string
): Omit<ExtractedListing, "platform"> {
  switch (platform) {
    case "etsy":
      return extractEtsy(html);
    case "amazon":
      return extractAmazon(html);
    case "ebay":
      return extractEbay(html);
    case "shopify":
      return extractShopify(html);
  }
}

function extractEtsy(html: string): Omit<ExtractedListing, "platform"> {
  const $ = cheerio.load(html);

  let title =
    $("h1").first().text().trim() ||
    $("title")
      .text()
      .replace(/\s*[|—–]\s*.*$/, "")
      .trim();

  let tags: string[] = [];
  let description = $('meta[name="description"]').attr("content") ?? "";

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() ?? "");
      if (data["@type"] === "Product" || data.name) {
        if (!title && data.name) title = data.name;
        if (!description && data.description) description = data.description;
        if (data.keywords) {
          tags = String(data.keywords)
            .split(",")
            .map((k: string) => k.trim())
            .filter(Boolean);
        }
      }
    } catch {
      // ignore malformed JSON-LD
    }
  });

  if (!title) throw new Error("Could not extract listing title");
  return { title, description, tags };
}

function extractAmazon(html: string): Omit<ExtractedListing, "platform"> {
  const $ = cheerio.load(html);

  const title =
    $("#productTitle span").first().text().trim() ||
    $("#productTitle").text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text().trim();

  const bullets: string[] = [];
  $("#feature-bullets ul li span.a-list-item").each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 10 && !/make sure this fits/i.test(text)) {
      bullets.push(text);
    }
  });

  const description =
    $('meta[name="description"]').attr("content") ||
    $("#productDescription p").first().text().trim() ||
    $('meta[property="og:description"]').attr("content") ||
    "";

  if (!title) throw new Error("Could not extract product title");
  return { title, description, bullets };
}

function extractEbay(html: string): Omit<ExtractedListing, "platform"> {
  const $ = cheerio.load(html);

  const title =
    $(".x-item-title__mainTitle span.ux-textspans--BOLD").text().trim() ||
    $("h1.x-item-title__mainTitle").text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text().trim();

  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";

  if (!title) throw new Error("Could not extract listing title");
  return { title, description };
}

function extractShopify(html: string): Omit<ExtractedListing, "platform"> {
  const $ = cheerio.load(html);

  const title =
    $("h1.product-title").text().trim() ||
    $("h1.product__title").text().trim() ||
    $("h1.productView-title").text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text().trim();

  const description =
    $(".product-description").text().trim() ||
    $(".product__description").text().trim() ||
    $(".productView-description").text().trim() ||
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    "";

  if (!title) throw new Error("Could not extract product title");
  return { title, description };
}
