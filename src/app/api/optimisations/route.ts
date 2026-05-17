import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const page = Math.max(0, Number(req.nextUrl.searchParams.get("page") ?? "0"));
  const platform = req.nextUrl.searchParams.get("platform");

  let query = supabase
    .from("optimisations")
    .select("id, platform, input, output, score, created_at", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

  if (platform) query = query.eq("platform", platform);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    optimisations: data ?? [],
    total: count ?? 0,
    hasMore: (page + 1) * PAGE_SIZE < (count ?? 0),
    page,
  });
}
