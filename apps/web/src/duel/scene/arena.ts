// Arena art packs: AI-painted layers per venue, cut by tools/pack-arenas.ps1 into public/art/arenas/<venue>/
//   backdrop.jpg   the back wall, already the size of the scene's sky (FULL_W x floorTop + PAD_Y + 40), horizon at the floor's far edge
//   floor.png      a seamless surface tile; the engine tiles it in perspective and lights it (so the floor stays live)
//   props/p0..p8   scenery cut-outs, placed by ARENA_LOOK below
// Any piece may be missing: the scene falls back to its procedural / painted-skyline layers for that part.
import { Container, Sprite, Texture } from 'pixi.js';
import { camera, floorTop } from './layout';
import { PAD_X, makeCanvas } from './textures';
import { lerp, rng, smoothstep } from './noise';
import type { VenueId } from './venue';

export interface ArenaPack {
  backdrop: HTMLImageElement | null;
  floor: HTMLImageElement | null;
  props: (HTMLImageElement | null)[];
}

interface GroundProp {
  /** prop sheet index (p0..p8) */
  i: number;
  /** a glowing prop gets an additive halo of this colour, centred this far down the sprite (0 = top, 1 = base) */
  glow?: { color: number; at: number };
}

/** How an arena scatters its scenery: each realm has its own, so no two arenas set their props out alike. */
export type Pattern = 'flanks' | 'left' | 'right' | 'scatter' | 'gap';

interface ArenaLook {
  /** where the scenery clusters (see Pattern) */
  pattern: Pattern;
  /** tall silhouettes standing at the horizon (they move with the pointer) */
  far: number[];
  /** props along the back edge of the floor */
  ground: GroundProp[];
  /** items hanging from the top of the screen (they sway) */
  hang: number[];
  /** how the live lighting tints the floor tile, and the colour of the light band along the Rift line */
  tone: [number, number, number];
  rift: [number, number, number];
  /** world units covered by one floor tile */
  tile: number;
}

const FIRE = 0xffa040;
const TEAL = 0x40ffe0;
const CYAN = 0x50d8ff;
const AMBER = 0xffc060;

export const ARENA_LOOK: Record<VenueId, ArenaLook> = {
  castle: {
    pattern: 'flanks',
    far: [0, 1, 2],
    ground: [
      { i: 3, glow: { color: FIRE, at: 0.3 } },
      { i: 4 },
      { i: 5 },
      { i: 6, glow: { color: FIRE, at: 0.2 } },
      { i: 8 },
    ],
    hang: [7],
    tone: [0.8, 0.76, 0.72],
    rift: [255, 210, 120],
    tile: 5,
  },
  factory: {
    pattern: 'right',
    far: [0, 1, 2],
    ground: [
      { i: 3, glow: { color: CYAN, at: 0.35 } },
      { i: 4 },
      { i: 5, glow: { color: CYAN, at: 0.5 } },
      { i: 6 },
      { i: 8 },
    ],
    hang: [7],
    tone: [0.84, 0.88, 0.92],
    rift: [90, 210, 255],
    tile: 4,
  },
  forest: {
    pattern: 'scatter',
    far: [0, 1, 2],
    ground: [{ i: 3 }, { i: 4 }, { i: 5 }, { i: 7 }, { i: 8 }],
    hang: [],
    tone: [0.78, 0.72, 0.66],
    rift: [255, 110, 90],
    tile: 5,
  },
  cave: {
    pattern: 'left',
    far: [0, 1, 2],
    ground: [
      { i: 3, glow: { color: TEAL, at: 0.3 } },
      { i: 4, glow: { color: TEAL, at: 0.8 } },
      { i: 5, glow: { color: TEAL, at: 0.8 } },
      { i: 6, glow: { color: TEAL, at: 0.2 } },
      { i: 8, glow: { color: TEAL, at: 0.5 } },
    ],
    hang: [7],
    tone: [0.8, 0.86, 0.98],
    rift: [90, 230, 220],
    tile: 5,
  },
  glass: {
    pattern: 'scatter',
    far: [],
    ground: [],
    hang: [],
    tone: [0.92, 0.82, 0.86],
    rift: [255, 150, 70],
    tile: 4,
  },
  swamp: {
    pattern: 'gap',
    far: [0, 1, 2],
    ground: [
      { i: 3, glow: { color: AMBER, at: 0.5 } },
      { i: 4, glow: { color: AMBER, at: 0.5 } },
      { i: 6, glow: { color: AMBER, at: 0.5 } },
      { i: 7 },
      { i: 5, glow: { color: AMBER, at: 0.4 } },
    ],
    hang: [],
    tone: [0.78, 0.84, 0.74],
    rift: [150, 255, 140],
    tile: 4,
  },
  alley: {
    pattern: 'right',
    far: [],
    ground: [],
    hang: [],
    tone: [0.84, 0.82, 0.86],
    rift: [255, 190, 100],
    tile: 4,
  },
  rift: {
    pattern: 'scatter',
    far: [],
    ground: [],
    hang: [],
    tone: [0.9, 0.86, 1],
    rift: [140, 100, 255],
    tile: 4,
  },
};

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Load a venue's arena art; null if the venue has none at all. */
export async function loadArena(id: VenueId): Promise<ArenaPack | null> {
  const base = `${import.meta.env.BASE_URL}art/arenas/${id}/`;
  const [backdrop, floor, ...props] = await Promise.all([
    loadImage(`${base}backdrop.jpg`),
    loadImage(`${base}floor.png`),
    ...Array.from({ length: 9 }, (_, i) => loadImage(`${base}props/p${i}.png`)),
  ]);
  if (!backdrop && !floor && props.every((p) => p === null)) return null;
  return { backdrop, floor, props };
}

/**
 * A floor from a tiled picture, in the same layout as the Rift arena's (half resolution; the caller sizes it like
 * floorTextures). The tile is laid on the floor plane and run through the live light: a bright pool in the middle,
 * a band of coloured light along the Rift line, haze toward the far edge.
 */
export function tiledFloor(
  img: HTMLImageElement | HTMLCanvasElement,
  W: number,
  H: number,
  half: number,
  look: { tone: [number, number, number]; rift: [number, number, number]; tile: number },
): HTMLCanvasElement {
  // mip chain of the tile as raw pixels
  const mips: ImageData[] = [];
  for (let s = 256; s >= 16; s = s >> 1) {
    const c = makeCanvas(s, s);
    const g = c.getContext('2d') as CanvasRenderingContext2D;
    g.drawImage(img, 0, 0, s, s);
    mips.push(g.getImageData(0, 0, s, s));
  }
  const out = makeCanvas(W, H);
  const og = out.getContext('2d') as CanvasRenderingContext2D;
  const data = og.createImageData(W, H);
  const px = data.data;
  const TILE = look.tile; // world units per tile
  const EDGE = 9.4;
  const rift = camera.A / (640 - camera.vpY);
  const [tr, tg, tb] = look.tone;
  const [rr, rg, rb] = look.rift;
  for (let py = 0; py < H; py++) {
    const y = floorTop + py * half;
    const Z = camera.A / (y - camera.vpY);
    const pxPerUnit = camera.f / Z / half;
    const footprint = 256 / TILE / pxPerUnit; // source texels covered by one output pixel
    const lod = Math.max(0, Math.log2(Math.max(1, footprint)));
    const mip = mips[Math.min(mips.length - 1, Math.round(lod))] as ImageData;
    const ms = mip.width;
    const far = 1 - smoothstep(floorTop, floorTop + 200, y);
    const riftBand = Math.exp(-(((Z - rift) / 0.5) ** 2));
    const vZ = (Z / TILE) % 1;
    const sy = Math.min(ms - 1, Math.floor(vZ * ms));
    for (let pxl = 0; pxl < W; pxl++) {
      const x = pxl * half - PAD_X;
      const X = ((x - camera.cx) * Z) / camera.f;
      const u = (((X / TILE) % 1) + 1) % 1;
      const si = (sy * ms + Math.min(ms - 1, Math.floor(u * ms))) * 4;
      const lx = (x - camera.cx) / 1250;
      const light = 0.42 + 0.8 * Math.exp(-lx * lx) * (0.72 + 0.28 * riftBand);
      let r = (mip.data[si] as number) * tr * light;
      let g = (mip.data[si + 1] as number) * tg * light;
      let b = (mip.data[si + 2] as number) * tb * light;
      r += rr * riftBand * 0.2;
      g += rg * riftBand * 0.2;
      b += rb * riftBand * 0.2;
      // the far edge fades toward the backdrop's ground colour
      r = lerp(r, 40, far * 0.7);
      g = lerp(g, 36, far * 0.7);
      b = lerp(b, 60, far * 0.7);
      const edgeX = EDGE - Math.abs(X);
      const alpha = smoothstep(0, 0.9, edgeX) * smoothstep(floorTop, floorTop + 70, y);
      const i = (py * W + pxl) * 4;
      px[i] = Math.max(0, Math.min(255, r));
      px[i + 1] = Math.max(0, Math.min(255, g));
      px[i + 2] = Math.max(0, Math.min(255, b));
      px[i + 3] = Math.max(0, Math.min(255, alpha * 255));
    }
  }
  og.putImageData(data, 0, 0);
  return out;
}

/** Scale a sprite to a height (keeping its shape) and stand it on a base point. */
function stand(sp: Sprite, h: number): void {
  sp.anchor.set(0.5, 1);
  sp.scale.set(h / sp.texture.height);
}

/** Half the width of the lit floor at stage row y: scenery must stand inside this, or it hangs over the board's edge. */
function floorHalf(y: number): number {
  return (8.6 * camera.f * (y - camera.vpY)) / camera.A;
}

/** How likely a spot across the floor (0 = far left edge, 1 = far right edge) is for a pattern. */
const WEIGHT: Record<Pattern, (u: number) => number> = {
  flanks: (u) => Math.abs(u - 0.5) * 2 + 0.12,
  left: (u) => (1 - u) ** 2 + 0.08,
  right: (u) => u ** 2 + 0.08,
  scatter: () => 1,
  gap: (u) => (Math.abs(u - 0.5) > 0.2 ? 1 : 0.06),
};

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

interface Spot {
  x: number;
  y: number;
  w: number;
  /** index of the thing placed here, in the order asked for */
  k: number;
}

/**
 * Find places for things of the given widths: spread by the pattern, inside the floor's edge at their depth, and never
 * piled on one another. `ys` is the band of rows they may stand on. Fewer come back if the floor is full.
 */
function place(
  r: () => number,
  pattern: Pattern,
  widths: number[],
  ys: [number, number],
  gap: number,
): Spot[] {
  const out: Spot[] = [];
  widths.forEach((w, k) => {
    for (let tries = 0; tries < 40; tries++) {
      const y = lerp(ys[0], ys[1], r());
      let u = r();
      while (r() > WEIGHT[pattern](u)) u = r();
      const room = floorHalf(y) - w * 0.5;
      if (room <= 0) continue;
      const x = camera.cx + (u * 2 - 1) * room;
      if (out.some((o) => Math.abs(o.x - x) < (o.w + w) * gap && Math.abs(o.y - y) < 26)) continue;
      out.push({ x, y, w, k });
      break;
    }
  });
  return out;
}

/** The scenery of an arena: far silhouettes, glowing props along the back edge, and hanging items that sway. */
export class ArenaProps {
  /** far silhouettes; move with the pointer (local y = 360, local x = PAD_X + stage x) */
  readonly far = new Container();
  /** props along the back edge of the floor (stage coordinates), drawn between the floor and the fighters */
  readonly ground = new Container();
  /** hanging items (stage coordinates) */
  readonly hang = new Container();
  private readonly halos: { s: Sprite; base: number; rate: number; phase: number }[] = [];
  private readonly swayers: { s: Sprite; amp: number; rate: number; phase: number }[] = [];

  constructor(pack: ArenaPack, look: ArenaLook, glow: Texture, seed: string) {
    const r = rng(hashSeed(seed));
    const tex = (i: number): Texture | null => {
      const img = pack.props[i];
      return img ? Texture.from(img) : null;
    };
    const aspect = (t: Texture): number => t.width / t.height;
    const cycle = <T>(list: T[], n: number): T[] => {
      const start = Math.floor(r() * list.length);
      return Array.from({ length: n }, (_, k) => list[(start + k) % list.length] as T);
    };

    // far silhouettes: a few tall shapes at the horizon, never past the floor's far edge
    const farTex = look.far.map(tex).filter((t): t is Texture => t !== null);
    if (farTex.length > 0) {
      const picks = cycle(farTex, 3 + (r() < 0.5 ? 1 : 0) + (r() < 0.3 ? 1 : 0));
      const heights = picks.map(() => 260 + r() * 90);
      const widths = picks.map((t, k) => aspect(t) * (heights[k] as number));
      for (const spot of place(r, look.pattern, widths, [342, 342], 0.42)) {
        const sp = new Sprite(picks[spot.k] as Texture);
        stand(sp, heights[spot.k] as number);
        if (r() < 0.5) sp.scale.x *= -1;
        sp.tint = 0xb4b8c8;
        sp.alpha = 0.92;
        sp.position.set(PAD_X + spot.x, 360);
        this.far.addChild(sp);
      }
    }

    // props along the back edge, nearer ones a little bigger
    const groundTex = look.ground
      .map((g) => ({ g, t: tex(g.i) }))
      .filter((e): e is { g: GroundProp; t: Texture } => e.t !== null);
    if (groundTex.length > 0) {
      const picks = cycle(groundTex, 4 + (r() < 0.5 ? 1 : 0) + (r() < 0.4 ? 1 : 0));
      const base = picks.map(() => 125 + r() * 65);
      const widths = picks.map((e, k) => aspect(e.t) * (base[k] as number));
      const spots = place(r, look.pattern, widths, [398, 446], 0.4).sort((p, q) => p.y - q.y);
      for (const spot of spots) {
        const e = picks[spot.k] as { g: GroundProp; t: Texture };
        const depth = (spot.y - camera.vpY) / (440 - camera.vpY);
        const sp = new Sprite(e.t);
        stand(sp, (base[spot.k] as number) * depth);
        if (r() < 0.4) sp.scale.x *= -1;
        sp.position.set(spot.x, spot.y);
        if (e.g.glow) {
          const halo = new Sprite(glow);
          halo.anchor.set(0.5);
          halo.tint = e.g.glow.color;
          halo.blendMode = 'add';
          halo.alpha = 0.5;
          halo.scale.set((sp.width / 128) * 1.9, (sp.height / 128) * 1.3);
          halo.position.set(spot.x, spot.y - sp.height * (1 - e.g.glow.at));
          this.ground.addChild(halo);
          this.halos.push({ s: halo, base: 0.5, rate: 1.6 + r() * 1.6, phase: r() * 6 });
        }
        this.ground.addChild(sp);
      }
    }

    // hanging items, kept clear of the backdrop's own banners at the edges
    const hangTex = look.hang.map(tex).filter((t): t is Texture => t !== null);
    if (hangTex.length > 0) {
      const n = 1 + (r() < 0.6 ? 1 : 0);
      const pattern = look.pattern === 'flanks' ? 'scatter' : look.pattern;
      for (const spot of place(
        r,
        pattern,
        Array.from({ length: n }, () => 380),
        [400, 400],
        0.7,
      )) {
        const t = hangTex[spot.k % hangTex.length] as Texture;
        const sp = new Sprite(t);
        sp.anchor.set(0.5, 0);
        sp.scale.set((250 + r() * 50) / t.height);
        sp.position.set(Math.max(380, Math.min(1540, spot.x)), 100);
        this.hang.addChild(sp);
        this.swayers.push({ s: sp, amp: 0.03, rate: 0.5 + r() * 0.3, phase: r() * 6 });
      }
    }
  }

  update(t: number, still: boolean): void {
    if (still) return;
    for (const h of this.halos) h.s.alpha = h.base * (0.82 + 0.18 * Math.sin(t * h.rate + h.phase));
    for (const w of this.swayers) w.s.rotation = Math.sin(t * w.rate + w.phase) * w.amp;
  }
}
