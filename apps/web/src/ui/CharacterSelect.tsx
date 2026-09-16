import React, { useState } from "react";
import { CHARACTER_LIST } from "@aipuf/content";
import type { CharacterDef, CharacterId } from "@aipuf/contracts";
import { sound } from "../audio/sound.ts";

interface CharacterSelectProps {
  onSelect: (p1Char: CharacterDef, p2Char: CharacterDef, p1Palette: 0 | 1, p2Palette: 0 | 1) => void;
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
  const [activePicker, setActivePicker] = useState<"p1" | "p2">("p1");

  const p1Char = CHARACTER_LIST.find((c) => c.id === p1CharId)!;
  const p2Char = CHARACTER_LIST.find((c) => c.id === p2CharId)!;

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
    onSelect(p1Char, p2Char, p1Palette, p2Palette);
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-8 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { sound.playUiClick(); onBack(); }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-sm font-bold text-slate-300 hover:bg-slate-700 transition"
          >
            ← Tillbaka
          </button>
          <h1 className="text-2xl font-black tracking-wider text-yellow-400">
            VÄLJ KÄMPE
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-slate-400">
            Aros IT-Partner Arena
          </span>
          <button
            onClick={handleStart}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-2.5 text-lg font-black tracking-wider text-white shadow-lg hover:from-emerald-400 hover:to-teal-500 active:scale-95 transition"
          >
            STARTA STRID!
          </button>
        </div>
      </div>

      {/* Main Grid & Previews */}
      <div className="grid flex-1 grid-cols-12 gap-6 p-8 overflow-hidden">
        {/* P1 Card */}
        <div className="col-span-3 flex flex-col rounded-2xl border-2 border-blue-500/50 bg-blue-950/20 p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="rounded bg-blue-600 px-3 py-1 text-xs font-black tracking-wider text-white uppercase">
              Spelare 1
            </span>
            <button
              onClick={() => { sound.playUiClick(); setP1Palette(p1Palette === 0 ? 1 : 0); }}
              className="text-xs text-blue-400 underline hover:text-blue-300"
            >
              Färg: {p1Palette === 0 ? "Standard" : "Alt"}
            </button>
          </div>

          <h2 className="mt-4 text-3xl font-black text-white">{p1Char.name}</h2>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            {p1Char.archetype.toUpperCase()}
          </span>

          <p className="mt-3 text-sm text-slate-300 leading-relaxed">{p1Char.blurb}</p>

          <div className="mt-6 flex-1 space-y-3 text-xs">
            <div>
              <span className="font-bold text-emerald-400">Styrkor: </span>
              <span className="text-slate-300">{p1Char.strengths.join(", ")}</span>
            </div>
            <div>
              <span className="font-bold text-rose-400">Svagheter: </span>
              <span className="text-slate-300">{p1Char.weaknesses.join(", ")}</span>
            </div>
            <div>
              <span className="font-bold text-yellow-400">Föreslagen Combo: </span>
              <span className="text-slate-300">{p1Char.combo}</span>
            </div>
          </div>
        </div>

        {/* Center Grid: 8 Fighters */}
        <div className="col-span-6 flex flex-col items-center justify-center">
          <div className="mb-4 text-sm font-bold tracking-widest text-slate-400 uppercase">
            Aktiv Väljare: <span className={activePicker === "p1" ? "text-blue-400" : "text-rose-400"}>{activePicker.toUpperCase()}</span>
          </div>

          <div className="grid grid-cols-4 gap-4 w-full">
            {CHARACTER_LIST.map((char) => {
              const isP1 = char.id === p1CharId;
              const isP2 = char.id === p2CharId;

              return (
                <button
                  key={char.id}
                  onClick={() => handleCharClick(char.id)}
                  className={`relative flex flex-col items-center justify-between rounded-xl border-2 p-4 transition-all hover:scale-105 active:scale-95 ${
                    isP1
                      ? "border-blue-500 bg-blue-950/60 shadow-[0_0_15px_#3b82f6]"
                      : isP2
                      ? "border-rose-500 bg-rose-950/60 shadow-[0_0_15px_#f43f5e]"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
                  }`}
                >
                  <div
                    className="h-16 w-16 rounded-full border-2 border-slate-700 flex items-center justify-center text-2xl font-black text-white shadow"
                    style={{ backgroundColor: char.colors[0] }}
                  >
                    {char.name[0]}
                  </div>
                  <span className="mt-2 text-base font-black text-white">{char.name}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{char.archetype}</span>

                  {/* Indicator tags */}
                  {isP1 && (
                    <span className="absolute -top-2 left-2 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      P1
                    </span>
                  )}
                  {isP2 && (
                    <span className="absolute -top-2 right-2 rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      P2
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* P2 Card */}
        <div className="col-span-3 flex flex-col rounded-2xl border-2 border-rose-500/50 bg-rose-950/20 p-6 backdrop-blur text-right">
          <div className="flex items-center justify-between flex-row-reverse">
            <span className="rounded bg-rose-600 px-3 py-1 text-xs font-black tracking-wider text-white uppercase">
              {singlePlayer ? "Dator / Motståndare" : "Spelare 2"}
            </span>
            <button
              onClick={() => { sound.playUiClick(); setP2Palette(p2Palette === 0 ? 1 : 0); }}
              className="text-xs text-rose-400 underline hover:text-rose-300"
            >
              Färg: {p2Palette === 0 ? "Standard" : "Alt"}
            </button>
          </div>

          <h2 className="mt-4 text-3xl font-black text-white">{p2Char.name}</h2>
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
            {p2Char.archetype.toUpperCase()}
          </span>

          <p className="mt-3 text-sm text-slate-300 leading-relaxed">{p2Char.blurb}</p>

          <div className="mt-6 flex-1 space-y-3 text-xs">
            <div>
              <span className="font-bold text-emerald-400">Styrkor: </span>
              <span className="text-slate-300">{p2Char.strengths.join(", ")}</span>
            </div>
            <div>
              <span className="font-bold text-rose-400">Svagheter: </span>
              <span className="text-slate-300">{p2Char.weaknesses.join(", ")}</span>
            </div>
            <div>
              <span className="font-bold text-yellow-400">Föreslagen Combo: </span>
              <span className="text-slate-300">{p2Char.combo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
