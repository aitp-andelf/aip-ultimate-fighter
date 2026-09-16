import type { StageDef } from "@aipuf/contracts";

export const STAGE_SERVERRUM: StageDef = {
  id: "serverrum",
  name: "Serverhallen",
  width: 2400,
  height: 1200,
  groundY: 0,
  leftBound: -1200,
  rightBound: 1200,
  layers: [
    { id: "bg-back", src: "/stages/serverrum_back.png", parallax: 0.2, z: -400 },
    { id: "bg-mid", src: "/stages/serverrum_racks.png", parallax: 0.5, z: -200 },
    { id: "bg-floor", src: "/stages/serverrum_floor.png", parallax: 1.0, z: 0 },
  ],
  fallbackSrc: "/stages/serverrum_back.png",
};

export const STAGE_FIKARUM: StageDef = {
  id: "fikarum",
  name: "Fikarummet",
  width: 2400,
  height: 1200,
  groundY: 0,
  leftBound: -1200,
  rightBound: 1200,
  layers: [
    { id: "bg-back", src: "/stages/fikarum_back.png", parallax: 0.2, z: -400 },
    { id: "bg-mid", src: "/stages/fikarum_counter.png", parallax: 0.5, z: -200 },
    { id: "bg-floor", src: "/stages/fikarum_floor.png", parallax: 1.0, z: 0 },
  ],
  fallbackSrc: "/stages/fikarum_back.png",
};

export const STAGE_KONTOR: StageDef = {
  id: "kontor",
  name: "Kontorslandskapet",
  width: 2400,
  height: 1200,
  groundY: 0,
  leftBound: -1200,
  rightBound: 1200,
  layers: [
    { id: "bg-back", src: "/stages/kontor_back.png", parallax: 0.2, z: -400 },
    { id: "bg-mid", src: "/stages/kontor_desks.png", parallax: 0.5, z: -200 },
    { id: "bg-floor", src: "/stages/kontor_floor.png", parallax: 1.0, z: 0 },
  ],
  fallbackSrc: "/stages/kontor_back.png",
};

export const STAGE_KONFERENS: StageDef = {
  id: "konferens",
  name: "Konferensrummet",
  width: 2400,
  height: 1200,
  groundY: 0,
  leftBound: -1200,
  rightBound: 1200,
  layers: [
    { id: "bg-back", src: "/stages/konferens_back.png", parallax: 0.2, z: -400 },
    { id: "bg-mid", src: "/stages/konferens_table.png", parallax: 0.5, z: -200 },
    { id: "bg-floor", src: "/stages/konferens_floor.png", parallax: 1.0, z: 0 },
  ],
  fallbackSrc: "/stages/konferens_back.png",
};

export const STAGES: Record<string, StageDef> = {
  serverrum: STAGE_SERVERRUM,
  fikarum: STAGE_FIKARUM,
  kontor: STAGE_KONTOR,
  konferens: STAGE_KONFERENS,
};

export const STAGE_LIST: StageDef[] = [
  STAGE_SERVERRUM,
  STAGE_FIKARUM,
  STAGE_KONTOR,
  STAGE_KONFERENS,
];

export function getStage(id: string): StageDef {
  const stage = STAGES[id];
  if (!stage) return STAGE_SERVERRUM;
  return stage;
}
