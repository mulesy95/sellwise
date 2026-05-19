import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createEbayListing, refreshEbayToken } from "@/lib/ebay";
import { z } from "zod";

const schema = z.object({
  shopId: z.string(),
  title: z.string().min(1).max(80),
  description: z.string().max(10000),
  price: z.number().positive(),
  categoryId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("plan").eq("id", user.id).single();
  if (profile?.plan !== "studio") {
    return NextResponse.json({ error: "Creating eBay listings requires Studio plan.", code: "FEATURE_GATED" }, { status: 402 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { shopId, title, description, price, categoryId } = parsed.data;

  const { data: shop } = await admin
    .from("shops")
    .select("id, access_token, refresh_token")
    .eq("id", shopId)
    .eq("user_id", user.id)
    .eq("platform", "ebay")
    .single();

  if (!shop) return NextResponse.json({ error: "eBay account not found" }, { status: 404 });

  let token = shop.access_token;

  async function tryCreate(t: string) {
    return createEbayListing(t, { title, description, price, categoryId });
  }

  try {
    const { itemId } = await tryCreate(token);
    return NextResponse.json({ itemId, listingUrl: `https://www.ebay.com/itm/${itemId}` });
  } catch {
    if (!shop.refresh_token) {
      return NextResponse.json({ error: "Failed to create eBay listing" }, { status: 500 });
    }
    try {
      const refreshed = await refreshEbayToken(shop.refresh_token);
      token = refreshed.access_token;
      await admin.from("shops").update({
        access_token: refreshed.access_token,
        refresh_token: refreshed.refresh_token,
      }).eq("id", shop.id);
      const { itemId } = await tryCreate(token);
      return NextResponse.json({ itemId, listingUrl: `https://www.ebay.com/itm/${itemId}` });
    } catch (e) {
      console.error("[ebay create]", e);
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Failed to create eBay listing" },
        { status: 500 }
      );
    }
  }
}
