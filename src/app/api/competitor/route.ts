import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import Anthropic, { APIConnectionError, APIError } from "@anthropic-ai/sdk";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUsageData, incrementUsage } from "@/lib/usage";
import { detectPlatformFromUrl, type Platform } from "@/lib/platforms";
import { fetchShopifyProduct } from "@/lib/listing-scraper";

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

  const { allowed: rl, retryAfterMs } = checkRateLimit(`ai:${user.id}`, 20, 60_000);
  if (!rl) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
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
          "URL not recognised. Supported platforms: Amazon (amazon.com/dp/...), eBay (ebay.com/itm/...), Shopify (/products/...).",
        code: "UNSUPPORTED_URL",
      },
      { status: 422 }
    );
  }

  if (platform === "etsy" || platform === "amazon" || platform === "ebay") {
    const messages: Record<string, string> = {
      etsy: "Etsy URLs are not supported. Copy the listing content and use the Listing Audit tool with manual entry instead.",
      amazon: "Amazon URL analysis is coming soon via the official SP-API. For now, copy the listing content and paste it into the Listing Audit tool.",
      ebay: "eBay URL analysis is coming soon via the official eBay API. For now, copy the listing content and paste it into the Listing Audit tool.",
    };
    return NextResponse.json(
      { error: messages[platform], code: "UNSUPPORTED_PLATFORM" },
      { status: 422 }
    );
  }

  let extracted: Omit<ListingData, "platform">;
  try {
    extracted = await fetchShopifyProduct(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        error: `Could not fetch this listing. ${msg.startsWith("HTTP") ? `The site returned ${msg}.` : "The store may not have a public products API or the URL is incorrect."} Try copying the listing content and using the Listing Audit tool instead.`,
        code: "FETCH_FAILED",
      },
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
    if (
      err instanceof APIConnectionError ||

      (err instanceof APIError && err.status >= 500)
    ) {
      return NextResponse.json(
        { error: "AI is temporarily unavailable. Please try again in a moment.", code: "AI_UNAVAILABLE" },
        { status: 503 }
      );
    }
    console.error("Competitor API error:", err);
    return NextResponse.json(
      { error: "Failed to analyse listing" },
      { status: 500 }
    );
  }
}
