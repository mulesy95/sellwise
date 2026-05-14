import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUsageData, incrementUsage } from "@/lib/usage";
import type { Platform } from "@/lib/platforms";

const client = new Anthropic();

const requestSchema = z.object({
  platform: z.enum(["etsy", "amazon", "shopify", "ebay"]).default("etsy"),
  keyword: z.string().min(1).max(100),
});

function buildPrompt(platform: Platform, keyword: string): string {
  const schema = `Return ONLY a valid JSON object:
{
  "keywords": [
    { "keyword": "the phrase", "volume": "high", "competition": "low", "trend": "up" }
  ]
}

Rules:
- volume: "high" | "medium" | "low"
- competition: "high" | "medium" | "low"
- trend: "up" | "stable" | "down"
- Return exactly 15 keywords
Return only the JSON object, no markdown.`;

  switch (platform) {
    case "etsy":
      return `You are an Etsy SEO expert. Given a seed keyword, return 15 related keyword phrases that Etsy buyers actually search for.

Seed keyword: ${keyword}

${schema}

Additional rules:
- Include occasion-based variations (birthday gift, wedding, Christmas, Mother's Day)
- Include recipient variations (for her, for him, for mum, for teacher)
- Include style/aesthetic variations (minimalist, boho, rustic, cottagecore)
- Each phrase should be something a real Etsy buyer types, not seller jargon`;

    case "amazon":
      return `You are an Amazon FBA SEO expert. Given a seed keyword, return 15 keyword phrases that Amazon shoppers actually search for.

Seed keyword: ${keyword}

${schema}

Additional rules:
- Focus on purchase-intent keywords (best, buy, top rated, cheap, review, under $X)
- Include feature-based terms buyers filter by (portable, wireless, heavy duty, waterproof)
- Include "for [use case]" variations
- Include brand-agnostic comparison terms
- volume/competition reflect Amazon search and PPC landscape`;

    case "shopify":
      return `You are a Shopify and Google SEO expert. Given a seed keyword, return 15 keyword phrases shoppers search for on Google to find products like this.

Seed keyword: ${keyword}

${schema}

Additional rules:
- Focus on Google organic search intent, not marketplace search
- Include long-tail buyer phrases (where to buy, best X for Y, affordable X)
- Include brand comparison terms and review searches
- Include problem/solution phrasing
- volume/competition reflect Google search landscape`;

    case "ebay":
      return `You are an eBay SEO and selling expert. Given a seed keyword, return 15 keyword phrases that eBay buyers actually search for.

Seed keyword: ${keyword}

${schema}

Additional rules:
- eBay buyers search for specific brands, models, and conditions
- Include condition qualifiers (new, used, vintage, refurbished, lot, bundle)
- Include compatibility terms (fits, compatible with, replacement, OEM)
- Include spec/size variations buyers search by
- volume/competition reflect eBay search landscape`;
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

  const usageData = await getUsageData(user.id);
  if (usageData.effectivePlan === "free") {
    return NextResponse.json(
      {
        error: "Keyword research is available on paid plans.",
        code: "FEATURE_GATED",
      },
      { status: 402 }
    );
  }
  const used = usageData.keywords;
  const limit = usageData.limit;
  if (limit !== null && used >= limit) {
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

  const { platform, keyword } = parsed.data;
  const prompt = buildPrompt(platform, keyword);

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    let result: {
      keywords: {
        keyword: string;
        volume: string;
        competition: string;
        trend: string;
      }[];
    };
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

    return NextResponse.json({
      keywords: result.keywords,
      platform,
      used: used + 1,
      limit,
    });
  } catch (err) {
    console.error("Keywords API error:", err);
    return NextResponse.json(
      { error: "Failed to generate keywords" },
      { status: 500 }
    );
  }
}
