import type { Platform } from "@/lib/platforms";

export type HintField = "productName" | "materials" | "style" | "targetBuyer" | "keywords";

const HINTS: Record<Platform, Record<HintField, string>> = {
  etsy: {
    productName: "Use the name you'd say to a customer — e.g. 'Handmade soy wax candle, lavender and vanilla'",
    materials: "What it's made from and how — e.g. '100% soy wax, cotton wick, hand-poured in small batches'",
    style: "The look and feel — e.g. 'minimalist, soft earthy tones, Scandi-inspired'",
    targetBuyer: "Think occasion + recipient — e.g. 'gift for new mum', 'teacher thank you', '30th birthday for her'",
    keywords: "Paste keywords from your research, or pull from a saved list above",
  },
  amazon: {
    productName: "Include brand and core product type — e.g. 'ThermoFlask 32oz Insulated Water Bottle'",
    materials: "Key materials and specs — e.g. 'BPA-free Tritan plastic, stainless steel lid, double-wall insulation'",
    style: "Colour, form factor, finish — e.g. 'matte black, compact, ergonomic grip'",
    targetBuyer: "Describe the use case — e.g. 'gym-goers who want all-day hydration', 'students needing a portable charger'",
    keywords: "Purchase-intent terms — e.g. 'insulated water bottle for hiking, leak-proof gym bottle'",
  },
  shopify: {
    productName: "The storefront product name as it appears on your Shopify store",
    materials: "Materials and construction — e.g. '100% organic cotton, brushed fleece lining, ethically sourced'",
    style: "Visual identity and brand feel — e.g. 'minimal, monochrome, editorial'",
    targetBuyer: "Who shops your store — e.g. 'women 25–40 who follow slow fashion and buy considered basics'",
    keywords: "Google SEO phrases your shoppers search — separate with commas",
  },
  ebay: {
    productName: "Be specific: brand, model, condition if known — e.g. 'Sony PlayStation 4 Pro 1TB Console'",
    materials: "Condition, key specs, notable details — e.g. 'Used, excellent condition, original box and cables included'",
    style: "Era or visual character — e.g. 'vintage 1980s, chrome detailing, retro design'",
    targetBuyer: "Who buys this on eBay — e.g. 'collectors of 90s gaming, retro tech enthusiasts'",
    keywords: "Exact search terms buyers use — include model numbers and condition words",
  },
  woocommerce: {
    productName: "The exact product name as it appears in your store",
    materials: "Key materials and attributes — e.g. 'cold brew concentrate, single origin Ethiopian beans, 300ml bottle'",
    style: "Product aesthetic — e.g. 'minimalist Scandinavian design, natural wood finish'",
    targetBuyer: "Who searches for and buys this — e.g. 'home bakers who prioritise quality ingredients'",
    keywords: "Google search phrases your customers use — separate with commas",
  },
  wix: {
    productName: "The name shown on your Wix product page",
    materials: "What it's made from — e.g. 'hand-thrown stoneware, food-safe glaze, dishwasher safe'",
    style: "Visual and brand aesthetic — e.g. 'artisan, handcrafted, earthy tones'",
    targetBuyer: "Who buys from your Wix store — e.g. 'brides planning a boho wedding, bridesmaids gift shoppers'",
    keywords: "Google SEO phrases — separate with commas",
  },
  squarespace: {
    productName: "The product name as shown on your Squarespace store",
    materials: "Materials and construction — e.g. 'solid oak, hand-oiled finish, solid brass hardware'",
    style: "Considered aesthetic — e.g. 'architectural, graphic, bold colour-blocking'",
    targetBuyer: "The considered buyer — e.g. 'interior designers sourcing unique statement pieces'",
    keywords: "Google SEO phrases — separate with commas",
  },
  tiktok: {
    productName: "The product name shoppers would search on TikTok Shop",
    materials: "Materials or key specs — e.g. 'porous volcanic stone, BPA-free silicone seal'",
    style: "TikTok aesthetic — e.g. 'clean girl, neutral tones', or 'Y2K, metallic, glossy'",
    targetBuyer: "TikTok audience — e.g. 'Gen Z students who love room decor', 'skincare fans who follow #cleangirl'",
    keywords: "TikTok search terms and trending hashtag keywords",
  },
  social: {
    productName: "The product name you'd use in a caption",
    materials: "What it's made from — e.g. 'hand-dipped beeswax, cotton wick, recycled glass jar'",
    style: "Visual/lifestyle aesthetic — e.g. 'cottagecore, earthy, soft lighting'",
    targetBuyer: "Instagram/Pinterest audience — e.g. 'mums looking for personalised gifts, home decor lovers'",
    keywords: "Hashtag keywords and caption search terms",
  },
};

export function getFieldHint(platform: Platform, field: HintField): string {
  return HINTS[platform]?.[field] ?? "";
}
