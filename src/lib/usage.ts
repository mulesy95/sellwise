import { createAdminClient } from "@/lib/supabase/admin";

export type UsageType = "optimisations" | "keywords" | "competitor" | "audits";

export const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  starter: 50,
  growth: Infinity,
  studio: Infinity,
};

// Daily cap on optimisations for unlimited plans — prevents bot abuse eating margin.
// Growth: 100/day max = ~$21.70 API cost ceiling/month. Studio: 250/day = ~$54/month.
// Free/Starter already constrained by monthly limits so no daily cap needed.
export const DAILY_OPTIMISATION_LIMITS: Record<string, number> = {
  free: Infinity,
  starter: Infinity,
  growth: 100,
  studio: 250,
};

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function isInTrial(trialEndsAt: string | null): boolean {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt) > new Date();
}

/** Returns the user's plan, current month usage, and limit. */
export async function getUsageData(userId: string) {
  const supabase = createAdminClient();
  const month = currentMonth();

  const [{ data: profile }, { data: usage }] = await Promise.all([
    supabase
      .from("profiles")
      .select("plan, trial_ends_at, referral_bonus_ends_at")
      .eq("id", userId)
      .single(),
    supabase
      .from("usage")
      .select("optimisations, keywords, competitor, audits, daily_optimisations, daily_reset_date")
      .eq("user_id", userId)
      .eq("month", month)
      .single(),
  ]);

  const storedPlan = profile?.plan ?? "free";
  const trialEndsAt = profile?.trial_ends_at ?? null;
  const referralBonusEndsAt = profile?.referral_bonus_ends_at ?? null;
  const inTrial = storedPlan === "free" && isInTrial(trialEndsAt);
  const hasReferralBonus = storedPlan === "free" && isInTrial(referralBonusEndsAt);
  // Trial → Growth limits; referral bonus → Starter limits
  const effectivePlan = inTrial ? "growth" : hasReferralBonus ? "starter" : storedPlan;
  const limit = PLAN_LIMITS[effectivePlan];

  const today = new Date().toISOString().slice(0, 10);
  const dailyResetDate = usage?.daily_reset_date ?? null;
  const dailyOptimisations =
    dailyResetDate === today ? (usage?.daily_optimisations ?? 0) : 0;
  const dailyLimit = DAILY_OPTIMISATION_LIMITS[effectivePlan];

  return {
    plan: storedPlan,
    effectivePlan,
    inTrial,
    trialEndsAt,
    hasReferralBonus,
    referralBonusEndsAt,
    limit: limit === Infinity ? null : limit,
    dailyLimit: dailyLimit === Infinity ? null : dailyLimit,
    dailyOptimisations,
    optimisations: usage?.optimisations ?? 0,
    keywords: usage?.keywords ?? 0,
    competitor: usage?.competitor ?? 0,
    audits: usage?.audits ?? 0,
  };
}

/** Returns true if the user is allowed to make another request of this type. */
export async function checkLimit(
  userId: string,
  type: UsageType
): Promise<{
  allowed: boolean;
  used: number;
  limit: number | null;
  dailyLimitHit: boolean;
  dailyLimit: number | null;
  dailyUsed: number;
}> {
  const data = await getUsageData(userId);
  const used = data[type];
  const monthlyOk = data.limit === null || used < data.limit;

  const dailyLimitHit =
    type === "optimisations" &&
    data.dailyLimit !== null &&
    data.dailyOptimisations >= data.dailyLimit;

  const allowed = monthlyOk && !dailyLimitHit;

  return {
    allowed,
    used,
    limit: data.limit,
    dailyLimitHit,
    dailyLimit: type === "optimisations" ? data.dailyLimit : null,
    dailyUsed: data.dailyOptimisations,
  };
}

/** Atomically increments the usage counter for the current month. */
export async function incrementUsage(
  userId: string,
  type: UsageType
): Promise<void> {
  const supabase = createAdminClient();

  // Ensure profile exists — user may have signed up before the profiles table
  // and trigger were created, leaving them in auth.users but not profiles.
  await supabase
    .from("profiles")
    .upsert({ id: userId }, { onConflict: "id", ignoreDuplicates: true });

  const { error } = await supabase.rpc("increment_usage", {
    p_user_id: userId,
    p_month: currentMonth(),
    p_type: type,
  });
  if (error) throw new Error(`increment_usage failed: ${error.message}`);
}
