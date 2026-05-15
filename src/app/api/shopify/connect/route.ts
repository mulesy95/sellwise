import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getShopifyAuthUrl, normaliseShopDomain } from "@/lib/shopify";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  // Gate: Growth+ only
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("plan").eq("id", user.id).single();
  const plan = profile?.plan ?? "free";
  if (plan === "free" || plan === "starter") {
    return NextResponse.redirect(new URL("/dashboard/settings?error=upgrade_required", req.url));
  }

  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop) return NextResponse.redirect(new URL("/dashboard/shop?error=missing_shop", req.url));

  const shopDomain = normaliseShopDomain(shop);
  if (!shopDomain.endsWith(".myshopify.com") && !shopDomain.includes(".")) {
    return NextResponse.redirect(new URL("/dashboard/shop?error=invalid_shop", req.url));
  }

  // Store state in cookie for CSRF protection
  const state = crypto.randomUUID();
  const authUrl = getShopifyAuthUrl(shopDomain, state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("shopify_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
  });
  response.cookies.set("shopify_oauth_shop", shopDomain, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
  });

  return response;
}
