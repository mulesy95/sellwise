import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsageData } from "@/lib/usage";
import { Sidebar } from "@/components/layout/sidebar";
import { TrialBanner } from "@/components/layout/trial-banner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("onboarding_completed, welcome_sent, welcome_queued_at, full_name")
    .eq("id", user.id)
    .single();

  if (profile && !profile.onboarding_completed) redirect("/onboarding");

  const usage = await getUsageData(user.id);

  // Queue welcome email on first dashboard load — cron sends after 1 hour
  if (profile && !profile.welcome_sent && !profile.welcome_queued_at) {
    void admin.from("profiles").update({ welcome_queued_at: new Date().toISOString() }).eq("id", user.id);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {usage.inTrial && usage.trialEndsAt && (
        <TrialBanner trialEndsAt={usage.trialEndsAt} />
      )}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          userEmail={user.email}
          plan={usage.plan}
          used={usage.optimisations}
          limit={usage.limit}
          inTrial={usage.inTrial}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
