import { createClient } from "@/lib/supabase/server";
import { getUsageData } from "@/lib/usage";
import { redirect } from "next/navigation";
import { FeatureGate } from "@/components/feature-gate";
import { MigrateClient } from "./migrate-client";

export const metadata = { title: "Platform Migration" };

export default async function MigratePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { effectivePlan } = await getUsageData(user.id);

  if (effectivePlan === "free") {
    return (
      <FeatureGate
        title="Platform Migration"
        description="Paste a listing from one platform and instantly get it reformatted for another — titles, tags, bullets, and all."
        bullets={[
          "Migrate Etsy listings to Amazon, Shopify, or eBay",
          "AI enforces every platform's format rules",
          "Preserves all your product details",
          "Counts toward your monthly optimisation allowance",
        ]}
      />
    );
  }

  return <MigrateClient />;
}
