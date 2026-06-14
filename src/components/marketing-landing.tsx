import Link from "next/link";
import { Sparkles, Search, BarChart3, ArrowLeftRight, Store, Brain } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const SAMPLE_OUTPUT = {
  metaTitle: "Soy Candle Gift Set — 3×50hr, Hand-Poured | Slow & Glow",
  metaDescription: "Three hand-poured soy candles, 50-hour burn each. Cedarwood, coastal citrus and sea salt — packaged gift-ready. Free AU shipping over $75.",
  productTitle: "Soy Candle Gift Set | 3 × 250g | Hand-Poured",
  description: "Each candle is poured by hand using 100% natural soy wax — burns clean, lasts longer, and fills the room without the headache. Choose from cedarwood, coastal citrus or sea salt…",
};

const FEATURES = [
  {
    icon: Sparkles,
    title: "Listing Optimiser",
    desc: "Describe your product and get AI-written titles, tags, bullets, and descriptions — formatted for whichever platform you sell on.",
  },
  {
    icon: Search,
    title: "Keyword Research",
    desc: "Find 15 keywords buyers actually search for, with volume, competition, and trend signals — platform-specific every time.",
  },
  {
    icon: BarChart3,
    title: "Listing Audit",
    desc: "Score your existing listings 0 to 100 with a full breakdown and a prioritised fix list.",
  },
  {
    icon: ArrowLeftRight,
    title: "Platform Migration",
    desc: "Selling somewhere new? Paste your listing and we'll reformat it for any of the 9 platforms we support.",
  },
  {
    icon: Store,
    title: "Store Connect",
    desc: "Connect your Shopify or eBay store and optimise listings directly from your dashboard — no copy-paste needed.",
  },
  {
    icon: Brain,
    title: "Learns your voice",
    desc: "Approve results you like and SellWise picks up your tone. After a few optimisations, it writes the way you do.",
  },
];

const PRICES = {
  USD: { symbol: "$", starter: "19", growth: "29", studio: "79" },
  AUD: { symbol: "A$", starter: "32", growth: "45", studio: "120" },
};

const BEFORE_AFTER = {
  product: "Handmade lavender soy candle, relaxation gift",
  before: {
    title: "lavender candle handmade",
    tags: ["lavender", "candle", "handmade", "gift", "home"],
    descSnippet: "A lovely lavender scented candle made by hand. Perfect for gifts and home decor.",
  },
  after: {
    title: "Handmade Lavender Soy Candle Gift for Her, Birthday Gift for Mum, Natural Scented Candle",
    tags: [
      "lavender candle gift", "gift for mum", "birthday gift for her",
      "natural soy candle", "handmade candle", "relaxation gift",
      "mothers day gift", "aromatherapy candle", "hand poured candle",
      "gift for women", "soy wax candle", "calming candle gift",
      "self care gift her",
    ],
    descSnippet: "For the person who needs an hour to themselves. A hand-poured soy candle in a weighted glass jar, scented with real dried lavender. Burns clean for 45 hours.",
  },
};

const PLATFORMS = ["Shopify", "eBay", "Amazon", "Etsy", "WooCommerce", "Wix", "Squarespace", "TikTok Shop", "Social"];

export function MarketingLanding({ currency = "USD" }: { currency?: "USD" | "AUD" }) {
  const p = PRICES[currency];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="flex items-center justify-between px-5 md:px-10 py-3.5 max-w-6xl mx-auto">
          <span className="font-bold text-foreground text-lg">Sell<span className="text-primary">Wise</span></span>
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
              Your listings deserve
              <br />
              to be found.
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mb-5 max-w-[360px] mx-auto md:mx-0 leading-relaxed">
              Most seller listings don&apos;t rank — not because the products are bad, but because the copy doesn&apos;t follow each platform&apos;s algorithm. Describe your product and we&apos;ll fix that in 30 seconds.
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
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                  Try free for 7 days
                </Link>
                <span className="text-xs text-muted-foreground">No card needed</span>
              </div>
              <Link
                href="/check"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                Already selling? Check your listing score free — no account needed →
              </Link>
            </div>
          </div>

          {/* Right: sample output card */}
          <div className="w-full md:w-[460px] lg:w-[520px] shrink-0 mx-auto md:mx-0 max-w-[520px]">
            <div className="bg-card rounded-xl p-5 border border-border text-left">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Sample output</span>
                  <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Shopify</span>
                </div>
                <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
                  91 / 100
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Meta title <span className="normal-case font-normal">(58 / 60)</span></p>
                  <p className="text-xs text-foreground leading-relaxed">{SAMPLE_OUTPUT.metaTitle}</p>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Meta description <span className="normal-case font-normal">(148 / 160)</span></p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{SAMPLE_OUTPUT.metaDescription}</p>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Product title</p>
                  <p className="text-xs text-foreground leading-relaxed">{SAMPLE_OUTPUT.productTitle}</p>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Description</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{SAMPLE_OUTPUT.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-border px-5 md:px-10 py-10 bg-muted/10">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-6">How it works</p>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary font-bold text-sm mx-auto">1</div>
              <p className="text-sm font-semibold text-foreground">Describe your product</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Paste your title, a few details, and the platform you sell on. Takes about 2 minutes.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary font-bold text-sm mx-auto">2</div>
              <p className="text-sm font-semibold text-foreground">Get an optimised listing</p>
              <p className="text-xs text-muted-foreground leading-relaxed">SellWise writes your title, tags, description, and keywords to that platform&apos;s exact ranking rules — in under 30 seconds.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary font-bold text-sm mx-auto">3</div>
              <p className="text-sm font-semibold text-foreground">Copy or push it live</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Copy the result with one click, or connect your Shopify or eBay store and push directly — no copy-paste.</p>
            </div>
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="border-t border-border px-5 md:px-10 py-12 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">See the difference</p>
            <h2 className="text-lg md:text-xl font-bold text-foreground">
              Same product. Completely different listing.
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Input: &ldquo;{BEFORE_AFTER.product}&rdquo; &mdash; Platform: Etsy
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {/* Before */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-semibold px-2 py-0.5">Before</span>
                <span className="text-xs text-muted-foreground">Without SellWise</span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Title <span className="normal-case font-normal text-red-500/70">({BEFORE_AFTER.before.title.length} / 140 chars)</span></p>
                  <p className="text-xs text-foreground">{BEFORE_AFTER.before.title}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Tags <span className="normal-case font-normal text-red-500/70">({BEFORE_AFTER.before.tags.length} / 13 tags)</span></p>
                  <div className="flex flex-wrap gap-1">
                    {BEFORE_AFTER.before.tags.map((t) => (
                      <span key={t} className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Description</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{BEFORE_AFTER.before.descSnippet}</p>
                </div>
              </div>
            </div>

            {/* After */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5">After</span>
                <span className="text-xs text-muted-foreground">With SellWise</span>
                <span className="ml-auto text-[11px] font-bold text-emerald-600 dark:text-emerald-400">94 / 100</span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Title <span className="normal-case font-normal text-emerald-600/70 dark:text-emerald-400/70">({BEFORE_AFTER.after.title.length} / 140 chars)</span></p>
                  <p className="text-xs text-foreground font-medium">{BEFORE_AFTER.after.title}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Tags <span className="normal-case font-normal text-emerald-600/70 dark:text-emerald-400/70">({BEFORE_AFTER.after.tags.length} / 13 tags)</span></p>
                  <div className="flex flex-wrap gap-1">
                    {BEFORE_AFTER.after.tags.map((t) => (
                      <span key={t} className="rounded border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[10px] text-primary/80">{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Description</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{BEFORE_AFTER.after.descSnippet}</p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground/60">
            Generated in under 10 seconds. No editing required.
          </p>
        </div>
      </section>

      {/* FAILURE STAKES */}
      <div className="border-t border-border px-5 md:px-10 py-5 bg-muted/5">
        <div className="max-w-3xl mx-auto text-center space-y-1">
          <p className="text-sm font-medium text-foreground">
            Every week with underoptimised listings is a week of sales going to competitors who&apos;ve done the work.
          </p>
          <p className="text-xs text-muted-foreground">
            SellWise knows each platform&apos;s ranking algorithm — Etsy&apos;s 13-tag rule, eBay&apos;s 80-character title limit, Shopify&apos;s meta fields — and writes your listings to follow them exactly.
          </p>
        </div>
      </div>

      {/* /CHECK TEASER */}
      <div className="border-t border-border bg-muted/30 px-5 md:px-10 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
          <p className="text-xs text-muted-foreground">
            Already have a Shopify listing? Check its SEO score in 10 seconds — no account needed.
          </p>
          <Link
            href="/check"
            className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity shrink-0"
          >
            Free listing health check →
          </Link>
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="border-t border-border px-5 md:px-10 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-lg md:text-xl font-bold text-foreground">
              Everything you need to rank
            </h2>
            <p className="mt-1 text-xs text-muted-foreground max-w-lg mx-auto">
              Built for the specific rules of each platform — not a generic AI that doesn&apos;t know the difference between an Etsy tag and a Shopify meta description.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center sm:items-start sm:text-left">
                <div className="mb-2.5 flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-t border-border px-5 md:px-10 py-12 text-center">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-lg md:text-xl font-bold text-foreground mb-1">
            Simple pricing, no surprises
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            Start free. Upgrade when you&apos;re ready.
          </p>

          <div className="grid grid-cols-2 gap-2.5 max-w-2xl mx-auto mb-3 sm:grid-cols-4">
            <div className="bg-card rounded-lg p-3.5 border border-border">
              <p className="text-xs font-semibold text-foreground">Free</p>
              <p className="text-xl font-bold text-foreground my-1">{p.symbol}0</p>
              <p className="text-xs text-muted-foreground">1 optimisation / month</p>
            </div>
            <div className="bg-card rounded-lg p-3.5 border border-border">
              <p className="text-xs font-semibold text-foreground">Starter</p>
              <p className="text-xl font-bold text-foreground my-1">
                {p.symbol}{p.starter}
                <span className="text-xs font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-xs text-muted-foreground">50 optimisations + all tools</p>
            </div>
            <div className="bg-card rounded-lg p-3.5 border border-border">
              <p className="text-xs font-semibold text-foreground">Growth</p>
              <p className="text-xl font-bold text-foreground my-1">
                {p.symbol}{p.growth}
                <span className="text-xs font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-xs text-muted-foreground">Unlimited + keywords + audit + 1 store</p>
            </div>
            <div className="bg-card rounded-lg p-3.5 border border-border">
              <p className="text-xs font-semibold text-foreground">Studio</p>
              <p className="text-xl font-bold text-foreground my-1">
                {p.symbol}{p.studio}
                <span className="text-xs font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-xs text-muted-foreground">Unlimited + connect unlimited stores</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-2">
            7-day free trial on all paid plans. No card required to start free.
            {currency === "AUD" && (
              <span className="ml-1 text-muted-foreground/60">Prices in AUD.</span>
            )}
          </p>
          <Link href="/pricing" className="text-xs text-primary hover:opacity-80 transition-opacity">
            See full pricing details
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-border px-5 md:px-10 py-12 text-center">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl md:text-3xl font-bold text-foreground mb-2">
            Stop leaving sales on the table.
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mb-6">
            Get your first optimised listing in 30 seconds. No card needed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Try free for 7 days
            </Link>
            <Link
              href="/check"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Check a listing score free
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="px-5 md:px-10 py-5 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-base font-bold">Sell<span className="text-primary">Wise</span></span>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/status" className="hover:text-foreground transition-colors">Status</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          </div>
        </div>
        <div className="border-t border-border px-5 md:px-10 py-2 text-center">
          <p className="text-xs text-muted-foreground/60">&copy; 2026 SellWise</p>
        </div>
      </footer>
    </div>
  );
}
