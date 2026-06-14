"use client";

import { useEffect, useRef } from "react";
import { X, Lock, Search, BarChart3, ArrowLeftRight, Store, Check, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const LOCKED_FEATURES = [
  { icon: Sparkles,      label: "Listing Optimiser",    hint: "AI-written titles, tags, bullets and descriptions for all 9 platforms including Amazon, Shopify and eBay" },
  { icon: Search,        label: "Keyword Research",     hint: "15 keywords per search with volume and trend signals" },
  { icon: BarChart3,     label: "Listing Audit",        hint: "Score your listings 0–100 with specific fixes" },
  { icon: ArrowLeftRight, label: "Platform Migration",  hint: "Reformat any listing for any marketplace in seconds" },
  { icon: Store,         label: "Store Connect",        hint: "Connect Shopify or eBay — view SEO scores and optimise without copy-paste" },
];

const PLANS = [
  {
    name: "Growth",
    price: "$29",
    period: "/mo",
    badge: "Most popular",
    features: [
      "Unlimited optimisations",
      "All 9 platforms — Amazon, Shopify, eBay, Etsy + more",
      "Keyword research, audit, platform migration",
      "Connect 1 store — view scores and optimise",
    ],
    href: "/pricing",
    primary: true,
  },
  {
    name: "Studio",
    price: "$79",
    period: "/mo",
    badge: "For power sellers",
    features: [
      "Everything in Growth",
      "Unlimited connected stores",
      "Push content live to Shopify and eBay — no copy-paste",
      "Multi-platform push in one click",
    ],
    href: "/pricing",
    primary: false,
  },
];

export function UpgradeModal({
  open,
  onClose,
  reason,
  lockedDescription,
}: {
  open: boolean;
  onClose: () => void;
  reason?: "limit" | "feature";
  lockedDescription?: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const isLimit = reason === "limit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
        className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2 id="upgrade-modal-title" className="text-base font-bold">
              {isLimit
                ? "You've outgrown this plan"
                : "This feature is on paid plans"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isLimit
                ? "You're ready for the next level. Here's what opens up:"
                : "All paid plans include a 7-day free trial. No card required to start."}
            </p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close"
            className="ml-4 shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Blurred description preview — shown when a locked description is passed */}
        {isLimit && lockedDescription && (
          <div className="relative mx-6 mb-3 overflow-hidden rounded-md border border-border/50 bg-muted/20 p-3 space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground">Here&apos;s what we wrote for you</p>
            <p className="text-sm leading-relaxed blur-[3px] select-none line-clamp-4 pointer-events-none">
              {lockedDescription}
            </p>
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background/90 to-transparent pointer-events-none" />
          </div>
        )}

        {/* Locked features — shown only on limit hit */}
        {isLimit && (
          <div className="mx-6 mb-4 rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              What unlocks on paid plans
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {LOCKED_FEATURES.map(({ icon: Icon, label, hint }) => (
                <div key={label} className="flex items-start gap-2">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-background border border-border">
                    <Icon className="size-3 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">{label}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-6 pb-2">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg border p-4 ${
                plan.primary ? "border-primary bg-primary/5" : "border-border bg-background"
              }`}
            >
              <div className="mb-3">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-sm font-semibold">{plan.name}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    plan.primary
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {plan.badge}
                  </span>
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-1.5 mb-4">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs">
                    <Check className="size-3 shrink-0 mt-0.5 text-primary" />
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
                Get {plan.name}
              </a>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border mt-3 px-6 py-3">
          <p className="text-xs text-muted-foreground">Start free for 7 days. No card required.</p>
          <a href="/pricing" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
            See all plans
          </a>
        </div>
      </div>
    </div>
  );
}
