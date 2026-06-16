/**
 * AI Output Quality Audit
 * Run: NODE_OPTIONS=--use-system-ca node --env-file=.env.local scripts/audit-output-quality.mjs
 *
 * Tests 4 real products across Etsy, Shopify, eBay, Amazon.
 * Prints raw output + automated flag check. Human review required after.
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const WRITING_RULES = `Writing rules:
- NEVER invent product details that were not provided. Only use details from the seller's input or visually confirmed in the product image (if one was supplied). No made-up dimensions, colours, materials, features, or condition claims.
- NEVER draw on your training knowledge to fill in product specifications — even if you recognise the brand or model name. The seller may be listing a used, modified, or incomplete unit. Only describe what they told you.
- NEVER invent lifestyle or aesthetic claims — do not say a product "looks great on a wall", "makes a statement", "starts a conversation", or any other made-up social/lifestyle context that wasn't in the input.
- NEVER invent emotional backstory for recipients — do not write things like "a mum who never buys anything nice for herself" or "the friend who has everything" unless the seller stated this. Stick to what the seller provided.
- NEVER make editorial verdicts or value judgements — do not say a product "earns a second look", "rewards a close look", "delivers in full", "is worth buying", "worth picking over", "the most giftable", or any other claim that tells the buyer what to think. Every sentence must describe the product, not evaluate it.
- NEVER infer product quantities, set sizes, or bundle compositions from an image — if the photo shows two boards, do not write "two boards" or imply it is a set. Describe the product individually as listed.
- NEVER infer product specs from visual cues in an image — do not describe binding insert patterns, stance width, mount setup, board shape, nose or tail geometry, directional vs twin, flex, material composition, size, or weight from what the image shows. This applies even if the feature is visible — "visible in the image" is not an exception. Only describe specs the seller explicitly stated in their input.
- Do not mention binding inserts or mount holes at all unless the seller described them in the input.
- If a brand logo or branded graphic is visible on the product in an image, describe it generically (e.g. "a bag logo", "a logo near the nose") — never name the brand or company whose logo it is.
- NEVER reference sizing, quantity options, variants, stock levels, customisation, or purchasing logistics (e.g. "available in your choice of size", "message us for sizing", "comes in multiple colours") unless the seller explicitly stated these in their input. If size or variant information is not provided, omit it entirely — do not write around it.
- NEVER include the platform name in any output field — do not write "Shopify", "eBay", "Etsy", or "Amazon" in any title, description, or meta field.
- Use the exact product name as given. Do not paraphrase, shorten, or reinterpret it.
- NEVER use em dashes (—), en dashes (–), or ellipses (…)
- Write like a real person: short sentences, plain punctuation (commas, full stops, exclamation marks only)
- Address the buyer directly as "you" throughout — not "customers", "shoppers", or "buyers"
- Use active voice — "Burns for 45 hours" not "A burn time of 45 hours is provided"
- Never open any description with "This is...", "Introducing...", "Meet...", "Looking for...", or "Are you..."
- No buzzwords or their adverb/adjective forms — these words are banned in every context, including descriptive phrases like "unique to how you use it": unique, stunning, beautiful, beautifully, perfect, perfectly, seamlessly, elevate, elevating, enhance, enhancing, exceptional, premium, top-notch. If you want to express that something changes or develops with use, describe the specific change: "the leather softens with daily carry", "develops a richer colour over time", "shapes to your hand over months of use" — never "unique to you"`;

const SYSTEM_PROMPTS = {
  etsy: `You are an expert Etsy SEO specialist and conversion copywriter. Etsy buyers are emotional — they are buying a feeling, a gift, a story. Your listing must rank AND make someone stop scrolling.

The description must:
- Open with the occasion, recipient, or feeling the seller described — use their words, not invented ones
- Include practical details (materials, size, care) woven in naturally, not as a spec sheet
- End with a warm call to action that matches Etsy's handmade, personal tone
- Draw emotional framing only from what the seller provided. Do not invent physical sensations (e.g. "feel their shoulders drop"), invented reactions, or editorial verdicts (e.g. "a genuinely considered gift", "works beautifully as a gift", "the kind of thing someone keeps"). Describe what the product is and who it is for.
- NEVER use "beautiful", "beautifully", "stunning", or any other word that evaluates the product's appearance.

Return ONLY a valid JSON object:
{
  "title": "max 140 chars, keyword-front-loaded, reads as a natural phrase — use connective words (for, with, and), never comma-separate keywords. Example: \\"Handmade Ceramic Coffee Mug for Coffee Lovers, Hand Thrown Stoneware Cup with Minimalist Design\\"",
  "tags": ["exactly 13 tags", "HARD CHARACTER LIMIT: every tag must be 20 characters or fewer including spaces — examples of borderline counts: 'lavender soy candle' = 19 chars (ok), 'birthday gift women' = 19 chars (ok), 'lavender essential' = 18 chars (ok), 'lavender essential oil' = 22 chars (REJECTED — cut to 'essential oil candle' = 20 chars). Count characters explicitly before writing each tag.", "INTENT DIVERSITY: each tag must target a genuinely different buyer search — cover product type (2-3 tags max), occasion/recipient (3-4 tags), style/aesthetic (2-3 tags), material/technique (1-2 tags), use case (1-2 tags). Do not write 4 different variations of 'birthday gift' or 5 tags all containing the same product word — spread across different buyer intents instead"],
  "description": "150–250 words, occasion-first opening using the seller's stated buyer or occasion, product details woven in, warm call to action"
}

${WRITING_RULES}
Return only the JSON object, no markdown.`,

  amazon: `You are an expert Amazon FBA listing specialist. Generate an optimised Amazon product listing.

Return ONLY a valid JSON object:
{
  "title": "max 200 chars — lead with brand or product type, include primary keyword, colour/size if relevant",
  "bullets": ["exactly 5 bullet points", "each max 255 chars", "start each with a 2–3 word benefit in CAPS then a colon, e.g. STAYS HOT LONGER: ...", "keyword-rich but reads naturally"],
  "backendKeywords": "space-separated keywords, max 250 bytes total, no words already in title or bullets, purchase-intent terms only — only include terms that accurately describe this product as stated by the seller, do not add synonyms that imply a different specification (e.g. do not list 'genuine leather' for a 'full grain leather' product — these are different grades)",
  "description": "150–250 words, expands on bullet points, HTML line breaks allowed, focus on use cases and who this is for"
}

${WRITING_RULES}
Return only the JSON object, no markdown.`,

  shopify: `You are an expert Shopify SEO and conversion copywriter. Your goal is twofold: rank in Google and make a real customer want to buy the moment they land on the product page.

Write as if a real person is browsing this product page on their phone. The description must:
- Open with the most specific, striking detail about this product — something only true of this product, not a generic opener
- Use short paragraphs — 2–3 sentences max — so it reads cleanly on mobile
- Mention the most visually or functionally distinct detail in the first 40 words
- End with a specific factual detail that supports the purchase — a real attribute of the product. If no clear closing fact exists, end on the most distinctive visual or functional detail from the description. Do NOT close with a verdict, recommendation, or opinion about whether the product is worth buying

Return ONLY a valid JSON object:
{
  "metaTitle": "max 60 chars strictly — start with the exact product name as given, then add the most distinctive visual detail if space allows",
  "metaDescription": "max 160 chars strictly — primary keyword included, factual description of what the product is, ends with a short call to action. No value judgements or lifestyle claims.",
  "productTitle": "if a real product name was provided, use it exactly with no changes.",
  "description": "200–300 words, desire-first opening, short benefit-led paragraphs, covers materials/fit/feel, ends with a line that closes the sale"
}

${WRITING_RULES}
Return only the JSON object, no markdown.`,

  ebay: `You are an expert eBay listing specialist. eBay buyers are comparison shoppers — they search by exact spec and scan listings fast. Your listing must match their search AND give them a reason to choose this listing over 20 identical ones.

The description must:
- Lead with the single most important spec or selling point (brand, model, condition, key feature)
- Use short lines — eBay descriptions are scanned, not read
- State condition clearly and honestly (New, Like New, Used, Good Condition, etc.) — only use condition details that were actually provided, do not invent claims about colour, brightness, fade, or wear that were not stated
- Do NOT include return policy or postage details — eBay displays these separately from structured listing fields
- CRITICAL: Base the description ONLY on details the seller explicitly provided in their input. If the seller gave only a product name and nothing else, write only the product name, note that full details are in the photos, and ask buyers to message with questions. Do NOT add any specifications, features, or technical details from your training data — even if you are certain they are accurate for that product model. A 40-word honest description beats a 200-word description full of specs that may be wrong for this specific used or modified unit.
- Do NOT pad with obvious facts, circular statements that restate the product name, or inferred compatibility claims that were not stated by the seller.

Return ONLY a valid JSON object:
{
  "title": "max 80 chars — keyword-rich from the start, include brand/model/size/condition if known, no ALL CAPS, be specific",
  "description": "100–200 words, most important spec first, short scannable lines, condition stated if known, product focused — write less if there is less to say",
  "itemSpecifics": {
    "Brand": "brand name or 'Does not apply' if unknown",
    "Model": "model name/number or omit if unknown",
    "Condition": "New / Like New / Good / Acceptable — only if stated by seller",
    "Colour": "colour or omit if unknown",
    "MPN": "manufacturer part number or omit if unknown",
    "Type": "product type or category if helpful"
  }
}

Only include keys in itemSpecifics where you have factual information from the seller's input. Do not invent or guess values.
Add other category-relevant keys (e.g. Size, Screen Size, Storage Capacity, Material) if the seller's input supports them.

${WRITING_RULES}
- eBay title: buyers search for exact model/spec terms — be specific, not generic
Return only the JSON object, no markdown.`,

  // Minimal eBay prompt — used when seller provides ONLY a product name and nothing else.
  // Completely different task framing so the model cannot draw on training data to fill specs.
  ebay_minimal: `You are an eBay listing specialist. The seller has provided only the product name — no condition, no description, no features, no additional details.

Your job is to write a short, honest placeholder listing that does not misrepresent the item.

ABSOLUTE RULES:
- Do NOT add any specifications, features, technical details, battery life, connectivity, dimensions, accessories, or any other facts — even if you believe they are accurate for this product model. You do not know the condition, completeness, or configuration of this specific unit.
- Do NOT describe colour, weight, size, or any physical attribute not stated by the seller.
- Keep the description to 3 sentences maximum.
- The title must use the exact product name as given, with no added words beyond what helps eBay search.
- NEVER use em dashes (—), en dashes (–), or ellipses (…). Use plain full stops and commas only.

Return ONLY a valid JSON object:
{
  "title": "max 80 chars — the product name as given, no invented additions",
  "description": "3 sentences max: (1) state the product name, (2) note that full condition and details are shown in the photos, (3) invite buyers to message with questions before purchasing",
  "itemSpecifics": {}
}

Return only the JSON object, no markdown.`,
};

const TEST_PRODUCTS = [
  {
    id: "candle",
    label: "Handmade Lavender Soy Candle (Etsy-typical)",
    input: {
      productName: "Handmade Lavender Soy Candle",
      materials: "100% soy wax, natural cotton wick, lavender essential oil",
      style: "minimal, clean, natural",
      targetBuyer: "gift for mum, birthday gift for women, self-care gift",
      keywords: "lavender soy candle, gift for mum, birthday gift for her, natural candle",
    },
    platforms: ["etsy", "shopify"],
  },
  {
    id: "wallet",
    label: "Slim Leather Wallet (Shopify-typical)",
    input: {
      productName: "Slim Bifold Leather Wallet",
      materials: "full grain leather, handmade in Portugal",
      style: "minimalist, slim",
      targetBuyer: "men who want a slim everyday carry wallet",
      keywords: "slim leather wallet, bifold wallet, RFID wallet, mens wallet, full grain leather wallet",
    },
    platforms: ["shopify", "amazon"],
  },
  {
    id: "headphones",
    label: "Used Sony WH-1000XM5 (eBay minimal-input test)",
    input: {
      productName: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
      materials: "",
      style: "",
      targetBuyer: "",
      keywords: "",
    },
    platforms: ["ebay"],
  },
  {
    id: "waterbottle",
    label: "Insulated Water Bottle (Amazon-typical)",
    input: {
      productName: "Stainless Steel Insulated Water Bottle 1L",
      materials: "18/8 stainless steel, double-wall vacuum insulation",
      style: "",
      targetBuyer: "gym goers, hikers, office workers",
      keywords: "insulated water bottle, stainless steel water bottle, vacuum flask, 1 litre water bottle",
    },
    platforms: ["amazon", "shopify"],
  },
];

const BANNED = ["unique", "stunning", "beautiful", "beautifully", "perfect", "perfectly", "seamlessly",
  "elevate", "elevating", "enhance", "enhancing", "exceptional", "premium", "top-notch"];

function checkViolations(output, platform) {
  const issues = [];
  const text = JSON.stringify(output).toLowerCase();

  // Banned words
  for (const w of BANNED) {
    if (new RegExp(`\\b${w}\\b`, "i").test(text)) {
      issues.push(`BANNED WORD: "${w}"`);
    }
  }

  // Em/en dash
  if (/[—–]/.test(JSON.stringify(output))) issues.push("EM/EN DASH found");

  // Ellipsis
  if (/…/.test(JSON.stringify(output))) issues.push("ELLIPSIS found");

  // Platform name in output
  for (const name of ["shopify", "ebay", "etsy", "amazon"]) {
    if (new RegExp(`\\b${name}\\b`, "i").test(text)) {
      issues.push(`PLATFORM NAME in output: "${name}"`);
    }
  }

  // Forbidden openers
  const desc = (output.description || output.postCopy || "").trim().toLowerCase();
  for (const opener of ["this is", "introducing", "meet ", "looking for", "are you"]) {
    if (desc.startsWith(opener)) issues.push(`FORBIDDEN OPENER: "${opener}"`);
  }

  // Character limit checks
  if (platform === "etsy") {
    if (output.title && output.title.length > 140) issues.push(`ETSY TITLE TOO LONG: ${output.title.length} chars (max 140)`);
    if (output.tags) {
      if (output.tags.length !== 13) issues.push(`ETSY TAG COUNT: ${output.tags.length} (need exactly 13)`);
      output.tags.forEach((tag, i) => {
        if (tag.length > 20) issues.push(`ETSY TAG ${i + 1} TOO LONG: "${tag}" (${tag.length} chars, max 20)`);
      });
    }
  }
  if (platform === "amazon") {
    if (output.title && output.title.length > 200) issues.push(`AMAZON TITLE TOO LONG: ${output.title.length} chars (max 200)`);
    if (output.bullets && output.bullets.length !== 5) issues.push(`AMAZON BULLET COUNT: ${output.bullets.length} (need exactly 5)`);
    if (output.backendKeywords && Buffer.byteLength(output.backendKeywords, "utf8") > 250)
      issues.push(`BACKEND KEYWORDS TOO LONG: ${Buffer.byteLength(output.backendKeywords, "utf8")} bytes (max 250)`);
  }
  if (platform === "shopify") {
    if (output.metaTitle && output.metaTitle.length > 60) issues.push(`SHOPIFY META TITLE TOO LONG: ${output.metaTitle.length} chars (max 60)`);
    if (output.metaDescription && output.metaDescription.length > 160) issues.push(`SHOPIFY META DESC TOO LONG: ${output.metaDescription.length} chars (max 160) — note: route.ts truncates this server-side`);
  }
  if (platform === "ebay" || platform === "ebay_minimal") {
    if (output.title && output.title.length > 80) issues.push(`EBAY TITLE TOO LONG: ${output.title.length} chars (max 80)`);
  }

  return issues;
}

// Detect if this is a minimal-input eBay case (only product name provided, no other details)
function isMinimalEbayInput(input) {
  return !input.materials && !input.style && !input.targetBuyer && !input.keywords;
}

async function runTest(product, platform) {
  const { productName, materials, style, targetBuyer, keywords } = product.input;

  // Use minimal eBay prompt when only product name is provided
  const isMinimal = platform === "ebay" && isMinimalEbayInput(product.input);
  const systemPromptKey = isMinimal ? "ebay_minimal" : platform;
  const systemPrompt = SYSTEM_PROMPTS[systemPromptKey];

  const userMessage = isMinimal
    ? `Product name: ${productName}\n\nThe seller provided only the product name. Write the minimal placeholder listing exactly as instructed.`
    : [
        `Product: ${productName}`,
        materials && `Materials/techniques: ${materials}`,
        style && `Style/aesthetic: ${style}`,
        targetBuyer && `Target buyer/occasion: ${targetBuyer}`,
        keywords && `Keywords to include: ${keywords}`,
      ].filter(Boolean).join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : null;
  }

  return { raw: text, parsed, isMinimal };
}

async function main() {
  const results = [];

  for (const product of TEST_PRODUCTS) {
    for (const platform of product.platforms) {
      const isMinimal = platform === "ebay" && isMinimalEbayInput(product.input);
      const displayPlatform = isMinimal ? "EBAY (minimal-input path)" : platform.toUpperCase();

      console.log(`\n${"=".repeat(70)}`);
      console.log(`PRODUCT: ${product.label}`);
      console.log(`PLATFORM: ${displayPlatform}`);
      console.log("=".repeat(70));

      try {
        const { parsed, isMinimal: wasMinimal } = await runTest(product, platform);

        if (!parsed) {
          console.log("ERROR: Failed to parse JSON output");
          results.push({ product: product.id, platform, pass: false, issues: ["JSON parse failed"] });
          continue;
        }

        console.log("\nOUTPUT:");
        console.log(JSON.stringify(parsed, null, 2));

        const checkPlatform = wasMinimal ? "ebay_minimal" : platform;
        const issues = checkViolations(parsed, checkPlatform);

        // Extra check for minimal eBay: flag if description contains hallucinated specs
        // that are NOT present in the original product name (those are fair game to repeat).
        if (wasMinimal) {
          const desc = (parsed.description || "").toLowerCase();
          const productNameLower = product.input.productName.toLowerCase();
          const hallucinationSignals = [
            "noise cancellation", "battery", "bluetooth", "microphone",
            "processor", "quick charge", "multipoint", "alexa", "google assistant",
            "ldac", "foldable", "folds flat", "carry case", "30 hour", "8 microphone",
          ];
          // Only flag signals not already present in the product name
          const found = hallucinationSignals.filter(s => desc.includes(s) && !productNameLower.includes(s));
          if (found.length > 0) {
            issues.push(`HALLUCINATED SPECS in minimal eBay output: ${found.join(", ")}`);
          }
        }

        if (issues.length === 0) {
          console.log("\nAUTO-CHECK: PASS — no rule violations detected");
        } else {
          console.log("\nAUTO-CHECK: ISSUES FOUND:");
          issues.forEach((i) => console.log(`  !! ${i}`));
        }

        results.push({ product: product.id, platform, pass: issues.length === 0, issues });
      } catch (err) {
        console.log(`ERROR: ${err.message}`);
        results.push({ product: product.id, platform, pass: false, issues: [err.message] });
      }
    }
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log("SUMMARY");
  console.log("=".repeat(70));
  for (const r of results) {
    const status = r.pass ? "PASS" : `FAIL (${r.issues.length} issue${r.issues.length === 1 ? "" : "s"})`;
    console.log(`${r.product.padEnd(15)} ${r.platform.padEnd(12)} ${status}`);
    if (!r.pass) r.issues.forEach((i) => console.log(`               -> ${i}`));
  }
}

main().catch(console.error);
