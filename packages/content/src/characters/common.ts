import type { Aabb } from "@aipuf/contracts";

export const DEFAULT_PUSHBOX: Aabb = {
  x: -80,
  y: 0,
  w: 160,
  h: 420,
};

export const DEFAULT_HURT_STAND: Aabb[] = [
  { x: -90, y: 0, w: 180, h: 220 }, // legs/lower body
  { x: -80, y: 220, w: 160, h: 200 }, // torso/head
];

export const DEFAULT_HURT_CROUCH: Aabb[] = [
  { x: -95, y: 0, w: 190, h: 160 },
  { x: -85, y: 160, w: 170, h: 130 },
];

export const DEFAULT_HURT_AIR: Aabb[] = [
  { x: -85, y: 60, w: 170, h: 180 },
  { x: -75, y: 240, w: 150, h: 160 },
];
