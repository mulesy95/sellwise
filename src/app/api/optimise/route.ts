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
import { scoreOptimisedListing } from "@/lib/listing-score";
import type { ScoredListing } from "@/lib/listing-score";

const client = new Anthropic();

const requestSchema = z.object({
  platform: z.enum(["etsy", "amazon", "shopify", "ebay", "woocommerce", "wix", "squarespace", "tiktok", "social"]).default("etsy"),
  productName: z.string().min(1).max(200),
  materials: z.string().max(300).optional().default(""),
  style: z.string().max(200).optional().default(""),
  targetBuyer: z.string().max(200).optional().default(""),
  keywords: z.string().max(600).optional().default(""),
  imageBase64: z.string().optional(),
  imageMediaType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"]).optional(),
  imageUrl: z.string().url().refine((u) => u.startsWith("https://"), "imageUrl must use HTTPS").optional(),
  existingContent: z.string().max(2000).optional().default(""),
  productId: z.string().optional(),
  shopId: z.string().optional(),
  demo: z.boolean().optional(),
});

const WRITING_RULES = `Writing rules:
- NEVER invent product details that were not provided. Only use details from the seller's input or visually confirmed in the product image (if one was supplied). No made-up dimensions, colours, materials, features, or condition claims.
- NEVER invent lifestyle or aesthetic claims — do not say a product "looks great on a wall", "makes a statement", "starts a conversation", or any other made-up social/lifestyle context that wasn't in the input.
- NEVER make editorial verdicts or value judgements — do not say a product "earns a second look", "rewards a close look", "delivers in full", "is worth buying", "worth picking over", or any other claim that tells the buyer what to think. Every sentence must describe the product, not evaluate it.
- NEVER infer product quantities, set sizes, or bundle compositions from an image — if the photo shows two boards, do not write "two boards" or imply it is a set. Describe the product individually as listed.
- NEVER infer product specs from visual cues in an image — do not describe binding insert patterns, stance width, mount setup, board shape, nose or tail geometry, directional vs twin, flex, material composition, size, or weight from what the image shows. This applies even if the feature is visible — "visible in the image" is not an exception. Only describe specs the seller explicitly stated in their input.
- Do not mention binding inserts or mount holes at all unless the seller described them in the input.
- If a brand logo or branded graphic is visible on the product in an image, describe it generically (e.g. "a bag logo", "a logo near the nose") — never name the brand or company whose logo it is.
- NEVER reference sizing, quantity options, variants, stock levels, customisation, or purchasing logistics (e.g. "available in your choice of size", "message us for sizing", "comes in multiple colours") unless the seller explicitly stated these in their input. If size or variant information is not provided, omit it entirely — do not write around it.
- NEVER include the platform name in any output field — do not write "Shopify", "eBay", "Etsy", or "Amazon" in any title, description, or meta field.
- Use the exact product name as given. Do not paraphrase, shorten, or reinterpret it.
- NEVER use em dashes (—), en dashes (–), or ellipses (…)
- Write like a real person: short sentences, plain punctuation (commas, full stops, exclamation marks only)
- No buzzwords or their adverb/adjective forms: unique, stunning, beautiful, beautifully, perfect, perfectly, seamlessly, elevate, elevating, enhance, enhancing, exceptional, premium, top-notch`;

function buildSystemPrompt(platform: Platform): string {
  switch (platform) {
    case "etsy":
      return `You are an expert Etsy SEO specialist and conversion copywriter. Etsy buyers are emotional — they are buying a feeling, a gift, a story. Your listing must rank AND make someone stop scrolling.

The description must:
- Open with the occasion, recipient, or feeling the seller described — use their words, not invented ones
- Include practical details (materials, size, care) woven in naturally, not as a spec sheet
- End with a warm call to action that matches Etsy's handmade, personal tone
- Draw emotional framing only from what the seller provided. Do not invent physical sensations (e.g. "feel their shoulders drop"), invented reactions, or editorial verdicts (e.g. "a genuinely considered gift", "works beautifully as a gift", "the kind of thing someone keeps"). Describe what the product is and who it is for.
- NEVER use "beautiful", "beautifully", "stunning", or any other word that evaluates the product's appearance.

Return ONLY a valid JSON object:
{
  "title": "max 140 chars, keyword-front-loaded, reads as a natural phrase — use connective words (for, with, and), never comma-separate keywords. Example: \\"Handmade Ceramic Coffee Mug for Coffee Lovers, Hand Thrown Stoneware Cup with Minimalist Design\\"",
  "tags": ["exactly 13 tags", "HARD LIMIT: every tag must be 20 characters or fewer — count every letter and space before writing each tag, do not exceed 20", "mix of short and long-tail buyer search phrases", "no repeated words across tags"],
  "description": "150–250 words, occasion-first opening using the seller's stated buyer or occasion, product details woven in, warm call to action"
}

${WRITING_RULES}
Return only the JSON object, no markdown.`;

    case "amazon":
      return `You are an expert Amazon FBA listing specialist. Generate an optimised Amazon product listing.

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

Write as if a real person is browsing this product page on their phone. The description must:
- Open with the most specific, striking detail about this product — something only true of this product, not a generic opener
- Use short paragraphs — 2–3 sentences max — so it reads cleanly on mobile
- Mention the most visually or functionally distinct detail in the first 40 words
- End with a specific factual detail that supports the purchase — a real attribute of the product. If no clear closing fact exists, end on the most distinctive visual or functional detail from the description. Do NOT close with a verdict, recommendation, or opinion about whether the product is worth buying

Return ONLY a valid JSON object:
{
  "metaTitle": "max 60 chars strictly — start with the exact product name as given, then add the most distinctive visual detail if space allows (e.g. 'The Multi-location Snowboard | Pixel Art Base')",
  "metaDescription": "max 160 chars strictly — primary keyword included, factual description of what the product is, ends with a short call to action. No value judgements or lifestyle claims.",
  "productTitle": "if a real product name was provided, use it exactly with no changes. If the product name is a placeholder or generic identifier (e.g. 'Product 1', 'New Item'), generate a clean 4–8 word storefront title from confirmed product details only",
  "description": "200–300 words, desire-first opening, short benefit-led paragraphs, covers materials/fit/feel, ends with a line that closes the sale"
}

${WRITING_RULES}
Return only the JSON object, no markdown.`;

    case "ebay":
      return `You are an expert eBay listing specialist. eBay buyers are comparison shoppers — they search by exact spec and scan listings fast. Your listing must match their search AND give them a reason to choose this listing over 20 identical ones.

The description must:
- Lead with the single most important spec or selling point (brand, model, condition, key feature)
- Use short lines — eBay descriptions are scanned, not read
- State condition clearly and honestly (New, Like New, Used, Good Condition, etc.) — only use condition details that were actually provided, do not invent claims about colour, brightness, fade, or wear that were not stated
- Do NOT include return policy or postage details — eBay displays these separately from structured listing fields
- If the seller has provided limited details, write a short honest description of what is known. Do NOT pad with obvious facts, circular statements that restate the product name (e.g. "The PlayStation 5 is Sony's PlayStation 5 console"), or inferred compatibility claims that were not stated by the seller. A tight 100-word description is better than 200 words of filler.

Return ONLY a valid JSON object:
{
  "title": "max 80 chars — keyword-rich from the start, include brand/model/size/condition if known, no ALL CAPS, be specific",
  "description": "100–200 words, most important spec first, short scannable lines, condition stated if known, product focused — write less if there is less to say",
  "itemSpecifics": {
    "Brand": "brand name or 'Does not apply' if unknown",
    "Model": "model name/number or omit if unknown",
    "Condition": "New / Like New / Good / Acceptable — only if stated by seller",
    "Colour": "colour or omit if unknown",
    "MPN": "manufacturer part number or omit if unknown",
    "Type": "product type or category if helpful"
  }
}

Only include keys in itemSpecifics where you have factual information from the seller's input. Do not invent or guess values. If you have no item specifics at all, include an empty object: "itemSpecifics": {}.
Add other category-relevant keys (e.g. Size, Screen Size, Storage Capacity, Material) if the seller's input supports them.

${WRITING_RULES}
- eBay title: buyers search for exact model/spec terms — be specific, not generic
Return only the JSON object, no markdown.`;

    case "woocommerce":
      return `You are a WooCommerce SEO and conversion copywriter. WooCommerce products are indexed by Google — the copy must rank for the right terms AND convert when a buyer lands on the page.

The short description is the first copy most buyers see — it appears beside the Add to Cart button and on category grids. Make it the single most specific, compelling detail about this product in one or two tight sentences.

Return ONLY a valid JSON object:
{
  "productTitle": "exact product name as given, or a clean 4–8 word title if the name is a placeholder",
  "shortDescription": "max 150 chars — the most specific, compelling detail about this product. Factual, not a tagline.",
  "description": "200–350 words, opens with the strongest product detail, short paragraphs, key attributes woven in, ends with a factual closing line",
  "seoTitle": "max 60 chars strictly — primary keyword and product name, reads naturally",
  "seoDescription": "max 160 chars strictly — primary keyword, factual product description, soft call to action"
}

${WRITING_RULES}
Return only the JSON object, no markdown.`;

    case "wix":
      return `You are a Wix eCommerce and Google SEO copywriter. Wix stores are typically visual and image-led — the description picks up where the product photo leaves off. It must rank in Google and give the buyer enough detail to buy with confidence.

Return ONLY a valid JSON object:
{
  "productTitle": "exact product name as given, or a clean 4–8 word title if the name is a placeholder",
  "description": "200–350 words, opens on the most specific and distinctive detail about this product, short paragraphs, key attributes woven in naturally, ends with a factual closing line",
  "seoTitle": "max 60 chars strictly — primary keyword and product name, reads naturally",
  "seoDescription": "max 160 chars strictly — primary keyword, factual product summary, soft call to action"
}

${WRITING_RULES}
Return only the JSON object, no markdown.`;

    case "squarespace":
      return `You are a Squarespace eCommerce and Google SEO copywriter. Squarespace sellers are typically design-led, boutique, or creative brands. Buyers expect considered copy — concrete specifics over generic adjectives, confidence over hype.

Return ONLY a valid JSON object:
{
  "productTitle": "exact product name as given, or a clean 4–8 word title if the name is a placeholder",
  "description": "200–300 words, opens on the most visually or functionally distinctive detail, concise confident paragraphs, key product specifics throughout, ends with a factual closing line",
  "seoTitle": "max 60 chars strictly — primary keyword and product name, reads naturally",
  "seoDescription": "max 160 chars strictly — primary keyword, factual product description, soft call to action"
}

${WRITING_RULES}
Return only the JSON object, no markdown.`;

    case "tiktok":
      return `You are a TikTok Shop listing specialist. Buyers discover products mid-scroll and make impulse decisions in seconds. The title must surface in TikTok Shop search. The description must earn a tap before they scroll past.

Title: lead with what the product IS (the searchable term), then key attributes buyers filter by. No ALL CAPS.
Description: open with the single strongest reason to buy right now, then two or three specific features in short punchy lines. End with a concrete detail that closes the impulse.

Return ONLY a valid JSON object:
{
  "title": "max 100 chars — searchable product term first, type and key attributes included",
  "description": "100–200 words, hook-first, short punchy lines, 2–3 key features, specific closing detail"
}

${WRITING_RULES}
Return only the JSON object, no markdown.`;

    case "social":
      return `You are a social media product copywriter for Instagram, Facebook, Pinterest, and TikTok organic. Goal: stop the scroll, spark interest, drive a click or DM.

Caption: the hook that runs before the Instagram "more" cutoff. Open with the single most striking detail — a surprising fact, strong visual cue, or relatable scenario. Do not end with a call to action.
Post copy: expands on the caption with key product details and who it's for. End with a clear call to action (link in bio, DM to order, comment SIZE, etc.).
Hashtags: 3–4 broad reach (500k+ posts), 5–6 niche discovery (10k–200k posts), 3–4 product-specific, 2–3 audience or occasion tags.

Return ONLY a valid JSON object:
{
  "caption": "max 125 chars — hook first, specific detail, no generic opener, no call to action at the end",
  "postCopy": "100–200 words, expands on caption, key product details and who it's for, clear call to action at the end",
  "hashtags": ["exactly 20 hashtags", "no # prefix — just the word", "no spaces in any hashtag"]
}

${WRITING_RULES}
Return only the JSON object, no markdown.`;
  }
}

function improveModeSuffix(): string {
  return `

IMPROVE MODE — The seller's existing listing is provided above. Your job is to improve it, not replace it.

Additional output requirements — add these two fields to your JSON response:
1. "original": an object containing the field values you parsed from the seller's existing listing. Use the exact same field names as your improved output (e.g. "title", "metaTitle", "description", "tags"). Only include fields you can actually parse — do not invent original values.
2. "changes": an array of objects, one per field where you made a meaningful improvement: { "field": "title", "reason": "specific explanation of what changed and why" }. The reason must be specific — state what keyword was added, what structure was fixed, what rule was applied. Not generic phrases like "improved for SEO".

If a field needed no change, do not include it in "changes".
Do not include "original" or "changes" keys in the platform-specific JSON schema above — add them alongside those fields in your response.`;
}

function buildUserMessage(
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
  return [
    `Product: ${productName}`,
    materials && `Materials/techniques: ${materials}`,
    style && `Style/aesthetic: ${style}`,
    targetBuyer && `Target buyer/occasion: ${targetBuyer}`,
    keywords && `Keywords to include: ${keywords}`,
    existingContent && `Existing listing (improve this — use only the product details present here):\n${existingContent}`,
  ]
    .filter(Boolean)
    .join("\n");
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

  const { platform, productName, materials, style, targetBuyer, keywords, imageBase64, imageMediaType, imageUrl, existingContent, productId, shopId, demo } =
    parsed.data;

  let used = 0;
  let limit = 0;
  if (!demo) {
    const { allowed, used: usedCount, limit: limitCount, dailyLimitHit, dailyLimit } = await checkLimit(user.id, "optimisations");
    used = usedCount;
    limit = limitCount ?? 0;
    if (!allowed) {
      const error = dailyLimitHit
        ? `You've hit today's limit of ${dailyLimit} optimisations. Resets at midnight — or upgrade your plan for a higher daily limit.`
        : `You've used all ${limit} optimisations for this month. Upgrade your plan to continue.`;
      return NextResponse.json(
        { error, code: dailyLimitHit ? "DAILY_LIMIT_EXCEEDED" : "LIMIT_EXCEEDED" },
        { status: 402 }
      );
    }
  }

  let brandVoice = "";
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("brand_voice, brand_voice_auto")
      .eq("id", user.id)
      .single();
    brandVoice = (profile?.brand_voice ?? profile?.brand_voice_auto ?? "").slice(0, 400);
  } catch {
    // proceed without brand voice
  }

  const hasImage = !!(imageUrl || (imageBase64 && imageMediaType));

  const userText = buildUserMessage(platform, { productName, materials, style, targetBuyer, keywords, existingContent });
  const userTextWithImageContext = hasImage
    ? `A photo of the product is included. Use what you can see — colour, material, texture, form, scale — to write accurate, specific copy.\n\n${userText}`
    : userText;

  type ImageSource =
    | { type: "url"; url: string }
    | { type: "base64"; media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp"; data: string };

  const imageSource: ImageSource | null = imageUrl
    ? { type: "url", url: imageUrl }
    : imageBase64 && imageMediaType
    ? { type: "base64", media_type: imageMediaType, data: imageBase64 }
    : null;

  const brandVoiceSuffix = brandVoice
    ? `\n\nSeller brand voice: ${brandVoice}\nWrite all copy in this voice. Keep platform SEO rules above, but let this tone shape word choice, sentence rhythm, and energy level.`
    : "";

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: [
        {
          type: "text" as const,
          text: buildSystemPrompt(platform) + (existingContent ? improveModeSuffix() : "") + brandVoiceSuffix,
          cache_control: { type: "ephemeral" as const },
        },
      ],
      messages: [{
        role: "user",
        content: imageSource
          ? [
              { type: "image" as const, source: imageSource },
              { type: "text" as const, text: userTextWithImageContext },
            ]
          : userTextWithImageContext,
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

    const savedScore = scoreOptimisedListing({ platform, ...listing } as ScoredListing);

    let optimisationId: string | null = null;
    if (!demo) {
      try {
        const [, { data: insertedRow }] = await Promise.all([
          incrementUsage(user.id, "optimisations"),
          supabase
            .from("optimisations")
            .insert({
              user_id: user.id,
              platform,
              product_id: productId ?? null,
              shop_id: shopId ?? null,
              input: { productName, materials, style, targetBuyer, keywords },
              output: listing,
              score: savedScore,
            })
            .select("id")
            .single(),
        ]);
        optimisationId = insertedRow?.id ?? null;
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
    }

    // Serialise itemSpecifics in original (if present) to the same key-value string format
    if (
      listing.original &&
      typeof listing.original === "object" &&
      !Array.isArray(listing.original)
    ) {
      const orig = listing.original as Record<string, unknown>;
      if (orig.itemSpecifics && typeof orig.itemSpecifics === "object" && !Array.isArray(orig.itemSpecifics)) {
        orig.itemSpecifics = Object.entries(orig.itemSpecifics as Record<string, string>)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n");
      }
    }

    // Peer comparison — is this score in the top 5% for this platform this week?
    let topPercent = false;
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentScores } = await supabase
        .from("optimisations")
        .select("score")
        .eq("platform", platform)
        .gte("created_at", weekAgo)
        .not("score", "is", null);

      if (recentScores && recentScores.length >= 20) {
        const scores = recentScores
          .map((r) => r.score as number)
          .sort((a, b) => a - b);
        const p95index = Math.floor(scores.length * 0.95);
        const p95 = scores[p95index];
        const currentScore = scoreOptimisedListing({
          platform,
          ...listing,
        } as ScoredListing);
        topPercent = currentScore >= p95;
      }
    } catch {
      // Non-critical — silently ignore
    }

    return NextResponse.json({ ...listing, platform, used: used + 1, limit, id: optimisationId, topPercent });
  } catch (err) {
    if (err instanceof APIConnectionError || (err instanceof APIError && err.status >= 500)) {
      return NextResponse.json(
        { error: "AI is temporarily unavailable. Please try again in a moment.", code: "AI_UNAVAILABLE" },
        { status: 503 }
      );
    }
    if (err instanceof APIError && (err.status === 400 || err.status === 422)) {
      const msg = (err as { message?: string }).message ?? "";
      const isImage = msg.toLowerCase().includes("image") || msg.toLowerCase().includes("media");
      return NextResponse.json(
        { error: isImage ? "Failed to process the image. Try a smaller image or remove it and try again." : "Invalid request. Check your inputs and try again." },
        { status: 422 }
      );
    }
    console.error("Optimise API error:", err);
    return NextResponse.json(
      { error: "Failed to generate listing" },
      { status: 500 }
    );
  }
}
