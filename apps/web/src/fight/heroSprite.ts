// A hero drawn by a skeletal 2D rig instead of a still picture (the Sun Knight, DECISIONS #676). The rig draws on its own WebGL2
// canvas (never the board's context); that canvas is a Pixi texture on the hero's sprite, so the hero keeps its place in the line,
// its shadow, its z-order and every effect drawn over it. Fighters.ts owns the sprite and drives update/render from the board's
// frame loop; this class owns the GL context and frees it on dispose.

import { Texture } from 'pixi.js';
import { Knight2D, type KnightClip, type KnightEvent } from '../art/knight2d/knight2d';
import { KNIGHT_CLIPS } from '../art/knight2d/knight_anims';

/** Riftwalkers whose default look (no skin worn) is a rig, and the folder under art/heroes2d/ it lives in. */
export const HERO_RIGS: Readonly<Partial<Record<string, string>>> = { knight: 'sun-knight' };

export type Facing = 'right' | 'left';

interface RigAssets {
  rig: unknown;
  atlas: HTMLImageElement;
}

const loads = new Map<string, Promise<RigAssets | null>>();

/** Fetch a rig's skeleton and atlas once. Null when either is missing or WebGL2 is not available: the hero keeps its picture. */
export function loadRig(id: string): Promise<RigAssets | null> {
  let p = loads.get(id);
  if (!p) {
    const dir = `${import.meta.env.BASE_URL}art/heroes2d/${id}/`;
    p = (async (): Promise<RigAssets | null> => {
      if (!webgl2()) return null;
      try {
        const [rig, atlas] = await Promise.all([
          fetch(`${dir}rig.json`).then((r) => (r.ok ? (r.json() as Promise<unknown>) : null)),
          new Promise<HTMLImageElement | null>((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = `${dir}atlas.png`;
          }),
        ]);
        return rig && atlas ? { rig, atlas } : null;
      } catch {
        return null;
      }
    })();
    loads.set(id, p);
  }
  return p;
}

let gl2: boolean | null = null;
function webgl2(): boolean {
  if (gl2 === null) {
    try {
      const c = document.createElement('canvas');
      const g = c.getContext('webgl2');
      gl2 = !!g;
      g?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      gl2 = false;
    }
  }
  return gl2;
}

// The illustration's space (1105 x 1423 px, y down): the feet stand at (540, 1385) and the knight is ~1320 px tall.
const FEET_X = 540;
const FEET_Y = 1385;
const BODY_H = 1320;
/** a box in illustration px: x0..x0+w, y0..y0+h */
interface Frame {
  x0: number;
  y0: number;
  w: number;
  h: number;
}
/**
 * What each clip needs on the canvas, measured from the clips (their meshes and particles, facing right): standing still needs
 * little, the thrust reaches forward (its tip and sparks to x ~2300), the aura raises the sword overhead (y ~ -1050), and the fall
 * lays the sword back (x ~ -1240) and the body low. A small frame for the idle loop keeps the per-frame copy cheap.
 */
const FRAMES: Record<KnightClip, Frame> = {
  idle: { x0: -150, y0: -250, w: 1600, h: 1750 },
  hit: { x0: -250, y0: -250, w: 1700, h: 1750 },
  strike: { x0: -250, y0: -300, w: 2600, h: 1800 },
  aura: { x0: -250, y0: -1100, w: 1700, h: 2600 },
  death: { x0: -1300, y0: -250, w: 2800, h: 1900 },
};
/** the largest side of the canvas, in pixels */
const MAX_SIDE = 2048;

export class HeroSprite {
  readonly canvas: HTMLCanvasElement;
  readonly texture: Texture;
  private readonly gl: WebGL2RenderingContext;
  private readonly knight: Knight2D;
  /** illustration px to canvas px */
  private k = 1;
  /** canvas px per stage px */
  private px = 1;
  private disposed = false;

  private constructor(
    canvas: HTMLCanvasElement,
    gl: WebGL2RenderingContext,
    assets: RigAssets,
    readonly facing: Facing,
  ) {
    this.canvas = canvas;
    this.gl = gl;
    this.knight = new Knight2D(gl, assets.rig, assets.atlas, KNIGHT_CLIPS);
    this.texture = Texture.from(canvas);
    // (its canvas is resized with the board and with each clip's frame: a dynamic texture makes the sprites using it follow the new
    // size, or a phone would draw the knight at the size his first canvas had)
    this.texture.dynamic = true;
  }

  /** A rigged hero, or null when WebGL2 cannot be had (the caller keeps the picture). */
  static create(assets: RigAssets, facing: Facing): HeroSprite | null {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 2;
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
      // (the board copies this canvas into its own texture: keep the frame until it does)
      preserveDrawingBuffer: true,
    });
    if (!gl) return null;
    try {
      return new HeroSprite(canvas, gl, assets, facing);
    } catch {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return null;
    }
  }

  /** the frame the canvas shows now (the current clip's) */
  private frame: Frame = FRAMES.idle;

  /** Where the feet are on the canvas, as an anchor share (for the Pixi sprite); mirrored when facing left. */
  get anchor(): { x: number; y: number } {
    const f = this.frame;
    const u = (FEET_X - f.x0) / f.w;
    return { x: this.facing === 'right' ? u : 1 - u, y: (FEET_Y - f.y0) / f.h };
  }

  /** Stage px per canvas px: the sprite's scale. */
  get stageScale(): number {
    return 1 / this.px;
  }

  /** The body's width on the stage at this height (a wider stance than a picture's), for laying out the line. */
  static widthFor(height: number): number {
    return (height * 900) / BODY_H;
  }

  /**
   * Size the canvas for a figure `height` stage px tall at `pixelScale` canvas px per stage px (the board's scale times its
   * resolution, at most 2 device pixels a CSS pixel), framing the current clip. True when the canvas changed (it is then blank
   * until drawn: the caller renders).
   */
  resize(height: number, pixelScale: number): boolean {
    const f = FRAMES[this.knight.clipName] ?? FRAMES.idle;
    let k = (height * pixelScale) / BODY_H;
    k = Math.min(k, MAX_SIDE / Math.max(f.w, f.h));
    const w = Math.max(2, Math.round(f.w * k));
    const h = Math.max(2, Math.round(f.h * k));
    const same = f === this.frame && w === this.canvas.width && h === this.canvas.height;
    this.frame = f;
    this.k = k;
    this.px = (k * BODY_H) / height;
    if (same) return false;
    this.canvas.width = w;
    this.canvas.height = h;
    this.texture.source.resize(w, h);
    return true;
  }

  /** Seconds left of a clip that does not loop (0 for the idle loop or a clip at its end). */
  get remaining(): number {
    const k = this.knight as unknown as {
      t?: number;
      clip?: { duration?: number; loop?: boolean };
    };
    if (!k.clip || k.clip.loop) return 0;
    return Math.max(0, (k.clip.duration ?? 0) - (k.t ?? 0));
  }

  play(
    clip: KnightClip,
    opts: { onEvent?: (e: KnightEvent) => void; onEnd?: () => void } = {},
  ): void {
    if (this.disposed) return;
    this.knight.play(clip, {
      ...(opts.onEvent ? { onEvent: opts.onEvent } : {}),
      ...(opts.onEnd ? { onEnd: () => opts.onEnd?.() } : {}),
    });
  }

  get clip(): KnightClip {
    return this.knight.clipName;
  }

  /** a clip that does not loop has reached its end (the death clip then holds its last frame) */
  get finished(): boolean {
    return this.knight.done;
  }

  update(dt: number): void {
    if (!this.disposed && dt > 0) this.knight.update(dt);
  }

  /** Draw the current pose, feet on the anchor, mirrored when facing left, and hand the frame to the board's texture. */
  render(): void {
    if (this.disposed) return;
    const gl = this.gl;
    const { width: w, height: h } = this.canvas;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const [sx, sy] = this.knight.shakeOffset();
    const a = this.anchor;
    const view = Knight2D.viewFor(w, h, this.k, a.x * w, a.y * h, sx, sy);
    if (this.facing === 'left') {
      // mirrored: the first column negated, and moved back so the feet stay on the anchor (a mirror about x = FEET_X)
      view[6] = view[6]! + 2 * view[0]! * FEET_X;
      view[0] = -view[0]!;
    }
    this.knight.render(view);
    this.texture.source.update();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.texture.destroy(true);
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
