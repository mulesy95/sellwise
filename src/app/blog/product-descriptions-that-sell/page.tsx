import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Write Product Descriptions That Actually Sell — SellWise",
  description:
    "Most product descriptions describe the product. The ones that convert describe what it does for the buyer. Here's the difference — and how to write them.",
  openGraph: {
    title: "How to Write Product Descriptions That Actually Sell",
    description:
      "Most product descriptions describe the product. The ones that convert describe what it does for the buyer. Here's the difference — and how to write them.",
    url: "/blog/product-descriptions-that-sell",
    images: [{ url: "/api/og?title=How+to+Write+Product+Descriptions+That+Actually+Sell", width: 1200, height: 630, alt: "Product Descriptions That Sell" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Write Product Descriptions That Actually Sell",
    description:
      "Most product descriptions describe the product. The ones that convert describe what it does for the buyer. Here's the difference — and how to write them.",
    images: ["/api/og?title=How+to+Write+Product+Descriptions+That+Actually+Sell"],
  },
};

export default function ProductDescriptionsThatSellPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground">16 June 2026</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">7 min read</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-tight mb-4">
          How to Write Product Descriptions That Actually Sell
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Most product descriptions describe the product. The ones that convert describe what it does for the buyer. Here&apos;s the difference — and how to write them.
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>
          A product description has two jobs. It gets indexed by search algorithms — so it needs keywords. And it convinces someone who&apos;s already looking at your listing to add it to their cart — so it needs to speak to the buyer.
        </p>
        <p>
          Most sellers only do one of these well. They either keyword-stuff a description until it reads like a spec sheet, or they write something warm and human but forget that the algorithm is reading too. The best product descriptions do both at once — and it&apos;s not as hard as it sounds.
        </p>

        <h2>The biggest mistake: writing for yourself, not the buyer</h2>
        <p>
          When sellers describe their products, they naturally talk about what they know: the material they sourced, the technique they use, the hours that went into it. That information might be interesting. But it&apos;s not what a buyer is asking when they look at your listing.
        </p>
        <p>
          A buyer is asking one question: <em>is this right for me?</em>
        </p>
        <p>
          They want to know what the product does for them — what it feels like, who it&apos;s for, what problem it solves, what it replaces. They want to see themselves using it. Features get a buyer&apos;s attention. Benefits get their money.
        </p>

        <h2>The &ldquo;so what?&rdquo; test</h2>
        <p>
          Take any feature in your current description and ask &ldquo;so what?&rdquo; until you get to the thing the buyer actually cares about.
        </p>
        <p>
          &ldquo;Made from 100% natural soy wax.&rdquo;<br />
          So what?<br />
          &ldquo;Burns cleaner than paraffin.&rdquo;<br />
          So what?<br />
          &ldquo;No black soot on your walls and no headache after an hour.&rdquo;
        </p>
        <p>
          That last sentence is worth writing down. The first one isn&apos;t. &ldquo;Natural soy wax&rdquo; is a material. &ldquo;No headache after an hour&rdquo; is a reason to buy.
        </p>
        <p>
          Run every feature in your description through this test. Keep going until you hit something the buyer would feel — physically, financially, emotionally. That&apos;s what belongs in your copy.
        </p>

        <h2>Lead with desire, not product</h2>
        <p>
          Most descriptions open with what the product is. The ones that convert open with what the buyer wants.
        </p>
        <p>
          Weak opener: &ldquo;This is a hand-poured soy candle made with lavender essential oil.&rdquo;<br />
          Strong opener: &ldquo;For the person who needs an hour to themselves.&rdquo;
        </p>
        <p>
          The second sentence stops the right buyer mid-scroll. It names a feeling they have. They keep reading because you&apos;ve already shown you understand what they&apos;re looking for.
        </p>
        <p>
          This doesn&apos;t mean burying the product. After the hook, tell them what it is and why it delivers on the promise:
        </p>
        <p>
          &ldquo;For the person who needs an hour to themselves. A hand-poured soy candle in a weighted glass jar, scented with real dried lavender. Burns clean for 45 hours — no headache, no soot, just a long quiet burn that fills the room without overpowering it.&rdquo;
        </p>
        <p>
          That&apos;s three sentences. It hooks, explains, and sells — all without a single word like &ldquo;beautiful&rdquo; or &ldquo;amazing.&rdquo;
        </p>

        <h2>Write for mobile first</h2>
        <p>
          Most marketplace shopping happens on a phone. On mobile, buyers see 2–3 sentences of your description before they have to tap &ldquo;read more.&rdquo; Most don&apos;t.
        </p>
        <p>
          That means your opening paragraph needs to work standalone. If someone only reads your first 50 words and nothing else, do they know what the product is, who it&apos;s for, and why it&apos;s worth buying?
        </p>
        <p>
          Write the opening of your description as if it&apos;s the only thing a buyer will see. The rest is for the people who keep reading — and they&apos;ll convert at higher rates anyway.
        </p>

        <h2>Platform differences: what each one actually wants</h2>
        <p>
          The principles above apply everywhere. But the format and length requirements are different on every platform.
        </p>

        <h3>Etsy</h3>
        <p>
          The first 160 characters of your Etsy description appear as the search snippet in Google results — before a buyer even clicks. Make those 160 characters count. Lead with your primary keyword and a benefit. Save the longer storytelling for further down.
        </p>
        <p>
          Etsy buyers respond to sensory and emotional language more than any other platform. They&apos;re often buying for themselves or as a gift. Describe how it feels, how it smells, what it looks like in the room. A phrase like &ldquo;the kind of candle you light when the day needs to be over&rdquo; lands on Etsy in a way it wouldn&apos;t on Amazon.
        </p>
        <p>
          Aim for 300–500 characters. Short enough to read on mobile, long enough to cover the key angles.
        </p>

        <h3>Amazon</h3>
        <p>
          Amazon buyers are more purchase-intent driven. They&apos;ve often already decided to buy the type of product — they&apos;re comparing options. Your description should resolve the remaining doubts: size, compatibility, quality, returns.
        </p>
        <p>
          Amazon gives you 2,000 characters. Use them to support the bullet points — go deeper on the claims you made there. If a bullet says &ldquo;burns 45 hours,&rdquo; the description can explain how (soy wax, cotton wick, no additives that speed up burn rate).
        </p>
        <p>
          The description is less prominent than the bullets on Amazon — most buyers won&apos;t reach it. But it gets indexed, so keyword inclusion matters. If you have Brand Registry, replace the description with A+ Content — it outperforms plain text significantly.
        </p>

        <h3>Shopify</h3>
        <p>
          On Shopify, you control two separate fields: the product description (shown on the product page) and the meta description (shown in Google search results). They serve different purposes.
        </p>
        <p>
          The meta description should be 150–160 characters, keyword-included, and written to earn the click from a search result page. Think of it as an ad headline — it needs to compete with every other result on the page.
        </p>
        <p>
          The product description can be longer and richer. Shopify supports HTML, so you can use headings, bullet lists, and bold text to break it up. Good Shopify descriptions cover: what it is (first paragraph), why it&apos;s worth buying (benefits), who it&apos;s for, and key specs or dimensions at the end.
        </p>

        <h3>eBay</h3>
        <p>
          eBay buyers want confidence, not persuasion. They scan descriptions for: condition, exact specifications, what&apos;s included, and shipping/returns information. Get to those facts fast.
        </p>
        <p>
          Use short lines. No large blocks of paragraph text — they don&apos;t get read. State the condition clearly in the first line. List key specs as individual lines. Mention shipping timeframe and return policy. eBay&apos;s algorithm also reads description text for search ranking, so include your key search terms naturally.
        </p>
        <p>
          An eBay description isn&apos;t the place for storytelling. It&apos;s the place for specifics that overcome the objections a buyer has before they commit.
        </p>

        <h2>Things to never write in a product description</h2>
        <ul>
          <li><strong>Banned adjectives</strong> — &ldquo;beautiful,&rdquo; &ldquo;amazing,&rdquo; &ldquo;stunning,&rdquo; &ldquo;lovely,&rdquo; &ldquo;perfect.&rdquo; These say nothing specific and every competitor uses them. They signal to algorithms that your description is low-quality.</li>
          <li><strong>Passive openers</strong> — &ldquo;This is a...&rdquo; or &ldquo;Introducing our new...&rdquo; or &ldquo;Meet the...&rdquo; Weak, forgettable, and wasted real estate on mobile.</li>
          <li><strong>Claims you can&apos;t prove</strong> — &ldquo;best quality,&rdquo; &ldquo;top rated,&rdquo; &ldquo;premium.&rdquo; If you don&apos;t have evidence, don&apos;t say it. Buyers have seen these words on a thousand listings. They don&apos;t trust them.</li>
          <li><strong>Details that don&apos;t exist</strong> — don&apos;t invent specific details about a product you haven&apos;t given enough information about. Writing &ldquo;ships in 24 hours&rdquo; or &ldquo;available in 8 colours&rdquo; when those aren&apos;t true creates returns and disputes.</li>
          <li><strong>Your personal story when it&apos;s not relevant</strong> — &ldquo;I started making these candles in my kitchen in 2018...&rdquo; might work as an About page. It doesn&apos;t belong in a product description unless the origin story is genuinely part of the value proposition.</li>
        </ul>

        <h2>A structure that works across platforms</h2>
        <p>
          When in doubt, use this order:
        </p>
        <ol>
          <li><strong>Hook</strong> — name the desire or the person this is for. One sentence.</li>
          <li><strong>What it is</strong> — clear product statement with the primary keyword. One to two sentences.</li>
          <li><strong>Why it&apos;s worth it</strong> — two or three benefits, written as outcomes the buyer will experience, not features you&apos;re proud of.</li>
          <li><strong>Specs and details</strong> — size, material, what&apos;s included, care instructions. These go last because buyers who need them will look for them, and buyers who don&apos;t won&apos;t be put off by having to scroll past.</li>
        </ol>
        <p>
          Total length: 150–400 words depending on platform. On mobile, less is almost always more.
        </p>
      </div>

      <div className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-6">
        <p className="font-semibold text-foreground mb-1">Get descriptions written to each platform&apos;s rules</p>
        <p className="text-sm text-muted-foreground mb-4">
          SellWise writes product descriptions that follow each platform&apos;s format — Etsy&apos;s first-160-chars rule, Amazon&apos;s benefit-led structure, Shopify&apos;s meta description field, eBay&apos;s scannable short-line style. Describe your product and get a complete, scored listing in 30 seconds.
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
