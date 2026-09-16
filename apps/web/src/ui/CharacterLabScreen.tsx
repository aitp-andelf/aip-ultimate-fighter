import React, { useState } from "react";
import { CHARACTER_LIST } from "@aipuf/content";
import type { CharacterDef, CharacterId } from "@aipuf/contracts";
import { sound } from "../audio/sound.ts";

interface CharacterLabScreenProps {
  onBack: () => void;
}

export const CharacterLabScreen: React.FC<CharacterLabScreenProps> = ({ onBack }) => {
  const [selectedId, setSelectedId] = useState<CharacterId>("shoto-a");
  const char = CHARACTER_LIST.find((c) => c.id === selectedId)!;

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-8 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { sound.playUiClick(); onBack(); }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-sm font-bold text-slate-300 hover:bg-slate-700 transition"
          >
            ← Tillbaka
          </button>
          <h1 className="text-2xl font-black tracking-wider text-yellow-400">
            CHARACTER LAB & FRAMEDATA
          </h1>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          Aros IT-Partner Inspektionsverktyg
        </span>
      </div>

      <div className="grid flex-1 grid-cols-12 gap-6 p-6 overflow-hidden">
        {/* Character Selector sidebar */}
        <div className="col-span-3 flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2 overflow-y-auto">
          <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-2">Karaktärer</h3>
          {CHARACTER_LIST.map((c) => (
            <button
              key={c.id}
              onClick={() => { sound.playUiClick(); setSelectedId(c.id); }}
              className={`flex items-center gap-3 rounded-lg border p-2 text-left transition ${
                c.id === selectedId
                  ? "border-blue-500 bg-blue-950/60 text-white"
                  : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
              }`}
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-white text-xs"
                style={{ backgroundColor: c.colors[0] }}
              >
                {c.name[0]}
              </div>
              <div>
                <div className="font-bold text-sm text-white">{c.name}</div>
                <div className="text-[10px] text-slate-400 uppercase">{c.archetype}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Character Overview & Frame Data Table */}
        <div className="col-span-9 flex flex-col rounded-xl border border-slate-800 bg-slate-900/40 p-6 overflow-y-auto">
          <div className="flex items-start justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-white">{char.name}</h2>
                <span className="rounded bg-blue-600/60 px-2.5 py-0.5 text-xs font-bold text-blue-200 uppercase">
                  {char.archetype}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-300 max-w-2xl">{char.blurb}</p>
            </div>
            <div className="text-right text-xs text-slate-400 space-y-1">
              <div>Gånghastighet: <strong className="text-white">{char.walkSpeed}</strong></div>
              <div>Vikt: <strong className="text-white">{char.weight}</strong></div>
              <div>Kastskada: <strong className="text-white">{char.throwDamage}</strong></div>
            </div>
          </div>

          {/* Moves / Framedata Table */}
          <div className="mt-6 flex-1">
            <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-3">
              Moveset & Framedata
            </h3>
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="p-2.5">Attack</th>
                    <th className="p-2.5">Namn</th>
                    <th className="p-2.5">Typ</th>
                    <th className="p-2.5">Startup</th>
                    <th className="p-2.5">Active</th>
                    <th className="p-2.5">Recovery</th>
                    <th className="p-2.5">Skada</th>
                    <th className="p-2.5">Hitstun</th>
                    <th className="p-2.5">Blockstun</th>
                    <th className="p-2.5">Chip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {Object.entries(char.moves).map(([key, m]) => (
                    <tr key={key} className="hover:bg-slate-800/40">
                      <td className="p-2.5 font-bold text-blue-400 uppercase">{key}</td>
                      <td className="p-2.5 font-semibold text-white">{m.name}</td>
                      <td className="p-2.5">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold">
                          {m.category}
                        </span>
                      </td>
                      <td className="p-2.5 text-yellow-400">{m.startup}f</td>
                      <td className="p-2.5 text-emerald-400">{m.active}f</td>
                      <td className="p-2.5 text-slate-400">{m.recovery}f</td>
                      <td className="p-2.5 font-bold text-rose-400">{m.damage}</td>
                      <td className="p-2.5">{m.hitstun}f</td>
                      <td className="p-2.5">{m.blockstun}f</td>
                      <td className="p-2.5">{m.chip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
