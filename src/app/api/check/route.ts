import { checkRateLimit, ipFromRequest } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { fetchShopifyProduct } from "@/lib/listing-scraper";

const client = new Anthropic();

const requestSchema = z.object({
  url: z.string().url(),
});

const AUDIT_SYSTEM_PROMPT = `You are an expert Shopify SEO consultant. Audit the product listing provided.

Score out of 100:
- metaTitleScore (0-25): max 60 chars, includes primary keyword, reads naturally
- metaDescriptionScore (0-25): max 160 chars, includes primary keyword, has a soft call to action
- titleScore (0-15): clear product name, conversion-focused
- descriptionScore (0-35): opens with strongest detail, short paragraphs, key attributes included

Return ONLY valid JSON:
{
  "score": number,
  "label": "Excellent" | "Good" | "Needs work" | "Poor",
  "improvements": [
    { "field": "metaTitle" | "metaDescription" | "title" | "description", "issue": "specific issue", "fix": "specific fix" }
  ]
}

improvements: list every issue found, ordered by impact. Return only the JSON, no markdown.`;

export async function POST(req: NextRequest) {
  const ip = ipFromRequest(req);
  const { allowed } = checkRateLimit(`check:${ip}`, 3, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Try again in an hour." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { url } = parsed.data;

  // Shopify-only validation
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const isShopify =
    parsedUrl.hostname.endsWith(".myshopify.com") ||
    parsedUrl.pathname.includes("/products/");
  if (!isShopify) {
    return NextResponse.json(
      { error: "Only Shopify product URLs are supported right now." },
      { status: 400 }
    );
  }

  // Fetch Shopify product via the legitimate /products/{handle}.json endpoint
  let listing: { title: string; description: string };
  try {
    listing = await fetchShopifyProduct(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch listing";
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: AUDIT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Title: ${listing.title}\n\nDescription:\n${listing.description.slice(0, 3000)}`,
        },
      ],
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

    return NextResponse.json({ ...result, platform: "shopify" });
  } catch {
    return NextResponse.json({ error: "Failed to run check" }, { status: 500 });
  }
}
