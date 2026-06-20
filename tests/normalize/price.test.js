import { describe, expect, it } from "vitest";
import { assignPriceBucket, calcDiscountRate, parsePriceWan } from "../../src/normalize/price.js";

describe("price normalizer", () => {
  it("parses 万元 text", () => {
    expect(parsePriceWan("起拍价：2609.6 万")).toBe(2609.6);
  });

  it("parses 元 text into 万元", () => {
    expect(parsePriceWan("10000000 元")).toBe(1000);
  });

  it("calculates discount rate percentage", () => {
    expect(calcDiscountRate(800, 1000)).toBe(80);
  });

  it("assigns the correct price bucket", () => {
    const buckets = [
      { id: "under_500", min: 0, max: 500 },
      { id: "500_to_1000", min: 500, max: 1000 },
      { id: "over_1000", min: 1000, max: null }
    ];

    expect(assignPriceBucket(499.9, buckets).id).toBe("under_500");
    expect(assignPriceBucket(500, buckets).id).toBe("500_to_1000");
    expect(assignPriceBucket(1000, buckets).id).toBe("over_1000");
  });
});
