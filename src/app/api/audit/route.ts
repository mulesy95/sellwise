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
  platform: z.enum(["etsy", "amazon", "shopify", "ebay", "woocommerce", "wix", "squarespace", "tiktok", "social"]).default("etsy"),
  url: z.string().url().optional(),
  // Etsy / eBay
  title: z.string().max(200).optional().default(""),
  tags: z.string().max(500).optional().default(""),
  description: z.string().max(5000).optional().default(""),
  // Amazon-specific
  bullets: z.string().max(2000).optional().default(""),
  backendKeywords: z.string().max(500).optional().default(""),
  // Shopify-specific
  metaTitle: z.string().max(200).optional().default(""),
  metaDescription: z.string().max(500).optional().default(""),
  productCopy: z.string().max(5000).optional().default(""),
});

function buildSystemPrompt(platform: Platform): string {
  switch (platform) {
    case "etsy":
      return `You are an expert Etsy SEO consultant. Audit the listing provided.

Score out of 100:
- titleScore (0–40): keyword placement, starts with primary keyword, 100–140 chars, reads naturally, no ALL CAPS
- tagsScore (0–35): count (ideally 13), each max 20 chars, mix of short and long-tail, no repeated words across tags
- descriptionScore (0–25): first 160 chars contain primary keyword, 150–250 words, conversational tone

Return ONLY valid JSON:
{
  "score": number,
  "titleScore": number,
  "tagsScore": number,
  "descriptionScore": number,
  "improvements": ["3 to 5 specific, actionable fixes"]
}
Return only the JSON, no markdown.`;

    case "amazon":
      return `You are an expert Amazon FBA listing specialist. Audit the listing provided.

Score out of 100:
- titleScore (0–30): brand/product type first, keyword-rich, max 200 chars, readable
- bulletsScore (0–40): ideally 5 bullets, each max 255 chars, benefit-led with CAPS opener, keyword present in first bullet
- backendScore (0–30): no repeats from title/bullets, max 250 bytes, purchase-intent terms

Return ONLY valid JSON:
{
  "score": number,
  "titleScore": number,
  "bulletsScore": number,
  "backendScore": number,
  "improvements": ["3 to 5 specific, actionable fixes"]
}
Return only the JSON, no markdown.`;

    case "shopify":
      return `You are an expert Shopify SEO and conversion specialist. Audit the product listing provided.

Score out of 100:
- metaTitleScore (0–30): max 60 chars, primary keyword present, includes brand if space allows
- metaDescScore (0–40): max 160 chars, keyword present, clear value proposition, includes a soft CTA
- copyScore (0–30): keyword density appropriate, benefit-led paragraphs, conversion-focused language

Return ONLY valid JSON:
{
  "score": number,
  "metaTitleScore": number,
  "metaDescScore": number,
  "copyScore": number,
  "improvements": ["3 to 5 specific, actionable fixes"]
}
Return only the JSON, no markdown.`;

    case "ebay":
      return `You are an expert eBay listing specialist. Audit the listing provided.

Score out of 100:
- titleScore (0–50): keyword-front-loaded, max 80 chars, specific product details (brand/model/size/condition), no ALL CAPS
- descriptionScore (0–50): condition clearly stated, key specs listed, features structured in short lines, shipping/returns mentioned

Return ONLY valid JSON:
{
  "score": number,
  "titleScore": number,
  "descriptionScore": number,
  "improvements": ["3 to 5 specific, actionable fixes"]
}
Return only the JSON, no markdown.`;

    case "woocommerce":
      return `You are an expert WooCommerce and Google SEO specialist. Audit the product listing provided.

Score out of 100:
- metaTitleScore (0–30): max 60 chars, primary keyword present, reads naturally, brand or product name included
- metaDescScore (0–40): max 160 chars, keyword present, clear value proposition, includes a soft call to action
- copyScore (0–30): keyword density appropriate, desire-first opening, short mobile-friendly paragraphs

Return ONLY valid JSON:
{
  "score": number,
  "metaTitleScore": number,
  "metaDescScore": number,
  "copyScore": number,
  "improvements": ["3 to 5 specific, actionable fixes"]
}
Return only the JSON, no markdown.`;

    case "wix":
      return `You are an expert Wix eCommerce and Google SEO specialist. Audit the product listing provided.

Score out of 100:
- metaTitleScore (0–30): max 60 chars, primary keyword present, reads naturally
- metaDescScore (0–40): max 160 chars, keyword present, clear value proposition, soft call to action
- copyScore (0–30): engaging opening, mobile-readable paragraphs, keyword present, benefit-led

Return ONLY valid JSON:
{
  "score": number,
  "metaTitleScore": number,
  "metaDescScore": number,
  "copyScore": number,
  "improvements": ["3 to 5 specific, actionable fixes"]
}
Return only the JSON, no markdown.`;

    case "squarespace":
      return `You are an expert Squarespace eCommerce and Google SEO specialist. Audit the product listing provided.

Score out of 100:
- metaTitleScore (0–30): max 60 chars, primary keyword present, brand-appropriate tone
- metaDescScore (0–40): max 160 chars, keyword present, elevated but accessible, soft call to action
- copyScore (0–30): distinctive opening, specific product details, confident prose, no generic marketing language

Return ONLY valid JSON:
{
  "score": number,
  "metaTitleScore": number,
  "metaDescScore": number,
  "copyScore": number,
  "improvements": ["3 to 5 specific, actionable fixes"]
}
Return only the JSON, no markdown.`;

    case "tiktok":
      return `You are an expert TikTok Shop listing specialist. Audit the listing provided.

Score out of 100:
- titleScore (0–50): max 100 chars, leading with searchable product term, key attributes included, no ALL CAPS or excessive punctuation
- descriptionScore (0–50): scroll-stopping opening, punchy short lines, top features highlighted, specific closing detail

Return ONLY valid JSON:
{
  "score": number,
  "titleScore": number,
  "descriptionScore": number,
  "improvements": ["3 to 5 specific, actionable fixes"]
}
Return only the JSON, no markdown.`;

    case "social":
      return `You are an expert social media product copywriter. Audit the social post provided.

Score out of 100:
- captionScore (0–40): hook visible before "more" cutoff (under 125 chars), specific and scroll-stopping, not generic
- hashtagScore (0–30): mix of broad reach and niche discovery tags, 15–25 total, relevant to product and audience
- copyScore (0–30): post copy expands on caption with product detail, ends with a clear call to action

Return ONLY valid JSON:
{
  "score": number,
  "captionScore": number,
  "hashtagScore": number,
  "copyScore": number,
  "improvements": ["3 to 5 specific, actionable fixes"]
}
Return only the JSON, no markdown.`;
  }
}

function buildUserMessage(
  platform: Platform,
  data: z.infer<typeof requestSchema>
): string {
  switch (platform) {
    case "etsy":
      return [
        data.title ? `Title: ${data.title}` : "Title: (not provided)",
        data.tags ? `Tags: ${data.tags}` : "Tags: (not provided)",
        data.description ? `Description: ${data.description}` : "Description: (not provided)",
      ].join("\n");

    case "amazon": {
      const bulletLines = data.bullets
        ? data.bullets.split("\n").filter(Boolean).map((b, i) => `Bullet ${i + 1}: ${b}`).join("\n")
        : "Bullets: (not provided)";
      return [
        data.title ? `Title: ${data.title}` : "Title: (not provided)",
        bulletLines,
        data.backendKeywords ? `Backend keywords: ${data.backendKeywords}` : "Backend keywords: (not provided)",
        data.description ? `Description: ${data.description}` : "",
      ].filter(Boolean).join("\n");
    }

    case "shopify":
      return [
        data.metaTitle ? `Meta title: ${data.metaTitle}` : "Meta title: (not provided)",
        data.metaDescription ? `Meta description: ${data.metaDescription}` : "Meta description: (not provided)",
        data.productCopy ? `Product copy: ${data.productCopy}` : "Product copy: (not provided)",
      ].join("\n");

    case "ebay":
      return [
        data.title ? `Title: ${data.title}` : "Title: (not provided)",
        data.description ? `Description: ${data.description}` : "Description: (not provided)",
      ].join("\n");

    case "woocommerce":
    case "wix":
    case "squarespace":
      return [
        data.metaTitle ? `SEO Title: ${data.metaTitle}` : "SEO Title: (not provided)",
        data.metaDescription ? `SEO Description: ${data.metaDescription}` : "SEO Description: (not provided)",
        data.productCopy ? `Product copy: ${data.productCopy}` : "Product copy: (not provided)",
      ].join("\n");

    case "tiktok":
      return [
        data.title ? `Title: ${data.title}` : "Title: (not provided)",
        data.description ? `Description: ${data.description}` : "Description: (not provided)",
      ].join("\n");

    case "social":
      return [
        data.title ? `Caption: ${data.title}` : "Caption: (not provided)",
        data.tags ? `Hashtags: ${data.tags}` : "Hashtags: (not provided)",
        data.description ? `Post copy: ${data.description}` : "Post copy: (not provided)",
      ].join("\n");
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
        error: "Listing audits are available on paid plans.",
        code: "FEATURE_GATED",
      },
      { status: 402 }
    );
  }
  const used = usageData.audits;
  const limit = usageData.limit;
  if (limit !== null && used >= limit) {
    return NextResponse.json(
      {
        error: `You've used all ${limit} audits for this month. Upgrade your plan to continue.`,
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

  let { platform, ...fields } = parsed.data;

  // If a URL was supplied, scrape and populate fields automatically
  if (fields.url) {
    const detectedPlatform = detectPlatformFromUrl(fields.url);
    if (!detectedPlatform) {
      return NextResponse.json(
        {
          error:
            "URL not recognised. Supported: Amazon (amazon.com/dp/...), eBay (ebay.com/itm/...), Shopify (/products/...).",
          code: "UNSUPPORTED_URL",
        },
        { status: 422 }
      );
    }

    if (detectedPlatform === "etsy" || detectedPlatform === "amazon" || detectedPlatform === "ebay") {
      const messages: Record<string, string> = {
        etsy: "Etsy URLs are not supported. Switch to manual entry and paste your title, tags, and description.",
        amazon: "Amazon URL auditing is coming soon via the official SP-API. Switch to manual entry and paste your listing content.",
        ebay: "eBay URL auditing is coming soon via the official eBay API. Switch to manual entry and paste your listing content.",
      };
      return NextResponse.json(
        { error: messages[detectedPlatform], code: "UNSUPPORTED_PLATFORM" },
        { status: 422 }
      );
    }

    let extracted: { title: string; description: string };
    try {
      extracted = await fetchShopifyProduct(fields.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json(
        {
          error: `Could not fetch this listing. ${msg.startsWith("HTTP") ? `The site returned ${msg}.` : "The store may not have a public products API or the URL is incorrect."} Try entering the content manually instead.`,
          code: "FETCH_FAILED",
        },
        { status: 422 }
      );
    }

    // Map extracted content to audit fields
    platform = detectedPlatform;
    fields.metaTitle = extracted.title;
    fields.productCopy = extracted.description ?? "";
  }

  // Require at least one meaningful field per platform
  const hasContent =
    fields.title ||
    fields.tags ||
    fields.description ||
    fields.bullets ||
    fields.backendKeywords ||
    fields.metaTitle ||
    fields.metaDescription ||
    fields.productCopy;

  if (!hasContent) {
    return NextResponse.json(
      { error: "Provide at least one field to audit" },
      { status: 400 }
    );
  }

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: [{ type: "text" as const, text: buildSystemPrompt(platform), cache_control: { type: "ephemeral" as const } }],
      messages: [{ role: "user", content: buildUserMessage(platform, { platform, ...fields }) }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    let result: Record<string, unknown>;
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
      await incrementUsage(user.id, "audits");
    } catch (err) {
      console.error("Failed to increment usage:", err);
    }

    return NextResponse.json({ ...result, platform, used: used + 1, limit });
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
    console.error("Audit API error:", err);
    return NextResponse.json({ error: "Failed to run audit" }, { status: 500 });
  }
}
