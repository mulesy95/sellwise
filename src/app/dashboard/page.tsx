import Link from "next/link";
import { Sparkles, Search, BarChart3, ArrowRight, ArrowLeftRight, Store, Plus, History } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShopHealthCounts } from "@/components/shop-health-counts";
import { ListingHealthWidget } from "@/components/listing-health-widget";
import { MilestoneWidget } from "@/components/milestone-widget";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsageData } from "@/lib/usage";
import { PLATFORM_LABELS, PLATFORM_PILL, type Platform } from "@/lib/platforms";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function formatRecentDate(iso: string): string {
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export const metadata = {
  title: "Dashboard — SellWise",
  description: "Your listing optimiser dashboard. See your shop health, recent optimisations, and quick actions.",
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
  const [usage, shopsResult, optimisationCountResult, keywordListCountResult, recentOptimisationsResult] = await Promise.all([
    user ? getUsageData(user.id) : null,
    user
      ? admin.from("shops").select("id, shop_name, platform").eq("user_id", user.id).order("created_at", { ascending: true })
      : { data: [] },
    user
      ? admin.from("optimisations").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      : { count: 0 },
    user
      ? admin.from("keyword_lists").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_archived", false)
      : { count: 0 },
    user
      ? admin.from("optimisations").select("id, platform, input, score, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3)
      : { data: [] },
  ]);

  const shops = shopsResult.data ?? [];
  const totalOptimisations = optimisationCountResult.count ?? 0;
  const keywordListCount = keywordListCountResult.count ?? 0;
  const recentOptimisations = (recentOptimisationsResult.data ?? []) as Array<{
    id: string;
    platform: Platform;
    input: { productName?: string } | null;
    score: number | null;
    created_at: string;
  }>;
  const plan = usage?.plan ?? "free";
  const canAccessShop = plan === "growth" || plan === "studio";

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? null;

  const isNewUser =
    !usage ||
    (usage.optimisations === 0 &&
      usage.keywords === 0 &&
      usage.audits === 0);

  const investmentItems = [
    totalOptimisations > 0 ? `${totalOptimisations} ${totalOptimisations === 1 ? "listing" : "listings"} optimised` : null,
    keywordListCount > 0 ? `${keywordListCount} keyword ${keywordListCount === 1 ? "list" : "lists"} saved` : null,
    shops.length > 0 ? `${shops.length} ${shops.length === 1 ? "store" : "stores"} connected` : null,
  ].filter((x): x is string => x !== null);

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
            ? "SellWise writes your listing copy and scores it against your platform's SEO rules."
            : "What would you like to optimise today?"}
        </p>
        {investmentItems.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {investmentItems.join(" · ")}
          </p>
        )}
        {!isNewUser && usage && usage.optimisationStreak > 0 && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            <span>🔥</span>
            {usage.optimisationStreak} week streak
          </div>
        )}
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

      {/* My Shop widget — Growth/Studio only, shown first as the hero action */}
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
                    <p className="text-xs text-muted-foreground">Connect a store to see SEO scores and optimise your listings.</p>
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
                <div key={shop.id} className="group">
                  <Card className="border-border/50 transition-colors group-hover:border-primary/30 group-hover:bg-muted/20">
                    <CardContent className="py-4 space-y-3">
                      <Link href="/dashboard/shop" className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Store className="size-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{shop.shop_name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="size-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                            <span className={cn(
                              "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                              PLATFORM_PILL[shop.platform as Platform] ?? "bg-muted text-muted-foreground"
                            )}>
                              {PLATFORM_LABELS[shop.platform as Platform] ?? shop.platform}
                            </span>
                            <span className="text-muted-foreground/40 text-xs">|</span>
                            <ShopHealthCounts shop={shop} />
                          </div>
                        </div>
                        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </Link>
                      {(plan === "growth" || plan === "studio") && (
                        <ListingHealthWidget shopId={shop.id} />
                      )}
                    </CardContent>
                  </Card>
                </div>
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

      {/* Milestone — only shown once user has activity */}
      {!isNewUser && <MilestoneWidget optimisationCount={totalOptimisations} />}

      {/* Recent optimisations */}
      {!isNewUser && recentOptimisations.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Recent</h2>
            <Link href="/dashboard/history" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentOptimisations.map((opt) => (
              <Link key={opt.id} href="/dashboard/history" className="group block">
                <Card className="border-border/50 transition-colors group-hover:border-primary/30 group-hover:bg-muted/20">
                  <CardContent className="flex items-center gap-3 py-3">
                    <History className="size-4 shrink-0 text-muted-foreground/50" />
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 text-xs h-5 px-1.5",
                        opt.platform === "shopify" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25" :
                        opt.platform === "ebay" ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25" :
                        opt.platform === "etsy" ? "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/25" :
                        opt.platform === "amazon" ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/25" :
                        "bg-muted text-muted-foreground"
                      )}
                    >
                      {PLATFORM_LABELS[opt.platform] ?? opt.platform}
                    </Badge>
                    <span className="flex-1 min-w-0 text-sm truncate">
                      {opt.input?.productName ?? "Untitled product"}
                    </span>
                    {opt.score != null && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 text-xs h-5 px-1.5",
                          opt.score >= 70 ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25" :
                          opt.score >= 40 ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25" :
                          "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25"
                        )}
                      >
                        {opt.score}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground shrink-0">{formatRecentDate(opt.created_at)}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
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
