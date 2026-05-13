"use client";

import { useState } from "react";
import { Check, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const features = {
  free:    ["3 optimisations / month", "Keyword Research (3/mo)", "Listing Audit (3/mo)", "Competitor Peek (3/mo)"],
  starter: ["50 optimisations / month", "50 keyword searches", "50 audits", "50 competitor analyses", "Email support"],
  growth:  ["Unlimited optimisations", "Unlimited keywords", "Unlimited audits", "Unlimited competitor analyses", "Priority support", "Optimisation history"],
  studio:  ["Everything in Growth", "Multi-shop management", "Amazon FBA (coming soon)", "Shopify (coming soon)", "Agency seat access", "Dedicated support"],
};

const plans = [
  {
    id: "free" as const,
    name: "Free",
    monthly: 0,
    annual: 0,
    description: "Try before you buy",
  },
  {
    id: "starter" as const,
    name: "Starter",
    monthly: 19,
    annual: 190,
    description: "For part-time sellers",
  },
  {
    id: "growth" as const,
    name: "Growth",
    monthly: 39,
    annual: 390,
    description: "For serious sellers",
    popular: true,
  },
  {
    id: "studio" as const,
    name: "Studio",
    monthly: 79,
    annual: 790,
    description: "For power users & agencies",
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpgrade(plan: typeof plans[number]) {
    if (plan.id === "free") return;

    setLoading(plan.id);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id, billing }),
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
        <div className="mb-4 flex items-center justify-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Zap className="size-4" />
          </div>
          <a href="/dashboard" className="font-bold tracking-tight text-xl">
            Sell<span className="text-primary">wise</span>
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
            <Badge className="h-4 px-1 text-[10px] bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
              Save 17%
            </Badge>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const price = billing === "annual" ? plan.annual : plan.monthly;
            const monthlyEquiv =
              billing === "annual" && plan.annual > 0
                ? Math.round((plan.annual / 12) * 100) / 100
                : null;

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-xl border p-6 flex flex-col",
                  plan.popular
                    ? "border-primary shadow-md shadow-primary/10"
                    : "border-border"
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs">
                    Most popular
                  </Badge>
                )}

                <div className="mb-4">
                  <div className="text-sm font-semibold">{plan.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 mb-3">
                    {plan.description}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      {price === 0 ? "Free" : `$${billing === "annual" ? monthlyEquiv : price}`}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-muted-foreground">/mo</span>
                    )}
                  </div>
                  {billing === "annual" && plan.annual > 0 && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      billed ${plan.annual}/year
                    </div>
                  )}
                </div>

                <ul className="flex-1 space-y-2 mb-6">
                  {features[plan.id].map((f) => (
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
                    Get started free
                  </a>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={loading === plan.id}
                    className={cn(
                      buttonVariants({
                        variant: plan.popular ? "default" : "outline",
                        size: "sm",
                        className: "w-full text-xs",
                      }),
                      "disabled:opacity-60"
                    )}
                  >
                    {loading === plan.id ? (
                      <span className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    ) : (
                      `Get ${plan.name}`
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          All paid plans include a 7-day free trial. No credit card required to start free.
        </p>
      </div>
    </div>
  );
}
