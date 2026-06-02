import { describe, it, expect } from "vitest";
import { getSpotPrice, type SpotMeta } from "./spot-price";

// Mirrors real HL data: KNTQ (124) trades against both USDH (360) and USDC (0).
// USDH itself trades against USDC at pair @230.
const meta: SpotMeta = {
  tokens: [
    { name: "USDC", index: 0 },
    { name: "USDH", index: 360 },
    { name: "KNTQ", index: 124 },
    { name: "ONLYH", index: 999 }, // only has a USDH pair
  ],
  universe: [
    { tokens: [360, 0], index: 230 }, // USDH/USDC
    { tokens: [124, 360], index: 254 }, // KNTQ/USDH
    { tokens: [124, 0], index: 334 }, // KNTQ/USDC
    { tokens: [999, 360], index: 500 }, // ONLYH/USDH
  ],
};

const mids: Record<string, string> = {
  "@230": "0.60", // USDH = $0.60
  "@254": "0.20712", // KNTQ in USDH
  "@334": "0.344175", // KNTQ in USDC
  "@500": "2.0", // ONLYH in USDH
};

describe("getSpotPrice", () => {
  it("returns 1 for USDC", () => {
    expect(getSpotPrice("USDC", meta, mids)).toBe(1);
  });

  it("prefers the direct USDC pair over the USDH pair", () => {
    // The bug was returning 0.207 (USDH pair). Must return the USDC mid.
    expect(getSpotPrice("KNTQ", meta, mids)).toBeCloseTo(0.344175, 6);
  });

  it("converts via quote USD price when only a USDH pair exists", () => {
    // ONLYH has no USDC pair: 2.0 (in USDH) * 0.60 (USDH/USDC) = 1.2
    expect(getSpotPrice("ONLYH", meta, mids)).toBeCloseTo(1.2, 6);
  });

  it("returns null for unknown token", () => {
    expect(getSpotPrice("NOPE", meta, mids)).toBeNull();
  });

  it("returns null when meta or mids missing", () => {
    expect(getSpotPrice("KNTQ", undefined, mids)).toBeNull();
    expect(getSpotPrice("KNTQ", meta, undefined)).toBeNull();
  });

  it("returns null when the mid is missing/zero", () => {
    expect(getSpotPrice("KNTQ", meta, {})).toBeNull();
    expect(getSpotPrice("KNTQ", meta, { "@334": "0" })).toBeNull();
  });
});
