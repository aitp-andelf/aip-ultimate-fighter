import { describe, expect, it } from "vitest";
import { validateCharacterPackage } from "./validator.ts";

describe("Character Lab package validator", () => {
  it("rejects package with missing name or invalid archetype", () => {
    const res = validateCharacterPackage({
      id: "shoto-a",
      name: "",
      archetype: "invalid" as any,
      definition: {},
    });
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it("accepts valid character package definition", () => {
    const res = validateCharacterPackage({
      id: "shoto-a",
      name: "Testkämpe",
      archetype: "shoto-a",
      definition: {
        walkSpeed: 35,
        jumpVy: 110,
        pushbox: { x: -80, y: 0, w: 160, h: 420 },
        moves: {
          lp: {
            id: "lp",
            name: "Lätt slag",
            startup: 5,
            active: 3,
            recovery: 6,
            damage: 40,
            hitstun: 12,
            blockstun: 9,
            hitstop: 4,
            pushback: 40,
            knockback: 0,
            launch: 0,
            category: "MID",
            hitboxes: [],
            meterGainOnHit: 30,
            meterGainOnBlock: 15,
            meterCost: 0,
            chip: 0,
            knockdown: false,
            allowed: ["idle"],
            cancels: {},
            airOk: false,
            lowPose: false,
            animation: "punch",
          },
        },
      },
    });
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
  });
});
