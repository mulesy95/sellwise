import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEbayAuthUrl } from "@/lib/ebay";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("plan").eq("id", user.id).single();
  if (profile?.plan !== "growth" && profile?.plan !== "studio") {
    return NextResponse.redirect(new URL("/dashboard/shop?error=upgrade_required", req.url));
  }

  const isSandbox = req.nextUrl.searchParams.get("sandbox") === "true";
  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(getEbayAuthUrl(state, isSandbox));
  res.cookies.set("ebay_oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 300 });
  res.cookies.set("ebay_oauth_sandbox", isSandbox ? "1" : "0", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 300 });
  return res;
}
