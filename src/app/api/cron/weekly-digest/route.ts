import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { weeklyDigestEmail } from "@/lib/emails/weekly-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const thisMonday = getMondayOfWeek(now);
  const lastWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const results = { sent: 0, skipped: 0, errors: 0 };

  // Fetch paid users who haven't received this week's digest and haven't opted out
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, plan, weekly_digest_sent_week")
    .neq("plan", "free")
    .eq("marketing_opted_out", false)
    .or(`weekly_digest_sent_week.is.null,weekly_digest_sent_week.lt.${thisMonday}`);

  for (const profile of profiles ?? []) {
    try {
      const { count: optimisationCount } = await admin
        .from("optimisations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .gte("created_at", lastWeekStart);

      if (!optimisationCount || optimisationCount === 0) {
        results.skipped++;
        continue;
      }

      const { data: topScoreRow } = await admin
        .from("optimisations")
        .select("score")
        .eq("user_id", profile.id)
        .gte("created_at", lastWeekStart)
        .not("score", "is", null)
        .order("score", { ascending: false })
        .limit(1)
        .single();

      const topScore = (topScoreRow?.score as number | null) ?? 0;

      const {
        data: { user },
      } = await admin.auth.admin.getUserById(profile.id);
      if (!user?.email) continue;

      const firstName = (profile.full_name as string | null)?.split(" ")[0] ?? null;
      const { subject, html } = weeklyDigestEmail(firstName, {
        optimisationCount,
        topScore,
      });

      await sendEmail({
        to: user.email,
        subject,
        html: html.replace("{{email}}", encodeURIComponent(user.email)),
      });

      await admin
        .from("profiles")
        .update({ weekly_digest_sent_week: thisMonday })
        .eq("id", profile.id);

      results.sent++;
    } catch {
      results.errors++;
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
