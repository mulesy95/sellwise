import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSuggestedEbayCategories } from "@/lib/ebay";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const title = req.nextUrl.searchParams.get("title")?.trim();
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

  try {
    const categories = await getSuggestedEbayCategories(title);
    return NextResponse.json({ categories });
  } catch (e) {
    console.error("[ebay suggest-category]", e);
    return NextResponse.json({ categories: [] });
  }
}
