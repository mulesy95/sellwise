import { Settings } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getUsageData } from "@/lib/usage";
import { ManageBillingButton } from "@/components/manage-billing-button";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Settings — Sellwise" };

const planDisplay: Record<string, { label: string; price: string; limit: string }> = {
  free:    { label: "Free",    price: "$0/mo",  limit: "3 optimisations / month" },
  starter: { label: "Starter", price: "$19/mo", limit: "50 optimisations / month" },
  growth:  { label: "Growth",  price: "$39/mo", limit: "Unlimited" },
  studio:  { label: "Studio",  price: "$79/mo", limit: "Unlimited + multi-shop" },
};

const upgradePlans = [
  { id: "starter", label: "Starter", price: "$19/mo", limit: "50 / mo" },
  { id: "growth",  label: "Growth",  price: "$39/mo", limit: "Unlimited", popular: true },
  { id: "studio",  label: "Studio",  price: "$79/mo", limit: "Unlimited + multi-shop" },
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const [usageData, { data: profile }] = await Promise.all([
    user ? getUsageData(user.id) : null,
    user
      ? admin.from("profiles").select("plan, stripe_customer_id, trial_ends_at").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  const plan = profile?.plan ?? "free";
  const hasStripe = !!profile?.stripe_customer_id;
  const inTrial = usageData?.inTrial ?? false;
  const trialEndsAt = profile?.trial_ends_at ?? null;
  const daysLeftInTrial = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  const currentPlan = planDisplay[plan] ?? planDisplay.free;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Settings className="size-5 text-primary" />
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and subscription.
        </p>
      </div>

      {/* Current plan + billing */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Subscription</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Your current plan and usage.
              </CardDescription>
            </div>
            {hasStripe && <ManageBillingButton />}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current plan summary */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{currentPlan.label}</span>
                  <Badge variant="outline" className="h-4 px-1 text-[10px]">
                    Active
                  </Badge>
                  {inTrial && (
                    <Badge className="h-4 px-1 text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30">
                      Trial
                    </Badge>
                  )}
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">{currentPlan.price}</div>
              </div>
              <div className="text-right text-sm">
                <div className="font-medium">
                  {usageData?.optimisations ?? 0}{" "}
                  {usageData?.limit !== null ? `/ ${usageData?.limit}` : ""} used
                </div>
                <div className="text-xs text-muted-foreground">this month</div>
              </div>
            </div>
            {inTrial && daysLeftInTrial > 0 && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Your Growth trial ends in {daysLeftInTrial} day{daysLeftInTrial === 1 ? "" : "s"}. Upgrade to keep unlimited access.
              </p>
            )}
          </div>

          {/* Upgrade options (shown when on free/trial) */}
          {(plan === "free" || inTrial) && (
            <div>
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                {inTrial ? "Lock in a plan before your trial ends" : "Upgrade your plan"}
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {upgradePlans.map((p) => (
                  <div
                    key={p.id}
                    className={`relative rounded-lg border p-3 ${
                      p.popular ? "border-primary/40 bg-primary/5" : "border-border/50"
                    }`}
                  >
                    {p.popular && (
                      <Badge className="absolute -top-2 left-3 text-[10px] h-4 px-1.5 py-0">
                        Popular
                      </Badge>
                    )}
                    <div className="text-sm font-medium">{p.label}</div>
                    <div className="text-xs text-muted-foreground">{p.price}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 mb-2">{p.limit}</div>
                    <a
                      href={`/pricing`}
                      className={buttonVariants({
                        size: "sm",
                        variant: p.popular ? "default" : "outline",
                        className: "w-full text-xs h-7",
                      })}
                    >
                      Upgrade
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Usage breakdown */}
      {usageData && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Usage this month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Optimisations", count: usageData.optimisations },
                { label: "Keywords", count: usageData.keywords },
                { label: "Competitor", count: usageData.competitor },
                { label: "Audits", count: usageData.audits },
              ].map(({ label, count }) => (
                <div key={label} className="rounded-lg border border-border/50 p-3 text-center">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Account info */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{user?.email ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Plan</span>
            <span className="capitalize">{plan}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
