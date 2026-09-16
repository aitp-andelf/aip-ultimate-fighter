import { INPUT_BUFFER_TICKS, Buttons } from "@aipuf/contracts";
import type { FighterRuntime } from "../types.ts";

export interface BufferedInput {
  bits: number;
  edges: number; // newly pressed buttons on this tick
}

export function updateInputBuffer(fighter: FighterRuntime, rawBits: number): void {
  const prevBits = fighter.lastBits;
  const edgeBits = rawBits & ~prevBits;

  fighter.lastBits = rawBits;

  // Shift buffer and insert newest edge bits at index 0
  for (let i = fighter.buffer.length - 1; i > 0; i--) {
    const val = fighter.buffer[i - 1];
    fighter.buffer[i] = val !== undefined ? val : 0;
  }
  fighter.buffer[0] = edgeBits;
}

/**
 * Checks if a button edge occurred within the last `windowTicks` ticks.
 */
export function hasBufferedEdge(
  fighter: FighterRuntime,
  buttonMask: number,
  windowTicks: number = INPUT_BUFFER_TICKS
): boolean {
  const max = Math.min(windowTicks, fighter.buffer.length);
  for (let i = 0; i < max; i++) {
    const b = fighter.buffer[i];
    if (b !== undefined && (b & buttonMask) !== 0) {
      return true;
    }
  }
  return false;
}

/**
 * Clears the buffered edge for a button once consumed.
 */
export function consumeBufferedEdge(fighter: FighterRuntime, buttonMask: number): void {
  for (let i = 0; i < fighter.buffer.length; i++) {
    const b = fighter.buffer[i];
    if (b !== undefined && (b & buttonMask) !== 0) {
      fighter.buffer[i] = b & ~buttonMask;
      break;
    }
  }
}

/**
 * Checks whether a button is currently held down this tick.
 */
export function isButtonHeld(fighter: FighterRuntime, buttonMask: number): boolean {
  return (fighter.lastBits & buttonMask) !== 0;
}
