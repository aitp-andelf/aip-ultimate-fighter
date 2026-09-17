import React from "react";
import type { TrainingSettings } from "@aipuf/sim";
import { sound } from "../audio/sound.ts";

interface TrainingControlsProps {
  settings: TrainingSettings;
  onChange: (settings: TrainingSettings) => void;
  onResetPositions: () => void;
}

export const TrainingControls: React.FC<TrainingControlsProps> = ({
  settings,
  onChange,
  onResetPositions,
}) => {
  return (
    <div className="absolute bottom-6 left-6 z-20 flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-900/90 p-4 shadow-xl backdrop-blur">
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase block">Dummy:</label>
        <select
          value={settings.dummy}
          onChange={(e) => {
            sound.playUiClick();
            onChange({ ...settings, dummy: e.target.value as any });
          }}
          className="mt-1 rounded bg-slate-800 px-2 py-1 text-xs font-bold text-white border border-slate-700"
        >
          <option value="stand">Stand</option>
          <option value="crouch">Crouch</option>
          <option value="block">Block</option>
          <option value="recorded">CPU</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.showBoxes}
          onChange={(e) => {
            sound.playUiClick();
            onChange({ ...settings, showBoxes: e.target.checked });
          }}
          className="rounded border-slate-700 bg-slate-800"
        />
        Hitboxes
      </label>

      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase block">Rig diag:</label>
        <select
          value={settings.rigDiag ?? "off"}
          onChange={(e) => {
            sound.playUiClick();
            onChange({ ...settings, rigDiag: e.target.value as any });
          }}
          className="mt-1 rounded bg-slate-800 px-2 py-1 text-xs font-bold text-white border border-slate-700"
          title="A bind · B joint probe · C mixer only · D mixer+overlay"
        >
          <option value="off">Off</option>
          <option value="A">A · Bind</option>
          <option value="B">B · Joint probe</option>
          <option value="C">C · Mixer only</option>
          <option value="D">D · Mixer+overlay</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.infiniteHealth}
          onChange={(e) => {
            sound.playUiClick();
            onChange({ ...settings, infiniteHealth: e.target.checked });
          }}
          className="rounded border-slate-700 bg-slate-800"
        />
        Infinite HP
      </label>

      <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.infiniteMeter}
          onChange={(e) => {
            sound.playUiClick();
            onChange({ ...settings, infiniteMeter: e.target.checked });
          }}
          className="rounded border-slate-700 bg-slate-800"
        />
        Full meter
      </label>

      <button
        onClick={() => {
          sound.playUiClick();
          onResetPositions();
        }}
        className="rounded bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 border border-slate-700 transition"
      >
        Reset
      </button>
    </div>
  );
};
