import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEbayListings, refreshEbayToken } from "@/lib/ebay";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const shopId = req.nextUrl.searchParams.get("shopId") ?? undefined;
  const admin = createAdminClient();

  const query = admin
    .from("shops")
    .select("id, access_token, refresh_token")
    .eq("user_id", user.id)
    .eq("platform", "ebay");
  if (shopId) query.eq("id", shopId);

  const { data: shop } = await query.single();
  if (!shop) return NextResponse.json({ error: "No eBay account connected" }, { status: 404 });

  let token = shop.access_token;

  try {
    const listings = await getEbayListings(token);
    return NextResponse.json({ listings });
  } catch (err) {
    // Token may have expired — try refreshing once
    if (shop.refresh_token) {
      try {
        const refreshed = await refreshEbayToken(shop.refresh_token);
        token = refreshed.access_token;
        await admin.from("shops").update({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
        }).eq("id", shop.id);

        const listings = await getEbayListings(token);
        return NextResponse.json({ listings });
      } catch {
        // fall through to error
      }
    }
    console.error("[ebay listings]", err);
    return NextResponse.json({ error: "Failed to fetch eBay listings" }, { status: 500 });
  }
}
