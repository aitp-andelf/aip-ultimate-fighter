import React, { useEffect, useRef, useState } from "react";
import { getCharacter, STAGE_SERVERRUM } from "@aipuf/content";
import type {
  CharacterDef,
  CharacterId,
  MatchStartPayload,
  RoomStatePayload,
  SlotId,
  SnapshotPayload,
  StageDef,
} from "@aipuf/contracts";
import type { MatchState, TrainingSettings } from "@aipuf/sim";
import { sound } from "./audio/sound.ts";
import { InputManager } from "./game/input.ts";
import { LocalMatchController } from "./game/localMatch.ts";
import { GameRenderer } from "./game/renderer.ts";
import { NetworkClient } from "./net/colyseusClient.ts";
import { CharacterLabScreen } from "./ui/CharacterLabScreen.tsx";
import { CharacterSelect } from "./ui/CharacterSelect.tsx";
import { HUD } from "./ui/HUD.tsx";
import { LobbyScreen } from "./ui/LobbyScreen.tsx";
import { SettingsModal } from "./ui/SettingsModal.tsx";
import { TrainingControls } from "./ui/TrainingControls.tsx";

type AppScreen =
  | "menu"
  | "character_select"
  | "lobby"
  | "local_match"
  | "online_match"
  | "training"
  | "character_lab";

export const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>("menu");
  const [pendingMode, setPendingMode] = useState<"local" | "cpu" | "training">("local");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Characters & Stages
  const [p1Char, setP1Char] = useState<CharacterDef>(() => getCharacter("shoto-a"));
  const [p2Char, setP2Char] = useState<CharacterDef>(() => getCharacter("zoner-a"));

  // Training settings
  const [trainingSettings, setTrainingSettings] = useState<TrainingSettings>({
    infiniteHealth: true,
    infiniteMeter: true,
    dummy: "stand",
    showBoxes: false,
  });

  // Online networking state
  const [serverUrl, setServerUrl] = useState(() => {
    return window.location.hostname === "localhost"
      ? "ws://localhost:2567"
      : `wss://${window.location.host}`;
  });
  const [playerName, setPlayerName] = useState("ArosKämpe");
  const [roomState, setRoomState] = useState<RoomStatePayload | null>(null);
  const [onlineSnapshot, setOnlineSnapshot] = useState<SnapshotPayload | null>(null);

  // SharePoint mode flag
  const isSharePoint = new URLSearchParams(window.location.search).get("sharepoint") === "1";

  // References
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const inputRef = useRef<InputManager | null>(null);
  const localControllerRef = useRef<LocalMatchController | null>(null);
  const netClientRef = useRef<NetworkClient | null>(null);

  // HUD match state
  const [hudState, setHudState] = useState<MatchState | null>(null);

  useEffect(() => {
    inputRef.current = new InputManager();

    // SharePoint postMessage notification
    if (isSharePoint) {
      window.parent?.postMessage({ type: "AIPUF_MOUNTED" }, "*");
    }

    return () => {
      inputRef.current?.destroy();
      localControllerRef.current?.stop();
      rendererRef.current?.destroy();
      netClientRef.current?.disconnect();
    };
  }, []);

  // Initialize or re-attach renderer when entering a 3D match screen
  useEffect(() => {
    const is3dScreen = screen === "local_match" || screen === "online_match" || screen === "training";

    if (is3dScreen && canvasContainerRef.current) {
      if (!rendererRef.current) {
        rendererRef.current = new GameRenderer({
          container: canvasContainerRef.current,
          showBoxes: trainingSettings.showBoxes,
        });
      }
    } else if (!is3dScreen && rendererRef.current) {
      rendererRef.current.destroy();
      rendererRef.current = null;
    }
  }, [screen]);

  // Handle Local / Training match start
  const handleStartLocalMatch = (
    c1: CharacterDef,
    c2: CharacterDef,
    p1Pal: 0 | 1,
    p2Pal: 0 | 1,
    stage?: StageDef
  ) => {
    setP1Char(c1);
    setP2Char(c2);
    const chosenStage = stage || STAGE_SERVERRUM;

    const nextScreen = pendingMode === "training" ? "training" : "local_match";
    setScreen(nextScreen);

    setTimeout(() => {
      if (rendererRef.current && inputRef.current) {
        localControllerRef.current?.stop();
        localControllerRef.current = new LocalMatchController(
          rendererRef.current,
          inputRef.current,
          c1,
          c2,
          chosenStage,
          {
            isTraining: pendingMode === "training",
            isCpuMatch: pendingMode === "cpu",
            trainingSettings: pendingMode === "training" ? trainingSettings : undefined,
            onStateChange: (st) => setHudState({ ...st }),
          }
        );
        localControllerRef.current.start();
      }
    }, 50);
  };

  // Connect to Colyseus Server
  const handleConnectOnline = () => {
    sound.playUiClick();
    if (!netClientRef.current) {
      netClientRef.current = new NetworkClient(serverUrl, {
        onRoomState: (rs) => setRoomState(rs),
        onMatchStart: (data: MatchStartPayload) => {
          setP1Char(getCharacter(data.p1.characterId));
          setP2Char(getCharacter(data.p2.characterId));
          setScreen("online_match");
          sound.playRoundStart();
        },
        onSnapshot: (snap) => {
          setOnlineSnapshot(snap);
          // Render via renderer if active
          if (rendererRef.current) {
            // Reconstruct minimal match state for renderer
            const syntheticState: any = {
              fighters: [snap.f0, snap.f1],
              projectiles: snap.projectiles,
              events: snap.events,
              round: snap.round,
              chars: [p1Char, p2Char],
            };
            rendererRef.current.renderMatch(syntheticState);
            setHudState(syntheticState);
          }
        },
        onError: (err) => alert(err),
        onDisconnect: () => setScreen("menu"),
      });
    }

    netClientRef.current.connect(playerName);
    setScreen("lobby");
  };

  return (
    <div className="relative h-screen w-screen bg-slate-950 overflow-hidden select-none">
      {/* 3D Canvas Mounting Container */}
      <div
        ref={canvasContainerRef}
        className={`absolute inset-0 z-0 ${
          screen === "local_match" || screen === "online_match" || screen === "training"
            ? "block"
            : "hidden"
        }`}
      />

      {/* Main Menu */}
      {screen === "menu" && (
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950">
          <div className="flex flex-col items-center mb-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black tracking-widest text-white uppercase shadow-md">
                AROS IT-PARTNER
              </span>
              {isSharePoint && (
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                  SharePoint Integrerad
                </span>
              )}
            </div>
            <h1 className="text-6xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 drop-shadow-[0_4px_25px_rgba(234,179,8,0.4)]">
              AIP ULTIMATE FIGHTER
            </h1>
            <p className="mt-3 text-sm text-slate-400 max-w-md text-center">
              Officiell 2.5D kontorsfighting med åtta distinkta arketyper, lokalt läge, online-lobby och SharePoint-stöd.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-80">
            <button
              onClick={() => {
                sound.playUiClick();
                setPendingMode("local");
                setScreen("character_select");
              }}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-base font-black tracking-wider text-white shadow-lg hover:from-blue-500 hover:to-indigo-500 active:scale-95 transition"
            >
              LOKAL 2-SPELARE
            </button>

            <button
              onClick={() => {
                sound.playUiClick();
                setPendingMode("cpu");
                setScreen("character_select");
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-3 text-base font-bold text-slate-200 hover:bg-slate-800 active:scale-95 transition"
            >
              SPELA MOT DATORN (AI)
            </button>

            <button
              onClick={handleConnectOnline}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-base font-black tracking-wider text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition"
            >
              ONLINE 1V1 (SERVER)
            </button>

            <button
              onClick={() => {
                sound.playUiClick();
                setPendingMode("training");
                setScreen("character_select");
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-3 text-base font-bold text-slate-200 hover:bg-slate-800 active:scale-95 transition"
            >
              TRÄNINGSLÄGE
            </button>

            <button
              onClick={() => {
                sound.playUiClick();
                setScreen("character_lab");
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-3 text-base font-bold text-slate-200 hover:bg-slate-800 active:scale-95 transition"
            >
              CHARACTER LAB & FRAMES
            </button>

            <button
              onClick={() => {
                sound.playUiClick();
                setIsSettingsOpen(true);
              }}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 text-sm font-semibold text-slate-400 hover:text-white transition"
            >
              ⚙ Inställningar & Kontroller
            </button>
          </div>

          <div className="absolute bottom-4 text-xs text-slate-600 font-mono">
            v1.0.0 — Aros IT-Partner Intern Produktion
          </div>
        </div>
      )}

      {/* Character Select */}
      {screen === "character_select" && (
        <CharacterSelect
          singlePlayer={pendingMode !== "local"}
          onSelect={handleStartLocalMatch}
          onBack={() => setScreen("menu")}
        />
      )}

      {/* Online Lobby Screen */}
      {screen === "lobby" && (
        <LobbyScreen
          roomState={roomState}
          mySessionId={netClientRef.current?.getSessionId() ?? null}
          onClaimSlot={(slot) => netClientRef.current?.claimSlot(slot)}
          onSelectCharacter={(charId, pal) => netClientRef.current?.selectCharacter(charId, pal)}
          onSetReady={(ready) => netClientRef.current?.setReady(ready)}
          onLeaveSlot={() => netClientRef.current?.leaveSlot()}
          onBack={() => {
            netClientRef.current?.disconnect();
            setScreen("menu");
          }}
        />
      )}

      {/* Character Lab Screen */}
      {screen === "character_lab" && (
        <CharacterLabScreen onBack={() => setScreen("menu")} />
      )}

      {/* In-Game HUD for Local, Training, and Online */}
      {(screen === "local_match" || screen === "training" || screen === "online_match") && hudState && (
        <>
          <HUD
            state={hudState}
            p1Name={screen === "online_match" ? roomState?.p1.displayName ?? "Spelare 1" : "Spelare 1"}
            p2Name={screen === "online_match" ? roomState?.p2.displayName ?? "Spelare 2" : pendingMode === "cpu" ? "Dator (CPU)" : "Spelare 2"}
            p1Char={p1Char}
            p2Char={p2Char}
          />

          {/* Training Controls Toolbar */}
          {screen === "training" && (
            <TrainingControls
              settings={trainingSettings}
              onChange={(s) => {
                setTrainingSettings(s);
                localControllerRef.current?.setTrainingSettings(s);
              }}
              onResetPositions={() => localControllerRef.current?.resetPositions()}
            />
          )}

          {/* Pause / Exit button in match */}
          <button
            onClick={() => {
              sound.playUiClick();
              localControllerRef.current?.stop();
              netClientRef.current?.disconnect();
              setScreen("menu");
            }}
            className="absolute top-4 right-4 z-20 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
          >
            Avsluta Match
          </button>
        </>
      )}

      {/* Settings Modal */}
      {inputRef.current && (
        <SettingsModal
          input={inputRef.current}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};
