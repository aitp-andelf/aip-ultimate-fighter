export const PROTOCOL_VERSION = 1;
export const CONTENT_VERSION = 1;
export const TICK_HZ = 60;
export const INPUT_BUFFER_TICKS = 5;
export const UNIT = 1000;
export const MAX_HEALTH = 1000;
export const MAX_METER = 1000;
export const SUPER_COST = 1000;
export const ROUND_TIME_SECONDS = 99;
export const ROUND_TIME_TICKS = ROUND_TIME_SECONDS * TICK_HZ;
export const WINS_NEEDED = 2;
export const MAX_ROUNDS_PLAYED = 5;
export const SLOT_CHOICE_TICKS = 15 * TICK_HZ;
export const RECONNECT_GRACE_TICKS = 20 * TICK_HZ;
export const QUEUE_ACCEPT_TICKS = 12 * TICK_HZ;
export const THROW_TECH_WINDOW = 8;
export const THROW_INVULN_WAKEUP = 8;
export const SNAPSHOT_HZ = 20;
export const INPUT_LEAD_MIN = 2;
export const INPUT_LEAD_MAX = 8;
export const INPUT_LEAD_DEFAULT = 3;
export const FACING_DEADZONE = 80;
export const HITSTOP_DEFAULT = 4;

export const Buttons = {
  LEFT: 1 << 0,
  RIGHT: 1 << 1,
  DOWN: 1 << 2,
  UP: 1 << 3,
  HP: 1 << 4,
  LP: 1 << 5,
  HK: 1 << 6,
  LK: 1 << 7,
  SPECIAL: 1 << 8,
  SUPER: 1 << 9,
  THROW: 1 << 10,
} as const;

export type ButtonMask = number;

export const ButtonNames: Record<number, string> = {
  [Buttons.LEFT]: "Vänster",
  [Buttons.RIGHT]: "Höger",
  [Buttons.DOWN]: "Ducka",
  [Buttons.UP]: "Hoppa",
  [Buttons.HP]: "Hög box",
  [Buttons.LP]: "Låg box",
  [Buttons.HK]: "Hög spark",
  [Buttons.LK]: "Låg spark",
  [Buttons.SPECIAL]: "Special",
  [Buttons.SUPER]: "Super",
  [Buttons.THROW]: "Kast",
};

export type HitCategory = "HIGH" | "MID" | "LOW" | "OVERHEAD" | "THROW";
export type Archetype = "zoner-a" | "zoner-b" | "shoto-a" | "shoto-b" | "grappler-a" | "grappler-b" | "hybrid-a" | "hybrid-b";
export type SlotId = "p1" | "p2";
export type RoomPhase = "lobby" | "countdown" | "fighting" | "round_end" | "match_end";

export const CHARACTER_IDS = [
  "zoner-a",
  "zoner-b",
  "shoto-a",
  "shoto-b",
  "grappler-a",
  "grappler-b",
  "hybrid-a",
  "hybrid-b",
] as const;

export type CharacterId = (typeof CHARACTER_IDS)[number];
