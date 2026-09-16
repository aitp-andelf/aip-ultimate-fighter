import {
  Buttons,
  FACING_DEADZONE,
  ROUND_TIME_TICKS,
  SUPER_COST,
  THROW_TECH_WINDOW,
  type CharacterDef,
} from "@aipuf/contracts";
import { overlaps } from "../aabb.ts";
import {
  getHitboxes,
  getHurtboxes,
  getThrowbox,
  resolvePushboxes,
  updateFacing,
} from "../boxes/collision.ts";
import {
  startMove,
  updateAttackProgress,
  updateStunAndKnockdown,
} from "../combat/attacks.ts";
import { evaluateBlock } from "../combat/blocking.ts";
import { updateProjectiles } from "../combat/projectiles.ts";
import {
  consumeBufferedEdge,
  hasBufferedEdge,
  isButtonHeld,
  updateInputBuffer,
} from "../input/buffer.ts";
import { updateRoundManager } from "../round/manager.ts";
import type {
  FighterRuntime,
  MatchConfig,
  MatchState,
  TickInput,
} from "../types.ts";
import { emptyFighter } from "../types.ts";

export function createInitialMatchState(config: MatchConfig): MatchState {
  const leftBound = config.leftBound ?? -1200;
  const rightBound = config.rightBound ?? 1200;
  const gravity = config.gravity ?? 6;

  const f0 = emptyFighter(0, -350, 1);
  const f1 = emptyFighter(1, 350, -1);

  return {
    tick: 0,
    seed: 12345,
    rng: 12345,
    nextId: 1,
    fighters: [f0, f1],
    projectiles: [],
    round: {
      phase: "countdown",
      timer: config.roundTimeTicks ?? ROUND_TIME_TICKS,
      wins: [0, 0],
      roundsPlayed: 0,
      countdown: 120, // 2 seconds
      result: null,
      roundResult: null,
      endLock: 0,
    },
    events: [],
    training: config.training ?? null,
    chars: [config.p1, config.p2],
    leftBound,
    rightBound,
    gravity,
  };
}

export function simStep(
  state: MatchState,
  inputs: [TickInput, TickInput]
): MatchState {
  state.tick++;
  state.events = [];

  const f0 = state.fighters[0];
  const f1 = state.fighters[1];
  const c0 = state.chars[0];
  const c1 = state.chars[1];

  // 1. Update input buffers
  updateInputBuffer(f0, inputs[0].bits);
  updateInputBuffer(f1, inputs[1].bits);

  // 2. Process each fighter's actions if not in hitstop
  processFighterAction(f0, c0, f1, state);
  processFighterAction(f1, c1, f0, state);

  // 3. Process melee strike collisions (strikes beat throws)
  processMeleeStrikes(f0, c0, f1, c1, state);
  processMeleeStrikes(f1, c1, f0, c0, state);

  // 4. Process throws (including double-throw tech)
  processThrows(f0, c0, f1, c1, state);

  // 5. Update projectiles and zones
  updateProjectiles(state);

  // 6. Pushbox separation & stage bounds
  resolvePushboxes(f0, f1, c0, c1, state.leftBound, state.rightBound);

  // 7. Update facing
  updateFacing(f0, f1);

  // 8. Round / match management
  updateRoundManager(state);

  return state;
}

function processFighterAction(
  fighter: FighterRuntime,
  char: CharacterDef,
  opponent: FighterRuntime,
  state: MatchState
): void {
  // If hitstop active, pause state advancement
  if (fighter.hitstop > 0) {
    fighter.hitstop--;
    return;
  }

  // Update stun counters & knockdown recovery
  updateStunAndKnockdown(fighter);

  // Check landing lock
  if (fighter.landingLock > 0) {
    fighter.landingLock--;
    if (fighter.landingLock <= 0) {
      fighter.state = "idle";
    }
  }

  const canAct =
    fighter.state === "idle" ||
    fighter.state === "walkForward" ||
    fighter.state === "walkBackward" ||
    fighter.state === "crouch";

  const canCancel =
    (fighter.state === "attackActive" || fighter.state === "attackRecovery") &&
    fighter.lastConnect !== null &&
    fighter.moveId !== null;

  // Select moves from buffered inputs
  if (state.round.phase === "fighting") {
    tryExecuteMove(fighter, char, state, canAct, canCancel);
  }

  // Normal directional movement & jumping if able to act and not attacking
  const isCurrentlyAbleToMove =
    fighter.moveId === null &&
    (fighter.state === "idle" ||
      fighter.state === "walkForward" ||
      fighter.state === "walkBackward" ||
      fighter.state === "crouch");

  if (isCurrentlyAbleToMove && state.round.phase === "fighting") {
    handleMovementAndJumping(fighter, char, state);
  }

  // Physics update (gravity & airborne movement)
  handlePhysics(fighter, char, state);

  // Frame progress for active attack
  if (
    fighter.state === "attackStartup" ||
    fighter.state === "attackActive" ||
    fighter.state === "attackRecovery"
  ) {
    updateAttackProgress(fighter, char, state);
  }
}

function tryExecuteMove(
  fighter: FighterRuntime,
  char: CharacterDef,
  state: MatchState,
  canAct: boolean,
  canCancel: boolean
): void {
  const inAir = fighter.y > 0 || fighter.airborne;

  // 1. SUPER (SUPER button or HP+HK)
  if (hasBufferedEdge(fighter, Buttons.SUPER) || (hasBufferedEdge(fighter, Buttons.HP) && hasBufferedEdge(fighter, Buttons.HK))) {
    if (fighter.meter >= SUPER_COST) {
      const superMove = char.moves[char.normals.super];
      if (superMove && (canAct || (canCancel && canCancelInto(fighter, char, superMove.id)))) {
        if (!inAir || superMove.airOk) {
          consumeBufferedEdge(fighter, Buttons.SUPER);
          startMove(fighter, superMove, state);
          return;
        }
      }
    }
  }

  // 2. THROW (THROW button or LP+LK) - ground only
  if (!inAir && (hasBufferedEdge(fighter, Buttons.THROW) || (hasBufferedEdge(fighter, Buttons.LP) && hasBufferedEdge(fighter, Buttons.LK)))) {
    const throwMove = char.moves[char.normals.throw];
    if (throwMove && canAct) {
      consumeBufferedEdge(fighter, Buttons.THROW);
      startMove(fighter, throwMove, state);
      return;
    }
  }

  // 3. SPECIAL 2 (DOWN + SPECIAL)
  if (hasBufferedEdge(fighter, Buttons.SPECIAL) && isButtonHeld(fighter, Buttons.DOWN)) {
    const sp2 = char.moves[char.normals.special2];
    if (sp2 && (canAct || (canCancel && canCancelInto(fighter, char, sp2.id)))) {
      if (!inAir || sp2.airOk) {
        consumeBufferedEdge(fighter, Buttons.SPECIAL);
        startMove(fighter, sp2, state);
        return;
      }
    }
  }

  // 4. SPECIAL 1 (SPECIAL)
  if (hasBufferedEdge(fighter, Buttons.SPECIAL)) {
    const sp1 = char.moves[char.normals.special1];
    if (sp1 && (canAct || (canCancel && canCancelInto(fighter, char, sp1.id)))) {
      if (!inAir || sp1.airOk) {
        consumeBufferedEdge(fighter, Buttons.SPECIAL);
        startMove(fighter, sp1, state);
        return;
      }
    }
  }

  // 5. AIR ATTACK
  if (inAir) {
    if (
      hasBufferedEdge(fighter, Buttons.HP) ||
      hasBufferedEdge(fighter, Buttons.LP) ||
      hasBufferedEdge(fighter, Buttons.HK) ||
      hasBufferedEdge(fighter, Buttons.LK)
    ) {
      const airMove = char.moves[char.normals.air];
      if (airMove && fighter.state !== "attackStartup" && fighter.state !== "attackActive" && fighter.state !== "attackRecovery") {
        consumeBufferedEdge(fighter, Buttons.HP);
        consumeBufferedEdge(fighter, Buttons.LP);
        consumeBufferedEdge(fighter, Buttons.HK);
        consumeBufferedEdge(fighter, Buttons.LK);
        startMove(fighter, airMove, state);
        return;
      }
    }
    return;
  }

  // 6. GROUND NORMALS
  if (hasBufferedEdge(fighter, Buttons.HP)) {
    const move = char.moves[char.normals.hp];
    if (move && (canAct || (canCancel && canCancelInto(fighter, char, move.id)))) {
      consumeBufferedEdge(fighter, Buttons.HP);
      startMove(fighter, move, state);
      return;
    }
  }

  if (hasBufferedEdge(fighter, Buttons.HK)) {
    const move = char.moves[char.normals.hk];
    if (move && (canAct || (canCancel && canCancelInto(fighter, char, move.id)))) {
      consumeBufferedEdge(fighter, Buttons.HK);
      startMove(fighter, move, state);
      return;
    }
  }

  if (hasBufferedEdge(fighter, Buttons.LP)) {
    const move = char.moves[char.normals.lp];
    if (move && (canAct || (canCancel && canCancelInto(fighter, char, move.id)))) {
      consumeBufferedEdge(fighter, Buttons.LP);
      startMove(fighter, move, state);
      return;
    }
  }

  if (hasBufferedEdge(fighter, Buttons.LK)) {
    const move = char.moves[char.normals.lk];
    if (move && (canAct || (canCancel && canCancelInto(fighter, char, move.id)))) {
      consumeBufferedEdge(fighter, Buttons.LK);
      startMove(fighter, move, state);
      return;
    }
  }
}

function canCancelInto(
  fighter: FighterRuntime,
  char: CharacterDef,
  targetMoveId: string
): boolean {
  if (!fighter.moveId || !fighter.lastConnect) return false;
  const currentMove = char.moves[fighter.moveId];
  if (!currentMove || !currentMove.cancels) return false;

  const allowedList = currentMove.cancels[fighter.lastConnect];
  if (!allowedList) return false;

  return allowedList.includes(targetMoveId);
}

function handleMovementAndJumping(
  fighter: FighterRuntime,
  char: CharacterDef,
  state: MatchState
): void {
  // Jump initiation
  if (hasBufferedEdge(fighter, Buttons.UP)) {
    consumeBufferedEdge(fighter, Buttons.UP);
    fighter.state = "jumpStartup";
    fighter.stateTime = 0;

    const movingForward =
      (fighter.facing === 1 && isButtonHeld(fighter, Buttons.RIGHT)) ||
      (fighter.facing === -1 && isButtonHeld(fighter, Buttons.LEFT));
    const movingBackward =
      (fighter.facing === 1 && isButtonHeld(fighter, Buttons.LEFT)) ||
      (fighter.facing === -1 && isButtonHeld(fighter, Buttons.RIGHT));

    if (movingForward) {
      fighter.vx = fighter.facing * char.walkSpeed;
    } else if (movingBackward) {
      fighter.vx = -fighter.facing * char.backWalkSpeed;
    } else {
      fighter.vx = 0;
    }
    return;
  }

  // Crouch
  if (isButtonHeld(fighter, Buttons.DOWN)) {
    fighter.state = "crouch";
    fighter.vx = 0;
    return;
  }

  // Walk forward / backward
  const movingForward =
    (fighter.facing === 1 && isButtonHeld(fighter, Buttons.RIGHT)) ||
    (fighter.facing === -1 && isButtonHeld(fighter, Buttons.LEFT));
  const movingBackward =
    (fighter.facing === 1 && isButtonHeld(fighter, Buttons.LEFT)) ||
    (fighter.facing === -1 && isButtonHeld(fighter, Buttons.RIGHT));

  if (movingForward) {
    fighter.state = "walkForward";
    fighter.vx = fighter.facing * char.walkSpeed;
  } else if (movingBackward) {
    fighter.state = "walkBackward";
    fighter.vx = -fighter.facing * char.backWalkSpeed;
  } else {
    fighter.state = "idle";
    fighter.vx = 0;
  }
}

function handlePhysics(
  fighter: FighterRuntime,
  char: CharacterDef,
  state: MatchState
): void {
  // Jump startup progression
  if (fighter.state === "jumpStartup") {
    fighter.stateTime++;
    if (fighter.stateTime >= char.jumpStartup) {
      fighter.state = "jump";
      fighter.vy = char.jumpVy;
      fighter.airborne = true;
    }
    return;
  }

  // Apply horizontal velocity
  fighter.x += fighter.vx;

  // Airborne physics
  if (fighter.y > 0 || fighter.vy !== 0 || fighter.airborne) {
    fighter.y += fighter.vy;
    fighter.vy -= state.gravity;

    if (fighter.vy < 0 && fighter.state === "jump") {
      fighter.state = "fall";
    }

    // Landing on ground
    if (fighter.y <= 0) {
      fighter.y = 0;
      fighter.vy = 0;
      fighter.vx = 0;
      fighter.airborne = false;

      if (
        fighter.state === "jump" ||
        fighter.state === "fall" ||
        fighter.state === "attackActive" ||
        fighter.state === "attackRecovery"
      ) {
        fighter.state = "landing";
        fighter.landingLock = char.landRecovery;
        fighter.moveId = null;
        fighter.attackAge = 0;
      }
    }
  }
}

function processMeleeStrikes(
  attacker: FighterRuntime,
  attChar: CharacterDef,
  defender: FighterRuntime,
  defChar: CharacterDef,
  state: MatchState
): void {
  if (attacker.state !== "attackActive" || !attacker.moveId) return;
  if (attacker.windowHits > 0) return; // already hit this active window

  const move = attChar.moves[attacker.moveId];
  if (!move || move.category === "THROW") return; // throws handled separately

  // Cannot hit knocked down, waking up, or KO'd defender
  if (
    defender.state === "knockdown" ||
    defender.state === "wakeup" ||
    defender.state === "ko" ||
    defender.state === "thrown"
  ) {
    return;
  }

  const hitboxes = getHitboxes(attacker, attChar);
  const hurtboxes = getHurtboxes(defender, defChar);

  let hit = false;
  for (const h of hitboxes) {
    for (const b of hurtboxes) {
      if (overlaps(h, b)) {
        hit = true;
        break;
      }
    }
    if (hit) break;
  }

  if (!hit) return;

  attacker.windowHits++;

  // Check defender armor
  if (defender.armorLeft > 0) {
    defender.armorLeft--;
    defender.health = Math.max(1, defender.health - Math.floor(move.damage / 2));
    attacker.hitstop = move.hitstop;
    defender.hitstop = move.hitstop;
    attacker.lastConnect = "hit";
    state.events.push({
      id: state.nextId++,
      kind: "hit",
      tick: state.tick,
      source: attacker.id,
      moveId: move.id,
    });
    return;
  }

  // Evaluate blocking
  const blockResult = evaluateBlock(defender, move.category);

  if (blockResult === "blocked") {
    // Blocked strike
    const chip = move.chip;
    if (chip > 0) {
      defender.health = Math.max(1, defender.health - chip); // chip cannot KO
    }

    defender.state =
      defender.state === "crouch" || defender.state === "crouchBlock"
        ? "crouchBlock"
        : "standBlock";
    defender.blockstun = move.blockstun;
    defender.hitstop = move.hitstop;
    attacker.hitstop = move.hitstop;

    attacker.meter = Math.min(1000, attacker.meter + move.meterGainOnBlock);
    attacker.lastConnect = "block";

    const pushDir = attacker.x < defender.x ? 1 : -1;
    defender.x += pushDir * move.pushback;

    state.events.push({
      id: state.nextId++,
      kind: "block",
      tick: state.tick,
      source: defender.id,
      moveId: move.id,
    });
  } else {
    // Clean hit
    defender.health = Math.max(0, defender.health - move.damage);
    attacker.meter = Math.min(1000, attacker.meter + move.meterGainOnHit);
    defender.meter = Math.min(1000, defender.meter + Math.floor(move.meterGainOnHit / 2));

    attacker.hitstop = move.hitstop;
    defender.hitstop = move.hitstop;
    attacker.lastConnect = "hit";

    defender.comboHits++;
    defender.comboDamage += move.damage;

    const pushDir = attacker.x < defender.x ? 1 : -1;

    if (move.knockdown || defender.airborne || defender.y > 0) {
      defender.state = "knockdown";
      defender.stateTime = 0;
      defender.vx = pushDir * (move.knockback || 60);
      defender.vy = move.launch || 40;
      defender.airborne = true;
    } else {
      defender.state = "hitstun";
      defender.hitstun = move.hitstun;
      defender.x += pushDir * move.pushback;
    }

    state.events.push({
      id: state.nextId++,
      kind: "hit",
      tick: state.tick,
      source: attacker.id,
      moveId: move.id,
    });

    if (defender.health <= 0) {
      defender.state = "ko";
      state.events.push({
        id: state.nextId++,
        kind: "ko",
        tick: state.tick,
        source: defender.id,
      });
    }
  }
}

function processThrows(
  f0: FighterRuntime,
  c0: CharacterDef,
  f1: FighterRuntime,
  c1: CharacterDef,
  state: MatchState
): void {
  const throwbox0 = getThrowbox(f0, c0);
  const throwbox1 = getThrowbox(f1, c1);

  // Defenders must be grounded, not in stun/knockdown/invuln
  const p0CanBeThrown =
    f0.y === 0 &&
    !f0.airborne &&
    f0.throwInvuln === 0 &&
    f0.state !== "hitstun" &&
    f0.state !== "blockstun" &&
    f0.state !== "knockdown" &&
    f0.state !== "wakeup" &&
    f0.state !== "thrown" &&
    f0.state !== "ko";

  const p1CanBeThrown =
    f1.y === 0 &&
    !f1.airborne &&
    f1.throwInvuln === 0 &&
    f1.state !== "hitstun" &&
    f1.state !== "blockstun" &&
    f1.state !== "knockdown" &&
    f1.state !== "wakeup" &&
    f1.state !== "thrown" &&
    f1.state !== "ko";

  const hurt0 = getHurtboxes(f0, c0);
  const hurt1 = getHurtboxes(f1, c1);

  let f0LandsThrow = false;
  if (throwbox0 && p1CanBeThrown && f0.windowHits === 0) {
    for (const h of hurt1) {
      if (overlaps(throwbox0, h)) {
        f0LandsThrow = true;
        break;
      }
    }
  }

  let f1LandsThrow = false;
  if (throwbox1 && p0CanBeThrown && f1.windowHits === 0) {
    for (const h of hurt0) {
      if (overlaps(throwbox1, h)) {
        f1LandsThrow = true;
        break;
      }
    }
  }

  // DOUBLE THROW -> THROW TECH!
  if (f0LandsThrow && f1LandsThrow) {
    f0.windowHits = 1;
    f1.windowHits = 1;
    f0.state = "idle";
    f1.state = "idle";
    f0.x += f0.facing === 1 ? -100 : 100;
    f1.x += f1.facing === 1 ? -100 : 100;
    f0.hitstop = 8;
    f1.hitstop = 8;

    state.events.push({
      id: state.nextId++,
      kind: "throw_tech",
      tick: state.tick,
      source: 2,
    });
    return;
  }

  // F0 lands throw
  if (f0LandsThrow) {
    f0.windowHits = 1;
    const move = c0.moves[f0.moveId!];
    const dmg = move?.damage ?? c0.throwDamage;

    f1.health = Math.max(0, f1.health - dmg);
    f0.meter = Math.min(1000, f0.meter + (move?.meterGainOnHit ?? 60));

    f1.state = "thrown";
    f1.stateTime = 0;
    f0.hitstop = 8;
    f1.hitstop = 8;

    const pushDir = f0.facing === 1 ? 1 : -1;
    f1.x = f0.x + pushDir * 120;

    state.events.push({
      id: state.nextId++,
      kind: "throw",
      tick: state.tick,
      source: f0.id,
      moveId: move?.id,
    });

    if (f1.health <= 0) {
      f1.state = "ko";
      state.events.push({
        id: state.nextId++,
        kind: "ko",
        tick: state.tick,
        source: f1.id,
      });
    }
    return;
  }

  // F1 lands throw
  if (f1LandsThrow) {
    f1.windowHits = 1;
    const move = c1.moves[f1.moveId!];
    const dmg = move?.damage ?? c1.throwDamage;

    f0.health = Math.max(0, f0.health - dmg);
    f1.meter = Math.min(1000, f1.meter + (move?.meterGainOnHit ?? 60));

    f0.state = "thrown";
    f0.stateTime = 0;
    f0.hitstop = 8;
    f1.hitstop = 8;

    const pushDir = f1.facing === 1 ? 1 : -1;
    f0.x = f1.x + pushDir * 120;

    state.events.push({
      id: state.nextId++,
      kind: "throw",
      tick: state.tick,
      source: f1.id,
      moveId: move?.id,
    });

    if (f0.health <= 0) {
      f0.state = "ko";
      state.events.push({
        id: state.nextId++,
        kind: "ko",
        tick: state.tick,
        source: f0.id,
      });
    }
  }
}
