import { CHARACTER_LIST } from "@aipuf/content";
import type { CharacterId, RoomStatePayload, SlotId } from "@aipuf/contracts";
import { sound } from "../audio/sound.ts";

interface LobbyScreenProps {
  roomState: RoomStatePayload | null;
  mySessionId: string | null;
  onClaimSlot: (slot: SlotId) => void;
  onSelectCharacter: (charId: CharacterId, palette: 0 | 1) => void;
  onSetReady: (ready: boolean) => void;
  onLeaveSlot: () => void;
  onBack: () => void;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  roomState,
  mySessionId,
  onClaimSlot,
  onSelectCharacter,
  onSetReady,
  onLeaveSlot,
  onBack,
}) => {
  const p1 = roomState?.p1;
  const p2 = roomState?.p2;
  const queue = roomState?.queue ?? [];

  const isP1 = p1?.sessionId === mySessionId;
  const isP2 = p2?.sessionId === mySessionId;
  const mySlot = isP1 ? p1 : isP2 ? p2 : null;

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 select-none">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-8 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { sound.playUiClick(); onBack(); }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-sm font-bold text-slate-300 hover:bg-slate-700 transition"
          >
            ← Tillbaka
          </button>
          <h1 className="text-2xl font-black tracking-wider text-yellow-400">
            ONLINE MATCHRUM
          </h1>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
          <span>Spectators: <strong className="text-white">{roomState?.spectatorCount ?? 0}</strong></span>
          <span>Bana: <strong className="text-cyan-400 uppercase">{roomState?.stageId ?? "serverrum"}</strong></span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid flex-1 grid-cols-12 gap-8 p-8 overflow-hidden">
        {/* Slot P1 */}
        <div className="col-span-5 flex flex-col rounded-2xl border-2 border-blue-500/40 bg-blue-950/20 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="rounded bg-blue-600 px-3 py-1 text-xs font-black tracking-wider text-white uppercase">
              Spelare 1
            </span>
            {p1?.sessionId && (
              <span className={`text-xs font-bold ${p1.ready ? "text-emerald-400" : "text-yellow-400"}`}>
                {p1.ready ? "READY!" : "SELECTING..."}
              </span>
            )}
          </div>

          {p1?.sessionId ? (
            <div className="mt-4 flex flex-1 flex-col justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">{p1.displayName}</h2>
                <div className="mt-2 text-sm text-blue-300">
                  Fighter: <strong className="text-white uppercase">{p1.characterId ?? "None"}</strong>
                </div>
              </div>

              {isP1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Choose fighter:</label>
                    <select
                      value={p1.characterId ?? "shoto-a"}
                      onChange={(e) => {
                        sound.playUiClick();
                        onSelectCharacter(e.target.value as CharacterId, p1.palette as 0 | 1);
                      }}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      {CHARACTER_LIST.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        sound.playUiClick();
                        onSetReady(!p1.ready);
                      }}
                      className={`flex-1 rounded-xl py-2.5 text-base font-black tracking-wider shadow-lg transition active:scale-95 ${
                        p1.ready
                          ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          : "bg-emerald-500 text-white hover:bg-emerald-400"
                      }`}
                    >
                      {p1.ready ? "CANCEL READY" : "JAG ÄR READY!"}
                    </button>
                    <button
                      onClick={() => {
                        sound.playUiClick();
                        onLeaveSlot();
                      }}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
                    >
                      Leave slot
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center">
              <span className="text-sm font-semibold text-slate-500">Slot open</span>
              {!mySlot && (
                <button
                  onClick={() => { sound.playUiClick(); onClaimSlot("p1"); }}
                  className="mt-4 rounded-xl bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow hover:bg-blue-500 active:scale-95 transition"
                >
                  Ta Spelare 1
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center Queue / Status */}
        <div className="col-span-2 flex flex-col items-center justify-start rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">
            Queue ({queue.length})
          </h3>

          <div className="mt-4 w-full flex-1 space-y-2 overflow-y-auto">
            {queue.length === 0 ? (
              <span className="text-center block text-xs text-slate-600 mt-6">Queue empty</span>
            ) : (
              queue.map((q, idx) => (
                <div
                  key={q.sessionId}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs"
                >
                  <span className="font-bold text-slate-300">#{idx + 1} {q.displayName}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Slot P2 */}
        <div className="col-span-5 flex flex-col rounded-2xl border-2 border-rose-500/40 bg-rose-950/20 p-6 backdrop-blur text-right">
          <div className="flex items-center justify-between flex-row-reverse">
            <span className="rounded bg-rose-600 px-3 py-1 text-xs font-black tracking-wider text-white uppercase">
              Spelare 2
            </span>
            {p2?.sessionId && (
              <span className={`text-xs font-bold ${p2.ready ? "text-emerald-400" : "text-yellow-400"}`}>
                {p2.ready ? "READY!" : "SELECTING..."}
              </span>
            )}
          </div>

          {p2?.sessionId ? (
            <div className="mt-4 flex flex-1 flex-col justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">{p2.displayName}</h2>
                <div className="mt-2 text-sm text-rose-300">
                  Fighter: <strong className="text-white uppercase">{p2.characterId ?? "None"}</strong>
                </div>
              </div>

              {isP2 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase block text-left">Choose fighter:</label>
                    <select
                      value={p2.characterId ?? "shoto-a"}
                      onChange={(e) => {
                        sound.playUiClick();
                        onSelectCharacter(e.target.value as CharacterId, p2.palette as 0 | 1);
                      }}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-sm text-white focus:outline-none focus:border-rose-500"
                    >
                      {CHARACTER_LIST.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        sound.playUiClick();
                        onLeaveSlot();
                      }}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
                    >
                      Leave slot
                    </button>
                    <button
                      onClick={() => {
                        sound.playUiClick();
                        onSetReady(!p2.ready);
                      }}
                      className={`flex-1 rounded-xl py-2.5 text-base font-black tracking-wider shadow-lg transition active:scale-95 ${
                        p2.ready
                          ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          : "bg-emerald-500 text-white hover:bg-emerald-400"
                      }`}
                    >
                      {p2.ready ? "CANCEL READY" : "JAG ÄR READY!"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center">
              <span className="text-sm font-semibold text-slate-500">Slot open</span>
              {!mySlot && (
                <button
                  onClick={() => { sound.playUiClick(); onClaimSlot("p2"); }}
                  className="mt-4 rounded-xl bg-rose-600 px-6 py-2 text-sm font-bold text-white shadow hover:bg-rose-500 active:scale-95 transition"
                >
                  Ta Spelare 2
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
