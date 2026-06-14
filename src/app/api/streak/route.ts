import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function computeBadges(totalOptimisations: number, existing: string[]): string[] {
  const earned = [...existing];
  const milestones = [
    { count: 10, badge: "veteran" },
    { count: 50, badge: "pro_seller" },
    { count: 100, badge: "power_user" },
    { count: 250, badge: "elite_seller" },
  ];
  for (const { count, badge } of milestones) {
    if (totalOptimisations >= count && !earned.includes(badge)) {
      earned.push(badge);
    }
  }
  return earned;
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  // Fetch profile and total optimisation count in parallel
  const [profileResult, countResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("badges, optimisation_streak, streak_last_date, weekly_goal")
      .eq("id", user.id)
      .single(),
    supabase
      .from("optimisations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const profile = profileResult.data;
  if (!profile) return NextResponse.json({ ok: true });

  const thisWeek = getMondayOfWeek(new Date());
  const total = countResult.count ?? 0;

  // Count optimisations this week
  const weekStart = new Date(thisWeek);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { count: weekCount } = await supabase
    .from("optimisations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", weekStart.toISOString())
    .lt("created_at", weekEnd.toISOString());

  const metGoalThisWeek = (weekCount ?? 0) >= profile.weekly_goal;

  let newStreak = profile.optimisation_streak;
  let newLastDate = profile.streak_last_date;

  if (profile.streak_last_date !== thisWeek) {
    if (metGoalThisWeek) {
      const prevWeek = new Date(thisWeek);
      prevWeek.setDate(prevWeek.getDate() - 7);
      const prevWeekStr = prevWeek.toISOString().slice(0, 10);
      const wasConsecutive = profile.streak_last_date === prevWeekStr;
      newStreak = wasConsecutive ? newStreak + 1 : 1;
      newLastDate = thisWeek;
    }
  }

  const existingBadges = Array.isArray(profile.badges) ? (profile.badges as string[]) : [];
  const newBadges = computeBadges(total, existingBadges);

  // Use admin client for profile update to bypass RLS
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      optimisation_streak: newStreak,
      streak_last_date: newLastDate,
      badges: newBadges,
    })
    .eq("id", user.id);

  const newBadgesEarned = newBadges.filter((b) => !existingBadges.includes(b));

  return NextResponse.json({
    streak: newStreak,
    badges: newBadges,
    newBadges: newBadgesEarned,
    weekCount: weekCount ?? 0,
    weeklyGoal: profile.weekly_goal,
    metGoal: metGoalThisWeek,
  });
}
