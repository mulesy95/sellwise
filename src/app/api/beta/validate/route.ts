import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const { code } = await req.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("beta_codes")
    .select("code, used_count, max_uses")
    .eq("code", code.toUpperCase().trim())
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  if (data.used_count >= data.max_uses) {
    return NextResponse.json({ error: "This invite code has reached its limit" }, { status: 403 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set("beta_access", data.code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90, // 90 days
    path: "/",
  });

  return res;
}
