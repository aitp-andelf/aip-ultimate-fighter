import { Buttons, type HitCategory } from "@aipuf/contracts";
import type { FighterRuntime } from "../types.ts";

export type BlockResult = "blocked" | "hit";

export function isHoldingBack(fighter: FighterRuntime): boolean {
  if (fighter.facing === 1) {
    return (fighter.lastBits & Buttons.LEFT) !== 0;
  } else {
    return (fighter.lastBits & Buttons.RIGHT) !== 0;
  }
}

export function isHoldingDown(fighter: FighterRuntime): boolean {
  return (fighter.lastBits & Buttons.DOWN) !== 0;
}

export function canInitiateBlock(fighter: FighterRuntime): boolean {
  if (fighter.y > 0 || fighter.airborne) return false;
  return (
    fighter.state === "idle" ||
    fighter.state === "walkBackward" ||
    fighter.state === "crouch" ||
    fighter.state === "standBlock" ||
    fighter.state === "crouchBlock"
  );
}

export function evaluateBlock(
  defender: FighterRuntime,
  category: HitCategory
): BlockResult {
  if (category === "THROW") {
    return "hit"; // Throws cannot be blocked
  }

  if (!canInitiateBlock(defender) || !isHoldingBack(defender)) {
    return "hit";
  }

  const crouching = isHoldingDown(defender);

  switch (category) {
    case "HIGH":
      return crouching ? "hit" : "blocked";
    case "MID":
      return "blocked";
    case "LOW":
      return crouching ? "blocked" : "hit";
    case "OVERHEAD":
      return crouching ? "hit" : "blocked";
    default:
      return "hit";
  }
}
