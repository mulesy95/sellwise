import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { trialNudgeEmail } from "@/lib/emails/trial-nudge";
import { trialExpiredEmail } from "@/lib/emails/trial-expired";
import { winbackEmail } from "@/lib/emails/winback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const results = { nudgeSent: 0, expiredSent: 0, errors: 0 };

  // --- Trial nudge: trial ends in 24–48 hours, nudge not yet sent ---
  const nudgeWindowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const nudgeWindowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

  const { data: nudgeProfiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("trial_nudge_sent", false)
    .eq("marketing_opted_out", false)
    .gte("trial_ends_at", nudgeWindowStart)
    .lte("trial_ends_at", nudgeWindowEnd);

  for (const profile of nudgeProfiles ?? []) {
    try {
      const { data: { user } } = await admin.auth.admin.getUserById(profile.id);
      if (!user?.email) continue;

      const firstName = (profile.full_name as string | null)?.split(" ")[0] ?? null;
      const { subject, html } = trialNudgeEmail(firstName, user.email);
      await sendEmail({ to: user.email, subject, html });
      await admin.from("profiles").update({ trial_nudge_sent: true }).eq("id", profile.id);
      results.nudgeSent++;
    } catch {
      results.errors++;
    }
  }

  // --- Trial expired: trial ended in the last 24 hours, expiry email not yet sent ---
  const expiredWindowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const { data: expiredProfiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("trial_expired_sent", false)
    .eq("marketing_opted_out", false)
    .eq("plan", "free")
    .lte("trial_ends_at", now.toISOString())
    .gte("trial_ends_at", expiredWindowStart);

  for (const profile of expiredProfiles ?? []) {
    try {
      const { data: { user } } = await admin.auth.admin.getUserById(profile.id);
      if (!user?.email) continue;

      const firstName = (profile.full_name as string | null)?.split(" ")[0] ?? null;
      const { subject, html } = trialExpiredEmail(firstName, user.email);
      await sendEmail({ to: user.email, subject, html });
      await admin.from("profiles").update({ trial_expired_sent: true }).eq("id", profile.id);
      results.expiredSent++;
    } catch {
      results.errors++;
    }
  }

  // --- Win-back: cancelled 7 days ago, winback not yet sent ---
  const winbackWindowStart = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();
  const winbackWindowEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: winbackProfiles } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("winback_sent", false)
    .eq("marketing_opted_out", false)
    .eq("plan", "free")
    .gte("cancelled_at", winbackWindowStart)
    .lte("cancelled_at", winbackWindowEnd);

  for (const profile of winbackProfiles ?? []) {
    try {
      const { data: { user } } = await admin.auth.admin.getUserById(profile.id);
      if (!user?.email) continue;

      const firstName = (profile.full_name as string | null)?.split(" ")[0] ?? null;
      const { subject, html } = winbackEmail(firstName, user.email);
      await sendEmail({ to: user.email, subject, html });
      await admin.from("profiles").update({ winback_sent: true }).eq("id", profile.id);
      (results as Record<string, number>).winbackSent = ((results as Record<string, number>).winbackSent ?? 0) + 1;
    } catch {
      results.errors++;
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
