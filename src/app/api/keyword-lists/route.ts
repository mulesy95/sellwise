import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const saveSchema = z.object({
  name: z.string().min(1).max(100),
  platform: z.enum(["etsy", "amazon", "shopify", "ebay", "woocommerce", "wix", "squarespace", "tiktok", "social"]),
  keywords: z.array(z.object({
    keyword: z.string(),
    volume: z.enum(["high", "medium", "low"]),
    competition: z.enum(["high", "medium", "low"]),
    trend: z.enum(["up", "stable", "down"]),
  })).min(1),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = await req.json();
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  // Auto-archive any existing active list with the same name + platform
  await supabase
    .from("keyword_lists")
    .update({ is_archived: true })
    .eq("user_id", user.id)
    .eq("name", parsed.data.name)
    .eq("platform", parsed.data.platform)
    .eq("is_archived", false);

  const { data, error } = await supabase
    .from("keyword_lists")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      platform: parsed.data.platform,
      keywords: parsed.data.keywords,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const platform = req.nextUrl.searchParams.get("platform");
  const includeArchived = req.nextUrl.searchParams.get("archived") === "true";

  let query = supabase
    .from("keyword_lists")
    .select("id, name, keywords, platform, is_archived")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (platform) query = query.eq("platform", platform);
  if (!includeArchived) query = query.eq("is_archived", false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Return keyword strings for backwards compatibility, plus volumeData for power level computation
  const lists = (data ?? []).map((list) => {
    const fullKeywords = list.keywords as { keyword: string; volume: string }[];
    return {
      id: list.id,
      name: list.name,
      platform: list.platform,
      is_archived: list.is_archived as boolean,
      keywords: fullKeywords.map((k) => k.keyword),
      volumeData: fullKeywords.map((k) => ({ volume: k.volume })),
    };
  });

  return NextResponse.json({ lists });
}
