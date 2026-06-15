import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Write Shopify Product Titles That Rank in Search — SellWise",
  description:
    "Most Shopify sellers write titles for their customers. Here's how to write them for the algorithm too — without sacrificing readability.",
  openGraph: {
    title: "How to Write Shopify Product Titles That Rank in Search",
    description:
      "Most Shopify sellers write titles for their customers. Here's how to write them for the algorithm too — without sacrificing readability.",
    url: "/blog/shopify-product-title-seo",
    images: [{ url: "/api/og?title=How+to+Write+Shopify+Product+Titles+That+Rank+in+Search", width: 1200, height: 630, alt: "Shopify Product Title SEO" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Write Shopify Product Titles That Rank in Search",
    description:
      "Most Shopify sellers write titles for their customers. Here's how to write them for the algorithm too — without sacrificing readability.",
    images: ["/api/og?title=How+to+Write+Shopify+Product+Titles+That+Rank+in+Search"],
  },
};

export default function ShopifyProductTitleSeoPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            Shopify
          </span>
          <span className="text-xs text-muted-foreground">10 June 2026</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">7 min read</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
          How to Write Shopify Product Titles That Rank in Search
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Most Shopify sellers write titles for their customers. Here&apos;s how to write them for the algorithm too — without sacrificing readability.
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          Your Shopify product title does two jobs at once. It tells Google what your product is. And it tells a shopper why to click. Most sellers optimise for one and ignore the other.
        </p>
        <p>
          The good news: you don&apos;t have to choose. A well-structured title does both.
        </p>

        <h2>Product title vs meta title — they&apos;re not the same thing</h2>
        <p>
          Shopify has two title fields most sellers confuse. Your <strong>product title</strong> is what shows on your store — in collection pages, cart, order emails. Your <strong>meta title</strong> is what shows in Google search results and browser tabs.
        </p>
        <p>
          By default, Shopify uses your product title as your meta title. That works fine when your titles are short and keyword-rich. But your product title might be &quot;Lavender Soy Candle — 250g&quot; while your meta title should be &quot;Lavender Soy Candle | Gift Idea | 250g | Free AU Shipping&quot;.
        </p>
        <p>
          Edit the meta title separately in the SEO section at the bottom of every Shopify product page. You get 60 characters. Use all of them.
        </p>

        <h2>The 60-character rule</h2>
        <p>
          Google truncates meta titles at around 60 characters (580 pixels to be precise — but 60 characters is a reliable rule of thumb). Anything past that gets cut off with &quot;...&quot; in search results.
        </p>
        <p>
          That means your most important keyword needs to appear in the first 40–50 characters, not the last 10. The end of your title may not be visible to the searcher at all.
        </p>
        <p>
          Audit your current titles. Open Google Search Console, filter by your domain, and look at which queries you rank for but get low click-through rates. Titles that get cut off mid-sentence are common culprits.
        </p>

        <h2>Keyword-front-loading: what it means and why it works</h2>
        <p>
          Search algorithms — Google, Shopify&apos;s own search, and most marketplaces — weight the beginning of a title more heavily than the end. A title that starts with your primary keyword ranks better than one that buries it.
        </p>
        <p>
          Compare these two titles for the same product:
        </p>
        <ul>
          <li><strong>Buried:</strong> &quot;Beautiful Hand-Poured Artisan Candle with Lavender Essential Oil Scent&quot;</li>
          <li><strong>Front-loaded:</strong> &quot;Lavender Soy Candle | Hand-Poured | Calming Scent | 250g&quot;</li>
        </ul>
        <p>
          The first title leads with a banned-word adjective (&quot;beautiful&quot;) that no one searches for. The second leads with what someone actually types into Google.
        </p>

        <h2>Three mistakes to fix today</h2>

        <h3>1. Leading with brand name instead of product type</h3>
        <p>
          &quot;Bloom & Co. Lavender Candle&quot; wastes your most valuable title real estate. Unless your brand is already famous, no one is searching for it. Put your product type first: &quot;Lavender Soy Candle — Bloom & Co.&quot;
        </p>

        <h3>2. Adjectives that describe feeling, not product</h3>
        <p>
          Words like &quot;beautiful,&quot; &quot;stunning,&quot; &quot;amazing,&quot; and &quot;lovely&quot; contribute nothing to search ranking. They&apos;re not what buyers type. Replace them with searchable specifics: material, size, use case, recipient.
        </p>

        <h3>3. Not using the full character limit</h3>
        <p>
          A product title of &quot;Lavender Candle&quot; (14 characters) is leaving most of your 60-character meta title unused. Every unused character is a missed opportunity to include a secondary keyword. Add: scent profile, material, size, gift occasion, key benefit.
        </p>

        <h2>A formula that works</h2>
        <p>
          For most physical products, this structure hits all the right notes:
        </p>
        <p>
          <strong>[Primary keyword] | [Secondary keyword or variant] | [Key attribute] | [Benefit or occasion]</strong>
        </p>
        <p>
          Example: &quot;Lavender Soy Candle | Hand-Poured | Calming Scent | Gift for Mum&quot; (55 characters)
        </p>
        <p>
          You get four keyword opportunities in 55 characters, with room to spare. The shopper learns exactly what it is, what it&apos;s made of, and who it&apos;s for — before they even click.
        </p>

        <h2>Shopify search vs Google search</h2>
        <p>
          Shopify&apos;s internal search algorithm uses a combination of your product title, tags, and description to match searches on your store. Google uses your meta title, meta description, and body content.
        </p>
        <p>
          You need to optimise for both. The product title feeds Shopify&apos;s own search. The meta title feeds Google. They don&apos;t have to be identical — but the primary keyword should appear in both.
        </p>
      </div>

      <div className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-6">
        <p className="font-semibold text-foreground mb-1">Want your Shopify titles fixed automatically?</p>
        <p className="text-sm text-muted-foreground mb-4">
          SellWise knows Shopify&apos;s SEO rules — character limits, keyword placement, banned adjectives. Describe your product and get an optimised title, meta title, and description in 30 seconds. Scored 0–100.
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
