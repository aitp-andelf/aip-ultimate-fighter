import React, { useState } from "react";
import { sound } from "../audio/sound.ts";
import type { InputManager } from "../game/input.ts";

interface SettingsModalProps {
  input: InputManager;
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  input,
  isOpen,
  onClose,
}) => {
  const [sfx, setSfx] = useState(sound.sfxVolume * 100);
  const [bgm, setBgm] = useState(sound.bgmVolume * 100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-xl font-black tracking-wider text-yellow-400">INSTÄLLNINGAR</h2>
          <button
            onClick={() => { sound.playUiClick(); onClose(); }}
            className="text-slate-400 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>

        {/* Audio Sliders */}
        <div className="mt-6 space-y-4">
          <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">Ljud</h3>
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span>Ljudeffekter (SFX)</span>
              <span>{Math.round(sfx)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sfx}
              onChange={(e) => {
                const v = Number(e.target.value);
                setSfx(v);
                sound.setSfxVolume(v / 100);
              }}
              className="mt-1 w-full"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span>Musik (BGM)</span>
              <span>{Math.round(bgm)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={bgm}
              onChange={(e) => {
                const v = Number(e.target.value);
                setBgm(v);
                sound.setBgmVolume(v / 100);
              }}
              className="mt-1 w-full"
            />
          </div>
        </div>

        {/* Controls Info */}
        <div className="mt-6 border-t border-slate-800 pt-4">
          <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase mb-3">
            Standardstyrning
          </h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
              <span className="font-bold text-blue-400 block mb-1">Spelare 1 (Tangentbord / Kontroll)</span>
              <ul className="space-y-1 text-slate-300">
                <li><strong className="text-white">W / A / S / D:</strong> Hoppa / Gå / Ducka</li>
                <li><strong className="text-white">U / I:</strong> Låg / Hög box</li>
                <li><strong className="text-white">J / K:</strong> Låg / Hög spark</li>
                <li><strong className="text-white">O:</strong> Special</li>
                <li><strong className="text-white">L:</strong> Super (1000 meter)</li>
                <li><strong className="text-white">Mellanslag:</strong> Kast</li>
              </ul>
            </div>

            <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
              <span className="font-bold text-rose-400 block mb-1">Spelare 2 (Tangentbord)</span>
              <ul className="space-y-1 text-slate-300">
                <li><strong className="text-white">Piltangenter:</strong> Hoppa / Gå / Ducka</li>
                <li><strong className="text-white">Num 4 / 5:</strong> Låg / Hög box</li>
                <li><strong className="text-white">Num 1 / 2:</strong> Låg / Hög spark</li>
                <li><strong className="text-white">Num 6:</strong> Special</li>
                <li><strong className="text-white">Num 3:</strong> Super</li>
                <li><strong className="text-white">Num 0:</strong> Kast</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => { sound.playUiClick(); onClose(); }}
            className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-500"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};
