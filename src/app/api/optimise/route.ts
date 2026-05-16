import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import Anthropic, { APIConnectionError, APIError } from "@anthropic-ai/sdk";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkLimit, incrementUsage } from "@/lib/usage";
import { rewardReferral } from "@/lib/referral";
import type { Platform } from "@/lib/platforms";

const client = new Anthropic();

const requestSchema = z.object({
  platform: z.enum(["etsy", "amazon", "shopify", "ebay"]).default("etsy"),
  productName: z.string().min(1).max(200),
  materials: z.string().max(300).optional().default(""),
  style: z.string().max(200).optional().default(""),
  targetBuyer: z.string().max(200).optional().default(""),
  keywords: z.string().max(300).optional().default(""),
  imageBase64: z.string().optional(),
  imageMediaType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]).optional(),
  imageUrl: z.string().url().refine((u) => u.startsWith("https://"), "imageUrl must use HTTPS").optional(),
});

const WRITING_RULES = `Writing rules:
- NEVER use em dashes (—), en dashes (–), or ellipses (…)
- Write like a real person: short sentences, plain punctuation (commas, full stops, exclamation marks only)
- No buzzwords: unique, stunning, beautiful, perfect, seamlessly, elevate, enhance`;

function buildPrompt(
  platform: Platform,
  inputs: {
    productName: string;
    materials: string;
    style: string;
    targetBuyer: string;
    keywords: string;
  }
): string {
  const { productName, materials, style, targetBuyer, keywords } = inputs;
  const context = [
    `Product: ${productName}`,
    materials && `Materials/techniques: ${materials}`,
    style && `Style/aesthetic: ${style}`,
    targetBuyer && `Target buyer/occasion: ${targetBuyer}`,
    keywords && `Keywords to include: ${keywords}`,
  ]
    .filter(Boolean)
    .join("\n");

  switch (platform) {
    case "etsy":
      return `You are an expert Etsy SEO specialist. Generate an optimised Etsy listing.

${context}

Return ONLY a valid JSON object:
{
  "title": "max 140 chars, keyword-front-loaded, reads as a natural phrase — use connective words (for, with, and), never comma-separate keywords. Example: \\"Handmade Ceramic Coffee Mug for Coffee Lovers, Hand Thrown Stoneware Cup with Minimalist Design\\"",
  "tags": ["exactly 13 tags", "each max 20 chars", "mix of short and long-tail buyer search phrases", "no repeated words across tags"],
  "description": "150–250 words, opens with primary keyword, highlights materials and uniqueness, includes use cases and gift potential, ends with a call to action"
}

${WRITING_RULES}
Return only the JSON object, no markdown.`;

    case "amazon":
      return `You are an expert Amazon FBA listing specialist. Generate an optimised Amazon product listing.

${context}

Return ONLY a valid JSON object:
{
  "title": "max 200 chars — lead with brand or product type, include primary keyword, colour/size if relevant",
  "bullets": ["exactly 5 bullet points", "each max 255 chars", "start each with a 2–3 word benefit in CAPS then a colon, e.g. STAYS HOT LONGER: ...", "keyword-rich but reads naturally"],
  "backendKeywords": "space-separated keywords, max 250 bytes total, no words already in title or bullets, purchase-intent terms only",
  "description": "150–250 words, expands on bullet points, HTML line breaks allowed, focus on use cases and who this is for"
}

${WRITING_RULES}
Return only the JSON object, no markdown.`;

    case "shopify":
      return `You are an expert Shopify SEO and conversion copywriter. Generate optimised Shopify product content.

${context}

Return ONLY a valid JSON object:
{
  "metaTitle": "max 60 chars strictly — primary keyword near the start, brand name at end if space allows",
  "metaDescription": "max 160 chars strictly — contains primary keyword, includes a clear value proposition, ends with a soft call to action",
  "productTitle": "clean storefront product title, 5–10 words, conversion-focused, no keyword stuffing",
  "description": "200–350 words, opens with primary keyword, benefit-led paragraphs, includes materials/dimensions, use cases, ends with reason to buy"
}

${WRITING_RULES}
Return only the JSON object, no markdown.`;

    case "ebay":
      return `You are an expert eBay listing specialist. Generate an optimised eBay product listing.

${context}

Return ONLY a valid JSON object:
{
  "title": "max 80 chars — keyword-rich from the start, include brand/model/size/condition if known, no ALL CAPS, be specific",
  "description": "150–300 words, opens with product name and key spec, states condition (New/Used), lists key features in short lines, ends with a note on shipping or returns"
}

${WRITING_RULES}
- eBay title: buyers search for exact model/spec terms — be specific, not generic
Return only the JSON object, no markdown.`;
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

  const { allowed, used, limit } = await checkLimit(user.id, "optimisations");
  if (!allowed) {
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
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { platform, productName, materials, style, targetBuyer, keywords, imageBase64, imageMediaType, imageUrl } =
    parsed.data;

  const hasImage = !!(imageUrl || (imageBase64 && imageMediaType));
  const basePrompt = buildPrompt(platform, { productName, materials, style, targetBuyer, keywords });
  const prompt = hasImage
    ? `A photo of the product is included. Use what you can see — colour, material, texture, form, scale — to write accurate, specific copy.\n\n${basePrompt}`
    : basePrompt;

  type ImageSource =
    | { type: "url"; url: string }
    | { type: "base64"; media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp"; data: string };

  const imageSource: ImageSource | null = imageUrl
    ? { type: "url", url: imageUrl }
    : imageBase64 && imageMediaType
    ? { type: "base64", media_type: imageMediaType, data: imageBase64 }
    : null;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: imageSource
          ? [
              { type: "image" as const, source: imageSource },
              { type: "text" as const, text: prompt },
            ]
          : prompt,
      }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    let listing: Record<string, unknown>;
    try {
      listing = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "Failed to parse AI response" },
          { status: 500 }
        );
      }
      listing = JSON.parse(match[0]);
    }

    try {
      await incrementUsage(user.id, "optimisations");
      revalidatePath("/dashboard", "layout");

      // Stamp first optimisation time — cron sends email after 2 hours
      if (used === 0) {
        void (async () => {
          try {
            const admin = createAdminClient();
            const { data: profile } = await admin
              .from("profiles")
              .select("first_optimisation_sent, first_optimisation_at, onboarding_completed")
              .eq("id", user.id)
              .single();

            if (profile && !profile.first_optimisation_sent && !profile.first_optimisation_at && profile.onboarding_completed) {
              await admin
                .from("profiles")
                .update({ first_optimisation_at: new Date().toISOString() })
                .eq("id", user.id);
            }

            // Grant referral bonus to both parties on first use
            await rewardReferral(user.id);
          } catch (e) {
            console.error("[first-optimisation stamp]", e);
          }
        })();
      }
    } catch (incErr) {
      console.error("Failed to increment usage:", incErr);
    }

    return NextResponse.json({ ...listing, platform, used: used + 1, limit });
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
    console.error("Optimise API error:", err);
    return NextResponse.json(
      { error: "Failed to generate listing" },
      { status: 500 }
    );
  }
}
