import { describe, expect, it } from "vitest";
import { loadConfig } from "../../src/config/loadConfig.js";

describe("loadConfig", () => {
  it("loads configured region and schedule", () => {
    const config = loadConfig("config/rules.json");

    expect(config.region.district).toBe("浦东新区");
    expect(config.schedule).toEqual(["11:00", "23:00"]);
  });

  it("rejects missing required fields", () => {
    expect(() => loadConfig("tests/fixtures/invalid-rules.json")).toThrow("config.region.district is required");
  });
});
