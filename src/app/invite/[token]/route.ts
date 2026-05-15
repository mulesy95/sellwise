import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("beta_codes")
    .select("code")
    .eq("token", token)
    .single();

  if (error || !data) {
    return NextResponse.redirect(new URL("/invite?error=invalid", req.url));
  }

  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.set("beta_access", data.code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90,
    path: "/",
  });

  return res;
}
