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

      {/* Main Menu — Street Fighter / Arcade Edition */}
      {screen === "menu" && (
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black overflow-hidden select-none">
          {/* Background Ambient Glow & Diagonal Striping */}
          <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(45deg,#000,#000_15px,#3b82f6_15px,#3b82f6_30px)] pointer-events-none" />
          <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-red-600/20 blur-3xl pointer-events-none" />

          {/* Title Header */}
          <div className="relative z-10 flex flex-col items-center mb-8">
            <div className="flex items-center gap-3 mb-2 arcade-skew">
              <span className="rounded bg-gradient-to-r from-red-600 to-amber-600 px-3.5 py-1 text-xs font-black tracking-widest text-white uppercase shadow-[0_0_12px_rgba(239,68,68,0.8)] border border-red-400/40">
                AROS IT-PARTNER
              </span>
              <span className="rounded bg-slate-900/90 px-3 py-1 text-xs font-bold tracking-wider text-amber-300 border border-amber-500/40">
                ARCADE EDITION
              </span>
              {isSharePoint && (
                <span className="rounded bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow">
                  SharePoint Integrerad
                </span>
              )}
            </div>

            <h1 className="font-arcade text-7xl sm:text-8xl tracking-tight text-arcade-gold drop-shadow-[0_8px_30px_rgba(234,179,8,0.5)] arcade-skew uppercase text-center mt-2">
              AIP ULTIMATE FIGHTER
            </h1>
            <div className="flex items-center gap-3 mt-2 text-xs font-black tracking-widest text-cyan-400 uppercase drop-shadow arcade-skew">
              <span>★</span>
              <span>8 KÄMPAR</span>
              <span>•</span>
              <span>4 ARENOR</span>
              <span>•</span>
              <span>60 HZ ROLLBACK-GRADE</span>
              <span>★</span>
            </div>
          </div>

          {/* Arcade Menu Buttons */}
          <div className="relative z-10 flex flex-col gap-2.5 w-96 max-w-full">
            <button
              onClick={() => {
                sound.playRoundStart();
                setPendingMode("local");
                setScreen("character_select");
              }}
              onMouseEnter={() => sound.playUiClick()}
              className="group relative flex items-center justify-between rounded-lg border-2 border-blue-500/80 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 px-6 py-3 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.7)] hover:scale-[1.02] active:scale-95 transition duration-150 text-left arcade-skew"
            >
              <div className="arcade-skew-reverse flex flex-col">
                <span className="font-arcade text-lg tracking-wider text-white group-hover:text-cyan-300">
                  LOKAL 2-SPELARE
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  [1V1 VERSUS BATTLE]
                </span>
              </div>
              <span className="font-arcade text-xl text-blue-400 group-hover:translate-x-1 transition">►</span>
            </button>

            <button
              onClick={() => {
                sound.playRoundStart();
                setPendingMode("cpu");
                setScreen("character_select");
              }}
              onMouseEnter={() => sound.playUiClick()}
              className="group relative flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/80 px-6 py-3 shadow hover:border-amber-400 hover:shadow-[0_0_25px_rgba(251,191,36,0.4)] hover:scale-[1.02] active:scale-95 transition duration-150 text-left arcade-skew"
            >
              <div className="arcade-skew-reverse flex flex-col">
                <span className="font-arcade text-lg tracking-wider text-white group-hover:text-amber-300">
                  SPELA MOT DATORN (AI)
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  [SINGLE PLAYER ARCADE]
                </span>
              </div>
              <span className="font-arcade text-xl text-amber-400 group-hover:translate-x-1 transition">►</span>
            </button>

            <button
              onClick={handleConnectOnline}
              onMouseEnter={() => sound.playUiClick()}
              className="group relative flex items-center justify-between rounded-lg border-2 border-emerald-500/80 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 px-6 py-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.7)] hover:scale-[1.02] active:scale-95 transition duration-150 text-left arcade-skew"
            >
              <div className="arcade-skew-reverse flex flex-col">
                <span className="font-arcade text-lg tracking-wider text-white group-hover:text-emerald-300">
                  ONLINE 1V1 (SERVER)
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  [COLYSEUS MULTIPLAYER LOBBY]
                </span>
              </div>
              <span className="font-arcade text-xl text-emerald-400 group-hover:translate-x-1 transition">►</span>
            </button>

            <button
              onClick={() => {
                sound.playRoundStart();
                setPendingMode("training");
                setScreen("character_select");
              }}
              onMouseEnter={() => sound.playUiClick()}
              className="group relative flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/80 px-6 py-3 shadow hover:border-purple-400 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:scale-[1.02] active:scale-95 transition duration-150 text-left arcade-skew"
            >
              <div className="arcade-skew-reverse flex flex-col">
                <span className="font-arcade text-lg tracking-wider text-white group-hover:text-purple-300">
                  TRÄNINGSLÄGE
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  [DOJO & HITBOX-ANALYS]
                </span>
              </div>
              <span className="font-arcade text-xl text-purple-400 group-hover:translate-x-1 transition">►</span>
            </button>

            <button
              onClick={() => {
                sound.playUiClick();
                setScreen("character_lab");
              }}
              onMouseEnter={() => sound.playUiClick()}
              className="group relative flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/80 px-6 py-2.5 shadow hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02] active:scale-95 transition duration-150 text-left arcade-skew"
            >
              <div className="arcade-skew-reverse flex flex-col">
                <span className="font-arcade text-base tracking-wider text-slate-200 group-hover:text-cyan-300">
                  CHARACTER LAB & FRAMES
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  [3D MODELLER & GLB UPLOAD]
                </span>
              </div>
              <span className="font-arcade text-lg text-cyan-400 group-hover:translate-x-1 transition">►</span>
            </button>

            <button
              onClick={() => {
                sound.playUiClick();
                setIsSettingsOpen(true);
              }}
              onMouseEnter={() => sound.playUiClick()}
              className="mt-1 w-full rounded border border-slate-800 bg-slate-950/80 py-2 text-xs font-bold text-slate-400 hover:text-white hover:border-slate-700 transition"
            >
              ⚙ Inställningar & Kontroller
            </button>
          </div>

          <div className="absolute bottom-3 text-[10px] font-mono tracking-widest text-slate-600 uppercase">
            Aros IT-Partner Ultimate Fighter • Tournament Ready
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
