import { describe, expect, it } from "vitest";
import { recordsToCsv } from "../../src/storage/csvWriter.js";

describe("csvWriter", () => {
  it("escapes values and renders headers", () => {
    const csv = recordsToCsv([
      {
        auctionId: "A1",
        titleRaw: "浦东,住宅",
        priceWan: 1000,
        status: "即将开始",
        normalizedUrl: "https://example.com/a1"
      }
    ]);

    expect(csv).toContain("auctionId,titleRaw");
    expect(csv).toContain("\"浦东,住宅\"");
  });
});
