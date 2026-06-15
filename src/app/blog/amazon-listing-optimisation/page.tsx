import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Amazon Listing Optimisation: Titles, Bullets, and Backend Keywords — SellWise",
  description:
    "Amazon's algorithm ranks by click-through and conversion rate. Here's how to write listings that earn both.",
  openGraph: {
    title: "Amazon Listing Optimisation: Titles, Bullets, and Backend Keywords",
    description:
      "Amazon's algorithm ranks by click-through and conversion rate. Here's how to write listings that earn both.",
    url: "/blog/amazon-listing-optimisation",
    images: [{ url: "/api/og?title=Amazon+Listing+Optimisation", width: 1200, height: 630, alt: "Amazon Listing Optimisation" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Amazon Listing Optimisation: Titles, Bullets, and Backend Keywords",
    description:
      "Amazon's algorithm ranks by click-through and conversion rate. Here's how to write listings that earn both.",
    images: ["/api/og?title=Amazon+Listing+Optimisation"],
  },
};

export default function AmazonListingOptimisationPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            Amazon
          </span>
          <span className="text-xs text-muted-foreground">13 June 2026</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">8 min read</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
          Amazon Listing Optimisation: Titles, Bullets, and Backend Keywords
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Amazon&apos;s algorithm ranks by click-through and conversion rate. Here&apos;s how to write listings that earn both.
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          Amazon&apos;s A10 algorithm is different from every other marketplace algorithm. It doesn&apos;t just rank by keyword relevance — it ranks by what actually converts. A listing that gets clicked and then purchased rises in rankings. A listing that ranks but doesn&apos;t convert falls.
        </p>
        <p>
          That means Amazon listing optimisation is two jobs at once: get into search results (relevance) and close the sale once you&apos;re there (conversion). Every element of your listing needs to do both.
        </p>

        <h2>Title: 200 characters, brand first</h2>
        <p>
          Amazon gives you up to 200 characters for your product title (varies slightly by category). Unlike Etsy or eBay where you might choose between brand and product type, Amazon has a clear convention: brand name goes first.
        </p>
        <p>
          The standard Amazon title formula is:
        </p>
        <p>
          <strong>[Brand] [Product Type] [Key Feature] [Size/Quantity/Variant] [Secondary Keywords]</strong>
        </p>
        <p>
          Example: &quot;Naturemade Lavender Soy Candle — Hand-Poured, 250g — Calming Scent for Bedroom, Meditation Gift for Women&quot; (96 characters)
        </p>
        <p>
          Amazon&apos;s mobile app truncates titles at around 80 characters in search results — so your primary keywords need to appear in the first 80 characters. The rest of the title still contributes to search ranking, it just won&apos;t be visible to mobile shoppers until they click.
        </p>
        <p>
          What to avoid in Amazon titles:
        </p>
        <ul>
          <li>Promotional language (&quot;best seller,&quot; &quot;top rated,&quot; &quot;#1&quot;) — Amazon may suppress these</li>
          <li>Price, shipping speed, or availability — not allowed in titles</li>
          <li>All caps (except abbreviations)</li>
          <li>Special characters like ! or $</li>
          <li>Subjective claims (&quot;amazing quality,&quot; &quot;beautiful&quot;)</li>
        </ul>

        <h2>Bullet points: 5 benefit-led points, up to 255 characters each</h2>
        <p>
          Amazon gives you 5 bullet points (sometimes called &quot;key product features&quot;). Most sellers treat these as a feature list. Buyers read them as a shortlist of reasons to buy.
        </p>
        <p>
          The structure that converts best: <strong>lead with the benefit, support with the feature.</strong>
        </p>
        <p>
          Bad bullet (feature-led): &quot;Made from 100% natural soy wax blended with lavender essential oil&quot;<br />
          Good bullet (benefit-led): &quot;BURNS CLEAN FOR 45 HOURS — Natural soy wax and lavender essential oil mean no toxic chemicals, no black soot, just a long, clean burn that fills your room without the headache.&quot;
        </p>
        <p>
          Notice the convention: many Amazon sellers begin bullets with a short CAPS PHRASE that summarises the benefit, then expand on it. This works well because buyers scan bullets rather than reading them — the caps phrase acts as a headline.
        </p>
        <p>
          What to cover across your 5 bullets:
        </p>
        <ol>
          <li>Primary benefit or key feature (what makes this worth buying)</li>
          <li>Materials, quality, or manufacturing (why it&apos;s good quality)</li>
          <li>Size, dimensions, or compatibility (answers the &quot;will this work for me?&quot; question)</li>
          <li>Use case or who it&apos;s for (helps buyers self-identify)</li>
          <li>Gift suitability, packaging, or guarantee (reduces purchase risk)</li>
        </ol>

        <h2>Backend keywords: 250 bytes, no repeats</h2>
        <p>
          Backend keywords are invisible to buyers but indexed by Amazon&apos;s algorithm. They&apos;re your chance to rank for terms that don&apos;t fit naturally in your title or bullets.
        </p>
        <p>
          Amazon gives you 250 bytes (roughly 250 characters for standard ASCII text). Key rules:
        </p>
        <ul>
          <li><strong>No repetition</strong> — if &quot;lavender&quot; is in your title, don&apos;t use it in backend keywords. Amazon already knows. Repeating wastes your byte budget.</li>
          <li><strong>No commas needed</strong> — separate keywords with spaces. Amazon reads it as individual terms.</li>
          <li><strong>Include synonyms and variations</strong> — if your title says &quot;soy candle,&quot; backend keywords might include &quot;wax melt&quot; or &quot;scented candle&quot;</li>
          <li><strong>Include common misspellings</strong> — unlike Etsy, Amazon doesn&apos;t automatically handle typos in backend keywords</li>
          <li><strong>Don&apos;t include competitor brand names</strong> — Amazon may suppress your listing</li>
        </ul>
        <p>
          Good backend keywords for our candle example: &quot;aromatherapy relaxing sleep aid bedroom scent anniversary mum gift women stress relief meditation yoga&quot;
        </p>

        <h2>Description: 2,000 characters or A+ Content</h2>
        <p>
          The product description appears below the fold — most buyers won&apos;t scroll to it. But it does get indexed by Amazon, so include your secondary keywords here.
        </p>
        <p>
          If you have Amazon Brand Registry (which requires a registered trademark), you get access to A+ Content — an enhanced description with images, comparison tables, and formatted sections. A+ Content significantly improves conversion rate and is worth pursuing once you have brand registry.
        </p>
        <p>
          Without A+ Content, write a description that covers: what the product does, what it&apos;s made from, who it&apos;s for, and why it&apos;s better than alternatives. Keep sentences short. Amazon&apos;s description field supports basic HTML (bold, line breaks) in some categories.
        </p>

        <h2>The conversion side: what the algorithm really watches</h2>
        <p>
          A10 weights conversion rate and velocity (sales per day) alongside keyword relevance. That means a listing that sells well for one keyword can rise in rankings for other keywords it&apos;s only loosely optimised for.
        </p>
        <p>
          The practical implication: your first listing optimisation task is to make the listing convert once buyers land on it. High-quality images, accurate descriptions, competitive pricing, and genuine reviews matter as much as keyword placement.
        </p>
        <p>
          A listing with a 15% conversion rate will outrank a keyword-stuffed listing with a 3% conversion rate, even if the weaker listing has better title keywords.
        </p>
      </div>

      <div className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-6">
        <p className="font-semibold text-foreground mb-1">Write Amazon listings that rank and convert</p>
        <p className="text-sm text-muted-foreground mb-4">
          SellWise knows Amazon&apos;s formatting rules — 200-character title with brand first, 5 benefit-led bullets up to 255 characters each, and a full backend keyword set with no repeats. Describe your product and get a complete listing in 30 seconds.
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
