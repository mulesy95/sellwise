import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import * as cheerio from "cheerio";
import { createClient } from "@/lib/supabase/server";
import { getUsageData, incrementUsage } from "@/lib/usage";
import { detectPlatformFromUrl, type Platform } from "@/lib/platforms";

const client = new Anthropic();

const requestSchema = z.object({
  url: z.string().url(),
});

interface ListingData {
  platform: Platform;
  title: string;
  description: string;
  tags?: string[];
  bullets?: string[];
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function extractEtsy(html: string): Omit<ListingData, "platform"> {
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

function extractAmazon(html: string): Omit<ListingData, "platform"> {
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

function extractEbay(html: string): Omit<ListingData, "platform"> {
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

function extractShopify(html: string): Omit<ListingData, "platform"> {
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

function buildAnalysisPrompt(listing: ListingData): string {
  switch (listing.platform) {
    case "etsy": {
      const tagsText =
        listing.tags && listing.tags.length > 0
          ? `Tags: ${listing.tags.join(", ")}`
          : "Tags: (not available)";
      return `You are an expert Etsy SEO consultant. Analyse this listing and create a significantly better version.

ORIGINAL LISTING:
Title: ${listing.title}
${tagsText}
${listing.description ? `Description: ${listing.description}` : "Description: (not available)"}

Return ONLY valid JSON:
{
  "optimised": {
    "title": "max 140 chars, keyword-front-loaded, reads as a natural phrase",
    "tags": ["exactly 13 tags", "each max 20 chars", "long-tail buyer search phrases"],
    "description": "150–250 words, first sentence contains primary keyword, conversational, no hype words"
  },
  "improvements": ["3 to 5 specific improvements you made"]
}

Writing rules: no em dashes, no ellipses, write like a real shop owner.
Return only the JSON, no markdown.`;
    }

    case "amazon": {
      const bulletsText =
        listing.bullets && listing.bullets.length > 0
          ? listing.bullets.map((b, i) => `Bullet ${i + 1}: ${b}`).join("\n")
          : "Bullets: (not available)";
      return `You are an expert Amazon FBA listing specialist. Analyse this listing and create a significantly better version.

ORIGINAL LISTING:
Title: ${listing.title}
${bulletsText}
${listing.description ? `Description: ${listing.description}` : ""}

Return ONLY valid JSON:
{
  "optimised": {
    "title": "max 200 chars, brand/product type first, keyword-rich",
    "bullets": ["exactly 5 bullets", "each max 255 chars", "benefit-led with CAPS opener"],
    "description": "150–250 words, benefit-led, focus on use cases"
  },
  "improvements": ["3 to 5 specific improvements you made"]
}

Writing rules: no em dashes, no ellipses, write clearly and directly.
Return only the JSON, no markdown.`;
    }

    case "shopify":
      return `You are an expert Shopify SEO and conversion copywriter. Analyse this product listing and create a better version.

ORIGINAL LISTING:
Title: ${listing.title}
${listing.description ? `Description: ${listing.description}` : "Description: (not available)"}

Return ONLY valid JSON:
{
  "optimised": {
    "title": "clean storefront title, 5–10 words, conversion-focused",
    "description": "200–350 words, benefit-led, keyword-rich, includes use cases"
  },
  "improvements": ["3 to 5 specific improvements you made"]
}

Writing rules: no em dashes, no ellipses, write naturally.
Return only the JSON, no markdown.`;

    case "ebay":
      return `You are an expert eBay listing specialist. Analyse this listing and create a significantly better version.

ORIGINAL LISTING:
Title: ${listing.title}
${listing.description ? `Description: ${listing.description}` : "Description: (not available)"}

Return ONLY valid JSON:
{
  "optimised": {
    "title": "max 80 chars, keyword-rich from the start, specific product details",
    "description": "150–300 words, condition stated, key specs in short lines, ends with shipping/returns note"
  },
  "improvements": ["3 to 5 specific improvements you made"]
}

Writing rules: no em dashes, be specific and factual.
Return only the JSON, no markdown.`;
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const usageData = await getUsageData(user.id);
  if (usageData.effectivePlan === "free") {
    return NextResponse.json(
      {
        error: "Competitor analysis is available on paid plans.",
        code: "FEATURE_GATED",
      },
      { status: 402 }
    );
  }
  const used = usageData.competitor;
  const limit = usageData.limit;
  if (limit !== null && used >= limit) {
    return NextResponse.json(
      {
        error: `You've used all ${limit} competitor analyses for this month. Upgrade your plan to continue.`,
        code: "LIMIT_EXCEEDED",
      },
      { status: 402 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { url } = parsed.data;
  const platform = detectPlatformFromUrl(url);

  if (!platform) {
    return NextResponse.json(
      {
        error:
          "URL not recognised. Supported platforms: Etsy (etsy.com/listing/...), Amazon (amazon.com/dp/...), eBay (ebay.com/itm/...), Shopify (/products/...).",
        code: "UNSUPPORTED_URL",
      },
      { status: 422 }
    );
  }

  let html: string;
  try {
    html = await fetchPage(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        error: `Could not fetch this listing. ${msg.startsWith("HTTP") ? `The site returned ${msg}.` : "The site may be blocking automated requests."} Try copying the listing content and using the Listing Audit tool instead.`,
        code: "FETCH_FAILED",
      },
      { status: 422 }
    );
  }

  let extracted: Omit<ListingData, "platform">;
  try {
    switch (platform) {
      case "etsy":
        extracted = extractEtsy(html);
        break;
      case "amazon":
        extracted = extractAmazon(html);
        break;
      case "ebay":
        extracted = extractEbay(html);
        break;
      case "shopify":
        extracted = extractShopify(html);
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Extraction failed";
    return NextResponse.json(
      { error: msg, code: "EXTRACT_FAILED" },
      { status: 422 }
    );
  }

  const original: ListingData = { platform, ...extracted };
  const prompt = buildAnalysisPrompt(original);

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    let result: {
      optimised: Record<string, unknown>;
      improvements: string[];
    };
    try {
      result = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "Failed to parse AI response" },
          { status: 500 }
        );
      }
      result = JSON.parse(match[0]);
    }

    try {
      await incrementUsage(user.id, "competitor");
    } catch (err) {
      console.error("Failed to increment usage:", err);
    }

    return NextResponse.json({
      platform,
      original,
      optimised: { platform, ...result.optimised },
      improvements: result.improvements,
      used: used + 1,
      limit,
    });
  } catch (err) {
    console.error("Competitor API error:", err);
    return NextResponse.json(
      { error: "Failed to analyse listing" },
      { status: 500 }
    );
  }
}
