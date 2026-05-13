"use client";

import { useEffect } from "react";
import { X, Zap, Infinity } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Growth",
    price: "$39",
    period: "/mo",
    badge: "Most popular",
    features: [
      "Unlimited optimisations",
      "Unlimited keyword research",
      "Competitor Peek",
      "Listing Audit",
      "Priority support",
    ],
    href: "/dashboard/settings",
    primary: true,
  },
  {
    name: "Studio",
    price: "$79",
    period: "/mo",
    badge: null,
    features: [
      "Everything in Growth",
      "Multi-shop management",
      "Amazon FBA (coming soon)",
      "Shopify (coming soon)",
      "Agency seat access",
    ],
    href: "/dashboard/settings",
    primary: false,
  },
];

export function UpgradeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="size-4 text-primary" />
              <h2 className="text-lg font-bold">Upgrade your plan</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              You've reached your monthly limit. Upgrade to keep going.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-2 gap-3 px-6 pb-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-lg border p-4 ${
                plan.primary
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background"
              }`}
            >
              {plan.badge && (
                <Badge className="absolute -top-2 left-3 text-[10px] h-4 px-1.5 py-0">
                  {plan.badge}
                </Badge>
              )}
              <div className="mb-3">
                <div className="text-sm font-semibold">{plan.name}</div>
                <div className="flex items-baseline gap-0.5 mt-0.5">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  <span className="text-xs text-muted-foreground">
                    {plan.period}
                  </span>
                </div>
              </div>
              <ul className="space-y-1.5 mb-4">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs">
                    <Infinity className="size-3 shrink-0 mt-0.5 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href={plan.href}
                className={buttonVariants({
                  size: "sm",
                  variant: plan.primary ? "default" : "outline",
                  className: "w-full text-xs",
                })}
              >
                Upgrade to {plan.name}
              </a>
            </div>
          ))}
        </div>

        <div className="border-t border-border px-6 py-3 text-center text-xs text-muted-foreground">
          Cancel anytime. No long-term contracts.
        </div>
      </div>
    </div>
  );
}
