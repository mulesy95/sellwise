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
    const { access_token } = await exchangeShopifyCode(callbackShop, code);
    const shopInfo = await getShopInfo(callbackShop, access_token);

    const admin = createAdminClient();

    // Check Studio plan for multi-shop limit
    const { data: profile } = await admin.from("profiles").select("plan").eq("id", user.id).single();
    const plan = profile?.plan ?? "free";

    if (plan !== "studio") {
      // Growth: only 1 shop allowed — remove existing Shopify shops first
      await admin.from("shops").delete().eq("user_id", user.id).eq("platform", "shopify");
    }

    const { error: upsertError } = await admin.from("shops").upsert({
      user_id: user.id,
      platform: "shopify",
      shop_name: shopInfo.name,
      shop_url: callbackShop,
      shop_id: String(shopInfo.id),
      access_token,
      is_primary: true,
    }, { onConflict: "user_id,platform,shop_id" });

    if (upsertError) throw upsertError;

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
