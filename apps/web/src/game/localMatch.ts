import type { CharacterDef, StageDef } from "@aipuf/contracts";
import {
  computeBotInput,
  createInitialMatchState,
  simStep,
  type MatchConfig,
  type MatchState,
  type TrainingSettings,
} from "@aipuf/sim";
import { sound } from "../audio/sound.ts";
import type { InputManager } from "./input.ts";
import type { GameRenderer } from "./renderer.ts";

export class LocalMatchController {
  private state: MatchState;
  private renderer: GameRenderer;
  private input: InputManager;
  private isTraining: boolean;
  private isCpuMatch: boolean;
  private isRunning = false;
  private animFrameId: number | null = null;
  private lastTime = 0;
  private accumulator = 0;
  private readonly TICK_MS = 1000 / 60;

  private onStateChange?: (state: MatchState) => void;

  constructor(
    renderer: GameRenderer,
    input: InputManager,
    p1Char: CharacterDef,
    p2Char: CharacterDef,
    stage: StageDef,
    options?: {
      isTraining?: boolean;
      isCpuMatch?: boolean;
      trainingSettings?: TrainingSettings;
      onStateChange?: (state: MatchState) => void;
    }
  ) {
    this.renderer = renderer;
    this.input = input;
    this.isTraining = options?.isTraining ?? false;
    this.isCpuMatch = options?.isCpuMatch ?? false;
    this.onStateChange = options?.onStateChange;

    const matchConfig: MatchConfig = {
      p1: p1Char,
      p2: p2Char,
      leftBound: stage.leftBound,
      rightBound: stage.rightBound,
      training: options?.trainingSettings ?? null,
    };

    this.state = createInitialMatchState(matchConfig);
    this.renderer.setupFighterModels(p1Char, p2Char);
    this.renderer.setupStage(stage.id);

    sound.startBgm();
  }

  public start(): void {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    sound.stopBgm();
  }

  public setTrainingSettings(settings: TrainingSettings): void {
    this.state.training = settings;
    this.renderer.showBoxes = settings.showBoxes;
  }

  public resetPositions(): void {
    this.state.fighters[0].x = -350;
    this.state.fighters[0].y = 0;
    this.state.fighters[0].vx = 0;
    this.state.fighters[0].vy = 0;
    this.state.fighters[0].state = "idle";
    this.state.fighters[0].health = 1000;
    this.state.fighters[0].meter = 1000;

    this.state.fighters[1].x = 350;
    this.state.fighters[1].y = 0;
    this.state.fighters[1].vx = 0;
    this.state.fighters[1].vy = 0;
    this.state.fighters[1].state = "idle";
    this.state.fighters[1].health = 1000;
    this.state.fighters[1].meter = 1000;

    this.state.projectiles = [];
  }

  private loop = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    let delta = now - this.lastTime;
    this.lastTime = now;

    // Prevent spiral of death on tab unfocus
    if (delta > 250) delta = 250;

    this.accumulator += delta;

    while (this.accumulator >= this.TICK_MS) {
      this.tick();
      this.accumulator -= this.TICK_MS;
    }

    // Render 3D scene
    this.renderer.renderMatch(this.state);

    if (this.onStateChange) {
      this.onStateChange(this.state);
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private tick(): void {
    // Collect P1 input
    const p1Bits = this.input.getBits(this.input.p1Keys);

    // Collect P2 input (or compute bot input)
    let p2Bits: number;
    if (this.isCpuMatch) {
      p2Bits = computeBotInput(1, this.state, "medium").bits;
    } else if (this.isTraining && this.state.training) {
      p2Bits = computeBotInput(1, this.state).bits;
    } else {
      p2Bits = this.input.getBits(this.input.p2Keys);
    }

    // Step simulation at 60 Hz
    simStep(this.state, [{ bits: p1Bits }, { bits: p2Bits }]);

    // Trigger audio for events
    for (const ev of this.state.events) {
      if (ev.kind === "hit") {
        sound.playHit(false);
      } else if (ev.kind === "block") {
        sound.playBlock();
      } else if (ev.kind === "super") {
        sound.playSuper();
      } else if (ev.kind === "ko") {
        sound.playKo();
      } else if (ev.kind === "round_start") {
        sound.playRoundStart();
      }
    }
  }

  public getState(): MatchState {
    return this.state;
  }
}
