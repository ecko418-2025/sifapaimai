import { describe, expect, it } from "vitest";
import { updateLifecycle } from "../../src/lifecycle/updateLifecycle.js";

describe("updateLifecycle", () => {
  it("creates and updates auction lifecycle entries", () => {
    const now = "2026-06-20 11:00:00";
    const current = [
      {
        auctionId: "A1",
        assetFingerprint: "丁香路1299弄3号2601室",
        titleRaw: "上海市浦东新区丁香路1299弄3号2601室",
        priceWan: 1000,
        status: "即将开始",
        capturedAt: now
      }
    ];

    const lifecycle = updateLifecycle({ auctions: {}, assets: {} }, current, now);

    expect(lifecycle.auctions.A1.firstSeenAt).toBe(now);
    expect(lifecycle.auctions.A1.snapshots).toHaveLength(1);
    expect(lifecycle.assets["丁香路1299弄3号2601室"].auctionIds).toEqual(["A1"]);
  });
});
