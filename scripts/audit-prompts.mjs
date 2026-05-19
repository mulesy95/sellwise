import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const apiKey = env.match(/ANTHROPIC_API_KEY=(.+)/)?.[1]?.trim();
const client = new Anthropic({ apiKey });

const WRITING_RULES = `Writing rules:
- NEVER invent product details that were not provided. Only use details from the seller's input or visually confirmed in the product image (if one was supplied). No made-up dimensions, colours, materials, features, or condition claims.
- NEVER invent lifestyle or aesthetic claims — do not say a product "looks great on a wall", "makes a statement", "starts a conversation", or any other made-up social/lifestyle context that wasn't in the input.
- NEVER make editorial verdicts or value judgements — do not say a product "earns a second look", "rewards a close look", "delivers in full", "is worth buying", "worth picking over", or any other claim that tells the buyer what to think. Every sentence must describe the product, not evaluate it.
- NEVER infer product quantities, set sizes, or bundle compositions from an image.
- NEVER infer product specs from visual cues in an image.
- If a detail would strengthen the copy but isn't known, write around it rather than guessing.
- NEVER include the platform name in any output field.
- Use the exact product name as given.
- NEVER use em dashes (—), en dashes (–), or ellipses (…)
- Write like a real person: short sentences, plain punctuation (commas, full stops, exclamation marks only)
- No buzzwords or their adverb/adjective forms: unique, stunning, beautiful, beautifully, perfect, perfectly, seamlessly, elevate, elevating, enhance, enhancing, exceptional, premium, top-notch`;

const PROMPTS = {
  etsy: `You are an Etsy SEO specialist and conversion copywriter. Etsy buyers search by occasion, recipient, and style — write to rank AND make someone stop scrolling.

Description:
- Open with the occasion, recipient, or feeling the seller described — use their words, not invented ones
- Weave materials and care details in naturally, not as a spec sheet
- End with a warm call to action
- Draw emotional framing only from what the seller provided. Do not invent physical sensations, invented reactions, or editorial verdicts (e.g. "works beautifully as a gift", "the kind of thing someone keeps").
- NEVER use "beautiful", "beautifully", "stunning", or any other word that evaluates the product's appearance.

Return ONLY a valid JSON object:
{
  "title": "max 140 chars, keyword-front-loaded, reads as a natural phrase using connective words (for, with, and) — never comma-separate keywords",
  "tags": ["exactly 13 tags", "HARD LIMIT: every tag must be 20 characters or fewer — count every letter and space before writing each tag, do not exceed 20", "mix of short and long-tail buyer search phrases", "no repeated words across tags"],
  "description": "150–250 words, occasion-first opening using the seller's stated buyer or occasion, product details woven in, warm call to action"
}

${WRITING_RULES}
Return only the JSON object, no markdown.`,

  amazon: `You are an Amazon FBA listing specialist. A10 rewards relevance and sales velocity — every word must earn its place.

Return ONLY a valid JSON object:
{
  "title": "max 200 chars — lead with brand or product type, include primary keyword, colour/size if relevant",
  "bullets": ["exactly 5 bullets", "each max 255 chars", "start each with a 2–3 word benefit in CAPS then a colon", "keyword-rich but reads naturally"],
  "backendKeywords": "space-separated, max 250 bytes total, no words already in title or bullets, purchase-intent terms only",
  "description": "150–250 words, expands on bullets, covers use cases and who this is for"
}

${WRITING_RULES}
Return only the JSON object, no markdown.`,

  shopify: `You are a Shopify SEO and conversion copywriter. Goal: rank in Google AND convert a mobile browser in the first scroll.

Description:
- Open with the single most specific, striking detail unique to this product
- 2–3 sentence paragraphs for mobile readability
- End with a factual detail that closes the sale — not a verdict or opinion

Return ONLY a valid JSON object:
{
  "metaTitle": "max 60 chars strictly — exact product name first, most distinctive detail if space allows",
  "metaDescription": "max 160 chars strictly — primary keyword, factual description, short call to action. No value judgements.",
  "productTitle": "exact product name as given, or a clean 4–8 word title if the name is a placeholder",
  "description": "200–300 words, detail-first opening, short benefit-led paragraphs, factual closing line"
}

${WRITING_RULES}
Return only the JSON object, no markdown.`,

  ebay: `You are an eBay listing specialist. Buyers search by exact spec and compare fast — your listing must match their search term and give one reason to click.

Description:
- Lead with the single most important spec or selling point (brand, model, condition)
- Short scannable lines
- State condition honestly using only details the seller provided — do not invent wear, colour, or brightness claims
- No return policy or postage details
- If input is sparse, write a short honest description of what is known. Do not pad with circular facts or inferred compatibility claims.

Return ONLY a valid JSON object:
{
  "title": "max 80 chars — lead with brand/model/condition, keyword-rich, no ALL CAPS",
  "description": "100–200 words, key spec first, short scannable lines, condition stated if known — write less if there is less to say"
}

${WRITING_RULES}
- eBay title: buyers search exact model terms — be specific, not generic
Return only the JSON object, no markdown.`,

  woocommerce: `You are a WooCommerce SEO and conversion copywriter. WooCommerce products are indexed by Google — the copy must rank for the right terms AND convert when a buyer lands on the page.

The short description is the first copy most buyers see — it appears beside the Add to Cart button and on category grids. Make it the single most specific, compelling detail about this product in one or two tight sentences.

Return ONLY a valid JSON object:
{
  "productTitle": "exact product name as given, or a clean 4–8 word title if the name is a placeholder",
  "shortDescription": "max 150 chars — the most specific, compelling detail about this product. Factual, not a tagline.",
  "description": "200–350 words, opens with the strongest product detail, short paragraphs, key attributes woven in, ends with a factual closing line",
  "seoTitle": "max 60 chars strictly — primary keyword and product name, reads naturally",
  "seoDescription": "max 160 chars strictly — primary keyword, factual product description, soft call to action"
}

${WRITING_RULES}
Return only the JSON object, no markdown.`,

  wix: `You are a Wix eCommerce and Google SEO copywriter. Wix stores are typically visual and image-led — the description picks up where the product photo leaves off. It must rank in Google and give the buyer enough detail to buy with confidence.

Return ONLY a valid JSON object:
{
  "productTitle": "exact product name as given, or a clean 4–8 word title if the name is a placeholder",
  "description": "200–350 words, opens on the most specific and distinctive detail about this product, short paragraphs, key attributes woven in naturally, ends with a factual closing line",
  "seoTitle": "max 60 chars strictly — primary keyword and product name, reads naturally",
  "seoDescription": "max 160 chars strictly — primary keyword, factual product summary, soft call to action"
}

${WRITING_RULES}
Return only the JSON object, no markdown.`,

  squarespace: `You are a Squarespace eCommerce and Google SEO copywriter. Squarespace sellers are typically design-led, boutique, or creative brands. Buyers expect considered copy — concrete specifics over generic adjectives, confidence over hype.

Return ONLY a valid JSON object:
{
  "productTitle": "exact product name as given, or a clean 4–8 word title if the name is a placeholder",
  "description": "200–300 words, opens on the most visually or functionally distinctive detail, concise confident paragraphs, key product specifics throughout, ends with a factual closing line",
  "seoTitle": "max 60 chars strictly — primary keyword and product name, reads naturally",
  "seoDescription": "max 160 chars strictly — primary keyword, factual product description, soft call to action"
}

${WRITING_RULES}
Return only the JSON object, no markdown.`,

  tiktok: `You are a TikTok Shop listing specialist. Buyers discover products mid-scroll and make impulse decisions in seconds. The title must surface in TikTok Shop search. The description must earn a tap before they scroll past.

Title: lead with what the product IS (the searchable term), then key attributes buyers filter by. No ALL CAPS.
Description: open with the single strongest reason to buy right now, then two or three specific features in short punchy lines. End with a concrete detail that closes the impulse.

Return ONLY a valid JSON object:
{
  "title": "max 100 chars — searchable product term first, type and key attributes included",
  "description": "100–200 words, hook-first, short punchy lines, 2–3 key features, specific closing detail"
}

${WRITING_RULES}
Return only the JSON object, no markdown.`,

  social: `You are a social media product copywriter for Instagram, Facebook, Pinterest, and TikTok organic. Goal: stop the scroll, spark interest, drive a click or DM.

Caption: the hook that runs before the Instagram "more" cutoff. Open with the single most striking detail — a surprising fact, strong visual cue, or relatable scenario. Do not end with a call to action.
Post copy: expands on the caption with key product details and who it's for. End with a clear call to action (link in bio, DM to order, comment SIZE, etc.).
Hashtags: 3–4 broad reach (500k+ posts), 5–6 niche discovery (10k–200k posts), 3–4 product-specific, 2–3 audience or occasion tags.

Return ONLY a valid JSON object:
{
  "caption": "max 125 chars — hook first, specific detail, no generic opener, no call to action at the end",
  "postCopy": "100–200 words, expands on caption, key product details and who it's for, clear call to action at the end",
  "hashtags": ["exactly 20 hashtags", "no # prefix — just the word", "no spaces in any hashtag"]
}

${WRITING_RULES}
Return only the JSON object, no markdown.`,
};

const TESTS = [
  {
    platform: "etsy",
    label: "Etsy — Handmade soy candle",
    input: {
      productName: "Handmade Lavender Soy Candle",
      materials: "100% soy wax, cotton wick, dried lavender buds, lavender essential oil, 8oz glass jar",
      style: "Minimalist, clean, cottagecore",
      targetBuyer: "Gift for her, self-care, new home gift, relaxation",
      keywords: "soy candle gift, lavender candle, handmade candle, natural candle",
    },
  },
  {
    platform: "amazon",
    label: "Amazon — Stainless steel water bottle",
    input: {
      productName: "32oz Stainless Steel Water Bottle",
      materials: "18/8 food-grade stainless steel, double-wall vacuum insulation, leak-proof lid",
      style: "Matte finish, clean design",
      targetBuyer: "Gym, hiking, office, daily use",
      keywords: "insulated water bottle, stainless steel bottle, leak proof bottle, gym water bottle",
    },
  },
  {
    platform: "shopify",
    label: "Shopify — Full-grain leather wallet",
    input: {
      productName: "Slim Bifold Wallet",
      materials: "Full-grain vegetable-tanned leather, hand-stitched edges, brass hardware",
      style: "Minimalist, slim, classic",
      targetBuyer: "Men, gift for him, everyday carry",
      keywords: "slim leather wallet, bifold wallet, minimalist wallet, full grain leather",
    },
  },
  {
    platform: "ebay",
    label: "eBay — Used Sony PlayStation 5",
    input: {
      productName: "Sony PlayStation 5 Console Disc Edition",
      materials: "",
      style: "",
      targetBuyer: "",
      keywords: "PS5, PlayStation 5, Sony console, disc edition",
    },
  },
  {
    platform: "woocommerce",
    label: "WooCommerce — Bamboo cutting board",
    input: {
      productName: "Bamboo Cutting Board",
      materials: "Organic bamboo, food-safe oil finish, juice groove, 38x28cm",
      style: "Natural, minimal",
      targetBuyer: "Home cooks, kitchen gift, sustainable living",
      keywords: "bamboo cutting board, wooden chopping board, eco kitchen, sustainable kitchen",
    },
  },
  {
    platform: "wix",
    label: "Wix — Eucalyptus soy pillar candle",
    input: {
      productName: "Eucalyptus Soy Pillar Candle",
      materials: "100% soy wax, eucalyptus essential oil, unbleached cotton wick, 400g",
      style: "Minimal, natural, spa-inspired",
      targetBuyer: "Home decor, relaxation, housewarming gift",
      keywords: "soy candle, eucalyptus candle, pillar candle, natural candle, home fragrance",
    },
  },
  {
    platform: "squarespace",
    label: "Squarespace — Belgian linen cushion cover",
    input: {
      productName: "Belgian Linen Cushion Cover",
      materials: "100% Belgian linen, undyed natural colour, envelope back closure, 50x50cm",
      style: "Scandinavian minimal, textured, earthy",
      targetBuyer: "Interior styling, home decor, gift",
      keywords: "linen cushion cover, Belgian linen, minimalist cushion, natural linen",
    },
  },
  {
    platform: "tiktok",
    label: "TikTok — Cloud bubble humidifier",
    input: {
      productName: "Cloud Bubble Humidifier",
      materials: "300ml tank, ultrasonic misting, USB-C powered, LED mood light, 8-hour runtime",
      style: "Cute, aesthetic, compact",
      targetBuyer: "Bedroom, desk, home office, skincare routine",
      keywords: "humidifier, cool mist humidifier, aesthetic humidifier, desk humidifier",
    },
  },
  {
    platform: "social",
    label: "Social — Hand-painted floral tote bag",
    input: {
      productName: "Hand-Painted Floral Tote Bag",
      materials: "100% canvas cotton, acrylic paint, hand-painted floral design, reinforced handles",
      style: "Boho, artsy, one-of-a-kind",
      targetBuyer: "Gift, market day, everyday carry",
      keywords: "tote bag, canvas tote, hand painted bag, floral tote, boho bag",
    },
  },
];

const BUZZWORDS = ["unique", "stunning", "beautiful", "beautifully", "perfect", "perfectly", "seamlessly", "elevate", "elevating", "enhance", "enhancing", "exceptional", "premium quality", "top-notch", "game-changer"];
const PLATFORM_NAMES = ["shopify", "ebay", "etsy", "amazon", "woocommerce", "wix", "squarespace", "tiktok"];
const BAD_PUNCTUATION = /[—–…]/;

function check(text, label) {
  const issues = [];
  const lower = text.toLowerCase();
  if (BAD_PUNCTUATION.test(text)) issues.push(`❌ em/en dash or ellipsis in ${label}`);
  for (const w of BUZZWORDS) {
    if (lower.includes(w)) issues.push(`⚠️  buzzword "${w}" in ${label}`);
  }
  for (const p of PLATFORM_NAMES) {
    if (lower.includes(p)) issues.push(`❌ platform name "${p}" in ${label}`);
  }
  return issues;
}

async function runTest(test) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`TEST: ${test.label}`);
  console.log("=".repeat(70));

  const userMsg = [
    `Product: ${test.input.productName}`,
    test.input.materials && `Materials/techniques: ${test.input.materials}`,
    test.input.style && `Style/aesthetic: ${test.input.style}`,
    test.input.targetBuyer && `Target buyer/occasion: ${test.input.targetBuyer}`,
    test.input.keywords && `Keywords to include: ${test.input.keywords}`,
  ].filter(Boolean).join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: PROMPTS[test.platform],
    messages: [{ role: "user", content: userMsg }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";
  let result;
  try {
    result = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    result = m ? JSON.parse(m[0]) : null;
  }

  if (!result) {
    console.log("❌ FAILED TO PARSE JSON");
    console.log(raw);
    return;
  }

  const allIssues = [];

  if (test.platform === "etsy") {
    console.log(`\nTITLE (${result.title?.length} chars / 140 max):`);
    console.log(result.title);
    if (result.title?.length > 140) allIssues.push(`❌ title too long: ${result.title.length} chars`);
    allIssues.push(...check(result.title ?? "", "title"));

    console.log(`\nTAGS (${result.tags?.length} / 13 required):`);
    (result.tags ?? []).forEach((t, i) => {
      const flag = t.length > 20 ? " ⚠️ TOO LONG" : "";
      console.log(`  ${i + 1}. "${t}" (${t.length})${flag}`);
      allIssues.push(...check(t, `tag ${i + 1}`));
    });
    if (result.tags?.length !== 13) allIssues.push(`❌ tag count: ${result.tags?.length} (need 13)`);
    const overLengthTags = (result.tags ?? []).filter(t => t.length > 20);
    if (overLengthTags.length) allIssues.push(`❌ tags over 20 chars: ${overLengthTags.join(", ")}`);

    console.log(`\nDESCRIPTION (${result.description?.split(/\s+/).length} words):`);
    console.log(result.description);
    allIssues.push(...check(result.description ?? "", "description"));
  }

  if (test.platform === "amazon") {
    console.log(`\nTITLE (${result.title?.length} chars / 200 max):`);
    console.log(result.title);
    if (result.title?.length > 200) allIssues.push(`❌ title too long: ${result.title.length} chars`);
    allIssues.push(...check(result.title ?? "", "title"));

    console.log(`\nBULLETS (${result.bullets?.length} / 5 required):`);
    (result.bullets ?? []).forEach((b, i) => {
      const flag = b.length > 255 ? " ⚠️ TOO LONG" : "";
      console.log(`  ${i + 1}. [${b.length}]${flag} ${b}`);
      allIssues.push(...check(b, `bullet ${i + 1}`));
    });
    if (result.bullets?.length !== 5) allIssues.push(`❌ bullet count: ${result.bullets?.length} (need 5)`);

    console.log(`\nBACKEND KEYWORDS (${result.backendKeywords?.length} chars / 250 max):`);
    console.log(result.backendKeywords);
    if (result.backendKeywords?.length > 250) allIssues.push(`❌ backend keywords too long: ${result.backendKeywords.length} bytes`);

    console.log(`\nDESCRIPTION (${result.description?.split(/\s+/).length} words):`);
    console.log(result.description);
    allIssues.push(...check(result.description ?? "", "description"));
  }

  if (test.platform === "shopify") {
    console.log(`\nMETA TITLE (${result.metaTitle?.length} chars / 60 max):`);
    console.log(result.metaTitle);
    if (result.metaTitle?.length > 60) allIssues.push(`❌ metaTitle too long: ${result.metaTitle.length} chars`);
    allIssues.push(...check(result.metaTitle ?? "", "metaTitle"));

    console.log(`\nMETA DESCRIPTION (${result.metaDescription?.length} chars / 160 max):`);
    console.log(result.metaDescription);
    if (result.metaDescription?.length > 160) allIssues.push(`❌ metaDescription too long: ${result.metaDescription.length} chars`);
    allIssues.push(...check(result.metaDescription ?? "", "metaDescription"));

    console.log(`\nPRODUCT TITLE:`);
    console.log(result.productTitle);
    allIssues.push(...check(result.productTitle ?? "", "productTitle"));

    console.log(`\nDESCRIPTION (${result.description?.split(/\s+/).length} words):`);
    console.log(result.description);
    allIssues.push(...check(result.description ?? "", "description"));
  }

  if (test.platform === "ebay") {
    console.log(`\nTITLE (${result.title?.length} chars / 80 max):`);
    console.log(result.title);
    if (result.title?.length > 80) allIssues.push(`❌ title too long: ${result.title.length} chars`);
    allIssues.push(...check(result.title ?? "", "title"));

    console.log(`\nDESCRIPTION (${result.description?.split(/\s+/).length} words):`);
    console.log(result.description);
    allIssues.push(...check(result.description ?? "", "description"));
  }

  if (test.platform === "woocommerce") {
    console.log(`\nPRODUCT TITLE:`);
    console.log(result.productTitle);
    allIssues.push(...check(result.productTitle ?? "", "productTitle"));

    console.log(`\nSHORT DESCRIPTION (${result.shortDescription?.length} chars / 150 max):`);
    console.log(result.shortDescription);
    if (result.shortDescription?.length > 150) allIssues.push(`❌ shortDescription too long: ${result.shortDescription.length} chars`);
    allIssues.push(...check(result.shortDescription ?? "", "shortDescription"));

    console.log(`\nSEO TITLE (${result.seoTitle?.length} chars / 60 max):`);
    console.log(result.seoTitle);
    if (result.seoTitle?.length > 60) allIssues.push(`❌ seoTitle too long: ${result.seoTitle.length} chars`);
    allIssues.push(...check(result.seoTitle ?? "", "seoTitle"));

    console.log(`\nSEO DESCRIPTION (${result.seoDescription?.length} chars / 160 max):`);
    console.log(result.seoDescription);
    if (result.seoDescription?.length > 160) allIssues.push(`❌ seoDescription too long: ${result.seoDescription.length} chars`);
    allIssues.push(...check(result.seoDescription ?? "", "seoDescription"));

    console.log(`\nDESCRIPTION (${result.description?.split(/\s+/).length} words):`);
    console.log(result.description);
    allIssues.push(...check(result.description ?? "", "description"));
  }

  if (test.platform === "wix") {
    console.log(`\nPRODUCT TITLE:`);
    console.log(result.productTitle);
    allIssues.push(...check(result.productTitle ?? "", "productTitle"));

    console.log(`\nSEO TITLE (${result.seoTitle?.length} chars / 60 max):`);
    console.log(result.seoTitle);
    if (result.seoTitle?.length > 60) allIssues.push(`❌ seoTitle too long: ${result.seoTitle.length} chars`);
    allIssues.push(...check(result.seoTitle ?? "", "seoTitle"));

    console.log(`\nSEO DESCRIPTION (${result.seoDescription?.length} chars / 160 max):`);
    console.log(result.seoDescription);
    if (result.seoDescription?.length > 160) allIssues.push(`❌ seoDescription too long: ${result.seoDescription.length} chars`);
    allIssues.push(...check(result.seoDescription ?? "", "seoDescription"));

    console.log(`\nDESCRIPTION (${result.description?.split(/\s+/).length} words):`);
    console.log(result.description);
    allIssues.push(...check(result.description ?? "", "description"));
  }

  if (test.platform === "squarespace") {
    console.log(`\nPRODUCT TITLE:`);
    console.log(result.productTitle);
    allIssues.push(...check(result.productTitle ?? "", "productTitle"));

    console.log(`\nSEO TITLE (${result.seoTitle?.length} chars / 60 max):`);
    console.log(result.seoTitle);
    if (result.seoTitle?.length > 60) allIssues.push(`❌ seoTitle too long: ${result.seoTitle.length} chars`);
    allIssues.push(...check(result.seoTitle ?? "", "seoTitle"));

    console.log(`\nSEO DESCRIPTION (${result.seoDescription?.length} chars / 160 max):`);
    console.log(result.seoDescription);
    if (result.seoDescription?.length > 160) allIssues.push(`❌ seoDescription too long: ${result.seoDescription.length} chars`);
    allIssues.push(...check(result.seoDescription ?? "", "seoDescription"));

    console.log(`\nDESCRIPTION (${result.description?.split(/\s+/).length} words):`);
    console.log(result.description);
    allIssues.push(...check(result.description ?? "", "description"));
  }

  if (test.platform === "tiktok") {
    console.log(`\nTITLE (${result.title?.length} chars / 100 max):`);
    console.log(result.title);
    if (result.title?.length > 100) allIssues.push(`❌ title too long: ${result.title.length} chars`);
    allIssues.push(...check(result.title ?? "", "title"));

    console.log(`\nDESCRIPTION (${result.description?.split(/\s+/).length} words):`);
    console.log(result.description);
    allIssues.push(...check(result.description ?? "", "description"));
  }

  if (test.platform === "social") {
    console.log(`\nCAPTION (${result.caption?.length} chars / 125 max):`);
    console.log(result.caption);
    if (result.caption?.length > 125) allIssues.push(`❌ caption too long: ${result.caption.length} chars`);
    allIssues.push(...check(result.caption ?? "", "caption"));

    console.log(`\nPOST COPY (${result.postCopy?.split(/\s+/).length} words):`);
    console.log(result.postCopy);
    allIssues.push(...check(result.postCopy ?? "", "postCopy"));

    console.log(`\nHASHTAGS (${result.hashtags?.length} / 20 required):`);
    (result.hashtags ?? []).forEach((h, i) => {
      const hasHash = h.startsWith("#");
      const hasSpace = h.includes(" ");
      console.log(`  ${i + 1}. ${h}${hasHash ? " ⚠️ HAS #" : ""}${hasSpace ? " ⚠️ HAS SPACE" : ""}`);
      if (hasHash) allIssues.push(`❌ hashtag has # prefix: ${h}`);
      if (hasSpace) allIssues.push(`❌ hashtag has space: ${h}`);
    });
    if (result.hashtags?.length !== 20) allIssues.push(`❌ hashtag count: ${result.hashtags?.length} (need 20)`);
  }

  console.log("\n--- ISSUES ---");
  if (allIssues.length === 0) {
    console.log("✅ No issues found");
  } else {
    allIssues.forEach(i => console.log(i));
  }
}

for (const test of TESTS) {
  await runTest(test);
}
console.log("\n\nAudit complete.");
