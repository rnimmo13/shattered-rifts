// A hero drawn by a skeletal 2D rig instead of a still picture (the Sun Knight, DECISIONS #676; the Rogue, #680). The rig draws on
// its own WebGL2 canvas (never the board's context); that canvas is a Pixi texture on the hero's sprite, so the hero keeps its place
// in the line, its shadow, its z-order and every effect drawn over it. Fighters.ts owns the sprite and drives update/render from
// the board's frame loop; this class owns the GL context and frees it on dispose.

import { Texture } from 'pixi.js';
// (one runtime for every hero: Hero2D runs the knight's rig unchanged; all three are copied from assets-src by
// scripts/sync-hero-rigs.mjs before every local dev or build)
import {
  Hero2D,
  type HeroClip as KnightClip,
  type HeroEvent as KnightEvent,
} from '../art/hero2d/hero2d';
import { KNIGHT_CLIPS } from '../art/hero2d/knight_anims';
import { ROGUE_CLIPS } from '../art/hero2d/rogue_anims';

import { VIDEO_PREFIX } from '../art/heroRigs';
import { VideoHeroSprite, loadHeroVideo, type VideoAssets } from './heroVideo';

export { HERO_RIGS, heroRigFor } from '../art/heroRigs';

export type Facing = 'right' | 'left';

/** a box in illustration px: x0..x0+w, y0..y0+h */
interface Frame {
  x0: number;
  y0: number;
  w: number;
  h: number;
}

/** What the runtimes have in common (Knight2D and the generic Hero2D share one API). */
interface RigRuntime {
  play(
    name: KnightClip,
    opts?: { onEvent?: (e: KnightEvent) => void; onEnd?: (clip: string) => void },
  ): void;
  update(dt: number): void;
  render(view: Float32Array): void;
  shakeOffset(): [number, number];
  readonly clipName: KnightClip;
  readonly done: boolean;
}

/**
 * One rig: its runtime, its clips, where its feet stand in the illustration, how tall its body is, and what each clip needs on the
 * canvas. The frames are measured from the clips (meshes and particles, facing right), with a margin: standing still needs little;
 * a strike, an aura and a fall reach out. A small idle frame keeps the per-frame copy cheap.
 */
interface RigProfile {
  make(gl: WebGL2RenderingContext, rig: unknown, atlas: TexImageSource): RigRuntime;
  /** where the feet stand in the illustration when the rig.json names no ground of its own (its "profile.ground" wins) */
  feet: [number, number];
  /** head to feet, in illustration px */
  bodyH: number;
  /** the body's width at rest as a share of its height (for laying out the line) */
  widthRatio: number;
  frames: Record<KnightClip, Frame>;
}

const PROFILES: Record<string, RigProfile> = {
  // (1105 x 1423 px; feet at (540, 1385), ~1320 px tall: the thrust reaches x ~2300, the aura's sword y ~ -1050, the fall x ~ -1240)
  'sun-knight': {
    make: (gl, rig, atlas) => new Hero2D(gl, rig, atlas, KNIGHT_CLIPS),
    feet: [540, 1385],
    bodyH: 1320,
    widthRatio: 900 / 1320,
    frames: {
      idle: { x0: -150, y0: -250, w: 1600, h: 1750 },
      hit: { x0: -250, y0: -250, w: 1700, h: 1750 },
      strike: { x0: -250, y0: -300, w: 2600, h: 1800 },
      // (the aura's ground ring spreads below the feet)
      aura: { x0: -250, y0: -1100, w: 1700, h: 2750 },
      death: { x0: -1300, y0: -250, w: 2800, h: 1900 },
    },
  },
  // (948 x 1660 px; feet at (474, 1572), ~1550 px tall: the thrown dagger and its sparks reach x ~2300, the aura's flare and the
  // flinch y ~ -290, the fall x ~ -900 and the body down to y ~1800)
  rogue: {
    make: (gl, rig, atlas) => new Hero2D(gl, rig, atlas, ROGUE_CLIPS),
    feet: [474, 1572],
    bodyH: 1550,
    widthRatio: 940 / 1550,
    frames: {
      idle: { x0: -60, y0: -40, w: 1070, h: 1680 },
      hit: { x0: -420, y0: -320, w: 1480, h: 1960 },
      strike: { x0: -100, y0: -40, w: 2560, h: 1680 },
      // (the aura's ground ring spreads below the feet; the fall's dust drifts back past his head)
      aura: { x0: -400, y0: -340, w: 1630, h: 2130 },
      death: { x0: -1160, y0: -80, w: 2140, h: 2060 },
    },
  },
};

interface RigAssets {
  kind: 'rig';
  rig: unknown;
  atlas: HTMLImageElement;
}

/** A loaded model: a skeletal rig's skeleton and atlas, or a video model's clips (DECISIONS #715). */
export type LoadedRig = RigAssets | VideoAssets;

const loads = new Map<string, Promise<RigAssets | null>>();

/**
 * Fetch a rig's skeleton and atlas once, or a video model's idle clip ("video:<hero>", heroRigFor). Null when it is missing or WebGL2
 * is not available: the hero keeps its picture.
 */
export function loadRig(id: string): Promise<LoadedRig | null> {
  if (id.startsWith(VIDEO_PREFIX)) return loadHeroVideo(id.slice(VIDEO_PREFIX.length));
  let p = loads.get(id);
  if (!p) {
    const dir = `${import.meta.env.BASE_URL}art/heroes2d/${id}/`;
    p = (async (): Promise<RigAssets | null> => {
      if (!PROFILES[id] || !webgl2()) return null;
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
        return rig && atlas ? { kind: 'rig' as const, rig, atlas } : null;
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

/** the largest side of the canvas, in pixels */
const MAX_SIDE = 2048;

/** What a hero model on a canvas does, a skeletal rig or a video (Fighters and HeroModel use only this). */
export interface HeroSprite {
  readonly canvas: HTMLCanvasElement;
  readonly texture: Texture;
  readonly anchor: { x: number; y: number };
  readonly stageScale: number;
  widthFor(height: number): number;
  resize(height: number, pixelScale: number): boolean;
  readonly remaining: number;
  /** `variant`: the weapon a card swings ("shotgun"), for a model with a clip of its own for it (a video model, DECISIONS #715) */
  play(
    clip: KnightClip,
    opts?: { onEvent?: (e: { name: string }) => void; onEnd?: () => void; variant?: string },
  ): void;
  /** seconds from a clip's start to its moment, when the model knows (a video model measures its strikes) */
  momentIn?(clip: KnightClip, variant?: string): number;
  readonly clip: KnightClip;
  readonly finished: boolean;
  update(dt: number): void;
  render(): void;
  onLost(lost: () => void): void;
  dispose(): void;
}

/** A model for this id and what was loaded for it: a video model or a skeletal rig. Null when it cannot be made (the picture stays). */
export const HeroSprite = {
  create(id: string, assets: LoadedRig, facing: Facing): HeroSprite | null {
    if (assets.kind === 'video') return VideoHeroSprite.create(assets, facing);
    return RigSprite.create(id, assets, facing);
  },
};

class RigSprite implements HeroSprite {
  readonly canvas: HTMLCanvasElement;
  readonly texture: Texture;
  private readonly gl: WebGL2RenderingContext;
  private readonly runtime: RigRuntime;
  /** illustration px to canvas px */
  private k = 1;
  /** canvas px per stage px */
  private px = 1;
  private disposed = false;
  /** the frame the canvas shows now (the current clip's) */
  private frame: Frame;
  /** where the feet stand in the illustration */
  private readonly feet: [number, number];

  private constructor(
    canvas: HTMLCanvasElement,
    gl: WebGL2RenderingContext,
    assets: RigAssets,
    private readonly profile: RigProfile,
    readonly facing: Facing,
  ) {
    this.canvas = canvas;
    this.gl = gl;
    this.runtime = profile.make(gl, assets.rig, assets.atlas);
    this.frame = profile.frames.idle;
    // (the rig's own ground, the point its runtime draws the shadow and rings around, wins over the profile's: a rig re-cut in
    // assets-src keeps its feet on the line)
    const ground = (assets.rig as { profile?: { ground?: unknown } }).profile?.ground;
    this.feet =
      Array.isArray(ground) && ground.length === 2 && ground.every((v) => typeof v === 'number')
        ? [ground[0] as number, ground[1] as number]
        : profile.feet;
    this.texture = Texture.from(canvas);
    // (its canvas is resized with the board and with each clip's frame: a dynamic texture makes the sprites using it follow the new
    // size, or a phone would draw the hero at the size its first canvas had)
    this.texture.dynamic = true;
  }

  /** A rigged hero, or null when the rig is unknown or WebGL2 cannot be had (the caller keeps the picture). */
  static create(id: string, assets: RigAssets, facing: Facing): RigSprite | null {
    const profile = PROFILES[id];
    if (!profile) return null;
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
      return new RigSprite(canvas, gl, assets, profile, facing);
    } catch {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return null;
    }
  }

  /** Where the feet are on the canvas, as an anchor share (for the Pixi sprite); mirrored when facing left. */
  get anchor(): { x: number; y: number } {
    const f = this.frame;
    const [fx, fy] = this.feet;
    const u = (fx - f.x0) / f.w;
    return { x: this.facing === 'right' ? u : 1 - u, y: (fy - f.y0) / f.h };
  }

  /** Stage px per canvas px: the sprite's scale. */
  get stageScale(): number {
    return 1 / this.px;
  }

  /** The body's width on the stage at this height (often a wider stance than a picture's), for laying out the line. */
  widthFor(height: number): number {
    return height * this.profile.widthRatio;
  }

  /**
   * Size the canvas for a figure `height` stage px tall at `pixelScale` canvas px per stage px (the board's scale times its
   * resolution, at most 2 device pixels a CSS pixel), framing the current clip. True when the canvas changed (it is then blank
   * until drawn: the caller renders).
   */
  resize(height: number, pixelScale: number): boolean {
    const p = this.profile;
    const f = p.frames[this.runtime.clipName] ?? p.frames.idle;
    let k = (height * pixelScale) / p.bodyH;
    k = Math.min(k, MAX_SIDE / Math.max(f.w, f.h));
    const w = Math.max(2, Math.round(f.w * k));
    const h = Math.max(2, Math.round(f.h * k));
    const same = f === this.frame && w === this.canvas.width && h === this.canvas.height;
    this.frame = f;
    this.k = k;
    this.px = (k * p.bodyH) / height;
    if (same) return false;
    this.canvas.width = w;
    this.canvas.height = h;
    this.texture.source.resize(w, h);
    return true;
  }

  /** Seconds left of a clip that does not loop (0 for the idle loop or a clip at its end). */
  get remaining(): number {
    const r = this.runtime as unknown as {
      t?: number;
      clip?: { duration?: number; loop?: boolean };
    };
    if (!r.clip || r.clip.loop) return 0;
    return Math.max(0, (r.clip.duration ?? 0) - (r.t ?? 0));
  }

  play(
    clip: KnightClip,
    opts: { onEvent?: (e: KnightEvent) => void; onEnd?: () => void } = {},
  ): void {
    if (this.disposed) return;
    this.runtime.play(clip, {
      ...(opts.onEvent ? { onEvent: opts.onEvent } : {}),
      ...(opts.onEnd ? { onEnd: () => opts.onEnd?.() } : {}),
    });
  }

  get clip(): KnightClip {
    return this.runtime.clipName;
  }

  /** a clip that does not loop has reached its end (the death clip then holds its last frame) */
  get finished(): boolean {
    return this.runtime.done;
  }

  update(dt: number): void {
    if (!this.disposed && dt > 0) this.runtime.update(dt);
  }

  /** Draw the current pose, feet on the anchor, mirrored when facing left, and hand the frame to the board's texture. */
  render(): void {
    if (this.disposed) return;
    const gl = this.gl;
    const { width: w, height: h } = this.canvas;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const [sx, sy] = this.runtime.shakeOffset();
    const a = this.anchor;
    const view = Hero2D.viewFor(w, h, this.k, a.x * w, a.y * h, sx, sy, this.feet);
    if (this.facing === 'left') {
      // mirrored: the first column negated, and moved back so the feet stay on the anchor (a mirror about the feet's x)
      view[6] = view[6]! + 2 * view[0]! * this.feet[0];
      view[0] = -view[0]!;
    }
    this.runtime.render(view);
    this.texture.source.update();
  }

  /** Call `lost` if the browser takes this rig's GL context away (a GPU reset, too many contexts): the caller shows the picture. */
  onLost(lost: () => void): void {
    this.canvas.addEventListener('webglcontextlost', () => lost(), { once: true });
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.texture.destroy(true);
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
