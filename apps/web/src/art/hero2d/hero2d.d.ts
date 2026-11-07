// Types for the generic 2D rig runtime (hero2d.js, copied from assets-src by scripts/sync-hero-rigs.mjs). It runs every hero's
// rig (the Sun Knight's and the Rogue's); a rig's own settings come from its rig.json "profile". Only what the game calls.

export interface HeroEvent {
  /** e.g. 'hit' (a strike's impact, or a blow taken), 'aura', 'land' (a fall), and rig-specific ones ('launch', 'reform'...) */
  name: string;
  t: number;
  fx?: string;
}

export interface HeroPlayOptions {
  onEvent?: (e: HeroEvent) => void;
  onEnd?: (clip: string) => void;
}

export type HeroClip = 'idle' | 'strike' | 'aura' | 'hit' | 'death';

export declare class Hero2D {
  constructor(gl: WebGL2RenderingContext, rig: unknown, atlas: TexImageSource, clips: unknown);
  play(name: HeroClip, opts?: HeroPlayOptions): void;
  update(dt: number): void;
  render(view: Float32Array, opts?: Record<string, unknown>): void;
  shakeOffset(): [number, number];
  readonly clipName: HeroClip;
  readonly done: boolean;
  /** illustration px -> clip space, the `ground` illustration point (the feet) at (ax, ay) canvas px */
  static viewFor(
    w: number,
    h: number,
    scale: number,
    ax: number,
    ay: number,
    shx?: number,
    shy?: number,
    ground?: [number, number],
  ): Float32Array;
}
