import { THROW_INVULN_WAKEUP, type CharacterDef, type MoveDef } from "@aipuf/contracts";
import type { FighterRuntime, MatchState, SimEvent } from "../types.ts";

export function startMove(
  fighter: FighterRuntime,
  move: MoveDef,
  state: MatchState
): void {
  fighter.moveId = move.id;
  fighter.attackAge = 0;
  fighter.attackInstanceId = state.nextId++;
  fighter.state = "attackStartup";
  fighter.stateTime = 0;
  fighter.windowHits = 0;
  fighter.lastConnect = null;
  fighter.armorLeft = move.armorHits ?? 0;

  if (move.meterCost > 0) {
    fighter.meter = Math.max(0, fighter.meter - move.meterCost);
    state.events.push({
      id: state.nextId++,
      kind: "super",
      tick: state.tick,
      source: fighter.id,
      moveId: move.id,
    });
  }
}

export function updateAttackProgress(
  fighter: FighterRuntime,
  char: CharacterDef,
  state: MatchState
): void {
  if (!fighter.moveId) return;
  const move = char.moves[fighter.moveId];
  if (!move) {
    fighter.moveId = null;
    fighter.state = "idle";
    return;
  }

  fighter.attackAge++;

  const startupEnd = move.startup;
  const activeEnd = move.startup + move.active;
  const total = move.startup + move.active + move.recovery;

  if (fighter.attackAge < startupEnd) {
    fighter.state = "attackStartup";
  } else if (fighter.attackAge < activeEnd) {
    fighter.state = "attackActive";

    // Spawn projectile or zone on the very first active frame if defined
    if (fighter.attackAge === startupEnd) {
      if (move.projectile) {
        spawnProjectile(fighter, move, state);
      }
      if (move.zone) {
        spawnZone(fighter, move, state);
      }
    }
  } else if (fighter.attackAge < total) {
    fighter.state = "attackRecovery";
  } else {
    // Attack finished
    fighter.moveId = null;
    fighter.attackAge = 0;
    fighter.windowHits = 0;
    fighter.lastConnect = null;

    if (fighter.y > 0 || fighter.airborne) {
      fighter.state = "fall";
    } else {
      fighter.state = "idle";
    }
  }
}

function spawnProjectile(
  fighter: FighterRuntime,
  move: MoveDef,
  state: MatchState
): void {
  const pdef = move.projectile;
  if (!pdef) return;

  // Check max concurrent
  const currentCount = state.projectiles.filter(
    (p) => p.owner === fighter.id && p.kind === "proj"
  ).length;
  if (currentCount >= pdef.maxConcurrent) {
    return;
  }

  const spawnX = fighter.x + (fighter.facing === 1 ? 60 : -60);
  const spawnY = fighter.y + 160;

  state.projectiles.push({
    id: state.nextId++,
    owner: fighter.id,
    x: spawnX,
    y: spawnY,
    vx: pdef.vx * fighter.facing,
    vy: pdef.vy,
    life: pdef.lifetime,
    kind: "proj",
    damage: pdef.damage,
    category: pdef.category,
    hitboxW: pdef.hitbox.w,
    hitboxH: pdef.hitbox.h,
    hitboxX: pdef.hitbox.x,
    hitboxY: pdef.hitbox.y,
    hitstun: pdef.hitstun,
    blockstun: pdef.blockstun,
    hitstop: pdef.hitstop,
    pushback: pdef.pushback,
    meterGainOnHit: pdef.meterGainOnHit,
    chip: pdef.chip,
    hitMask: 0,
    facing: fighter.facing,
  });

  state.events.push({
    id: state.nextId++,
    kind: "projectile_spawn",
    tick: state.tick,
    source: fighter.id,
    moveId: move.id,
  });
}

function spawnZone(
  fighter: FighterRuntime,
  move: MoveDef,
  state: MatchState
): void {
  const zdef = move.zone;
  if (!zdef) return;

  const currentCount = state.projectiles.filter(
    (p) => p.owner === fighter.id && p.kind === "zone"
  ).length;
  if (currentCount >= zdef.maxConcurrent) {
    return;
  }

  const spawnX = fighter.x + (fighter.facing === 1 ? zdef.hitbox.x : -zdef.hitbox.x);

  state.projectiles.push({
    id: state.nextId++,
    owner: fighter.id,
    x: spawnX,
    y: fighter.y + zdef.hitbox.y,
    vx: 0,
    vy: 0,
    life: zdef.lifetime,
    kind: "zone",
    damage: zdef.damage,
    category: zdef.category,
    hitboxW: zdef.hitbox.w,
    hitboxH: zdef.hitbox.h,
    hitboxX: 0,
    hitboxY: 0,
    hitstun: zdef.hitstun,
    blockstun: zdef.blockstun,
    hitstop: 4,
    pushback: 60,
    meterGainOnHit: 40,
    chip: 10,
    hitMask: 0,
    facing: fighter.facing,
  });
}

export function updateStunAndKnockdown(
  fighter: FighterRuntime
): void {
  if (fighter.throwInvuln > 0) {
    fighter.throwInvuln--;
  }

  if (fighter.state === "hitstun") {
    fighter.hitstun--;
    if (fighter.hitstun <= 0) {
      fighter.hitstun = 0;
      fighter.comboHits = 0;
      fighter.comboDamage = 0;
      fighter.state = fighter.y > 0 ? "fall" : "idle";
    }
  } else if (fighter.state === "blockstun") {
    fighter.blockstun--;
    if (fighter.blockstun <= 0) {
      fighter.blockstun = 0;
      fighter.state = "idle";
    }
  } else if (fighter.state === "knockdown") {
    fighter.stateTime++;
    if (fighter.stateTime > 20) {
      fighter.state = "wakeup";
      fighter.stateTime = 0;
    }
  } else if (fighter.state === "wakeup") {
    fighter.stateTime++;
    if (fighter.stateTime > 12) {
      fighter.state = "idle";
      fighter.stateTime = 0;
      fighter.throwInvuln = THROW_INVULN_WAKEUP;
    }
  } else if (fighter.state === "thrown") {
    fighter.stateTime++;
    if (fighter.stateTime > 18) {
      fighter.state = "knockdown";
      fighter.stateTime = 0;
    }
  }
}
