import type { CharacterId, HitCategory } from "./ids.ts";

export interface Aabb {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type FighterStateId =
  | "idle"
  | "walkForward"
  | "walkBackward"
  | "crouch"
  | "jumpStartup"
  | "jump"
  | "fall"
  | "landing"
  | "attackStartup"
  | "attackActive"
  | "attackRecovery"
  | "standBlock"
  | "crouchBlock"
  | "hitstun"
  | "blockstun"
  | "knockdown"
  | "wakeup"
  | "throw"
  | "thrown"
  | "ko"
  | "victory";

export type CancelKind = "hit" | "block" | "whiff";

export interface HitWindow {
  start: number;
  end: number;
}

export interface MoveDef {
  id: string;
  name: string;
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  hitstun: number;
  blockstun: number;
  hitstop: number;
  pushback: number;
  knockback: number;
  launch: number;
  category: HitCategory;
  hitboxes: Aabb[];
  hurtboxes?: Aabb[];
  throwbox?: Aabb;
  meterGainOnHit: number;
  meterGainOnBlock: number;
  meterCost: number;
  chip: number;
  knockdown: boolean;
  invulnStart?: number;
  invulnEnd?: number;
  armorHits?: number;
  commandGrab?: boolean;
  projectile?: ProjectileDef;
  zone?: ZoneDef;
  allowed: FighterStateId[];
  cancels: Partial<Record<CancelKind, string[]>>;
  airOk: boolean;
  lowPose: boolean;
  animation: string;
}

export interface ProjectileDef {
  vx: number;
  vy: number;
  lifetime: number;
  hitbox: Aabb;
  damage: number;
  category: HitCategory;
  maxConcurrent: number;
  hitstun: number;
  blockstun: number;
  hitstop: number;
  pushback: number;
  meterGainOnHit: number;
  chip: number;
}

export interface ZoneDef {
  lifetime: number;
  hitbox: Aabb;
  damage: number;
  category: HitCategory;
  maxConcurrent: number;
  hitstun: number;
  blockstun: number;
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  archetype: CharacterId;
  blurb: string;
  strengths: string[];
  weaknesses: string[];
  combo: string;
  antiAir: string;
  approach: string;
  punish: string;
  walkSpeed: number;
  backWalkSpeed: number;
  jumpVy: number;
  jumpStartup: number;
  landRecovery: number;
  airControl: number;
  weight: number;
  throwDamage: number;
  throwTechWindow: number;
  pushbox: Aabb;
  hurtStand: Aabb[];
  hurtCrouch: Aabb[];
  hurtAir: Aabb[];
  moves: Record<string, MoveDef>;
  normals: {
    hp: string;
    lp: string;
    hk: string;
    lk: string;
    air: string;
    throw: string;
    special1: string;
    special2: string;
    super: string;
  };
  animationProfileId: string;
  colors: [string, string];
}

export interface StageLayer {
  id: string;
  src: string;
  parallax: number;
  z: number;
}

export interface StageDef {
  id: string;
  name: string;
  width: number;
  height: number;
  groundY: number;
  leftBound: number;
  rightBound: number;
  layers: StageLayer[];
  fallbackSrc: string;
}
