// Card textures for the battlefield (Pixi). The hand uses the DOM Card component; the board needs the same
// card as a canvas so a trap can flip over on the floor. Face: bezel, art window, name, cost, type line.
// Back: the sealed card back with a rift sigil. Both are cached.

import type { CardDef, Realm } from '@sr/engine';
import { color, rgba } from '../design/tokens';
import { cardArt } from './proceduralArt';

export const FACE_W = 300;
export const FACE_H = 420;

interface Trim {
  hi: string;
  mid: string;
  lo: string;
  inkA: string;
  inkB: string;
}

const TRIM: Record<Realm, Trim> = {
  aurelion: {
    hi: color.goldLight,
    mid: color.gold,
    lo: color.goldDark,
    inkA: '#1c2c66',
    inkB: '#0b1030',
  },
  nexus: { hi: '#d6f2ff', mid: '#8fb4c6', lo: '#3d5666', inkA: '#0f3446', inkB: '#060f16' },
  wyldmaw: { hi: '#ffd29a', mid: '#c98a4a', lo: '#6b3d1c', inkA: '#4a1522', inkB: '#150709' },
  umbral: { hi: '#d5c8ff', mid: '#8f7bd1', lo: '#3f2f78', inkA: '#2a1658', inkB: '#0a0618' },
  neutral: { hi: '#ffffff', mid: '#b9c0e8', lo: '#50567e', inkA: '#262a4a', inkB: '#0c0e1c' },
};

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  if (!g) throw new Error('2D canvas is unavailable');
  return [c, g];
}

function roundRect(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** The metal bezel plus lacquered interior shared by face and back. */
function bezel(g: CanvasRenderingContext2D, t: Trim): void {
  const edge = g.createLinearGradient(0, 0, FACE_W, FACE_H);
  edge.addColorStop(0, t.hi);
  edge.addColorStop(0.35, t.mid);
  edge.addColorStop(0.6, t.lo);
  edge.addColorStop(0.85, t.mid);
  edge.addColorStop(1, t.hi);
  roundRect(g, 0, 0, FACE_W, FACE_H, 20);
  g.fillStyle = edge;
  g.fill();
  const ink = g.createLinearGradient(0, 0, FACE_W * 0.4, FACE_H);
  ink.addColorStop(0, t.inkA);
  ink.addColorStop(0.7, t.inkB);
  roundRect(g, 7, 7, FACE_W - 14, FACE_H - 14, 14);
  g.fillStyle = ink;
  g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.55)';
  g.lineWidth = 2;
  g.stroke();
}

const faceCache = new Map<string, HTMLCanvasElement>();

export function cardFaceCanvas(def: CardDef): HTMLCanvasElement {
  const hit = faceCache.get(def.id);
  if (hit) return hit;
  const t = TRIM[def.realm];
  const [c, g] = makeCanvas(FACE_W, FACE_H);
  bezel(g, t);

  // art window
  const ax = 16;
  const ay = 62;
  const aw = FACE_W - 32;
  const ah = 214;
  g.save();
  roundRect(g, ax, ay, aw, ah, 8);
  g.clip();
  g.drawImage(cardArt(def).window, ax, ay, aw, ah);
  g.restore();
  g.strokeStyle = t.lo;
  g.lineWidth = 3;
  roundRect(g, ax, ay, aw, ah, 8);
  g.stroke();

  // name banner
  roundRect(g, 14, 12, FACE_W - 78, 38, 8);
  g.fillStyle = 'rgba(0,0,0,0.4)';
  g.fill();
  g.fillStyle = t.hi;
  g.textBaseline = 'middle';
  g.font = '700 20px Cinzel, serif';
  let name = def.name;
  while (g.measureText(name).width > FACE_W - 100 && name.length > 4) name = name.slice(0, -2);
  g.fillText(name === def.name ? name : `${name}…`, 24, 32);

  // cost gem
  const cx = FACE_W - 34;
  const cy = 32;
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    g.lineTo(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24);
  }
  g.closePath();
  const gem = g.createRadialGradient(cx - 6, cy - 8, 2, cx, cy, 26);
  gem.addColorStop(0, '#b9f2ff');
  gem.addColorStop(0.4, color.cyan);
  gem.addColorStop(1, '#0a5f86');
  g.fillStyle = gem;
  g.fill();
  g.fillStyle = '#04202e';
  g.textAlign = 'center';
  g.font = '34px "Bebas Neue", sans-serif';
  g.fillText(String(def.cost), cx, cy + 2);
  g.textAlign = 'left';

  // type line
  g.fillStyle = t.hi;
  g.globalAlpha = 0.9;
  g.textAlign = 'center';
  g.font = '700 14px Cinzel, serif';
  g.fillText(def.type.toUpperCase(), FACE_W / 2, 296);
  g.globalAlpha = 1;
  g.fillStyle = rgba(t.mid, 0.6);
  g.fillRect(40, 306, FACE_W - 80, 2);

  // a couple of lines of rules text
  g.fillStyle = color.ivory;
  g.font = '600 16px "Source Sans 3", sans-serif';
  const words = def.text.replace(/\*\*/g, '').split(/\s+/);
  let line = '';
  let y = 332;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > FACE_W - 56) {
      g.fillText(line, FACE_W / 2, y);
      line = w;
      y += 20;
      if (y > FACE_H - 28) break;
    } else line = test;
  }
  if (y <= FACE_H - 28 && line) g.fillText(line, FACE_W / 2, y);
  g.textAlign = 'left';

  faceCache.set(def.id, c);
  return c;
}

const backCache = new Map<string, HTMLCanvasElement>();

/** The sealed card back: bezel plus a rift sigil. `tint` is a CSS colour for the glowing sigil. */
export function cardBackCanvas(tint: string): HTMLCanvasElement {
  const hit = backCache.get(tint);
  if (hit) return hit;
  const [c, g] = makeCanvas(FACE_W, FACE_H);
  bezel(g, TRIM.neutral);
  // darken the interior so the sigil carries the card
  roundRect(g, 7, 7, FACE_W - 14, FACE_H - 14, 14);
  g.fillStyle = 'rgba(4,5,11,0.78)';
  g.fill();
  const mx = FACE_W / 2;
  const my = FACE_H / 2;
  g.save();
  g.globalCompositeOperation = 'lighter';
  const halo = g.createRadialGradient(mx, my, 0, mx, my, 150);
  halo.addColorStop(0, rgba(tint, 0.55));
  halo.addColorStop(1, rgba(tint, 0));
  g.fillStyle = halo;
  g.fillRect(0, 0, FACE_W, FACE_H);
  g.restore();
  g.strokeStyle = rgba(tint, 0.95);
  g.lineWidth = 3;
  for (const r of [104, 78, 52]) {
    g.beginPath();
    g.arc(mx, my, r, 0, Math.PI * 2);
    g.stroke();
  }
  // rune ticks on the outer ring
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const r0 = 104;
    const r1 = i % 3 === 0 ? 120 : 112;
    g.beginPath();
    g.moveTo(mx + Math.cos(a) * r0, my + Math.sin(a) * r0);
    g.lineTo(mx + Math.cos(a) * r1, my + Math.sin(a) * r1);
    g.stroke();
  }
  // the broken diamond at the centre: a rift tear
  g.fillStyle = rgba(tint, 0.9);
  g.beginPath();
  g.moveTo(mx, my - 40);
  g.lineTo(mx + 22, my - 4);
  g.lineTo(mx + 6, my + 2);
  g.lineTo(mx + 18, my + 40);
  g.lineTo(mx - 10, my + 6);
  g.lineTo(mx + 4, my - 2);
  g.lineTo(mx - 20, my - 8);
  g.closePath();
  g.fill();
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.arc(mx, my, 4, 0, Math.PI * 2);
  g.fill();
  backCache.set(tint, c);
  return c;
}
