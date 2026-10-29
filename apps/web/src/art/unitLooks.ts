// Every companion and enemy gets its own look. The procedural painters make one silhouette per kind of creature (a drone, a beast, a
// knight), so units that share one used to be the same model with different names. A Look changes the silhouette's colour, build and
// outline and adds the things that tell units apart at a glance: a crown, horns or a halo on the head, wings or a cape behind,
// a blade or a shield in hand, a glowing aura, and an emblem on the chest. Painted over the figure by where the figure actually is.

import { paintEmblem } from './emblems';
import { MULTIVERSE_UNIT_ART } from './multiverseUnits';

type G = CanvasRenderingContext2D;

export type Accessory =
  | 'crown'
  | 'horns'
  | 'halo'
  | 'antenna'
  | 'spikes'
  | 'wings'
  | 'cape'
  | 'blade'
  | 'shield'
  | 'eyes'
  | 'hood'
  | 'tail';

export interface Look {
  /** hue rotation in degrees and saturation/brightness multipliers */
  hue?: number;
  sat?: number;
  light?: number;
  /** build: width and height stretch (1 = as painted) */
  w?: number;
  h?: number;
  flip?: boolean;
  accessories?: Accessory[];
  /** an emblem painted on the chest (names from art/emblems.ts) */
  badge?: string;
  /** a glow around the figure */
  aura?: string;
  /** colour for the accessories and badge */
  trim?: string;
}

interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  headX: number;
  headW: number;
}

function boxOf(c: HTMLCanvasElement): Box {
  const g = c.getContext('2d') as G;
  const { width: W, height: H } = c;
  const d = g.getImageData(0, 0, W, H).data;
  let x0 = W;
  let x1 = 0;
  let y0 = H;
  let y1 = 0;
  for (let y = 0; y < H; y += 2)
    for (let x = 0; x < W; x += 2)
      if ((d[(y * W + x) * 4 + 3] ?? 0) > 40) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 <= x0) return { x0: 60, x1: W - 60, y0: 40, y1: H - 10, headX: W / 2, headW: 90 };
  // the head: the opaque pixels of the top tenth of the figure
  const band = y0 + Math.max(16, (y1 - y0) * 0.1);
  let sx = 0;
  let n = 0;
  let hx0 = W;
  let hx1 = 0;
  for (let y = y0; y < band; y += 2)
    for (let x = 0; x < W; x += 2)
      if ((d[(y * W + x) * 4 + 3] ?? 0) > 40) {
        sx += x;
        n++;
        if (x < hx0) hx0 = x;
        if (x > hx1) hx1 = x;
      }
  return { x0, x1, y0, y1, headX: n ? sx / n : (x0 + x1) / 2, headW: Math.max(50, hx1 - hx0) };
}

function poly(g: G, color: string, pts: [number, number][]): void {
  g.fillStyle = color;
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
}

/** Accessories drawn BEHIND the figure (wings, cape, tail, aura). */
function behind(g: G, b: Box, acc: Accessory[], trim: string, aura?: string): void {
  g.save();
  g.globalCompositeOperation = 'destination-over';
  const cx = (b.x0 + b.x1) / 2;
  const hgt = b.y1 - b.y0;
  if (acc.includes('wings')) {
    const y = b.y0 + hgt * 0.32;
    poly(g, 'rgba(0,0,0,0.35)', [
      [cx - 10, y + 40],
      [b.x0 - 90, y - 70],
      [b.x0 - 50, y + 60],
      [b.x0 - 80, y + 120],
      [cx - 10, y + 120],
    ]);
    poly(g, 'rgba(0,0,0,0.35)', [
      [cx + 10, y + 40],
      [b.x1 + 90, y - 70],
      [b.x1 + 50, y + 60],
      [b.x1 + 80, y + 120],
      [cx + 10, y + 120],
    ]);
    g.fillStyle = trim;
    g.globalAlpha = 0.5;
    poly(g, trim, [
      [cx - 14, y + 46],
      [b.x0 - 70, y - 54],
      [b.x0 - 36, y + 56],
      [cx - 14, y + 100],
    ]);
    poly(g, trim, [
      [cx + 14, y + 46],
      [b.x1 + 70, y - 54],
      [b.x1 + 36, y + 56],
      [cx + 14, y + 100],
    ]);
    g.globalAlpha = 1;
  }
  if (acc.includes('cape')) {
    // a flowing cloak behind the shoulders, not a box: narrow at the neck, wide at the hem
    const y = b.y0 + hgt * 0.2;
    g.globalAlpha = 0.92;
    poly(g, trim, [
      [cx - (b.x1 - b.x0) * 0.28, y],
      [cx + (b.x1 - b.x0) * 0.28, y],
      [b.x1 + 22, b.y1 - 4],
      [b.x0 - 22, b.y1 - 4],
    ]);
    poly(g, 'rgba(0,0,0,0.4)', [
      [cx - (b.x1 - b.x0) * 0.28, y],
      [cx + (b.x1 - b.x0) * 0.28, y],
      [b.x1 + 22, b.y1 - 4],
      [b.x0 - 22, b.y1 - 4],
    ]);
    g.globalAlpha = 1;
  }
  if (acc.includes('tail')) {
    g.strokeStyle = trim;
    g.lineWidth = 16;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(b.x1 - 20, b.y1 - hgt * 0.25);
    g.quadraticCurveTo(b.x1 + 70, b.y1 - hgt * 0.1, b.x1 + 40, b.y1 - hgt * 0.5);
    g.stroke();
  }
  if (aura) {
    const gr = g.createRadialGradient(
      cx,
      b.y0 + hgt * 0.55,
      10,
      cx,
      b.y0 + hgt * 0.55,
      Math.max(hgt, b.x1 - b.x0) * 0.75,
    );
    gr.addColorStop(0, aura);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalCompositeOperation = 'destination-over';
    g.fillStyle = gr;
    g.fillRect(0, 0, g.canvas.width, g.canvas.height);
  }
  g.restore();
}

/** Accessories drawn on TOP of the figure. */
function front(g: G, b: Box, acc: Accessory[], trim: string, badge?: string): void {
  const hgt = b.y1 - b.y0;
  const hx = b.headX;
  const hw = Math.min(b.headW, 110);
  const top = b.y0;
  for (const a of acc) {
    switch (a) {
      case 'crown':
        poly(g, '#e8c14a', [
          [hx - hw * 0.6, top + 22],
          [hx - hw * 0.62, top - 22],
          [hx - hw * 0.3, top],
          [hx, top - 34],
          [hx + hw * 0.3, top],
          [hx + hw * 0.62, top - 22],
          [hx + hw * 0.6, top + 22],
        ]);
        g.fillStyle = '#c0392b';
        g.beginPath();
        g.arc(hx, top + 4, hw * 0.08, 0, Math.PI * 2);
        g.fill();
        break;
      case 'horns':
        poly(g, '#e9e2cf', [
          [hx - hw * 0.45, top + 24],
          [hx - hw * 0.95, top - 50],
          [hx - hw * 0.2, top + 4],
        ]);
        poly(g, '#e9e2cf', [
          [hx + hw * 0.45, top + 24],
          [hx + hw * 0.95, top - 50],
          [hx + hw * 0.2, top + 4],
        ]);
        break;
      case 'halo':
        g.strokeStyle = '#ffe9a0';
        g.lineWidth = 9;
        g.shadowColor = '#ffe9a0';
        g.shadowBlur = 24;
        g.beginPath();
        g.ellipse(hx, top - 18, hw * 0.55, 15, 0, 0, Math.PI * 2);
        g.stroke();
        g.shadowBlur = 0;
        break;
      case 'antenna':
        g.strokeStyle = trim;
        g.lineWidth = 6;
        g.lineCap = 'round';
        for (const s of [-1, 1]) {
          g.beginPath();
          g.moveTo(hx + s * hw * 0.2, top + 8);
          g.lineTo(hx + s * hw * 0.6, top - 44);
          g.stroke();
          g.fillStyle = '#ffec9a';
          g.beginPath();
          g.arc(hx + s * hw * 0.6, top - 48, 9, 0, Math.PI * 2);
          g.fill();
        }
        break;
      case 'spikes':
        for (let i = -2; i <= 2; i++)
          poly(g, trim, [
            [hx + i * hw * 0.22 - 12, top + 14],
            [hx + i * hw * 0.22, top - 26 - (2 - Math.abs(i)) * 8],
            [hx + i * hw * 0.22 + 12, top + 14],
          ]);
        break;
      case 'blade':
        g.save();
        g.translate(b.x1 - 10, b.y0 + hgt * 0.6);
        g.rotate(0.5);
        poly(g, '#eef3ff', [
          [-7, 0],
          [7, 0],
          [9, -hgt * 0.42],
          [0, -hgt * 0.47],
          [-9, -hgt * 0.42],
        ]);
        g.fillStyle = trim;
        g.fillRect(-22, 0, 44, 10);
        g.fillStyle = '#6b4a2a';
        g.fillRect(-6, 10, 12, 38);
        g.restore();
        break;
      case 'shield':
        g.save();
        // held in front of the figure's left side, so the whole shield stays on the canvas even when the figure fills it
        g.translate(Math.max(b.x0 + 46, 50), b.y0 + hgt * 0.62);
        poly(g, '#14182e', [
          [-44, -52],
          [44, -52],
          [38, 30],
          [0, 66],
          [-38, 30],
        ]);
        poly(g, trim, [
          [-36, -44],
          [36, -44],
          [31, 26],
          [0, 56],
          [-31, 26],
        ]);
        poly(g, '#14182e', [
          [-26, -34],
          [26, -34],
          [22, 18],
          [0, 42],
          [-22, 18],
        ]);
        g.restore();
        break;
      case 'eyes':
        g.save();
        g.shadowColor = trim;
        g.shadowBlur = 18;
        g.fillStyle = trim;
        for (const s of [-1, 1]) {
          g.beginPath();
          g.ellipse(hx + s * hw * 0.2, top + hgt * 0.07, 9, 6, 0, 0, Math.PI * 2);
          g.fill();
        }
        g.restore();
        break;
      case 'hood':
        poly(g, trim, [
          [hx - hw * 0.7, top + 52],
          [hx - hw * 0.5, top - 10],
          [hx, top - 34],
          [hx + hw * 0.5, top - 10],
          [hx + hw * 0.7, top + 52],
          [hx, top + 30],
        ]);
        break;
      default:
        break;
    }
  }
  if (badge) {
    const cx = (b.x0 + b.x1) / 2;
    const size = Math.max(40, hgt * 0.2);
    const y = b.y0 + hgt * 0.5;
    g.save();
    g.globalAlpha = 0.85;
    paintEmblem(g, badge, cx + 2, y + 2, size, 'rgba(0,0,0,0.7)');
    g.globalAlpha = 1;
    paintEmblem(g, badge, cx, y, size, trim);
    g.restore();
  }
}

/** The figure with its Look applied, as a new canvas (the shared painter output is never touched). */
export function applyLook(src: HTMLCanvasElement, look: Look): HTMLCanvasElement {
  const W = src.width;
  const H = src.height;
  const work = document.createElement('canvas');
  work.width = W;
  work.height = H;
  const g = work.getContext('2d', { willReadFrequently: true }) as G;
  g.save();
  if (look.flip) {
    g.translate(W, 0);
    g.scale(-1, 1);
  }
  g.filter = `hue-rotate(${look.hue ?? 0}deg) saturate(${look.sat ?? 1}) brightness(${look.light ?? 1})`;
  g.drawImage(src, 0, 0);
  g.restore();
  g.filter = 'none';
  const box = boxOf(work);
  const trim = look.trim ?? '#f1d88f';
  const acc = look.accessories ?? [];
  front(g, box, acc, trim, look.badge);
  behind(g, box, acc, trim, look.aura);
  const w = look.w ?? 1;
  const h = look.h ?? 1;
  if (w === 1 && h === 1) return work;
  // build: stretch, keeping the feet on the bottom edge
  const out = document.createElement('canvas');
  out.width = Math.round(W * w);
  out.height = Math.round(H * h);
  (out.getContext('2d') as G).drawImage(work, 0, 0, out.width, out.height);
  return out;
}

const GOLD = '#f1d88f';
const STEEL = '#bfd6e6';
const BLOOD = '#e0506a';
const ACID = '#a8ff6a';
const VIOLET = '#c9a8ff';
const FIRE = '#ffa24a';
const CYAN = '#6fe6ff';

/** One Look per companion and enemy: no two units share one. "+" versions use the base unit's. */
export const LOOKS: Record<string, Look> = {
  // ---- companions: Nexus-9 machines
  drone: { badge: 'cog', trim: CYAN, aura: 'rgba(54,224,255,0.35)' },
  'patrol-drone': { hue: 40, accessories: ['antenna'], badge: 'shield', trim: GOLD, w: 0.9 },
  'micro-drone': {
    hue: -50,
    sat: 1.2,
    w: 0.72,
    h: 0.72,
    accessories: ['eyes'],
    badge: 'bolt',
    trim: '#ffec9a',
  },
  'salvage-bot': { hue: 170, w: 1.12, h: 0.95, badge: 'coin', trim: GOLD, accessories: ['spikes'] },
  'repair-bot': {
    hue: 100,
    sat: 1.1,
    accessories: ['halo'],
    badge: 'heart',
    trim: '#ff8aa0',
    flip: true,
  },
  'sentry-turret': {
    hue: 200,
    light: 0.9,
    accessories: ['eyes'],
    badge: 'eye',
    trim: BLOOD,
    w: 1.15,
    h: 0.9,
  },
  // (Heavy machines are drawn a size up, Colossal ones two: DECISIONS #383)
  enforcer: {
    hue: -30,
    accessories: ['shield', 'horns'],
    badge: 'fist',
    trim: STEEL,
    w: 1.25,
    h: 1.12,
  },
  'war-engine': {
    hue: 330,
    light: 0.85,
    w: 1.45,
    h: 1.3,
    accessories: ['spikes', 'blade'],
    badge: 'hammer',
    trim: FIRE,
    aura: 'rgba(255,120,40,0.3)',
  },
  'siege-engine': {
    hue: 60,
    light: 0.9,
    w: 1.4,
    h: 1.05,
    accessories: ['antenna', 'eyes'],
    badge: 'bolt',
    trim: '#ffd24a',
    flip: true,
  },
  'spotter-drone': {
    hue: 140,
    sat: 1.15,
    w: 0.8,
    h: 0.82,
    accessories: ['antenna', 'eyes'],
    badge: 'eye',
    trim: CYAN,
  },
  'bulwark-walker': {
    hue: 220,
    light: 0.95,
    w: 1.3,
    h: 1.1,
    accessories: ['shield'],
    badge: 'shield',
    trim: STEEL,
    aura: 'rgba(150,200,255,0.25)',
  },
  'scrap-golem': {
    hue: 20,
    sat: 0.7,
    light: 0.8,
    w: 1.45,
    h: 1.28,
    accessories: ['spikes', 'horns'],
    badge: 'cog',
    trim: '#d9b48a',
  },
  generator: {
    hue: 80,
    sat: 1.2,
    light: 1.05,
    w: 0.95,
    h: 0.9,
    accessories: ['antenna'],
    badge: 'bolt',
    trim: '#9dff8a',
    aura: 'rgba(140,255,120,0.3)',
  },
  dreadnought: {
    hue: 270,
    light: 0.8,
    w: 1.5,
    h: 1.3,
    accessories: ['blade', 'eyes'],
    badge: 'bolt',
    trim: VIOLET,
    aura: 'rgba(170,120,255,0.3)',
    flip: true,
  },
  // ---- companions: Wyldmaw pack
  hound: { badge: 'claw', trim: '#ffb48a' },
  pup: { badge: 'claw', trim: '#ffd2b0', w: 0.82, h: 0.8, light: 1.1 },
  'pack-alpha': { badge: 'claw', trim: '#ff8a5c', w: 1.1, h: 1.06, accessories: ['eyes'] },
  'dire-wolf': {
    hue: -25,
    light: 0.8,
    w: 1.2,
    h: 1.08,
    accessories: ['eyes', 'spikes'],
    badge: 'moon',
    trim: '#ffe2a8',
    flip: true,
  },
  'maw-hatchling': {
    hue: 90,
    sat: 1.15,
    w: 0.85,
    h: 0.85,
    accessories: ['horns', 'tail'],
    badge: 'bone',
    trim: '#d6ff9a',
  },
  gnashling: { hue: 150, sat: 1.3, w: 0.7, h: 0.7, accessories: ['eyes'], trim: ACID, flip: true },
  // ---- companions: Aurelion, Gloomfen
  'gilded-guard': { hue: 0, accessories: ['shield', 'crown'], badge: 'sunshield', trim: GOLD },
  'bone-thrall': {
    hue: 30,
    light: 1.15,
    sat: 0.7,
    accessories: ['eyes'],
    badge: 'bone',
    trim: '#9be86a',
    aura: 'rgba(155,232,106,0.25)',
  },
  'grave-colossus': {
    hue: 100,
    light: 0.75,
    w: 1.3,
    h: 1.1,
    accessories: ['horns', 'eyes'],
    badge: 'skull',
    trim: '#c8ff9a',
    aura: 'rgba(155,232,106,0.3)',
  },
  'drowned-king': {
    hue: 170,
    light: 0.8,
    accessories: ['crown', 'cape', 'eyes'],
    badge: 'wave',
    trim: '#7fe0c8',
    w: 1.1,
    aura: 'rgba(70,200,170,0.3)',
  },
  // ---- Aurelion enemies
  squire: { accessories: ['shield'], trim: STEEL, hue: -10 },
  'gilded-page': {
    hue: 35,
    sat: 1.1,
    w: 0.62,
    h: 0.66,
    accessories: ['spikes'],
    badge: 'sword',
    trim: GOLD,
    flip: true,
  },
  'squire-recruit': {
    hue: 25,
    light: 0.9,
    sat: 0.8,
    accessories: ['blade'],
    trim: STEEL,
    w: 0.92,
    flip: true,
  },
  'bell-cleric': { hue: 200, accessories: ['hood', 'halo'], badge: 'bell', trim: GOLD },
  'wandering-knight': {
    hue: -45,
    light: 0.8,
    accessories: ['cape', 'blade'],
    trim: '#a8b0c8',
    flip: true,
  },
  'templar-aldric': {
    hue: 10,
    light: 1.05,
    w: 1.15,
    h: 1.08,
    accessories: ['crown', 'cape', 'shield'],
    badge: 'sunshield',
    trim: '#ffd24a',
    aura: 'rgba(255,215,90,0.28)',
  },
  'inquisitor-maelis': {
    hue: 160,
    light: 0.85,
    accessories: ['hood', 'blade'],
    badge: 'eye',
    trim: '#fff0b8',
    aura: 'rgba(255,240,180,0.2)',
  },
  'gilded-halberdier': {
    hue: 40,
    w: 0.95,
    h: 1.12,
    accessories: ['spikes', 'blade'],
    trim: GOLD,
    flip: true,
  },
  seraphine: {
    hue: 5,
    accessories: ['halo', 'wings', 'crown'],
    badge: 'bell',
    trim: GOLD,
    aura: 'rgba(255,225,130,0.4)',
  },
  // ---- Nexus-9 enemies
  'scrap-drone': {
    hue: 220,
    light: 0.85,
    w: 0.85,
    h: 0.85,
    accessories: ['spikes'],
    badge: 'cog',
    trim: FIRE,
  },
  'line-technician': { hue: 20, accessories: ['antenna'], badge: 'bolt', trim: '#ffd24a' },
  'patrol-unit': {
    hue: 110,
    accessories: ['shield', 'eyes'],
    badge: 'shield',
    trim: STEEL,
    w: 1.1,
  },
  'scrap-collector': {
    hue: -20,
    light: 0.85,
    w: 1.2,
    h: 0.95,
    accessories: ['spikes', 'blade'],
    badge: 'coin',
    trim: '#e0a24a',
    flip: true,
  },
  'hive-7': {
    hue: 70,
    sat: 1.2,
    w: 1.2,
    accessories: ['antenna', 'eyes', 'wings'],
    badge: 'web',
    trim: ACID,
    aura: 'rgba(168,255,106,0.25)',
  },
  ghostwire: {
    hue: 250,
    light: 1.1,
    sat: 1.3,
    accessories: ['halo', 'eyes'],
    badge: 'bolt',
    trim: VIOLET,
    aura: 'rgba(160,120,255,0.4)',
  },
  kron: {
    hue: 340,
    light: 0.85,
    w: 1.25,
    h: 1.1,
    accessories: ['horns', 'spikes', 'eyes'],
    badge: 'anvil',
    trim: FIRE,
    aura: 'rgba(255,110,40,0.35)',
  },
  // ---- Wyldmaw enemies
  raptor: { hue: 40, sat: 1.2, w: 0.9, h: 0.95, accessories: ['spikes', 'tail'], trim: '#ffd24a' },
  'acid-spitter': {
    hue: 85,
    sat: 1.4,
    accessories: ['antenna', 'eyes'],
    badge: 'flame',
    trim: ACID,
    w: 1.1,
    flip: true,
  },
  'feral-riftling': {
    hue: -20,
    light: 0.85,
    w: 1.15,
    accessories: ['horns', 'tail'],
    badge: 'claw',
    trim: BLOOD,
  },
  'packmother-ruhn': {
    hue: 20,
    light: 0.9,
    w: 1.2,
    h: 1.1,
    accessories: ['horns', 'cape', 'eyes'],
    badge: 'moon',
    trim: '#ffb48a',
    aura: 'rgba(255,140,90,0.3)',
  },
  'bloated-one': {
    hue: 110,
    sat: 1.1,
    w: 1.45,
    h: 1.05,
    accessories: ['spikes', 'eyes'],
    badge: 'heart',
    trim: '#c8ff9a',
    flip: true,
  },
  'maw-spawn': {
    hue: 180,
    sat: 1.2,
    w: 0.85,
    h: 0.85,
    accessories: ['horns', 'tail'],
    trim: '#9be8ff',
  },
  gorrmaw: {
    hue: -10,
    light: 0.8,
    w: 1.3,
    h: 1.1,
    accessories: ['horns', 'spikes', 'tail', 'eyes'],
    badge: 'claw',
    trim: BLOOD,
    aura: 'rgba(255,60,80,0.35)',
  },
  // ---- Umbral Veil enemies
  'hooded-acolyte': { hue: 20, accessories: ['hood'], badge: 'web', trim: '#6a3fa8' },
  whisperer: {
    hue: 280,
    light: 1.05,
    accessories: ['eyes', 'halo'],
    badge: 'mask',
    trim: VIOLET,
    aura: 'rgba(160,120,255,0.25)',
    h: 1.08,
    w: 0.9,
  },
  'lost-courtier': {
    hue: 330,
    accessories: ['crown', 'cape'],
    badge: 'mask',
    trim: '#e08ac0',
    flip: true,
  },
  lamplighter: {
    hue: 60,
    accessories: ['hood', 'blade'],
    badge: 'flame',
    trim: '#ffd24a',
    aura: 'rgba(255,200,80,0.3)',
  },
  'choir-of-silence': {
    hue: 200,
    light: 0.9,
    w: 1.3,
    accessories: ['halo', 'eyes', 'spikes'],
    badge: 'bell',
    trim: '#9ab0ff',
    aura: 'rgba(120,150,255,0.3)',
  },
  nyxara: {
    hue: 310,
    light: 0.85,
    w: 1.15,
    h: 1.12,
    accessories: ['crown', 'wings', 'cape', 'eyes'],
    badge: 'moon',
    trim: '#e07aff',
    aura: 'rgba(200,100,255,0.4)',
  },
  // ---- the Rift
  'rift-shard': {
    hue: 280,
    sat: 1.5,
    accessories: ['spikes', 'eyes'],
    badge: 'bolt',
    trim: '#ff8af0',
    aura: 'rgba(255,120,240,0.4)',
  },
  vorthax: {
    hue: 330,
    light: 0.8,
    w: 1.3,
    h: 1.15,
    accessories: ['horns', 'wings', 'crown', 'eyes'],
    badge: 'star8',
    trim: '#ff6af0',
    aura: 'rgba(255,90,220,0.45)',
  },
  // ---- the multiverse expansion (DECISIONS #437)
  ...Object.fromEntries(Object.entries(MULTIVERSE_UNIT_ART).map(([id, u]) => [id, u.look])),
};
