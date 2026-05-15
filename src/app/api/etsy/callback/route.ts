import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  exchangeEtsyCode,
  getEtsyMe,
  getEtsyShopForUser,
} from "@/lib/etsy";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const storedState = req.cookies.get("etsy_oauth_state")?.value;
  const codeVerifier = req.cookies.get("etsy_code_verifier")?.value;

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/dashboard/shop?error=missing_params&platform=etsy", req.url)
    );
  }
  if (state !== storedState) {
    return NextResponse.redirect(
      new URL("/dashboard/shop?error=state_mismatch&platform=etsy", req.url)
    );
  }
  if (!codeVerifier) {
    return NextResponse.redirect(
      new URL("/dashboard/shop?error=missing_verifier&platform=etsy", req.url)
    );
  }

  try {
    const { access_token, refresh_token, expires_in } = await exchangeEtsyCode(
      code,
      codeVerifier
    );

    const me = await getEtsyMe(access_token);
    const shop = await getEtsyShopForUser(me.user_id, access_token);

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();
    const plan = profile?.plan ?? "free";

    if (plan !== "studio") {
      await admin.from("shops").delete().eq("user_id", user.id).eq("platform", "etsy");
    }

    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    const { error: upsertError } = await admin.from("shops").upsert(
      {
        user_id: user.id,
        platform: "etsy",
        shop_name: shop.shop_name,
        shop_url: shop.url,
        shop_id: String(shop.shop_id),
        access_token,
        refresh_token,
        expires_at: expiresAt,
        is_primary: true,
      },
      { onConflict: "user_id,platform,shop_id" }
    );

    if (upsertError) throw upsertError;
  } catch (err) {
    console.error("[etsy callback]", err);
    const response = NextResponse.redirect(
      new URL("/dashboard/shop?error=connection_failed&platform=etsy", req.url)
    );
    response.cookies.delete("etsy_oauth_state");
    response.cookies.delete("etsy_code_verifier");
    return response;
  }

  const response = NextResponse.redirect(
    new URL("/dashboard/shop?connected=true&platform=etsy", req.url)
  );
  response.cookies.delete("etsy_oauth_state");
  response.cookies.delete("etsy_code_verifier");
  return response;
}
