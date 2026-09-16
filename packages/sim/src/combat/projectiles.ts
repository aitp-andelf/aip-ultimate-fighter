import type { Aabb } from "@aipuf/contracts";
import { overlaps } from "../aabb.ts";
import { getHurtboxes } from "../boxes/collision.ts";
import type { MatchState, ProjectileRuntime } from "../types.ts";
import { evaluateBlock } from "./blocking.ts";

export function updateProjectiles(state: MatchState): void {
  const activeProjs: ProjectileRuntime[] = [];

  for (const p of state.projectiles) {
    p.life--;
    p.x += p.vx;
    p.y += p.vy;

    // Check boundary
    if (p.life <= 0 || p.x < state.leftBound - 100 || p.x > state.rightBound + 100) {
      state.events.push({
        id: state.nextId++,
        kind: "projectile_despawn",
        tick: state.tick,
        source: p.owner,
      });
      continue;
    }

    const defender = state.fighters[p.owner === 0 ? 1 : 0]!;
    const defenderChar = state.chars[defender.id]!;

    // Collision box of projectile in world coords
    const pbox: Aabb = {
      x: p.x + p.hitboxX,
      y: p.y + p.hitboxY,
      w: p.hitboxW,
      h: p.hitboxH,
    };

    const hurtboxes = getHurtboxes(defender, defenderChar);
    let hitDetected = false;

    // Don't hit if defender is in invincible or non-hittable state
    const canBeHit =
      defender.state !== "knockdown" &&
      defender.state !== "wakeup" &&
      defender.state !== "ko" &&
      defender.state !== "thrown";

    if (canBeHit) {
      for (const hbox of hurtboxes) {
        if (overlaps(pbox, hbox)) {
          hitDetected = true;
          break;
        }
      }
    }

    if (hitDetected) {
      const block = evaluateBlock(defender, p.category);
      const attacker = state.fighters[p.owner]!;

      if (block === "blocked") {
        // Blocked projectile
        const chip = p.chip;
        if (chip > 0) {
          defender.health = Math.max(1, defender.health - chip); // chip cannot KO
        }
        defender.state = defender.state === "crouch" || defender.state === "crouchBlock" ? "crouchBlock" : "standBlock";
        defender.blockstun = p.blockstun;
        defender.hitstop = p.hitstop;

        const pushDir = attacker.x < defender.x ? 1 : -1;
        defender.x += pushDir * p.pushback;

        state.events.push({
          id: state.nextId++,
          kind: "block",
          tick: state.tick,
          source: defender.id,
        });
      } else {
        // Hit by projectile
        defender.health = Math.max(0, defender.health - p.damage);
        defender.state = "hitstun";
        defender.hitstun = p.hitstun;
        defender.hitstop = p.hitstop;
        attacker.hitstop = p.hitstop;

        attacker.meter = Math.min(1000, attacker.meter + p.meterGainOnHit);
        defender.meter = Math.min(1000, defender.meter + Math.floor(p.meterGainOnHit / 2));

        const pushDir = attacker.x < defender.x ? 1 : -1;
        defender.x += pushDir * p.pushback;

        state.events.push({
          id: state.nextId++,
          kind: "hit",
          tick: state.tick,
          source: attacker.id,
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

      // If regular projectile, despawns on hit
      if (p.kind === "proj") {
        state.events.push({
          id: state.nextId++,
          kind: "projectile_despawn",
          tick: state.tick,
          source: p.owner,
        });
        continue;
      }
    }

    activeProjs.push(p);
  }

  state.projectiles = activeProjs;
}
