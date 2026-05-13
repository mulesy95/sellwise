import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkLimit, incrementUsage } from "@/lib/usage";

const client = new Anthropic();

const requestSchema = z.object({
  keyword: z.string().min(1).max(100),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { allowed, used, limit } = await checkLimit(user.id, "keywords");
  if (!allowed) {
    return NextResponse.json(
      {
        error: `You've used all ${limit} keyword searches for this month. Upgrade your plan to continue.`,
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

  const { keyword } = parsed.data;

  const prompt = `You are an Etsy SEO expert. Given a seed keyword, return 15 related keyword phrases that Etsy buyers actually search for.

Seed keyword: ${keyword}

Return ONLY a valid JSON object with this structure:
{
  "keywords": [
    {
      "keyword": "the keyword phrase",
      "volume": "high",
      "competition": "low",
      "trend": "up"
    }
  ]
}

Rules:
- volume: "high" | "medium" | "low" — estimated search frequency on Etsy
- competition: "high" | "medium" | "low" — how many sellers target this exact term
- trend: "up" | "stable" | "down" — whether interest is growing
- Include a mix of short (1-2 words) and long-tail (3-5 words) phrases
- Include occasion-based variations (birthday gift, wedding, Christmas, etc.)
- Include recipient-based variations (for her, for him, for mum, etc.)
- Include style/aesthetic variations (minimalist, boho, rustic, etc.)
- Each keyword phrase should be something a real buyer types, not seller jargon
- Return exactly 15 keywords

Return only the JSON object, no markdown.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    let result: { keywords: { keyword: string; volume: string; competition: string; trend: string }[] };
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

    if (!Array.isArray(result.keywords)) {
      return NextResponse.json(
        { error: "Unexpected AI response shape" },
        { status: 500 }
      );
    }

    try {
      await incrementUsage(user.id, "keywords");
    } catch (err) {
      console.error("Failed to increment usage:", err);
    }

    return NextResponse.json({ keywords: result.keywords, used: used + 1, limit });
  } catch (err) {
    console.error("Keywords API error:", err);
    return NextResponse.json(
      { error: "Failed to generate keywords" },
      { status: 500 }
    );
  }
}
