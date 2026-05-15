import Link from "next/link";
import { Sparkles, Search, Eye, BarChart3, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getUsageData } from "@/lib/usage";

export const metadata = {
  title: "Dashboard",
};

const quickActions = [
  {
    label: "Optimise a listing",
    description: "Generate a title, 13 tags, and SEO description in seconds.",
    href: "/dashboard/optimise",
    icon: Sparkles,
    badge: "Most popular",
    cta: "Start optimising",
  },
  {
    label: "Research keywords",
    description: "Find 15 marketplace keywords with volume and competition.",
    href: "/dashboard/keywords",
    icon: Search,
    cta: "Find keywords",
  },
  {
    label: "Analyse a competitor",
    description: "Paste any marketplace listing URL and extract their SEO strategy.",
    href: "/dashboard/competitor",
    icon: Eye,
    cta: "Analyse listing",
  },
  {
    label: "Audit my listing",
    description: "Score your existing listing 0–100 with actionable fixes.",
    href: "/dashboard/audit",
    icon: BarChart3,
    cta: "Run audit",
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const usage = user ? await getUsageData(user.id) : null;

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? null;

  const isNewUser =
    !usage ||
    (usage.optimisations === 0 &&
      usage.keywords === 0 &&
      usage.competitor === 0 &&
      usage.audits === 0);

  const stats = [
    { label: "Optimisations", value: usage?.optimisations ?? 0, sub: "this month" },
    { label: "Keywords explored", value: usage?.keywords ?? 0, sub: "this month" },
    { label: "Competitors analysed", value: usage?.competitor ?? 0, sub: "this month" },
    { label: "Audits run", value: usage?.audits ?? 0, sub: "this month" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isNewUser && firstName ? `Welcome, ${firstName}` : "Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isNewUser
            ? "You're all set. Optimise your first listing to get started."
            : "Welcome back. What would you like to optimise today?"}
        </p>
      </div>

      {/* First-run CTA */}
      {isNewUser && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">Optimise your first listing</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Paste in your product details and get an SEO-ready title, 13 tags, and description.
              </p>
            </div>
            <Link href="/dashboard/optimise">
              <Button className="shrink-0">
                <Sparkles className="size-3.5" />
                Try it now
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.sub}</div>
              <div className="mt-1 text-xs font-medium">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          QUICK ACTIONS
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Card
              key={action.href}
              className="group border-border/50 transition-colors hover:border-primary/30"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <action.icon className="size-4" />
                    </div>
                    <CardTitle className="text-base">{action.label}</CardTitle>
                  </div>
                  {action.badge && (
                    <Badge
                      variant="outline"
                      className="shrink-0 text-xs text-primary border-primary/30"
                    >
                      {action.badge}
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs">
                  {action.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link
                  href={action.href}
                  className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-sm font-medium text-primary transition-colors hover:bg-muted hover:text-primary"
                >
                  {action.cta}
                  <ArrowRight className="size-3" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
