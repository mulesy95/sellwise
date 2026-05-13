import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

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
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* NAV */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-7 py-3.5 border-b border-slate-800 bg-slate-950">
        <span className="font-bold text-slate-50 text-[15px]">SellWise</span>
        <div className="flex items-center gap-5 text-xs text-slate-400">
          <a href="#features" className="hover:text-slate-200 transition-colors">
            Features
          </a>
          <a href="#pricing" className="hover:text-slate-200 transition-colors">
            Pricing
          </a>
          <Link
            href="/login"
            className="text-slate-200 hover:text-slate-50 transition-colors"
          >
            Sign in
          </Link>
          <Link href="/signup" className={buttonVariants({ size: "sm" })}>
            Try free
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="text-center px-7 pt-[52px] pb-8">
        <h1 className="text-[30px] font-extrabold text-slate-50 leading-[1.2] mb-3.5">
          Post listings that buyers
          <br />
          actually find.
        </h1>
        <p className="text-sm text-slate-400 mb-6 max-w-[340px] mx-auto leading-relaxed">
          Tell us what you sell. We&apos;ll write the listing.
        </p>
        <div className="flex gap-2.5 items-center justify-center mb-8">
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            Try free for 7 days
          </Link>
          <span className="text-xs text-slate-600">No card needed</span>
        </div>

        {/* Sample output card */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 max-w-[520px] mx-auto text-left">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[11px] font-semibold text-slate-400">
              Sample output
            </span>
            <span className="text-[13px] font-bold text-green-500">
              87 / 100
            </span>
          </div>

          <p className="text-[9px] text-slate-500 tracking-widest uppercase mb-1">
            Title
          </p>
          <p className="text-xs text-slate-200 mb-3.5 leading-relaxed">
            Handmade Ceramic Coffee Mug, Pottery Gift for Coffee Lover, Wheel
            Thrown Mug, Minimalist Cup, Unique Housewarming Gift for Her
          </p>

          <p className="text-[9px] text-slate-500 tracking-widest uppercase mb-2">
            Tags (13)
          </p>
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="bg-slate-950 text-slate-400 px-2 py-0.5 rounded text-[10px] border border-slate-700"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="text-[9px] text-slate-500 tracking-widest uppercase mb-1">
            Description
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            This wheel thrown ceramic mug is made for the coffee lover who
            appreciates something a bit different. Each one is shaped and glazed
            by hand...
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-t border-slate-800 px-7 py-9">
        <h2 className="text-base font-bold text-slate-50 text-center mb-6">
          Everything you need to rank
        </h2>
        <div className="grid grid-cols-3 gap-5 max-w-2xl mx-auto">
          <div>
            <div className="text-xl mb-2">🔍</div>
            <h3 className="text-xs font-semibold text-slate-50 mb-1">
              Keyword Research
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Find 15 keywords buyers actually search for, with volume,
              competition and trend signals.
            </p>
          </div>
          <div>
            <div className="text-xl mb-2">👁️</div>
            <h3 className="text-xs font-semibold text-slate-50 mb-1">
              Competitor Peek
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Paste any marketplace listing URL. See their SEO and get a version
              that outranks it.
            </p>
          </div>
          <div>
            <div className="text-xl mb-2">📊</div>
            <h3 className="text-xs font-semibold text-slate-50 mb-1">
              Listing Audit
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Score your listings 0 to 100 with a breakdown and specific fixes
              to make.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        className="border-t border-slate-800 px-7 py-9 text-center"
      >
        <h2 className="text-base font-bold text-slate-50 mb-1">
          Simple pricing, no surprises
        </h2>
        <p className="text-xs text-slate-600 mb-5">
          Start free. Upgrade when you are ready.
        </p>

        <div className="grid grid-cols-4 gap-2.5 max-w-2xl mx-auto mb-2.5">
          <div className="bg-slate-800 rounded-lg p-3.5 border border-slate-700">
            <p className="text-[11px] font-semibold text-slate-50">Free</p>
            <p className="text-xl font-bold text-slate-50 my-1">$0</p>
            <p className="text-[10px] text-slate-500">
              1 optimisation per month
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3.5 border border-slate-700">
            <p className="text-[11px] font-semibold text-slate-50">Starter</p>
            <p className="text-xl font-bold text-slate-50 my-1">
              $19
              <span className="text-[10px] font-normal text-slate-500">
                /mo
              </span>
            </p>
            <p className="text-[10px] text-slate-500">
              50 optimisations + keywords, audits, competitor
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3.5 border border-primary relative">
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[8px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
              POPULAR
            </span>
            <p className="text-[11px] font-semibold text-slate-50">Growth</p>
            <p className="text-xl font-bold text-slate-50 my-1">
              $39
              <span className="text-[10px] font-normal text-slate-500">
                /mo
              </span>
            </p>
            <p className="text-[10px] text-slate-500">
              Unlimited optimisations + all features
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3.5 border border-slate-700">
            <p className="text-[11px] font-semibold text-slate-50">Studio</p>
            <p className="text-xl font-bold text-slate-50 my-1">
              $79
              <span className="text-[10px] font-normal text-slate-500">
                /mo
              </span>
            </p>
            <p className="text-[10px] text-slate-500">Unlimited + multi-shop</p>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 mb-2">
          7-day free trial on all paid plans. No card required to start.
        </p>
        <Link
          href="/pricing"
          className="text-[10px] text-primary hover:opacity-80 transition-opacity"
        >
          See full pricing details
        </Link>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-slate-800 px-7 py-10 text-center">
        <h2 className="text-xl font-bold text-slate-50 mb-2">
          Get your first listing in 30 seconds.
        </h2>
        <p className="text-xs text-slate-600 mb-5">
          No setup, no card needed. Just describe your product and go.
        </p>
        <Link href="/signup" className={buttonVariants({ size: "lg" })}>
          Start for free
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800">
        <div className="px-7 py-4 flex justify-between items-center">
          <span className="text-[11px] font-semibold text-slate-600">
            SellWise
          </span>
          <div className="flex gap-4 text-[10px] text-slate-600">
            <Link
              href="/pricing"
              className="hover:text-slate-400 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/login"
              className="hover:text-slate-400 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
        <div className="border-t border-slate-800 px-7 py-2 text-center">
          <p className="text-[10px] text-slate-700">© 2026 SellWise</p>
        </div>
      </footer>
    </div>
  );
}
