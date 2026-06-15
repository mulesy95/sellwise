"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Currency = "USD" | "AUD";

const features = {
  free: [
    "1 optimisation / month",
    "All platforms via manual entry",
    "AI title, tags, bullets and description",
    "Free Shopify listing health check at /check — no account needed",
  ],
  starter: [
    "50 optimisations / month",
    "Keyword research — 15 keywords per search",
    "Listing audit with score and fixes",
    "Platform migration — reformat for any marketplace",
    "Optimisation history",
    "Email support",
  ],
  growth: [
    "Unlimited optimisations",
    "Unlimited keyword research",
    "Unlimited listing audits",
    "Optimisation history with before / after scores",
    "Brand voice — auto-derived from 5 results you approve, applied to every listing",
    "Bulk optimiser — upload a CSV and optimise up to 200 listings at once",
    "Connect 1 store — view SEO scores and optimise",
    "Priority support",
  ],
  studio: [
    "Everything in Growth",
    "Connect unlimited Shopify and eBay stores",
    "Push optimised listings live to Shopify and eBay — no copy-paste",
    "SEO titles and descriptions pushed to Shopify automatically",
    "Revert any listing to its previous version",
    "Dedicated support",
  ],
  agency: [
    "Everything in Studio",
    "Up to 10 connected stores",
    "500 optimisations / day",
    "Custom onboarding",
    "Dedicated account manager",
    "Team seats (coming soon)",
  ],
};

const USD_PLANS = [
  { id: "free" as const,    name: "Free",    monthly: 0,   annual: 0,    description: "1 optimisation a month, no card needed" },
  { id: "starter" as const, name: "Starter", monthly: 19,  annual: 190,  description: "50 listings optimised every month" },
  { id: "growth" as const,  name: "Growth",  monthly: 29,  annual: 290,  description: "Unlimited listings, no daily caps" },
  { id: "studio" as const,  name: "Studio",  monthly: 79,  annual: 790,  description: "Connect stores and push listings live" },
  { id: "agency" as const,  name: "Agency",  monthly: 249, annual: 2490, description: "For agencies and large catalogues" },
];

const AUD_PLANS = [
  { id: "free" as const,    name: "Free",    monthly: 0,   annual: 0,    description: "1 optimisation a month, no card needed" },
  { id: "starter" as const, name: "Starter", monthly: 32,  annual: 320,  description: "50 listings optimised every month" },
  { id: "growth" as const,  name: "Growth",  monthly: 45,  annual: 450,  description: "Unlimited listings, no daily caps" },
  { id: "studio" as const,  name: "Studio",  monthly: 120, annual: 1200, description: "Connect stores and push listings live" },
  { id: "agency" as const,  name: "Agency",  monthly: 379, annual: 3790, description: "For agencies and large catalogues" },
];

type CompCell = boolean | string;

const comparisonRows: {
  feature: string;
  sellwise: CompCell; erank: CompCell; marmalead: CompCell; helium10: CompCell; chatgpt: CompCell;
}[] = [
  { feature: "Shopify, eBay, Amazon, Etsy",  sellwise: true,         erank: "Etsy only",   marmalead: "Etsy only",   helium10: "Amazon only", chatgpt: "No rules"   },
  { feature: "AI-generates your copy",        sellwise: true,         erank: false,         marmalead: false,         helium10: "Amazon only", chatgpt: true         },
  { feature: "Platform rules enforced",       sellwise: true,         erank: false,         marmalead: false,         helium10: false,         chatgpt: false        },
  { feature: "SEO score 0–100",               sellwise: true,         erank: false,         marmalead: false,         helium10: false,         chatgpt: false        },
  { feature: "Connect store + push live",     sellwise: true,         erank: false,         marmalead: false,         helium10: false,         chatgpt: false        },
  { feature: "Keyword research",              sellwise: true,         erank: true,          marmalead: true,          helium10: true,          chatgpt: false        },
  { feature: "Starting price",               sellwise: "$29 / mo",   erank: "$9.99 / mo",  marmalead: "$19 / mo",    helium10: "$79 / mo",    chatgpt: "$20 / mo"   },
];

function renderCompCell(value: CompCell, highlight: boolean) {
  if (value === true)  return <Check className={cn("size-4 mx-auto", highlight ? "text-primary" : "text-green-500 dark:text-green-400")} />;
  if (value === false) return <X className="size-3.5 mx-auto text-muted-foreground/30" />;
  return <span className={cn("text-xs", highlight ? "font-semibold text-primary" : "text-muted-foreground/60")}>{value as string}</span>;
}

export function PricingClient({ currency = "USD" }: { currency?: Currency }) {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  const plans = currency === "AUD" ? AUD_PLANS : USD_PLANS;
  const symbol = currency === "AUD" ? "A$" : "$";

  async function handleUpgrade(plan: typeof plans[number]) {
    if (plan.id === "free") return;

    setLoading(plan.id);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id, billing, currency }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login?next=/pricing";
          return;
        }
        throw new Error(data.error ?? "Failed to start checkout");
      }

      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="mx-auto max-w-5xl px-6 pt-16 pb-12 text-center">
        <div className="mb-4 flex items-center justify-center">
          <a href="/" className="font-bold tracking-tight text-2xl">
            Sell<span className="text-primary">Wise</span>
          </a>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Simple, transparent pricing</h1>
        <p className="mt-3 text-muted-foreground">
          Start free. Upgrade when you're ready. Cancel anytime.
        </p>

        {/* Monthly / Annual toggle */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-lg border border-border bg-muted p-1">
          <button
            onClick={() => setBilling("monthly")}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              billing === "monthly"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              billing === "annual"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Annual
            <Badge className="h-5 px-1.5 text-xs bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
              2 months free
            </Badge>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {plans.map((plan) => {
            const price = billing === "annual" ? plan.annual : plan.monthly;
            const monthlyEquiv =
              billing === "annual" && plan.annual > 0
                ? Math.round((plan.annual / 12) * 10) / 10
                : null;

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-xl border p-6 flex flex-col",
                  plan.id === "growth" ? "border-primary/50 bg-primary/5" : "border-border"
                )}
              >
                <div className="mb-4">
                  <div className="text-sm font-semibold">{plan.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 mb-3">
                    {plan.description}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      {price === 0 ? "Free" : `${symbol}${billing === "annual" ? monthlyEquiv : price}`}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-muted-foreground">/mo</span>
                    )}
                  </div>
                  {billing === "annual" && plan.annual > 0 && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      billed {symbol}{plan.annual}/year
                    </div>
                  )}
                </div>

                <ul className="flex-1 space-y-2 mb-6">
                  {features[plan.id as keyof typeof features].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check className="size-3.5 shrink-0 mt-0.5 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.id === "free" ? (
                  <a
                    href="/dashboard"
                    className={buttonVariants({ variant: "outline", size: "sm", className: "w-full text-xs" })}
                  >
                    Start optimising free
                  </a>
                ) : plan.id === "agency" ? (
                  <a
                    href="mailto:brad@sellwise.au?subject=Agency plan enquiry"
                    className={buttonVariants({ size: "sm", className: "w-full text-xs" })}
                  >
                    Contact us
                  </a>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={loading === plan.id}
                    className={cn(
                      buttonVariants({
                        variant: plan.id === "growth" ? "default" : "outline",
                        size: "sm",
                        className: "w-full text-xs",
                      }),
                      "disabled:opacity-60"
                    )}
                  >
                    {loading === plan.id ? (
                      <Spinner size="sm" />
                    ) : (
                      "Start 7-day free trial"
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          All paid plans include a 7-day free trial. No credit card required to start free.
          {currency === "AUD" && " Prices in AUD."}
        </p>

        {/* Competitor comparison */}
        <div className="mt-16">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-bold tracking-tight">How SellWise compares</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Most tools pick one platform. SellWise is built for every marketplace you sell on.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/50">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="py-3 pl-5 pr-6 text-left text-xs font-normal text-muted-foreground" />
                  <th className="py-3 px-4 text-center text-xs font-semibold text-primary bg-primary/5">
                    SellWise
                  </th>
                  {["Erank", "Marmalead", "Helium 10", "ChatGPT"].map((t) => (
                    <th key={t} className="py-3 px-4 text-center text-xs font-medium text-muted-foreground">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {comparisonRows.map((row) => (
                  <tr key={row.feature}>
                    <td className="py-3 pl-5 pr-6 text-xs text-muted-foreground whitespace-nowrap">{row.feature}</td>
                    <td className="py-3 px-4 text-center bg-primary/5">{renderCompCell(row.sellwise, true)}</td>
                    <td className="py-3 px-4 text-center">{renderCompCell(row.erank, false)}</td>
                    <td className="py-3 px-4 text-center">{renderCompCell(row.marmalead, false)}</td>
                    <td className="py-3 px-4 text-center">{renderCompCell(row.helium10, false)}</td>
                    <td className="py-3 px-4 text-center">{renderCompCell(row.chatgpt, false)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground/40">
            Competitor features and prices as of June 2026.
          </p>
        </div>

        <div className="mt-10 flex justify-center gap-5 text-xs text-muted-foreground/60">
          <a href="/terms" className="hover:text-muted-foreground transition-colors">Terms</a>
          <a href="/privacy" className="hover:text-muted-foreground transition-colors">Privacy</a>
        </div>
      </div>
    </div>
  );
}
