// Hand-built standing figures for the ten Riftwalkers: each its own silhouette, outfit and prop, instead of one shared painter
// per archetype. Flat shapes with gradient shading, one light from the upper left, a shared dark outline and an additive
// effects layer for glows, drawn on the same 420x560 cut-out (feet on the bottom edge) the other figures use, so they drop
// straight into the fight screen. Real art (art/manifest.json) still wins over these.

import { realFigure } from './assets';

type G = CanvasRenderingContext2D;
const W = 420;
const H = 560;
const CX = 210;
const FEET = 538;

/** a hex colour times a brightness factor (below 1 darker, above 1 lighter), as an rgb() string */
const tone = (hex: string, f: number): string => {
  const n = parseInt(hex.slice(1), 16);
  const c = (s: number): number => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return `rgb(${c(16)} ${c(8)} ${c(0)})`;
};
const fill = (g: G, c: string | CanvasGradient): void => {
  g.fillStyle = c;
};
function poly(g: G, c: string, pts: [number, number][]): void {
  fill(g, c);
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
}
/** a polygon shaded from light (upper left) to dark (lower right) */
function gpoly(g: G, hex: string, pts: [number, number][], hi = 1.25, lo = 0.7): void {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const gr = g.createLinearGradient(
    Math.min(...xs),
    Math.min(...ys),
    Math.max(...xs),
    Math.max(...ys),
  );
  gr.addColorStop(0, tone(hex, hi));
  gr.addColorStop(1, tone(hex, lo));
  fill(g, gr);
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
}
function ell(g: G, c: string, x: number, y: number, rx: number, ry: number, rot = 0): void {
  fill(g, c);
  g.beginPath();
  g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  g.fill();
}
/** a shaded ellipse */
function gell(
  g: G,
  hex: string,
  x: number,
  y: number,
  rx: number,
  ry: number,
  hi = 1.25,
  lo = 0.7,
): void {
  const gr = g.createLinearGradient(x - rx, y - ry, x + rx, y + ry);
  gr.addColorStop(0, tone(hex, hi));
  gr.addColorStop(1, tone(hex, lo));
  fill(g, gr);
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}
function limb(g: G, c: string, x1: number, y1: number, x2: number, y2: number, w: number): void {
  g.strokeStyle = c;
  g.lineWidth = w;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}
/** a limb with a dark underside and a lit top, so it reads round */
function limb2(g: G, hex: string, x1: number, y1: number, x2: number, y2: number, w: number): void {
  limb(g, tone(hex, 0.68), x1, y1, x2, y2, w);
  limb(g, tone(hex, 1.05), x1 - w * 0.1, y1 - w * 0.08, x2 - w * 0.1, y2 - w * 0.08, w * 0.68);
}
function rect(g: G, c: string, x: number, y: number, w: number, h: number, r = 0): void {
  fill(g, c);
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}
function grect(g: G, hex: string, x: number, y: number, w: number, h: number, r = 0): void {
  const gr = g.createLinearGradient(x, y, x + w, y + h);
  gr.addColorStop(0, tone(hex, 1.25));
  gr.addColorStop(1, tone(hex, 0.7));
  fill(g, gr);
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}
function line(g: G, c: string, w: number, pts: [number, number][]): void {
  g.strokeStyle = c;
  g.lineWidth = w;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
}
/** soft additive light on the effects layer */
function glow(g: G, c: string, x: number, y: number, r: number, a = 0.8): void {
  g.save();
  g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, c.replace(')', ` / ${a})`));
  gr.addColorStop(1, c.replace(')', ' / 0)'));
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
}
const glowHex = (g: G, hex: string, x: number, y: number, r: number, a = 0.8): void => {
  const n = parseInt(hex.slice(1), 16);
  glow(g, `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255})`, x, y, r, a);
};
/** a head: shaded skin, a darker jaw, a lit brow */
function head(g: G, skin: string, x: number, y: number, rx: number, ry: number): void {
  gell(g, skin, x, y, rx, ry, 1.18, 0.78);
  g.save();
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.clip();
  ell(g, 'rgba(60,20,30,0.16)', x + rx * 0.3, y + ry * 0.55, rx * 0.9, ry * 0.55);
  g.restore();
}
/** two eyes with a bright iris */
function eyes(g: G, x: number, y: number, gap: number, iris: string, r = 4.5): void {
  for (const s of [-1, 1]) {
    ell(g, '#fff6ea', x + s * gap, y, r + 2, r, 0);
    ell(g, iris, x + s * gap + 0.5, y, r * 0.62, r * 0.78);
    ell(g, '#14101c', x + s * gap + 0.5, y, r * 0.3, r * 0.4);
  }
}
/** a five-pointed (or any n) star centred at x, y */
function star(g: G, c: string, x: number, y: number, rOut: number, rIn: number, n = 5): void {
  poly(
    g,
    c,
    Array.from({ length: n * 2 }, (_, i): [number, number] => {
      const a = -Math.PI / 2 + (i * Math.PI) / n;
      const r = i % 2 ? rIn : rOut;
      return [x + r * Math.cos(a), y + r * Math.sin(a)];
    }),
  );
}
/** one light from the upper left over everything painted so far */
function light(g: G): void {
  g.save();
  g.globalCompositeOperation = 'source-atop';
  const cw = g.canvas.width;
  const ch = g.canvas.height;
  const gr = g.createLinearGradient(cw * 0.1, ch * 0.07, cw * 0.9, ch);
  gr.addColorStop(0, 'rgba(255,255,255,0.2)');
  gr.addColorStop(0.45, 'rgba(255,255,255,0)');
  gr.addColorStop(1, 'rgba(0,0,0,0.34)');
  g.fillStyle = gr;
  g.fillRect(0, 0, cw, ch);
  g.restore();
}
/** a dark outline all the way round the painted figure, so every silhouette reads against any floor */
function outline(c: HTMLCanvasElement, px = 3.5): void {
  const t = document.createElement('canvas');
  t.width = c.width;
  t.height = c.height;
  const tg = t.getContext('2d');
  const g = c.getContext('2d');
  if (!tg || !g) return;
  tg.drawImage(c, 0, 0);
  tg.globalCompositeOperation = 'source-in';
  tg.fillStyle = '#0a0716';
  tg.fillRect(0, 0, c.width, c.height);
  g.save();
  g.globalCompositeOperation = 'destination-over';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    g.drawImage(t, Math.cos(a) * px, Math.sin(a) * px);
  }
  g.restore();
}
/**
 * a thin back light along the right-hand edge of the figure, in the hero's own colour, so the silhouette lifts off a dark
 * stage the way a lit character model does (the key light is upper left, see light())
 */
function rimLight(c: HTMLCanvasElement, hex: string, px = 5): void {
  const t = document.createElement('canvas');
  t.width = c.width;
  t.height = c.height;
  const tg = t.getContext('2d');
  const g = c.getContext('2d');
  if (!tg || !g) return;
  // the figure's shape, minus itself shifted left and down a little: what is left is the upper-right edge
  tg.drawImage(c, 0, 0);
  tg.globalCompositeOperation = 'destination-out';
  tg.drawImage(c, -px, px * 0.6);
  tg.globalCompositeOperation = 'source-in';
  const n = parseInt(hex.slice(1), 16);
  const rgb = `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  // strongest at the shoulders, fading towards the feet
  const gr = tg.createLinearGradient(0, 0, 0, c.height);
  gr.addColorStop(0, `rgba(${rgb},0.85)`);
  gr.addColorStop(0.6, `rgba(${rgb},0.5)`);
  gr.addColorStop(1, `rgba(${rgb},0.1)`);
  tg.fillStyle = gr;
  tg.fillRect(0, 0, c.width, c.height);
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.drawImage(t, 0, 0);
  g.restore();
}
function groundShadow(g: G, rx: number): void {
  g.save();
  g.globalCompositeOperation = 'destination-over';
  const gr = g.createRadialGradient(CX, FEET + 3, 4, CX, FEET + 3, rx);
  gr.addColorStop(0, 'rgba(0,0,0,0.6)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.save();
  g.translate(0, FEET + 3);
  g.scale(1, 0.16);
  g.translate(0, -(FEET + 3));
  g.fillRect(CX - rx, FEET - rx, rx * 2, rx * 2);
  g.restore();
  g.restore();
}

/** `g` is the body (shaded and outlined); `fx` is an additive layer drawn over it for glows */
type Painter = (g: G, fx: G) => void;

// ---- Valeria (id knight): a female knight in dawn-gold plate, a blue cape, a sunburst shield and a longsword ----
const knight: Painter = (g, fx) => {
  // cape
  gpoly(
    g,
    '#27387a',
    [
      [172, 236],
      [262, 236],
      [326, 470],
      [304, 508],
      [240, 494],
      [146, 504],
    ],
    1.3,
    0.55,
  );
  // legs: greaves, knee cops, sabatons
  limb2(g, '#7f8eb0', 190, 402, 182, FEET - 14, 36);
  limb2(g, '#7f8eb0', 236, 402, 246, FEET - 14, 36);
  gell(g, '#cdd6ee', 186, 452, 21, 16);
  gell(g, '#cdd6ee', 242, 452, 21, 16);
  gpoly(
    g,
    '#3c4668',
    [
      [150, FEET],
      [156, FEET - 28],
      [210, FEET - 28],
      [216, FEET - 6],
      [204, FEET],
    ],
    1.35,
    0.7,
  );
  gpoly(
    g,
    '#3c4668',
    [
      [220, FEET],
      [222, FEET - 28],
      [276, FEET - 28],
      [282, FEET - 6],
      [270, FEET],
    ],
    1.35,
    0.7,
  );
  // tabard over a mail skirt
  gpoly(
    g,
    '#efe0b0',
    [
      [154, 254],
      [268, 254],
      [290, 440],
      [132, 440],
    ],
    1.12,
    0.72,
  );
  poly(g, '#2d3f8c', [
    [196, 262],
    [226, 262],
    [232, 440],
    [190, 440],
  ]);
  star(g, '#f3d58a', CX, 372, 16, 7, 8);
  rect(g, '#d8b24c', 132, 430, 158, 10, 4);
  // breastplate with a ridge, gorget, belt
  gpoly(
    g,
    '#b4c0de',
    [
      [160, 214],
      [260, 214],
      [274, 332],
      [146, 332],
    ],
    1.3,
    0.7,
  );
  line(g, 'rgba(40,50,90,0.5)', 3, [
    [CX, 222],
    [CX, 330],
  ]);
  line(g, 'rgba(255,255,255,0.35)', 3, [
    [176, 228],
    [166, 318],
  ]);
  gpoly(
    g,
    '#c9d3ec',
    [
      [176, 204],
      [244, 204],
      [250, 226],
      [170, 226],
    ],
    1.2,
    0.7,
  );
  grect(g, '#d8b24c', 148, 328, 124, 18, 6);
  rect(g, '#8a6a2c', 200, 330, 20, 14, 3);
  // pauldrons
  gell(g, '#d3dcf2', 142, 230, 42, 29);
  gell(g, '#d3dcf2', 278, 230, 42, 29);
  line(g, '#d8b24c', 4, [
    [108, 236],
    [142, 214],
    [176, 236],
  ]);
  line(g, '#d8b24c', 4, [
    [244, 236],
    [278, 214],
    [312, 236],
  ]);
  // arms
  limb2(g, '#b4c0de', 118, 252, 100, 338, 30);
  limb2(g, '#b4c0de', 300, 246, 332, 172, 28);
  gell(g, '#7f8eb0', 328, 160, 16, 14);
  // longsword
  gpoly(
    g,
    '#f3f6ff',
    [
      [323, 164],
      [339, 164],
      [343, 24],
      [331, 4],
      [319, 24],
    ],
    1.15,
    0.8,
  );
  line(g, 'rgba(120,140,190,0.6)', 3, [
    [331, 30],
    [331, 158],
  ]);
  grect(g, '#d8b24c', 304, 158, 54, 12, 5);
  rect(g, '#6a4a22', 324, 168, 14, 38, 6);
  gell(g, '#d8b24c', 331, 212, 9, 9);
  // kite shield with a sun
  gpoly(
    g,
    '#d8b24c',
    [
      [38, 248],
      [142, 248],
      [134, 384],
      [90, 446],
      [46, 384],
    ],
    1.25,
    0.75,
  );
  gpoly(
    g,
    '#2d3f8c',
    [
      [48, 258],
      [132, 258],
      [125, 378],
      [90, 430],
      [55, 378],
    ],
    1.35,
    0.6,
  );
  gell(g, '#f3d58a', 90, 322, 22, 22, 1.2, 0.85);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    limb(
      g,
      '#f3d58a',
      90 + 26 * Math.cos(a),
      322 + 26 * Math.sin(a),
      90 + 39 * Math.cos(a),
      322 + 39 * Math.sin(a),
      6,
    );
  }
  gell(g, '#8aa0d0', 100, 258, 8, 5);
  // ash-pale hair swept out behind the helm
  gpoly(
    g,
    '#d9d2e6',
    [
      [168, 150],
      [140, 158],
      [104, 182],
      [72, 232],
      [96, 224],
      [126, 204],
      [168, 196],
    ],
    1.2,
    0.75,
  );
  line(g, 'rgba(120,100,150,0.5)', 3, [
    [150, 164],
    [110, 196],
    [90, 224],
  ]);
  // helm: dome, visor slit, cheek guards, plume
  gpoly(
    g,
    '#cdd6ee',
    [
      [164, 182],
      [166, 142],
      [CX, 120],
      [254, 142],
      [256, 182],
      [246, 218],
      [CX, 230],
      [174, 218],
    ],
    1.3,
    0.72,
  );
  rect(g, '#1a1f38', 176, 168, 68, 11, 4);
  rect(g, '#1a1f38', 205, 168, 10, 52, 3);
  line(g, 'rgba(255,255,255,0.4)', 3, [
    [180, 150],
    [200, 134],
  ]);
  poly(g, '#d8b24c', [
    [CX - 6, 124],
    [250, 96],
    [304, 108],
    [330, 142],
    [282, 134],
    [244, 142],
    [CX + 14, 134],
  ]);
  poly(g, '#2d3f8c', [
    [CX + 14, 128],
    [262, 112],
    [296, 124],
    [262, 130],
  ]);
  glowHex(fx, '#f3d58a', 90, 322, 80, 0.5);
  glowHex(fx, '#fff2c8', 331, 70, 60, 0.18);
};

// ---- Rivet: a female engineer in grease-stained overalls and a leather apron, goggles, a wrench and a little drone ----
const engineer: Painter = (g, fx) => {
  // backpack with pipes and a tank
  grect(g, '#5a4636', 92, 228, 74, 150, 16);
  grect(g, '#8aa0b0', 96, 198, 26, 70, 11);
  line(g, '#8aa0b0', 8, [
    [136, 254],
    [136, 206],
    [158, 192],
  ]);
  ell(g, '#e08a3a', 110, 238, 6, 6);
  // a long ponytail swinging out behind her
  gpoly(
    g,
    '#6a3a22',
    [
      [236, 120],
      [286, 116],
      [326, 160],
      [334, 232],
      [310, 200],
      [276, 162],
      [244, 160],
    ],
    1.3,
    0.65,
  );
  gell(g, '#f2c14e', 246, 150, 9, 9);
  // legs and boots
  limb2(g, '#2c5f78', 192, 410, 188, FEET - 12, 36);
  limb2(g, '#2c5f78', 236, 410, 240, FEET - 12, 36);
  gpoly(
    g,
    '#3a3a44',
    [
      [154, FEET],
      [158, FEET - 30],
      [214, FEET - 30],
      [220, FEET - 8],
      [208, FEET],
    ],
    1.4,
    0.7,
  );
  gpoly(
    g,
    '#3a3a44',
    [
      [216, FEET],
      [220, FEET - 30],
      [274, FEET - 30],
      [280, FEET - 8],
      [268, FEET],
    ],
    1.4,
    0.7,
  );
  line(g, '#d9c9a0', 3, [
    [170, FEET - 22],
    [198, FEET - 22],
  ]);
  line(g, '#d9c9a0', 3, [
    [232, FEET - 22],
    [260, FEET - 22],
  ]);
  // overalls: a fitted shirt, a nipped waist and flared hips, a leather apron over the front
  gpoly(
    g,
    '#2c5f78',
    [
      [162, 232],
      [262, 232],
      [250, 330],
      [174, 330],
    ],
    1.3,
    0.7,
  );
  gpoly(
    g,
    '#e08a3a',
    [
      [172, 312],
      [252, 312],
      [276, 440],
      [148, 440],
    ],
    1.25,
    0.7,
  );
  gpoly(
    g,
    '#e08a3a',
    [
      [184, 256],
      [240, 256],
      [244, 320],
      [180, 320],
    ],
    1.25,
    0.7,
  );
  rect(g, '#c06a24', 170, 234, 13, 70, 6);
  rect(g, '#c06a24', 241, 234, 13, 70, 6);
  gell(g, '#f2c14e', 176, 300, 7, 7);
  gell(g, '#f2c14e', 248, 300, 7, 7);
  gpoly(
    g,
    '#7a5232',
    [
      [186, 322],
      [238, 322],
      [246, 436],
      [178, 436],
    ],
    1.25,
    0.65,
  );
  rect(g, '#5a3a22', 196, 350, 32, 28, 4);
  limb(g, '#9aa8b4', 204, 340, 204, 362, 4);
  limb(g, '#e08a3a', 218, 340, 218, 358, 4);
  // grease smears
  ell(g, 'rgba(20,16,12,0.45)', 206, 296, 9, 5, 0.4);
  ell(g, 'rgba(20,16,12,0.4)', 240, 392, 8, 4, -0.3);
  // tool belt with a hammer, a spanner and pouches
  grect(g, '#6a4a2c', 156, 316, 112, 15, 5);
  rect(g, '#d8b24c', CX - 7, 318, 14, 11, 3);
  grect(g, '#5a3a22', 160, 328, 24, 30, 5);
  grect(g, '#5a3a22', 240, 328, 24, 30, 5);
  limb(g, '#9aa8b4', 172, 330, 168, 372, 6);
  limb(g, '#9aa8b4', 252, 330, 256, 366, 6);
  // arms with rolled sleeves and work gloves
  limb2(g, '#2c5f78', 160, 262, 114, 350, 28);
  limb2(g, '#2c5f78', 266, 258, 330, 326, 28);
  rect(g, '#d9c9a0', 100, 336, 28, 12, 5);
  rect(g, '#d9c9a0', 320, 314, 28, 12, 5);
  gell(g, '#8a5a3a', 110, 364, 17, 17);
  gell(g, '#8a5a3a', 336, 342, 17, 17);
  // wrench with an open jaw
  limb(g, '#6a7480', 340, 346, 366, 226, 15);
  limb(g, '#aab6c2', 339, 345, 365, 225, 9);
  gell(g, '#aab6c2', 372, 206, 30, 28);
  poly(g, '#10202a', [
    [362, 176],
    [384, 196],
    [388, 212],
    [366, 198],
  ]);
  ell(g, '#10202a', 392, 204, 10, 12);
  // head: soft face with freckles, a grease smudge, lashes and lips
  head(g, '#ecc4a0', CX, 180, 42, 48);
  for (const [fx2, fy] of [
    [190, 198],
    [198, 202],
    [222, 202],
    [230, 198],
  ] as const)
    ell(g, '#c47a52', fx2, fy, 2, 1.6);
  ell(g, 'rgba(30,24,18,0.45)', 232, 208, 9, 4, 0.3);
  eyes(g, CX, 186, 11, '#4a9ac0', 4.5);
  line(g, '#3a2418', 3, [
    [190, 182],
    [201, 184],
  ]);
  line(g, '#3a2418', 3, [
    [230, 182],
    [219, 184],
  ]);
  ell(g, '#c4506a', CX, 210, 8, 3.4);
  // hair in a bun-and-fringe under a cap, goggles pushed up on the cap
  gpoly(
    g,
    '#6a3a22',
    [
      [168, 186],
      [172, 134],
      [CX, 112],
      [252, 134],
      [256, 186],
      [244, 160],
      [CX, 146],
      [180, 160],
    ],
    1.3,
    0.7,
  );
  gpoly(
    g,
    '#e08a3a',
    [
      [164, 148],
      [260, 148],
      [252, 106],
      [CX, 92],
      [172, 106],
    ],
    1.25,
    0.72,
  );
  rect(g, '#c06a24', 162, 144, 100, 10, 4);
  rect(g, '#2a2c3a', 170, 118, 84, 24, 12);
  rect(g, '#555a6a', 170, 126, 84, 5, 2);
  gell(g, '#9be8ff', 192, 130, 12, 11, 1.4, 0.8);
  gell(g, '#9be8ff', 232, 130, 12, 11, 1.4, 0.8);
  ell(g, 'rgba(255,255,255,0.7)', 188, 126, 3.5, 2.5);
  ell(g, 'rgba(255,255,255,0.7)', 228, 126, 3.5, 2.5);
  // drone with rotors and a lens
  gell(g, '#8aa0b0', 340, 120, 32, 20);
  gell(g, '#cfe6f2', 340, 110, 22, 9, 1.2, 0.9);
  ell(g, '#10202a', 340, 124, 13, 13);
  ell(g, '#36e0ff', 340, 124, 8, 8);
  limb(g, '#cfe6f2', 296, 92, 384, 92, 5);
  limb(g, '#8aa0b0', 340, 100, 340, 92, 6);
  limb(g, '#8aa0b0', 318, 138, 308, 154, 4);
  limb(g, '#8aa0b0', 362, 138, 372, 154, 4);
  glowHex(fx, '#36e0ff', 340, 124, 70, 0.6);
  glowHex(fx, '#9be8ff', 212, 130, 40, 0.18);
};

// ---- Kesh: a hunter in a hooded fur cloak, bow drawn ----
const hunter: Painter = (g, fx) => {
  // quiver with fletched arrows
  grect(g, '#7a3a22', 96, 222, 38, 156, 10);
  for (let i = 0; i < 4; i++) {
    limb(g, '#d9c9a0', 103 + i * 8, 202, 103 + i * 8, 236, 4);
    poly(g, i % 2 ? '#d84a3a' : '#efe6cc', [
      [100 + i * 8, 198],
      [106 + i * 8, 198],
      [103 + i * 8, 212],
    ]);
  }
  // legs, wrapped boots
  limb2(g, '#4a3a2a', 192, 412, 186, FEET - 12, 38);
  limb2(g, '#4a3a2a', 234, 412, 240, FEET - 12, 38);
  gpoly(
    g,
    '#2a2018',
    [
      [154, FEET],
      [160, FEET - 34],
      [212, FEET - 34],
      [216, FEET - 6],
      [204, FEET],
    ],
    1.5,
    0.7,
  );
  gpoly(
    g,
    '#2a2018',
    [
      [220, FEET],
      [224, FEET - 34],
      [276, FEET - 34],
      [284, FEET - 6],
      [272, FEET],
    ],
    1.5,
    0.7,
  );
  for (const x of [170, 238])
    for (let i = 0; i < 3; i++)
      line(g, '#8a6a4a', 3, [
        [x, FEET - 30 + i * 8],
        [x + 36, FEET - 26 + i * 8],
      ]);
  // cloak with folds
  gpoly(
    g,
    '#5d7a4a',
    [
      [148, 240],
      [282, 240],
      [306, 440],
      [126, 440],
    ],
    1.25,
    0.6,
  );
  line(g, 'rgba(20,40,20,0.45)', 4, [
    [190, 270],
    [176, 436],
  ]);
  line(g, 'rgba(20,40,20,0.45)', 4, [
    [240, 270],
    [252, 436],
  ]);
  // fur mantle with a ragged edge
  gpoly(
    g,
    '#8a6a4a',
    [
      [136, 232],
      [294, 232],
      [276, 284],
      [154, 284],
    ],
    1.3,
    0.7,
  );
  for (let i = 0; i < 10; i++)
    poly(g, '#a68360', [
      [142 + i * 16, 276],
      [156 + i * 16, 276],
      [149 + i * 16, 304],
    ]);
  grect(g, '#3a2a1a', 158, 332, 114, 16, 5);
  rect(g, '#d8b24c', CX - 8, 332, 16, 16, 3);
  grect(g, '#5a3a22', 252, 350, 30, 36, 6); // pouch
  // arms with bracers
  limb2(g, '#5d7a4a', 282, 264, 352, 262, 30);
  limb2(g, '#5d7a4a', 160, 264, 232, 288, 28);
  limb(g, '#3a2a1a', 314, 263, 336, 262, 32);
  gell(g, '#d9b894', 354, 262, 14, 14);
  gell(g, '#d9b894', 236, 288, 14, 14);
  // bow: grip, recurved limbs, string, nocked arrow
  g.strokeStyle = '#4a3220';
  g.lineWidth = 12;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(364, 112);
  g.quadraticCurveTo(298, 262, 364, 412);
  g.stroke();
  g.strokeStyle = '#8a6a3c';
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(364, 112);
  g.quadraticCurveTo(298, 262, 364, 412);
  g.stroke();
  rect(g, '#3a2a1a', 336, 244, 22, 36, 5);
  line(g, '#efe6cc', 3, [
    [364, 112],
    [238, 272],
    [364, 412],
  ]);
  limb(g, '#d9c9a0', 238, 272, 394, 262, 5);
  poly(g, '#e8eef4', [
    [402, 262],
    [382, 250],
    [382, 274],
  ]);
  poly(g, '#d84a3a', [
    [244, 270],
    [262, 262],
    [262, 280],
  ]);
  // hood with wolf ears, face in shadow, painted
  gell(g, '#5d7a4a', CX, 178, 56, 60);
  poly(g, '#8a6a4a', [
    [168, 134],
    [172, 80],
    [204, 122],
  ]);
  poly(g, '#8a6a4a', [
    [252, 134],
    [248, 80],
    [216, 122],
  ]);
  poly(g, '#a68360', [
    [174, 120],
    [176, 96],
    [194, 120],
  ]);
  poly(g, '#a68360', [
    [246, 120],
    [244, 96],
    [226, 120],
  ]);
  gpoly(
    g,
    '#8a6a4a',
    [
      [158, 168],
      [262, 168],
      [254, 150],
      [CX, 138],
      [166, 150],
    ],
    1.2,
    0.7,
  );
  ell(g, '#1c140e', CX, 192, 34, 36);
  ell(g, '#d8b894', CX, 206, 24, 20);
  rect(g, '#1c140e', 180, 186, 60, 12, 5);
  eyes(g, CX, 190, 13, '#ffb36a', 4);
  line(g, '#d84a3a', 3, [
    [190, 204],
    [186, 218],
  ]);
  line(g, '#d84a3a', 3, [
    [230, 204],
    [234, 218],
  ]);
  glowHex(fx, '#ffb36a', CX, 190, 40, 0.4);
};

// ---- Vesper: a slim trapper in a long cloak, a wide hat and a domino mask, a snare at her feet ----
const trapper: Painter = (g, fx) => {
  // long hair behind the cloak
  gpoly(
    g,
    '#241438',
    [
      [168, 160],
      [258, 160],
      [270, 300],
      [190, 320],
      [160, 290],
    ],
    1.3,
    0.6,
  );
  // cloak
  gpoly(
    g,
    '#3a2466',
    [
      [172, 236],
      [250, 236],
      [318, FEET],
      [106, FEET],
    ],
    1.3,
    0.55,
  );
  gpoly(
    g,
    '#1c0f33',
    [
      [194, 252],
      [228, 252],
      [256, FEET],
      [166, FEET],
    ],
    1.2,
    0.6,
  );
  line(g, 'rgba(160,120,230,0.35)', 3, [
    [140, 480],
    [186, 270],
  ]);
  line(g, 'rgba(160,120,230,0.35)', 3, [
    [290, 480],
    [240, 270],
  ]);
  // fitted bodice and high collar
  gpoly(
    g,
    '#2a1a4a',
    [
      [180, 238],
      [242, 238],
      [236, 340],
      [186, 340],
    ],
    1.3,
    0.7,
  );
  rect(g, '#b99aff', 184, 338, 52, 6, 3);
  gpoly(
    g,
    '#5a3a98',
    [
      [148, 228],
      [272, 228],
      [256, 276],
      [166, 276],
    ],
    1.3,
    0.7,
  );
  poly(g, '#251540', [
    [176, 214],
    [CX, 238],
    [244, 214],
    [236, 244],
    [184, 244],
  ]);
  // arms in black leather gloves with violet cuffs
  limb2(g, '#251540', 170, 262, 132, 372, 24);
  limb2(g, '#251540', 252, 262, 300, 352, 24);
  rect(g, '#b99aff', 118, 360, 22, 6, 2);
  rect(g, '#b99aff', 293, 338, 22, 6, 2);
  gell(g, '#1a1024', 128, 382, 14, 15, 1.8, 0.6);
  gell(g, '#1a1024', 304, 360, 14, 15, 1.8, 0.6);
  // wire coil
  g.strokeStyle = '#cfd6dc';
  g.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.ellipse(306, 362, 32 - i * 3, 14 - i, 0, 0, Math.PI * 2);
    g.stroke();
  }
  // a toothed snare at her feet
  g.strokeStyle = '#8a8fa0';
  g.lineWidth = 8;
  g.beginPath();
  g.arc(92, FEET - 14, 40, Math.PI, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 7; i++)
    poly(g, '#e3e8ee', [
      [54 + i * 12, FEET - 14],
      [60 + i * 12, FEET - 40],
      [66 + i * 12, FEET - 14],
    ]);
  // head: pale face, domino mask, a sly red smirk, dark hair framing the face
  head(g, '#e2ccc4', CX, 190, 36, 44);
  line(g, '#9a1e3a', 4, [
    [CX - 9, 216],
    [CX + 2, 218],
    [CX + 11, 212],
  ]);
  gpoly(
    g,
    '#1c0f33',
    [
      [172, 160],
      [184, 156],
      [180, 214],
      [168, 236],
    ],
    1.5,
    0.6,
  );
  gpoly(
    g,
    '#1c0f33',
    [
      [248, 160],
      [236, 156],
      [240, 214],
      [252, 236],
    ],
    1.5,
    0.6,
  );
  poly(g, '#1c0f33', [
    [170, 178],
    [250, 178],
    [244, 206],
    [CX, 200],
    [176, 206],
  ]);
  ell(g, '#d8c4ee', 196, 190, 7, 5);
  ell(g, '#d8c4ee', 224, 190, 7, 5);
  ell(g, '#5a2aa0', 197, 190, 3, 4);
  ell(g, '#5a2aa0', 225, 190, 3, 4);
  // the hat brim throws a shadow over her brow
  ell(g, 'rgba(20,8,36,0.35)', CX, 160, 40, 10);
  // hat: wide brim, crown, band, a drooping feather
  gell(g, '#251540', CX, 144, 90, 18, 1.4, 0.6);
  gpoly(
    g,
    '#251540',
    [
      [160, 146],
      [260, 146],
      [250, 78],
      [170, 78],
    ],
    1.4,
    0.65,
  );
  rect(g, '#b99aff', 166, 124, 88, 9, 3);
  poly(g, '#b99aff', [
    [250, 110],
    [320, 138],
    [300, 160],
    [256, 130],
  ]);
  glowHex(fx, '#b99aff', 196, 190, 30, 0.45);
  glowHex(fx, '#b99aff', 224, 190, 30, 0.45);
};

// ---- Sylas: a female assassin in a crimson hood and veil, a dagger in each hand, mid-lunge ----
const assassin: Painter = (g, fx) => {
  // cloak tails and a whipping ponytail behind her
  gpoly(
    g,
    '#5a1426',
    [
      [210, 250],
      [262, 262],
      [330, 430],
      [290, 470],
      [236, 400],
    ],
    1.3,
    0.55,
  );
  gpoly(
    g,
    '#8a1f33',
    [
      [244, 132],
      [276, 124],
      [308, 148],
      [330, 204],
      [336, 270],
      [316, 246],
      [298, 196],
      [266, 168],
      [250, 162],
    ],
    1.25,
    0.7,
  );
  poly(g, '#d0283f', [
    [244, 142],
    [262, 138],
    [266, 156],
    [248, 158],
  ]);
  // back leg (stretched behind), front leg (bent forward)
  limb2(g, '#241c2c', 236, 396, 282, FEET - 14, 30);
  gpoly(
    g,
    '#14101c',
    [
      [262, FEET],
      [266, FEET - 28],
      [316, FEET - 22],
      [320, FEET - 2],
      [306, FEET],
    ],
    1.5,
    0.7,
  );
  limb2(g, '#241c2c', 198, 392, 146, 460, 32);
  limb2(g, '#241c2c', 146, 460, 156, FEET - 14, 28);
  gpoly(
    g,
    '#14101c',
    [
      [112, FEET],
      [118, FEET - 30],
      [172, FEET - 26],
      [178, FEET - 4],
      [164, FEET],
    ],
    1.5,
    0.7,
  );
  rect(g, '#7a1a2e', 134, 442, 34, 12, 4); // knee wrap
  // slim torso: corset, waist sash and a short layered skirt
  gpoly(
    g,
    '#2a2234',
    [
      [184, 236],
      [248, 236],
      [238, 340],
      [196, 340],
    ],
    1.35,
    0.65,
  );
  gpoly(
    g,
    '#d0283f',
    [
      [190, 338],
      [246, 338],
      [262, 420],
      [176, 408],
    ],
    1.2,
    0.65,
  );
  poly(g, '#7a1a2e', [
    [206, 340],
    [224, 340],
    [236, 430],
    [200, 424],
  ]);
  grect(g, '#f2d86e', 190, 330, 56, 9, 4);
  // bandolier of knives across the chest
  limb(g, '#4a2a20', 196, 240, 240, 330, 8);
  for (let i = 0; i < 4; i++)
    poly(g, '#e8eef6', [
      [204 + i * 10, 258 + i * 22],
      [210 + i * 10, 258 + i * 22],
      [208 + i * 10, 274 + i * 22],
    ]);
  // scarf at the neck
  poly(g, '#d0283f', [
    [184, 218],
    [244, 218],
    [234, 246],
    [194, 246],
  ]);
  // arms: front arm up and forward, back arm low and behind
  limb2(g, '#2a2234', 192, 252, 142, 232, 22);
  limb2(g, '#2a2234', 142, 232, 96, 196, 20);
  limb2(g, '#2a2234', 244, 254, 286, 318, 22);
  limb2(g, '#2a2234', 286, 318, 330, 340, 20);
  gell(g, '#e6c8b4', 90, 192, 12, 12);
  gell(g, '#e6c8b4', 334, 342, 12, 12);
  rect(g, '#d0283f', 80, 196, 22, 8, 3);
  rect(g, '#d0283f', 322, 346, 22, 8, 3);
  // daggers: front one held high, back one trailing low
  gpoly(
    g,
    '#f2f6fb',
    [
      [84, 188],
      [96, 188],
      [80, 88],
      [70, 64],
      [66, 92],
    ],
    1.25,
    0.75,
  );
  rect(g, '#7a1a2e', 78, 184, 26, 7, 3);
  gpoly(
    g,
    '#f2f6fb',
    [
      [338, 346],
      [338, 358],
      [396, 396],
      [410, 408],
      [390, 380],
    ],
    1.25,
    0.75,
  );
  rect(g, '#7a1a2e', 330, 344, 10, 18, 3);
  // head: hood, shadowed face, crimson veil over the nose and mouth, ember eyes
  gell(g, '#2a2234', CX, 176, 50, 56, 1.35, 0.6);
  poly(g, '#2a2234', [
    [166, 132],
    [CX - 8, 76],
    [254, 132],
  ]);
  head(g, '#e6c8b4', CX, 188, 32, 38);
  poly(g, '#1a1220', [
    [178, 172],
    [244, 172],
    [244, 196],
    [178, 196],
  ]);
  eyes(g, CX, 184, 12, '#ff5a3a', 4.5);
  // the hood comes down over the brow, with a crimson band across it
  gpoly(
    g,
    '#2a2234',
    [
      [160, 176],
      [164, 126],
      [CX, 88],
      [256, 126],
      [260, 176],
      [246, 170],
      [CX + 4, 160],
      [174, 170],
    ],
    1.35,
    0.6,
  );
  poly(g, '#d0283f', [
    [166, 158],
    [254, 158],
    [252, 146],
    [CX, 138],
    [168, 146],
  ]);
  line(g, '#14101c', 4, [
    [190, 176],
    [200, 180],
  ]);
  line(g, '#14101c', 4, [
    [230, 176],
    [220, 180],
  ]);
  poly(g, '#d0283f', [
    [178, 196],
    [244, 196],
    [236, 224],
    [CX, 232],
    [184, 224],
  ]);
  line(g, 'rgba(255,200,200,0.45)', 3, [
    [186, 204],
    [CX, 214],
    [236, 204],
  ]);
  glowHex(fx, '#ff5a3a', 198, 184, 30, 0.5);
  glowHex(fx, '#ff5a3a', 222, 184, 30, 0.5);
  glowHex(fx, '#ff9aa8', 74, 90, 46, 0.3);
};

// ---- Ilvane: a hulking stone golem, moss on his shoulders and glowing green rune-eyes, who plants carved totems and calls the spirits in them to do his bidding ----
const totemist: Painter = (g, fx) => {
  const STONE = '#8a8478';
  const DARK = '#5a564c';
  const MOSS = '#5f8f4a';
  const GLOW = '#7fd08a';
  // legs: two squat stone pillars on block feet
  grect(g, DARK, 160, 420, 46, 100, 8);
  grect(g, DARK, 216, 420, 46, 100, 8);
  gpoly(
    g,
    '#6a665c',
    [
      [140, FEET],
      [150, FEET - 28],
      [212, FEET - 28],
      [216, FEET],
    ],
    1.3,
    0.65,
  );
  gpoly(
    g,
    '#6a665c',
    [
      [206, FEET],
      [210, FEET - 28],
      [272, FEET - 28],
      [282, FEET],
    ],
    1.3,
    0.65,
  );
  line(g, '#3a362e', 3, [
    [160, 470],
    [206, 470],
  ]);
  line(g, '#3a362e', 3, [
    [216, 470],
    [262, 470],
  ]);
  // a loincloth of woven bark and two little hanging totems at the belt
  gpoly(
    g,
    '#6a4a2a',
    [
      [166, 396],
      [256, 396],
      [248, 470],
      [CX, 482],
      [174, 470],
    ],
    1.2,
    0.6,
  );
  for (const x of [186, 236]) {
    grect(g, '#8a5a2a', x - 7, 408, 14, 40, 3);
    line(g, '#3a2410', 2, [
      [x - 6, 420],
      [x + 6, 420],
    ]);
    line(g, '#3a2410', 2, [
      [x - 6, 432],
      [x + 6, 432],
    ]);
    glowHex(fx, GLOW, x, 428, 18, 0.35);
  }
  // torso: a wide chest of stacked slabs, narrowing to a thick waist
  gpoly(
    g,
    STONE,
    [
      [112, 232],
      [CX, 214],
      [308, 232],
      [286, 330],
      [262, 400],
      [158, 400],
      [134, 330],
    ],
    1.35,
    0.6,
  );
  for (const y of [268, 312, 352]) {
    line(g, '#3a362e', 3, [
      [124 + (y - 232) * 0.12, y],
      [CX, y + 4],
      [296 - (y - 232) * 0.12, y],
    ]);
  }
  line(g, '#3a362e', 3, [
    [CX, 224],
    [CX, 396],
  ]);
  // glowing carved glyphs on the chest: three stacked marks, one per spirit
  for (const [x, y] of [
    [CX - 38, 262],
    [CX + 38, 262],
    [CX - 30, 304],
    [CX + 30, 304],
  ] as const) {
    line(g, GLOW, 3, [
      [x - 9, y - 9],
      [x + 9, y - 9],
      [x, y + 9],
      [x - 9, y - 9],
    ]);
    glowHex(fx, GLOW, x, y, 22, 0.45);
  }
  ell(g, GLOW, CX, 290, 11, 14);
  ell(g, '#d8ffd8', CX, 288, 5, 7);
  glowHex(fx, GLOW, CX, 290, 60, 0.6);
  // moss clinging to the shoulders and chest
  for (const [x, y, rx, ry] of [
    [140, 226, 34, 12],
    [286, 228, 32, 11],
    [168, 256, 20, 8],
    [270, 330, 18, 9],
    [150, 344, 16, 8],
  ] as const)
    gell(g, MOSS, x, y, rx, ry, 1.2, 0.7);
  // shoulders: great boulders
  gell(g, STONE, 118, 240, 46, 40, 1.35, 0.6);
  gell(g, STONE, 302, 240, 46, 40, 1.35, 0.6);
  line(g, '#3a362e', 3, [
    [90, 230],
    [118, 246],
    [102, 270],
  ]);
  line(g, '#3a362e', 3, [
    [330, 230],
    [304, 250],
    [322, 272],
  ]);
  // arms: thick stone limbs, the right fist wrapped round a planted totem pole, the left held open
  limb2(g, STONE, 108, 262, 84, 380, 46);
  gell(g, '#9a948a', 80, 400, 30, 28, 1.3, 0.65);
  for (const dx of [-14, 0, 14])
    line(g, '#3a362e', 2.5, [
      [80 + dx, 386],
      [80 + dx, 412],
    ]);
  limb2(g, STONE, 312, 262, 338, 346, 46);
  gell(g, '#9a948a', 340, 366, 30, 28, 1.3, 0.65);
  // the totem pole in his right hand: carved bands (hawk, bear, owl) topped with wings
  grect(g, '#8a5a2a', 330, 64, 22, 348, 5);
  grect(g, '#a8702e', 326, 150, 30, 70, 6);
  grect(g, '#7a4a22', 326, 232, 30, 70, 6);
  grect(g, '#a8702e', 326, 314, 30, 60, 6);
  // hawk head and wings at the top
  gpoly(
    g,
    '#a8702e',
    [
      [341, 40],
      [354, 62],
      [341, 78],
      [328, 62],
    ],
    1.3,
    0.65,
  );
  gpoly(
    g,
    '#8a5a2a',
    [
      [328, 70],
      [296, 52],
      [286, 90],
      [326, 104],
    ],
    1.3,
    0.65,
  );
  gpoly(
    g,
    '#8a5a2a',
    [
      [354, 70],
      [388, 52],
      [396, 90],
      [356, 104],
    ],
    1.3,
    0.65,
  );
  // faces on the pole: eyes and mouths that glow when the spirits are in
  for (const y of [172, 254, 334]) {
    ell(g, '#2a1808', 334, y, 4, 4.5);
    ell(g, '#2a1808', 348, y, 4, 4.5);
    line(g, '#2a1808', 3, [
      [333, y + 20],
      [349, y + 20],
    ]);
    glowHex(fx, GLOW, 334, y, 10, 0.8);
    glowHex(fx, GLOW, 348, y, 10, 0.8);
  }
  glowHex(fx, GLOW, 341, 60, 24, 0.7);
  // spirits drawn out of the totems: pale, half-seen shapes drifting round him
  fx.save();
  fx.globalCompositeOperation = 'lighter';
  fx.fillStyle = 'rgba(127,208,138,0.35)';
  fx.beginPath();
  fx.moveTo(262, 64);
  fx.lineTo(296, 36);
  fx.lineTo(318, 56);
  fx.lineTo(300, 70);
  fx.lineTo(312, 92);
  fx.lineTo(282, 84);
  fx.closePath();
  fx.fill();
  fx.fillStyle = 'rgba(160,230,200,0.28)';
  fx.beginPath();
  fx.ellipse(388, 250, 22, 34, -0.2, 0, Math.PI * 2);
  fx.fill();
  fx.beginPath();
  fx.arc(380, 214, 12, 0, Math.PI * 2);
  fx.fill();
  fx.fillStyle = 'rgba(190,255,210,0.5)';
  fx.beginPath();
  fx.arc(376, 212, 3, 0, Math.PI * 2);
  fx.arc(386, 212, 3, 0, Math.PI * 2);
  fx.fill();
  fx.restore();
  // head: a small, heavy block sunk between the shoulders, carved brow, glowing eye slits, a mossy crown
  gpoly(
    g,
    STONE,
    [
      [174, 186],
      [186, 140],
      [236, 140],
      [248, 186],
      [238, 218],
      [184, 218],
    ],
    1.4,
    0.6,
  );
  poly(g, '#3a362e', [
    [182, 164],
    [240, 164],
    [240, 174],
    [182, 174],
  ]);
  line(g, '#3a362e', 3, [
    [196, 204],
    [226, 204],
  ]);
  line(g, '#3a362e', 2, [
    [210, 176],
    [210, 200],
  ]);
  ell(g, GLOW, 198, 169, 9, 3.5);
  ell(g, GLOW, 224, 169, 9, 3.5);
  glowHex(fx, GLOW, 198, 169, 22, 0.9);
  glowHex(fx, GLOW, 224, 169, 22, 0.9);
  gell(g, MOSS, 204, 140, 30, 11, 1.2, 0.7);
  gell(g, MOSS, 226, 148, 14, 7, 1.2, 0.7);
  glowHex(fx, '#5a8a3a', CX, 420, 150, 0.1);
};

// ---- Sehra: a barbarian, bare to the waist, braided beard, fists wrapped, in a roaring stance ----
const barbarian: Painter = (g, fx) => {
  // fur cloak behind
  gpoly(
    g,
    '#5a3a22',
    [
      [150, 216],
      [282, 216],
      [330, 400],
      [100, 400],
    ],
    1.2,
    0.6,
  );
  for (let i = 0; i < 11; i++)
    poly(g, '#7a5232', [
      [100 + i * 22, 392],
      [118 + i * 22, 392],
      [109 + i * 22, 424],
    ]);
  // legs, bound boots
  limb2(g, '#8a4a22', 180, 402, 160, FEET - 12, 46);
  limb2(g, '#8a4a22', 246, 402, 272, FEET - 12, 46);
  gpoly(
    g,
    '#3a2418',
    [
      [124, FEET],
      [130, FEET - 36],
      [190, FEET - 36],
      [194, FEET - 6],
      [180, FEET],
    ],
    1.5,
    0.7,
  );
  gpoly(
    g,
    '#3a2418',
    [
      [246, FEET],
      [250, FEET - 36],
      [312, FEET - 36],
      [318, FEET - 6],
      [304, FEET],
    ],
    1.5,
    0.7,
  );
  for (const x of [134, 258])
    for (let i = 0; i < 3; i++)
      line(g, '#a88a60', 3, [
        [x, FEET - 32 + i * 8],
        [x + 48, FEET - 28 + i * 8],
      ]);
  // fur loincloth
  gpoly(
    g,
    '#5a3a22',
    [
      [146, 366],
      [284, 366],
      [298, 456],
      [132, 456],
    ],
    1.25,
    0.65,
  );
  for (let i = 0; i < 8; i++)
    poly(g, '#7a5232', [
      [132 + i * 21, 448],
      [146 + i * 21, 448],
      [139 + i * 21, 478],
    ]);
  // torso: broad chest, abs, shoulders
  gell(g, '#d89a6a', CX, 290, 92, 102, 1.2, 0.72);
  gell(g, '#d89a6a', 128, 232, 46, 40);
  gell(g, '#d89a6a', 294, 232, 46, 40);
  line(g, 'rgba(110,50,30,0.5)', 4, [
    [CX, 232],
    [CX, 356],
  ]);
  for (const y of [300, 322, 344]) {
    line(g, 'rgba(110,50,30,0.4)', 3, [
      [CX - 26, y],
      [CX - 4, y + 3],
    ]);
    line(g, 'rgba(110,50,30,0.4)', 3, [
      [CX + 4, y + 3],
      [CX + 26, y],
    ]);
  }
  line(g, 'rgba(110,50,30,0.45)', 4, [
    [CX - 62, 266],
    [CX - 8, 278],
  ]);
  line(g, 'rgba(110,50,30,0.45)', 4, [
    [CX + 62, 266],
    [CX + 8, 278],
  ]);
  // war tattoos and a scar
  line(g, '#2a3a5a', 4, [
    [158, 250],
    [176, 274],
    [160, 294],
  ]);
  line(g, '#2a3a5a', 4, [
    [262, 250],
    [246, 274],
    [262, 294],
  ]);
  line(g, '#a8503a', 3, [
    [236, 262],
    [262, 306],
  ]);
  // belt with a skull buckle
  grect(g, '#3a2418', 144, 352, 138, 20, 6);
  gell(g, '#e8dcc0', CX, 362, 12, 11);
  rect(g, '#14101c', CX - 6, 358, 4, 5, 1);
  rect(g, '#14101c', CX + 2, 358, 4, 5, 1);
  // fur pauldron on one shoulder
  gpoly(
    g,
    '#7a5232',
    [
      [84, 220],
      [168, 206],
      [170, 252],
      [96, 256],
    ],
    1.25,
    0.7,
  );
  for (let i = 0; i < 4; i++)
    poly(g, '#a68360', [
      [90 + i * 20, 250],
      [104 + i * 20, 250],
      [97 + i * 20, 274],
    ]);
  // arms with bracers, wrapped fists
  limb2(g, '#d89a6a', 124, 252, 84, 340, 44);
  limb2(g, '#d89a6a', 298, 252, 348, 330, 44);
  grect(g, '#3a2418', 70, 316, 36, 24, 6);
  grect(g, '#3a2418', 326, 300, 36, 24, 6);
  gell(g, '#efe2c8', 78, 360, 29, 29, 1.1, 0.8);
  gell(g, '#efe2c8', 352, 350, 29, 29, 1.1, 0.8);
  g.strokeStyle = '#a88a60';
  g.lineWidth = 3;
  for (let i = -2; i <= 2; i++) {
    g.beginPath();
    g.moveTo(54, 360 + i * 8);
    g.lineTo(102, 356 + i * 8);
    g.stroke();
  }
  // head: wild hair, braided beard, war paint, a glare
  head(g, '#d89a6a', CX, 170, 40, 46);
  poly(g, '#2a1a12', [
    [160, 164],
    [170, 100],
    [210, 80],
    [250, 100],
    [262, 164],
    [244, 134],
    [212, 124],
    [176, 134],
  ]);
  limb(g, '#2a1a12', 168, 140, 124, 204, 18);
  limb(g, '#2a1a12', 254, 140, 298, 214, 18);
  line(g, '#d8b24c', 5, [
    [130, 196],
    [136, 206],
  ]);
  // eyebrows and eyes
  line(g, '#1a0e08', 6, [
    [184, 154],
    [204, 162],
  ]);
  line(g, '#1a0e08', 6, [
    [238, 154],
    [218, 162],
  ]);
  ell(g, '#fff0d0', 196, 168, 5, 3.5);
  ell(g, '#fff0d0', 226, 168, 5, 3.5);
  ell(g, '#2a1a12', 197, 168, 2.5, 3);
  ell(g, '#2a1a12', 227, 168, 2.5, 3);
  rect(g, '#c0302a', 184, 178, 52, 7, 3);
  rect(g, '#c0302a', 198, 190, 8, 20, 3);
  // beard with two braids
  gpoly(
    g,
    '#2a1a12',
    [
      [172, 196],
      [250, 196],
      [244, 236],
      [CX, 256],
      [178, 236],
    ],
    1.25,
    0.7,
  );
  for (const [bx, s] of [
    [198, -1],
    [224, 1],
  ] as const) {
    for (let i = 0; i < 4; i++) ell(g, '#3a2418', bx + s * 3 * (i % 2), 244 + i * 12, 6, 7);
    ell(g, '#d8b24c', bx, 294, 5, 5);
  }
  line(g, '#6a3a22', 4, [
    [198, 220],
    [222, 220],
  ]);
  glowHex(fx, '#ffb060', CX, 290, 150, 0.22);
};

// ---- Obsidia (id spellblade): a female obsidian spellblade, a villain in black glass with ember-lit cracks and a crown of shards. Her blade floats beside her only while she holds it (see obsidianBlade) ----
const OBS_EMBER = '#ff8a3a';
const OBS_HOT = '#ffc890';
const spellblade: Painter = (g, fx) => {
  // a torn cape of glass shards flaring out behind her
  gpoly(
    g,
    '#1a1026',
    [
      [158, 206],
      [262, 206],
      [316, 318],
      [350, 452],
      [330, 500],
      [306, 462],
      [286, 524],
      [254, 478],
      [226, 536],
      [196, 480],
      [164, 526],
      [140, 466],
      [112, 506],
      [96, 448],
      [70, 462],
      [104, 322],
    ],
    1.3,
    0.55,
  );
  for (const pts of [
    [
      [210, 250],
      [204, 330],
      [214, 410],
      [208, 500],
    ],
    [
      [170, 270],
      [150, 350],
      [132, 440],
    ],
    [
      [252, 270],
      [274, 350],
      [296, 440],
    ],
  ] as [number, number][][])
    line(g, OBS_EMBER, 2.5, pts);
  // legs: black greaves with a violet sheen, spiked sabatons
  limb2(g, '#251838', 194, 418, 188, FEET - 14, 30);
  limb2(g, '#251838', 232, 418, 240, FEET - 14, 30);
  gpoly(
    g,
    '#150d22',
    [
      [150, FEET],
      [164, FEET - 44],
      [208, FEET - 42],
      [214, FEET - 6],
      [196, FEET],
    ],
    1.4,
    0.65,
  );
  gpoly(
    g,
    '#150d22',
    [
      [218, FEET],
      [226, FEET - 42],
      [268, FEET - 44],
      [292, FEET - 6],
      [270, FEET],
    ],
    1.4,
    0.65,
  );
  line(g, OBS_EMBER, 2.5, [
    [166, FEET - 40],
    [206, FEET - 38],
  ]);
  line(g, OBS_EMBER, 2.5, [
    [228, FEET - 38],
    [266, FEET - 40],
  ]);
  // tassets: hanging plates of black glass from the waist, each a sharp shard
  const plates: [number, number, number][] = [
    [150, 342, 458],
    [172, 346, 482],
    [194, 348, 500],
    [CX, 350, 508],
    [226, 348, 500],
    [248, 346, 482],
    [270, 342, 458],
  ];
  for (const [x, y0, y1] of plates)
    gpoly(
      g,
      '#20142f',
      [
        [x - 17, y0],
        [x + 17, y0],
        [x + 5, y1 - 30],
        [x, y1],
        [x - 5, y1 - 30],
      ],
      1.45,
      0.6,
    );
  // cuirass: nipped waist, a sharp collar, a glowing ember core
  gpoly(
    g,
    '#2a1b3e',
    [
      [172, 232],
      [250, 232],
      [244, 292],
      [236, 352],
      [184, 352],
      [176, 292],
    ],
    1.5,
    0.6,
  );
  poly(g, '#150d22', [
    [188, 236],
    [CX, 262],
    [232, 236],
    [226, 300],
    [CX, 344],
    [194, 300],
  ]);
  line(g, '#7a5ab0', 2, [
    [178, 240],
    [186, 300],
    [190, 350],
  ]);
  line(g, OBS_EMBER, 2.5, [
    [CX, 262],
    [CX, 300],
    [CX - 10, 332],
  ]);
  line(g, OBS_EMBER, 2, [
    [CX, 300],
    [CX + 14, 326],
  ]);
  ell(g, OBS_HOT, CX, 286, 9, 11);
  ell(g, OBS_EMBER, CX, 286, 6, 8);
  grect(g, '#150d22', 180, 342, 60, 12, 5);
  // pauldrons: great spiked shards, the far one a little smaller
  gpoly(
    g,
    '#2a1b3e',
    [
      [166, 230],
      [132, 214],
      [136, 150],
      [118, 112],
      [158, 142],
      [182, 190],
      [196, 232],
    ],
    1.5,
    0.55,
  );
  gpoly(
    g,
    '#2a1b3e',
    [
      [254, 230],
      [292, 214],
      [286, 160],
      [304, 126],
      [266, 150],
      [244, 192],
      [226, 232],
    ],
    1.5,
    0.55,
  );
  line(g, OBS_EMBER, 2, [
    [158, 226],
    [140, 190],
    [128, 134],
  ]);
  line(g, OBS_EMBER, 2, [
    [262, 226],
    [282, 190],
    [296, 146],
  ]);
  // arms: the near hand lifted, palm open to hold the floating blade; the other at her side
  limb2(g, '#251838', 176, 252, 132, 336, 22);
  limb2(g, '#251838', 246, 252, 300, 214, 22);
  gpoly(
    g,
    '#150d22',
    [
      [112, 330],
      [150, 322],
      [152, 352],
      [118, 360],
    ],
    1.5,
    0.7,
  );
  gpoly(
    g,
    '#150d22',
    [
      [290, 200],
      [326, 198],
      [328, 228],
      [296, 232],
    ],
    1.5,
    0.7,
  );
  // obsidian gauntlets, clawed, an ember glowing in the open palm
  gell(g, '#2a1a3a', 126, 366, 13, 14, 1.7, 0.6);
  gell(g, '#2a1a3a', 326, 190, 13, 14, 1.7, 0.6);
  ell(g, OBS_EMBER, 326, 192, 5, 4);
  for (const [x, y] of [
    [118, 380],
    [128, 384],
    [138, 380],
  ] as const)
    poly(g, '#150d22', [
      [x - 3, y - 6],
      [x + 3, y - 6],
      [x, y + 12],
    ]);
  for (const [x, y] of [
    [316, 176],
    [326, 172],
    [336, 176],
  ] as const)
    poly(g, '#150d22', [
      [x - 3, y + 6],
      [x + 3, y + 6],
      [x, y - 10],
    ]);
  // head: an ashen face with hollow cheeks, a sweep of black hair with a violet sheen, a crown of obsidian shards
  head(g, '#b8a4c0', CX, 182, 31, 40);
  // hollow cheeks and a sharp jaw
  poly(g, 'rgba(40,14,50,0.32)', [
    [184, 192],
    [194, 206],
    [204, 218],
    [190, 214],
  ]);
  poly(g, 'rgba(40,14,50,0.32)', [
    [236, 192],
    [226, 206],
    [216, 218],
    [230, 214],
  ]);
  gpoly(
    g,
    '#1c1128',
    [
      [166, 188],
      [168, 128],
      [CX, 102],
      [254, 128],
      [256, 188],
      [250, 150],
      [232, 134],
      [CX - 4, 140],
      [196, 142],
      [182, 160],
    ],
    1.6,
    0.55,
  );
  limb(g, '#241636', 174, 150, 154, 250, 16);
  limb(g, '#241636', 246, 150, 270, 262, 16);
  line(g, '#7a5ab0', 2, [
    [186, 128],
    [200, 118],
  ]);
  eyes(g, CX, 186, 12, OBS_EMBER, 4.5);
  line(g, '#150d22', 3, [
    [188, 176],
    [204, 180],
  ]);
  line(g, '#150d22', 3, [
    [232, 176],
    [216, 180],
  ]);
  // dark lips, and an ember crack running from the brow down one cheek, as if the glass in her is breaking through
  ell(g, '#3a1430', CX, 208, 8, 3.2);
  line(g, '#1a0c18', 2.5, [
    [228, 160],
    [222, 174],
    [230, 190],
    [224, 206],
  ]);
  line(g, OBS_EMBER, 1.2, [
    [228, 160],
    [222, 174],
    [230, 190],
    [224, 206],
  ]);
  glowHex(fx, OBS_EMBER, 226, 184, 16, 0.4);
  for (const [x, h, w] of [
    [CX, 62, 11],
    [CX - 26, 82, 9],
    [CX + 26, 82, 9],
    [CX - 48, 104, 8],
    [CX + 48, 104, 8],
  ] as const)
    gpoly(
      g,
      '#241636',
      [
        [x - w, 134],
        [x - w * 0.3, h],
        [x + w * 0.2, h - 6],
        [x + w, 134],
      ],
      1.7,
      0.6,
    );
  line(g, OBS_EMBER, 3, [
    [CX - 56, 134],
    [CX + 56, 134],
  ]);
  glowHex(fx, OBS_EMBER, CX, 286, 46, 0.55);
  glowHex(fx, OBS_EMBER, CX - 12, 187, 14, 0.9);
  glowHex(fx, OBS_EMBER, CX + 12, 187, 14, 0.9);
  glowHex(fx, OBS_EMBER, 126, 340, 44, 0.35);
  glowHex(fx, OBS_EMBER, 326, 192, 30, 0.7);
  glowHex(fx, '#8a5ac0', CX, 420, 150, 0.1);
};

/** The Obsidian Blade: a greatsword of black glass that hovers beside Obsidia, drawn on its own so it can come and go. */
export const BLADE_W = 120;
export const BLADE_H = 400;
function paintObsidianBlade(g: G, fx: G): void {
  const cx = BLADE_W / 2;
  // blade: a long faceted shard, a bright edge on the lit side
  gpoly(
    g,
    '#241636',
    [
      [cx - 20, 250],
      [cx - 14, 60],
      [cx, 8],
      [cx + 14, 60],
      [cx + 20, 250],
    ],
    1.9,
    0.5,
  );
  poly(g, '#150d22', [
    [cx, 8],
    [cx + 14, 60],
    [cx + 20, 250],
    [cx, 250],
  ]);
  line(g, '#9a7ad0', 2, [
    [cx - 14, 66],
    [cx - 17, 246],
  ]);
  line(g, OBS_EMBER, 2.5, [
    [cx, 40],
    [cx + 3, 120],
    [cx - 3, 190],
    [cx, 244],
  ]);
  // a jagged crossguard, a wrapped grip and a glass pommel
  gpoly(
    g,
    '#2a1b3e',
    [
      [cx - 48, 262],
      [cx - 20, 250],
      [cx + 20, 250],
      [cx + 48, 262],
      [cx + 24, 276],
      [cx - 24, 276],
    ],
    1.6,
    0.6,
  );
  grect(g, '#150d22', cx - 7, 276, 14, 82, 5);
  for (let y = 284; y < 352; y += 12)
    line(g, '#6a4a9a', 2, [
      [cx - 7, y],
      [cx + 7, y + 6],
    ]);
  gpoly(
    g,
    '#2a1b3e',
    [
      [cx, 392],
      [cx - 13, 372],
      [cx, 354],
      [cx + 13, 372],
    ],
    1.6,
    0.6,
  );
  ell(g, OBS_EMBER, cx, 263, 6, 6);
  glowHex(fx, OBS_EMBER, cx, 130, 90, 0.4);
  glowHex(fx, OBS_EMBER, cx, 263, 30, 0.7);
}

const bladeCache: { c?: HTMLCanvasElement } = {};
/** The floating blade as its own cut-out (BLADE_W x BLADE_H), point up. */
export function obsidianBlade(): HTMLCanvasElement | undefined {
  if (bladeCache.c) return bladeCache.c;
  const c = document.createElement('canvas');
  c.width = BLADE_W;
  c.height = BLADE_H;
  const fxc = document.createElement('canvas');
  fxc.width = BLADE_W;
  fxc.height = BLADE_H;
  const g = c.getContext('2d');
  const fx = fxc.getContext('2d');
  if (!g || !fx) return undefined;
  paintObsidianBlade(g, fx);
  light(g);
  outline(c);
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.drawImage(fxc, 0, 0);
  g.restore();
  bladeCache.c = c;
  return c;
}

// ---- Dorian Blackthorn: a tall, gaunt necromancer in a drowned-green long coat, bone staff and a lantern ----
const necromancer: Painter = (g, fx) => {
  // mist at the feet
  fx.save();
  for (let i = 0; i < 5; i++) glowHex(fx, '#6aa87a', 120 + i * 45, FEET - 10, 60, 0.16);
  fx.restore();
  // long tailcoat
  gpoly(
    g,
    '#142a1e',
    [
      [164, 232],
      [256, 232],
      [316, FEET],
      [104, FEET],
    ],
    1.3,
    0.55,
  );
  gpoly(
    g,
    '#0a1810',
    [
      [190, 262],
      [230, 262],
      [258, FEET],
      [162, FEET],
    ],
    1.2,
    0.6,
  );
  line(g, '#9be86a', 3, [
    [104, FEET - 4],
    [316, FEET - 4],
  ]);
  line(g, 'rgba(155,232,106,0.5)', 3, [
    [196, 270],
    [178, FEET - 10],
  ]);
  line(g, 'rgba(155,232,106,0.5)', 3, [
    [224, 270],
    [244, FEET - 10],
  ]);
  // waistcoat, high collar, bone clasps
  gpoly(
    g,
    '#244a34',
    [
      [176, 238],
      [244, 238],
      [236, 346],
      [184, 346],
    ],
    1.3,
    0.7,
  );
  for (const y of [262, 288, 314]) gell(g, '#d9d4bc', CX, y, 5, 5);
  poly(g, '#142a1e', [
    [162, 206],
    [186, 190],
    [CX, 232],
    [234, 190],
    [258, 206],
    [262, 246],
    [CX, 258],
    [158, 246],
  ]);
  grect(g, '#3a4a38', 168, 342, 84, 10, 4);
  // bone pauldron and a shoulder cape
  gpoly(
    g,
    '#d9d4bc',
    [
      [126, 238],
      [176, 222],
      [186, 252],
      [134, 262],
    ],
    1.15,
    0.75,
  );
  for (let i = 0; i < 3; i++)
    poly(g, '#e8e2cc', [
      [130 + i * 16, 250],
      [140 + i * 16, 250],
      [135 + i * 16, 278],
    ]);
  gpoly(
    g,
    '#244a34',
    [
      [238, 224],
      [292, 236],
      [278, 290],
      [240, 270],
    ],
    1.3,
    0.7,
  );
  // arms: long sleeves, gaunt hands
  limb2(g, '#142a1e', 152, 262, 112, 334, 26);
  limb2(g, '#142a1e', 268, 258, 322, 296, 26);
  gell(g, '#c4d0b4', 108, 342, 14, 14);
  gell(g, '#c4d0b4', 330, 296, 14, 14);
  for (const d of [-8, 0, 8]) limb(g, '#c4d0b4', 326 + d, 296, 330 + d, 322, 5);
  // bone staff topped with a skull and green flame
  limb(g, '#d9d4bc', 356, 540, 356, 134, 11);
  limb(g, '#b8b29a', 360, 540, 360, 134, 3);
  for (const y of [200, 300, 400]) ell(g, '#d9d4bc', 356, y, 11, 6);
  gell(g, '#e8e2cc', 356, 112, 25, 23);
  rect(g, '#d9d4bc', 346, 128, 20, 13, 3);
  ell(g, '#0a1810', 347, 110, 6.5, 8);
  ell(g, '#0a1810', 365, 110, 6.5, 8);
  poly(g, '#0a1810', [
    [356, 118],
    [352, 126],
    [360, 126],
  ]);
  poly(g, '#7be860', [
    [338, 92],
    [346, 56],
    [356, 78],
    [364, 44],
    [374, 92],
  ]);
  poly(g, '#c8ff9a', [
    [348, 90],
    [356, 66],
    [364, 90],
  ]);
  // hanging lantern
  limb(g, '#8a8f80', 108, 346, 108, 394, 4);
  gpoly(
    g,
    '#3a4a38',
    [
      [90, 394],
      [126, 394],
      [130, 436],
      [86, 436],
    ],
    1.3,
    0.7,
  );
  rect(g, '#c8ff9a', 96, 402, 24, 26, 5);
  line(g, '#3a4a38', 3, [
    [108, 400],
    [108, 430],
  ]);
  // head: gaunt pale face under a hood, sunken eyes, silvered hair
  gell(g, '#142a1e', CX, 170, 62, 68);
  poly(g, '#142a1e', [
    [164, 132],
    [CX, 62],
    [256, 132],
  ]);
  head(g, '#cdd8c4', CX, 190, 33, 42);
  poly(g, '#050e08', [
    [170, 180],
    [250, 180],
    [244, 170],
    [CX, 164],
    [176, 170],
  ]);
  ell(g, '#2a3a2a', 198, 196, 10, 7);
  ell(g, '#2a3a2a', 222, 196, 10, 7);
  eyes(g, CX, 192, 12, '#9be86a', 4);
  line(g, '#6a7a64', 3, [
    [CX, 200],
    [CX - 3, 212],
    [CX + 4, 214],
  ]);
  line(g, '#4a5a48', 3, [
    [198, 224],
    [222, 224],
  ]);
  limb(g, '#b8c4b0', 178, 164, 170, 214, 8);
  limb(g, '#b8c4b0', 244, 164, 252, 214, 8);
  glowHex(fx, '#9be86a', 198, 192, 30, 0.7);
  glowHex(fx, '#9be86a', 222, 192, 30, 0.7);
  glowHex(fx, '#9be86a', 356, 82, 80, 0.7);
  glowHex(fx, '#9be86a', 108, 416, 120, 0.8);
};

// ---- KP: short, fat and bald, with a hammer, a shotgun on his back and a window pane under his arm ----
const drunkard: Painter = (g, fx) => {
  // shotgun slung across the back, barrels over the left shoulder
  limb(g, '#14141a', 290, 448, 142, 112, 13);
  limb(g, '#3a3a44', 288, 446, 140, 110, 7);
  limb(g, '#7a4a22', 294, 456, 330, 520, 20);
  // stumpy legs and boots
  limb2(g, '#5a4a3a', 176, 440, 170, FEET - 12, 48);
  limb2(g, '#5a4a3a', 250, 440, 258, FEET - 12, 48);
  gpoly(
    g,
    '#2a2018',
    [
      [134, FEET],
      [138, FEET - 30],
      [200, FEET - 30],
      [206, FEET - 6],
      [192, FEET],
    ],
    1.5,
    0.7,
  );
  gpoly(
    g,
    '#2a2018',
    [
      [226, FEET],
      [230, FEET - 30],
      [292, FEET - 30],
      [298, FEET - 6],
      [284, FEET],
    ],
    1.5,
    0.7,
  );
  // a huge round belly in a torn coat, with suspenders and a stained undershirt
  gell(g, '#6a5a3e', CX, 380, 114, 106, 1.2, 0.65);
  gell(g, '#9a8a66', CX, 394, 78, 78, 1.2, 0.8);
  line(g, 'rgba(40,30,20,0.5)', 4, [
    [CX, 322],
    [CX, 330],
  ]);
  ell(g, '#7a6a48', CX + 20, 400, 14, 10);
  line(g, '#2a2018', 6, [
    [166, 288],
    [156, 420],
  ]);
  line(g, '#2a2018', 6, [
    [254, 288],
    [264, 420],
  ]);
  grect(g, '#2a2018', 152, 424, 116, 14, 5);
  gell(g, '#d8b24c', CX, 431, 11, 10);
  gell(g, '#6a5a3e', CX, 300, 88, 58);
  // arms: hammer on the right, pane under the left
  limb2(g, '#6a5a3e', 136, 330, 94, 410, 42);
  limb2(g, '#6a5a3e', 290, 330, 340, 304, 42);
  gell(g, '#e0a88a', 90, 420, 22, 22);
  gell(g, '#e0a88a', 346, 300, 22, 22);
  // hammer, kept inside the canvas
  limb(g, '#4a2a12', 348, 308, 362, 170, 14);
  limb(g, '#8a5a2c', 347, 307, 361, 169, 8);
  gpoly(
    g,
    '#9aa0aa',
    [
      [316, 120],
      [412, 120],
      [412, 178],
      [316, 178],
    ],
    1.3,
    0.65,
  );
  rect(g, '#5a606a', 316, 120, 22, 58, 6);
  line(g, 'rgba(255,255,255,0.4)', 3, [
    [344, 128],
    [404, 128],
  ]);
  // window pane under the left arm: glass in a wooden frame
  g.save();
  g.translate(60, 330);
  g.rotate(-0.12);
  grect(g, '#7a5a34', -34, -120, 72, 182, 4);
  rect(g, 'rgba(160,230,255,0.75)', -26, -112, 56, 166, 2);
  limb(g, '#7a5a34', 2, -112, 2, 54, 5);
  limb(g, '#7a5a34', -26, -30, 30, -30, 5);
  limb(g, 'rgba(255,255,255,0.8)', -18, -100, 4, -60, 4);
  limb(g, 'rgba(255,255,255,0.6)', -18, -50, 0, -20, 3);
  g.restore();
  // a bottle in the belt
  grect(g, '#3a8a4a', 252, 410, 18, 48, 6);
  rect(g, '#3a8a4a', 257, 392, 8, 22, 3);
  rect(g, '#e8dcc0', 253, 428, 16, 14, 2);
  // bald head: big red nose, bags, a drooping moustache and a big grey beard
  head(g, '#e0a88a', CX, 224, 54, 52);
  ell(g, '#f0c0a0', CX - 14, 204, 18, 12);
  gell(g, '#d8605a', CX, 238, 15, 13);
  ell(g, '#fff0e0', 192, 218, 8, 6);
  ell(g, '#fff0e0', 228, 218, 8, 6);
  ell(g, '#2a1a12', 193, 219, 3, 3.5);
  ell(g, '#2a1a12', 229, 219, 3, 3.5);
  line(g, 'rgba(120,60,60,0.5)', 3, [
    [182, 228],
    [202, 229],
  ]);
  line(g, 'rgba(120,60,60,0.5)', 3, [
    [218, 229],
    [238, 228],
  ]);
  limb(g, '#6a4a3a', 178, 204, 204, 210, 7);
  limb(g, '#6a4a3a', 216, 210, 244, 204, 7);
  gpoly(
    g,
    '#b8b8c0',
    [
      [160, 244],
      [260, 244],
      [278, 332],
      [CX, 364],
      [142, 332],
    ],
    1.3,
    0.7,
  );
  poly(g, '#d8d8e0', [
    [176, 252],
    [194, 252],
    [186, 300],
  ]);
  gpoly(
    g,
    '#c8c8d0',
    [
      [182, 246],
      [238, 246],
      [230, 258],
      [190, 258],
    ],
    1.2,
    0.8,
  );
  ell(g, '#d8605a', CX, 262, 18, 7);
  ell(g, '#e0a88a', 154, 228, 10, 16);
  ell(g, '#e0a88a', 266, 228, 10, 16);
  glowHex(fx, '#ff9a3c', CX, 400, 120, 0.12);
};

/** each figure's painter, the width of its ground shadow and the colour of its rim light (the hero's own colour) */
const PAINTERS: Record<string, { paint: Painter; shadow: number; rim: string }> = {
  knight: { paint: knight, shadow: 130, rim: '#ffd27a' },
  engineer: { paint: engineer, shadow: 125, rim: '#6ad8ff' },
  hunter: { paint: hunter, shadow: 125, rim: '#c8e070' },
  trapper: { paint: trapper, shadow: 115, rim: '#b48cff' },
  assassin: { paint: assassin, shadow: 125, rim: '#ff5a5a' },
  totemist: { paint: totemist, shadow: 125, rim: '#7fd08a' },
  barbarian: { paint: barbarian, shadow: 140, rim: '#ff9a4a' },
  spellblade: { paint: spellblade, shadow: 115, rim: '#ff8a3a' },
  necromancer: { paint: necromancer, shadow: 125, rim: '#7affa8' },
  drunkard: { paint: drunkard, shadow: 145, rim: '#ffb35a' },
};

const cache = new Map<string, HTMLCanvasElement>();

/** A prop that floats beside a Riftwalker only while a condition holds (Obsidia's blade while she has it): its cut-out and where it hovers on the 420x560 figure. */
export function heroProp(
  id: string,
): { canvas: HTMLCanvasElement; x: number; y: number } | undefined {
  // her real figure already holds the blade, so the floating copy is only for the painted stand-in
  if (id !== 'spellblade' || realFigure('hero:spellblade')) return undefined;
  const canvas = obsidianBlade();
  return canvas ? { canvas, x: 372, y: 250 } : undefined;
}

/** The hand-built figure for a Riftwalker, or undefined if it has none yet. */
export function bespokeHero(id: string): HTMLCanvasElement | undefined {
  const entry = PAINTERS[id];
  if (!entry) return undefined;
  let c = cache.get(id);
  if (!c) {
    c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const fxc = document.createElement('canvas');
    fxc.width = W;
    fxc.height = H;
    const g = c.getContext('2d');
    const fx = fxc.getContext('2d');
    if (!g || !fx) return undefined;
    entry.paint(g, fx);
    light(g);
    rimLight(c, entry.rim);
    outline(c);
    groundShadow(g, entry.shadow);
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.drawImage(fxc, 0, 0);
    g.restore();
    cache.set(id, c);
  }
  return c;
}
