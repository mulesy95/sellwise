import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Platform } from "@/lib/platforms";

const client = new Anthropic();

const requestSchema = z.object({
  platform: z.enum(["etsy", "amazon", "shopify", "ebay", "woocommerce", "wix", "squarespace", "tiktok", "social"]),
  productName: z.string().min(1).max(200),
  field: z.enum(["style", "targetBuyer"]),
  currentValue: z.string().max(200).optional().default(""),
});

const STYLE_CONTEXT: Record<Platform, string> = {
  etsy: `Etsy buyers respond to handmade aesthetics and material feel. Good examples: "rustic, hand-thrown, matte glaze", "minimalist, clean lines, Scandi-inspired", "cottagecore, earthy, pressed botanical"`,
  amazon: `Amazon buyers want product category language they recognise. Good examples: "sleek, matte black, compact", "rugged, weatherproof, tactical", "vintage-inspired, brass hardware, warm tones"`,
  shopify: `Shopify stores have brand identities. Good examples: "minimal, monochrome, editorial", "earthy, organic, sustainable", "bold, graphic, street-inspired"`,
  ebay: `eBay buyers want era and condition descriptors. Good examples: "vintage 1980s, chrome detailing", "retro, woodgrain finish, original packaging", "industrial, brushed steel"`,
  woocommerce: `Focus on searchable product aesthetics. Good examples: "minimalist Scandinavian design", "rustic reclaimed wood finish", "bold geometric pattern"`,
  wix: `Visual character and brand feel. Good examples: "artisan, handcrafted, textured", "clean, modern, studio aesthetic"`,
  squarespace: `Boutique brand language. Good examples: "considered, minimal, natural materials", "architectural, graphic, bold colour-blocking"`,
  tiktok: `TikTok aesthetic language. Good examples: "clean girl, neutral tones", "dark academia, vintage", "Y2K, metallic, glossy"`,
  social: `Visual lifestyle aesthetics. Good examples: "earthy, cottagecore, textured", "clean aesthetic, neutral palette", "maximalist, bold prints"`,
};

const BUYER_CONTEXT: Record<Platform, string> = {
  etsy: `Etsy buyers search by occasion, recipient, and feeling. Good examples: "gift for new mum, baby shower", "women who love minimalist jewellery", "coffee lovers, office gift under $30"`,
  amazon: `Amazon buyers search by use case. Good examples: "home gym users wanting compact equipment", "students needing a portable charger", "parents of toddlers"`,
  shopify: `Shopify shoppers respond to identity. Good examples: "women 25–40 who follow slow fashion", "surfers and coastal lifestyle lovers", "professionals who want a clean desk setup"`,
  ebay: `eBay buyers are collectors and deal-hunters. Good examples: "collectors of 1990s gaming memorabilia", "mechanics looking for OEM parts", "resellers who buy in bulk"`,
  woocommerce: `Who searches for and buys this. Good examples: "home bakers who prioritise quality ingredients", "dog owners looking for natural treats"`,
  wix: `Who this product is for. Good examples: "brides-to-be planning a boho wedding", "parents decorating a nursery"`,
  squarespace: `The considered buyer. Good examples: "interior designers sourcing unique pieces", "gift buyers who want something thoughtful"`,
  tiktok: `TikTok buyer persona. Good examples: "Gen Z students who love room decor", "skincare enthusiasts who follow #cleangirl"`,
  social: `Instagram/Pinterest buyer. Good examples: "mums looking for personalised gifts", "home decor lovers who follow aesthetic accounts"`,
};

function buildPrompt(platform: Platform, productName: string, field: "style" | "targetBuyer", currentValue: string): string {
  const context = currentValue
    ? `They currently have: "${currentValue}". Suggest a refinement or addition.`
    : "They have not filled this in yet. Suggest something concrete.";

  if (field === "style") {
    return `A seller is listing "${productName}" on ${platform}. They need 3–8 words describing the style and aesthetic of their product.

${STYLE_CONTEXT[platform]}

${context}

Respond with ONLY a short comma-separated style description. No explanation, no punctuation at the end. Just the description.`;
  }

  return `A seller is listing "${productName}" on ${platform}. They need 5–15 words describing who their target buyer is.

${BUYER_CONTEXT[platform]}

${context}

Respond with ONLY a short description of the target buyer. Be specific: mention occasion, recipient type, or use case. No explanation, no punctuation at the end.`;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { platform, productName, field, currentValue } = parsed.data;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [{ role: "user", content: buildPrompt(platform, productName, field, currentValue) }],
    });
    const suggestion = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    return NextResponse.json({ suggestion });
  } catch {
    return NextResponse.json({ error: "Failed to generate suggestion" }, { status: 500 });
  }
}
