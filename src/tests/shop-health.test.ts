import { describe, it, expect } from "vitest";

function computeApexScore(rows: Array<{ score: number }>): number {
  if (rows.length === 0) return 0;
  const sum = rows.reduce((acc, r) => acc + r.score, 0);
  return Math.round(sum / rows.length);
}

function deduplicateByProduct(
  rows: Array<{ product_id: string; score: number; created_at: string }>
): Array<{ product_id: string; score: number }> {
  const map = new Map<string, { score: number; created_at: string }>();
  for (const row of rows) {
    const existing = map.get(row.product_id);
    if (!existing || row.created_at > existing.created_at) {
      map.set(row.product_id, { score: row.score, created_at: row.created_at });
    }
  }
  return Array.from(map.entries()).map(([product_id, v]) => ({
    product_id,
    score: v.score,
  }));
}

describe("shop health computation", () => {
  it("returns 0 for empty rows", () => {
    expect(computeApexScore([])).toBe(0);
  });

  it("averages scores across products", () => {
    expect(computeApexScore([{ score: 80 }, { score: 60 }])).toBe(70);
  });

  it("rounds the average", () => {
    expect(computeApexScore([{ score: 80 }, { score: 61 }])).toBe(71);
  });

  it("deduplicates by product_id keeping most recent", () => {
    const rows = [
      { product_id: "p1", score: 50, created_at: "2026-06-01T00:00:00Z" },
      { product_id: "p1", score: 80, created_at: "2026-06-10T00:00:00Z" },
      { product_id: "p2", score: 70, created_at: "2026-06-05T00:00:00Z" },
    ];
    const deduped = deduplicateByProduct(rows);
    expect(deduped).toHaveLength(2);
    const p1 = deduped.find((r) => r.product_id === "p1");
    expect(p1?.score).toBe(80);
  });
});
