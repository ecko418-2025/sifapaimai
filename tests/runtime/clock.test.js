import { describe, expect, it } from "vitest";
import { createRunClock } from "../../src/runtime/clock.js";

describe("createRunClock", () => {
  it("creates a filesystem-safe timestamp for per-run report names", () => {
    const clock = createRunClock(new Date("2026-06-21T11:00:02+08:00"));

    expect(clock.stamp).toBe("2026-06-21_11-00-02");
  });
});
