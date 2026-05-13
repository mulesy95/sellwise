import { createClient } from "@/lib/supabase/server";
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

  const usage = user ? await getUsageData(user.id) : null;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {usage?.inTrial && usage.trialEndsAt && (
        <TrialBanner trialEndsAt={usage.trialEndsAt} />
      )}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          userEmail={user?.email}
          plan={usage?.plan ?? "free"}
          used={usage?.optimisations ?? 0}
          limit={usage?.limit ?? 3}
          inTrial={usage?.inTrial ?? false}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
