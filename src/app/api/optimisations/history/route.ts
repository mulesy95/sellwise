import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const shopId = req.nextUrl.searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ error: "shopId required" }, { status: 400 });

  // Latest optimisation per product for this shop
  const { data, error } = await supabase
    .from("optimisations")
    .select("product_id, created_at")
    .eq("user_id", user.id)
    .eq("shop_id", shopId)
    .not("product_id", "is", null)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Deduplicate — keep only the latest per product
  const seen = new Set<string>();
  const history: { productId: string; optimisedAt: string }[] = [];
  for (const row of data ?? []) {
    if (row.product_id && !seen.has(row.product_id)) {
      seen.add(row.product_id);
      history.push({ productId: row.product_id, optimisedAt: row.created_at });
    }
  }

  return NextResponse.json({ history });
}
