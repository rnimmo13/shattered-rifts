// Types for the vendored Sun Knight 2D runtime (knight2d.js). Only what the game calls is declared.

export interface KnightEvent {
  /** 'hit' (strike impact at 0.41s, or a blow taken at 0s), 'aura' (0.29s), 'land' (death, 0.98s) */
  name: string;
  t: number;
  fx?: string;
}

export interface KnightPlayOptions {
  onEvent?: (e: KnightEvent) => void;
  onEnd?: (clip: string) => void;
}

export type KnightClip = 'idle' | 'strike' | 'aura' | 'hit' | 'death';

export declare class Knight2D {
  constructor(gl: WebGL2RenderingContext, rig: unknown, atlas: TexImageSource, clips: unknown);
  play(name: KnightClip, opts?: KnightPlayOptions): void;
  update(dt: number): void;
  render(view: Float32Array, opts?: Record<string, unknown>): void;
  shakeOffset(): [number, number];
  readonly clipName: KnightClip;
  readonly done: boolean;
  /** illustration px -> clip space, the feet (illustration point 540,1385) at (ax, ay) canvas px */
  static viewFor(
    w: number,
    h: number,
    scale: number,
    ax: number,
    ay: number,
    shx?: number,
    shy?: number,
  ): Float32Array;
}
