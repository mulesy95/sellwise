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
  existingContent: z.string().max(1000).optional().default(""),
  productId: z.string().optional(),
  shopId: z.string().optional(),
});

const WRITING_RULES = `Writing rules:
- NEVER invent product details that were not provided. Only use details from the seller's input or visually confirmed in the product image (if one was supplied). No made-up dimensions, colours, materials, features, or condition claims.
- NEVER invent lifestyle or aesthetic claims — do not say a product "looks great on a wall", "makes a statement", "starts a conversation", or any other made-up social/lifestyle context that wasn't in the input.
- NEVER make editorial verdicts or value judgements — do not say a product "earns a second look", "rewards a close look", "delivers in full", "is worth buying", "worth picking over", or any other claim that tells the buyer what to think. Every sentence must describe the product, not evaluate it.
- NEVER infer product quantities, set sizes, or bundle compositions from an image — if the photo shows two boards, do not write "two boards" or imply it is a set. Describe the product individually as listed.
- NEVER infer product specs from visual cues in an image — do not describe binding insert patterns, stance width, mount setup, board shape, nose or tail geometry, directional vs twin, flex, material composition, size, or weight from what the image shows. This applies even if the feature is visible — "visible in the image" is not an exception. Only describe specs the seller explicitly stated in their input.
- Do not mention binding inserts or mount holes at all unless the seller described them in the input.
- If a brand logo or branded graphic is visible on the product in an image, describe it generically (e.g. "a bag logo", "a logo near the nose") — never name the brand or company whose logo it is.
- If a detail would strengthen the copy but isn't known, write around it rather than guessing (e.g. "comes in your choice of size" not "available in S, M, L").
- NEVER include the platform name in any output field — do not write "Shopify", "eBay", "Etsy", or "Amazon" in any title, description, or meta field.
- Use the exact product name as given. Do not paraphrase, shorten, or reinterpret it.
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
    existingContent?: string;
  }
): string {
  const { productName, materials, style, targetBuyer, keywords, existingContent } = inputs;
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
      return `You are an expert Etsy SEO specialist and conversion copywriter. Etsy buyers are emotional — they are buying a feeling, a gift, a story. Your listing must rank AND make someone stop scrolling.

${context}

The description must:
- Open with the emotional reason someone buys this — the occasion, the feeling, the recipient — before any product details
- Paint a picture of the product in use or as a gift being unwrapped
- Include practical details (materials, size, care) but weave them in naturally, not as a spec sheet
- End with a warm call to action that matches Etsy's handmade, personal tone

Return ONLY a valid JSON object:
{
  "title": "max 140 chars, keyword-front-loaded, reads as a natural phrase — use connective words (for, with, and), never comma-separate keywords. Example: \\"Handmade Ceramic Coffee Mug for Coffee Lovers, Hand Thrown Stoneware Cup with Minimalist Design\\"",
  "tags": ["exactly 13 tags", "each max 20 chars", "mix of short and long-tail buyer search phrases", "no repeated words across tags"],
  "description": "150–250 words, emotion-first opening, product details woven in naturally, use cases and gift potential, warm call to action"
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
      return `You are an expert Shopify SEO and conversion copywriter. Your goal is twofold: rank in Google and make a real customer want to buy the moment they land on the product page.

${context}${existingContent ? `\nExisting description (improve this, keep accurate product details):\n${existingContent}` : ""}

Write as if a real person is browsing this product page on their phone. The description must:
- Open with the most specific, striking detail about this product — something only true of this product, not a generic opener
- Use short paragraphs — 2–3 sentences max — so it reads cleanly on mobile
- Mention the most visually or functionally distinct detail in the first 40 words
- End with a specific factual detail that supports the purchase — a real attribute of the product. If no clear closing fact exists, end on the most distinctive visual or functional detail from the description. Do NOT close with a verdict, recommendation, or opinion about whether the product is worth buying

Return ONLY a valid JSON object:
{
  "metaTitle": "max 60 chars strictly — start with the exact product name as given, then add the most distinctive visual detail if space allows (e.g. 'The Multi-location Snowboard | Pixel Art Base')",
  "metaDescription": "max 160 chars strictly — primary keyword included, factual description of what the product is, ends with a short call to action. No value judgements or lifestyle claims.",
  "productTitle": "use the exact product name as given — do not rephrase, expand, or add descriptive words to it",
  "description": "200–300 words, desire-first opening, short benefit-led paragraphs, covers materials/fit/feel, ends with a line that closes the sale"
}

${WRITING_RULES}
Return only the JSON object, no markdown.`;

    case "ebay":
      return `You are an expert eBay listing specialist. eBay buyers are comparison shoppers — they search by exact spec and scan listings fast. Your listing must match their search AND give them a reason to choose this listing over 20 identical ones.

${context}

The description must:
- Lead with the single most important spec or selling point (brand, model, condition, key feature)
- Use short lines — eBay descriptions are scanned, not read
- State condition clearly and honestly (New, Like New, Used — Good Condition, etc.) — only use condition details that were actually provided, do not invent claims about colour, brightness, fade, or wear that were not stated
- Do NOT include return policy or postage details — eBay displays these separately from structured listing fields

Return ONLY a valid JSON object:
{
  "title": "max 80 chars — keyword-rich from the start, include brand/model/size/condition if known, no ALL CAPS, be specific",
  "description": "100–200 words, most important spec first, short scannable lines, condition stated clearly, product focused"
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

  const { allowed, used, limit, dailyLimitHit, dailyLimit } = await checkLimit(user.id, "optimisations");
  if (!allowed) {
    const error = dailyLimitHit
      ? `You've hit today's limit of ${dailyLimit} optimisations. Resets at midnight — or upgrade your plan for a higher daily limit.`
      : `You've used all ${limit} optimisations for this month. Upgrade your plan to continue.`;
    return NextResponse.json(
      { error, code: dailyLimitHit ? "DAILY_LIMIT_EXCEEDED" : "LIMIT_EXCEEDED" },
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

  const { platform, productName, materials, style, targetBuyer, keywords, imageBase64, imageMediaType, imageUrl, existingContent, productId, shopId } =
    parsed.data;

  const hasImage = !!(imageUrl || (imageBase64 && imageMediaType));
  const basePrompt = buildPrompt(platform, { productName, materials, style, targetBuyer, keywords, existingContent });
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
      max_tokens: 2048,
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
      await Promise.all([
        incrementUsage(user.id, "optimisations"),
        supabase.from("optimisations").insert({
          user_id: user.id,
          platform,
          product_id: productId ?? null,
          shop_id: shopId ?? null,
          input: { productName, materials, style, targetBuyer, keywords },
          output: listing,
        }),
      ]);
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
