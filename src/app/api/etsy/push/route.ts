import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateEtsyListing } from "@/lib/etsy";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  if (profile?.plan !== "studio") {
    return NextResponse.json({ error: "Studio plan required" }, { status: 403 });
  }

  const { listingId, title, description, tags } = await req.json();
  if (!listingId) {
    return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
  }

  const { data: shop } = await admin
    .from("shops")
    .select("access_token")
    .eq("user_id", user.id)
    .eq("platform", "etsy")
    .single();

  if (!shop) {
    return NextResponse.json({ error: "No Etsy shop connected" }, { status: 404 });
  }

  try {
    await updateEtsyListing(listingId, shop.access_token, { title, description, tags });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[etsy push]", err);
    return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
  }
}
