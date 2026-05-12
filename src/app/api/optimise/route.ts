import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const client = new Anthropic();

const requestSchema = z.object({
  productName: z.string().min(1).max(200),
  materials: z.string().max(300).optional().default(""),
  style: z.string().max(200).optional().default(""),
  targetBuyer: z.string().max(200).optional().default(""),
  keywords: z.string().max(300).optional().default(""),
});

export async function POST(request: NextRequest) {
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

  const { productName, materials, style, targetBuyer, keywords } = parsed.data;

  const prompt = `You are an expert Etsy SEO specialist. Generate an optimised Etsy listing for the product below.

Product: ${productName}
${materials ? `Materials/techniques: ${materials}` : ""}
${style ? `Style/aesthetic: ${style}` : ""}
${targetBuyer ? `Target buyer/occasion: ${targetBuyer}` : ""}
${keywords ? `Keywords to include: ${keywords}` : ""}

Return ONLY a valid JSON object with exactly these fields:
{
  "title": "string — max 140 characters, keyword-rich, no ALL CAPS, starts with most important keyword",
  "tags": ["array of exactly 13 strings", "each tag max 20 characters", "single or multi-word phrases buyers search for"],
  "description": "string — 150-250 words, opens with primary keyword, highlights materials and uniqueness, includes use cases and gift potential, ends with a call to action"
}

Rules:
- Title: 100–140 chars, natural-sounding, primary keyword first
- Tags: exactly 13, no repeated words across tags, mix short and long-tail
- Description: conversational, SEO-rich, no hype words like "amazing" or "stunning"

Return only the JSON object, no markdown, no extra text.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    let listing: { title: string; tags: string[]; description: string };
    try {
      listing = JSON.parse(text);
    } catch {
      // Claude sometimes wraps in markdown — strip it
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "Failed to parse AI response" },
          { status: 500 }
        );
      }
      listing = JSON.parse(match[0]);
    }

    if (!listing.title || !Array.isArray(listing.tags) || !listing.description) {
      return NextResponse.json(
        { error: "Unexpected AI response shape" },
        { status: 500 }
      );
    }

    return NextResponse.json(listing);
  } catch (err) {
    console.error("Optimise API error:", err);
    return NextResponse.json(
      { error: "Failed to generate listing" },
      { status: 500 }
    );
  }
}
