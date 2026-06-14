import { createClient } from "@/lib/supabase/server";
import { getUsageData } from "@/lib/usage";
import { redirect } from "next/navigation";
import { OptimiseClient } from "./optimise-client";
import type { Platform } from "@/lib/platforms";

export const metadata = { title: "Listing Optimiser" };

export default async function OptimisePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ effectivePlan }, { data: profile }] = await Promise.all([
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

  return <OptimiseClient plan={effectivePlan} preferredPlatforms={preferredPlatforms} />;
}
