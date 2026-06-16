export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: number;
  platform?: string;
};

export const posts: BlogPost[] = [
  {
    slug: "shopify-product-title-seo",
    title: "How to Write Shopify Product Titles That Rank in Search",
    description:
      "Most Shopify sellers write titles for their customers. Here's how to write them for the algorithm too — without sacrificing readability.",
    date: "2026-06-10",
    readTime: 7,
    platform: "Shopify",
  },
  {
    slug: "ebay-listing-title-tips",
    title: "eBay Listing Titles: The 80-Character Strategy That Gets More Views",
    description:
      "Your eBay title has 80 characters. How you use them determines whether you appear in the top 50 results or the bottom 500.",
    date: "2026-06-11",
    readTime: 6,
    platform: "eBay",
  },
  {
    slug: "etsy-tags-guide",
    title: "How to Use Etsy Tags: Why All 13 Matter (and How to Fill Them)",
    description:
      "Most Etsy sellers use 6 or 7 tags. That's leaving half their discoverability on the table. Here's how to use all 13 correctly.",
    date: "2026-06-12",
    readTime: 6,
    platform: "Etsy",
  },
  {
    slug: "amazon-listing-optimisation",
    title: "Amazon Listing Optimisation: Titles, Bullets, and Backend Keywords",
    description:
      "Amazon's algorithm ranks by click-through and conversion rate. Here's how to write listings that earn both.",
    date: "2026-06-13",
    readTime: 8,
    platform: "Amazon",
  },
  {
    slug: "marketplace-seo-score",
    title: "Marketplace SEO Score Explained: What 0–100 Means for Your Listings",
    description:
      "An SEO score puts a number on how well your listing follows each platform's algorithm rules. Here's what it measures and how to act on it.",
    date: "2026-06-14",
    readTime: 6,
  },
  {
    slug: "product-descriptions-that-sell",
    title: "How to Write Product Descriptions That Actually Sell",
    description:
      "Most product descriptions describe the product. The ones that convert describe what it does for the buyer. Here's the difference — and how to write them.",
    date: "2026-06-16",
    readTime: 7,
  },
  {
    slug: "keyword-research-for-marketplace-sellers",
    title: "Keyword Research for Marketplace Sellers: How to Find the Terms That Drive Sales",
    description:
      "Marketplace keyword research is different from Google SEO. Here's how to find the terms buyers actually use — and where to put them.",
    date: "2026-06-16",
    readTime: 8,
  },
];
