import { describe, it, expect } from "vitest";
import { scoreOptimisedListing } from "@/lib/listing-score";

describe("scoreOptimisedListing", () => {
  describe("etsy", () => {
    it("returns 100 for a perfect listing", () => {
      const score = scoreOptimisedListing({
        platform: "etsy",
        title: "Handmade Ceramic Coffee Mug for Coffee Lovers Hand Thrown Stoneware Cup",
        tags: ["ceramic mug", "coffee lover gift", "handmade pottery", "stoneware cup", "minimalist mug",
               "pottery gift", "hand thrown cup", "coffee mug gift", "unique mug", "boho kitchen",
               "artisan mug", "ceramic gift", "handmade mug"],
        description: "A short description that is at least one hundred and fifty words long. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.",
      });
      expect(score).toBe(100);
    });

    it("returns 0 for empty listing", () => {
      expect(scoreOptimisedListing({ platform: "etsy" })).toBe(0);
    });

    it("scores partial listings proportionally", () => {
      const titleOnly = scoreOptimisedListing({
        platform: "etsy",
        title: "Handmade Ceramic Coffee Mug for Coffee Lovers",
      });
      expect(titleOnly).toBeGreaterThan(0);
      expect(titleOnly).toBeLessThan(50);
    });

    it("penalises title over 140 chars", () => {
      const shortTitle = scoreOptimisedListing({
        platform: "etsy",
        title: "Handmade Ceramic Coffee Mug",
      });
      const longTitle = scoreOptimisedListing({
        platform: "etsy",
        title: "A".repeat(141),
      });
      expect(shortTitle).toBeGreaterThanOrEqual(longTitle);
    });

    it("rewards 13 tags over fewer tags", () => {
      const thirteenTags = scoreOptimisedListing({
        platform: "etsy",
        tags: new Array(13).fill("tag"),
      });
      const fiveTags = scoreOptimisedListing({
        platform: "etsy",
        tags: new Array(5).fill("tag"),
      });
      expect(thirteenTags).toBeGreaterThan(fiveTags);
    });
  });

  describe("amazon", () => {
    it("rewards 5 bullets over fewer", () => {
      const five = scoreOptimisedListing({
        platform: "amazon",
        title: "Great Product with Excellent Quality and Long Description of Features",
        bullets: ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"],
      });
      const two = scoreOptimisedListing({
        platform: "amazon",
        title: "Great Product with Excellent Quality and Long Description of Features",
        bullets: ["bullet 1", "bullet 2"],
      });
      expect(five).toBeGreaterThan(two);
    });
  });

  describe("shopify", () => {
    it("rewards meta title in 40-60 char range", () => {
      const optimal = scoreOptimisedListing({
        platform: "shopify",
        metaTitle: "Handmade Ceramic Mug | Free Shipping",
        metaDescription: "A hand-thrown stoneware coffee mug, food-safe glaze, perfect for morning coffee lovers who appreciate artisan pottery.",
      });
      const tooShort = scoreOptimisedListing({
        platform: "shopify",
        metaTitle: "Mug",
        metaDescription: "A hand-thrown stoneware coffee mug, food-safe glaze, perfect for morning coffee lovers who appreciate artisan pottery.",
      });
      expect(optimal).toBeGreaterThan(tooShort);
    });
  });

  describe("ebay", () => {
    it("rewards title in 50-80 char range", () => {
      const good = scoreOptimisedListing({
        platform: "ebay",
        title: "Sony PlayStation 5 Console Disc Edition 825GB Brand New Sealed",
        description: "Brand new sealed PlayStation 5 disc edition. Includes controller and all original accessories. Ready to ship same day.",
      });
      const poor = scoreOptimisedListing({
        platform: "ebay",
        title: "PS5",
      });
      expect(good).toBeGreaterThan(poor);
    });
  });

  describe("social", () => {
    it("scores caption + postCopy + hashtags", () => {
      const full = scoreOptimisedListing({
        platform: "social",
        caption: "Hand-thrown stoneware that holds heat longer than machine-made mugs.",
        postCopy: "Made in small batches from local clay. Food-safe glaze, dishwasher safe. Each piece is unique — no two look exactly alike. Great for gifting or treating yourself to something that lasts. Shop the full collection via link in bio.",
        hashtags: new Array(20).fill("ceramicmug"),
      });
      const empty = scoreOptimisedListing({ platform: "social" });
      expect(full).toBeGreaterThan(empty);
      expect(full).toBeGreaterThan(60);
    });
  });
});
