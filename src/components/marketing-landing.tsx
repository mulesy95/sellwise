import Link from "next/link";
import { Search, Eye, BarChart3 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const SAMPLE_TAGS = [
  "ceramic mug",
  "coffee lover gift",
  "pottery gift",
  "handmade mug",
  "housewarming gift",
  "wheel thrown mug",
  "minimalist mug",
  "gift for her",
  "coffee cup",
  "stoneware mug",
  "birthday gift",
  "artisan mug",
  "unique mug",
];

const FEATURES = [
  {
    icon: Search,
    title: "Keyword Research",
    desc: "Find 15 keywords buyers actually search for, with volume, competition, and trend signals.",
  },
  {
    icon: Eye,
    title: "Competitor Peek",
    desc: "Paste a Shopify product URL and get an AI-optimised side-by-side view.",
  },
  {
    icon: BarChart3,
    title: "Listing Audit",
    desc: "Score your listings 0 to 100 with a full breakdown and specific fixes to make.",
  },
];

const PRICES = {
  USD: { symbol: "$", starter: "19", growth: "29", studio: "79" },
  AUD: { symbol: "A$", starter: "32", growth: "45", studio: "120" },
};

const PLATFORMS = ["Etsy", "Amazon", "Shopify", "eBay", "WooCommerce", "Wix", "Squarespace", "TikTok Shop", "Social"];

export function MarketingLanding({ currency = "USD" }: { currency?: "USD" | "AUD" }) {
  const p = PRICES[currency];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="flex items-center justify-between px-5 md:px-10 py-3.5 max-w-6xl mx-auto">
          <span className="font-bold text-foreground text-[15px]">Sell<span className="text-primary">Wise</span></span>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors hidden sm:block">
              Features
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors hidden sm:block">
              Pricing
            </a>
            <Link href="/login" className="text-foreground hover:text-foreground/80 transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className={buttonVariants({ size: "sm" })}>
              Try free
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-5 md:px-10 pt-12 md:pt-20 pb-10 md:pb-16">
        <div className="max-w-6xl mx-auto md:flex md:items-center md:gap-14 lg:gap-20">
          {/* Left: headline + CTA */}
          <div className="flex-1 text-center md:text-left mb-10 md:mb-0">
            <h1 className="text-[30px] md:text-5xl lg:text-[56px] font-extrabold text-foreground leading-[1.15] mb-4">
              Post listings that buyers
              <br />
              actually find.
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mb-5 max-w-[360px] mx-auto md:mx-0 leading-relaxed">
              Describe your product. We&apos;ll write it to rank — for wherever you sell.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mb-6">
              {PLATFORMS.map((platform) => (
                <span
                  key={platform}
                  className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground font-medium"
                >
                  {platform}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                Try free for 7 days
              </Link>
              <span className="text-xs text-muted-foreground">No card needed</span>
            </div>
          </div>

          {/* Right: sample output card */}
          <div className="w-full md:w-[460px] lg:w-[520px] shrink-0 mx-auto md:mx-0 max-w-[520px]">
            <div className="bg-card rounded-xl p-5 border border-border text-left">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Sample output</span>
                  <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Etsy</span>
                </div>
                <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
                  87 / 100
                </span>
              </div>

              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Title</p>
              <p className="text-xs text-foreground mb-3.5 leading-relaxed">
                Handmade Ceramic Coffee Mug, Pottery Gift for Coffee Lover, Wheel
                Thrown Mug, Minimalist Cup, Unique Housewarming Gift for Her
              </p>

              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Tags (13)</p>
              <div className="flex flex-wrap gap-1.5 mb-3.5">
                {SAMPLE_TAGS.map((tag) => (
                  <span
                    key={tag}
                    className="bg-background text-muted-foreground px-2 py-0.5 rounded text-[11px] border border-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Description</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                This wheel thrown ceramic mug is made for the coffee lover who
                appreciates something a bit different. Each one is shaped and glazed
                by hand&hellip;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-t border-border px-5 md:px-10 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-base md:text-lg font-bold text-foreground text-center mb-8">
            Everything you need to rank
          </h2>
          <div className="grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="mb-2.5 flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <h3 className="text-xs font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-t border-border px-5 md:px-10 py-12 text-center">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-base md:text-lg font-bold text-foreground mb-1">
            Simple pricing, no surprises
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            Start free. Upgrade when you&apos;re ready.
          </p>

          <div className="grid grid-cols-2 gap-2.5 max-w-2xl mx-auto mb-3 sm:grid-cols-4">
            <div className="bg-card rounded-lg p-3.5 border border-border">
              <p className="text-[11px] font-semibold text-foreground">Free</p>
              <p className="text-xl font-bold text-foreground my-1">{p.symbol}0</p>
              <p className="text-[11px] text-muted-foreground">3 optimisations / month</p>
            </div>
            <div className="bg-card rounded-lg p-3.5 border border-border">
              <p className="text-[11px] font-semibold text-foreground">Starter</p>
              <p className="text-xl font-bold text-foreground my-1">
                {p.symbol}{p.starter}
                <span className="text-[11px] font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-[11px] text-muted-foreground">50 optimisations + all tools</p>
            </div>
            <div className="bg-card rounded-lg p-3.5 border border-border">
              <p className="text-[11px] font-semibold text-foreground">Growth</p>
              <p className="text-xl font-bold text-foreground my-1">
                {p.symbol}{p.growth}
                <span className="text-[11px] font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-[11px] text-muted-foreground">Unlimited + all features</p>
            </div>
            <div className="bg-card rounded-lg p-3.5 border border-border">
              <p className="text-[11px] font-semibold text-foreground">Studio</p>
              <p className="text-xl font-bold text-foreground my-1">
                {p.symbol}{p.studio}
                <span className="text-[11px] font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-[11px] text-muted-foreground">Unlimited + shop connect</p>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground mb-2">
            7-day free trial on all paid plans. No card required to start free.
            {currency === "AUD" && (
              <span className="ml-1 text-muted-foreground/60">Prices in AUD.</span>
            )}
          </p>
          <Link href="/pricing" className="text-[11px] text-primary hover:opacity-80 transition-opacity">
            See full pricing details
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-border px-5 md:px-10 py-12 text-center">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl md:text-3xl font-bold text-foreground mb-2">
            Get your first listing in 30 seconds.
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mb-6">
            No setup, no card needed. Just describe your product and go.
          </p>
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            Start for free
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="px-5 md:px-10 py-4 flex justify-between items-center max-w-6xl mx-auto">
          <span className="text-[11px] font-semibold text-muted-foreground">SellWise</span>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
          </div>
        </div>
        <div className="border-t border-border px-5 md:px-10 py-2 text-center">
          <p className="text-xs text-muted-foreground/60">&copy; 2026 SellWise</p>
        </div>
      </footer>
    </div>
  );
}
