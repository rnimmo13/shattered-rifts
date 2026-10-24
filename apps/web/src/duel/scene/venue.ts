// Venues: where a fight takes place. 'rift' is the original floating arena (procedural); 'cave' is a hand-drawn
// cavern built from the CaveEnviro pack (public/art/venues/cave, cut by tools/pack-cave.ps1). A venue only swaps the
// backdrop, floor and scenery: the board geometry, fighters and effects are the same everywhere.
import { Container, Sprite, Texture } from 'pixi.js';
import { camera, floorTop } from './layout';
import { FULL_W, PAD_X, PAD_Y, makeCanvas } from './textures';
import { lerp, smoothstep } from './noise';
import { stage } from '../../design/tokens';
import { paintScene } from '../../art/scenes';
import { rng } from './noise';

export type VenueId = 'rift' | 'cave' | 'castle' | 'factory' | 'forest' | 'glass' | 'swamp' | 'alley';

/** Painted-skyline venues: each reuses a Riftwalker's card-art scene (art/scenes.ts) as a far backdrop. */
const SCENE_VENUES = {
  castle: { scene: 'maren', skyTop: '#141c3c', skyLow: '#c9906a', dark: '#241f33', glow: '#ffd27a', floorTint: 0xe0b878 },
  factory: { scene: 'rivet', skyTop: '#0a1626', skyLow: '#4f9ab8', dark: '#16222e', glow: '#5fd6ff', floorTint: 0x8cc8e0 },
  forest: { scene: 'kesh', skyTop: '#07161a', skyLow: '#4f9a78', dark: '#0d1f18', glow: '#8ff09a', floorTint: 0x98d09a },
  glass: { scene: 'astra', skyTop: '#12081f', skyLow: '#c0503e', dark: '#220d2c', glow: '#ff9a4a', floorTint: 0xe89878 },
  swamp: { scene: 'mire', skyTop: '#0a1612', skyLow: '#7fa05a', dark: '#101a15', glow: '#9fe070', floorTint: 0x98c878 },
  alley: { scene: 'kp', skyTop: '#0d0d16', skyLow: '#8a6a5a', dark: '#16161e', glow: '#ffb35c', floorTint: 0xd0a888 },
} as const;

/** Which venue a realm's fights use. Realms not listed fight in the Rift arena. */
export function venueForRealm(realm: string | undefined): VenueId {
  switch (realm) {
    case 'aurelion':
      return 'castle';
    case 'nexus':
      return 'factory';
    case 'wyldmaw':
      return 'forest';
    case 'umbral':
      return 'cave';
    case 'starfall':
      return 'glass';
    case 'gloomfen':
      return 'swamp';
    case 'midden':
      return 'alley';
    default:
      return 'rift';
  }
}

const CAVE_FILES = [
  'rock',
  'pillar1',
  'pillar2',
  'pillar3',
  'stal1',
  'stal2',
  'stal3',
  'mushBig',
  'mushMid',
  'mushCluster',
  'mushSmall',
  'mushTall',
] as const;
type CaveFile = (typeof CAVE_FILES)[number];

const MOSS_FILES = ['hang1', 'hang2', 'hangMoss', 'leaf', 'plantA', 'plantB', 'flower'] as const;
type MossFile = (typeof MOSS_FILES)[number];
/** Hanging fronds and floor plants (Mossy Cavern by Maaot), shared by the cave and the swamp. */
export type MossArt = Record<MossFile, HTMLImageElement>;

export interface CaveArt {
  id: 'cave';
  img: Record<CaveFile, HTMLImageElement>;
  moss: MossArt | null;
}

export interface SceneArt {
  id: 'scene';
  scene: string;
  skyTop: string;
  skyLow: string;
  dark: string;
  glow: string;
  floorTint: number;
  moss: MossArt | null;
}

export type VenueArt = CaveArt | SceneArt;

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Load a venue's images; null (so the Rift arena is used) if the venue is 'rift' or any file is missing. */
async function loadMoss(): Promise<MossArt | null> {
  const base = `${import.meta.env.BASE_URL}art/venues/moss/`;
  const loaded = await Promise.all(MOSS_FILES.map((f) => loadImage(`${base}${f}.png`)));
  if (loaded.some((i) => i === null)) return null;
  const img = {} as MossArt;
  MOSS_FILES.forEach((f, i) => (img[f] = loaded[i] as HTMLImageElement));
  return img;
}

export async function loadVenueArt(id: VenueId): Promise<VenueArt | null> {
  if (id === 'rift') return null;
  if (id !== 'cave') {
    const look = SCENE_VENUES[id];
    return { id: 'scene', ...look, moss: look.scene === 'mire' ? await loadMoss() : null };
  }
  const base = `${import.meta.env.BASE_URL}art/venues/cave/`;
  const loaded = await Promise.all(CAVE_FILES.map((f) => loadImage(`${base}${f}.png`)));
  if (loaded.some((i) => i === null)) return null;
  const img = {} as Record<CaveFile, HTMLImageElement>;
  CAVE_FILES.forEach((f, i) => (img[f] = loaded[i] as HTMLImageElement));
  return { id: 'cave', img, moss: await loadMoss() };
}

/** The back wall: the rock tile across the whole backdrop, graded dark violet toward the ceiling. */
export function caveWall(art: CaveArt): HTMLCanvasElement {
  const W = FULL_W;
  const H = floorTop + PAD_Y + 40;
  const c = makeCanvas(W, H);
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  const tile = 420;
  for (let y = 0; y < H; y += tile)
    for (let x = 0; x < W; x += tile) g.drawImage(art.img.rock, x, y, tile, tile);
  g.globalCompositeOperation = 'multiply';
  const grade = g.createLinearGradient(0, 0, 0, H);
  grade.addColorStop(0, '#0d0a1e');
  grade.addColorStop(0.55, '#2c2458');
  grade.addColorStop(1, '#4a3d8c');
  g.fillStyle = grade;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';
  const cx = PAD_X + stage.width / 2;
  const pool = g.createRadialGradient(cx, H - 60, 40, cx, H - 60, 1100);
  pool.addColorStop(0, 'rgba(140,110,255,0.28)');
  pool.addColorStop(1, 'rgba(140,110,255,0)');
  g.fillStyle = pool;
  g.fillRect(0, 0, W, H);
  return c;
}

/** Columns standing far back; the scene shifts this container with the pointer. Local y = the base line. */
export function caveColumns(art: CaveArt, baseY: number): Container {
  const root = new Container();
  const cols: [CaveFile, number, number, number][] = [
    ['pillar1', 90, 0.78, 0x5b5090],
    ['pillar3', 470, 0.62, 0x4a4180],
    ['pillar2', 1040, 0.55, 0x453d78],
    ['pillar1', 1560, 0.7, 0x5b5090],
    ['pillar3', 1990, 0.8, 0x6a5ea0],
    ['pillar2', 2400, 0.6, 0x4a4180],
  ];
  for (const [name, x, s, tint] of cols) {
    const sp = new Sprite(Texture.from(art.img[name]));
    sp.anchor.set(0.5, 1);
    sp.scale.set(s);
    sp.tint = tint;
    sp.position.set(PAD_X + x * 0.8, baseY);
    root.addChild(sp);
  }
  return root;
}

/** Glowing mushrooms and stalagmites along the far edge of the arena, drawn between the floor and the fighters. */
export function caveProps(art: CaveArt, glow: Texture): Container {
  const root = new Container();
  const spots: [CaveFile, number, number, number][] = [
    ['mushBig', 70, 405, 0.42],
    ['mushCluster', 400, 425, 0.5],
    ['stal1', 590, 398, 0.45],
    ['mushSmall', 1210, 410, 0.4],
    ['stal3', 1390, 392, 0.4],
    ['mushMid', 1560, 422, 0.5],
    ['mushTall', 1730, 405, 0.55],
    ['mushCluster', 1850, 430, 0.5],
  ];
  for (const [name, x, y, s] of spots) {
    const sp = new Sprite(Texture.from(art.img[name]));
    sp.anchor.set(0.5, 1);
    sp.scale.set(s);
    if (name.startsWith('stal')) sp.tint = 0x7a72b8; // pull the grey rock into the cave's violet
    sp.position.set(x, y);
    if (name.startsWith('mush')) {
      const halo = new Sprite(glow);
      halo.anchor.set(0.5);
      halo.tint = 0x8a5cff;
      halo.blendMode = 'add';
      halo.alpha = 0.5;
      halo.scale.set((sp.width / 128) * 2.2, (sp.height / 128) * 1.6);
      halo.position.set(x, y - sp.height * 0.5);
      root.addChild(halo);
    }
    root.addChild(sp);
  }
  return root;
}

/** The cave floor, in the same layout as the Rift arena's (half resolution; the caller sizes it like floorTextures). */
export function caveFloor(art: CaveArt, W: number, H: number, half: number): HTMLCanvasElement {
  // mip chain of the rock tile as raw pixels
  const mips: ImageData[] = [];
  for (let s = 256; s >= 16; s = s >> 1) {
    const c = makeCanvas(s, s);
    const g = c.getContext('2d') as CanvasRenderingContext2D;
    g.drawImage(art.img.rock, 0, 0, s, s);
    mips.push(g.getImageData(0, 0, s, s));
  }
  const out = makeCanvas(W, H);
  const og = out.getContext('2d') as CanvasRenderingContext2D;
  const img = og.createImageData(W, H);
  const px = img.data;
  const TILE = 3; // world units per rock tile
  const EDGE = 9.4;
  const rift = camera.A / (640 - camera.vpY);
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
      let r = (mip.data[si] as number) * 0.62 * light;
      let g = (mip.data[si + 1] as number) * 0.58 * light;
      let b = (mip.data[si + 2] as number) * 0.95 * light;
      r += 140 * riftBand * 0.26;
      g += 100 * riftBand * 0.26;
      b += 255 * riftBand * 0.36;
      r = lerp(r, 40, far * 0.7);
      g = lerp(g, 34, far * 0.7);
      b = lerp(b, 110, far * 0.7);
      const edgeX = EDGE - Math.abs(X);
      const alpha = smoothstep(0, 0.9, edgeX) * smoothstep(floorTop, floorTop + 70, y);
      const i = (py * W + pxl) * 4;
      px[i] = Math.max(0, Math.min(255, r));
      px[i + 1] = Math.max(0, Math.min(255, g));
      px[i + 2] = Math.max(0, Math.min(255, b));
      px[i + 3] = Math.max(0, Math.min(255, alpha * 255));
    }
  }
  og.putImageData(img, 0, 0);
  return out;
}

/** A painted skyline backdrop: sky gradient, then the Riftwalker's card-art scene scaled up, then a haze at the horizon. */
export function sceneWall(art: SceneArt): HTMLCanvasElement {
  const W = FULL_W;
  const H = floorTop + PAD_Y + 40;
  const c = makeCanvas(W, H);
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, art.skyTop);
  sky.addColorStop(0.55, art.skyTop);
  sky.addColorStop(0.93, art.skyLow);
  sky.addColorStop(1, art.skyLow);
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  // the scene is painted for a small card window, so paint it small and scale it up into a distant skyline
  const k = 2;
  const small = makeCanvas(Math.ceil(W / k), Math.ceil(H / k));
  const sg = small.getContext('2d') as CanvasRenderingContext2D;
  paintScene(sg, small.width, small.height, art.scene, { dark: art.dark, glow: art.glow }, rng(4242));
  g.imageSmoothingEnabled = true;
  // the scenes put their near ground line at 80% of the height: sit that line on the horizon (where the floor starts)
  const dy = floorTop + PAD_Y + 10 - 0.8 * small.height * k;
  g.drawImage(small, 0, dy, small.width * k, small.height * k);
  g.fillStyle = art.dark;
  g.fillRect(0, dy + small.height * k - 1, W, H);
  const haze = g.createLinearGradient(0, H * 0.6, 0, H);
  haze.addColorStop(0, 'rgba(0,0,0,0)');
  haze.addColorStop(1, art.skyLow + 'aa');
  g.fillStyle = haze;
  g.fillRect(0, H * 0.6, W, H * 0.4);
  return c;
}

/** Hanging fronds and floor plants that sway a little; they stand between the floor and the fighters. */
export class Foliage {
  readonly container = new Container();
  private readonly items: { sp: Sprite; base: number; amp: number; rate: number; phase: number }[] = [];

  constructor(moss: MossArt, tone: number) {
    const hang: [MossFile, number, number, number][] = [
      ['hang1', 140, 0.5, 1],
      ['hangMoss', 470, 0.45, -1],
      ['hang2', 800, 0.5, 1],
      ['hang1', 1130, 0.42, -1],
      ['hangMoss', 1460, 0.5, 1],
      ['hang2', 1780, 0.46, -1],
    ];
    hang.forEach(([name, x, s, flip], i) => {
      const sp = new Sprite(Texture.from(moss[name]));
      sp.anchor.set(0.5, 0);
      sp.scale.set(s * flip, s);
      sp.tint = tone;
      sp.position.set(x, 110);
      this.container.addChild(sp);
      this.items.push({ sp, base: 0, amp: 0.035, rate: 0.55 + (i % 3) * 0.12, phase: i * 1.7 });
    });
    const floor: [MossFile, number, number, number][] = [
      ['plantA', 330, 438, 0.55],
      ['flower', 700, 428, 0.5],
      ['plantB', 1010, 440, 0.5],
      ['plantA', 1320, 430, 0.5],
      ['flower', 1500, 442, 0.55],
      ['plantB', 1790, 436, 0.55],
    ];
    floor.forEach(([name, x, y, s], i) => {
      const sp = new Sprite(Texture.from(moss[name]));
      sp.anchor.set(0.5, 1);
      sp.scale.set(s);
      sp.tint = tone;
      sp.position.set(x, y);
      this.container.addChild(sp);
      this.items.push({ sp, base: 0, amp: 0.05, rate: 0.8 + (i % 3) * 0.15, phase: i * 2.3 });
    });
  }

  update(t: number, still: boolean): void {
    if (still) return;
    for (const i of this.items) i.sp.rotation = i.base + Math.sin(t * i.rate + i.phase) * i.amp;
  }
}

export function foliageFor(art: VenueArt): Foliage | null {
  if (art.id === 'cave') return art.moss ? new Foliage(art.moss, 0x9fb8c8) : null;
  return art.scene === 'mire' && art.moss ? new Foliage(art.moss, 0xc8dca0) : null;
}
