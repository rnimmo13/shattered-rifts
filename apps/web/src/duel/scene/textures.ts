// Procedural "painted" art for the battlefield. No image files: everything is generated once from
// seeded noise and gradients (deterministic), at load, then handed to Pixi as textures.
// When real painted backgrounds exist they replace these behind the same layer interface.

import { color, hex, rgba, stage } from '../../design/tokens';
import { camera, floorTop, project } from './layout';
import { fbm, lerp, makeOctaves, rng, smoothstep } from './noise';

/**
 * The backdrop extends well past the 1920×1080 stage on the sides and the bottom, so a wide or tall
 * window never shows empty bars. (Only the middle 1920 px is "the board".)
 */
export const PAD_X = 560;
export const PAD_Y = 320;
export const FULL_W = stage.width + PAD_X * 2;

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

function ctx2d(c: HTMLCanvasElement): CanvasRenderingContext2D {
  const g = c.getContext('2d');
  if (!g) throw new Error('2D canvas is unavailable');
  return g;
}

const rgb = (c: string): [number, number, number] => {
  const n = hex(c);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = rgb(a);
  const [br, bg, bb] = rgb(b);
  return `rgb(${Math.round(lerp(ar, br, t))}, ${Math.round(lerp(ag, bg, t))}, ${Math.round(lerp(ab, bb, t))})`;
}

// ---------------------------------------------------------------------------------------------
// Sky: a painted dusk of obsidian and navy with a rift tearing through it
// ---------------------------------------------------------------------------------------------

function strokePath(g: CanvasRenderingContext2D, pts: [number, number][]): void {
  g.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
  g.stroke();
}

/** A smooth meandering centreline (layered sine waves + a little jitter): organic, not zig-zag. */
function meander(
  r: () => number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  steps: number,
  amp: number,
): [number, number][] {
  const p1 = r() * 6.28;
  const p2 = r() * 6.28;
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const off =
      amp * (Math.sin(t * 3.1 + p1) * 0.7 + Math.sin(t * 7.3 + p2) * 0.3) + (r() - 0.5) * 3;
    pts.push([lerp(ax, bx, t) + off, lerp(ay, by, t)]);
  }
  return pts;
}

/** A jagged lens-shaped polygon along a centreline: wide in the middle, pinched at both ends. */
function tearShape(
  r: () => number,
  center: [number, number][],
  maxW: number,
): { poly: [number, number][]; widths: number[] } {
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  const widths: number[] = [];
  const ph = r() * 6.28;
  center.forEach(([x, y], i) => {
    const t = i / (center.length - 1);
    // width swells and narrows smoothly; only a few px of ragged edge
    const w = maxW * Math.sin(Math.PI * t) ** 0.8 * (0.78 + 0.22 * Math.sin(t * 9 + ph));
    widths.push(w);
    left.push([x - w * (0.85 + r() * 0.2), y]);
    right.push([x + w * (0.85 + r() * 0.2), y]);
  });
  return { poly: [...left, ...right.reverse()], widths };
}

function fillPoly(g: CanvasRenderingContext2D, poly: [number, number][]): void {
  g.beginPath();
  poly.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
  g.closePath();
  g.fill();
}

export function skyTexture(): HTMLCanvasElement {
  const W = FULL_W;
  const H = 640;
  const c = makeCanvas(W, H);
  const g = ctx2d(c);
  const r = rng(7);
  const cx = W / 2;

  const base = g.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, color.void);
  base.addColorStop(0.3, color.obsidian);
  base.addColorStop(0.55, '#111b48');
  base.addColorStop(0.78, '#2a246e');
  base.addColorStop(1, '#4a3496');
  g.fillStyle = base;
  g.fillRect(0, 0, W, H);

  // painterly nebula: big soft blobs of violet, blue and a little magenta
  g.globalCompositeOperation = 'lighter';
  const blobColors = [
    color.violetDeep,
    color.navyLight,
    color.violet,
    color.navyMid,
    color.magenta,
  ];
  for (let i = 0; i < 90; i++) {
    const x = r() * W;
    const y = r() * H * 0.9;
    const rad = 90 + r() * 330;
    const col = blobColors[Math.floor(r() * blobColors.length)] as string;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, rgba(col, 0.09 + r() * 0.08));
    gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }

  // halo behind the rift
  const halo = g.createRadialGradient(cx, 200, 0, cx, 200, 700);
  halo.addColorStop(0, rgba(color.cyan, 0.3));
  halo.addColorStop(0.3, rgba(color.violet, 0.26));
  halo.addColorStop(1, rgba(color.violet, 0));
  g.fillStyle = halo;
  g.fillRect(0, 0, W, H);

  // god-rays: soft wedges of light fanning out of the tear
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.2 + (r() - 0.5) * 0.08;
    const len = 520 + r() * 260;
    const spread = 0.05 + r() * 0.05;
    const gr = g.createLinearGradient(
      cx,
      160,
      cx + Math.cos(a) * len,
      160 - Math.sin(a) * len * -1,
    );
    gr.addColorStop(0, rgba(color.violetGlow, 0.1));
    gr.addColorStop(1, rgba(color.violetGlow, 0));
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(cx, 160);
    g.lineTo(cx + Math.cos(a - spread) * len, 160 + Math.sin(a - spread) * len * -1);
    g.lineTo(cx + Math.cos(a + spread) * len, 160 + Math.sin(a + spread) * len * -1);
    g.closePath();
    g.fill();
  }

  // the Rift: a lens-shaped tear (not a line), glowing from within
  g.globalCompositeOperation = 'source-over';
  const centre = meander(r, cx + 40, -40, cx - 30, 470, 44, 46);
  const outer = tearShape(r, centre, 58);
  g.save();
  g.shadowColor = rgba(color.violet, 1);
  g.shadowBlur = 120;
  g.fillStyle = rgba(color.violetGlow, 0.8);
  fillPoly(g, outer.poly);
  g.shadowColor = rgba(color.cyan, 0.95);
  g.shadowBlur = 60;
  g.fillStyle = rgba(color.cyan, 0.85);
  fillPoly(g, tearShape(r, centre, 36).poly);
  g.shadowBlur = 24;
  g.fillStyle = 'rgba(226, 250, 255, 0.92)';
  fillPoly(g, tearShape(r, centre, 11).poly);
  g.restore();
  // hairline fractures radiating from the tear
  g.lineCap = 'round';
  for (let b = 0; b < 9; b++) {
    const at = centre[2 + Math.floor(r() * (centre.length - 4))] as [number, number];
    const dir = r() < 0.5 ? -1 : 1;
    const branch = meander(
      r,
      at[0],
      at[1],
      at[0] + dir * (30 + r() * 80),
      at[1] + 10 + r() * 70,
      16,
      22,
    );
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = rgba(color.violet, 0.28);
    g.lineWidth = 6;
    strokePath(g, branch);
    g.strokeStyle = rgba(color.violetGlow, 0.5);
    g.lineWidth = 1.2;
    strokePath(g, branch);
  }

  // stars
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 220; i++) {
    const a = 0.08 + r() * 0.5;
    g.fillStyle = rgba(r() < 0.25 ? color.cyanGlow : color.ivory, a);
    const s = r() < 0.12 ? 2 : 1;
    g.fillRect(r() * W, r() * H * 0.7, s, s);
  }

  // brush strokes: long low-alpha swipes give the painted, not-a-gradient feel
  g.globalCompositeOperation = 'source-over';
  g.lineCap = 'round';
  for (let i = 0; i < 220; i++) {
    const x = r() * W;
    const y = r() * H;
    const len = 80 + r() * 260;
    const ang = -0.25 + r() * 0.5;
    g.strokeStyle = rgba(r() < 0.5 ? color.void : color.violetDeep, 0.03 + r() * 0.04);
    g.lineWidth = 14 + r() * 46;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    g.stroke();
  }
  return c;
}

/** Floating rock islands drifting in the sky (their own layer so they can drift and parallax). */
export function shardsTexture(): HTMLCanvasElement {
  const W = FULL_W;
  const H = 520;
  const c = makeCanvas(W, H);
  const g = ctx2d(c);
  const r = rng(23);
  const place = (cx: number, cy: number, rad: number, depth: number) => {
    const n = 8 + Math.floor(r() * 3);
    const pts: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = rad * (0.6 + r() * 0.55);
      pts.push([
        cx + Math.cos(a) * rr * 1.5,
        cy + Math.sin(a) * rr * (a > 0 && a < Math.PI ? 1.25 : 0.5),
      ]);
    }
    const body = g.createLinearGradient(cx, cy - rad, cx, cy + rad * 1.2);
    body.addColorStop(0, lerpColor('#243170', color.obsidian, depth));
    body.addColorStop(1, color.void);
    g.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
    g.closePath();
    g.fillStyle = body;
    g.fill();
    // rim light from the rift on the upper edges
    g.strokeStyle = rgba(color.cyan, 0.34 * (1 - depth * 0.6));
    g.lineWidth = 2;
    g.beginPath();
    pts
      .slice(0, Math.ceil(n / 2) + 1)
      .forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
    g.stroke();
    // a tuft of glow underneath, like rift-light leaking out
    const lg = g.createRadialGradient(cx, cy + rad * 0.9, 0, cx, cy + rad * 0.9, rad * 1.5);
    lg.addColorStop(0, rgba(color.violet, 0.26 * (1 - depth * 0.5)));
    lg.addColorStop(1, rgba(color.violet, 0));
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = lg;
    g.fillRect(cx - rad * 2, cy, rad * 4, rad * 2);
    g.globalCompositeOperation = 'source-over';
  };
  for (let i = 0; i < 22; i++) {
    const side = r() < 0.5 ? -1 : 1;
    const x = W / 2 + side * (300 + r() * 1100);
    place(x, 30 + r() * 270, 22 + r() * 70, r());
  }
  return c;
}

/** Broken cathedral ruins on the far horizon, two depth layers, with windows lit by the rift. */
export function ruinsTexture(): HTMLCanvasElement {
  const W = FULL_W;
  const H = 360;
  const c = makeCanvas(W, H);
  const g = ctx2d(c);
  const baseY = H - 4;
  const HS = 0.66; // heights scale: low enough that the rift stays visible above them

  const layer = (
    top: string,
    bottom: string,
    rimColor: string,
    rimAlpha: number,
    scale: number,
    seed: number,
    lit: number,
  ) => {
    const rr = rng(seed);
    const fill = g.createLinearGradient(0, baseY - 300, 0, baseY);
    fill.addColorStop(0, top);
    fill.addColorStop(1, bottom);
    g.fillStyle = fill;
    g.strokeStyle = rgba(rimColor, rimAlpha);
    g.lineWidth = 2;
    g.lineJoin = 'round';
    const shape = () => {
      g.fill();
      g.stroke();
    };
    let x = -120;
    while (x < W + 120) {
      const kind = rr();
      const w = (90 + rr() * 130) * scale;
      const h = (140 + rr() * 210) * scale * HS;
      // leave a clearing under the Rift so the tear is framed, not hidden
      if (lit > 0 && Math.abs(x + w / 2 - W / 2) < 230) {
        x += w * 0.6;
        continue;
      }
      if (kind < 0.4) {
        // a gothic arch with a broken crown
        const pw = 26 * scale;
        g.beginPath();
        g.rect(x, baseY - h, pw, h);
        shape();
        g.beginPath();
        g.rect(x + w - pw, baseY - h * (0.7 + rr() * 0.3), pw, h);
        shape();
        if (rr() < 0.78) {
          g.beginPath();
          g.moveTo(x, baseY - h);
          g.quadraticCurveTo(x + w / 2, baseY - h - w * 0.62 * HS * 1.3, x + w, baseY - h * 0.8);
          g.lineTo(x + w - pw, baseY - h * 0.8);
          g.quadraticCurveTo(x + w / 2, baseY - h - w * 0.4 * HS * 1.3, x + pw, baseY - h);
          g.closePath();
          shape();
        }
      } else if (kind < 0.68) {
        // a spire with a cross-section step
        g.beginPath();
        g.moveTo(x, baseY);
        g.lineTo(x + w * 0.14, baseY - h * 0.55);
        g.lineTo(x + w * 0.24, baseY - h * 0.55);
        g.lineTo(x + w * 0.3, baseY - h * 1.12);
        g.lineTo(x + w * 0.36, baseY - h * 0.55);
        g.lineTo(x + w * 0.46, baseY - h * 0.55);
        g.lineTo(x + w * 0.6, baseY);
        g.closePath();
        shape();
      } else {
        // a wall with a ragged top and lit windows
        g.beginPath();
        g.moveTo(x, baseY);
        g.lineTo(x, baseY - h * 0.6);
        for (let i = 1; i <= 6; i++) g.lineTo(x + (w * i) / 6, baseY - h * (0.45 + rr() * 0.4));
        g.lineTo(x + w, baseY);
        g.closePath();
        shape();
        if (lit > 0) {
          g.save();
          g.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 3; i++) {
            const wx = x + w * (0.14 + 0.27 * i);
            const wy = baseY - h * (0.3 + rr() * 0.15);
            const warm = rr() < 0.4;
            const col = warm ? color.emberGlow : rr() < 0.5 ? color.cyan : color.violetGlow;
            const gl = g.createRadialGradient(wx + 5, wy + 12, 0, wx + 5, wy + 12, 34 * scale);
            gl.addColorStop(0, rgba(col, 0.5 * lit));
            gl.addColorStop(1, rgba(col, 0));
            g.fillStyle = gl;
            g.fillRect(wx - 30, wy - 24, 70, 70);
            g.fillStyle = rgba(col, 0.75 * lit);
            g.fillRect(wx, wy, 9 * scale, 24 * scale);
          }
          g.restore();
        }
      }
      x += w * (0.55 + rr() * 0.5);
    }
  };
  layer('#2b3a82', '#141b46', color.violetGlow, 0.18, 0.8, 3, 0);
  // haze between the two layers
  const haze = g.createLinearGradient(0, H * 0.2, 0, H);
  haze.addColorStop(0, rgba(color.violetDeep, 0));
  haze.addColorStop(1, rgba(color.violet, 0.36));
  g.fillStyle = haze;
  g.fillRect(0, 0, W, H);
  layer('#141e52', '#04060f', color.cyan, 0.3, 1.05, 11, 1);
  // ground mist at the base so ruins sink into the arena's far edge
  const mist = g.createLinearGradient(0, H - 120, 0, H);
  mist.addColorStop(0, rgba(color.navyLight, 0));
  mist.addColorStop(1, rgba('#43359a', 0.7));
  g.fillStyle = mist;
  g.fillRect(0, H - 120, W, 120);
  return c;
}

// ---------------------------------------------------------------------------------------------
// Arena floor: stone slabs in true perspective, lit by the rift line, with glowing cracks
// ---------------------------------------------------------------------------------------------

const SLAB_TILE = 768; // px; covers TILE_UNITS × TILE_UNITS world units (192 px per unit)
const TILE_UNITS = 4;
const SLABS_PER_TILE = 8; // so each slab is half a world unit

interface Mip {
  size: number;
  data: Uint8ClampedArray;
}

const clampByte = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

function buildSlabMips(): Mip[] {
  const size = SLAB_TILE;
  const c = makeCanvas(size, size);
  const g = ctx2d(c);
  const r = rng(404);
  const cell = size / SLABS_PER_TILE;
  const grain = makeOctaves(8, 4, 12);

  const slab = (x: number, y: number, tone: number, runes: boolean) => {
    const base = g.createLinearGradient(x, y, x + cell, y + cell);
    base.addColorStop(
      0,
      `rgb(${Math.round(58 * tone)}, ${Math.round(66 * tone)}, ${Math.round(104 * tone)})`,
    );
    base.addColorStop(
      1,
      `rgb(${Math.round(36 * tone)}, ${Math.round(42 * tone)}, ${Math.round(74 * tone)})`,
    );
    g.fillStyle = base;
    g.fillRect(x, y, cell, cell);
    // worn patches: soft lighter and darker blotches so no slab is flat
    for (let i = 0; i < 4; i++) {
      const bx = x + r() * cell;
      const by = y + r() * cell;
      const rad = 20 + r() * 60;
      const bl = g.createRadialGradient(bx, by, 0, bx, by, rad);
      const dark = r() < 0.5;
      bl.addColorStop(0, dark ? 'rgba(2,3,12,0.35)' : 'rgba(150,160,255,0.12)');
      bl.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = bl;
      g.fillRect(bx - rad, by - rad, rad * 2, rad * 2);
    }
    // chips and scratches
    g.strokeStyle = 'rgba(0,0,0,0.4)';
    g.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const px = x + 10 + r() * (cell - 20);
      const py = y + 10 + r() * (cell - 20);
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(px + (r() - 0.5) * 60, py + (r() - 0.5) * 60);
      g.stroke();
    }
    // a faint engraved rune on some slabs
    if (runes) {
      g.strokeStyle = 'rgba(150,120,255,0.24)';
      g.lineWidth = 2.5;
      const cx = x + cell / 2;
      const cy = y + cell / 2;
      g.beginPath();
      g.arc(cx, cy, cell * 0.2, 0, Math.PI * 2);
      g.moveTo(cx - cell * 0.12, cy);
      g.lineTo(cx + cell * 0.12, cy);
      g.moveTo(cx, cy - cell * 0.12);
      g.lineTo(cx, cy + cell * 0.12);
      g.stroke();
    }
    // bevel: light on the upper-left edges, shadow on the lower-right
    g.lineWidth = 3;
    g.strokeStyle = 'rgba(170,190,255,0.34)';
    g.beginPath();
    g.moveTo(x + 3, y + cell - 3);
    g.lineTo(x + 3, y + 3);
    g.lineTo(x + cell - 3, y + 3);
    g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.55)';
    g.beginPath();
    g.moveTo(x + cell - 3, y + 3);
    g.lineTo(x + cell - 3, y + cell - 3);
    g.lineTo(x + 3, y + cell - 3);
    g.stroke();
    // grout
    g.strokeStyle = 'rgba(2,3,10,0.95)';
    g.lineWidth = 4;
    g.strokeRect(x, y, cell, cell);
  };
  // running bond: every other row is shifted by half a slab (wrapping, so the tile still repeats)
  for (let sy = 0; sy < SLABS_PER_TILE; sy++) {
    for (let sx = 0; sx < SLABS_PER_TILE; sx++) {
      const x = sx * cell + (sy % 2 ? cell / 2 : 0);
      const y = sy * cell;
      const tone = 0.7 + r() * 0.66;
      const runes = r() < 0.3;
      slab(x, y, tone, runes);
      if (x + cell > size) slab(x - size, y, tone, runes); // the slab that wraps around the edge
    }
  }
  // fine mottled grain on top
  const img = g.getImageData(0, 0, size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = fbm(grain, (x / size) * 8, (y / size) * 8);
      const k = 0.74 + n * 0.55;
      const i = (y * size + x) * 4;
      d[i] = clampByte((d[i] as number) * k);
      d[i + 1] = clampByte((d[i + 1] as number) * k);
      d[i + 2] = clampByte((d[i + 2] as number) * (k + 0.05));
    }
  }
  g.putImageData(img, 0, 0);

  // mip chain by repeated downscale
  const mips: Mip[] = [{ size, data: img.data }];
  let prev = c;
  for (let s = size / 2; s >= 48; s /= 2) {
    const m = makeCanvas(s, s);
    const mg = ctx2d(m);
    mg.imageSmoothingEnabled = true;
    mg.imageSmoothingQuality = 'high';
    mg.drawImage(prev, 0, 0, s, s);
    mips.push({ size: s, data: mg.getImageData(0, 0, s, s).data });
    prev = m;
  }
  return mips;
}

function sampleMip(m: Mip, u: number, v: number, out: [number, number, number]): void {
  // u, v in [0,1) wrapping; bilinear
  const s = m.size;
  const fx = u * s - 0.5;
  const fy = v * s - 0.5;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = fx - x0;
  const ty = fy - y0;
  const xa = ((x0 % s) + s) % s;
  const ya = ((y0 % s) + s) % s;
  const xb = (xa + 1) % s;
  const yb = (ya + 1) % s;
  const d = m.data;
  for (let ch = 0; ch < 3; ch++) {
    const a = d[(ya * s + xa) * 4 + ch] as number;
    const b = d[(ya * s + xb) * 4 + ch] as number;
    const cc = d[(yb * s + xa) * 4 + ch] as number;
    const dd = d[(yb * s + xb) * 4 + ch] as number;
    out[ch] = a + (b - a) * tx + (cc - a) * ty + (a - b - cc + dd) * tx * ty;
  }
}

export interface FloorTextures {
  /** The lit stone floor (half resolution; scale ×2 to stage size). */
  floor: HTMLCanvasElement;
  /** The Rift line crack along the middle of the board. */
  riftCrack: HTMLCanvasElement;
  /** Smaller branching cracks across the floor. */
  branchCracks: HTMLCanvasElement;
  /** Stage-space top-left of the textures and the scale to apply (2 = they're half resolution). */
  originX: number;
  originY: number;
  scale: number;
}

export function floorTextures(): FloorTextures {
  const HALF = 2;
  const W = FULL_W / HALF;
  const H = Math.ceil((stage.height + PAD_Y - floorTop) / HALF);
  const mips = buildSlabMips();

  // --- stone, per pixel through the camera ---
  const floor = makeCanvas(W, H);
  const fg = ctx2d(floor);
  const img = fg.createImageData(W, H);
  const px = img.data;
  const tmp: [number, number, number] = [0, 0, 0];
  const [hr, hg, hb] = rgb('#33298a'); // haze at the arena's far edge
  const [vr, vg, vb] = rgb(color.violet);
  const rift = camera.A / (640 - camera.vpY);
  const EDGE = 9.4; // half-width of the arena in world units
  for (let py = 0; py < H; py++) {
    const y = floorTop + py * HALF;
    const Z = camera.A / (y - camera.vpY);
    const pxPerUnit = camera.f / Z / HALF;
    // texels (in the full-size tile) covered by one output pixel → choose a mip
    const footprint = 192 / pxPerUnit;
    const lod = Math.max(0, Math.log2(Math.max(1, footprint)));
    const mip = mips[Math.min(mips.length - 1, Math.round(lod))] as Mip;
    const far = 1 - smoothstep(floorTop, floorTop + 200, y); // 1 at the back edge
    const riftBand = Math.exp(-(((Z - rift) / 0.5) ** 2));
    const vZ = (Z / TILE_UNITS) % 1;
    for (let pxl = 0; pxl < W; pxl++) {
      const x = pxl * HALF - PAD_X;
      const X = ((x - camera.cx) * Z) / camera.f;
      const u = (((X / TILE_UNITS) % 1) + 1) % 1;
      sampleMip(mip, u, vZ, tmp);
      // light: pooled around the centre line, falling off to the sides and toward the viewer
      const lx = (x - camera.cx) / 1250;
      const light = 0.5 + 0.95 * Math.exp(-lx * lx) * (0.72 + 0.28 * riftBand);
      let rr = tmp[0] * light;
      let gg = tmp[1] * light;
      let bb = tmp[2] * light;
      // violet rim light spilling from the Rift line
      rr += vr * riftBand * 0.26;
      gg += vg * riftBand * 0.26;
      bb += vb * riftBand * 0.36;
      // atmospheric haze toward the far edge
      rr = lerp(rr, hr, far * 0.7);
      gg = lerp(gg, hg, far * 0.7);
      bb = lerp(bb, hb, far * 0.7);
      // platform shape: soft far edge and angled side edges
      const edgeX = EDGE - Math.abs(X);
      const alpha = smoothstep(0, 0.9, edgeX) * smoothstep(floorTop, floorTop + 70, y);
      const i = (py * W + pxl) * 4;
      px[i] = clampByte(rr);
      px[i + 1] = clampByte(gg);
      px[i + 2] = clampByte(bb);
      px[i + 3] = clampByte(alpha * 255);
    }
  }
  fg.putImageData(img, 0, 0);

  // --- cracks, drawn through the same camera ---
  const riftCrack = makeCanvas(W, H);
  const branchCracks = makeCanvas(W, H);
  const r = rng(808);
  const toCanvas = (X: number, Z: number): [number, number] => {
    const p = project(X, Z);
    return [(p.x + PAD_X) / HALF, (p.y - floorTop) / HALF];
  };
  const widthAt = (Z: number, w: number) => (w * camera.f) / Z / HALF;

  const drawCrack = (
    g: CanvasRenderingContext2D,
    pts: [number, number][],
    baseW: number,
    strength: number,
    passes: { k: number; c: string; a: number }[],
    taper: number,
  ) => {
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const p of passes) {
      g.strokeStyle = rgba(p.c, p.a * strength);
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1] as [number, number];
        const b = pts[i] as [number, number];
        const Zm = camera.A / (((a[1] + b[1]) / 2) * HALF + floorTop - camera.vpY);
        const t = i / pts.length;
        g.lineWidth = Math.max(0.5, widthAt(Zm, baseW * p.k) * (1 - taper * t));
        g.beginPath();
        g.moveTo(a[0], a[1]);
        g.lineTo(b[0], b[1]);
        g.stroke();
      }
    }
    g.restore();
  };

  // the Rift line: a long jagged crack across the middle of the arena (this one is meant to be bright)
  {
    const g = ctx2d(riftCrack);
    const pts: [number, number][] = [];
    for (let i = 0; i <= 90; i++) {
      const X = lerp(-EDGE + 0.4, EDGE - 0.4, i / 90);
      const Z = rift + (r() - 0.5) * 0.2 * (0.5 + 0.5 * Math.sin((i / 90) * Math.PI));
      pts.push(toCanvas(X, Z));
    }
    drawCrack(
      g,
      pts,
      0.026,
      1,
      [
        { k: 8, c: color.violetDeep, a: 0.28 },
        { k: 4, c: color.violet, a: 0.42 },
        { k: 1.9, c: color.magenta, a: 0.3 },
        { k: 1.5, c: color.cyan, a: 0.6 },
        { k: 0.6, c: '#e6fbff', a: 0.85 },
      ],
      0,
    );
  }
  // faint fissures: thin, violet, tapering. Cracks in stone, not lightning.
  {
    const g = ctx2d(branchCracks);
    const passes = [
      { k: 6, c: color.violetDeep, a: 0.3 },
      { k: 2.6, c: color.violet, a: 0.42 },
      { k: 1, c: color.violetGlow, a: 0.55 },
    ];
    const branch = (X: number, Z: number, ang: number, len: number, depth: number) => {
      if (depth > 2 || len < 0.3) return;
      const pts: [number, number][] = [toCanvas(X, Z)];
      let cx = X;
      let cz = Z;
      const steps = 12; // many short, wobbly segments: stone breaks in small steps
      for (let i = 0; i < steps; i++) {
        const a = ang + (r() - 0.5) * 1.5;
        cx += Math.cos(a) * (len / steps);
        cz += Math.sin(a) * (len / steps) * 0.9;
        if (cz < 4.4 || cz > 14.5 || Math.abs(cx) > EDGE - 0.5) break;
        pts.push(toCanvas(cx, cz));
      }
      if (pts.length > 1) drawCrack(g, pts, 0.009 * (1 - depth * 0.25), 0.8, passes, 0.85);
      if (r() < 0.65) branch(cx, cz, ang + (r() - 0.5) * 1.6, len * 0.55, depth + 1);
      if (r() < 0.4)
        branch(cx, cz, ang + (r() < 0.5 ? 1 : -1) * (0.7 + r() * 0.7), len * 0.45, depth + 1);
    };
    for (let i = 0; i < 12; i++) {
      const X = lerp(-EDGE + 1.5, EDGE - 1.5, i / 11) + (r() - 0.5) * 0.9;
      const up = r() < 0.5;
      branch(X, rift + (r() - 0.5) * 0.15, up ? -Math.PI / 2 : Math.PI / 2, 1.1 + r() * 1.3, 0);
    }
    for (let i = 0; i < 5; i++) {
      branch((r() - 0.5) * 2 * (EDGE - 2.5), 5 + r() * 8, r() * Math.PI * 2, 0.9 + r() * 1.1, 1);
    }
  }
  return { floor, riftCrack, branchCracks, originX: -PAD_X, originY: floorTop, scale: HALF };
}

// ---------------------------------------------------------------------------------------------
// Small reusable sprites: fog, glow, rune rings, vignette
// ---------------------------------------------------------------------------------------------

/** A tileable cloud texture; alpha carries the shape. Tint it on the sprite. */
export function fogTexture(seed: number, base = 6, fadeV = false): HTMLCanvasElement {
  const size = 512;
  const c = makeCanvas(size, size);
  const g = ctx2d(c);
  const img = g.createImageData(size, size);
  const oct = makeOctaves(base, 5, seed);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = fbm(oct, (x / size) * base, (y / size) * base);
      // fadeV bakes a soft top/bottom fade into the alpha (cheaper than a mask at draw time)
      const vy = y / size;
      const fade = fadeV ? smoothstep(0, 0.32, vy) * (1 - smoothstep(0.68, 1, vy)) : 1;
      const a = smoothstep(0.38, 0.82, n) * fade;
      const i = (y * size + x) * 4;
      d[i] = 255;
      d[i + 1] = 255;
      d[i + 2] = 255;
      d[i + 3] = clampByte(a * 255);
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** A soft round glow (white; tint on the sprite). */
/** A dark blob with a firm core and a short falloff: the contact shadow under a figure's feet. */
export function contactTexture(size = 128): HTMLCanvasElement {
  const c = makeCanvas(size, size);
  const g = ctx2d(c);
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.4, 'rgba(255,255,255,0.9)');
  gr.addColorStop(0.7, 'rgba(255,255,255,0.4)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return c;
}

export function glowTexture(size = 128, hardness = 0): HTMLCanvasElement {
  const c = makeCanvas(size, size);
  const g = ctx2d(c);
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.18 + hardness, 'rgba(255,255,255,0.55)');
  gr.addColorStop(0.55, 'rgba(255,255,255,0.12)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return c;
}

/** An engraved rune circle for a slot: rings, tick marks and glyph arcs, drawn in white (tint it gold). */

/** Dark edges and a heavier bottom, so the eye stays on the centre of the board (scaled to the screen). */
export function vignetteTexture(): HTMLCanvasElement {
  const W = stage.width;
  const H = stage.height;
  const c = makeCanvas(W, H);
  const g = ctx2d(c);
  const rad = g.createRadialGradient(W / 2, H * 0.52, H * 0.3, W / 2, H * 0.52, H * 1.0);
  rad.addColorStop(0, 'rgba(2,3,9,0)');
  rad.addColorStop(0.6, 'rgba(2,3,9,0.32)');
  rad.addColorStop(1, 'rgba(2,3,9,0.9)');
  g.fillStyle = rad;
  g.fillRect(0, 0, W, H);
  const bot = g.createLinearGradient(0, H * 0.74, 0, H);
  bot.addColorStop(0, 'rgba(2,3,9,0)');
  bot.addColorStop(1, 'rgba(2,3,9,0.7)');
  g.fillStyle = bot;
  g.fillRect(0, H * 0.74, W, H * 0.26);
  const top = g.createLinearGradient(0, 0, 0, H * 0.14);
  top.addColorStop(0, 'rgba(2,3,9,0.55)');
  top.addColorStop(1, 'rgba(2,3,9,0)');
  g.fillStyle = top;
  g.fillRect(0, 0, W, H * 0.14);
  return c;
}
