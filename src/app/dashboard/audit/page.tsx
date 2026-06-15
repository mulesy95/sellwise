import { createClient } from "@/lib/supabase/server";
import { getUsageData } from "@/lib/usage";
import { AuditClient } from "./audit-client";
import type { Platform } from "@/lib/platforms";

export const metadata = { title: "Listing Audit" };

export default async function AuditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [usage, { data: profile }] = await Promise.all([
    getUsageData(user.id),
    supabase
      .from("profiles")
      .select("onboarding_platforms")
      .eq("id", user.id)
      .single(),
  ]);

  const preferredPlatforms: Platform[] = Array.isArray(profile?.onboarding_platforms)
    ? (profile.onboarding_platforms as Platform[])
    : [];

  return <AuditClient plan={usage.effectivePlan} preferredPlatforms={preferredPlatforms} />;
}
