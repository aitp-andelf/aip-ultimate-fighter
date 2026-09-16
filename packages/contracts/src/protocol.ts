import { z } from "zod";
import { CHARACTER_IDS, PROTOCOL_VERSION, type CharacterId, type RoomPhase } from "./ids.ts";

export const TickInputSchema = z.object({
  seq: z.number().int().nonnegative(),
  tick: z.number().int().nonnegative(),
  bits: z.number().int().nonnegative(),
});
export type TickInputMsg = z.infer<typeof TickInputSchema>;

export const JoinOptionsSchema = z.object({
  protocolVersion: z.literal(PROTOCOL_VERSION),
  contentVersion: z.number().int().positive(),
  displayName: z.string().min(1).max(32),
  reconnectToken: z.string().max(128).optional(),
  sessionId: z.string().max(128).optional(),
});
export type JoinOptions = z.infer<typeof JoinOptionsSchema>;

export const ClaimSlotSchema = z.object({
  slot: z.enum(["p1", "p2"]),
});

export const SelectCharacterSchema = z.object({
  characterId: z.enum(CHARACTER_IDS),
  palette: z.union([z.literal(0), z.literal(1)]),
});

export const ChatSafeNameSchema = z.string().max(32).regex(/^[^<>]*$/);

export const ReadySchema = z.object({ ready: z.boolean() });

export function parseMsg<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

export interface SlotInfo {
  sessionId: string | null;
  displayName: string | null;
  characterId: CharacterId | null;
  palette: number;
  ready: boolean;
  connected: boolean;
  reconnectToken: string | null;
}

export interface QueueEntry {
  sessionId: string;
  displayName: string;
  joinedAt: number;
}

export interface RoomStatePayload {
  phase: RoomPhase;
  p1: SlotInfo;
  p2: SlotInfo;
  queue: QueueEntry[];
  spectatorCount: number;
  stageId: string;
}

export interface MatchStartPayload {
  stageId: string;
  p1: {
    displayName: string;
    characterId: CharacterId;
    palette: number;
  };
  p2: {
    displayName: string;
    characterId: CharacterId;
    palette: number;
  };
}

export interface SimEventData {
  id: number;
  kind: string;
  tick: number;
  source: 0 | 1 | 2;
  moveId?: string;
  attackInstanceId?: number;
}

export interface SnapshotPayload {
  tick: number;
  hash: number;
  f0: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    facing: 1 | -1;
    state: string;
    stateTime: number;
    health: number;
    meter: number;
    moveId: string | null;
    attackAge: number;
    hitstun: number;
    blockstun: number;
    hitstop: number;
    comboHits: number;
    comboDamage: number;
  };
  f1: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    facing: 1 | -1;
    state: string;
    stateTime: number;
    health: number;
    meter: number;
    moveId: string | null;
    attackAge: number;
    hitstun: number;
    blockstun: number;
    hitstop: number;
    comboHits: number;
    comboDamage: number;
  };
  projectiles: Array<{
    id: number;
    owner: 0 | 1;
    x: number;
    y: number;
    life: number;
    kind: "proj" | "zone";
  }>;
  round: {
    phase: string;
    timer: number;
    wins: [number, number];
    roundsPlayed: number;
    countdown: number;
    result: string | null;
    roundResult: string | null;
  };
  events: SimEventData[];
}
