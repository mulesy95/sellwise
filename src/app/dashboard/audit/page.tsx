import { createClient } from "@/lib/supabase/server";
import { getUsageData } from "@/lib/usage";
import { FeatureGate } from "@/components/feature-gate";
import { AuditClient } from "./audit-client";

export default async function AuditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const usage = await getUsageData(user.id);

  if (usage.effectivePlan === "free") {
    return (
      <FeatureGate
        title="Listing Audit"
        description="Get a 0–100 SEO score for your listing with a breakdown and quick wins."
        bullets={[
          "Score breakdown across title, tags, and description",
          "3–5 specific, actionable improvements",
          "Spot gaps before they cost you sales",
        ]}
      />
    );
  }

  return <AuditClient />;
}
