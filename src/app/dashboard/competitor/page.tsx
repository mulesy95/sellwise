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
        description="Analyse any Etsy listing and get an AI-optimised version that outranks it."
        bullets={[
          "Extract title, tags, and description from any Etsy listing",
          "Side-by-side comparison with your optimised version",
          "Specific improvements that give you the edge",
        ]}
      />
    );
  }

  return <CompetitorClient />;
}
