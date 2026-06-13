import { describe, it, expect } from "vitest";

// Extract pure logic for testing — mirrors the component computation
const PLATFORM_HINTS: Record<string, { field: string; hint: string }> = {
  etsy: { field: "targetBuyer", hint: "Adding a target buyer" },
  amazon: { field: "materials", hint: "Adding materials" },
  shopify: { field: "style", hint: "Adding style" },
  ebay: { field: "materials", hint: "Adding brand, model" },
};

function computeHint(
  platform: string,
  formValues: Record<string, string>
): string | null {
  const wordCount = formValues.productName?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  const hint = PLATFORM_HINTS[platform];
  if (wordCount >= 3 && hint && !formValues[hint.field]) return hint.hint;
  return null;
}

describe("input-phase hint logic", () => {
  it("shows hint when product name has 3+ words and target field is empty", () => {
    const result = computeHint("etsy", {
      productName: "Handmade ceramic mug",
      targetBuyer: "",
    });
    expect(result).toContain("target buyer");
  });

  it("does not show hint when product name has fewer than 3 words", () => {
    const result = computeHint("etsy", {
      productName: "Ceramic mug",
      targetBuyer: "",
    });
    expect(result).toBeNull();
  });

  it("does not show hint when the target field is already filled", () => {
    const result = computeHint("etsy", {
      productName: "Handmade ceramic mug",
      targetBuyer: "birthday gift for mum",
    });
    expect(result).toBeNull();
  });

  it("shows material hint for amazon", () => {
    const result = computeHint("amazon", {
      productName: "Wireless noise cancelling headphones",
      materials: "",
    });
    expect(result).toContain("materials");
  });

  it("does not show hint for platform with no entry in PLATFORM_HINTS", () => {
    const result = computeHint("wix", {
      productName: "Handmade ceramic mug",
      style: "",
    });
    expect(result).toBeNull(); // wix not in test map
  });
});
