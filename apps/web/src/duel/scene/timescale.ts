// One owner for the global animation clock. The player's speed setting, a trap reveal's slow-motion and a hit-stop all
// change the same GSAP timeline scale, so they have to be combined in one place: the effective scale is the speed
// setting times the slowest active "hold".

import { gsap } from 'gsap';

let base = 1;
const holds = new Map<string, number>();

function apply(): void {
  let slow = 1;
  for (const f of holds.values()) slow = Math.min(slow, f);
  gsap.globalTimeline.timeScale(base * slow);
}

/** The player's animation speed (1, 2 or 4). */
export function setBaseSpeed(speed: number): void {
  base = Math.max(0.25, Math.min(8, speed));
  apply();
}

/** Slow everything to `factor` (0..1) until released. The slowest hold wins. */
export function holdSlow(id: string, factor: number): void {
  holds.set(id, Math.max(0.01, Math.min(1, factor)));
  apply();
}

export function releaseSlow(id: string): void {
  if (holds.delete(id)) apply();
}

export function getBaseSpeed(): number {
  return base;
}

export function isSlowed(): boolean {
  return holds.size > 0;
}

/** Back to normal (leaving the duel). */
export function resetTimeScale(): void {
  holds.clear();
  base = 1;
  apply();
}

/** How hard the screen shakes for a hit of this size (px at the 1080p reference scale). */
export function shakeFor(amount: number): number {
  return Math.max(0, Math.min(26, 3 + amount * 2.4));
}

/** How long (ms) the world freezes for a hit of this size: only real blows stop time. */
export function hitStopFor(amount: number): number {
  if (amount >= 6) return 130;
  if (amount >= 4) return 95;
  if (amount >= 2) return 55;
  return 0;
}
