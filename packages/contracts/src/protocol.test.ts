import { describe, expect, it } from "vitest";
import { TickInputSchema, PROTOCOL_VERSION } from "./index.ts";

describe("contracts", () => {
  it("rejects malformed input messages", () => {
    expect(() => TickInputSchema.parse({ seq: -1, tick: 0, bits: 0 })).toThrow();
  });
  it("accepts valid input messages", () => {
    expect(TickInputSchema.parse({ seq: 1, tick: 10, bits: 3 }).seq).toBe(1);
  });
  it("locks protocol version", () => {
    expect(PROTOCOL_VERSION).toBe(1);
  });
});
