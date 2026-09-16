import { FACING_DEADZONE } from "@aipuf/contracts";
import type { Aabb, CharacterDef } from "@aipuf/contracts";
import { overlaps, worldBox } from "../aabb.ts";
import type { FighterRuntime } from "../types.ts";

export function resolvePushboxes(
  f0: FighterRuntime,
  f1: FighterRuntime,
  char0: CharacterDef,
  char1: CharacterDef,
  leftBound: number,
  rightBound: number
): void {
  const pbox0 = worldBox(char0.pushbox, f0.x, f0.y, f0.facing);
  const pbox1 = worldBox(char1.pushbox, f1.x, f1.y, f1.facing);

  if (overlaps(pbox0, pbox1)) {
    let overlap: number;
    let dir: number; // direction to push f0

    if (f0.x <= f1.x) {
      overlap = pbox0.x + pbox0.w - pbox1.x;
      dir = -1;
    } else {
      overlap = pbox1.x + pbox1.w - pbox0.x;
      dir = 1;
    }

    if (overlap > 0) {
      const half = Math.floor(overlap / 2);
      f0.x += dir * half;
      f1.x -= dir * (overlap - half);
    }
  }

  // Wall collisions
  const half0 = Math.floor(char0.pushbox.w / 2);
  const half1 = Math.floor(char1.pushbox.w / 2);

  const min0 = leftBound + half0;
  const max0 = rightBound - half0;
  const min1 = leftBound + half1;
  const max1 = rightBound - half1;

  // If f0 pushed past wall, correct f0 and push f1
  if (f0.x < min0) {
    const push = min0 - f0.x;
    f0.x = min0;
    f1.x += push;
  } else if (f0.x > max0) {
    const push = f0.x - max0;
    f0.x = max0;
    f1.x -= push;
  }

  // If f1 pushed past wall, correct f1 and push f0
  if (f1.x < min1) {
    const push = min1 - f1.x;
    f1.x = min1;
    f0.x += push;
  } else if (f1.x > max1) {
    const push = f1.x - max1;
    f1.x = max1;
    f0.x -= push;
  }

  // Final clamp
  f0.x = Math.max(min0, Math.min(max0, f0.x));
  f1.x = Math.max(min1, Math.min(max1, f1.x));
}

export function updateFacing(
  f0: FighterRuntime,
  f1: FighterRuntime
): void {
  const dist = Math.abs(f0.x - f1.x);
  if (dist < FACING_DEADZONE) {
    return;
  }

  const f0CanTurn = isStateTurnable(f0.state);
  const f1CanTurn = isStateTurnable(f1.state);

  const desiredF0Facing: 1 | -1 = f0.x < f1.x ? 1 : -1;
  const desiredF1Facing: 1 | -1 = f1.x < f0.x ? 1 : -1;

  if (f0CanTurn) {
    f0.facing = desiredF0Facing;
  }
  if (f1CanTurn) {
    f1.facing = desiredF1Facing;
  }
}

function isStateTurnable(state: FighterRuntime["state"]): boolean {
  return (
    state === "idle" ||
    state === "walkForward" ||
    state === "walkBackward" ||
    state === "crouch"
  );
}

export function getHurtboxes(fighter: FighterRuntime, char: CharacterDef): Aabb[] {
  let localBoxes: Aabb[];

  if (fighter.y > 0 || fighter.airborne || fighter.state === "jump" || fighter.state === "fall") {
    localBoxes = char.hurtAir;
  } else if (fighter.state === "crouch" || fighter.state === "crouchBlock") {
    localBoxes = char.hurtCrouch;
  } else {
    localBoxes = char.hurtStand;
  }

  return localBoxes.map((b) => worldBox(b, fighter.x, fighter.y, fighter.facing));
}

export function getHitboxes(fighter: FighterRuntime, char: CharacterDef): Aabb[] {
  if (fighter.state !== "attackActive" || !fighter.moveId) {
    return [];
  }
  const move = char.moves[fighter.moveId];
  if (!move) return [];

  return move.hitboxes.map((b) => worldBox(b, fighter.x, fighter.y, fighter.facing));
}

export function getThrowbox(fighter: FighterRuntime, char: CharacterDef): Aabb | null {
  if (fighter.state !== "attackActive" || !fighter.moveId) {
    return null;
  }
  const move = char.moves[fighter.moveId];
  if (!move || !move.throwbox) return null;

  return worldBox(move.throwbox, fighter.x, fighter.y, fighter.facing);
}
