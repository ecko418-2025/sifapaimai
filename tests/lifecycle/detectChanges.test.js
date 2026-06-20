import { describe, expect, it } from "vitest";
import { detectChanges } from "../../src/lifecycle/detectChanges.js";

const config = { watchCountChange: { minIncrease: 100, minPercent: 20 } };

describe("detectChanges", () => {
  it("detects a new listing", () => {
    const current = { auctionId: "A1", status: "即将开始" };

    expect(detectChanges(null, current, config)).toEqual([{ type: "new_listing", current: "A1" }]);
  });

  it("detects signup count change", () => {
    const previous = { auctionId: "A1", signupCount: 0, watchCount: 300, status: "即将开始" };
    const current = { auctionId: "A1", signupCount: 1, watchCount: 320, status: "即将开始" };

    expect(detectChanges(previous, current, config)).toEqual([{ type: "signup_count_changed", previous: 0, current: 1 }]);
  });

  it("detects significant watch count change", () => {
    const previous = { auctionId: "A1", signupCount: 0, watchCount: 300, status: "即将开始" };
    const current = { auctionId: "A1", signupCount: 0, watchCount: 430, status: "即将开始" };

    expect(detectChanges(previous, current, config)[0].type).toBe("watch_count_changed");
  });

  it("ignores small watch count change", () => {
    const previous = { auctionId: "A1", signupCount: 0, watchCount: 1000, status: "即将开始" };
    const current = { auctionId: "A1", signupCount: 0, watchCount: 1120, status: "即将开始" };

    expect(detectChanges(previous, current, config)).toEqual([]);
  });
});
