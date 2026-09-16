import {
  CHARACTER_IDS,
  ClaimSlotSchema,
  JoinOptionsSchema,
  PROTOCOL_VERSION,
  ReadySchema,
  SelectCharacterSchema,
  TICK_HZ,
  TickInputSchema,
  type CharacterId,
  type RoomPhase,
  type SlotId,
  type TickInputMsg,
} from "@aipuf/contracts";
import { getCharacter } from "@aipuf/content";
import {
  createInitialMatchState,
  hashState,
  simStep,
  type MatchState,
  type TickInput,
} from "@aipuf/sim";
import { Room, type Client } from "colyseus";
import type {
  MatchStartPayload,
  QueueEntry,
  RoomStatePayload,
  SlotInfo,
  SnapshotPayload,
} from "../protocol/messages.ts";

export class MatchRoom extends Room {
  override maxClients = 32; // 2 fighters + spectators

  private phase: RoomPhase = "lobby";
  private stageId = "serverrum";

  private p1: SlotInfo = this.createEmptySlot();
  private p2: SlotInfo = this.createEmptySlot();
  private queue: QueueEntry[] = [];
  private clientNames = new Map<string, string>();
  private reconnectTimeouts = new Map<string, NodeJS.Timeout>();

  private simState: MatchState | null = null;
  private p1Input: TickInput = { bits: 0 };
  private p2Input: TickInput = { bits: 0 };
  private simInterval: any = null;
  private snapshotCounter = 0;

  override onCreate(options: any): void {
    if (options?.stageId) {
      this.stageId = options.stageId;
    }

    // Handlers
    this.onMessage("claim_slot", (client, data) => this.handleClaimSlot(client, data));
    this.onMessage("select_character", (client, data) => this.handleSelectCharacter(client, data));
    this.onMessage("ready", (client, data) => this.handleReady(client, data));
    this.onMessage("input", (client, data) => this.handleInput(client, data));
    this.onMessage("rematch", (client, data) => this.handleRematch(client, data));
    this.onMessage("leave_slot", (client) => this.handleLeaveSlot(client));
    this.onMessage("join_queue", (client) => this.handleJoinQueue(client));
  }

  override onJoin(client: Client, rawOptions: any): void {
    let options;
    try {
      options = JoinOptionsSchema.parse(rawOptions);
    } catch {
      options = {
        protocolVersion: PROTOCOL_VERSION,
        contentVersion: 1,
        displayName: `Gäst_${client.sessionId.slice(0, 4)}`,
      };
    }

    this.clientNames.set(client.sessionId, options.displayName);

    // Reconnection check
    if (options.reconnectToken) {
      if (this.p1.reconnectToken === options.reconnectToken && !this.p1.connected) {
        this.clearReconnectTimeout("p1");
        this.p1.sessionId = client.sessionId;
        this.p1.connected = true;
        this.sendRoomState();
        return;
      }
      if (this.p2.reconnectToken === options.reconnectToken && !this.p2.connected) {
        this.clearReconnectTimeout("p2");
        this.p2.sessionId = client.sessionId;
        this.p2.connected = true;
        this.sendRoomState();
        return;
      }
    }

    // Auto-queue if slots are full
    if (this.p1.sessionId && this.p2.sessionId) {
      this.addToQueue(client.sessionId, options.displayName);
    }

    this.sendRoomState();
  }

  override async onLeave(client: Client, consented: boolean): Promise<void> {
    const slotId = this.getSlotForSession(client.sessionId);

    if (slotId) {
      if (consented || this.phase === "lobby") {
        this.clearSlot(slotId);
        this.promoteFromQueue(slotId);
      } else {
        // Unexpected disconnect during match: wait for reconnect
        const slot = slotId === "p1" ? this.p1 : this.p2;
        slot.connected = false;

        const timeout = setTimeout(() => {
          this.clearSlot(slotId);
          this.promoteFromQueue(slotId);
          if (this.phase === "fighting") {
            this.stopSimulation();
            this.phase = "lobby";
          }
          this.sendRoomState();
        }, 20000); // 20 seconds grace

        this.reconnectTimeouts.set(slotId, timeout);
      }
    } else {
      this.removeFromQueue(client.sessionId);
    }

    this.clientNames.delete(client.sessionId);
    this.sendRoomState();
  }

  override onDispose(): void {
    this.stopSimulation();
    for (const t of this.reconnectTimeouts.values()) {
      clearTimeout(t);
    }
  }

  // --- Handlers ---

  private handleClaimSlot(client: Client, data: unknown): void {
    const parsed = ClaimSlotSchema.safeParse(data);
    if (!parsed.success) return;

    if (this.phase !== "lobby") {
      client.send("error", { message: "Matchen pågår redan" });
      return;
    }

    const currentSlot = this.getSlotForSession(client.sessionId);
    if (currentSlot) {
      client.send("error", { message: "Du har redan en spelarplats" });
      return;
    }

    const name = this.clientNames.get(client.sessionId) ?? "Spelare";
    const requested = parsed.data.slot;

    // Rule: "Första spelaren kan välja sida; andra får återstående."
    if (requested === "p1") {
      if (!this.p1.sessionId) {
        this.assignSlot("p1", client.sessionId, name);
      } else if (!this.p2.sessionId) {
        this.assignSlot("p2", client.sessionId, name);
      } else {
        client.send("error", { message: "Inga platser lediga" });
        return;
      }
    } else {
      if (!this.p2.sessionId) {
        this.assignSlot("p2", client.sessionId, name);
      } else if (!this.p1.sessionId) {
        this.assignSlot("p1", client.sessionId, name);
      } else {
        client.send("error", { message: "Inga platser lediga" });
        return;
      }
    }

    this.removeFromQueue(client.sessionId);
    this.sendRoomState();
  }

  private handleSelectCharacter(client: Client, data: unknown): void {
    const parsed = SelectCharacterSchema.safeParse(data);
    if (!parsed.success) return;

    const slotId = this.getSlotForSession(client.sessionId);
    if (!slotId) return;

    const slot = slotId === "p1" ? this.p1 : this.p2;
    slot.characterId = parsed.data.characterId;
    slot.palette = parsed.data.palette;
    slot.ready = false; // reset ready on character change

    this.sendRoomState();
  }

  private handleReady(client: Client, data: unknown): void {
    const parsed = ReadySchema.safeParse(data);
    if (!parsed.success) return;

    const slotId = this.getSlotForSession(client.sessionId);
    if (!slotId) return;

    const slot = slotId === "p1" ? this.p1 : this.p2;
    if (!slot.characterId) {
      client.send("error", { message: "Välj karaktär innan du blir redo" });
      return;
    }

    slot.ready = parsed.data.ready;
    this.sendRoomState();

    // Check if both ready -> start match!
    if (this.p1.ready && this.p2.ready && this.p1.characterId && this.p2.characterId) {
      this.startMatch();
    }
  }

  private handleInput(client: Client, data: unknown): void {
    const parsed = TickInputSchema.safeParse(data);
    if (!parsed.success) return;

    const slotId = this.getSlotForSession(client.sessionId);
    if (!slotId) return;

    if (slotId === "p1") {
      this.p1Input = { bits: parsed.data.bits };
    } else {
      this.p2Input = { bits: parsed.data.bits };
    }
  }

  private handleRematch(client: Client, data: unknown): void {
    const parsed = ReadySchema.safeParse(data);
    if (!parsed.success) return;

    const slotId = this.getSlotForSession(client.sessionId);
    if (!slotId) return;

    const slot = slotId === "p1" ? this.p1 : this.p2;
    slot.ready = parsed.data.ready;
    this.sendRoomState();

    if (this.p1.ready && this.p2.ready && this.phase === "match_end") {
      this.startMatch();
    }
  }

  private handleLeaveSlot(client: Client): void {
    const slotId = this.getSlotForSession(client.sessionId);
    if (!slotId) return;

    this.clearSlot(slotId);
    this.addToQueue(client.sessionId, this.clientNames.get(client.sessionId) ?? "Gäst");
    this.promoteFromQueue(slotId);
    this.sendRoomState();
  }

  private handleJoinQueue(client: Client): void {
    if (this.getSlotForSession(client.sessionId)) return;
    this.addToQueue(client.sessionId, this.clientNames.get(client.sessionId) ?? "Gäst");
    this.sendRoomState();
  }

  // --- Match & Simulation lifecycle ---

  private startMatch(): void {
    this.phase = "countdown";
    this.p1.ready = false;
    this.p2.ready = false;

    const p1Def = getCharacter(this.p1.characterId!);
    const p2Def = getCharacter(this.p2.characterId!);

    this.simState = createInitialMatchState({
      p1: p1Def,
      p2: p2Def,
    });

    const matchStartPayload: MatchStartPayload = {
      stageId: this.stageId,
      p1: {
        displayName: this.p1.displayName!,
        characterId: this.p1.characterId!,
        palette: this.p1.palette,
      },
      p2: {
        displayName: this.p2.displayName!,
        characterId: this.p2.characterId!,
        palette: this.p2.palette,
      },
    };

    this.broadcast("match_start", matchStartPayload);
    this.sendRoomState();

    this.stopSimulation();
    this.simInterval = this.clock.setInterval(() => this.tickSimulation(), 1000 / TICK_HZ);
  }

  private tickSimulation(): void {
    if (!this.simState) return;

    simStep(this.simState, [this.p1Input, this.p2Input]);

    // Keep room phase in sync with sim round phase
    this.phase = this.simState.round.phase;

    // Send snapshots at 20 Hz (every 3 ticks) or on events
    this.snapshotCounter++;
    const shouldBroadcast =
      this.snapshotCounter % 3 === 0 ||
      this.simState.events.length > 0 ||
      this.phase === "round_end" ||
      this.phase === "match_end";

    if (shouldBroadcast) {
      this.broadcastSnapshot();
    }

    if (this.phase === "match_end") {
      this.stopSimulation();
      this.sendRoomState();
    }
  }

  private broadcastSnapshot(): void {
    if (!this.simState) return;

    const f0 = this.simState.fighters[0];
    const f1 = this.simState.fighters[1];
    const rnd = this.simState.round;

    const snapshot: SnapshotPayload = {
      tick: this.simState.tick,
      hash: hashState(this.simState),
      f0: {
        x: f0.x,
        y: f0.y,
        vx: f0.vx,
        vy: f0.vy,
        facing: f0.facing,
        state: f0.state,
        stateTime: f0.stateTime,
        health: f0.health,
        meter: f0.meter,
        moveId: f0.moveId,
        attackAge: f0.attackAge,
        hitstun: f0.hitstun,
        blockstun: f0.blockstun,
        hitstop: f0.hitstop,
        comboHits: f0.comboHits,
        comboDamage: f0.comboDamage,
      },
      f1: {
        x: f1.x,
        y: f1.y,
        vx: f1.vx,
        vy: f1.vy,
        facing: f1.facing,
        state: f1.state,
        stateTime: f1.stateTime,
        health: f1.health,
        meter: f1.meter,
        moveId: f1.moveId,
        attackAge: f1.attackAge,
        hitstun: f1.hitstun,
        blockstun: f1.blockstun,
        hitstop: f1.hitstop,
        comboHits: f1.comboHits,
        comboDamage: f1.comboDamage,
      },
      projectiles: this.simState.projectiles.map((p) => ({
        id: p.id,
        owner: p.owner,
        x: p.x,
        y: p.y,
        life: p.life,
        kind: p.kind,
      })),
      round: {
        phase: rnd.phase,
        timer: rnd.timer,
        wins: rnd.wins,
        roundsPlayed: rnd.roundsPlayed,
        countdown: rnd.countdown,
        result: rnd.result,
        roundResult: rnd.roundResult,
      },
      events: this.simState.events,
    };

    this.broadcast("snapshot", snapshot);
  }

  private stopSimulation(): void {
    if (this.simInterval) {
      this.simInterval.clear();
      this.simInterval = null;
    }
  }

  // --- Helper methods ---

  private createEmptySlot(): SlotInfo {
    return {
      sessionId: null,
      displayName: null,
      characterId: null,
      palette: 0,
      ready: false,
      connected: false,
      reconnectToken: null,
    };
  }

  private getSlotForSession(sessionId: string): SlotId | null {
    if (this.p1.sessionId === sessionId) return "p1";
    if (this.p2.sessionId === sessionId) return "p2";
    return null;
  }

  private assignSlot(slotId: SlotId, sessionId: string, displayName: string): void {
    const slot = slotId === "p1" ? this.p1 : this.p2;
    slot.sessionId = sessionId;
    slot.displayName = displayName;
    slot.characterId = "shoto-a"; // default
    slot.palette = slotId === "p1" ? 0 : 1;
    slot.ready = false;
    slot.connected = true;
    slot.reconnectToken = `tok_${sessionId}_${Date.now()}`;
  }

  private clearSlot(slotId: SlotId): void {
    if (slotId === "p1") {
      this.p1 = this.createEmptySlot();
    } else {
      this.p2 = this.createEmptySlot();
    }
    this.clearReconnectTimeout(slotId);
  }

  private clearReconnectTimeout(slotId: SlotId): void {
    const t = this.reconnectTimeouts.get(slotId);
    if (t) {
      clearTimeout(t);
      this.reconnectTimeouts.delete(slotId);
    }
  }

  private addToQueue(sessionId: string, displayName: string): void {
    if (!this.queue.some((q) => q.sessionId === sessionId)) {
      this.queue.push({
        sessionId,
        displayName,
        joinedAt: Date.now(),
      });
    }
  }

  private removeFromQueue(sessionId: string): void {
    this.queue = this.queue.filter((q) => q.sessionId !== sessionId);
  }

  private promoteFromQueue(slotId: SlotId): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      this.assignSlot(slotId, next.sessionId, next.displayName);
    }
  }

  private sendRoomState(): void {
    const spectatorCount = Math.max(
      0,
      this.clients.length - (this.p1.sessionId ? 1 : 0) - (this.p2.sessionId ? 1 : 0)
    );

    const payload: RoomStatePayload = {
      phase: this.phase,
      p1: this.p1,
      p2: this.p2,
      queue: this.queue,
      spectatorCount,
      stageId: this.stageId,
    };

    this.broadcast("room_state", payload);
  }
}
