import { createClient } from "@/lib/supabase/server";
import { getUsageData } from "@/lib/usage";
import { redirect } from "next/navigation";
import { OptimiseClient } from "./optimise-client";

export const metadata = { title: "Listing Optimiser" };

export default async function OptimisePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { effectivePlan } = await getUsageData(user.id);

  return <OptimiseClient plan={effectivePlan} />;
}
