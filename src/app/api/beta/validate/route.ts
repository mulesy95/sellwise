import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, ipFromRequest } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = ipFromRequest(req);
  const { allowed, retryAfterMs } = checkRateLimit(`beta:${ip}`, 5, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
      }
    );
  }

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

  const res = NextResponse.json({ success: true });
  res.cookies.set("beta_access", data.code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 90,
    path: "/",
  });

  return res;
}
