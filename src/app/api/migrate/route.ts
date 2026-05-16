import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import Anthropic, { APIConnectionError, APIError } from "@anthropic-ai/sdk";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUsageData, incrementUsage } from "@/lib/usage";

const client = new Anthropic();

const requestSchema = z.object({
  sourcePlatform: z.enum(["etsy", "amazon", "shopify", "ebay"]),
  targetPlatform: z.enum(["etsy", "amazon", "shopify", "ebay"]),
  title: z.string().max(300).optional().default(""),
  tags: z.string().max(500).optional().default(""),
  description: z.string().max(5000).optional().default(""),
  bullets: z.string().max(2000).optional().default(""),
  backendKeywords: z.string().max(500).optional().default(""),
  metaTitle: z.string().max(200).optional().default(""),
  metaDescription: z.string().max(500).optional().default(""),
  productCopy: z.string().max(5000).optional().default(""),
});

type ValidatedInput = z.infer<typeof requestSchema>;

const SOURCE_LABELS: Record<string, string> = {
  etsy: "Etsy",
  amazon: "Amazon",
  shopify: "Shopify",
  ebay: "eBay",
};

function buildSourceBlock(data: ValidatedInput): string {
  switch (data.sourcePlatform) {
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
        data.backendKeywords ? `Backend keywords: ${data.backendKeywords}` : "",
        data.description ? `Description: ${data.description}` : "",
      ].filter(Boolean).join("\n");
    }
    case "shopify":
      return [
        data.title ? `Title: ${data.title}` : "Title: (not provided)",
        data.productCopy ? `Product copy: ${data.productCopy}` : "Product copy: (not provided)",
      ].join("\n");
    case "ebay":
      return [
        data.title ? `Title: ${data.title}` : "Title: (not provided)",
        data.description ? `Description: ${data.description}` : "Description: (not provided)",
      ].join("\n");
  }
}

function buildTargetSpec(targetPlatform: string): { spec: string; schema: string } {
  switch (targetPlatform) {
    case "etsy":
      return {
        spec: `Etsy listing requirements:
- title: max 140 chars, start with the primary keyword, reads as a natural phrase, no ALL CAPS
- tags: exactly 13 tags, each max 20 chars, use long-tail buyer search phrases (occasion, recipient, style, material)
- description: 150–250 words, first sentence contains primary keyword, conversational tone, no hype words`,
        schema: `{
  "title": "string",
  "tags": ["string"],
  "description": "string"
}`,
      };
    case "amazon":
      return {
        spec: `Amazon listing requirements:
- title: max 200 chars, brand/product type first, keyword-rich, readable
- bullets: exactly 5 bullet points, each max 255 chars, benefit-led with a CAPS opener word, keyword in first bullet
- backendKeywords: max 250 bytes, space-separated, no repeats from title/bullets, purchase-intent terms
- description: max 300 words, benefit-led paragraphs, focus on use cases`,
        schema: `{
  "title": "string",
  "bullets": ["string"],
  "backendKeywords": "string",
  "description": "string"
}`,
      };
    case "shopify":
      return {
        spec: `Shopify product page requirements:
- metaTitle: max 60 chars, primary keyword present, includes brand if space allows
- metaDescription: max 160 chars, keyword present, clear value proposition, includes a soft CTA
- productTitle: clean storefront title, 5–10 words, conversion-focused
- description: 200–350 words, benefit-led, keyword-rich, includes use cases and features`,
        schema: `{
  "metaTitle": "string",
  "metaDescription": "string",
  "productTitle": "string",
  "description": "string"
}`,
      };
    case "ebay":
      return {
        spec: `eBay listing requirements:
- title: max 80 chars, keyword-front-loaded, include specific product details (brand/model/size/condition), no ALL CAPS
- description: 150–300 words, condition clearly stated, key specs in short lines, shipping/returns mentioned at the end`,
        schema: `{
  "title": "string",
  "description": "string"
}`,
      };
    default:
      return { spec: "", schema: "{}" };
  }
}

function buildPrompt(data: ValidatedInput): string {
  const sourceLabel = SOURCE_LABELS[data.sourcePlatform];
  const targetLabel = SOURCE_LABELS[data.targetPlatform];
  const sourceBlock = buildSourceBlock(data);
  const { spec, schema } = buildTargetSpec(data.targetPlatform);

  return `You are an expert e-commerce copywriter. A seller has a listing on ${sourceLabel} and wants to list the same product on ${targetLabel}. Reformat the listing content to meet ${targetLabel}'s specific requirements and best practices.

ORIGINAL ${sourceLabel.toUpperCase()} LISTING:
${sourceBlock}

${targetLabel.toUpperCase()} REQUIREMENTS:
${spec}

Writing rules: no em dashes, no ellipses, write naturally and directly like a real seller. Preserve all product-specific details (materials, dimensions, brand, model, colour). Do not invent specifications not present in the source.

Return ONLY valid JSON matching this schema:
${schema}

Return only the JSON, no markdown.`;
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
      { error: "Platform migration is available on paid plans.", code: "FEATURE_GATED" },
      { status: 402 }
    );
  }
  const used = usageData.optimisations;
  const limit = usageData.limit;
  if (limit !== null && used >= limit) {
    return NextResponse.json(
      {
        error: `You've used all ${limit} optimisations for this month. Upgrade your plan to continue.`,
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

  const data = parsed.data;

  if (data.sourcePlatform === data.targetPlatform) {
    return NextResponse.json(
      { error: "Source and target platforms must be different" },
      { status: 400 }
    );
  }

  const hasContent =
    data.title || data.tags || data.description || data.bullets ||
    data.backendKeywords || data.metaTitle || data.metaDescription || data.productCopy;

  if (!hasContent) {
    return NextResponse.json(
      { error: "Paste at least one field from your source listing" },
      { status: 400 }
    );
  }

  const prompt = buildPrompt(data);

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    let result: Record<string, unknown>;
    try {
      result = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
      }
      result = JSON.parse(match[0]);
    }

    try {
      await incrementUsage(user.id, "optimisations");
    } catch (err) {
      console.error("Failed to increment usage:", err);
    }

    return NextResponse.json({
      targetPlatform: data.targetPlatform,
      result,
      used: used + 1,
      limit,
    });
  } catch (err) {
    if (err instanceof APIConnectionError || (err instanceof APIError && err.status >= 500)) {
      return NextResponse.json(
        { error: "AI is temporarily unavailable. Please try again in a moment.", code: "AI_UNAVAILABLE" },
        { status: 503 }
      );
    }
    console.error("Migrate API error:", err);
    return NextResponse.json({ error: "Failed to migrate listing" }, { status: 500 });
  }
}
