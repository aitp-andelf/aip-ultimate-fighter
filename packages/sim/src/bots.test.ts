import { describe, expect, it } from "vitest";
import { CHARACTER_LIST } from "@aipuf/content";
import {
  computeBotInput,
  createInitialMatchState,
  hashState,
  simStep,
} from "./index.ts";

describe("packages/sim bots", () => {
  it("runs a full automated bot match between characters without errors", () => {
    // Pick two fighters: Shoto A vs Grappler A
    const p1 = CHARACTER_LIST.find((c) => c.id === "shoto-a")!;
    const p2 = CHARACTER_LIST.find((c) => c.id === "grappler-a")!;

    const state = createInitialMatchState({ p1, p2 });

    // Run 1500 ticks of bot combat
    for (let t = 0; t < 1500; t++) {
      const in0 = computeBotInput(0, state, "hard");
      const in1 = computeBotInput(1, state, "medium");

      simStep(state, [in0, in1]);

      // Assert no NaN or corrupt values
      expect(Number.isNaN(state.fighters[0].x)).toBe(false);
      expect(Number.isNaN(state.fighters[0].y)).toBe(false);
      expect(Number.isNaN(state.fighters[1].x)).toBe(false);
      expect(Number.isNaN(state.fighters[1].y)).toBe(false);
      expect(Number.isNaN(state.fighters[0].health)).toBe(false);
      expect(Number.isNaN(state.fighters[1].health)).toBe(false);
    }

    expect(state.tick).toBe(1500);
  });

  it("verifies determinism across two parallel bot simulations", () => {
    const p1 = CHARACTER_LIST.find((c) => c.id === "zoner-a")!;
    const p2 = CHARACTER_LIST.find((c) => c.id === "hybrid-a")!;

    const matchA = createInitialMatchState({ p1, p2 });
    const matchB = createInitialMatchState({ p1, p2 });

    for (let t = 0; t < 800; t++) {
      const inA0 = computeBotInput(0, matchA, "medium");
      const inA1 = computeBotInput(1, matchA, "medium");
      const inB0 = computeBotInput(0, matchB, "medium");
      const inB1 = computeBotInput(1, matchB, "medium");

      simStep(matchA, [inA0, inA1]);
      simStep(matchB, [inB0, inB1]);
    }

    expect(hashState(matchA)).toBe(hashState(matchB));
    expect(matchA.fighters[0].health).toBe(matchB.fighters[0].health);
    expect(matchA.fighters[1].health).toBe(matchB.fighters[1].health);
  });
});
