import type { Aabb } from "@aipuf/contracts";

export function worldBox(local: Aabb, x: number, y: number, facing: 1 | -1): Aabb {
  const wx = facing === 1 ? x + local.x : x - local.x - local.w;
  return { x: wx, y: y + local.y, w: local.w, h: local.h };
}

export function overlaps(a: Aabb, b: Aabb): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function cloneBox(b: Aabb): Aabb {
  return { x: b.x, y: b.y, w: b.w, h: b.h };
}
