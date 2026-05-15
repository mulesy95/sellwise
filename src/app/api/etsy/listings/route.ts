import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEtsyListings, refreshEtsyToken } from "@/lib/etsy";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const offset = parseInt(req.nextUrl.searchParams.get("offset") ?? "0");

  const admin = createAdminClient();
  const { data: shop } = await admin
    .from("shops")
    .select("shop_id, access_token, refresh_token, expires_at")
    .eq("user_id", user.id)
    .eq("platform", "etsy")
    .single();

  if (!shop) {
    return NextResponse.json({ error: "No Etsy shop connected" }, { status: 404 });
  }

  // Refresh token if expired or expiring within 5 minutes
  let accessToken = shop.access_token;
  if (shop.expires_at) {
    const expiresAt = new Date(shop.expires_at);
    const soonExpires = new Date(Date.now() + 5 * 60 * 1000);
    if (expiresAt <= soonExpires && shop.refresh_token) {
      try {
        const refreshed = await refreshEtsyToken(shop.refresh_token);
        accessToken = refreshed.access_token;
        const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
        await admin
          .from("shops")
          .update({
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token,
            expires_at: newExpiry,
          })
          .eq("user_id", user.id)
          .eq("platform", "etsy");
      } catch (err) {
        console.error("[etsy listings] token refresh failed", err);
      }
    }
  }

  try {
    const data = await getEtsyListings(parseInt(shop.shop_id), accessToken, offset);
    return NextResponse.json({ listings: data.results ?? [], count: data.count ?? 0 });
  } catch (err) {
    console.error("[etsy listings]", err);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}
