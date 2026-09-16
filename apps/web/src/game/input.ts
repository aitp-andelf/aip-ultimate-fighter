import { Buttons } from "@aipuf/contracts";

export interface KeyMap {
  left: string;
  right: string;
  down: string;
  up: string;
  lp: string;
  hp: string;
  lk: string;
  hk: string;
  special: string;
  super: string;
  throw: string;
}

export const DEFAULT_P1_KEYS: KeyMap = {
  left: "KeyA",
  right: "KeyD",
  down: "KeyS",
  up: "KeyW",
  lp: "KeyU",
  hp: "KeyI",
  lk: "KeyJ",
  hk: "KeyK",
  special: "KeyO",
  super: "KeyL",
  throw: "Space",
};

export const DEFAULT_P2_KEYS: KeyMap = {
  left: "ArrowLeft",
  right: "ArrowRight",
  down: "ArrowDown",
  up: "ArrowUp",
  lp: "Numpad4",
  hp: "Numpad5",
  lk: "Numpad1",
  hk: "Numpad2",
  special: "Numpad6",
  super: "Numpad3",
  throw: "Numpad0",
};

// Fallback P2 keys for keyboards without Numpad
export const LAPTOP_P2_KEYS: KeyMap = {
  left: "ArrowLeft",
  right: "ArrowRight",
  down: "ArrowDown",
  up: "ArrowUp",
  lp: "KeyB",
  hp: "KeyH",
  lk: "KeyN",
  hk: "KeyM",
  special: "Comma",
  super: "Period",
  throw: "Slash",
};

export class InputManager {
  private pressedKeys = new Set<string>();
  public p1Keys: KeyMap;
  public p2Keys: KeyMap;

  constructor() {
    this.p1Keys = this.loadKeys("aipuf_p1_keys", DEFAULT_P1_KEYS);
    this.p2Keys = this.loadKeys("aipuf_p2_keys", DEFAULT_P2_KEYS);

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  private loadKeys(storageKey: string, fallback: KeyMap): KeyMap {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { ...fallback };
  }

  public saveKeys(): void {
    try {
      localStorage.setItem("aipuf_p1_keys", JSON.stringify(this.p1Keys));
      localStorage.setItem("aipuf_p2_keys", JSON.stringify(this.p2Keys));
    } catch {}
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    // Prevent scrolling when using arrow keys / space
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
      e.preventDefault();
    }
    this.pressedKeys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.pressedKeys.delete(e.code);
  };

  public getBits(keymap: KeyMap): number {
    let bits = 0;
    if (this.pressedKeys.has(keymap.left)) bits |= Buttons.LEFT;
    if (this.pressedKeys.has(keymap.right)) bits |= Buttons.RIGHT;
    if (this.pressedKeys.has(keymap.down)) bits |= Buttons.DOWN;
    if (this.pressedKeys.has(keymap.up)) bits |= Buttons.UP;
    if (this.pressedKeys.has(keymap.lp)) bits |= Buttons.LP;
    if (this.pressedKeys.has(keymap.hp)) bits |= Buttons.HP;
    if (this.pressedKeys.has(keymap.lk)) bits |= Buttons.LK;
    if (this.pressedKeys.has(keymap.hk)) bits |= Buttons.HK;
    if (this.pressedKeys.has(keymap.special)) bits |= Buttons.SPECIAL;
    if (this.pressedKeys.has(keymap.super)) bits |= Buttons.SUPER;
    if (this.pressedKeys.has(keymap.throw)) bits |= Buttons.THROW;

    // Gamepad support for Player 1 / 2 if connected
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (gp && keymap === this.p1Keys) {
      if (gp.axes[0]! < -0.3 || gp.buttons[14]?.pressed) bits |= Buttons.LEFT;
      if (gp.axes[0]! > 0.3 || gp.buttons[15]?.pressed) bits |= Buttons.RIGHT;
      if (gp.axes[1]! > 0.3 || gp.buttons[13]?.pressed) bits |= Buttons.DOWN;
      if (gp.axes[1]! < -0.3 || gp.buttons[12]?.pressed) bits |= Buttons.UP;
      if (gp.buttons[2]?.pressed) bits |= Buttons.LP; // X / Square
      if (gp.buttons[3]?.pressed) bits |= Buttons.HP; // Y / Triangle
      if (gp.buttons[0]?.pressed) bits |= Buttons.LK; // A / Cross
      if (gp.buttons[1]?.pressed) bits |= Buttons.HK; // B / Circle
      if (gp.buttons[5]?.pressed) bits |= Buttons.SPECIAL; // RB / R1
      if (gp.buttons[7]?.pressed) bits |= Buttons.SUPER; // RT / R2
      if (gp.buttons[4]?.pressed) bits |= Buttons.THROW; // LB / L1
    }

    return bits;
  }

  public destroy(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }
}
