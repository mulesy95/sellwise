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
- Open with a sentence that creates desire, not just states facts
- Make the product feel worth the price before the customer even scrolls
- Use short paragraphs — 2–3 sentences max — so it reads cleanly on mobile
- Mention the most compelling detail (material, fit, feel, occasion) in the first 40 words
- End with a line that removes hesitation or creates urgency (not fake urgency — something true like limited colourways, handmade, ships same day)

Return ONLY a valid JSON object:
{
  "metaTitle": "max 60 chars strictly — primary keyword near the start, brand name at end if space allows",
  "metaDescription": "max 160 chars strictly — primary keyword included, clear value proposition, ends with a soft call to action that makes someone want to click",
  "productTitle": "clean storefront product title, 4–8 words, sounds like something you'd actually buy — no keyword stuffing",
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
- State condition clearly and honestly (New, Like New, Used — Good Condition, etc.)
- Include anything that removes buyer hesitation: warranty, return policy, fast shipping, authenticity
- End with a clear line on postage or pickup options

Return ONLY a valid JSON object:
{
  "title": "max 80 chars — keyword-rich from the start, include brand/model/size/condition if known, no ALL CAPS, be specific",
  "description": "150–300 words, most important spec first, short scannable lines, condition stated clearly, ends with shipping and returns note"
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

  const { platform, productName, materials, style, targetBuyer, keywords, imageBase64, imageMediaType, imageUrl, existingContent } =
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
