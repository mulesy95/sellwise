import { describe, it, expect } from "vitest";
import { scoreOptimisedListing } from "@/lib/listing-score";
import type { Platform } from "@/lib/platforms";

describe("scoreOptimisedListing", () => {
  describe("etsy", () => {
    it("returns 100 for a perfect listing", () => {
      const score = scoreOptimisedListing({
        platform: "etsy",
        title: "Handmade Ceramic Coffee Mug for Coffee Lovers Hand Thrown Stoneware Cup",
        tags: ["ceramic mug", "coffee lover gift", "handmade pottery", "stoneware cup", "minimalist mug",
               "pottery gift", "hand thrown cup", "coffee mug gift", "unique mug", "boho kitchen",
               "artisan mug", "ceramic gift", "handmade mug"],
        description: "This hand-thrown ceramic coffee mug is made from high-fired stoneware clay using a traditional wheel-throwing technique. Each piece is crafted individually in a small studio, meaning no two mugs are exactly alike. The food-safe glaze is applied by hand and fired at high temperatures to create a smooth, durable surface that resists chipping and staining. The mug holds twelve ounces and has a comfortable handle that balances well in the hand. It is dishwasher safe and microwave safe. The mug is ideal for morning coffee, afternoon tea, or as a thoughtful handmade gift for someone who appreciates functional pottery. Perfect for housewarming gifts, birthdays, or treating yourself to something well-made that will last for years. Crafted with care in small batches, each mug reflects the natural variation of the making process. The stoneware clay body gives the mug a satisfying weight that keeps your drink warmer for longer. Every mug is completely unique.",
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

  describe("edge cases", () => {
    it("returns 0 for unknown platform", () => {
      expect(scoreOptimisedListing({ platform: "unknown" as Platform })).toBe(0);
    });
  });
});
