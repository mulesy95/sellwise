import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkLimit, incrementUsage } from "@/lib/usage";

const client = new Anthropic();

const requestSchema = z.object({
  productName: z.string().min(1).max(200),
  materials: z.string().max(300).optional().default(""),
  style: z.string().max(200).optional().default(""),
  targetBuyer: z.string().max(200).optional().default(""),
  keywords: z.string().max(300).optional().default(""),
});

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Usage limit check
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

  // Validate input
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
- Title: 100–140 chars, must read as a natural phrase a human would write, primary keyword first. Do NOT string keywords together with commas. Use connective words (for, with, and, in) to make it flow. Example of bad title: "Handmade Mug, Ceramic Cup, Coffee Mug, Pottery Gift, Stoneware". Example of good title: "Handmade Ceramic Coffee Mug for Coffee Lovers, Hand Thrown Stoneware Cup with Minimalist Design"
- Tags: exactly 13, no repeated words across tags, mix short and long-tail
- Description: conversational, SEO-rich, no hype words like "amazing" or "stunning"
- NEVER use em dashes (—), en dashes (–), ellipses (…), or excessive commas — these read as AI-generated
- Write like a real shop owner wrote it: short sentences, plain punctuation (commas, full stops, exclamation marks only)
- No buzzwords: unique, stunning, beautiful, perfect, simply, seamlessly, elevate, enhance, delve

Return only the JSON object, no markdown, no extra text.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    let listing: { title: string; tags: string[]; description: string };
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

    if (!listing.title || !Array.isArray(listing.tags) || !listing.description) {
      return NextResponse.json(
        { error: "Unexpected AI response shape" },
        { status: 500 }
      );
    }

    // Increment usage only after a successful response
    await incrementUsage(user.id, "optimisations");

    return NextResponse.json({ ...listing, used: used + 1, limit });
  } catch (err) {
    console.error("Optimise API error:", err);
    return NextResponse.json(
      { error: "Failed to generate listing" },
      { status: 500 }
    );
  }
}
