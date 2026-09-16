import type { CharacterDef, FighterStateId, HitCategory } from "@aipuf/contracts";
import { INPUT_BUFFER_TICKS } from "@aipuf/contracts";

export interface TrainingSettings {
  infiniteHealth: boolean;
  infiniteMeter: boolean;
  dummy: "stand" | "block" | "crouch" | "recorded";
  showBoxes: boolean;
}

export interface SimEvent {
  id: number;
  kind:
    | "hit"
    | "block"
    | "throw"
    | "throw_tech"
    | "ko"
    | "projectile_spawn"
    | "projectile_despawn"
    | "super"
    | "round_start"
    | "round_end"
    | "match_end";
  tick: number;
  source: 0 | 1 | 2;
  moveId?: string;
  attackInstanceId?: number;
}

export interface ProjectileRuntime {
  id: number;
  owner: 0 | 1;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  kind: "proj" | "zone";
  damage: number;
  category: HitCategory;
  hitboxW: number;
  hitboxH: number;
  hitboxX: number;
  hitboxY: number;
  hitstun: number;
  blockstun: number;
  hitstop: number;
  pushback: number;
  meterGainOnHit: number;
  chip: number;
  hitMask: number;
  facing: 1 | -1;
}

export interface FighterRuntime {
  id: 0 | 1;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  state: FighterStateId;
  stateTime: number;
  health: number;
  meter: number;
  moveId: string | null;
  attackAge: number;
  attackInstanceId: number;
  hitstun: number;
  blockstun: number;
  hitstop: number;
  armorLeft: number;
  throwInvuln: number;
  comboHits: number;
  comboDamage: number;
  juggle: number;
  lastBits: number;
  buffer: number[];
  airborne: boolean;
  lastConnect: "hit" | "block" | "whiff" | null;
  windowHits: number;
  landingLock: number;
}

export interface RoundRuntime {
  phase: "countdown" | "fighting" | "round_end" | "match_end";
  timer: number;
  wins: [number, number];
  roundsPlayed: number;
  countdown: number;
  result: "p1" | "p2" | "draw" | null;
  roundResult: "p1" | "p2" | "double_ko" | "timeout_p1" | "timeout_p2" | "timeout_draw" | null;
  endLock: number;
}

export interface MatchState {
  tick: number;
  seed: number;
  rng: number;
  nextId: number;
  fighters: [FighterRuntime, FighterRuntime];
  projectiles: ProjectileRuntime[];
  round: RoundRuntime;
  events: SimEvent[];
  training: TrainingSettings | null;
  chars: [CharacterDef, CharacterDef];
  leftBound: number;
  rightBound: number;
  gravity: number;
}

export interface TickInput {
  bits: number;
}

export interface MatchConfig {
  p1: CharacterDef;
  p2: CharacterDef;
  training?: TrainingSettings | null;
  leftBound?: number;
  rightBound?: number;
  roundTimeTicks?: number;
  gravity?: number;
}

export function emptyFighter(id: 0 | 1, x: number, facing: 1 | -1): FighterRuntime {
  return {
    id,
    x,
    y: 0,
    vx: 0,
    vy: 0,
    facing,
    state: "idle",
    stateTime: 0,
    health: 1000,
    meter: 0,
    moveId: null,
    attackAge: 0,
    attackInstanceId: 0,
    hitstun: 0,
    blockstun: 0,
    hitstop: 0,
    armorLeft: 0,
    throwInvuln: 0,
    comboHits: 0,
    comboDamage: 0,
    juggle: 0,
    lastBits: 0,
    buffer: new Array<number>(INPUT_BUFFER_TICKS).fill(0),
    airborne: false,
    lastConnect: null,
    windowHits: 0,
    landingLock: 0,
  };
}
