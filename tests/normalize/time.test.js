import { describe, expect, it } from "vitest";
import { isWithinLookahead, parseAuctionTime } from "../../src/normalize/time.js";

describe("time normalizer", () => {
  it("fills current year for month-day text", () => {
    expect(parseAuctionTime("06月22日 10:00", new Date("2026-06-20T00:00:00+08:00"))).toBe("2026-06-22 10:00:00");
  });

  it("rolls to next year when month-day has already passed near year end", () => {
    expect(parseAuctionTime("01月02日 10:00", new Date("2026-12-30T00:00:00+08:00"))).toBe("2027-01-02 10:00:00");
  });

  it("checks lookahead range", () => {
    expect(isWithinLookahead("2026-07-30 10:00:00", new Date("2026-06-20T00:00:00+08:00"), 45)).toBe(true);
    expect(isWithinLookahead("2026-08-10 10:00:00", new Date("2026-06-20T00:00:00+08:00"), 45)).toBe(false);
  });
});
