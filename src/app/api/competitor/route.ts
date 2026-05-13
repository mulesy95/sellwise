import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import * as cheerio from "cheerio";
import { createClient } from "@/lib/supabase/server";
import { checkLimit, incrementUsage } from "@/lib/usage";

const client = new Anthropic();

const requestSchema = z.object({
  url: z
    .string()
    .url()
    .refine((u) => /etsy\.com\/listing\/\d+/.test(u), {
      message: "URL must be an Etsy listing (etsy.com/listing/...)",
    }),
});

interface ListingData {
  title: string;
  description: string;
  tags: string[];
}

async function extractListing(url: string): Promise<ListingData> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Extract title — page <title> is "Product name | Shop | Etsy"
  let title =
    $("h1").first().text().trim() ||
    $("title").text().replace(/\s*[|—–]\s*.*$/, "").trim();

  // Try JSON-LD for richer data
  let tags: string[] = [];
  let description = $('meta[name="description"]').attr("content") ?? "";

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() ?? "");
      if (data["@type"] === "Product" || data.name) {
        if (!title && data.name) title = data.name;
        if (!description && data.description) description = data.description;
        if (data.keywords) {
          tags = String(data.keywords)
            .split(",")
            .map((k: string) => k.trim())
            .filter(Boolean);
        }
      }
    } catch {
      // ignore malformed JSON-LD
    }
  });

  if (!title) throw new Error("Could not extract listing title from this page");

  return { title, description, tags };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { allowed, used, limit } = await checkLimit(user.id, "competitor");
  if (!allowed) {
    return NextResponse.json(
      {
        error: `You've used all ${limit} competitor analyses for this month. Upgrade your plan to continue.`,
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
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { url } = parsed.data;

  let original: ListingData;
  try {
    original = await extractListing(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        error: `Could not fetch this listing. ${msg.startsWith("HTTP") ? `Etsy returned ${msg}.` : "Etsy may be blocking automated requests."} Try copying the listing content manually.`,
        code: "FETCH_FAILED",
      },
      { status: 422 }
    );
  }

  const prompt = `You are an expert Etsy SEO consultant. Analyse this listing and create a significantly better version.

ORIGINAL LISTING:
Title: ${original.title}
${original.tags.length ? `Tags: ${original.tags.join(", ")}` : "Tags: (not available)"}
${original.description ? `Description: ${original.description}` : "Description: (not available)"}

Create an improved version that outperforms the original in Etsy search.

Return ONLY a valid JSON object:
{
  "optimised": {
    "title": "string — max 140 chars, keyword-front-loaded, reads as a natural phrase",
    "tags": ["exactly 13 strings", "each max 20 chars", "long-tail buyer search phrases"],
    "description": "string — 150-250 words, first sentence contains primary keyword, conversational, no hype words"
  },
  "improvements": ["3 to 5 specific improvements you made — be concrete"]
}

Same writing rules as before: no em dashes, no ellipses, write like a real shop owner.
Return only the JSON object, no markdown.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    let result: {
      optimised: { title: string; tags: string[]; description: string };
      improvements: string[];
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

    try {
      await incrementUsage(user.id, "competitor");
    } catch (err) {
      console.error("Failed to increment usage:", err);
    }

    return NextResponse.json({
      original,
      optimised: result.optimised,
      improvements: result.improvements,
      used: used + 1,
      limit,
    });
  } catch (err) {
    console.error("Competitor API error:", err);
    return NextResponse.json(
      { error: "Failed to analyse listing" },
      { status: 500 }
    );
  }
}
