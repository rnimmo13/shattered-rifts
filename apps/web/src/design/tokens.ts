// Design tokens: the single source of truth for the look. Dark fantasy rifts: obsidian and navy
// depths, warm gold trim, rift energy in electric violet and cyan. CSS reads these as custom properties
// (applyCssTokens) and Pixi reads the same values (hex()), so the two layers can never drift apart.

export const color = {
  // depths
  void: '#04050b',
  obsidian: '#080a14',
  navy: '#0c1330',
  navyMid: '#14204a',
  navyLight: '#1f3068',
  slate: '#2a2f45',
  // warm gold trim
  goldDark: '#7a5a1e',
  gold: '#d4a84b',
  goldLight: '#f6dc94',
  goldPale: '#fff1c4',
  // rift energy
  violetDeep: '#3a1a7a',
  violet: '#8f5bff',
  violetGlow: '#b99aff',
  cyan: '#36e0ff',
  cyanGlow: '#a6f4ff',
  magenta: '#ff4fd8',
  // supporting
  ember: '#ff8a3d',
  emberGlow: '#ffc27a',
  blood: '#d12f48',
  heal: '#6df0a8',
  ivory: '#f2ebd6',
  textDim: '#9aa3c4',
} as const;

export type ColorName = keyof typeof color;

/** '#rrggbb' → 0xrrggbb for Pixi. */
export function hex(c: string): number {
  return parseInt(c.replace('#', ''), 16);
}

/** '#rrggbb' → rgba() with alpha, for canvas gradients and CSS. */
export function rgba(c: string, a: number): string {
  const n = hex(c);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

export const glow = {
  gold: `0 0 14px ${rgba(color.gold, 0.55)}, 0 0 38px ${rgba(color.gold, 0.25)}`,
  violet: `0 0 14px ${rgba(color.violet, 0.65)}, 0 0 44px ${rgba(color.violet, 0.3)}`,
  cyan: `0 0 14px ${rgba(color.cyan, 0.6)}, 0 0 44px ${rgba(color.cyan, 0.28)}`,
  ember: `0 0 12px ${rgba(color.ember, 0.6)}, 0 0 30px ${rgba(color.ember, 0.25)}`,
} as const;

export const shadow = {
  soft: '0 6px 18px rgba(0, 0, 0, 0.45)',
  deep: '0 14px 40px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.5)',
  inset: 'inset 0 2px 10px rgba(0, 0, 0, 0.55), inset 0 -1px 0 rgba(255, 255, 255, 0.05)',
} as const;

/** Durations in milliseconds. `speed` (the player's animation speed setting) divides them later. */
export const time = {
  instant: 80,
  fast: 140,
  base: 240,
  slow: 420,
  slower: 700,
  banner: 900,
} as const;

/** Easing curves: CSS cubic-bezier and the GSAP equivalents. No linear motion anywhere (except loops). */
export const ease = {
  out: { css: 'cubic-bezier(0.22, 1, 0.36, 1)', gsap: 'power3.out' },
  inOut: { css: 'cubic-bezier(0.65, 0, 0.35, 1)', gsap: 'power2.inOut' },
  in: { css: 'cubic-bezier(0.5, 0, 0.9, 0.4)', gsap: 'power3.in' },
  /** Overshoot: pops, summons, anything that should feel punchy. */
  pop: { css: 'cubic-bezier(0.34, 1.56, 0.64, 1)', gsap: 'back.out(1.7)' },
  /** Hard snap: impacts. */
  snap: { css: 'cubic-bezier(0.16, 1, 0.3, 1)', gsap: 'expo.out' },
  /** Idle loops (breathing, bobbing). */
  breathe: { css: 'cubic-bezier(0.37, 0, 0.63, 1)', gsap: 'sine.inOut' },
} as const;

/** Reference scene size. Everything on the battlefield is laid out in these coordinates and scaled to fit. */
export const stage = { width: 1920, height: 1080 } as const;

/** Writes the tokens onto :root as CSS custom properties (`--c-gold`, `--glow-violet`, ...). */
export function applyCssTokens(root: HTMLElement = document.documentElement): void {
  const set = (k: string, v: string) => root.style.setProperty(k, v);
  for (const [k, v] of Object.entries(color))
    set(`--c-${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`, v);
  for (const [k, v] of Object.entries(glow)) set(`--glow-${k}`, v);
  for (const [k, v] of Object.entries(shadow)) set(`--shadow-${k}`, v);
  for (const [k, v] of Object.entries(time)) set(`--t-${k}`, `${v}ms`);
  for (const [k, v] of Object.entries(ease)) set(`--ease-${k}`, v.css);
}
