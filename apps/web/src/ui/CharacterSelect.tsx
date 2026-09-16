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
  const [p1CharId, setP1CharId] = useState<CharacterId>("shoto-a");
  const [p2CharId, setP2CharId] = useState<CharacterId>("zoner-a");
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

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-8 py-3.5 backdrop-blur shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { sound.playUiClick(); onBack(); }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-sm font-bold text-slate-300 hover:bg-slate-700 transition active:scale-95"
          >
            ← Tillbaka
          </button>
          <h1 className="text-2xl font-black tracking-wider text-yellow-400 drop-shadow">
            VÄLJ KÄMPE & ARENA
          </h1>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-400">
            <span>Arena:</span>
            <span className="font-bold text-amber-300">{stage.name}</span>
          </div>
          <button
            onClick={handleStart}
            className="rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-9 py-2.5 text-lg font-black tracking-wider text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:brightness-110 active:scale-95 transition"
          >
            STARTA STRID!
          </button>
        </div>
      </div>

      {/* Main Grid & Previews */}
      <div className="grid flex-1 grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* P1 Card */}
        <div className="col-span-3 flex flex-col rounded-2xl border-2 border-blue-500/60 bg-gradient-to-b from-blue-950/40 to-slate-950/90 p-5 backdrop-blur shadow-xl">
          <div className="flex items-center justify-between">
            <span className="rounded bg-blue-600 px-3 py-1 text-xs font-black tracking-wider text-white uppercase shadow">
              Spelare 1
            </span>
            <button
              onClick={() => { sound.playUiClick(); setP1Palette(p1Palette === 0 ? 1 : 0); }}
              className="text-xs font-bold text-blue-400 underline hover:text-blue-300"
            >
              Färg: {p1Palette === 0 ? "Standard" : "Alt"}
            </button>
          </div>

          <h2 className="mt-3 text-3xl font-black text-white drop-shadow">{p1Char.name}</h2>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            {p1Char.archetype.toUpperCase()}
          </span>

          <p className="mt-2 text-xs text-slate-300 leading-relaxed">{p1Char.blurb}</p>

          <div className="mt-4 flex-1 space-y-2.5 text-xs">
            <div className="rounded-lg bg-slate-900/60 p-2 border border-slate-800">
              <span className="font-bold text-emerald-400">Styrkor: </span>
              <span className="text-slate-300">{p1Char.strengths.join(", ")}</span>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2 border border-slate-800">
              <span className="font-bold text-rose-400">Svagheter: </span>
              <span className="text-slate-300">{p1Char.weaknesses.join(", ")}</span>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2 border border-slate-800">
              <span className="font-bold text-yellow-400">Föreslagen Combo: </span>
              <span className="text-slate-300">{p1Char.combo}</span>
            </div>
          </div>
        </div>

        {/* Center: 8 Fighters + Stage Carousel */}
        <div className="col-span-6 flex flex-col items-center justify-between">
          <div className="text-xs font-bold tracking-widest text-slate-400 uppercase">
            Aktiv Väljare: <span className={activePicker === "p1" ? "text-blue-400 font-black" : "text-rose-400 font-black"}>{activePicker.toUpperCase()}</span>
          </div>

          {/* 8 Fighters Grid */}
          <div className="grid grid-cols-4 gap-3.5 w-full my-2">
            {CHARACTER_LIST.map((char) => {
              const isP1 = char.id === p1CharId;
              const isP2 = char.id === p2CharId;

              return (
                <button
                  key={char.id}
                  onClick={() => handleCharClick(char.id)}
                  className={`relative flex flex-col items-center justify-between rounded-xl border-2 p-3 transition-all hover:scale-105 active:scale-95 ${
                    isP1
                      ? "border-blue-500 bg-blue-950/70 shadow-[0_0_15px_#3b82f6]"
                      : isP2
                      ? "border-rose-500 bg-rose-950/70 shadow-[0_0_15px_#f43f5e]"
                      : "border-slate-800 bg-slate-900/70 hover:border-slate-600"
                  }`}
                >
                  <div
                    className="h-14 w-14 rounded-full border-2 border-white/20 flex items-center justify-center text-xl font-black text-white shadow-lg"
                    style={{ backgroundColor: char.colors[0] }}
                  >
                    {char.name[0]}
                  </div>
                  <span className="mt-2 text-sm font-black text-white">{char.name}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{char.archetype}</span>

                  {/* Indicator tags */}
                  {isP1 && (
                    <span className="absolute -top-2 left-2 rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-black text-white shadow">
                      P1
                    </span>
                  )}
                  {isP2 && (
                    <span className="absolute -top-2 right-2 rounded bg-rose-600 px-1.5 py-0.5 text-[9px] font-black text-white shadow">
                      P2
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Stage Selector Bar */}
          <div className="w-full rounded-xl border border-slate-800 bg-slate-900/60 p-3 backdrop-blur">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-black tracking-wider text-slate-300 uppercase">
                Välj Arena
              </span>
              <span className="text-xs font-bold text-amber-400">
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
                    className={`group relative h-16 overflow-hidden rounded-lg border-2 transition-all hover:scale-105 active:scale-95 ${
                      isSelected
                        ? "border-yellow-400 shadow-[0_0_12px_#facc15]"
                        : "border-slate-700 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={`/stages/${s.id}.jpg`}
                      alt={s.name}
                      className="h-full w-full object-cover group-hover:scale-110 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-1.5">
                      <span className="text-[10px] font-black tracking-tight text-white drop-shadow">
                        {s.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* P2 Card */}
        <div className="col-span-3 flex flex-col rounded-2xl border-2 border-rose-500/60 bg-gradient-to-b from-rose-950/40 to-slate-950/90 p-5 backdrop-blur shadow-xl text-right">
          <div className="flex items-center justify-between flex-row-reverse">
            <span className="rounded bg-rose-600 px-3 py-1 text-xs font-black tracking-wider text-white uppercase shadow">
              {singlePlayer ? "Dator / Motståndare" : "Spelare 2"}
            </span>
            <button
              onClick={() => { sound.playUiClick(); setP2Palette(p2Palette === 0 ? 1 : 0); }}
              className="text-xs font-bold text-rose-400 underline hover:text-rose-300"
            >
              Färg: {p2Palette === 0 ? "Standard" : "Alt"}
            </button>
          </div>

          <h2 className="mt-3 text-3xl font-black text-white drop-shadow">{p2Char.name}</h2>
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
            {p2Char.archetype.toUpperCase()}
          </span>

          <p className="mt-2 text-xs text-slate-300 leading-relaxed">{p2Char.blurb}</p>

          <div className="mt-4 flex-1 space-y-2.5 text-xs">
            <div className="rounded-lg bg-slate-900/60 p-2 border border-slate-800">
              <span className="font-bold text-emerald-400">Styrkor: </span>
              <span className="text-slate-300">{p2Char.strengths.join(", ")}</span>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2 border border-slate-800">
              <span className="font-bold text-rose-400">Svagheter: </span>
              <span className="text-slate-300">{p2Char.weaknesses.join(", ")}</span>
            </div>
            <div className="rounded-lg bg-slate-900/60 p-2 border border-slate-800">
              <span className="font-bold text-yellow-400">Föreslagen Combo: </span>
              <span className="text-slate-300">{p2Char.combo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
