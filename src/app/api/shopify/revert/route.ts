import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushShopifyProduct, pushShopifyMetafields } from "@/lib/shopify";
import { z } from "zod";

const schema = z.object({ optimisationId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("plan").eq("id", user.id).single();
  if (profile?.plan !== "studio") {
    return NextResponse.json({ error: "Revert requires Studio plan.", code: "FEATURE_GATED" }, { status: 402 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { data: opt } = await admin
    .from("optimisations")
    .select("product_id, shop_id, previous_content, platform")
    .eq("id", parsed.data.optimisationId)
    .eq("user_id", user.id)
    .single();

  if (!opt) return NextResponse.json({ error: "Optimisation not found" }, { status: 404 });
  if (opt.platform !== "shopify") return NextResponse.json({ error: "Not a Shopify optimisation" }, { status: 400 });
  if (!opt.previous_content) return NextResponse.json({ error: "No snapshot available to revert to" }, { status: 400 });

  const { data: shop } = await admin
    .from("shops")
    .select("shop_url, access_token")
    .eq("id", opt.shop_id)
    .eq("user_id", user.id)
    .single();

  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const prev = opt.previous_content as { title: string; body_html: string; metaTitle?: string; metaDescription?: string };

  try {
    await pushShopifyProduct(shop.shop_url, shop.access_token, opt.product_id, {
      title: prev.title,
      body_html: prev.body_html,
    });

    if (prev.metaTitle || prev.metaDescription) {
      await pushShopifyMetafields(
        shop.shop_url, shop.access_token, opt.product_id,
        prev.metaTitle ?? "", prev.metaDescription ?? ""
      ).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[shopify revert]", err);
    return NextResponse.json({ error: "Failed to revert listing" }, { status: 500 });
  }
}
