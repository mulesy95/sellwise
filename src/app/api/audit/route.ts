import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkLimit, incrementUsage } from "@/lib/usage";

const client = new Anthropic();

const requestSchema = z
  .object({
    title: z.string().max(200).optional().default(""),
    tags: z.string().max(500).optional().default(""),
    description: z.string().max(5000).optional().default(""),
  })
  .refine((d) => d.title || d.tags || d.description, {
    message: "Provide at least one of title, tags, or description",
  });

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { allowed, used, limit } = await checkLimit(user.id, "audits");
  if (!allowed) {
    return NextResponse.json(
      {
        error: `You've used all ${limit} audits for this month. Upgrade your plan to continue.`,
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

  const { title, tags, description } = parsed.data;

  const prompt = `You are an expert Etsy SEO consultant. Audit this Etsy listing and provide a score.

LISTING:
${title ? `Title: ${title}` : "Title: (not provided)"}
${tags ? `Tags: ${tags}` : "Tags: (not provided)"}
${description ? `Description: ${description}` : "Description: (not provided)"}

Score the listing out of 100:
- titleScore (0–40): keyword placement, starts with primary keyword, 100–140 chars, reads naturally, no ALL CAPS
- tagsScore (0–35): count (ideally 13), each max 20 chars, mix of short and long-tail, no repeated words across tags
- descriptionScore (0–25): first 160 chars contain primary keyword, 150–250 words, conversational tone, includes use cases

If a section is not provided, score it 0 and note it as missing in improvements.

Return ONLY a valid JSON object:
{
  "score": number,
  "titleScore": number,
  "tagsScore": number,
  "descriptionScore": number,
  "improvements": ["3 to 5 specific, actionable fixes — be concrete, e.g. 'Move primary keyword to the start of your title' not just 'Improve title'"]
}

Return only the JSON object, no markdown.`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    let result: {
      score: number;
      titleScore: number;
      tagsScore: number;
      descriptionScore: number;
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
      await incrementUsage(user.id, "audits");
    } catch (err) {
      console.error("Failed to increment usage:", err);
    }

    return NextResponse.json({ ...result, used: used + 1, limit });
  } catch (err) {
    console.error("Audit API error:", err);
    return NextResponse.json(
      { error: "Failed to run audit" },
      { status: 500 }
    );
  }
}
