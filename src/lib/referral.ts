import { createAdminClient } from "@/lib/supabase/admin";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  return Array.from(
    { length: 6 },
    () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  ).join("");
}

/** Returns the user's referral code, generating one if they don't have one yet. */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .single();

  if (profile?.referral_code) return profile.referral_code;

  // Try up to 5 times in case of collision (astronomically unlikely at this scale)
  for (let i = 0; i < 5; i++) {
    const code = generateCode();
    const { error } = await admin
      .from("profiles")
      .update({ referral_code: code })
      .eq("id", userId)
      .is("referral_code", null);

    if (!error) return code;
  }

  throw new Error("Failed to generate a unique referral code");
}

/**
 * Called immediately after a new user signs up.
 * Links the referee to the referrer — reward is granted when they first optimise.
 */
export async function claimReferral(
  refereeId: string,
  code: string
): Promise<void> {
  const admin = createAdminClient();

  // Look up who owns the code
  const { data: referrer } = await admin
    .from("profiles")
    .select("id")
    .eq("referral_code", code.toUpperCase().trim())
    .single();

  if (!referrer) return; // unknown code — silently ignore
  if (referrer.id === refereeId) return; // can't refer yourself

  // Check referee hasn't already been referred
  const { data: existing } = await admin
    .from("referrals")
    .select("id")
    .eq("referee_id", refereeId)
    .maybeSingle();

  if (existing) return; // already claimed

  await admin.from("referrals").insert({
    referrer_id: referrer.id,
    referee_id: refereeId,
    status: "pending",
  });
}

/**
 * Called when a referred user runs their first optimisation.
 * Grants 7 days of Starter access to both the referee and their referrer.
 */
export async function rewardReferral(refereeId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: referral } = await admin
    .from("referrals")
    .select("id, referrer_id")
    .eq("referee_id", refereeId)
    .eq("status", "pending")
    .maybeSingle();

  if (!referral) return;

  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Grant +7 days to both parties (extend if bonus already set)
  const grantBonus = async (userId: string) => {
    const { data: p } = await admin
      .from("profiles")
      .select("referral_bonus_ends_at")
      .eq("id", userId)
      .single();

    const currentEnd = p?.referral_bonus_ends_at
      ? new Date(p.referral_bonus_ends_at)
      : new Date();

    const base = currentEnd > new Date() ? currentEnd : new Date();
    const newEnd = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await admin
      .from("profiles")
      .update({ referral_bonus_ends_at: newEnd })
      .eq("id", userId);
  };

  await Promise.all([
    grantBonus(refereeId),
    grantBonus(referral.referrer_id),
    admin
      .from("referrals")
      .update({ status: "rewarded", rewarded_at: new Date().toISOString() })
      .eq("id", referral.id),
  ]);
}

/** Returns referral stats for a user. */
export async function getReferralStats(userId: string): Promise<{
  code: string;
  total: number;
  rewarded: number;
}> {
  const admin = createAdminClient();

  const [code, { data: referrals }] = await Promise.all([
    getOrCreateReferralCode(userId),
    admin
      .from("referrals")
      .select("status")
      .eq("referrer_id", userId),
  ]);

  const total = referrals?.length ?? 0;
  const rewarded = referrals?.filter((r) => r.status === "rewarded").length ?? 0;

  return { code, total, rewarded };
}
