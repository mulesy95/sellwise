import { describe, it, expect } from "vitest";

function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function computeBadges(totalOptimisations: number, existing: string[]): string[] {
  const earned = [...existing];
  const milestones = [
    { count: 10, badge: "veteran" },
    { count: 50, badge: "pro_seller" },
    { count: 100, badge: "power_user" },
    { count: 250, badge: "elite_seller" },
  ];
  for (const { count, badge } of milestones) {
    if (totalOptimisations >= count && !earned.includes(badge)) {
      earned.push(badge);
    }
  }
  return earned;
}

describe("getMondayOfWeek", () => {
  it("returns Monday for a Wednesday", () => {
    expect(getMondayOfWeek(new Date("2026-06-10"))).toBe("2026-06-08");
  });

  it("returns Monday for a Sunday", () => {
    expect(getMondayOfWeek(new Date("2026-06-14"))).toBe("2026-06-08");
  });

  it("returns same day for a Monday", () => {
    expect(getMondayOfWeek(new Date("2026-06-08"))).toBe("2026-06-08");
  });
});

describe("computeBadges", () => {
  it("unlocks veteran at 10 optimisations", () => {
    expect(computeBadges(10, [])).toContain("veteran");
  });

  it("unlocks pro_seller at 50", () => {
    expect(computeBadges(50, [])).toContain("pro_seller");
  });

  it("does not re-add existing badges", () => {
    const result = computeBadges(10, ["veteran"]);
    expect(result.filter((b) => b === "veteran")).toHaveLength(1);
  });

  it("unlocks multiple badges at once", () => {
    const result = computeBadges(100, []);
    expect(result).toContain("veteran");
    expect(result).toContain("pro_seller");
    expect(result).toContain("power_user");
  });

  it("does not unlock badge below threshold", () => {
    expect(computeBadges(9, [])).not.toContain("veteran");
  });
});
