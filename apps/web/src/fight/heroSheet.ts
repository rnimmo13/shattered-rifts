// A hero drawn from a pose-sheet atlas: every Riftwalker's default look (DECISIONS #755; the video models stay the beta setting). The
// animations are made in assets-src/heroes-pose-sheets (ChatGPT pose sheets turned into 60 fps frames by _pipeline/pose_pipeline.py)
// and packed for the game by _pipeline/pack_for_game.py into two sets (DECISIONS #759), both from the HD redraw (<hero>_hd.json, out-hd):
//   public/art/heroes-sheets/<id>/       High graphics: the standing body 400 px tall (--body 400; 4-9 MB a hero, 95-225 MB decoded)
//   public/art/heroes-sheets-lite/<id>/  Medium graphics: 300 px (--body 300; about half of that)
// sprites.json and WebP atlas pages, packed --idle-first: the idle's frames are on the first pages ("idlePages"), so the model shows
// once those are in and its other clips are fetched after it. A clip asked for before its pages are in is skipped (the board keeps
// its own timing); a death waits for its pages and then plays.
//
// Each frame of the atlas is drawn on a plain 2D canvas, feet on the anchor, mirrored when facing left. The canvas is a Pixi texture
// exactly as a rig's or a video's is, so Fighters and HeroModel drive it through the same HeroSprite calls.

import { Texture } from 'pixi.js';
import { loadGraphicsQuality } from '../duel/effects';

type Facing = 'right' | 'left';
type Clip = 'idle' | 'strike' | 'hit' | 'aura' | 'death';

/** One frame in the manifest: atlas page, x, y, w, h, and the offset of its top-left from the ground origin (feet), in sheet px. */
type SheetFrame = [number, number, number, number, number, number, number];

interface SheetClip {
  fps: number;
  loop: boolean;
  count: number;
  holdLast?: boolean;
  /** Seconds of visible anticipation before impact, when the clip needs more than the default. */
  strikeLead?: number;
  events?: { name: string; frame: number; time: number }[];
  frames: SheetFrame[];
}

interface Manifest {
  name: string;
  displayScale?: number;
  /** the standing body's own width, in sheet px, when the resting pose holds something far out to the side (the Demon Knight's great
   * sword): the figure is fitted and spaced by this, not by the whole picture, or the weapon made the body small (DECISIONS #772) */
  fitWidth?: number;
  pages: string[];
  /** the first this many pages hold every idle frame (pack_for_game --idle-first); without it every page is needed at once */
  idlePages?: number;
  clips: Record<string, SheetClip>;
}

export interface SheetAssets {
  kind: 'sheet';
  hero: string;
  /** a creature's model (DECISIONS #760): drawn at its picture's size, the body filling the height it is given */
  unit?: boolean;
  man: Manifest;
  /** decoded once and kept decoded (an ImageBitmap; an image element where that is not available); null until fetched (the
   * pages after the idle's come in behind it) */
  pages: (ImageBitmap | HTMLImageElement | null)[];
  /** per page: resolves once it is in (false if it could not be had: the clips on it are skipped) */
  pageReady: Promise<boolean>[];
  /** resolves once every page has settled, true if all came in */
  complete: Promise<boolean>;
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
/** How long before its first marked moment (the hit, or the shot leaving) a Riftwalker's strike begins, in seconds. The clips were
 * drawn with about 0.27 s of wind-up whose first frames hardly move, which read as a hitch, not a motion (Robert, DECISIONS #770):
 * a strike starts this far ahead of the moment and the frames before are left out. Creatures keep theirs: an enemy's wind-up is a tell. */
export const STRIKE_LEAD = 0.1;

/** Where in a strike clip playback starts, in seconds (on a frame): its first moment less STRIKE_LEAD, never before the clip. */
export function strikeStart(c: {
  fps: number;
  strikeLead?: number;
  events?: { frame: number }[];
}): number {
  const first = Math.min(...(c.events ?? []).map((e) => e.frame));
  if (!Number.isFinite(first) || c.fps <= 0) return 0;
  const lead = c.strikeLead ?? STRIKE_LEAD;
  return Math.max(0, first - Math.round(lead * c.fps)) / c.fps;
}

/** the moment the board waits for in each clip */
const MOMENT: Record<Exclude<Clip, 'idle'>, string> = {
  strike: 'hit',
  aura: 'aura',
  hit: 'hit',
  death: 'land',
};

/** loaded models, oldest first: only the last few are kept (each holds its decoded atlas), so browsing the Lore page or the picker
 * through every Riftwalker does not keep them all in memory. A model on show keeps its own reference while it is drawn. Creatures
 * have their own, larger list: a fight can show several at once (DECISIONS #760). */
const LOADS = {
  heroes: new Map<string, Promise<SheetAssets | null>>(),
  units: new Map<string, Promise<SheetAssets | null>>(),
};
const KEEP = { heroes: 3, units: 8 };

/** Fetch a hero's manifest and atlas pages. Null when they cannot be had: the hero keeps its picture (and is tried again later). */
export function loadHeroSheet(hero: string): Promise<SheetAssets | null> {
  return loadSheet('heroes', hero);
}

/** Forget every loaded creature model (a fight is over): models still drawn keep their own reference until they are disposed. */
export function releaseUnitSheets(): void {
  LOADS.units.clear();
}

/** A creature's pose-sheet model (public/art/units-sheets, DECISIONS #760), the same way as a hero's. */
export function loadUnitSheet(unit: string): Promise<SheetAssets | null> {
  return loadSheet('units', unit);
}

function loadSheet(kind: 'heroes' | 'units', hero: string): Promise<SheetAssets | null> {
  // (Medium graphics loads the lighter set; Low never gets here in a fight: its board holds still, DECISIONS #759. Kept apart by set,
  // so a change of setting fetches the other one for the next model shown)
  const set = `${kind}-sheets${loadGraphicsQuality() === 'medium' ? '-lite' : ''}`;
  const key = `${set}/${hero}`;
  const loads = LOADS[kind];
  let p = loads.get(key);
  if (p) {
    // (most recently used last)
    loads.delete(key);
    loads.set(key, p);
  } else {
    const dir = `${import.meta.env.BASE_URL}art/${set}/${hero}/`;
    p = (async (): Promise<SheetAssets | null> => {
      try {
        const r = await fetch(`${dir}sprites.json`);
        if (!r.ok) return null;
        const man = (await r.json()) as Manifest;
        if (!man.clips?.['idle']) return null;
        // (an ImageBitmap stays decoded: an image element's pixels may be dropped while it is off the page and decoded again mid-strike)
        const page = async (f: string): Promise<ImageBitmap | HTMLImageElement> => {
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
        };
        const first = Math.min(man.pages.length, Math.max(1, man.idlePages ?? man.pages.length));
        const pages: SheetAssets['pages'] = man.pages.map(() => null);
        (await Promise.all(man.pages.slice(0, first).map(page))).forEach(
          (img, i) => (pages[i] = img),
        );
        // (the rest, behind the idle: the model is on show meanwhile. Each page says when it is in, so a clip waits only for its own)
        const pageReady = man.pages.map((f, i) =>
          i < first
            ? Promise.resolve(true)
            : page(f).then(
                (img) => ((pages[i] = img), true),
                () => false,
              ),
        );
        const complete = Promise.all(pageReady).then((ok) => ok.every(Boolean));
        return {
          kind: 'sheet' as const,
          hero,
          man,
          pages,
          pageReady,
          complete,
          ...(kind === 'units' ? { unit: true } : {}),
        };
      } catch {
        return null;
      }
    })();
    loads.set(key, p);
    const mine = p;
    void p.then((a) => {
      if (!a && loads.get(key) === mine) loads.delete(key);
    });
    while (loads.size > KEEP[kind]) loads.delete(loads.keys().next().value!);
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
    this.bodyW = (a.man.fitWidth ?? rest[3]) / scale;
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
    // (the second attack: the Drunkard's shotgun, the Spellblade's spell, DECISIONS #756)
    if ((variant === 'shotgun' || variant === 'spell') && c['attack2']) return 'attack2';
    return c['attack'] ? 'attack' : c['slash'] ? 'slash' : 'idle';
  }

  /** the part of a clip left out at its start (a Riftwalker's strike: its slow wind-up) */
  private startOf(clip: Clip, sheet: string): number {
    if (clip !== 'strike' || this.a.unit) return 0;
    const c = this.a.man.clips[sheet];
    return c ? strikeStart(c) : 0;
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
    // (a creature's picture is cut tight around it, and the board sized it for its own shape: the model fills that same height, however
    // wide, or a long creature such as the Scrapyard Centipede came out at a third of its picture's size)
    if (this.a.unit) return this.bodyH;
    return Math.max(this.bodyH / BODY_SHARE, this.bodyW / MAX_WIDTH);
  }

  widthFor(height: number): number {
    return (height * this.bodyW) / this.fitH;
  }

  /** How far the resting pose reaches to the left and the right of the feet, in the same units as `height`, weapon and all: for a box
   * that must hold the whole figure (the Store's and the Collection's). */
  restSpan(height: number): { left: number; right: number } {
    const b = this.boxes.get('idle')!;
    const u = height / this.fitH;
    const left = -b.x0 * u;
    const right = (b.x0 + b.w) * u;
    return this.facing === 'right' ? { left, right } : { left: right, right: left };
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

  /** every frame of a manifest clip is on a page already fetched */
  private has(name: string): boolean {
    const c = this.a.man.clips[name];
    return !!c && c.frames.every((f) => !!this.a.pages[f[0]]);
  }

  momentIn(clip: Clip, variant?: string): number {
    if (clip === 'idle') return 0;
    const name = this.sheetFor(clip, variant);
    if (name === 'idle' || !this.has(name)) return 0;
    const c = this.a.man.clips[name];
    const ev = c?.events?.find((e) => e.name === MOMENT[clip]);
    return ev ? Math.max(0, ev.frame / c!.fps - this.startOf(clip, name)) : 0;
  }

  ready(clip: Clip = 'idle', variant?: string): boolean {
    const name = this.sheetFor(clip, variant);
    // (a clip the model does not have at all, as a creature's power-up, is never ready: the board does without it)
    return (clip === 'idle' || name !== 'idle') && this.has(name);
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
    const sheet = this.sheetFor(clip, opts.variant);
    if (clip !== 'idle' && (sheet === 'idle' || !this.has(sheet))) {
      // (its pages are still coming: the model stays at rest and the board keeps its own timing. A death cannot be skipped, or the
      // fallen would stand: it plays as soon as its pages are in)
      this.clipName = 'idle';
      this.sheetClip = 'idle';
      this.onEvent = undefined;
      if (clip === 'death' && sheet !== 'idle')
        void Promise.all(
          [...new Set(this.a.man.clips[sheet]!.frames.map((f) => f[0]))].map(
            (p) => this.a.pageReady[p] ?? Promise.resolve(false),
          ),
        ).then(() => {
          if (!this.disposed && this.has(sheet) && this.clipName === 'idle')
            this.play('death', opts);
        });
      else opts.onEnd?.();
      return;
    }
    this.clipName = clip;
    this.sheetClip = sheet;
    this.t = this.startOf(clip, sheet);
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
