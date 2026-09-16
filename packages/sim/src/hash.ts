import type { MatchState } from "./types.ts";

/**
 * FNV-1a 32-bit hash algorithm.
 * Prime: 16777619, Offset: 2166136261.
 */
export function fnv1a32(str: string): number {
  let hash = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Serializes state into a canonical string for determinism check and desync detection.
 */
export function canonicalStateString(state: MatchState): string {
  const f0 = state.fighters[0];
  const f1 = state.fighters[1];
  const rnd = state.round;

  const projs = state.projectiles
    .map((p) => `${p.id}:${p.owner}:${p.x}:${p.y}:${p.life}`)
    .sort()
    .join(";");

  return [
    `t:${state.tick}`,
    `rng:${state.rng}`,
    `f0:${f0.x},${f0.y},${f0.vx},${f0.vy},${f0.facing},${f0.state},${f0.stateTime},${f0.health},${f0.meter},${f0.moveId ?? ""},${f0.attackAge},${f0.hitstun},${f0.blockstun},${f0.hitstop}`,
    `f1:${f1.x},${f1.y},${f1.vx},${f1.vy},${f1.facing},${f1.state},${f1.stateTime},${f1.health},${f1.meter},${f1.moveId ?? ""},${f1.attackAge},${f1.hitstun},${f1.blockstun},${f1.hitstop}`,
    `p:[${projs}]`,
    `r:${rnd.phase},${rnd.timer},${rnd.wins[0]},${rnd.wins[1]},${rnd.roundsPlayed},${rnd.countdown}`,
  ].join("|");
}

export function hashState(state: MatchState): number {
  return fnv1a32(canonicalStateString(state));
}
