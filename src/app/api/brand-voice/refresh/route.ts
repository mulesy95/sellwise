import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const client = new Anthropic();

const MIN_APPROVED = 5;
const MAX_SAMPLES = 10;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Fetch the most recent thumbs-up optimisations
  const { data: approved } = await supabase
    .from("optimisations")
    .select("output, platform")
    .eq("user_id", user.id)
    .eq("feedback", "up")
    .order("created_at", { ascending: false })
    .limit(MAX_SAMPLES);

  if (!approved || approved.length < MIN_APPROVED) {
    return NextResponse.json({ ok: false, reason: "not_enough_data", count: approved?.length ?? 0 });
  }

  // Extract title + description from each approved output
  const samples = approved
    .map((row) => {
      const out = row.output as Record<string, unknown>;
      const title = (out.title ?? out.metaTitle ?? out.productTitle ?? "") as string;
      const description = (out.description ?? out.postCopy ?? "") as string;
      const platform = row.platform as string;
      return `Platform: ${platform}\nTitle: ${title.slice(0, 200)}\nDescription: ${description.slice(0, 400)}`;
    })
    .join("\n\n---\n\n");

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: `You analyse approved product listing copy to identify a seller's brand voice. Based on the examples provided, write a 2–3 sentence brand voice description that captures:
- Tone (e.g. warm/direct/playful/formal)
- Sentence rhythm (short punchy lines vs flowing descriptions)
- What they emphasise (specs/emotions/audience/occasion)
- Any consistent vocabulary patterns

Write only the voice description. No preamble, no "This seller uses..." opener. Write it as a brief for a copywriter: "Short, direct sentences. Led by emotional occasion rather than product specs. Casual and warm — reads like a message from a friend, not a brand."`,
    messages: [
      {
        role: "user",
        content: `Here are ${approved.length} listings this seller approved:\n\n${samples}`,
      },
    ],
  });

  const derivedVoice =
    message.content[0].type === "text" ? message.content[0].text.trim() : null;

  if (!derivedVoice) {
    return NextResponse.json({ ok: false, reason: "ai_parse_failed" }, { status: 500 });
  }

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ brand_voice_auto: derivedVoice })
    .eq("id", user.id);

  return NextResponse.json({ ok: true, voice: derivedVoice });
}
