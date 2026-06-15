import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "eBay Listing Titles: The 80-Character Strategy That Gets More Views — SellWise",
  description:
    "Your eBay title has 80 characters. How you use them determines whether you appear in the top 50 results or the bottom 500.",
  openGraph: {
    title: "eBay Listing Titles: The 80-Character Strategy That Gets More Views",
    description:
      "Your eBay title has 80 characters. How you use them determines whether you appear in the top 50 results or the bottom 500.",
    url: "/blog/ebay-listing-title-tips",
    images: [{ url: "/api/og?title=eBay+Listing+Titles:+The+80-Character+Strategy", width: 1200, height: 630, alt: "eBay Listing Title Tips" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "eBay Listing Titles: The 80-Character Strategy That Gets More Views",
    description:
      "Your eBay title has 80 characters. How you use them determines whether you appear in the top 50 results or the bottom 500.",
    images: ["/api/og?title=eBay+Listing+Titles:+The+80-Character+Strategy"],
  },
};

export default function EbayListingTitleTipsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            eBay
          </span>
          <span className="text-xs text-muted-foreground">11 June 2026</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">6 min read</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
          eBay Listing Titles: The 80-Character Strategy That Gets More Views
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Your eBay title has 80 characters. How you use them determines whether you appear in the top 50 results or the bottom 500.
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          eBay&apos;s Cassini search algorithm is heavily title-driven. Unlike Google, which also weighs body content, backlinks, and engagement signals, Cassini relies on your title more than almost anything else. If your keyword isn&apos;t in the title, you won&apos;t rank for it.
        </p>
        <p>
          That makes your 80 characters the most important real estate in your listing.
        </p>

        <h2>How Cassini reads your title</h2>
        <p>
          Cassini scans your title left to right and weights words based on their position. Words at the start of the title carry more ranking weight. Words at the end carry less.
        </p>
        <p>
          This is called keyword front-loading — and it&apos;s the single most impactful change most eBay sellers can make today.
        </p>
        <p>
          Cassini also matches exact phrases, not just individual words. A buyer searching for &quot;vintage Levi&apos;s 501 jeans W32&quot; will only see your listing if all five of those words appear in your title (or close to it). Partial matches rank lower.
        </p>

        <h2>What to put in your 80 characters</h2>
        <p>
          eBay buyers search very specifically. They include brand, model, size, condition, colour, and sometimes year. Your title should pack in as many of those specifics as possible.
        </p>
        <p>
          A strong eBay title typically includes:
        </p>
        <ul>
          <li><strong>Brand</strong> — buyers often search by brand first</li>
          <li><strong>Model or product name</strong> — exact model number if relevant (electronics, cameras, tools)</li>
          <li><strong>Key specifications</strong> — size, colour, material, capacity, voltage</li>
          <li><strong>Condition descriptor</strong> — &quot;new,&quot; &quot;unused,&quot; &quot;refurbished&quot; (separate from the eBay condition field)</li>
          <li><strong>Relevant variant</strong> — if you sell multiple variations, the title should describe the specific listing</li>
        </ul>

        <h2>Words that waste space</h2>
        <p>
          eBay explicitly advises against including these in titles — they consume characters but don&apos;t help search ranking:
        </p>
        <ul>
          <li>Adjectives like &quot;amazing,&quot; &quot;great,&quot; &quot;beautiful,&quot; &quot;nice&quot;</li>
          <li>Filler phrases like &quot;look!&quot; or &quot;must see&quot; or &quot;check this out&quot;</li>
          <li>Symbols and special characters (!!!, ***)</li>
          <li>Your store name (buyers aren&apos;t searching for it)</li>
          <li>Shipping info (&quot;fast shipping,&quot; &quot;free post&quot;) — Cassini reads that from your listing settings, not your title</li>
        </ul>
        <p>
          Every character you spend on filler is a character you can&apos;t spend on a searchable keyword.
        </p>

        <h2>A before and after example</h2>
        <p>
          Here&apos;s a real pattern we see from sellers new to eBay SEO:
        </p>
        <p>
          <strong>Before:</strong> &quot;Beautiful Vintage Denim Jacket — Great Condition — Look!&quot; (54 characters)<br />
          <em>Problems: &quot;Beautiful,&quot; &quot;Great,&quot; &quot;Look!&quot; are filler. No size. No brand. 26 characters wasted.</em>
        </p>
        <p>
          <strong>After:</strong> &quot;Levi&apos;s Denim Trucker Jacket Vintage 90s Size M Blue Distressed&quot; (62 characters)<br />
          <em>Brand, product type, era, size, colour, style — every character earns its place.</em>
        </p>
        <p>
          The second title will rank for: &quot;Levi&apos;s denim jacket&quot;, &quot;vintage trucker jacket&quot;, &quot;90s denim jacket size M&quot;, &quot;blue distressed denim jacket&quot;, and more. The first title ranks for almost nothing.
        </p>

        <h2>Use all 80 characters</h2>
        <p>
          Most eBay sellers underuse their title. A 40-character title has 40 characters of unused ranking potential.
        </p>
        <p>
          If you&apos;ve included all the obvious keywords and still have space, add:
        </p>
        <ul>
          <li>A secondary search variation (&quot;jacket&quot; → also add &quot;coat&quot; or &quot;outerwear&quot;)</li>
          <li>A use case (&quot;hiking,&quot; &quot;workwear,&quot; &quot;gift&quot;)</li>
          <li>An era or style descriptor (&quot;Y2K,&quot; &quot;retro,&quot; &quot;classic&quot;)</li>
          <li>A key feature buyers filter by (&quot;waterproof,&quot; &quot;genuine leather&quot;)</li>
        </ul>

        <h2>Subtitle: worth using?</h2>
        <p>
          eBay offers a subtitle field (up to 55 characters) for a small fee. Subtitles appear below the title in search results and can improve click-through rate — but they don&apos;t affect search ranking.
        </p>
        <p>
          Subtitles are worth it for high-value items (over $50) where a supporting line like &quot;Includes original box and warranty card — ships next business day&quot; can tip the click. For low-margin listings, the fee isn&apos;t usually justified.
        </p>

        <h2>Check your search term reports</h2>
        <p>
          eBay Seller Hub gives you data on which search terms are landing buyers on your listings. Go to <strong>Seller Hub → Marketing → Promoted Listings → Search Term Report</strong> to see this. If buyers are finding you with terms you don&apos;t have in your title, add them.
        </p>
      </div>

      <div className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-6">
        <p className="font-semibold text-foreground mb-1">Let SellWise write your eBay titles</p>
        <p className="text-sm text-muted-foreground mb-4">
          SellWise knows eBay&apos;s 80-character limit, Cassini&apos;s front-loading rules, and which words to avoid. Get an optimised title and description in 30 seconds — with a score that tells you exactly where to improve.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          Try free — no card required
        </Link>
      </div>

      <div className="mt-10 pt-8 border-t border-border/50">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Back to blog
        </Link>
      </div>
    </main>
  );
}
