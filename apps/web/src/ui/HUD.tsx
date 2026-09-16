import React from "react";
import type { CharacterDef } from "@aipuf/contracts";
import type { MatchState } from "@aipuf/sim";

interface HudProps {
  state: MatchState;
  p1Name?: string;
  p2Name?: string;
  p1Char: CharacterDef;
  p2Char: CharacterDef;
}

export const HUD: React.FC<HudProps> = ({
  state,
  p1Name = "Spelare 1",
  p2Name = "Spelare 2",
  p1Char,
  p2Char,
}) => {
  const f0 = state.fighters[0];
  const f1 = state.fighters[1];
  const round = state.round;

  const p1HealthPercent = Math.max(0, (f0.health / 1000) * 100);
  const p2HealthPercent = Math.max(0, (f1.health / 1000) * 100);

  const p1MeterPercent = Math.min(100, (f0.meter / 1000) * 100);
  const p2MeterPercent = Math.min(100, (f1.meter / 1000) * 100);

  const secondsLeft = Math.ceil(round.timer / 60);

  // Announcer text
  let bannerText: string | null = null;
  if (round.phase === "countdown") {
    bannerText = round.countdown > 60 ? `ROND ${round.roundsPlayed + 1}` : "STRID!";
  } else if (round.phase === "round_end") {
    if (round.roundResult === "p1") bannerText = `${p1Name.toUpperCase()} VINNER!`;
    else if (round.roundResult === "p2") bannerText = `${p2Name.toUpperCase()} VINNER!`;
    else if (round.roundResult === "double_ko") bannerText = "DUBBEL KO!";
    else bannerText = "TIDEN ÄR UTE!";
  } else if (round.phase === "match_end") {
    if (round.result === "p1") bannerText = `${p1Name.toUpperCase()} TAR MATCHEN!`;
    else if (round.result === "p2") bannerText = `${p2Name.toUpperCase()} TAR MATCHEN!`;
    else bannerText = "OAVGJORD MATCH!";
  }

  return (
    <div className="hud-container pointer-events-none absolute inset-0 select-none overflow-hidden font-sans">
      {/* Top Bar: Health, Names, Timer, Rounds */}
      <div className="flex w-full items-center justify-between px-6 pt-4">
        {/* P1 Section */}
        <div className="flex flex-1 flex-col items-start pr-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-wider text-white drop-shadow">
              {p1Name}
            </span>
            <span className="rounded bg-blue-600/60 px-2 py-0.5 text-xs font-bold text-blue-200 uppercase">
              {p1Char.name}
            </span>
            {/* Round Dots */}
            <div className="flex gap-1.5 ml-2">
              <span className={`h-3.5 w-3.5 rounded-full border border-yellow-400 ${round.wins[0] >= 1 ? "bg-yellow-400 shadow-[0_0_8px_#facc15]" : "bg-black/50"}`} />
              <span className={`h-3.5 w-3.5 rounded-full border border-yellow-400 ${round.wins[0] >= 2 ? "bg-yellow-400 shadow-[0_0_8px_#facc15]" : "bg-black/50"}`} />
            </div>
          </div>

          {/* Health Bar P1 */}
          <div className="mt-1 h-7 w-full overflow-hidden rounded-sm border-2 border-slate-700 bg-slate-900/90 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 transition-all duration-75"
              style={{ width: `${p1HealthPercent}%`, transformOrigin: "left" }}
            />
          </div>

          {/* Super Meter P1 */}
          <div className="mt-1 flex w-3/4 items-center gap-2">
            <span className={`text-xs font-bold ${f0.meter >= 1000 ? "text-cyan-300 animate-pulse" : "text-slate-400"}`}>
              {f0.meter >= 1000 ? "SUPER KLAR" : "SUPER"}
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded-full border border-cyan-800 bg-slate-950">
              <div
                className={`h-full transition-all duration-100 ${f0.meter >= 1000 ? "bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-[0_0_12px_#38bdf8]" : "bg-blue-500"}`}
                style={{ width: `${p1MeterPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center Timer */}
        <div className="flex flex-col items-center justify-center px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-yellow-500/80 bg-slate-950/90 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
            <span className={`text-3xl font-black tracking-tight ${secondsLeft <= 10 ? "text-red-500 animate-ping" : "text-yellow-400"}`}>
              {state.training ? "∞" : secondsLeft}
            </span>
          </div>
          <span className="mt-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            {state.training ? "Träning" : `Rond ${round.roundsPlayed + 1}`}
          </span>
        </div>

        {/* P2 Section */}
        <div className="flex flex-1 flex-col items-end pl-4">
          <div className="flex items-center gap-3">
            {/* Round Dots */}
            <div className="flex gap-1.5 mr-2">
              <span className={`h-3.5 w-3.5 rounded-full border border-yellow-400 ${round.wins[1] >= 2 ? "bg-yellow-400 shadow-[0_0_8px_#facc15]" : "bg-black/50"}`} />
              <span className={`h-3.5 w-3.5 rounded-full border border-yellow-400 ${round.wins[1] >= 1 ? "bg-yellow-400 shadow-[0_0_8px_#facc15]" : "bg-black/50"}`} />
            </div>
            <span className="rounded bg-rose-600/60 px-2 py-0.5 text-xs font-bold text-rose-200 uppercase">
              {p2Char.name}
            </span>
            <span className="text-xl font-black tracking-wider text-white drop-shadow">
              {p2Name}
            </span>
          </div>

          {/* Health Bar P2 (reversed) */}
          <div className="mt-1 flex h-7 w-full justify-end overflow-hidden rounded-sm border-2 border-slate-700 bg-slate-900/90 shadow-inner">
            <div
              className="h-full bg-gradient-to-l from-emerald-500 via-yellow-400 to-red-500 transition-all duration-75"
              style={{ width: `${p2HealthPercent}%` }}
            />
          </div>

          {/* Super Meter P2 */}
          <div className="mt-1 flex w-3/4 items-center justify-end gap-2">
            <div className="h-3 flex-1 overflow-hidden rounded-full border border-rose-800 bg-slate-950">
              <div
                className={`ml-auto h-full transition-all duration-100 ${f1.meter >= 1000 ? "bg-gradient-to-l from-rose-400 to-purple-500 shadow-[0_0_12px_#f43f5e]" : "bg-rose-500"}`}
                style={{ width: `${p2MeterPercent}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${f1.meter >= 1000 ? "text-rose-300 animate-pulse" : "text-slate-400"}`}>
              {f1.meter >= 1000 ? "SUPER KLAR" : "SUPER"}
            </span>
          </div>
        </div>
      </div>

      {/* Combo Counters */}
      {f1.comboHits > 1 && (
        <div className="absolute left-8 top-32 animate-bounce rounded-lg bg-red-950/80 px-4 py-2 border border-red-500/60 text-white shadow-lg">
          <div className="text-2xl font-black text-yellow-400">{f1.comboHits} TRÄFFAR</div>
          <div className="text-xs font-semibold text-slate-300">{f1.comboDamage} SKADA</div>
        </div>
      )}
      {f0.comboHits > 1 && (
        <div className="absolute right-8 top-32 animate-bounce rounded-lg bg-blue-950/80 px-4 py-2 border border-blue-500/60 text-white shadow-lg text-right">
          <div className="text-2xl font-black text-yellow-400">{f0.comboHits} TRÄFFAR</div>
          <div className="text-xs font-semibold text-slate-300">{f0.comboDamage} SKADA</div>
        </div>
      )}

      {/* Announcer Banner */}
      {bannerText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="transform scale-110 rounded-2xl border-4 border-yellow-500/90 bg-slate-950/90 px-12 py-6 shadow-[0_0_50px_rgba(234,179,8,0.5)] backdrop-blur-md">
            <h1 className="text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 drop-shadow">
              {bannerText}
            </h1>
          </div>
        </div>
      )}
    </div>
  );
};
