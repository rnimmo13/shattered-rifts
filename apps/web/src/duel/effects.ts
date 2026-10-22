// Visual-effects quality: "reduced effects" (a setting) and prefers-reduced-motion (the OS setting).
// Everything ambient reads its numbers from here so there's one place to tune performance.

export type EffectsMode = 'full' | 'reduced';

export interface EffectsProfile {
  mode: EffectsMode;
  /** True when the player (or the OS) asked for no motion: nothing drifts, pulses or parallaxes. */
  still: boolean;
  /** Ambient particle cap (embers / rift motes). */
  particles: number;
  /** Fog drift speed multiplier (0 = static). */
  fogSpeed: number;
  /** Pointer parallax strength multiplier (0 = off). */
  parallax: number;
  /** Floor-crack / slot pulse strength multiplier (0 = steady glow). */
  pulse: number;
  /** Render resolution cap (devicePixelRatio ceiling). */
  maxResolution: number;
}

const KEY = 'sr.effects';

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function loadEffectsMode(): EffectsMode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'full' || v === 'reduced') return v;
  } catch {
    /* storage can be unavailable (private windows): fall through */
  }
  return prefersReducedMotion() ? 'reduced' : 'full';
}

export function saveEffectsMode(mode: EffectsMode): void {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* non-fatal */
  }
}

export function profileFor(mode: EffectsMode): EffectsProfile {
  const still = prefersReducedMotion();
  if (mode === 'reduced') {
    return {
      mode,
      still,
      particles: still ? 0 : 18,
      fogSpeed: still ? 0 : 0.35,
      parallax: 0,
      pulse: still ? 0 : 0.4,
      maxResolution: 1.25,
    };
  }
  return {
    mode,
    still,
    particles: still ? 0 : 70,
    fogSpeed: still ? 0 : 1,
    parallax: still ? 0 : 1,
    pulse: still ? 0 : 1,
    maxResolution: 2,
  };
}
