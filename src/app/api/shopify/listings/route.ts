import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getShopifyProducts } from "@/lib/shopify";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
  const shopId = req.nextUrl.searchParams.get("shopId") ?? undefined;

  const admin = createAdminClient();
  const query = admin
    .from("shops")
    .select("shop_url, access_token")
    .eq("user_id", user.id)
    .eq("platform", "shopify");

  if (shopId) query.eq("id", shopId);

  const { data: shop } = await query.single();

  if (!shop) return NextResponse.json({ error: "No Shopify shop connected" }, { status: 404 });

  try {
    const { products, nextCursor } = await getShopifyProducts(
      shop.shop_url,
      shop.access_token,
      50,
      cursor
    );
    return NextResponse.json({ products, nextCursor });
  } catch (err) {
    console.error("[shopify listings]", err);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}
