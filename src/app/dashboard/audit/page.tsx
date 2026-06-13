import { createClient } from "@/lib/supabase/server";
import { getUsageData } from "@/lib/usage";
import { AuditClient } from "./audit-client";

export default async function AuditPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const usage = await getUsageData(user.id);

  return <AuditClient plan={usage.effectivePlan} />;
}
