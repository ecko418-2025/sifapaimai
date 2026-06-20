import { describe, expect, it } from "vitest";
import { detectRiskKeywords } from "../../src/normalize/risk.js";

describe("risk keyword detection", () => {
  it("returns matched risk keywords", () => {
    expect(detectRiskKeywords("房屋存在租赁，占用情况需买受人自行了解", ["租赁", "占用", "腾退"])).toEqual(["租赁", "占用"]);
  });
});
