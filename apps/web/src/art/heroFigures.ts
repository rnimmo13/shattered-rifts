// Hand-built standing figures for the ten Riftwalkers: each its own silhouette, outfit and prop, instead of one shared painter
// per archetype. Flat shapes with gradient shading, one light from the upper left, a shared dark outline and an additive
// effects layer for glows, drawn on the same 420x560 cut-out (feet on the bottom edge) the other figures use, so they drop
// straight into the fight screen. Real art (art/manifest.json) still wins over these.

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
  const gr = g.createLinearGradient(40, 40, W - 40, H);
  gr.addColorStop(0, 'rgba(255,255,255,0.2)');
  gr.addColorStop(0.45, 'rgba(255,255,255,0)');
  gr.addColorStop(1, 'rgba(0,0,0,0.34)');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.restore();
}
/** a dark outline all the way round the painted figure, so every silhouette reads against any floor */
function outline(c: HTMLCanvasElement, px = 3.5): void {
  const t = document.createElement('canvas');
  t.width = W;
  t.height = H;
  const tg = t.getContext('2d');
  const g = c.getContext('2d');
  if (!tg || !g) return;
  tg.drawImage(c, 0, 0);
  tg.globalCompositeOperation = 'source-in';
  tg.fillStyle = '#0a0716';
  tg.fillRect(0, 0, W, H);
  g.save();
  g.globalCompositeOperation = 'destination-over';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    g.drawImage(t, Math.cos(a) * px, Math.sin(a) * px);
  }
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

// ---- Maren: a knight in dawn-gold plate, a blue cape, a sunburst shield and a longsword ----
const maren: Painter = (g, fx) => {
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
const rivet: Painter = (g, fx) => {
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
const kesh: Painter = (g, fx) => {
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
const vesper: Painter = (g, fx) => {
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
  // arms with gloves
  limb2(g, '#251540', 170, 262, 132, 372, 24);
  limb2(g, '#251540', 252, 262, 300, 352, 24);
  gell(g, '#d8c4ee', 128, 382, 15, 15);
  gell(g, '#d8c4ee', 304, 360, 15, 15);
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
  // head: pale face, domino mask, red lips, long lashes
  head(g, '#ead6cc', CX, 190, 38, 44);
  ell(g, '#9a1e3a', CX, 216, 9, 4);
  poly(g, '#1c0f33', [
    [170, 178],
    [250, 178],
    [244, 206],
    [CX, 200],
    [176, 206],
  ]);
  ell(g, '#d8c4ee', 196, 190, 7, 5);
  ell(g, '#d8c4ee', 224, 190, 7, 5);
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

// ---- Scarlet: a female assassin in a crimson hood and veil, a dagger in each hand, mid-lunge ----
const quill: Painter = (g, fx) => {
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

// ---- Ilvane: a robed runecaster with a ring of glowing glyphs ----
const ilvane: Painter = (g, fx) => {
  // the ring of runes, behind the figure
  fx.save();
  fx.globalCompositeOperation = 'lighter';
  fx.strokeStyle = 'rgba(79,184,255,0.8)';
  fx.lineWidth = 5;
  fx.beginPath();
  fx.arc(CX, 352, 142, 0, Math.PI * 2);
  fx.stroke();
  fx.lineWidth = 2;
  fx.beginPath();
  fx.arc(CX, 352, 122, 0, Math.PI * 2);
  fx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + 0.2;
    const x = CX + 132 * Math.cos(a);
    const y = 352 + 132 * Math.sin(a);
    fx.strokeStyle = 'rgba(180,230,255,0.95)';
    fx.lineWidth = 4;
    fx.lineCap = 'round';
    fx.beginPath();
    const s = 11;
    if (i % 4 === 0) {
      fx.moveTo(x, y - s);
      fx.lineTo(x, y + s);
      fx.moveTo(x - s * 0.7, y - s * 0.2);
      fx.lineTo(x + s * 0.7, y - s * 0.2);
    } else if (i % 4 === 1) {
      fx.moveTo(x - s, y + s);
      fx.lineTo(x, y - s);
      fx.lineTo(x + s, y + s);
      fx.closePath();
    } else if (i % 4 === 2) {
      fx.moveTo(x, y - s);
      fx.lineTo(x + s, y);
      fx.lineTo(x, y + s);
      fx.lineTo(x - s, y);
      fx.closePath();
    } else {
      fx.moveTo(x - s, y - s);
      fx.lineTo(x + s, y + s);
      fx.moveTo(x + s, y - s);
      fx.lineTo(x - s, y + s);
    }
    fx.stroke();
  }
  fx.restore();
  // robe: layered, with gold trim and a glowing sash
  gpoly(
    g,
    '#1e3a6e',
    [
      [170, 222],
      [250, 222],
      [308, FEET],
      [112, FEET],
    ],
    1.3,
    0.55,
  );
  gpoly(
    g,
    '#12254a',
    [
      [192, 244],
      [228, 244],
      [254, FEET],
      [166, FEET],
    ],
    1.2,
    0.6,
  );
  line(g, '#e8c860', 4, [
    [112, FEET - 6],
    [308, FEET - 6],
  ]);
  line(g, '#e8c860', 3, [
    [192, 250],
    [166, FEET - 8],
  ]);
  line(g, '#e8c860', 3, [
    [228, 250],
    [254, FEET - 8],
  ]);
  gpoly(
    g,
    '#2d5aa8',
    [
      [148, 214],
      [272, 214],
      [288, 276],
      [132, 276],
    ],
    1.3,
    0.7,
  );
  rect(g, '#4fb8ff', 176, 334, 68, 8, 3);
  poly(g, '#e8c860', [
    [CX - 6, 276],
    [CX + 6, 276],
    [CX + 12, 334],
    [CX - 12, 334],
  ]);
  // sleeves with cuffs; one hand on the staff, one open
  limb2(g, '#1e3a6e', 156, 252, 112, 336, 32);
  limb2(g, '#1e3a6e', 264, 252, 330, 296, 30);
  rect(g, '#e8c860', 96, 326, 34, 10, 4);
  gell(g, '#e0cdb8', 110, 350, 15, 15);
  gell(g, '#e0cdb8', 340, 290, 15, 15);
  // staff with a crystal in a gold claw
  limb(g, '#7a5a34', 342, 540, 342, 124, 10);
  limb(g, '#a8844a', 341, 540, 341, 124, 5);
  poly(g, '#e8c860', [
    [326, 120],
    [342, 144],
    [358, 120],
    [350, 98],
    [334, 98],
  ]);
  gell(g, '#7fd0ff', 342, 92, 17, 22, 1.4, 0.8);
  // hood, face, and a glowing glyph on the brow
  gell(g, '#1e3a6e', CX, 158, 58, 64);
  head(g, '#e0cdb8', CX, 186, 36, 42);
  eyes(g, CX, 188, 12, '#4fb8ff', 4.5);
  line(g, '#4a3a4a', 3, [
    [188, 182],
    [201, 183],
  ]);
  line(g, '#4a3a4a', 3, [
    [232, 182],
    [219, 183],
  ]);
  ell(g, '#c4707a', CX, 212, 8, 3.4);
  gpoly(
    g,
    '#1e3a6e',
    [
      [156, 188],
      [158, 132],
      [CX, 84],
      [264, 132],
      [266, 188],
      [250, 174],
      [CX, 158],
      [170, 174],
    ],
    1.35,
    0.65,
  );
  line(g, '#e8c860', 3, [
    [170, 174],
    [CX, 158],
    [250, 174],
  ]);
  line(g, '#4fb8ff', 2.5, [
    [CX, 132],
    [CX, 150],
  ]);
  line(g, '#4fb8ff', 2.5, [
    [CX - 8, 140],
    [CX + 8, 140],
  ]);
  line(g, '#4fb8ff', 2.5, [
    [CX - 6, 134],
    [CX + 6, 134],
  ]);
  glowHex(fx, '#4fb8ff', 342, 92, 80, 0.8);
  glowHex(fx, '#4fb8ff', CX, 140, 30, 0.5);
  glowHex(fx, '#4fb8ff', CX, 352, 90, 0.18);
};

// ---- Ragnar: a barbarian, bare to the waist, braided beard, fists wrapped, in a roaring stance ----
const sehra: Painter = (g, fx) => {
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

// ---- Astra: a female spellblade in a starry coat and a star-crowned blade ----
const astra: Painter = (g, fx) => {
  // long silver hair behind her
  gpoly(
    g,
    '#c4d0f4',
    [
      [164, 150],
      [262, 150],
      [290, 330],
      [238, 380],
      [180, 340],
      [150, 280],
    ],
    1.35,
    0.75,
  );
  // legs and boots
  limb2(g, '#26306a', 194, 412, 186, FEET - 12, 30);
  limb2(g, '#26306a', 232, 412, 240, FEET - 12, 30);
  gpoly(
    g,
    '#14183a',
    [
      [154, FEET],
      [160, FEET - 40],
      [208, FEET - 40],
      [214, FEET - 6],
      [200, FEET],
    ],
    1.25,
    0.7,
  );
  gpoly(
    g,
    '#14183a',
    [
      [220, FEET],
      [226, FEET - 40],
      [272, FEET - 40],
      [282, FEET - 6],
      [268, FEET],
    ],
    1.25,
    0.7,
  );
  line(g, '#e8c860', 3, [
    [162, FEET - 40],
    [208, FEET - 40],
  ]);
  line(g, '#e8c860', 3, [
    [226, FEET - 40],
    [272, FEET - 40],
  ]);
  // coat: fitted bodice, nipped waist, flared tails
  gpoly(
    g,
    '#3a4896',
    [
      [178, 236],
      [246, 236],
      [236, 344],
      [190, 344],
    ],
    1.3,
    0.65,
  );
  gpoly(
    g,
    '#3a4896',
    [
      [184, 340],
      [242, 340],
      [294, 462],
      [128, 462],
    ],
    1.3,
    0.55,
  );
  poly(g, '#1a2060', [
    [198, 346],
    [226, 346],
    [240, 462],
    [186, 462],
  ]);
  line(g, '#e8c860', 4, [
    [128, 462],
    [294, 462],
  ]);
  line(g, '#e8c860', 3, [
    [CX, 246],
    [CX, 344],
  ]);
  grect(g, '#e8c860', 184, 332, 58, 10, 4);
  gell(g, '#ffe9a0', CX, 337, 6, 6);
  gpoly(
    g,
    '#e8c860',
    [
      [168, 228],
      [254, 228],
      [246, 250],
      [176, 250],
    ],
    1.25,
    0.8,
  );
  g.fillStyle = '#ffe9a0';
  for (const [x, y] of [
    [196, 300],
    [238, 380],
    [172, 410],
    [252, 300],
    [212, 430],
    [268, 440],
    [150, 440],
  ] as const)
    star(g, '#ffe9a0', x, y, 5, 2, 4);
  // arms: sword arm up, other hand open with a spark
  limb2(g, '#3a4896', 182, 254, 138, 332, 22);
  limb2(g, '#3a4896', 244, 252, 306, 216, 22);
  rect(g, '#e8c860', 120, 316, 30, 9, 4);
  gell(g, '#ecd6c0', 130, 346, 14, 14);
  gell(g, '#ecd6c0', 316, 206, 14, 14);
  // blade topped with a star
  gpoly(
    g,
    '#eaf2ff',
    [
      [318, 214],
      [330, 214],
      [334, 70],
      [324, 50],
      [314, 70],
    ],
    1.2,
    0.8,
  );
  line(g, 'rgba(120,150,210,0.6)', 3, [
    [324, 50],
    [324, 208],
  ]);
  grect(g, '#e8c860', 298, 208, 56, 10, 4);
  star(g, '#ffe9a0', 324, 30, 21, 8.5);
  // a few motes around the open hand
  star(g, '#ffe9a0', 118, 318, 6, 2.5, 4);
  star(g, '#ffe9a0', 150, 296, 5, 2, 4);
  // head: soft face, lashes, lips, braids, a star circlet
  head(g, '#f0dcc8', CX, 182, 35, 41);
  gpoly(
    g,
    '#d9e2ff',
    [
      [168, 178],
      [172, 130],
      [CX, 108],
      [252, 130],
      [256, 178],
      [246, 156],
      [CX, 134],
      [178, 156],
    ],
    1.3,
    0.75,
  );
  limb(g, '#c4d0f4', 176, 160, 160, 232, 14);
  limb(g, '#c4d0f4', 246, 160, 262, 238, 14);
  eyes(g, CX, 186, 12, '#6a9aff', 4.5);
  line(g, '#2a2650', 3, [
    [190, 182],
    [202, 184],
  ]);
  line(g, '#2a2650', 3, [
    [230, 182],
    [218, 184],
  ]);
  line(g, '#2a2650', 2, [
    [188, 178],
    [184, 174],
  ]);
  line(g, '#2a2650', 2, [
    [232, 178],
    [236, 174],
  ]);
  ell(g, '#c4506a', CX, 210, 8, 3.6);
  line(g, '#e8c860', 4, [
    [176, 142],
    [CX, 130],
    [244, 142],
  ]);
  star(g, '#ffe9a0', CX, 124, 12, 5);
  glowHex(fx, '#ffe9a0', 324, 34, 80, 0.75);
  glowHex(fx, '#ffe9a0', CX, 124, 30, 0.5);
  glowHex(fx, '#9ab4ff', 126, 330, 50, 0.3);
};

// ---- Dorian Blackthorn: a tall, gaunt necromancer in a drowned-green long coat, bone staff and a lantern ----
const mire: Painter = (g, fx) => {
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
const kp: Painter = (g, fx) => {
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

const PAINTERS: Record<string, { paint: Painter; shadow: number }> = {
  maren: { paint: maren, shadow: 130 },
  rivet: { paint: rivet, shadow: 125 },
  kesh: { paint: kesh, shadow: 125 },
  vesper: { paint: vesper, shadow: 115 },
  quill: { paint: quill, shadow: 125 },
  ilvane: { paint: ilvane, shadow: 125 },
  sehra: { paint: sehra, shadow: 140 },
  astra: { paint: astra, shadow: 115 },
  mire: { paint: mire, shadow: 125 },
  kp: { paint: kp, shadow: 145 },
};

const cache = new Map<string, HTMLCanvasElement>();

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
