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
  /** Low graphics quality: nothing moves at rest, and the board is only drawn while something is happening (DECISIONS #570). */
  low: boolean;
}

/** The graphics quality setting (DECISIONS #570): High is the full look; Low keeps the board still at rest, for a machine that
 * draws without a graphics card, where anything moving makes the browser redraw the whole screen. */
export type GraphicsQuality = 'high' | 'low';

const KEY = 'sr.effects';
const GRAPHICS_KEY = 'sr.graphics';

export function loadGraphicsQuality(): GraphicsQuality {
  try {
    if (localStorage.getItem(GRAPHICS_KEY) === 'low') return 'low';
  } catch {
    /* storage can be unavailable (private windows): fall through */
  }
  return 'high';
}

/** Lets the style sheets see it: Low stops the looping decorations. */
export function markGraphicsQuality(q: GraphicsQuality = loadGraphicsQuality()): void {
  if (typeof document !== 'undefined') document.documentElement.dataset['graphics'] = q;
}

export function saveGraphicsQuality(q: GraphicsQuality): void {
  markGraphicsQuality(q);
  try {
    localStorage.setItem(GRAPHICS_KEY, q);
  } catch {
    /* non-fatal */
  }
}

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

/** Lets the style sheets see the setting too, as they only know the OS's by themselves. */
export function markEffectsMode(mode: EffectsMode = loadEffectsMode()): void {
  if (typeof document !== 'undefined') document.documentElement.dataset['effects'] = mode;
}

export function saveEffectsMode(mode: EffectsMode): void {
  markEffectsMode(mode);
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* non-fatal */
  }
}

export function profileFor(mode: EffectsMode, quality: GraphicsQuality = 'high'): EffectsProfile {
  const still = prefersReducedMotion();
  if (quality === 'low') {
    // (no ambient motion at all; the blows, hits and effects of a card still play)
    return {
      mode,
      still,
      particles: 0,
      fogSpeed: 0,
      parallax: 0,
      pulse: 0,
      maxResolution: 1,
      low: true,
    };
  }
  if (mode === 'reduced') {
    return {
      mode,
      still,
      particles: still ? 0 : 18,
      fogSpeed: still ? 0 : 0.35,
      parallax: 0,
      pulse: still ? 0 : 0.4,
      maxResolution: 1.25,
      low: false,
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
    low: false,
  };
}
