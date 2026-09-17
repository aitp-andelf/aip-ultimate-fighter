import type { CharacterDef, CharacterId } from "@aipuf/contracts";
import { ZONER_A } from "./zoner-a.ts";
import { ZONER_B } from "./zoner-b.ts";
import { SHOTO_A } from "./shoto-a.ts";
import { SHOTO_B } from "./shoto-b.ts";
import { GRAPPLER_A } from "./grappler-a.ts";
import { GRAPPLER_B } from "./grappler-b.ts";
import { HYBRID_A } from "./hybrid-a.ts";
import { HYBRID_B } from "./hybrid-b.ts";
import { BENNY } from "./benny.ts";
import { TARD } from "./tard.ts";

export * from "./common.ts";
export { ZONER_A, ZONER_B, SHOTO_A, SHOTO_B, GRAPPLER_A, GRAPPLER_B, HYBRID_A, HYBRID_B, BENNY, TARD };

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  "zoner-a": ZONER_A,
  "zoner-b": ZONER_B,
  "shoto-a": SHOTO_A,
  "shoto-b": SHOTO_B,
  "grappler-a": GRAPPLER_A,
  "grappler-b": GRAPPLER_B,
  "hybrid-a": HYBRID_A,
  "hybrid-b": HYBRID_B,
  benny: BENNY,
  tard: TARD,
};

export const CHARACTER_LIST: CharacterDef[] = [
  ZONER_A,
  ZONER_B,
  SHOTO_A,
  SHOTO_B,
  GRAPPLER_A,
  GRAPPLER_B,
  HYBRID_A,
  HYBRID_B,
  BENNY,
  TARD,
];

export function getCharacter(id: CharacterId): CharacterDef {
  const char = CHARACTERS[id];
  if (!char) {
    throw new Error(`Character ${id} not found`);
  }
  return char;
}
