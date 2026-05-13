import { createClient } from "@/lib/supabase/server";
import { getUsageData } from "@/lib/usage";
import { FeatureGate } from "@/components/feature-gate";
import { KeywordsClient } from "./keywords-client";

export default async function KeywordsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const usage = await getUsageData(user.id);

  if (usage.effectivePlan === "free") {
    return (
      <FeatureGate
        title="Keyword Research"
        description="Find the exact phrases Etsy buyers search for — before your competitors do."
        bullets={[
          "15 keyword suggestions per search",
          "Volume, competition, and trend signals",
          "Occasion, recipient, and style variations",
        ]}
      />
    );
  }

  return <KeywordsClient />;
}
