import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { exchangeShopifyCode, getShopInfo, normaliseShopDomain } from "@/lib/shopify";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const shop = searchParams.get("shop");

  const storedState = req.cookies.get("shopify_oauth_state")?.value;
  const storedShop = req.cookies.get("shopify_oauth_shop")?.value;

  if (!code || !state || !shop) {
    return NextResponse.redirect(new URL("/dashboard/shop?error=missing_params", req.url));
  }
  if (!storedState || state !== storedState) {
    return NextResponse.redirect(new URL("/dashboard/shop?error=state_mismatch", req.url));
  }

  const callbackShop = normaliseShopDomain(shop);
  if (storedShop && callbackShop !== storedShop) {
    return NextResponse.redirect(new URL("/dashboard/shop?error=shop_mismatch", req.url));
  }

  try {
    console.log("[shopify] 1 exchanging code for shop:", callbackShop);
    const { access_token } = await exchangeShopifyCode(callbackShop, code);
    console.log("[shopify] 2 token received, length:", access_token?.length ?? 0);

    const shopInfo = await getShopInfo(callbackShop, access_token);
    console.log("[shopify] 3 shop info:", shopInfo.id, shopInfo.name);

    const admin = createAdminClient();

    const { data: profile } = await admin.from("profiles").select("plan").eq("id", user.id).single();
    const plan = profile?.plan ?? "free";
    console.log("[shopify] 4 plan:", plan);

    if (plan !== "studio") {
      await admin.from("shops").delete().eq("user_id", user.id).eq("platform", "shopify");
      console.log("[shopify] 5 deleted existing shops");
    }

    const payload = {
      user_id: user.id,
      platform: "shopify",
      shop_name: shopInfo.name,
      shop_url: callbackShop,
      shop_id: String(shopInfo.id),
      access_token,
      is_primary: true,
    };
    console.log("[shopify] 6 upserting shop_id:", payload.shop_id, "name:", payload.shop_name);

    const { error: upsertError } = await admin.from("shops").upsert(payload, { onConflict: "user_id,platform,shop_id" });

    if (upsertError) {
      console.error("[shopify] 7 upsert error code:", upsertError.code, "msg:", upsertError.message, "detail:", upsertError.details);
      throw upsertError;
    }
    console.log("[shopify] 7 upsert ok");

  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err);
    console.error("[shopify callback] error:", msg);
    return NextResponse.redirect(new URL("/dashboard/shop?error=connection_failed", req.url));
  }

  const response = NextResponse.redirect(new URL("/dashboard/shop?connected=true", req.url));
  response.cookies.delete("shopify_oauth_state");
  response.cookies.delete("shopify_oauth_shop");
  return response;
}
