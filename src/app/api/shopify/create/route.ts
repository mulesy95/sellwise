import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createShopifyProduct, pushShopifyMetafields } from "@/lib/shopify";
import { z } from "zod";

const schema = z.object({
  shopId: z.string(),
  title: z.string().min(1).max(255),
  body_html: z.string().max(10000).optional().default(""),
  metaTitle: z.string().max(60).optional().default(""),
  metaDescription: z.string().max(160).optional().default(""),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("plan").eq("id", user.id).single();
  if (profile?.plan !== "studio") {
    return NextResponse.json({ error: "Creating products on connected stores requires Studio plan.", code: "FEATURE_GATED" }, { status: 402 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { shopId, title, body_html, metaTitle, metaDescription } = parsed.data;

  const { data: shop } = await admin
    .from("shops")
    .select("shop_url, access_token")
    .eq("id", shopId)
    .eq("user_id", user.id)
    .eq("platform", "shopify")
    .single();

  if (!shop) return NextResponse.json({ error: "Shopify store not found" }, { status: 404 });

  try {
    const { id: productId, legacyId } = await createShopifyProduct(
      shop.shop_url,
      shop.access_token,
      { title, body_html }
    );

    if (metaTitle || metaDescription) {
      try {
        await pushShopifyMetafields(shop.shop_url, shop.access_token, productId, metaTitle, metaDescription);
      } catch {
        // SEO fields are best-effort — don't fail the whole request
      }
    }

    const adminUrl = `https://${shop.shop_url}/admin/products/${legacyId}`;
    return NextResponse.json({ productId, legacyId, adminUrl });
  } catch (err) {
    console.error("Shopify create error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create product" },
      { status: 500 }
    );
  }
}
