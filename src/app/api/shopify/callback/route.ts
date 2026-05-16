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

  let access_token: string;
  try {
    const result = await exchangeShopifyCode(callbackShop, code);
    access_token = result.access_token;
  } catch (err) {
    console.error("[shopify] token exchange failed:", err instanceof Error ? err.message : JSON.stringify(err));
    return NextResponse.redirect(new URL("/dashboard/shop?error=token_exchange_failed", req.url));
  }

  let shopInfo: { id: string; name: string; myshopify_domain: string };
  try {
    shopInfo = await getShopInfo(callbackShop, access_token);
  } catch (err) {
    console.error("[shopify] getShopInfo failed:", err instanceof Error ? err.message : JSON.stringify(err));
    return NextResponse.redirect(new URL("/dashboard/shop?error=shop_info_failed", req.url));
  }

  try {
    const admin = createAdminClient();

    const { data: profile } = await admin.from("profiles").select("plan").eq("id", user.id).single();
    const plan = profile?.plan ?? "free";

    if (plan !== "studio") {
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

    if (upsertError) {
      console.error("[shopify] upsert failed:", upsertError.code, upsertError.message, upsertError.details);
      return NextResponse.redirect(new URL(`/dashboard/shop?error=db_${upsertError.code}`, req.url));
    }
  } catch (err) {
    console.error("[shopify] db error:", err instanceof Error ? err.message : JSON.stringify(err));
    return NextResponse.redirect(new URL("/dashboard/shop?error=db_failed", req.url));
  }

  const response = NextResponse.redirect(new URL("/dashboard/shop?connected=true", req.url));
  response.cookies.delete("shopify_oauth_state");
  response.cookies.delete("shopify_oauth_shop");
  return response;
}
