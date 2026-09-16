import { Buttons } from "@aipuf/contracts";
import type { MatchState, TickInput } from "./types.ts";

export function computeBotInput(
  botId: 0 | 1,
  state: MatchState,
  difficulty: "easy" | "medium" | "hard" = "medium"
): TickInput {
  const bot = state.fighters[botId];
  const opp = state.fighters[botId === 0 ? 1 : 0];
  const char = state.chars[botId];

  // If training dummy
  if (state.training) {
    if (botId === 1) {
      if (state.training.dummy === "stand") return { bits: 0 };
      if (state.training.dummy === "crouch") return { bits: Buttons.DOWN };
      if (state.training.dummy === "block") {
        return { bits: bot.facing === 1 ? Buttons.LEFT : Buttons.RIGHT };
      }
    }
  }

  // If match not fighting
  if (state.round.phase !== "fighting") {
    return { bits: 0 };
  }

  let bits = 0;
  const dist = Math.abs(bot.x - opp.x);
  const oppAttacking =
    opp.state === "attackStartup" || opp.state === "attackActive";

  // Defense: block if opponent attacking nearby
  if (oppAttacking && dist < 300) {
    // Hold back to block
    const backBtn = bot.facing === 1 ? Buttons.LEFT : Buttons.RIGHT;
    // Crouch block or stand block based on tick parity
    if (state.tick % 3 !== 0) {
      return { bits: backBtn | Buttons.DOWN };
    } else {
      return { bits: backBtn };
    }
  }

  // Super move if available
  if (bot.meter >= 1000 && dist < 350 && state.tick % 10 === 0) {
    return { bits: Buttons.SUPER };
  }

  // Close range
  if (dist < 150) {
    const r = (state.tick + botId * 17) % 10;
    if (r === 0) return { bits: Buttons.THROW };
    if (r === 1 || r === 2) return { bits: Buttons.LP };
    if (r === 3 || r === 4) return { bits: Buttons.LK | Buttons.DOWN };
    if (r === 5) return { bits: Buttons.SPECIAL };
    // Retreat slightly
    return { bits: bot.facing === 1 ? Buttons.LEFT : Buttons.RIGHT };
  }

  // Mid range
  if (dist >= 150 && dist < 400) {
    const r = (state.tick + botId * 23) % 12;
    if (r === 0) return { bits: Buttons.HP };
    if (r === 1) return { bits: Buttons.HK | Buttons.DOWN };
    if (r === 2 || r === 3) return { bits: Buttons.SPECIAL };
    // Move towards opponent
    const fwdBtn = bot.facing === 1 ? Buttons.RIGHT : Buttons.LEFT;
    return { bits: fwdBtn };
  }

  // Far range (zoning / approach)
  const fwdBtn = bot.facing === 1 ? Buttons.RIGHT : Buttons.LEFT;
  const r = (state.tick + botId * 31) % 20;

  if (r === 0 || r === 1) {
    return { bits: Buttons.SPECIAL }; // throw projectile if zoner/shoto
  }
  if (r === 2 && difficulty !== "easy") {
    return { bits: Buttons.UP | fwdBtn }; // jump forward
  }

  return { bits: fwdBtn };
}
