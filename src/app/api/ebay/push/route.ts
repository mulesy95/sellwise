import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reviseEbayItem, refreshEbayToken, getEbayCurrentItem } from "@/lib/ebay";
import { z } from "zod";

const schema = z.object({
  itemId: z.string(),
  shopId: z.string().optional(),
  title: z.string().max(80).optional(),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const userId = user.id;

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("plan").eq("id", user.id).single();
  if (profile?.plan !== "studio") {
    return NextResponse.json({ error: "Push-back requires Studio plan.", code: "FEATURE_GATED" }, { status: 402 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { itemId, shopId, title, description } = parsed.data;

  const query = admin
    .from("shops")
    .select("id, access_token, refresh_token")
    .eq("user_id", user.id)
    .eq("platform", "ebay");
  if (shopId) query.eq("id", shopId);

  const { data: shop } = await query.single();
  if (!shop) return NextResponse.json({ error: "No eBay account connected" }, { status: 404 });

  let token = shop.access_token;
  const previousContent = await getEbayCurrentItem(token, itemId);

  async function tryRevise(t: string) {
    await reviseEbayItem(t, itemId, { title, description });
  }

  async function saveHistory() {
    await admin.from("optimisations").insert({
      user_id: userId,
      platform: "ebay",
      product_id: itemId,
      shop_id: shopId ?? null,
      input: {},
      output: { title, description },
      previous_content: previousContent ?? null,
    });
  }

  try {
    await tryRevise(token);
    await saveHistory();
    return NextResponse.json({ ok: true });
  } catch {
    if (shop.refresh_token) {
      try {
        const refreshed = await refreshEbayToken(shop.refresh_token);
        token = refreshed.access_token;
        await admin.from("shops").update({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
        }).eq("id", shop.id);
        await tryRevise(token);
        await saveHistory();
        return NextResponse.json({ ok: true });
      } catch (e) {
        console.error("[ebay push]", e);
      }
    }
    return NextResponse.json({ error: "Failed to update eBay listing" }, { status: 500 });
  }
}
