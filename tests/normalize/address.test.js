import { describe, expect, it } from "vitest";
import { createAddressFingerprint, parseAddressParts } from "../../src/normalize/address.js";

describe("address normalizer", () => {
  it("creates same fingerprint for equivalent address variants", () => {
    const one = createAddressFingerprint("上海市浦东新区丁香路1299弄3号2601室");
    const two = createAddressFingerprint("浦东新区 丁香路 1299弄 3号 2601室及地下人防车位 U033");

    expect(two).toContain(one);
  });

  it("extracts common address parts", () => {
    const parts = parseAddressParts("上海市浦东新区丁香路1299弄3号2601室");

    expect(parts.road).toBe("丁香路");
    expect(parts.laneNumber).toBe("1299弄3号");
    expect(parts.buildingRoom).toBe("2601室");
  });
});
