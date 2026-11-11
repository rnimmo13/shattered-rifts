// A hero drawn from a pose-sheet atlas: every Riftwalker's default look (DECISIONS #755; the video models stay the beta setting). The
// animations are made in assets-src/heroes-pose-sheets (ChatGPT pose sheets turned into 60 fps frames by _pipeline/pose_pipeline.py)
// and packed for the game by _pipeline/pack_for_game.py into public/art/heroes-sheets/<id>/: sprites.json and WebP atlas pages, the
// standing body about 300 px tall (about 5 MB a hero to download, about 90 MB once decoded).
//
// Each frame of the atlas is drawn on a plain 2D canvas, feet on the anchor, mirrored when facing left. The canvas is a Pixi texture
// exactly as a rig's or a video's is, so Fighters and HeroModel drive it through the same HeroSprite calls.

import { Texture } from 'pixi.js';

type Facing = 'right' | 'left';
type Clip = 'idle' | 'strike' | 'hit' | 'aura' | 'death';

/** One frame in the manifest: atlas page, x, y, w, h, and the offset of its top-left from the ground origin (feet), in sheet px. */
type SheetFrame = [number, number, number, number, number, number, number];

interface SheetClip {
  fps: number;
  loop: boolean;
  count: number;
  holdLast?: boolean;
  events?: { name: string; frame: number; time: number }[];
  frames: SheetFrame[];
}

interface Manifest {
  name: string;
  displayScale?: number;
  pages: string[];
  clips: Record<string, SheetClip>;
}

export interface SheetAssets {
  kind: 'sheet';
  hero: string;
  man: Manifest;
  /** decoded once and kept decoded (an ImageBitmap; an image element where that is not available) */
  pages: (ImageBitmap | HTMLImageElement)[];
}

/** a box in sheet px around the feet (0, 0) */
interface Box {
  x0: number;
  y0: number;
  w: number;
  h: number;
}

/** the largest side of the canvas, in pixels */
const MAX_SIDE = 2048;
/** the same fit as the video models: the body fills this share of the height it is given, a wide stance at most this share wide */
const BODY_SHARE = 0.78;
const MAX_WIDTH = 0.85;
/** the moment the board waits for in each clip */
const MOMENT: Record<Exclude<Clip, 'idle'>, string> = {
  strike: 'hit',
  aura: 'aura',
  hit: 'hit',
  death: 'land',
};

/** loaded heroes, oldest first: only the last few are kept (each holds its decoded atlas), so browsing the Lore page or the picker
 * through every Riftwalker does not keep them all in memory. A model on show keeps its own reference while it is drawn. */
const loads = new Map<string, Promise<SheetAssets | null>>();
const KEEP = 3;

/** Fetch a hero's manifest and atlas pages. Null when they cannot be had: the hero keeps its picture (and is tried again later). */
export function loadHeroSheet(hero: string): Promise<SheetAssets | null> {
  let p = loads.get(hero);
  if (p) {
    // (most recently used last)
    loads.delete(hero);
    loads.set(hero, p);
  } else {
    const dir = `${import.meta.env.BASE_URL}art/heroes-sheets/${hero}/`;
    p = (async (): Promise<SheetAssets | null> => {
      try {
        const r = await fetch(`${dir}sprites.json`);
        if (!r.ok) return null;
        const man = (await r.json()) as Manifest;
        if (!man.clips?.['idle']) return null;
        // (an ImageBitmap stays decoded: an image element's pixels may be dropped while it is off the page and decoded again mid-strike)
        const pages = await Promise.all(
          man.pages.map(async (f): Promise<ImageBitmap | HTMLImageElement> => {
            if (typeof createImageBitmap === 'function') {
              const blob = await fetch(`${dir}${f}`).then((r) => {
                if (!r.ok) throw new Error(`${f}: ${r.status}`);
                return r.blob();
              });
              return createImageBitmap(blob);
            }
            const img = new Image();
            img.src = `${dir}${f}`;
            await img.decode();
            return img;
          }),
        );
        return { kind: 'sheet' as const, hero, man, pages };
      } catch {
        return null;
      }
    })();
    loads.set(hero, p);
    const mine = p;
    void p.then((a) => {
      if (!a && loads.get(hero) === mine) loads.delete(hero);
    });
    while (loads.size > KEEP) loads.delete(loads.keys().next().value!);
  }
  return p;
}

/** The box around every frame of a clip (with a small margin), so the canvas frames the whole clip without moving. */
function boxOf(c: SheetClip): Box {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const [, , , w, h, ox, oy] of c.frames) {
    x0 = Math.min(x0, ox);
    y0 = Math.min(y0, oy);
    x1 = Math.max(x1, ox + w);
    y1 = Math.max(y1, oy + h);
  }
  // (the feet always inside the box, so the anchor is a share between 0 and 1)
  x0 = Math.min(x0, 0) - 4;
  y0 = Math.min(y0, 0) - 4;
  x1 = Math.max(x1, 0) + 4;
  y1 = Math.max(y1, 0) + 4;
  return { x0, y0, w: x1 - x0, h: y1 - y0 };
}

export class SheetHeroSprite {
  readonly canvas: HTMLCanvasElement;
  readonly texture: Texture;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly boxes = new Map<string, Box>();
  /** the standing body at rest, in sheet px (the idle's first frame) */
  private readonly bodyH: number;
  private readonly bodyW: number;
  private clipName: Clip = 'idle';
  /** the manifest clip playing ("attack2" for the shotgun) */
  private sheetClip = 'idle';
  private t = 0;
  private fired = new Set<string>();
  private ended = false;
  private onEvent: ((e: { name: string }) => void) | undefined;
  private onEnd: (() => void) | undefined;
  /** sheet px to canvas px */
  private k = 1;
  /** canvas px per stage px */
  private px = 1;
  private disposed = false;
  /** what the canvas shows now (clip, frame, size), so an unchanged frame is not drawn and uploaded again */
  private drawn = '';

  private constructor(
    private readonly a: SheetAssets,
    readonly facing: Facing,
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = 2;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    this.ctx = ctx;
    for (const [name, c] of Object.entries(a.man.clips)) this.boxes.set(name, boxOf(c));
    const rest = a.man.clips['idle']!.frames[0]!;
    const scale = a.man.displayScale ?? 1;
    this.bodyH = rest[4] / scale;
    this.bodyW = rest[3] / scale;
    this.texture = Texture.from(this.canvas);
    this.texture.dynamic = true;
  }

  static create(assets: SheetAssets, facing: Facing): SheetHeroSprite | null {
    try {
      return new SheetHeroSprite(assets, facing);
    } catch {
      return null;
    }
  }

  /** Which manifest clip plays a game clip: the strike is "attack" ("slash" for the Knight), the shotgun the second attack. */
  private sheetFor(clip: Clip, variant?: string): string {
    const c = this.a.man.clips;
    if (clip !== 'strike') return c[clip] ? clip : 'idle';
    if (variant === 'shotgun' && c['attack2']) return 'attack2';
    return c['attack'] ? 'attack' : c['slash'] ? 'slash' : 'idle';
  }

  private get cur(): SheetClip {
    return this.a.man.clips[this.sheetClip] ?? this.a.man.clips['idle']!;
  }

  private get box(): Box {
    return this.boxes.get(this.sheetClip) ?? this.boxes.get('idle')!;
  }

  get anchor(): { x: number; y: number } {
    const b = this.box;
    const u = -b.x0 / b.w;
    return { x: this.facing === 'right' ? u : 1 - u, y: -b.y0 / b.h };
  }

  get stageScale(): number {
    return 1 / this.px;
  }

  private get fitH(): number {
    return Math.max(this.bodyH / BODY_SHARE, this.bodyW / MAX_WIDTH);
  }

  widthFor(height: number): number {
    return (height * this.bodyW) / this.fitH;
  }

  resize(height: number, pixelScale: number): boolean {
    const b = this.box;
    let k = (height * pixelScale) / this.fitH;
    k = Math.min(k, MAX_SIDE / Math.max(b.w, b.h));
    const w = Math.max(2, Math.round(b.w * k));
    const h = Math.max(2, Math.round(b.h * k));
    this.k = k;
    this.px = (k * this.fitH) / height;
    if (w === this.canvas.width && h === this.canvas.height) return false;
    this.canvas.width = w;
    this.canvas.height = h;
    this.texture.source.resize(w, h);
    return true;
  }

  get clip(): Clip {
    return this.clipName;
  }

  get finished(): boolean {
    return this.clipName !== 'idle' && this.ended;
  }

  get remaining(): number {
    if (this.clipName === 'idle' || this.ended) return 0;
    const c = this.cur;
    return Math.max(0, c.count / c.fps - this.t);
  }

  momentIn(clip: Clip, variant?: string): number {
    if (clip === 'idle') return 0;
    const c = this.a.man.clips[this.sheetFor(clip, variant)];
    const ev = c?.events?.find((e) => e.name === MOMENT[clip]);
    return ev ? ev.frame / c!.fps : 0;
  }

  ready(): boolean {
    return true;
  }

  play(
    clip: Clip,
    opts: { onEvent?: (e: { name: string }) => void; onEnd?: () => void; variant?: string } = {},
  ): void {
    if (this.disposed) return;
    // (a clip cut short still says it ended, so nothing waits for it)
    const was = this.onEnd;
    this.onEnd = undefined;
    if (this.clipName !== 'idle' && !this.ended) was?.();
    this.clipName = clip;
    this.sheetClip = this.sheetFor(clip, opts.variant);
    this.t = 0;
    this.fired = new Set();
    this.ended = false;
    this.onEvent = opts.onEvent;
    this.onEnd = opts.onEnd;
  }

  update(dt: number): void {
    if (this.disposed || dt <= 0) return;
    const c = this.cur;
    if (this.clipName === 'idle') {
      this.t = (this.t + dt) % (c.count / c.fps);
      return;
    }
    if (this.ended) return;
    this.t += dt;
    const f = Math.floor(this.t * c.fps);
    for (const e of c.events ?? [])
      if (f >= e.frame && !this.fired.has(e.name)) {
        this.fired.add(e.name);
        this.onEvent?.({ name: e.name });
      }
    if (f >= c.count) {
      this.ended = true;
      const end = this.onEnd;
      this.onEnd = undefined;
      // (death holds its last frame; every other clip goes back to the idle loop)
      if (this.clipName !== 'death') {
        this.clipName = 'idle';
        this.sheetClip = 'idle';
        this.t = 0;
      }
      end?.();
    }
  }

  render(): void {
    if (this.disposed) return;
    const c = this.cur;
    const i = Math.min(c.count - 1, Math.max(0, Math.floor(this.t * c.fps)));
    const fr = c.frames[i];
    const ctx = this.ctx;
    const { width: W, height: H } = this.canvas;
    const key = `${this.sheetClip}:${i}:${W}x${H}:${this.k}`;
    if (key === this.drawn) return;
    this.drawn = key;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (fr) {
      const [pg, x, y, w, h, ox, oy] = fr;
      const img = this.a.pages[pg];
      if (img) {
        const b = this.box;
        if (this.facing === 'left') ctx.setTransform(-1, 0, 0, 1, W, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
          img,
          x,
          y,
          w,
          h,
          (ox - b.x0) * this.k,
          (oy - b.y0) * this.k,
          w * this.k,
          h * this.k,
        );
      }
    }
    this.texture.source.update();
  }

  /** A 2D canvas has no context to lose. */
  onLost(): void {}

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.texture.destroy(true);
  }
}
