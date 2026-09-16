import React, { useState } from "react";
import { CHARACTER_LIST, STAGE_LIST, getStage } from "@aipuf/content";
import type { CharacterDef, CharacterId, StageDef } from "@aipuf/contracts";
import { sound } from "../audio/sound.ts";

interface CharacterSelectProps {
  onSelect: (
    p1Char: CharacterDef,
    p2Char: CharacterDef,
    p1Palette: 0 | 1,
    p2Palette: 0 | 1,
    stage?: StageDef
  ) => void;
  onBack: () => void;
  singlePlayer?: boolean;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  onSelect,
  onBack,
  singlePlayer = false,
}) => {
  const [p1CharId, setP1CharId] = useState<CharacterId>("shoto-a"); // Irstababben
  const [p2CharId, setP2CharId] = useState<CharacterId>("grappler-a"); // Capitan
  const [p1Palette, setP1Palette] = useState<0 | 1>(0);
  const [p2Palette, setP2Palette] = useState<0 | 1>(1);
  const [selectedStageId, setSelectedStageId] = useState<string>("serverrum");
  const [activePicker, setActivePicker] = useState<"p1" | "p2">("p1");

  const p1Char = CHARACTER_LIST.find((c) => c.id === p1CharId)!;
  const p2Char = CHARACTER_LIST.find((c) => c.id === p2CharId)!;
  const stage = getStage(selectedStageId);

  const handleCharClick = (id: CharacterId) => {
    sound.playUiClick();
    if (activePicker === "p1") {
      setP1CharId(id);
      if (!singlePlayer) setActivePicker("p2");
    } else {
      setP2CharId(id);
      setActivePicker("p1");
    }
  };

  const handleStart = () => {
    sound.playRoundStart();
    onSelect(p1Char, p2Char, p1Palette, p2Palette, stage);
  };

  const getArchetypeBadgeColor = (archetype: string) => {
    if (archetype.startsWith("grappler")) return "bg-red-600/80 text-red-100 border-red-500/60";
    if (archetype.startsWith("shoto")) return "bg-blue-600/80 text-blue-100 border-blue-500/60";
    if (archetype.startsWith("zoner")) return "bg-emerald-600/80 text-emerald-100 border-emerald-500/60";
    return "bg-purple-600/80 text-purple-100 border-purple-500/60";
  };

  const getArchetypeBorder = (archetype: string) => {
    if (archetype.startsWith("grappler")) return "border-red-600/50 hover:border-red-400";
    if (archetype.startsWith("shoto")) return "border-blue-600/50 hover:border-blue-400";
    if (archetype.startsWith("zoner")) return "border-emerald-600/50 hover:border-emerald-400";
    return "border-purple-600/50 hover:border-purple-400";
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="relative z-20 flex items-center justify-between border-b-2 border-amber-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-8 py-3.5 backdrop-blur shadow-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { sound.playUiClick(); onBack(); }}
            className="rounded border border-slate-700 bg-slate-800/80 px-4 py-1.5 text-xs font-black uppercase text-slate-300 hover:bg-slate-700 active:scale-95 transition arcade-skew"
          >
            <span className="arcade-skew-reverse">← MENY</span>
          </button>
          <div className="arcade-skew flex items-center gap-2">
            <span className="font-arcade text-2xl tracking-wide text-arcade-gold drop-shadow">
              VÄLJ KÄMPE
            </span>
            <span className="text-xs font-mono font-bold text-amber-500/80 uppercase">
              // SELECT YOUR FIGHTER
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="arcade-skew flex items-center gap-2 rounded border border-amber-500/40 bg-slate-900/90 px-3.5 py-1">
            <span className="text-[10px] font-black uppercase text-slate-400">ARENA:</span>
            <span className="font-arcade text-sm text-amber-400 uppercase tracking-wide">
              {stage.name}
            </span>
          </div>

          <button
            onClick={handleStart}
            onMouseEnter={() => sound.playUiClick()}
            className="arcade-skew rounded bg-gradient-to-r from-emerald-500 via-yellow-400 to-amber-500 px-10 py-2.5 shadow-[0_0_25px_rgba(234,179,8,0.6)] hover:brightness-110 active:scale-95 transition"
          >
            <span className="arcade-skew-reverse font-arcade text-lg font-black tracking-wider text-slate-950 drop-shadow">
              STARTA STRID!
            </span>
          </button>
        </div>
      </div>

      {/* Main Grid: P1 Card + 8 Fighter Roster + P2 Card */}
      <div className="grid flex-1 grid-cols-12 gap-5 p-5 overflow-hidden">
        {/* P1 Card (Left Column) */}
        <div className="col-span-3 flex flex-col justify-between rounded-2xl border-2 border-blue-500/80 bg-gradient-to-b from-blue-950/60 via-slate-950/90 to-slate-950 p-5 shadow-[0_0_30px_rgba(59,130,246,0.25)] backdrop-blur">
          <div>
            <div className="flex items-center justify-between">
              <span className="arcade-skew rounded bg-blue-600 px-3 py-1 text-xs font-black tracking-widest text-white uppercase shadow">
                <span className="arcade-skew-reverse">SPELARE 1</span>
              </span>
              <button
                onClick={() => { sound.playUiClick(); setP1Palette(p1Palette === 0 ? 1 : 0); }}
                className="text-xs font-bold text-blue-400 underline hover:text-blue-300"
              >
                Färg: {p1Palette === 0 ? "Standard" : "Alternativ"}
              </button>
            </div>

            {/* Fighter Portrait Banner */}
            <div className="relative mt-4 flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border border-blue-500/40 bg-gradient-to-tr from-blue-950 via-slate-900 to-blue-900/50 shadow-inner">
              <div
                className="absolute inset-0 opacity-20"
                style={{ backgroundColor: p1Char.colors[0] }}
              />
              <span className="font-arcade text-5xl font-black text-blue-300/40 drop-shadow">
                {p1Char.name.charAt(0)}
              </span>
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                <span className="font-arcade text-2xl font-black text-white drop-shadow">
                  {p1Char.name}
                </span>
                <span className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase ${getArchetypeBadgeColor(p1Char.archetype)}`}>
                  {p1Char.archetype.split("-")[0]}
                </span>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-300 leading-relaxed italic">
              "{p1Char.blurb}"
            </p>

            {/* Attributes Grid */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
              <div className="rounded bg-slate-900/80 p-2 border border-slate-800">
                <span className="text-slate-400 block text-[9px]">FART</span>
                <span className="font-arcade text-sm text-cyan-300">{p1Char.walkSpeed}</span>
              </div>
              <div className="rounded bg-slate-900/80 p-2 border border-slate-800">
                <span className="text-slate-400 block text-[9px]">VIKT</span>
                <span className="font-arcade text-sm text-yellow-300">{p1Char.weight}</span>
              </div>
              <div className="rounded bg-slate-900/80 p-2 border border-slate-800">
                <span className="text-slate-400 block text-[9px]">KAST</span>
                <span className="font-arcade text-sm text-rose-300">{p1Char.throwDamage}</span>
              </div>
            </div>
          </div>

          {/* Tactical Advice */}
          <div className="space-y-2 text-xs">
            <div className="rounded-lg bg-slate-900/70 p-2.5 border border-slate-800/80">
              <span className="font-black text-emerald-400 text-[10px] uppercase block">Styrkor:</span>
              <span className="text-slate-300 text-[11px]">{p1Char.strengths.join(", ")}</span>
            </div>
            <div className="rounded-lg bg-slate-900/70 p-2.5 border border-slate-800/80">
              <span className="font-black text-yellow-400 text-[10px] uppercase block">Combo:</span>
              <span className="text-slate-300 text-[11px]">{p1Char.combo}</span>
            </div>
          </div>
        </div>

        {/* Center: 8 Fighters + VS emblem + Stage Selector */}
        <div className="col-span-6 flex flex-col justify-between items-center">
          {/* Active Picker Indicator */}
          <div className="arcade-skew rounded bg-slate-900/90 border border-slate-700 px-5 py-1 text-xs font-black tracking-widest uppercase">
            <span className="arcade-skew-reverse">
              Aktiv Väljare:{" "}
              <span className={activePicker === "p1" ? "text-blue-400" : "text-rose-400"}>
                {activePicker === "p1" ? "SPELARE 1" : "SPELARE 2"}
              </span>
            </span>
          </div>

          {/* 8 Character Roster Grid */}
          <div className="grid grid-cols-4 gap-3.5 w-full my-3">
            {CHARACTER_LIST.map((char) => {
              const isP1 = char.id === p1CharId;
              const isP2 = char.id === p2CharId;

              return (
                <button
                  key={char.id}
                  onClick={() => handleCharClick(char.id)}
                  onMouseEnter={() => sound.playUiClick()}
                  className={`group relative flex flex-col items-center justify-between rounded-xl border-2 p-3 transition-all hover:scale-105 active:scale-95 ${
                    isP1
                      ? "border-blue-400 bg-blue-950/80 shadow-[0_0_25px_rgba(59,130,246,0.6)] ring-2 ring-blue-400"
                      : isP2
                      ? "border-rose-400 bg-rose-950/80 shadow-[0_0_25px_rgba(244,63,94,0.6)] ring-2 ring-rose-400"
                      : `bg-slate-900/70 ${getArchetypeBorder(char.archetype)}`
                  }`}
                >
                  {/* Portrait Avatar Circle */}
                  <div
                    className="relative flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white/20 text-xl font-black text-white shadow-md group-hover:scale-110 transition duration-150"
                    style={{ backgroundColor: char.colors[0] }}
                  >
                    <span className="drop-shadow">{char.name[0]}</span>
                  </div>

                  {/* Name & Archetype */}
                  <div className="mt-2 text-center w-full">
                    <div className="font-arcade text-xs font-black tracking-wide text-white truncate group-hover:text-amber-300">
                      {char.name}
                    </div>
                    <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      {char.archetype.split("-")[0]}
                    </div>
                  </div>

                  {/* Player Indicator Badges */}
                  {isP1 && (
                    <span className="absolute -top-2.5 -left-1.5 rounded bg-blue-600 px-2 py-0.5 font-arcade text-[10px] font-black text-white shadow-[0_0_10px_#3b82f6]">
                      P1
                    </span>
                  )}
                  {isP2 && (
                    <span className="absolute -top-2.5 -right-1.5 rounded bg-rose-600 px-2 py-0.5 font-arcade text-[10px] font-black text-white shadow-[0_0_10px_#f43f5e]">
                      P2
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Arena Stage Carousel */}
          <div className="w-full rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-3 shadow-inner">
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="font-arcade text-xs tracking-wider text-slate-300 uppercase">
                VÄLJ STRIDSARENA
              </span>
              <span className="font-arcade text-xs text-amber-400 uppercase">
                {stage.name}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {STAGE_LIST.map((s) => {
                const isSelected = s.id === selectedStageId;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      sound.playUiClick();
                      setSelectedStageId(s.id);
                    }}
                    onMouseEnter={() => sound.playUiClick()}
                    className={`group relative h-16 overflow-hidden rounded-lg border-2 transition-all hover:scale-105 active:scale-95 ${
                      isSelected
                        ? "border-yellow-400 shadow-[0_0_15px_#facc15] ring-1 ring-yellow-400"
                        : "border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600"
                    }`}
                  >
                    <img
                      src={`/stages/${s.id}.jpg`}
                      alt={s.name}
                      className="h-full w-full object-cover group-hover:scale-110 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-1.5">
                      <span className="font-arcade text-[9px] font-black uppercase text-white drop-shadow">
                        {s.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* P2 Card (Right Column) */}
        <div className="col-span-3 flex flex-col justify-between rounded-2xl border-2 border-rose-500/80 bg-gradient-to-b from-rose-950/60 via-slate-950/90 to-slate-950 p-5 shadow-[0_0_30px_rgba(244,63,94,0.25)] backdrop-blur text-right">
          <div>
            <div className="flex items-center justify-between flex-row-reverse">
              <span className="arcade-skew rounded bg-rose-600 px-3 py-1 text-xs font-black tracking-widest text-white uppercase shadow">
                <span className="arcade-skew-reverse">
                  {singlePlayer ? "DATOR (AI)" : "SPELARE 2"}
                </span>
              </span>
              <button
                onClick={() => { sound.playUiClick(); setP2Palette(p2Palette === 0 ? 1 : 0); }}
                className="text-xs font-bold text-rose-400 underline hover:text-rose-300"
              >
                Färg: {p2Palette === 0 ? "Standard" : "Alternativ"}
              </button>
            </div>

            {/* Fighter Portrait Banner P2 */}
            <div className="relative mt-4 flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border border-rose-500/40 bg-gradient-to-tl from-rose-950 via-slate-900 to-rose-900/50 shadow-inner">
              <div
                className="absolute inset-0 opacity-20"
                style={{ backgroundColor: p2Char.colors[0] }}
              />
              <span className="font-arcade text-5xl font-black text-rose-300/40 drop-shadow">
                {p2Char.name.charAt(0)}
              </span>
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between flex-row-reverse">
                <span className="font-arcade text-2xl font-black text-white drop-shadow">
                  {p2Char.name}
                </span>
                <span className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase ${getArchetypeBadgeColor(p2Char.archetype)}`}>
                  {p2Char.archetype.split("-")[0]}
                </span>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-300 leading-relaxed italic">
              "{p2Char.blurb}"
            </p>

            {/* Attributes Grid P2 */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
              <div className="rounded bg-slate-900/80 p-2 border border-slate-800">
                <span className="text-slate-400 block text-[9px]">FART</span>
                <span className="font-arcade text-sm text-cyan-300">{p2Char.walkSpeed}</span>
              </div>
              <div className="rounded bg-slate-900/80 p-2 border border-slate-800">
                <span className="text-slate-400 block text-[9px]">VIKT</span>
                <span className="font-arcade text-sm text-yellow-300">{p2Char.weight}</span>
              </div>
              <div className="rounded bg-slate-900/80 p-2 border border-slate-800">
                <span className="text-slate-400 block text-[9px]">KAST</span>
                <span className="font-arcade text-sm text-rose-300">{p2Char.throwDamage}</span>
              </div>
            </div>
          </div>

          {/* Tactical Advice P2 */}
          <div className="space-y-2 text-xs">
            <div className="rounded-lg bg-slate-900/70 p-2.5 border border-slate-800/80">
              <span className="font-black text-emerald-400 text-[10px] uppercase block">Styrkor:</span>
              <span className="text-slate-300 text-[11px]">{p2Char.strengths.join(", ")}</span>
            </div>
            <div className="rounded-lg bg-slate-900/70 p-2.5 border border-slate-800/80">
              <span className="font-black text-yellow-400 text-[10px] uppercase block">Combo:</span>
              <span className="text-slate-300 text-[11px]">{p2Char.combo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
