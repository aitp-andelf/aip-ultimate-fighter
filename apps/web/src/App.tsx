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
    rigDiag: "off",
  });

  // Online networking state
  const [serverUrl, setServerUrl] = useState(() => {
    return window.location.hostname === "localhost"
      ? "ws://localhost:2567"
      : `wss://${window.location.host}`;
  });
  const [playerName, setPlayerName] = useState("Fighter");
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
        (window as any).__RENDERER = rendererRef.current;
      }
    } else if (!is3dScreen && rendererRef.current) {
      (window as any).__RENDERER = null;
      rendererRef.current.destroy();
      rendererRef.current = null;
    }
  }, [screen]);

  useEffect(() => {
    if (screen !== "online_match" || !rendererRef.current) return;
    rendererRef.current.setupFighterModels(p1Char, p2Char);
  }, [screen, p1Char, p2Char]);

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

      {/* Title screen */}
      {screen === "menu" && (
        <div className="relative z-10 flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#07070a] select-none">
          {/* Stage backdrop — dark, quiet, cabinet-like */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(180deg, #1a0508 0%, #07070a 45%, #050508 100%), radial-gradient(ellipse 80% 50% at 50% 120%, rgba(225,29,72,0.22), transparent 60%)",
            }}
          />
          <div className="absolute inset-0 menu-scanlines opacity-30" />
          <div className="absolute inset-0 menu-vignette" />

          <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-6">
            <p className="mb-3 text-[10px] font-bold tracking-[0.35em] text-[#6b6b7b] uppercase">
              Aros IT-Partner
            </p>
            <h1 className="font-fighter text-fighter-title text-center text-6xl sm:text-7xl leading-none">
              AIP ULTIMATE
              <br />
              FIGHTER
            </h1>
            <p className="mt-3 mb-10 text-center text-[11px] font-semibold tracking-[0.25em] text-[#6b6b7b] uppercase">
              2.5D Arcade · Training Build
            </p>

            <div className="flex w-full flex-col gap-1.5 border border-[#2a2a35] bg-[#0c0c12]/95 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
              {/* Disabled modes */}
              {(
                [
                  ["VERSUS", "Local 2-player"],
                  ["ARCADE", "Vs CPU"],
                  ["ONLINE", "Network match"],
                  ["LAB", "Models & frames"],
                ] as const
              ).map(([label, sub]) => (
                <div
                  key={label}
                  aria-disabled="true"
                  className="flex cursor-not-allowed items-center justify-between border border-transparent px-4 py-3 opacity-35 grayscale"
                >
                  <div>
                    <div className="font-fighter text-xl text-[#9a9aaa] tracking-wide">{label}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-[#5a5a68]">
                      {sub} · Coming soon
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#5a5a68]">LOCKED</span>
                </div>
              ))}

              {/* Only live mode */}
              <button
                onClick={() => {
                  sound.playRoundStart();
                  setPendingMode("training");
                  setScreen("character_select");
                }}
                onMouseEnter={() => sound.playUiClick()}
                className="group flex items-center justify-between border border-[#e11d48]/60 bg-gradient-to-r from-[#9f1239]/40 via-[#1a0a10] to-[#9f1239]/25 px-4 py-3.5 text-left transition hover:border-[#fb7185] hover:from-[#e11d48]/35 active:scale-[0.99]"
              >
                <div>
                  <div className="font-fighter text-2xl tracking-wide text-white group-hover:text-[#fecdd3]">
                    TRAINING
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#fb7185]/90">
                    Hitboxes · Dummies · Rig tools
                  </div>
                </div>
                <span className="font-fighter text-2xl text-[#fb7185] transition group-hover:translate-x-0.5">
                  ▶
                </span>
              </button>
            </div>

            <button
              onClick={() => {
                sound.playUiClick();
                setIsSettingsOpen(true);
              }}
              className="mt-5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#6b6b7b] transition hover:text-[#c4c4d0]"
            >
              Controls
            </button>

            {isSharePoint && (
              <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">
                SharePoint embed
              </p>
            )}
          </div>

          <p className="absolute bottom-4 text-[10px] font-mono tracking-widest text-[#3a3a48] uppercase">
            Press Training to start
          </p>
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
            p1Name={screen === "online_match" ? roomState?.p1.displayName ?? "Player 1" : "Player 1"}
            p2Name={screen === "online_match" ? roomState?.p2.displayName ?? "Player 2" : pendingMode === "cpu" ? "CPU" : "Player 2"}
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
            className="absolute bottom-4 right-4 z-20 rounded-lg border border-slate-700/80 bg-slate-900/90 px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition shadow-lg backdrop-blur"
          >
            Exit match
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
