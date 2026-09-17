import { describe, expect, it } from "vitest";
import {
  measureArmOverlayAccumulation,
  parseRigDiagMode,
} from "./authoredOverlay.ts";

describe("authored overlay pose isolation", () => {
  it("accumulates relative rotateX when clean pose is not restored (dt=0 path)", () => {
    const once = measureArmOverlayAccumulation(1, false);
    const thrice = measureArmOverlayAccumulation(3, false);
    expect(thrice).toBeLessThan(once - 0.4); // more negative = more overlay stacked
  });

  it("does not accumulate when clean pose is restored before each overlay", () => {
    const once = measureArmOverlayAccumulation(1, true);
    const thrice = measureArmOverlayAccumulation(3, true);
    expect(Math.abs(thrice - once)).toBeLessThan(1e-9);
  });

  it("parses rig diag modes", () => {
    expect(parseRigDiagMode("c")).toBe("C");
    expect(parseRigDiagMode("D")).toBe("D");
    expect(parseRigDiagMode("nope")).toBe("off");
  });
});
