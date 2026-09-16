/** xorshift32 — state is the seed/current value, never 0. */
export function rngNext(state: number): { value: number; state: number } {
  let x = state >>> 0;
  if (x === 0) x = 0x9e3779b9;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  x >>>= 0;
  return { value: x, state: x };
}

export function rngRange(state: number, maxExclusive: number): { value: number; state: number } {
  const n = rngNext(state);
  return { value: n.value % maxExclusive, state: n.state };
}
