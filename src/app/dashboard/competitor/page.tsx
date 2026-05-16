import { createClient } from "@/lib/supabase/server";
import { getUsageData } from "@/lib/usage";
import { FeatureGate } from "@/components/feature-gate";
import { CompetitorClient } from "./competitor-client";

export default async function CompetitorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const usage = await getUsageData(user.id);

  if (usage.effectivePlan === "free") {
    return (
      <FeatureGate
        title="Competitor Peek"
        description="Paste a competitor's Shopify listing URL and get an AI-optimised version that outranks it."
        bullets={[
          "Fetch any public Shopify product — no copy-paste needed",
          "Side-by-side comparison: their listing vs your optimised version",
          "Specific improvements that give you the edge",
        ]}
      />
    );
  }

  return <CompetitorClient />;
}
