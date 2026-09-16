import React, { useEffect, useState } from "react";
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

  // Red trailing damage bars
  const [p1LagHealth, setP1LagHealth] = useState(p1HealthPercent);
  const [p2LagHealth, setP2LagHealth] = useState(p2HealthPercent);

  useEffect(() => {
    if (p1HealthPercent < p1LagHealth) {
      const timer = setTimeout(() => {
        setP1LagHealth(p1HealthPercent);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setP1LagHealth(p1HealthPercent);
    }
  }, [p1HealthPercent, p1LagHealth]);

  useEffect(() => {
    if (p2HealthPercent < p2LagHealth) {
      const timer = setTimeout(() => {
        setP2LagHealth(p2HealthPercent);
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setP2LagHealth(p2HealthPercent);
    }
  }, [p2HealthPercent, p2LagHealth]);

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
      <div className="flex w-full items-start justify-between px-6 pt-4">
        {/* P1 Section */}
        <div className="flex flex-1 items-center gap-3 pr-4">
          {/* Fighter Avatar Portrait */}
          <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-blue-400 bg-gradient-to-br from-blue-900 to-slate-950 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            <span className="text-2xl font-black text-blue-300">
              {p1Char.name.charAt(0)}
            </span>
            <div className="absolute bottom-0 inset-x-0 bg-blue-600/80 py-0.5 text-center text-[9px] font-black uppercase text-white">
              P1
            </div>
          </div>

          <div className="flex flex-1 flex-col items-start">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {p1Name}
              </span>
              <span className="rounded bg-blue-600/80 px-2 py-0.5 text-[10px] font-extrabold text-blue-100 uppercase tracking-wide border border-blue-400/40">
                {p1Char.name}
              </span>
              {/* Round Dots */}
              <div className="flex gap-1.5 ml-2">
                <span className={`h-3.5 w-3.5 rounded-full border border-yellow-400 transition-all ${round.wins[0] >= 1 ? "bg-yellow-400 shadow-[0_0_10px_#facc15]" : "bg-black/60"}`} />
                <span className={`h-3.5 w-3.5 rounded-full border border-yellow-400 transition-all ${round.wins[0] >= 2 ? "bg-yellow-400 shadow-[0_0_10px_#facc15]" : "bg-black/60"}`} />
              </div>
            </div>

            {/* Health Bar P1 with Red Damage Deficit Lag */}
            <div className="relative mt-1 h-7 w-full overflow-hidden rounded-sm border-2 border-slate-700 bg-slate-950 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
              {/* Red Lag Gauge */}
              <div
                className="absolute inset-y-0 left-0 bg-red-600 transition-all duration-300"
                style={{ width: `${p1LagHealth}%` }}
              />
              {/* Active Health Gauge */}
              <div
                data-testid="p1-health-bar"
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 via-amber-400 to-yellow-500 transition-all duration-75 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                style={{ width: `${p1HealthPercent}%` }}
              />
            </div>

            {/* Super Meter P1 */}
            <div className="mt-1.5 flex w-4/5 items-center gap-2">
              <span className={`text-[11px] font-black tracking-wider ${f0.meter >= 1000 ? "text-cyan-300 animate-pulse drop-shadow-[0_0_8px_#38bdf8]" : "text-slate-400"}`}>
                {f0.meter >= 1000 ? "SUPER MAX" : "SUPER"}
              </span>
              <div className="relative h-3.5 flex-1 overflow-hidden rounded-full border border-cyan-800/80 bg-slate-950">
                <div
                  className={`h-full transition-all duration-100 ${f0.meter >= 1000 ? "bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 shadow-[0_0_14px_#38bdf8]" : "bg-gradient-to-r from-blue-600 to-cyan-500"}`}
                  style={{ width: `${p1MeterPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center Timer */}
        <div className="flex flex-col items-center justify-center px-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-yellow-500 bg-gradient-to-b from-slate-900 to-slate-950 shadow-[0_0_25px_rgba(234,179,8,0.4)]">
            <span className={`text-3xl font-black tracking-tight ${secondsLeft <= 10 && !state.training ? "text-red-500 animate-ping" : "text-yellow-400 drop-shadow"}`}>
              {state.training ? "∞" : secondsLeft}
            </span>
          </div>
          <span className="mt-1 text-[10px] font-black tracking-widest text-slate-300 uppercase drop-shadow">
            {state.training ? "Träning" : `Rond ${round.roundsPlayed + 1}`}
          </span>
        </div>

        {/* P2 Section */}
        <div className="flex flex-1 items-center justify-end gap-3 pl-4">
          <div className="flex flex-1 flex-col items-end">
            <div className="flex items-center gap-2">
              {/* Round Dots */}
              <div className="flex gap-1.5 mr-2">
                <span className={`h-3.5 w-3.5 rounded-full border border-yellow-400 transition-all ${round.wins[1] >= 2 ? "bg-yellow-400 shadow-[0_0_10px_#facc15]" : "bg-black/60"}`} />
                <span className={`h-3.5 w-3.5 rounded-full border border-yellow-400 transition-all ${round.wins[1] >= 1 ? "bg-yellow-400 shadow-[0_0_10px_#facc15]" : "bg-black/60"}`} />
              </div>
              <span className="rounded bg-rose-600/80 px-2 py-0.5 text-[10px] font-extrabold text-rose-100 uppercase tracking-wide border border-rose-400/40">
                {p2Char.name}
              </span>
              <span className="text-xl font-black tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {p2Name}
              </span>
            </div>

            {/* Health Bar P2 with Red Damage Deficit Lag (Reversed) */}
            <div className="relative mt-1 flex h-7 w-full justify-end overflow-hidden rounded-sm border-2 border-slate-700 bg-slate-950 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
              {/* Red Lag Gauge */}
              <div
                className="absolute inset-y-0 right-0 bg-red-600 transition-all duration-300"
                style={{ width: `${p2LagHealth}%` }}
              />
              {/* Active Health Gauge */}
              <div
                data-testid="p2-health-bar"
                className="absolute inset-y-0 right-0 bg-gradient-to-l from-emerald-400 via-amber-400 to-yellow-500 transition-all duration-75 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                style={{ width: `${p2HealthPercent}%` }}
              />
            </div>

            {/* Super Meter P2 */}
            <div className="mt-1.5 flex w-4/5 items-center justify-end gap-2">
              <div className="relative h-3.5 flex-1 overflow-hidden rounded-full border border-rose-800/80 bg-slate-950">
                <div
                  className={`ml-auto h-full transition-all duration-100 ${f1.meter >= 1000 ? "bg-gradient-to-l from-rose-400 via-pink-300 to-amber-400 shadow-[0_0_14px_#f43f5e]" : "bg-gradient-to-l from-rose-600 to-orange-500"}`}
                  style={{ width: `${p2MeterPercent}%` }}
                />
              </div>
              <span className={`text-[11px] font-black tracking-wider ${f1.meter >= 1000 ? "text-rose-300 animate-pulse drop-shadow-[0_0_8px_#f43f5e]" : "text-slate-400"}`}>
                {f1.meter >= 1000 ? "SUPER MAX" : "SUPER"}
              </span>
            </div>
          </div>

          {/* Fighter Avatar Portrait P2 */}
          <div className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-rose-400 bg-gradient-to-bl from-rose-900 to-slate-950 shadow-[0_0_15px_rgba(244,63,94,0.5)]">
            <span className="text-2xl font-black text-rose-300">
              {p2Char.name.charAt(0)}
            </span>
            <div className="absolute bottom-0 inset-x-0 bg-rose-600/80 py-0.5 text-center text-[9px] font-black uppercase text-white">
              P2
            </div>
          </div>
        </div>
      </div>

      {/* Combo Counters with Street Fighter typography */}
      {f1.comboHits > 1 && (
        <div className="absolute left-10 top-32 animate-bounce rounded-xl bg-gradient-to-r from-red-950/90 to-slate-950/90 px-5 py-3 border-2 border-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.5)] backdrop-blur">
          <div className="text-3xl font-black tracking-wider text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {f1.comboHits} TRÄFFAR
          </div>
          <div className="text-xs font-bold tracking-widest text-red-300 uppercase">
            {f1.comboDamage} SKADA
          </div>
        </div>
      )}
      {f0.comboHits > 1 && (
        <div className="absolute right-10 top-32 animate-bounce rounded-xl bg-gradient-to-l from-blue-950/90 to-slate-950/90 px-5 py-3 border-2 border-blue-500 text-white shadow-[0_0_25px_rgba(59,130,246,0.5)] backdrop-blur text-right">
          <div className="text-3xl font-black tracking-wider text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {f0.comboHits} TRÄFFAR
          </div>
          <div className="text-xs font-bold tracking-widest text-blue-300 uppercase">
            {f0.comboDamage} SKADA
          </div>
        </div>
      )}

      {/* Street Fighter Announcer Banner */}
      {bannerText && (
        <div data-testid="announcer-banner" className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="transform scale-110 rounded-2xl border-4 border-yellow-500/90 bg-slate-950/95 px-16 py-8 shadow-[0_0_80px_rgba(234,179,8,0.6)] backdrop-blur-md">
            <h1 className="text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-500 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              {bannerText}
            </h1>
          </div>
        </div>
      )}
    </div>
  );
};
