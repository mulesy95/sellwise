import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reviseEbayItem, refreshEbayToken } from "@/lib/ebay";
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
  if (opt.platform !== "ebay") return NextResponse.json({ error: "Not an eBay optimisation" }, { status: 400 });
  if (!opt.previous_content) return NextResponse.json({ error: "No snapshot available to revert to" }, { status: 400 });

  const { data: shop } = await admin
    .from("shops")
    .select("id, access_token, refresh_token, is_sandbox")
    .eq("id", opt.shop_id)
    .eq("user_id", user.id)
    .single();

  if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

  const isSandbox = (shop as { is_sandbox?: boolean }).is_sandbox ?? false;
  const prev = opt.previous_content as { title: string; description: string };
  let token = shop.access_token;

  try {
    await reviseEbayItem(token, opt.product_id, { title: prev.title, description: prev.description }, isSandbox);
    return NextResponse.json({ ok: true });
  } catch {
    if (shop.refresh_token) {
      try {
        const refreshed = await refreshEbayToken(shop.refresh_token, isSandbox);
        token = refreshed.access_token;
        await admin.from("shops").update({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
        }).eq("id", shop.id);
        await reviseEbayItem(token, opt.product_id, { title: prev.title, description: prev.description }, isSandbox);
        return NextResponse.json({ ok: true });
      } catch (e) {
        console.error("[ebay revert]", e);
      }
    }
    return NextResponse.json({ error: "Failed to revert listing" }, { status: 500 });
  }
}
