import { CHARACTER_IDS, type CharacterId } from "@aipuf/contracts";
import type { CharacterDef } from "@aipuf/contracts";

export interface CharacterPackageManifest {
  id: CharacterId;
  name: string;
  archetype: CharacterId;
  blurb?: string;
  modelFile?: string;
  animationClips?: string[];
  definition: Partial<CharacterDef>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCharacterPackage(manifest: CharacterPackageManifest): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check ID
  if (!manifest.id || typeof manifest.id !== "string") {
    errors.push("Ogiltigt eller saknat karaktärs-ID");
  } else if (!CHARACTER_IDS.includes(manifest.id)) {
    warnings.push(`Karaktärs-ID '${manifest.id}' är inte ett av de 8 standard-ID:na`);
  }

  // Check Name
  if (!manifest.name || manifest.name.trim().length === 0) {
    errors.push("Karaktärsnamn får inte vara tomt");
  }

  // Check Archetype
  if (!manifest.archetype || !CHARACTER_IDS.includes(manifest.archetype)) {
    errors.push(`Ogiltig arketyp '${manifest.archetype}'`);
  }

  // Check Definition
  const def = manifest.definition;
  if (!def) {
    errors.push("Definitionsobjekt saknas");
    return { valid: errors.length === 0, errors, warnings };
  }

  // Check walk speeds
  if (def.walkSpeed !== undefined && (def.walkSpeed <= 0 || def.walkSpeed > 100)) {
    errors.push(`Orimlig walkSpeed (${def.walkSpeed}). Måste vara mellan 1 och 100.`);
  }

  // Check jump
  if (def.jumpVy !== undefined && (def.jumpVy <= 0 || def.jumpVy > 250)) {
    errors.push(`Orimlig jumpVy (${def.jumpVy}). Måste vara mellan 1 och 250.`);
  }

  // Check boxes if provided
  if (def.pushbox) {
    if (def.pushbox.w <= 0 || def.pushbox.h <= 0) {
      errors.push("Pushbox måste ha positiva mått");
    }
  }

  // Check moves if provided
  if (def.moves) {
    for (const [mKey, move] of Object.entries(def.moves)) {
      if (!move) continue;
      if (move.startup <= 0) {
        errors.push(`Move '${mKey}': startup måste vara > 0`);
      }
      if (move.active <= 0) {
        errors.push(`Move '${mKey}': active måste vara > 0`);
      }
      if (move.damage < 0 || move.damage > 500) {
        errors.push(`Move '${mKey}': orimlig skada (${move.damage})`);
      }
      if (move.meterCost && move.meterCost > 1000) {
        errors.push(`Move '${mKey}': meterCost kan inte överstiga 1000`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
