import { describe, expect, it } from "vitest";
import { CHARACTER_IDS, SUPER_COST } from "@aipuf/contracts";
import { CHARACTERS, CHARACTER_LIST, getCharacter } from "./characters/index.ts";
import { STAGES, STAGE_LIST } from "./stages/index.ts";

describe("packages/content", () => {
  it("defines all 8 required characters", () => {
    expect(CHARACTER_IDS.length).toBe(8);
    for (const id of CHARACTER_IDS) {
      const char = getCharacter(id);
      expect(char).toBeDefined();
      expect(char.id).toBe(id);
      expect(char.name.length).toBeGreaterThan(0);
      expect(char.strengths.length).toBeGreaterThan(0);
      expect(char.weaknesses.length).toBeGreaterThan(0);
    }
  });

  it("ensures each character has complete normals and valid moves", () => {
    for (const char of CHARACTER_LIST) {
      const { normals, moves } = char;
      const expectedKeys = ["lp", "hp", "lk", "hk", "air", "throw", "special1", "special2", "super"] as const;
      for (const key of expectedKeys) {
        const moveId = normals[key];
        expect(moveId, `${char.id} missing normal reference for ${key}`).toBeDefined();
        const move = moves[moveId]!;
        expect(move, `${char.id} missing move definition for ${moveId}`).toBeDefined();
        expect(move.startup).toBeGreaterThan(0);
        expect(move.active).toBeGreaterThan(0);
        expect(move.recovery).toBeGreaterThanOrEqual(0);
        expect(move.damage).toBeGreaterThanOrEqual(0);
      }

      // Check super costs 1000 meter
      const superMove = moves[normals.super]!;
      expect(superMove.meterCost).toBe(SUPER_COST);

      // Check pushbox and hurtboxes
      expect(char.pushbox.w).toBeGreaterThan(0);
      expect(char.pushbox.h).toBeGreaterThan(0);
      expect(char.hurtStand.length).toBeGreaterThan(0);
      expect(char.hurtCrouch.length).toBeGreaterThan(0);
      expect(char.hurtAir.length).toBeGreaterThan(0);
    }
  });

  it("ensures archetypes are evenly distributed across the 8 fighters", () => {
    const archetypes = CHARACTER_LIST.map((c) => c.archetype);
    expect(archetypes).toContain("zoner-a");
    expect(archetypes).toContain("zoner-b");
    expect(archetypes).toContain("shoto-a");
    expect(archetypes).toContain("shoto-b");
    expect(archetypes).toContain("grappler-a");
    expect(archetypes).toContain("grappler-b");
    expect(archetypes).toContain("hybrid-a");
    expect(archetypes).toContain("hybrid-b");
  });

  it("ensures stages have valid bounds and layers", () => {
    expect(STAGE_LIST.length).toBeGreaterThanOrEqual(4);
    for (const stage of STAGE_LIST) {
      expect(stage.leftBound).toBeLessThan(stage.rightBound);
      expect(stage.layers.length).toBeGreaterThan(0);
    }
  });
});
