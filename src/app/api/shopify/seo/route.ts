import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushShopifyMetafields } from "@/lib/shopify";
import { z } from "zod";

const schema = z.object({
  productId: z.string(),
  shopId: z.string().optional(),
  metaTitle: z.string().max(60),
  metaDescription: z.string().max(160),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("plan").eq("id", user.id).single();
  if (profile?.plan !== "studio") {
    return NextResponse.json({ error: "SEO push requires Studio plan.", code: "FEATURE_GATED" }, { status: 402 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { productId, shopId, metaTitle, metaDescription } = parsed.data;

  const query = admin
    .from("shops")
    .select("id, shop_url, access_token")
    .eq("user_id", user.id)
    .eq("platform", "shopify");
  if (shopId) query.eq("id", shopId);

  const { data: shop } = await query.single();
  if (!shop) return NextResponse.json({ error: "No Shopify store connected" }, { status: 404 });

  try {
    await pushShopifyMetafields(shop.shop_url, shop.access_token, productId, metaTitle, metaDescription);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[shopify seo]", e);
    return NextResponse.json({ error: "Failed to update SEO fields" }, { status: 500 });
  }
}
