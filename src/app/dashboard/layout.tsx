import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsageData } from "@/lib/usage";
import { Sidebar } from "@/components/layout/sidebar";
import { TrialBanner } from "@/components/layout/trial-banner";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/emails/welcome";

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

  // Send welcome email on first authenticated dashboard load
  if (user) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("welcome_sent, full_name")
      .eq("id", user.id)
      .single();

    if (profile && !profile.welcome_sent) {
      await admin.from("profiles").update({ welcome_sent: true }).eq("id", user.id);
      const firstName = profile.full_name?.split(" ")[0] ?? null;
      const { subject, html } = welcomeEmail(firstName);
      void sendEmail({ to: user.email!, subject, html });
    }
  }

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
          limit={usage ? usage.limit : 3}
          inTrial={usage?.inTrial ?? false}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
