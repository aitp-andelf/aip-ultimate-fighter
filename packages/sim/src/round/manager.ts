import {
  MAX_ROUNDS_PLAYED,
  ROUND_TIME_TICKS,
  WINS_NEEDED,
} from "@aipuf/contracts";
import type { MatchState } from "../types.ts";

export function updateRoundManager(state: MatchState): void {
  const round = state.round;
  const f0 = state.fighters[0];
  const f1 = state.fighters[1];

  if (round.phase === "countdown") {
    round.countdown--;
    if (round.countdown <= 0) {
      round.phase = "fighting";
      round.countdown = 0;
      state.events.push({
        id: state.nextId++,
        kind: "round_start",
        tick: state.tick,
        source: 2,
      });
    }
    return;
  }

  if (round.phase === "fighting") {
    // Training mode infinite overrides
    if (state.training) {
      if (state.training.infiniteHealth) {
        f0.health = 1000;
        f1.health = 1000;
      }
      if (state.training.infiniteMeter) {
        f0.meter = 1000;
        f1.meter = 1000;
      }
    }

    // Decrement timer
    if (!state.training && round.timer > 0) {
      round.timer--;
    }

    // Check KO or timeout
    const f0Dead = f0.health <= 0;
    const f1Dead = f1.health <= 0;
    const timeout = round.timer <= 0 && !state.training;

    if (f0Dead || f1Dead || timeout) {
      round.phase = "round_end";
      round.endLock = 180; // 3 seconds at 60Hz

      state.events.push({
        id: state.nextId++,
        kind: "round_end",
        tick: state.tick,
        source: 2,
      });

      if (f0Dead && f1Dead) {
        round.roundResult = "double_ko";
      } else if (f0Dead) {
        round.roundResult = "p2";
        round.wins[1]++;
        f1.state = "victory";
      } else if (f1Dead) {
        round.roundResult = "p1";
        round.wins[0]++;
        f0.state = "victory";
      } else if (timeout) {
        if (f0.health > f1.health) {
          round.roundResult = "timeout_p1";
          round.wins[0]++;
          f0.state = "victory";
        } else if (f1.health > f0.health) {
          round.roundResult = "timeout_p2";
          round.wins[1]++;
          f1.state = "victory";
        } else {
          round.roundResult = "timeout_draw";
        }
      }
    }
    return;
  }

  if (round.phase === "round_end") {
    round.endLock--;
    if (round.endLock <= 0) {
      round.roundsPlayed++;

      const p1Won = round.wins[0] >= WINS_NEEDED;
      const p2Won = round.wins[1] >= WINS_NEEDED;
      const maxRoundsReached = round.roundsPlayed >= MAX_ROUNDS_PLAYED;

      if (p1Won || p2Won || maxRoundsReached) {
        round.phase = "match_end";
        if (p1Won && !p2Won) {
          round.result = "p1";
        } else if (p2Won && !p1Won) {
          round.result = "p2";
        } else if (round.wins[0] > round.wins[1]) {
          round.result = "p1";
        } else if (round.wins[1] > round.wins[0]) {
          round.result = "p2";
        } else {
          round.result = "draw";
        }

        state.events.push({
          id: state.nextId++,
          kind: "match_end",
          tick: state.tick,
          source: 2,
        });
      } else {
        // Start next round!
        startNextRound(state);
      }
    }
  }
}

export function startNextRound(state: MatchState): void {
  const round = state.round;
  const f0 = state.fighters[0];
  const f1 = state.fighters[1];

  round.phase = "countdown";
  round.countdown = 120; // 2 seconds
  round.timer = ROUND_TIME_TICKS;
  round.roundResult = null;
  round.endLock = 0;

  // Reset fighter positions
  f0.x = -350;
  f0.y = 0;
  f0.vx = 0;
  f0.vy = 0;
  f0.facing = 1;
  f0.state = "idle";
  f0.stateTime = 0;
  f0.health = 1000;
  f0.moveId = null;
  f0.attackAge = 0;
  f0.hitstun = 0;
  f0.blockstun = 0;
  f0.hitstop = 0;
  f0.comboHits = 0;
  f0.comboDamage = 0;
  f0.airborne = false;
  f0.windowHits = 0;
  f0.lastConnect = null;
  f0.dashTap = 0;
  f0.dashBackTap = 0;
  f0.dashLeft = 0;

  f1.x = 350;
  f1.y = 0;
  f1.vx = 0;
  f1.vy = 0;
  f1.facing = -1;
  f1.state = "idle";
  f1.stateTime = 0;
  f1.health = 1000;
  f1.moveId = null;
  f1.attackAge = 0;
  f1.hitstun = 0;
  f1.blockstun = 0;
  f1.hitstop = 0;
  f1.comboHits = 0;
  f1.comboDamage = 0;
  f1.airborne = false;
  f1.windowHits = 0;
  f1.lastConnect = null;
  f1.dashTap = 0;
  f1.dashBackTap = 0;
  f1.dashLeft = 0;

  // Rule from DECISIONS.md: "Supermätare vid rond: nollställs till 0 vid varje ny rond"
  f0.meter = 0;
  f1.meter = 0;

  // Clear projectiles
  state.projectiles = [];
}
