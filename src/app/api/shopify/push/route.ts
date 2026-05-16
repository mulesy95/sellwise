import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushShopifyProduct } from "@/lib/shopify";
import { z } from "zod";

const schema = z.object({
  productId: z.string(),
  shopId: z.string().optional(),
  title: z.string().optional(),
  body_html: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("plan").eq("id", user.id).single();
  if (profile?.plan !== "studio") {
    return NextResponse.json({ error: "Push-back requires Studio plan.", code: "FEATURE_GATED" }, { status: 402 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const query = admin
    .from("shops")
    .select("shop_url, access_token")
    .eq("user_id", user.id)
    .eq("platform", "shopify");

  if (parsed.data.shopId) query.eq("id", parsed.data.shopId);

  const { data: shop } = await query.single();
  if (!shop) return NextResponse.json({ error: "No Shopify shop connected" }, { status: 404 });

  try {
    await pushShopifyProduct(shop.shop_url, shop.access_token, parsed.data.productId, {
      title: parsed.data.title,
      body_html: parsed.data.body_html,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[shopify push]", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}
