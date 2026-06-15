import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Use Etsy Tags: Why All 13 Matter (and How to Fill Them) — SellWise",
  description:
    "Most Etsy sellers use 6 or 7 tags. That's leaving half their discoverability on the table. Here's how to use all 13 correctly.",
  openGraph: {
    title: "How to Use Etsy Tags: Why All 13 Matter (and How to Fill Them)",
    description:
      "Most Etsy sellers use 6 or 7 tags. That's leaving half their discoverability on the table. Here's how to use all 13 correctly.",
    url: "/blog/etsy-tags-guide",
    images: [{ url: "/api/og?title=How+to+Use+Etsy+Tags:+Why+All+13+Matter", width: 1200, height: 630, alt: "Etsy Tags Guide" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Use Etsy Tags: Why All 13 Matter (and How to Fill Them)",
    description:
      "Most Etsy sellers use 6 or 7 tags. That's leaving half their discoverability on the table. Here's how to use all 13 correctly.",
    images: ["/api/og?title=How+to+Use+Etsy+Tags:+Why+All+13+Matter"],
  },
};

export default function EtsyTagsGuidePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            Etsy
          </span>
          <span className="text-xs text-muted-foreground">12 June 2026</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">6 min read</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
          How to Use Etsy Tags: Why All 13 Matter (and How to Fill Them)
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Most Etsy sellers use 6 or 7 tags. That&apos;s leaving half their discoverability on the table. Here&apos;s how to use all 13 correctly.
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          Etsy gives you 13 tag slots per listing, each up to 20 characters. They&apos;re one of the most powerful ranking signals in the Cassini algorithm — and the most underused feature by new sellers.
        </p>
        <p>
          An unused tag slot is a missed ranking opportunity. There is no downside to using all 13. Every empty slot is a search term you can&apos;t rank for.
        </p>

        <h2>What Etsy tags actually do</h2>
        <p>
          When a buyer searches on Etsy, Cassini matches their query against your title, tags, attributes, and category. Tags are weighted heavily — in some cases as heavily as the title itself.
        </p>
        <p>
          Tags also catch long-tail queries that your title can&apos;t accommodate. Your title might be &quot;Lavender Soy Candle — Hand-Poured 250g&quot; (limited to ~140 characters with most of that used for your core keywords). But your tags can capture &quot;anniversary gift for her,&quot; &quot;relaxation gift,&quot; &quot;home fragrance,&quot; &quot;calming bedroom scent,&quot; and more — phrases that wouldn&apos;t fit naturally in a title but are exactly what certain buyers search.
        </p>

        <h2>The three angles every Etsy tag strategy needs</h2>
        <p>
          Etsy buyers search differently from Amazon or Google buyers. They often don&apos;t know exactly what product they want — they&apos;re browsing by feeling, occasion, or recipient. Your tags need to catch all three angles.
        </p>

        <h3>1. Product and material tags</h3>
        <p>
          Start with what the item is. Be specific:
        </p>
        <ul>
          <li>&quot;soy wax candle&quot; (not just &quot;candle&quot;)</li>
          <li>&quot;lavender essential oil&quot; (not just &quot;lavender&quot;)</li>
          <li>&quot;hand-poured candle&quot;</li>
          <li>&quot;natural wax candle&quot;</li>
        </ul>
        <p>
          Each tag can be up to 20 characters including spaces. Use multi-word tags — they match both the full phrase and the individual words.
        </p>

        <h3>2. Occasion and use tags</h3>
        <p>
          What is this item for? When would someone buy it?
        </p>
        <ul>
          <li>&quot;birthday gift for her&quot;</li>
          <li>&quot;housewarming present&quot;</li>
          <li>&quot;self care gift&quot;</li>
          <li>&quot;relaxation gift&quot;</li>
          <li>&quot;meditation candle&quot;</li>
        </ul>
        <p>
          These occasion tags catch the &quot;I need a gift for...&quot; searches that represent a huge portion of Etsy&apos;s traffic.
        </p>

        <h3>3. Recipient and style tags</h3>
        <p>
          Who is this for? What aesthetic does it match?
        </p>
        <ul>
          <li>&quot;gift for mum&quot;</li>
          <li>&quot;minimalist home decor&quot;</li>
          <li>&quot;boho bathroom&quot;</li>
          <li>&quot;cottagecore aesthetic&quot;</li>
        </ul>
        <p>
          These style and recipient tags are uniquely powerful on Etsy compared to other platforms. Etsy buyers frequently search by aesthetic — &quot;cottagecore bedroom,&quot; &quot;dark academia gift,&quot; &quot;maximalist home.&quot; If your product fits those aesthetics, use the tags.
        </p>

        <h2>The relationship between title and tags</h2>
        <p>
          Etsy&apos;s Cassini algorithm gets a small ranking boost when the same phrase appears in both your title and your tags. This is called an &quot;exact match.&quot;
        </p>
        <p>
          Don&apos;t repeat your full title as tags — that wastes slots. But do repeat your most important 2–3 keyword phrases. If your title includes &quot;lavender soy candle&quot;, have a tag that says &quot;lavender soy candle&quot; too.
        </p>
        <p>
          For your remaining tags, use phrases that don&apos;t appear in the title. Tags are your opportunity to catch searches that your title couldn&apos;t fit.
        </p>

        <h2>The 20-character limit: what it means in practice</h2>
        <p>
          Each tag can be up to 20 characters including spaces. That&apos;s long enough for multi-word phrases — which is exactly what you want.
        </p>
        <p>
          &quot;candle&quot; (6 characters) is a single-word tag. It catches everyone searching just for &quot;candle&quot; — an extremely competitive, low-intent search.
        </p>
        <p>
          &quot;lavender soy candle&quot; (19 characters) is a multi-word tag. It catches buyers who search that specific phrase — less competition, higher intent, more likely to buy.
        </p>
        <p>
          Always prefer multi-word tags over single words. They&apos;re more specific, less competitive, and better match buyer intent.
        </p>

        <h2>What not to do</h2>
        <ul>
          <li><strong>Don&apos;t repeat words across tags</strong> — &quot;candle gift&quot; and &quot;candle birthday&quot; both contain &quot;candle.&quot; Use one and give the second slot to a completely different phrase.</li>
          <li><strong>Don&apos;t use single-word tags</strong> (with rare exceptions for very specific terms like a brand name or material)</li>
          <li><strong>Don&apos;t use misspellings</strong> — Etsy&apos;s algorithm handles common typos automatically</li>
          <li><strong>Don&apos;t leave any of the 13 slots empty</strong></li>
        </ul>

        <h2>A complete 13-tag example</h2>
        <p>
          For a lavender soy candle:
        </p>
        <ol>
          <li>lavender soy candle</li>
          <li>hand-poured candle</li>
          <li>natural wax candle</li>
          <li>lavender essential oil</li>
          <li>birthday gift for her</li>
          <li>housewarming present</li>
          <li>relaxation gift</li>
          <li>self care gift</li>
          <li>meditation candle</li>
          <li>gift for mum</li>
          <li>minimalist home decor</li>
          <li>calming bedroom scent</li>
          <li>aromatherapy candle</li>
        </ol>
        <p>
          13 tags. No repeated words across tags. Three angles covered: product, occasion, recipient. Every slot used.
        </p>
      </div>

      <div className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-6">
        <p className="font-semibold text-foreground mb-1">Get all 13 Etsy tags written for you</p>
        <p className="text-sm text-muted-foreground mb-4">
          SellWise knows Etsy&apos;s rules — exactly 13 tags, max 20 characters each, no word repetition across tags. Describe your product and get a complete, optimised tag set in 30 seconds.
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
