import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsageData } from "@/lib/usage";
import { redirect } from "next/navigation";
import { OptimiseClient } from "./optimise-client";
import type { Platform } from "@/lib/platforms";

export const metadata = {
  title: "Listing Optimiser — SellWise",
  description: "Generate an SEO-ready title, tags, and description for any marketplace in seconds.",
};

export default async function OptimisePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [{ effectivePlan }, { data: profile }, { data: shopsData }] = await Promise.all([
    getUsageData(user.id),
    supabase
      .from("profiles")
      .select("onboarding_platforms")
      .eq("id", user.id)
      .single(),
    admin
      .from("shops")
      .select("id, shop_name, platform")
      .eq("user_id", user.id)
      .in("platform", ["shopify", "ebay"]),
  ]);

  const preferredPlatforms: Platform[] = Array.isArray(profile?.onboarding_platforms)
    ? (profile.onboarding_platforms as Platform[])
    : [];

  const connectedShops = (shopsData ?? []) as Array<{ id: string; shop_name: string; platform: string }>;

  return (
    <OptimiseClient
      plan={effectivePlan}
      preferredPlatforms={preferredPlatforms}
      connectedShops={connectedShops}
    />
  );
}
