import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getReferralStats } from "@/lib/referral";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const stats = await getReferralStats(user.id);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  return NextResponse.json({
    code: stats.code,
    link: `${appUrl}/signup?ref=${stats.code}`,
    total: stats.total,
    rewarded: stats.rewarded,
  });
}
