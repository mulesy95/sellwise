import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Marketplace SEO Score Explained: What 0–100 Means for Your Listings — SellWise",
  description:
    "An SEO score puts a number on how well your listing follows each platform's algorithm rules. Here's what it measures and how to act on it.",
  openGraph: {
    title: "Marketplace SEO Score Explained: What 0–100 Means for Your Listings",
    description:
      "An SEO score puts a number on how well your listing follows each platform's algorithm rules. Here's what it measures and how to act on it.",
    url: "/blog/marketplace-seo-score",
    images: [{ url: "/api/og?title=Marketplace+SEO+Score+Explained", width: 1200, height: 630, alt: "Marketplace SEO Score Explained" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Marketplace SEO Score Explained: What 0–100 Means for Your Listings",
    description:
      "An SEO score puts a number on how well your listing follows each platform's algorithm rules. Here's what it measures and how to act on it.",
    images: ["/api/og?title=Marketplace+SEO+Score+Explained"],
  },
};

export default function MarketplaceSeoScorePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground">14 June 2026</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">6 min read</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
          Marketplace SEO Score Explained: What 0–100 Means for Your Listings
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          An SEO score puts a number on how well your listing follows each platform&apos;s algorithm rules. Here&apos;s what it measures and how to act on it.
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          Every marketplace has rules. eBay wants your title front-loaded with keywords and under 80 characters. Etsy wants exactly 13 tags, each a multi-word phrase. Amazon wants your brand first in a 200-character title, five benefit-led bullets, and 250 bytes of backend keywords.
        </p>
        <p>
          An SEO score measures how well your listing follows those rules — and packages the answer into a single number between 0 and 100.
        </p>

        <h2>What a score actually measures</h2>
        <p>
          A score isn&apos;t a guarantee of traffic. It&apos;s an assessment of compliance with platform-specific best practices. A listing that scores 85 is correctly structured and keyword-optimised for its platform. A listing that scores 40 has structural problems that are making it invisible in search.
        </p>
        <p>
          The components that go into a marketplace SEO score vary by platform, but generally include:
        </p>
        <ul>
          <li><strong>Title quality</strong> — length, keyword placement, avoidance of banned words, character limit compliance</li>
          <li><strong>Tag / keyword coverage</strong> — for Etsy, whether you&apos;ve used all 13 tags; for Amazon, whether backend keywords are properly filled</li>
          <li><strong>Description quality</strong> — length, keyword inclusion, structural formatting</li>
          <li><strong>Keyword alignment</strong> — whether your target keywords appear in the output at all</li>
          <li><strong>Platform constraint violations</strong> — anything that breaks a hard rule (e.g. an eBay title over 80 characters, or an Etsy tag over 20 characters)</li>
        </ul>

        <h2>What the score ranges mean</h2>

        <h3>0–40: Structural problems</h3>
        <p>
          A score in this range usually means a critical rule is being broken. The title might be missing primary keywords entirely, or tags aren&apos;t used, or the character limit is far exceeded. These listings are genuinely hard for the algorithm to rank — not because of content quality, but because the basic format is wrong.
        </p>
        <p>
          What to fix: check the title length and structure first. Then check whether required fields (tags, bullets, backend keywords) are filled. Fixing structural problems typically moves a score from 40 to 65+ quickly.
        </p>

        <h3>40–65: Technically present, not optimised</h3>
        <p>
          Listings in this range are usually formatted correctly but missing keyword opportunities. The title might be within length limits but front-loaded with brand name instead of product type. Tags might be used but with single-word tags instead of multi-word phrases. Bullets might be feature-led instead of benefit-led.
        </p>
        <p>
          What to fix: review where keywords appear and whether they&apos;re in the most important positions. Check whether all available slots are used (all 13 Etsy tags, all 5 Amazon bullets, all backend keyword bytes). Move from describing the product to describing who buys it and why.
        </p>

        <h3>65–80: Good, with specific gaps</h3>
        <p>
          Listings here are well-structured and keyword-rich. The remaining points are typically lost to specific deductions: a banned word in the title, a keyword from your research that didn&apos;t make it into the output, slight title/description overlap on Etsy.
        </p>
        <p>
          These listings will rank, but there&apos;s a targeted fix available. Look at what specific deductions are listed — they tell you exactly where the points went and what to change.
        </p>

        <h3>80–100: Platform-optimised</h3>
        <p>
          A score above 80 means the listing follows each platform&apos;s rules correctly, uses keywords in the right positions, covers multiple buyer intent angles, and has no structural violations. Listings at this level are set up to compete.
        </p>
        <p>
          A score above 90 is rare — it means every scored component is correctly executed. Don&apos;t optimise for a perfect score as the goal; optimise for a listing that reads well and ranks well. A 92 and an 88 are both good listings.
        </p>

        <h2>The difference between a 65 and an 85</h2>
        <p>
          The jump from 65 to 85 on most platforms typically comes from three changes:
        </p>
        <ol>
          <li><strong>Keyword front-loading</strong> — moving the most searched phrase to the first few words of the title</li>
          <li><strong>Using all available slots</strong> — filling every Etsy tag, every Amazon bullet, all backend keyword bytes</li>
          <li><strong>Covering multiple buyer intents</strong> — not just &quot;what is it&quot; but &quot;who is it for&quot; and &quot;when would someone buy it&quot;</li>
        </ol>
        <p>
          The difference in search visibility between a 65 and an 85 can be significant. Algorithms reward listings that correctly signal what they are and who should buy them.
        </p>

        <h2>Scores are platform-specific</h2>
        <p>
          An 80 on eBay and an 80 on Etsy are assessed against completely different criteria. An eBay score rewards 80-character titles with front-loaded product specifics. An Etsy score rewards 13 unique multi-word tags covering occasion, recipient, and product type.
        </p>
        <p>
          This is why platform-agnostic listing tools often produce poor results — they don&apos;t know the rules are different. A rule that improves your Amazon score (brand name in title position 1) would actively hurt your Etsy score.
        </p>

        <h2>How to use a score in practice</h2>
        <p>
          Don&apos;t treat the score as an end goal. Use it as a diagnostic.
        </p>
        <p>
          If your score is below 60: something structural is wrong. Fix the format before worrying about content quality.
        </p>
        <p>
          If your score is 60–80: the structure is right. Read the specific deductions and fix them one by one.
        </p>
        <p>
          If your score is above 80: the listing is well-optimised. Move on to improving images, pricing, and conversion rate — those factors matter more at this point than SEO score.
        </p>
      </div>

      <div className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-6">
        <p className="font-semibold text-foreground mb-1">See your listing scored in 30 seconds</p>
        <p className="text-sm text-muted-foreground mb-4">
          SellWise scores every listing it writes 0–100 against that platform&apos;s actual rules — and shows you exactly which deductions fired and why. Optimise, then audit, then improve in one place.
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
