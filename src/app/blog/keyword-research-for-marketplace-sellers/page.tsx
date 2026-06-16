import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Keyword Research for Marketplace Sellers: How to Find the Terms That Drive Sales — SellWise",
  description:
    "Marketplace keyword research is different from Google SEO. Here's how to find the terms buyers actually use — and where to put them.",
  openGraph: {
    title: "Keyword Research for Marketplace Sellers: How to Find the Terms That Drive Sales",
    description:
      "Marketplace keyword research is different from Google SEO. Here's how to find the terms buyers actually use — and where to put them.",
    url: "/blog/keyword-research-for-marketplace-sellers",
    images: [{ url: "/api/og?title=Keyword+Research+for+Marketplace+Sellers", width: 1200, height: 630, alt: "Keyword Research for Marketplace Sellers" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Keyword Research for Marketplace Sellers: How to Find the Terms That Drive Sales",
    description:
      "Marketplace keyword research is different from Google SEO. Here's how to find the terms buyers actually use — and where to put them.",
    images: ["/api/og?title=Keyword+Research+for+Marketplace+Sellers"],
  },
};

export default function KeywordResearchForMarketplaceSellersPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground">16 June 2026</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">8 min read</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
          Keyword Research for Marketplace Sellers: How to Find the Terms That Drive Sales
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Marketplace keyword research is different from Google SEO. Here&apos;s how to find the terms buyers actually use — and where to put them.
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          When a buyer searches on Etsy, eBay, or Amazon, they don&apos;t search the same way they&apos;d search on Google. They&apos;re not looking for information. They&apos;re ready to buy. That changes everything about which keywords matter — and how to find them.
        </p>
        <p>
          The seller who ranks at the top of marketplace search usually isn&apos;t the one with the most keywords. They&apos;re the one whose keywords most precisely match what a buyer typed at the exact moment they were ready to spend money.
        </p>

        <h2>Why marketplace search is different from Google</h2>
        <p>
          Google SEO is about ranking content against informational queries — &ldquo;how to clean a wool rug,&rdquo; &ldquo;best laptop for university.&rdquo; The buyer might be months away from a purchase.
        </p>
        <p>
          Marketplace search is almost entirely purchase intent. Everyone on Etsy is there to buy something. Every search on eBay or Amazon is a shopping session. The keywords buyers use there are more specific, more descriptive, and much closer to a transaction.
        </p>
        <p>
          That means broad head terms — &ldquo;candle,&rdquo; &ldquo;bag,&rdquo; &ldquo;necklace&rdquo; — are almost useless. You&apos;ll never rank for them against millions of competing listings. And even if you did, the buyer searching for just &ldquo;candle&rdquo; doesn&apos;t know what they want yet. They&apos;re not close enough to buying.
        </p>
        <p>
          The keywords that drive actual sales are the ones buyers use when they know exactly what they want: &ldquo;lavender soy candle gift for mum,&rdquo; &ldquo;vintage Levi&apos;s denim jacket size M,&rdquo; &ldquo;sterling silver initial necklace personalised.&rdquo;
        </p>

        <h2>Head terms vs long-tail keywords</h2>
        <p>
          A <strong>head term</strong> is short and broad: &ldquo;candle,&rdquo; &ldquo;dress,&rdquo; &ldquo;watch.&rdquo; Millions of searches per month. Millions of competing listings. Near-impossible to rank for without an established sales history.
        </p>
        <p>
          A <strong>long-tail keyword</strong> is specific: &ldquo;hand-poured lavender soy candle 250g,&rdquo; &ldquo;bohemian maxi dress size 12 floral,&rdquo; &ldquo;men&apos;s vintage Seiko automatic watch 1970s.&rdquo; Fewer searches per month — but the people searching are ready to buy, and there&apos;s far less competition.
        </p>
        <p>
          Most of your sales will come from long-tail keywords. A listing that ranks #3 for &ldquo;lavender soy candle gift for mum&rdquo; will outsell a listing that ranks #47 for &ldquo;candle.&rdquo;
        </p>
        <p>
          The goal isn&apos;t to find the highest-volume keywords. It&apos;s to find the highest-volume keywords you can actually rank for — and that means going specific.
        </p>

        <h2>How buyers search on each platform</h2>
        <p>
          Each marketplace has its own search culture. Knowing how buyers think on each platform tells you which keyword types to prioritise.
        </p>

        <h3>Etsy</h3>
        <p>
          Etsy buyers search by occasion, recipient, and aesthetic more than product type. They type things like &ldquo;birthday gift for best friend,&rdquo; &ldquo;cottagecore bedroom decor,&rdquo; &ldquo;mother&apos;s day gift from daughter.&rdquo; They often don&apos;t know exactly what they want — they&apos;re browsing for something that feels right.
        </p>
        <p>
          This means your Etsy keyword research should focus on three angles: what the product is (lavender soy candle), who it&apos;s for (gift for mum, gift for her), and what feeling or aesthetic it fits (relaxation gift, minimalist home decor, self care gift). All three types belong in your tags.
        </p>

        <h3>Amazon</h3>
        <p>
          Amazon buyers are comparison shopping. They&apos;ve already decided on a product category — they&apos;re choosing between listings. Their searches are more specific and feature-driven: &ldquo;soy wax candle set 3 pack,&rdquo; &ldquo;lavender essential oil candle 50 hour burn time,&rdquo; &ldquo;scented candle gift set for women birthday.&rdquo;
        </p>
        <p>
          Amazon keyword research should surface the specific attributes buyers filter by: size, quantity, material, scent, burn time, brand, use case. These are the terms that appear in your title and bullets — and in your backend keywords for every variant a buyer might search for but that doesn&apos;t fit naturally into your copy.
        </p>

        <h3>eBay</h3>
        <p>
          eBay buyers search like they&apos;re describing an object to someone who&apos;s never seen it. They include brand, model, size, condition, and colour in their search — often all at once. &ldquo;Nike Air Max 90 size 10 white infrared,&rdquo; &ldquo;vintage Singer sewing machine 1960s,&rdquo; &ldquo;iPhone 14 Pro 256GB unlocked Space Black.&rdquo;
        </p>
        <p>
          For eBay, the most important keywords are the specific identifiers: exact brand name, model number or variant name, size (using the format buyers search — &ldquo;W32 L32&rdquo; not &ldquo;32 waist&rdquo;), condition, and colour or material. Generic keywords are less useful here than precise product identifiers.
        </p>

        <h3>Shopify</h3>
        <p>
          Shopify products get found through Google search as well as Shopify&apos;s internal search. Google keyword research applies here — buyers search with more intent-specific phrases like &ldquo;buy lavender soy candle online Australia,&rdquo; &ldquo;hand-poured candle free shipping.&rdquo; Your meta title and meta description need to match those queries.
        </p>
        <p>
          Shopify&apos;s internal search is less sophisticated than marketplace algorithms — it matches product titles, tags, and descriptions. Make sure your key terms appear in the product title and in your Shopify tags (separate from your SEO meta fields).
        </p>

        <h2>Finding keywords without paid tools</h2>
        <p>
          You don&apos;t need a $100/month subscription to do effective keyword research. The platforms themselves are the most accurate sources of buyer search data — because they&apos;re showing you what their buyers actually type.
        </p>

        <h3>Search autocomplete</h3>
        <p>
          Open the marketplace and start typing your product name into the search bar. Don&apos;t press enter — watch what autocomplete suggests. Those suggestions are ranked by search frequency. They&apos;re telling you exactly what buyers type most often.
        </p>
        <p>
          Try variations: start with just the product type, then add a modifier (&ldquo;lavender candle g...&rdquo; to see if &ldquo;gift&rdquo; completes it), then try leading with an occasion (&ldquo;birthday gift candle...&rdquo;). Each starting point reveals a different cluster of buyer searches.
        </p>

        <h3>Competitor listings</h3>
        <p>
          Find a listing that&apos;s ranking well for your product type. Read their title and tags carefully. You&apos;re not looking to copy — you&apos;re looking for keyword patterns you haven&apos;t thought of yet. If three top-ranking listings all include &ldquo;meditation candle,&rdquo; that&apos;s a term buyers are searching for.
        </p>
        <p>
          On Etsy, you can see tags by viewing a listing&apos;s page source (right-click → View Page Source, then search for &ldquo;tag&rdquo;). On Amazon, competitor backend keywords aren&apos;t visible — but title and bullet keywords are.
        </p>

        <h3>Related searches and &ldquo;customers also bought&rdquo;</h3>
        <p>
          After searching on Amazon or eBay, scroll to the bottom of the results page. The &ldquo;related searches&rdquo; and &ldquo;customers also searched for&rdquo; sections show adjacent keyword clusters — product types buyers consider alongside yours.
        </p>
        <p>
          These adjacent terms can reveal sub-categories your listing should also rank for. If buyers who search for &ldquo;lavender candle&rdquo; also commonly search for &ldquo;aromatherapy gift set,&rdquo; that&apos;s a keyword cluster worth including in your tags or backend keywords.
        </p>

        <h2>Volume vs competition: the trade-off every seller faces</h2>
        <p>
          Every keyword sits somewhere on a spectrum between high volume (many buyers search for it) and high competition (many listings compete for it). The two are almost always correlated — popular keywords attract more sellers.
        </p>
        <p>
          For new or low-history listings, target the middle: keywords with moderate volume and moderate competition. You can&apos;t rank for &ldquo;candle&rdquo; against a listing with 10,000 reviews. But you might rank for &ldquo;hand-poured lavender soy candle gift box&rdquo; even on day one, because fewer listings optimise for that specific phrase.
        </p>
        <p>
          As your listing accumulates sales and reviews, it earns ranking authority. Then you can target slightly higher-volume terms. Think of keyword strategy as a ladder — start specific, earn authority, climb toward broader terms over time.
        </p>

        <h2>Where to place your keywords</h2>
        <p>
          Finding the right keywords is half the work. Placing them correctly is the other half.
        </p>
        <p>
          As a general rule across all platforms, keyword placement priority runs: <strong>title first, then tags or bullets, then description.</strong> The title carries the most ranking weight on every marketplace. A keyword that only appears in your description will rank lower than one in your title.
        </p>
        <p>
          Your primary keyword — the most specific phrase that describes exactly what you sell — should be in the first half of your title. Secondary keywords go in the second half of the title, in your tags (Etsy), bullets (Amazon), or backend keywords (Amazon). Your description picks up whatever remains, written naturally.
        </p>
        <p>
          One mistake to avoid: keyword stuffing. A title like &ldquo;candle lavender soy wax hand poured gift mum birthday relaxation meditation aromatherapy scented&rdquo; reads as spam. Algorithms have learned to deprioritise listings that string keywords together without forming coherent phrases. Write titles and descriptions that read naturally — the keywords will be there, woven in.
        </p>

        <h2>How many keywords to target per listing</h2>
        <p>
          Most sellers try to rank for too many things at once and end up ranking well for nothing.
        </p>
        <p>
          For a single listing, focus on one primary keyword phrase and three to five secondary phrases. The primary keyword is the core of what you sell. The secondaries are variations, related use cases, and buyer intent angles.
        </p>
        <p>
          For a lavender soy candle, that might be:
        </p>
        <ul>
          <li><strong>Primary:</strong> lavender soy candle</li>
          <li><strong>Secondary:</strong> hand-poured candle gift, birthday gift for her, relaxation candle, natural wax candle, aromatherapy home fragrance</li>
        </ul>
        <p>
          That&apos;s one primary and five secondaries — enough to cover meaningful search volume across multiple buyer intents without diluting the listing&apos;s focus.
        </p>
      </div>

      <div className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-6">
        <p className="font-semibold text-foreground mb-1">Find the right keywords for your marketplace</p>
        <p className="text-sm text-muted-foreground mb-4">
          SellWise generates 15 platform-specific keywords for any product — with volume, competition, and trend signals for Shopify, eBay, Amazon, and Etsy. Save your keyword lists and pull them straight into the listing optimiser.
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
