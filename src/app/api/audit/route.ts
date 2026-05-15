import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUsageData, incrementUsage } from "@/lib/usage";
import type { Platform } from "@/lib/platforms";

const client = new Anthropic();

const requestSchema = z.object({
  platform: z.enum(["etsy", "amazon", "shopify", "ebay"]).default("etsy"),
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

function buildPrompt(
  platform: Platform,
  data: z.infer<typeof requestSchema>
): string {
  switch (platform) {
    case "etsy": {
      const listing = [
        data.title ? `Title: ${data.title}` : "Title: (not provided)",
        data.tags ? `Tags: ${data.tags}` : "Tags: (not provided)",
        data.description
          ? `Description: ${data.description}`
          : "Description: (not provided)",
      ].join("\n");

      return `You are an expert Etsy SEO consultant. Audit this Etsy listing.

${listing}

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
    }

    case "amazon": {
      const bulletLines = data.bullets
        ? data.bullets
            .split("\n")
            .filter(Boolean)
            .map((b, i) => `Bullet ${i + 1}: ${b}`)
            .join("\n")
        : "Bullets: (not provided)";

      const listing = [
        data.title ? `Title: ${data.title}` : "Title: (not provided)",
        bulletLines,
        data.backendKeywords
          ? `Backend keywords: ${data.backendKeywords}`
          : "Backend keywords: (not provided)",
        data.description ? `Description: ${data.description}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      return `You are an expert Amazon FBA listing specialist. Audit this Amazon listing.

${listing}

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
    }

    case "shopify": {
      const listing = [
        data.metaTitle
          ? `Meta title: ${data.metaTitle}`
          : "Meta title: (not provided)",
        data.metaDescription
          ? `Meta description: ${data.metaDescription}`
          : "Meta description: (not provided)",
        data.productCopy
          ? `Product copy: ${data.productCopy}`
          : "Product copy: (not provided)",
      ].join("\n");

      return `You are an expert Shopify SEO and conversion specialist. Audit this Shopify product listing.

${listing}

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
    }

    case "ebay": {
      const listing = [
        data.title ? `Title: ${data.title}` : "Title: (not provided)",
        data.description
          ? `Description: ${data.description}`
          : "Description: (not provided)",
      ].join("\n");

      return `You are an expert eBay listing specialist. Audit this eBay listing.

${listing}

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
    }
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

  const { platform, ...fields } = parsed.data;

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

  const prompt = buildPrompt(platform, parsed.data);

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
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
    console.error("Audit API error:", err);
    return NextResponse.json({ error: "Failed to run audit" }, { status: 500 });
  }
}
