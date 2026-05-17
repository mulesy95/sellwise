import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const productId = req.nextUrl.searchParams.get("productId");
  const shopId = req.nextUrl.searchParams.get("shopId");
  if (!productId || !shopId) return NextResponse.json({ error: "productId and shopId required" }, { status: 400 });

  const { data, error } = await supabase
    .from("optimisations")
    .select("id, created_at, output, previous_content, platform")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ history: data ?? [] });
}
