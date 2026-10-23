// Small player preferences kept in this browser.

const SPEED_KEY = 'sr.speed';

/** Animation speed multipliers offered in Settings. */
export const SPEEDS = [1, 1.5, 2, 4] as const;

/** Snappy by default: the fight should keep moving. */
export const DEFAULT_SPEED = 1.5;

export function loadSpeed(): number {
  try {
    const v = Number(localStorage.getItem(SPEED_KEY));
    if ((SPEEDS as readonly number[]).includes(v)) return v;
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_SPEED;
}

export function saveSpeed(v: number): void {
  try {
    localStorage.setItem(SPEED_KEY, String(v));
  } catch {
    /* non-fatal */
  }
}
