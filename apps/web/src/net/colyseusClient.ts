import { Client, type Room } from "colyseus.js";
import {
  PROTOCOL_VERSION,
  type CharacterId,
  type MatchStartPayload,
  type RoomStatePayload,
  type SlotId,
  type SnapshotPayload,
} from "@aipuf/contracts";

export interface NetworkCallbacks {
  onRoomState: (state: RoomStatePayload) => void;
  onMatchStart: (data: MatchStartPayload) => void;
  onSnapshot: (snapshot: SnapshotPayload) => void;
  onError: (msg: string) => void;
  onDisconnect: () => void;
}

export class NetworkClient {
  private client: Client;
  private room: Room | null = null;
  private callbacks: NetworkCallbacks;
  public connected = false;

  constructor(serverUrl: string, callbacks: NetworkCallbacks) {
    this.client = new Client(serverUrl);
    this.callbacks = callbacks;
  }

  public async connect(displayName: string): Promise<void> {
    const reconnectToken = sessionStorage.getItem("aipuf_reconnect_token") ?? undefined;

    try {
      this.room = await this.client.joinOrCreate("match", {
        protocolVersion: PROTOCOL_VERSION,
        contentVersion: 1,
        displayName,
        reconnectToken,
      });

      this.connected = true;

      this.room.onMessage("room_state", (payload: RoomStatePayload) => {
        // Save reconnect token if assigned
        const mySlot = payload.p1.sessionId === this.room?.sessionId ? payload.p1 : payload.p2.sessionId === this.room?.sessionId ? payload.p2 : null;
        if (mySlot?.reconnectToken) {
          sessionStorage.setItem("aipuf_reconnect_token", mySlot.reconnectToken);
        }
        this.callbacks.onRoomState(payload);
      });

      this.room.onMessage("match_start", (data: MatchStartPayload) => {
        this.callbacks.onMatchStart(data);
      });

      this.room.onMessage("snapshot", (snapshot: SnapshotPayload) => {
        this.callbacks.onSnapshot(snapshot);
      });

      this.room.onMessage("error", (err: { message: string }) => {
        this.callbacks.onError(err.message);
      });

      this.room.onLeave(() => {
        this.connected = false;
        this.callbacks.onDisconnect();
      });
    } catch (err: any) {
      this.connected = false;
      this.callbacks.onError(err?.message ?? "Kunde inte ansluta till servern");
    }
  }

  public claimSlot(slot: SlotId): void {
    this.room?.send("claim_slot", { slot });
  }

  public selectCharacter(characterId: CharacterId, palette: 0 | 1): void {
    this.room?.send("select_character", { characterId, palette });
  }

  public setReady(ready: boolean): void {
    this.room?.send("ready", { ready });
  }

  public sendInput(seq: number, tick: number, bits: number): void {
    this.room?.send("input", { seq, tick, bits });
  }

  public requestRematch(ready: boolean): void {
    this.room?.send("rematch", { ready });
  }

  public leaveSlot(): void {
    this.room?.send("leave_slot");
  }

  public disconnect(): void {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
    this.connected = false;
  }

  public getSessionId(): string | null {
    return this.room?.sessionId ?? null;
  }
}
