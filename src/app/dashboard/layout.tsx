import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsageData } from "@/lib/usage";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TrialBanner } from "@/components/layout/trial-banner";
import { ServiceStatusBanner } from "@/components/layout/service-status-banner";

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
    .select("onboarding_completed, welcome_sent, welcome_queued_at, full_name, is_admin")
    .eq("id", user.id)
    .single();

  if (profile && !profile.onboarding_completed) redirect("/onboarding");

  const usage = await getUsageData(user.id);

  // Queue welcome email on first dashboard load — cron sends after 1 hour
  if (profile && !profile.welcome_sent && !profile.welcome_queued_at) {
    void admin.from("profiles").update({ welcome_queued_at: new Date().toISOString() }).eq("id", user.id);
  }

  const navProps = {
    userEmail: user.email,
    plan: usage.plan,
    used: usage.optimisations,
    limit: usage.limit,
    inTrial: usage.inTrial,
    isAdmin: profile?.is_admin ?? false,
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {usage.inTrial && usage.trialEndsAt && (
        <TrialBanner trialEndsAt={usage.trialEndsAt} />
      )}
      <ServiceStatusBanner />

      {/* Mobile header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-sidebar px-4 lg:hidden">
        <span className="text-lg font-bold tracking-tight">
          Sell<span className="text-primary">Wise</span>
        </span>
        <MobileNav {...navProps} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex">
          <Sidebar {...navProps} />
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
