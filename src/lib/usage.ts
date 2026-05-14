import { createAdminClient } from "@/lib/supabase/admin";

export type UsageType = "optimisations" | "keywords" | "competitor" | "audits";

export const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  starter: 50,
  growth: Infinity,
  studio: Infinity,
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
      .select("plan, trial_ends_at")
      .eq("id", userId)
      .single(),
    supabase
      .from("usage")
      .select("optimisations, keywords, competitor, audits")
      .eq("user_id", userId)
      .eq("month", month)
      .single(),
  ]);

  const storedPlan = profile?.plan ?? "free";
  const trialEndsAt = profile?.trial_ends_at ?? null;
  const inTrial = storedPlan === "free" && isInTrial(trialEndsAt);
  // While in trial, grant Growth-tier limits
  const effectivePlan = inTrial ? "growth" : storedPlan;
  const limit = PLAN_LIMITS[effectivePlan];

  return {
    plan: storedPlan,
    effectivePlan,
    inTrial,
    trialEndsAt,
    limit: limit === Infinity ? null : limit,
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
): Promise<{ allowed: boolean; used: number; limit: number | null }> {
  const data = await getUsageData(userId);
  const used = data[type];
  const allowed = data.limit === null || used < data.limit;
  return { allowed, used, limit: data.limit };
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
