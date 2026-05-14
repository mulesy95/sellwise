import type { Metadata } from "next";
import Link from "next/link";
import { Search, Eye, BarChart2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "SellWise — AI Listing Optimiser for Etsy, Amazon & More",
  description:
    "Generate SEO-optimised titles, tags, and descriptions in seconds. Built for Etsy, Amazon, Shopify, and eBay sellers. Start free.",
  openGraph: {
    title: "SellWise — AI Listing Optimiser for Etsy, Amazon & More",
    description:
      "Generate SEO-optimised titles, tags, and descriptions in seconds. Built for Etsy, Amazon, Shopify, and eBay sellers. Start free.",
    url: "/",
  },
};

export default function HomePage() {
  const tags = [
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

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 md:py-5">
          <span className="text-lg font-bold text-foreground">
            Sell<span className="text-primary">Wise</span>
          </span>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a
              href="#features"
              className="hidden transition-colors hover:text-foreground sm:block"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="hidden transition-colors hover:text-foreground sm:block"
            >
              Pricing
            </a>
            <Link
              href="/login"
              className="text-foreground transition-colors hover:text-foreground/80"
            >
              Sign in
            </Link>
            <Link href="/signup" className={buttonVariants({ size: "sm" })}>
              Try free
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="border-b border-border px-6 py-14 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-10 md:flex-row md:items-center md:gap-14">
            {/* Left — text + CTA */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="mb-4 text-[32px] font-extrabold leading-[1.2] text-foreground md:text-5xl lg:text-6xl">
                Post listings that buyers
                <br />
                actually find.
              </h1>
              <p className="mb-8 text-sm leading-relaxed text-muted-foreground md:text-lg">
                Tell us what you sell. We&apos;ll write the title, tags, and
                description — optimised for the algorithm.
              </p>
              <div className="flex items-center justify-center gap-3 md:justify-start">
                <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                  Try free for 7 days
                </Link>
                <span className="text-sm text-muted-foreground">
                  No card needed
                </span>
              </div>
            </div>

            {/* Right — sample output card */}
            <div className="w-full max-w-sm shrink-0 rounded-xl border border-border bg-card p-5 md:max-w-md lg:max-w-lg">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  Sample output
                </span>
                <span className="text-sm font-bold text-green-500">
                  87 / 100
                </span>
              </div>

              <p className="mb-1 text-[9px] uppercase tracking-widest text-muted-foreground">
                Title
              </p>
              <p className="mb-4 text-xs leading-relaxed text-foreground md:text-sm">
                Handmade Ceramic Coffee Mug, Pottery Gift for Coffee Lover,
                Wheel Thrown Mug, Minimalist Cup, Unique Housewarming Gift for
                Her
              </p>

              <p className="mb-2 text-[9px] uppercase tracking-widest text-muted-foreground">
                Tags (13)
              </p>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="mb-1 text-[9px] uppercase tracking-widest text-muted-foreground">
                Description
              </p>
              <p className="text-[11px] leading-relaxed text-muted-foreground md:text-xs">
                This wheel thrown ceramic mug is made for the coffee lover who
                appreciates something a bit different. Each one is shaped and
                glazed by hand...
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-t border-border py-14 md:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground md:text-3xl">
            Everything you need to rank
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 md:gap-12">
            <div>
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Search className="size-5" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                Keyword Research
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Find 15 keywords buyers actually search for, with volume,
                competition and trend signals.
              </p>
            </div>
            <div>
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Eye className="size-5" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                Competitor Peek
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Paste any marketplace listing URL. See their SEO and get a
                version that outranks it.
              </p>
            </div>
            <div>
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BarChart2 className="size-5" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                Listing Audit
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Score your listings 0 to 100 with a breakdown and specific
                fixes to make.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        className="border-t border-border py-14 text-center md:py-20"
      >
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-1 text-2xl font-bold text-foreground md:text-3xl">
            Simple pricing, no surprises
          </h2>
          <p className="mb-8 text-sm text-muted-foreground">
            Start free. Upgrade when you are ready.
          </p>

          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">Free</p>
              <p className="my-2 text-2xl font-bold text-foreground">$0</p>
              <p className="text-xs text-muted-foreground">
                1 optimisation per month
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">Starter</p>
              <p className="my-2 text-2xl font-bold text-foreground">
                $19
                <span className="text-xs font-normal text-muted-foreground">
                  /mo
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                50 optimisations + keywords, audits, competitor
              </p>
            </div>
            <div className="relative rounded-lg border border-primary bg-card p-4">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2.5 py-0.5 text-[9px] font-semibold text-primary-foreground">
                POPULAR
              </span>
              <p className="text-sm font-semibold text-foreground">Growth</p>
              <p className="my-2 text-2xl font-bold text-foreground">
                $29
                <span className="text-xs font-normal text-muted-foreground">
                  /mo
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Unlimited optimisations + all features
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-semibold text-foreground">Studio</p>
              <p className="my-2 text-2xl font-bold text-foreground">
                $79
                <span className="text-xs font-normal text-muted-foreground">
                  /mo
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Multi-shop + platform API (coming soon)
              </p>
            </div>
          </div>

          <p className="mb-1.5 text-xs text-muted-foreground">
            7-day free trial on all paid plans. No card required to start.
          </p>
          <Link
            href="/pricing"
            className="text-xs text-primary transition-opacity hover:opacity-80"
          >
            See full pricing details
          </Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-border py-16 text-center md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">
            Get your first listing in 30 seconds.
          </h2>
          <p className="mb-8 text-sm text-muted-foreground md:text-base">
            No setup, no card needed. Just describe your product and go.
          </p>
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            Start for free
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 md:py-8">
          <div>
            <span className="text-base font-bold text-foreground">
              Sell<span className="text-primary">Wise</span>
            </span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Sell smarter on every platform.
            </p>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link
              href="/pricing"
              className="transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="transition-colors hover:text-foreground"
            >
              Sign up
            </Link>
          </div>
        </div>
        <div className="border-t border-border px-6 py-3 text-center">
          <p className="text-xs text-muted-foreground/50">
            © 2026 SellWise
          </p>
        </div>
      </footer>
    </div>
  );
}
