import { describe, expect, it } from "vitest";
import { Buttons } from "@aipuf/contracts";
import { SHOTO_A, ZONER_A } from "@aipuf/content";
import {
  createInitialMatchState,
  hashState,
  simStep,
} from "./index.ts";

describe("packages/sim", () => {
  it("initializes match state correctly", () => {
    const state = createInitialMatchState({
      p1: SHOTO_A,
      p2: ZONER_A,
    });

    expect(state.tick).toBe(0);
    expect(state.fighters[0].health).toBe(1000);
    expect(state.fighters[1].health).toBe(1000);
    expect(state.fighters[0].meter).toBe(0);
    expect(state.fighters[1].meter).toBe(0);
    expect(state.fighters[0].facing).toBe(1);
    expect(state.fighters[1].facing).toBe(-1);
    expect(state.fighters[0].x).toBe(-350);
    expect(state.fighters[1].x).toBe(350);
    expect(state.round.phase).toBe("countdown");
  });

  it("transitions from countdown to fighting phase after 120 ticks", () => {
    const state = createInitialMatchState({
      p1: SHOTO_A,
      p2: ZONER_A,
    });

    for (let i = 0; i < 120; i++) {
      simStep(state, [{ bits: 0 }, { bits: 0 }]);
    }

    expect(state.round.phase).toBe("fighting");
    expect(state.round.countdown).toBe(0);
  });

  it("is 100% deterministic with identical inputs", () => {
    const state1 = createInitialMatchState({ p1: SHOTO_A, p2: ZONER_A });
    const state2 = createInitialMatchState({ p1: SHOTO_A, p2: ZONER_A });

    // Scripted sequence of inputs over 300 ticks
    for (let i = 0; i < 300; i++) {
      const p1Input = i % 20 < 10 ? { bits: Buttons.RIGHT } : { bits: Buttons.LP };
      const p2Input = i % 30 < 15 ? { bits: Buttons.LEFT } : { bits: Buttons.SPECIAL };

      simStep(state1, [p1Input, p2Input]);
      simStep(state2, [p1Input, p2Input]);

      expect(state1.fighters[0].x).toBe(state2.fighters[0].x);
      expect(state1.fighters[1].x).toBe(state2.fighters[1].x);
      expect(state1.fighters[0].health).toBe(state2.fighters[0].health);
      expect(state1.fighters[1].health).toBe(state2.fighters[1].health);
    }

    expect(hashState(state1)).toBe(hashState(state2));
  });

  it("executes walking and jumps with accurate state transitions", () => {
    const state = createInitialMatchState({ p1: SHOTO_A, p2: ZONER_A });
    // Skip countdown
    state.round.phase = "fighting";

    const startX = state.fighters[0].x;

    // Walk forward for 10 ticks
    for (let i = 0; i < 10; i++) {
      simStep(state, [{ bits: Buttons.RIGHT }, { bits: 0 }]);
    }
    expect(state.fighters[0].x).toBeGreaterThan(startX);
    expect(state.fighters[0].state).toBe("walkForward");

    // Jump up
    simStep(state, [{ bits: Buttons.UP }, { bits: 0 }]);
    expect(state.fighters[0].state).toBe("jumpStartup");

    // Jump startup (4 ticks)
    for (let i = 0; i < 4; i++) {
      simStep(state, [{ bits: 0 }, { bits: 0 }]);
    }
    expect(state.fighters[0].state).toBe("jump");
    expect(state.fighters[0].vy).toBeGreaterThan(0);
    expect(state.fighters[0].airborne).toBe(true);

    // Let fighter peak and land back on ground
    for (let i = 0; i < 45; i++) {
      simStep(state, [{ bits: 0 }, { bits: 0 }]);
    }
    expect(state.fighters[0].y).toBe(0);
    expect(state.fighters[0].airborne).toBe(false);
  });

  it("handles attack hit, damage, and meter gain", () => {
    const state = createInitialMatchState({ p1: SHOTO_A, p2: ZONER_A });
    state.round.phase = "fighting";

    // Place fighters right next to each other
    state.fighters[0].x = 0;
    state.fighters[1].x = 80;

    const initialHealth = state.fighters[1].health;

    // P1 presses LP
    simStep(state, [{ bits: Buttons.LP }, { bits: 0 }]);
    expect(state.fighters[0].state).toBe("attackStartup");

    // Progress through startup to active
    let hitEventEmitted = false;
    for (let i = 0; i < 15; i++) {
      simStep(state, [{ bits: 0 }, { bits: 0 }]);
      if (state.events.some((e) => e.kind === "hit")) {
        hitEventEmitted = true;
      }
    }

    expect(hitEventEmitted).toBe(true);
    expect(state.fighters[1].health).toBeLessThan(initialHealth);
    expect(state.fighters[0].meter).toBeGreaterThan(0);
  });

  it("handles blocking correctly without taking full damage", () => {
    const state = createInitialMatchState({ p1: SHOTO_A, p2: ZONER_A });
    state.round.phase = "fighting";

    state.fighters[0].x = 0;
    state.fighters[1].x = 80;

    const initialHealth = state.fighters[1].health;

    // P1 attacks with LP while P2 holds down-back (RIGHT + DOWN) to block in place
    simStep(state, [{ bits: Buttons.LP }, { bits: Buttons.RIGHT | Buttons.DOWN }]);

    let blockEventEmitted = false;
    for (let i = 0; i < 15; i++) {
      simStep(state, [{ bits: 0 }, { bits: Buttons.RIGHT | Buttons.DOWN }]);
      if (state.events.some((e) => e.kind === "block")) {
        blockEventEmitted = true;
      }
    }

    expect(blockEventEmitted).toBe(true);
    // Normal LP has 0 chip damage, so health remains intact
    expect(state.fighters[1].health).toBe(initialHealth);
    expect(state.fighters[1].state).toBe("crouchBlock");
  });

  it("ensures chip damage cannot KO a player (DECISIONS.md rule)", () => {
    const state = createInitialMatchState({ p1: SHOTO_A, p2: ZONER_A });
    state.round.phase = "fighting";

    // Set defender to 1 health
    state.fighters[1].health = 1;
    state.fighters[0].x = 0;
    state.fighters[1].x = 80;

    // P1 executes a move with chip damage, e.g. escalation_dp
    const dp = SHOTO_A.moves["escalation_dp"]!;
    expect(dp.chip).toBeGreaterThan(0);

    state.fighters[0].moveId = "escalation_dp";
    state.fighters[0].state = "attackActive";
    state.fighters[0].attackAge = dp.startup;

    // P2 blocks
    simStep(state, [{ bits: 0 }, { bits: Buttons.RIGHT }]);

    // Health MUST stay at 1, not drop to 0
    expect(state.fighters[1].health).toBe(1);
    expect(state.fighters[1].state).not.toBe("ko");
  });

  it("executes throw tech when both fighters throw simultaneously", () => {
    const state = createInitialMatchState({ p1: SHOTO_A, p2: ZONER_A });
    state.round.phase = "fighting";

    state.fighters[0].x = 0;
    state.fighters[1].x = 60;

    // Both press THROW simultaneously
    simStep(state, [{ bits: Buttons.THROW }, { bits: Buttons.THROW }]);

    let throwTechEmitted = false;
    for (let i = 0; i < 10; i++) {
      simStep(state, [{ bits: 0 }, { bits: 0 }]);
      if (state.events.some((e) => e.kind === "throw_tech")) {
        throwTechEmitted = true;
      }
    }

    expect(throwTechEmitted).toBe(true);
    // Neither player took damage
    expect(state.fighters[0].health).toBe(1000);
    expect(state.fighters[1].health).toBe(1000);
  });
});
