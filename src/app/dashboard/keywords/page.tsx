import { createClient } from "@/lib/supabase/server";
import { getUsageData } from "@/lib/usage";
import { FeatureGate } from "@/components/feature-gate";
import { KeywordsClient } from "./keywords-client";
import type { Platform } from "@/lib/platforms";

export const metadata = { title: "Keyword Research" };

export default async function KeywordsPage() {
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

  if (usage.effectivePlan === "free") {
    return (
      <FeatureGate
        title="Keyword Research"
        description="Find the exact phrases buyers search for on your platform — before your competitors do."
        bullets={[
          "15 keyword suggestions per search",
          "Volume, competition, and trend signals",
          "Platform-aware: occasion and style for Etsy, purchase intent for Amazon, and more",
        ]}
      />
    );
  }

  const preferredPlatforms: Platform[] = Array.isArray(profile?.onboarding_platforms)
    ? (profile.onboarding_platforms as Platform[])
    : [];

  return <KeywordsClient preferredPlatforms={preferredPlatforms} />;
}
