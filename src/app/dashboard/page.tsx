import Link from "next/link";
import { Sparkles, Search, Eye, BarChart3, ArrowRight, ArrowLeftRight, Store, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsageData } from "@/lib/usage";

export const metadata = {
  title: "Dashboard",
};

const quickActions = [
  {
    label: "Optimise a listing",
    description: "Enter your product details and get an SEO-ready title, tags, and description in seconds.",
    href: "/dashboard/optimise",
    icon: Sparkles,
  },
  {
    label: "Research keywords",
    description: "Find 15 marketplace keywords ranked by search volume and competition.",
    href: "/dashboard/keywords",
    icon: Search,
  },
  {
    label: "Analyse a competitor",
    description: "Paste a Shopify listing URL and get an AI-optimised side-by-side comparison.",
    href: "/dashboard/competitor",
    icon: Eye,
  },
  {
    label: "Audit my listing",
    description: "Score your existing listing 0–100 and get specific improvements to make.",
    href: "/dashboard/audit",
    icon: BarChart3,
  },
  {
    label: "Platform Migration",
    description: "Paste your listing from one platform and get it reformatted for another in seconds.",
    href: "/dashboard/migrate",
    icon: ArrowLeftRight,
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const [usage, shopsResult] = await Promise.all([
    user ? getUsageData(user.id) : null,
    user
      ? admin.from("shops").select("id, shop_name, platform").eq("user_id", user.id).order("created_at", { ascending: true })
      : { data: [] },
  ]);

  const shops = shopsResult.data ?? [];
  const plan = usage?.plan ?? "free";
  const canAccessShop = plan === "growth" || plan === "studio";

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
          {isNewUser
            ? firstName ? `Welcome, ${firstName}` : "Welcome"
            : firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isNewUser
            ? "You're all set. Optimise your first listing to get started."
            : "What would you like to optimise today?"}
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

      {/* Stats — only shown once user has activity */}
      {!isNewUser && (
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
      )}

      {/* My Shop widget — Growth/Studio only */}
      {canAccessShop && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">My Shop</h2>
            <Link href="/dashboard/shop" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>

          {shops.length === 0 ? (
            <Card className="border-dashed border-border/60">
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Store className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">No stores connected</p>
                    <p className="text-xs text-muted-foreground">Connect a store to see SEO scores and optimise listings.</p>
                  </div>
                </div>
                <Link href="/dashboard/shop">
                  <Button size="sm" variant="outline" className="shrink-0 text-xs">
                    <Plus className="size-3.5" />
                    Connect store
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {shops.map((shop) => (
                <Link key={shop.id} href="/dashboard/shop" className="group block">
                  <Card className="border-border/50 transition-colors group-hover:border-primary/30 group-hover:bg-muted/20">
                    <CardContent className="flex items-center gap-3 py-4">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Store className="size-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{shop.shop_name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                          <span className="text-xs text-muted-foreground capitalize">{shop.platform} · Connected</span>
                        </div>
                      </div>
                      <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {plan === "studio" && (
                <Link href="/dashboard/shop" className="group block">
                  <Card className="border-dashed border-border/50 transition-colors group-hover:border-primary/30">
                    <CardContent className="flex items-center gap-3 py-4">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Plus className="size-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Add another store</p>
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick actions — entire card is a link */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="group block">
              <Card className="h-full border-border/50 transition-colors group-hover:border-primary/30 group-hover:bg-muted/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <action.icon className="size-4" />
                    </div>
                    <CardTitle className="text-base">{action.label}</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Go
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
