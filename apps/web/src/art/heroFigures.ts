// Hand-built standing figures for the ten Riftwalkers: each its own silhouette, outfit and prop, instead of one shared painter
// per archetype. Flat shapes with a shared light pass, drawn on the same 420x560 cut-out (feet on the bottom edge) the other
// figures use, so they drop straight into the fight screen. Real art (art/manifest.json) still wins over these.

type G = CanvasRenderingContext2D;
const W = 420;
const H = 560;
const CX = 210;
const FEET = 538;

const fill = (g: G, c: string): void => {
  g.fillStyle = c;
};
function poly(g: G, c: string, pts: [number, number][]): void {
  fill(g, c);
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
function limb(g: G, c: string, x1: number, y1: number, x2: number, y2: number, w: number): void {
  g.strokeStyle = c;
  g.lineWidth = w;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}
function rect(g: G, c: string, x: number, y: number, w: number, h: number, r = 0): void {
  fill(g, c);
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}
function glow(g: G, c: string, x: number, y: number, r: number, a = 0.8): void {
  g.save();
  g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, c.replace(')', ` / ${a})`).replace('rgb(', 'rgb('));
  gr.addColorStop(1, c.replace(')', ' / 0)'));
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
}
const glowHex = (g: G, hex: string, x: number, y: number, r: number, a = 0.8): void => {
  const n = parseInt(hex.slice(1), 16);
  glow(g, `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255})`, x, y, r, a);
};
function shadow(g: G, rx = 120): void {
  g.save();
  const gr = g.createRadialGradient(CX, FEET + 4, 4, CX, FEET + 4, rx);
  gr.addColorStop(0, 'rgba(0,0,0,0.55)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.fillRect(0, FEET - 30, W, 60);
  g.restore();
}
/** one light from the upper left over everything painted so far */
function light(g: G): void {
  g.save();
  g.globalCompositeOperation = 'source-atop';
  const gr = g.createLinearGradient(60, 60, W - 60, H);
  gr.addColorStop(0, 'rgba(255,255,255,0.22)');
  gr.addColorStop(0.5, 'rgba(255,255,255,0)');
  gr.addColorStop(1, 'rgba(0,0,0,0.38)');
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  g.restore();
}

type Painter = (g: G) => void;

// ---- Maren: a knight with a dawn on her shield ----
const maren: Painter = (g) => {
  shadow(g);
  limb(g, '#7d8aa8', 185, 400, 178, FEET - 8, 34);
  limb(g, '#7d8aa8', 235, 400, 244, FEET - 8, 34);
  rect(g, '#46506e', 160, FEET - 22, 46, 22, 8);
  rect(g, '#46506e', 222, FEET - 22, 46, 22, 8);
  poly(g, '#e8d9a8', [
    [150, 250],
    [270, 250],
    [292, 420],
    [128, 420],
  ]); // surcoat
  poly(g, '#a9b6d6', [
    [162, 214],
    [258, 214],
    [272, 330],
    [148, 330],
  ]); // breastplate
  rect(g, '#cdbb7a', 150, 328, 120, 16, 6);
  ell(g, '#c4cee8', 144, 226, 40, 28, -0.3); // pauldrons
  ell(g, '#c4cee8', 276, 226, 40, 28, 0.3);
  limb(g, '#a9b6d6', 118, 250, 100, 340, 28); // shield arm
  limb(g, '#a9b6d6', 300, 244, 330, 170, 26); // sword arm
  // sword
  poly(g, '#eef3ff', [
    [322, 160],
    [338, 160],
    [342, 20],
    [330, 4],
    [318, 20],
  ]);
  rect(g, '#d8b24c', 304, 156, 52, 12, 5);
  rect(g, '#8a6a2c', 322, 166, 16, 40, 6);
  // kite shield with a sun
  poly(g, '#2d3f8c', [
    [40, 250],
    [140, 250],
    [132, 380],
    [90, 440],
    [48, 380],
  ]);
  poly(g, '#d8b24c', [
    [48, 258],
    [132, 258],
    [126, 376],
    [90, 428],
    [54, 376],
  ]);
  poly(g, '#2d3f8c', [
    [56, 266],
    [124, 266],
    [120, 372],
    [90, 416],
    [60, 372],
  ]);
  ell(g, '#f3d58a', 90, 322, 22, 22);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    limb(
      g,
      '#f3d58a',
      90 + 26 * Math.cos(a),
      322 + 26 * Math.sin(a),
      90 + 38 * Math.cos(a),
      322 + 38 * Math.sin(a),
      6,
    );
  }
  // helm with a plume
  ell(g, '#c4cee8', CX, 170, 44, 50);
  rect(g, '#2a3050', 178, 160, 64, 12, 4);
  rect(g, '#2a3050', 205, 160, 10, 50, 3);
  poly(g, '#d8b24c', [
    [CX, 124],
    [262, 100],
    [300, 120],
    [256, 138],
    [CX + 20, 134],
  ]);
  glowHex(g, '#f3d58a', 90, 322, 70, 0.5);
};

// ---- Rivet: an engineer with goggles, a wrench and a little drone ----
const rivet: Painter = (g) => {
  shadow(g);
  limb(g, '#2c5f78', 188, 410, 184, FEET - 8, 38);
  limb(g, '#2c5f78', 236, 410, 240, FEET - 8, 38);
  rect(g, '#3a3a44', 158, FEET - 24, 52, 24, 9);
  rect(g, '#3a3a44', 218, FEET - 24, 52, 24, 9);
  rect(g, '#5a4636', 96, 230, 70, 150, 14); // backpack
  rect(g, '#8aa0b0', 106, 210, 8, 40, 4);
  rect(g, '#8aa0b0', 128, 200, 8, 50, 4);
  rect(g, '#e08a3a', 150, 232, 130, 190, 30); // overalls and body
  rect(g, '#2c5f78', 168, 300, 94, 130, 20);
  rect(g, '#f2c14e', 182, 270, 66, 10, 4);
  limb(g, '#e08a3a', 150, 260, 112, 350, 34);
  limb(g, '#e08a3a', 280, 258, 330, 330, 34);
  ell(g, '#e6b894', 108, 360, 20, 20);
  ell(g, '#e6b894', 336, 340, 20, 20);
  // wrench
  limb(g, '#9aa8b4', 340, 346, 372, 214, 14);
  ell(g, '#9aa8b4', 376, 200, 28, 28);
  ell(g, '#10202a', 386, 186, 12, 14);
  // head, goggles, cap
  ell(g, '#e6b894', CX, 176, 46, 50);
  rect(g, '#2a2c3a', 168, 150, 84, 36, 16);
  ell(g, '#9be8ff', 190, 168, 14, 14);
  ell(g, '#9be8ff', 230, 168, 14, 14);
  poly(g, '#e08a3a', [
    [160, 140],
    [260, 140],
    [250, 110],
    [170, 110],
  ]);
  // drone
  ell(g, '#8aa0b0', 340, 120, 30, 18);
  ell(g, '#36e0ff', 340, 120, 10, 10);
  limb(g, '#cfe6f2', 304, 100, 376, 100, 6);
  glowHex(g, '#36e0ff', 340, 120, 60, 0.6);
};

// ---- Kesh: a hunter in a hooded fur cloak, bow drawn ----
const kesh: Painter = (g) => {
  shadow(g);
  limb(g, '#4a3a2a', 190, 410, 184, FEET - 8, 36);
  limb(g, '#4a3a2a', 232, 410, 238, FEET - 8, 36);
  rect(g, '#2a2018', 160, FEET - 22, 50, 22, 8);
  rect(g, '#2a2018', 220, FEET - 22, 50, 22, 8);
  rect(g, '#7a3a22', 96, 220, 36, 150, 8); // quiver
  for (let i = 0; i < 4; i++) limb(g, '#d9c9a0', 104 + i * 8, 200, 104 + i * 8, 232, 4);
  poly(g, '#5d7a4a', [
    [150, 240],
    [280, 240],
    [300, 430],
    [130, 430],
  ]); // cloak
  poly(g, '#8a6a4a', [
    [140, 232],
    [290, 232],
    [270, 280],
    [160, 280],
  ]); // fur mantle
  for (let i = 0; i < 9; i++)
    poly(g, '#a68360', [
      [146 + i * 16, 270],
      [158 + i * 16, 270],
      [152 + i * 16, 296],
    ]);
  rect(g, '#3a2a1a', 160, 330, 110, 14, 5);
  limb(g, '#5d7a4a', 280, 262, 350, 262, 28); // bow arm out
  limb(g, '#5d7a4a', 160, 262, 232, 286, 26); // draw arm
  // bow, drawn
  g.strokeStyle = '#7a5a34';
  g.lineWidth = 9;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(354, 120);
  g.quadraticCurveTo(300, 262, 354, 404);
  g.stroke();
  g.strokeStyle = '#efe6cc';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(354, 120);
  g.lineTo(236, 270);
  g.lineTo(354, 404);
  g.stroke();
  limb(g, '#d9c9a0', 236, 270, 390, 262, 5);
  poly(g, '#cfd6dc', [
    [392, 262],
    [374, 252],
    [374, 272],
  ]);
  // hood with wolf ears
  ell(g, '#5d7a4a', CX, 176, 54, 58);
  poly(g, '#8a6a4a', [
    [170, 130],
    [176, 84],
    [200, 120],
  ]);
  poly(g, '#8a6a4a', [
    [250, 130],
    [244, 84],
    [220, 120],
  ]);
  ell(g, '#1c140e', CX, 188, 32, 34);
  ell(g, '#ffb36a', 198, 184, 5, 4);
  ell(g, '#ffb36a', 222, 184, 5, 4);
};

// ---- Vesper: a slim trapper in a long cloak and a domino mask, a snare at her feet ----
const vesper: Painter = (g) => {
  shadow(g, 100);
  poly(g, '#3a2466', [
    [170, 236],
    [250, 236],
    [310, FEET],
    [110, FEET],
  ]); // cloak
  poly(g, '#251540', [
    [190, 250],
    [230, 250],
    [250, FEET],
    [170, FEET],
  ]);
  poly(g, '#5a3a98', [
    [150, 232],
    [270, 232],
    [250, 270],
    [170, 270],
  ]);
  limb(g, '#251540', 168, 262, 130, 372, 24);
  limb(g, '#251540', 252, 262, 300, 350, 24);
  ell(g, '#d8c4ee', 126, 380, 16, 16);
  ell(g, '#d8c4ee', 304, 358, 16, 16);
  // wire coil and a trap
  g.strokeStyle = '#cfd6dc';
  g.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.ellipse(304, 360, 30 - i * 3, 14 - i, 0, 0, Math.PI * 2);
    g.stroke();
  }
  g.strokeStyle = '#8a8fa0';
  g.lineWidth = 7;
  g.beginPath();
  g.arc(90, FEET - 14, 38, Math.PI, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 6; i++)
    poly(g, '#cfd6dc', [
      [56 + i * 12, FEET - 14],
      [62 + i * 12, FEET - 36],
      [68 + i * 12, FEET - 14],
    ]);
  // head, mask, wide hat
  ell(g, '#e6d0c8', CX, 186, 38, 44);
  poly(g, '#1c0f33', [
    [172, 178],
    [248, 178],
    [238, 206],
    [182, 206],
  ]);
  ell(g, '#d8c4ee', 198, 190, 6, 5);
  ell(g, '#d8c4ee', 222, 190, 6, 5);
  ell(g, '#251540', CX, 138, 78, 18);
  poly(g, '#251540', [
    [160, 140],
    [260, 140],
    [248, 80],
    [172, 80],
  ]);
  rect(g, '#b99aff', 168, 120, 84, 8, 3);
  glowHex(g, '#b99aff', CX, 190, 50, 0.3);
};

// ---- Quill: a slender cutpurse with a fan of knives and a feathered hat ----
const quill: Painter = (g) => {
  shadow(g, 100);
  limb(g, '#2a2236', 194, 400, 176, FEET - 8, 28);
  limb(g, '#2a2236', 232, 400, 252, FEET - 8, 28);
  rect(g, '#14101c', 150, FEET - 20, 48, 20, 8);
  rect(g, '#14101c', 232, FEET - 20, 48, 20, 8);
  poly(g, '#c0407e', [
    [176, 230],
    [250, 230],
    [270, 420],
    [160, 420],
  ]); // coat
  poly(g, '#5a1f45', [
    [196, 232],
    [230, 232],
    [236, 420],
    [190, 420],
  ]);
  rect(g, '#f2d86e', 170, 340, 90, 10, 4);
  poly(g, '#e8e0d0', [
    [184, 218],
    [244, 218],
    [226, 250],
    [200, 250],
  ]); // scarf
  poly(g, '#c0407e', [
    [240, 226],
    [330, 250],
    [320, 290],
    [240, 256],
  ]);
  limb(g, '#c0407e', 170, 252, 140, 340, 22);
  limb(g, '#c0407e', 252, 252, 312, 214, 22);
  ell(g, '#e6c8b4', 134, 350, 14, 14);
  ell(g, '#e6c8b4', 318, 206, 15, 15);
  // fan of knives
  for (const [a, len] of [
    [-0.9, 120],
    [-0.45, 140],
    [0, 150],
    [0.45, 140],
  ] as const) {
    g.save();
    g.translate(318, 206);
    g.rotate(-1.2 + a);
    poly(g, '#e8eef6', [
      [0, 0],
      [10, -len],
      [-10, -len + 10],
    ]);
    rect(g, '#8a6a3c', -5, 4, 10, 22, 3);
    g.restore();
  }
  // head, hat, feather
  ell(g, '#e6c8b4', CX, 178, 36, 42);
  rect(g, '#1c1626', 182, 176, 56, 8, 3);
  ell(g, '#14101c', CX, 140, 82, 16);
  poly(g, '#14101c', [
    [170, 142],
    [250, 142],
    [240, 96],
    [180, 96],
  ]);
  poly(g, '#f08acb', [
    [236, 108],
    [320, 56],
    [296, 120],
    [250, 122],
  ]);
  rect(g, '#f2d86e', 176, 126, 68, 8, 3);
};

// ---- Ilvane: a robed runecaster with a ring of glowing glyphs ----
const ilvane: Painter = (g) => {
  shadow(g, 110);
  poly(g, '#1e3a6e', [
    [170, 220],
    [250, 220],
    [300, FEET],
    [120, FEET],
  ]);
  poly(g, '#12254a', [
    [190, 240],
    [230, 240],
    [250, FEET],
    [170, FEET],
  ]);
  poly(g, '#2d5aa8', [
    [150, 214],
    [270, 214],
    [286, 270],
    [134, 270],
  ]);
  limb(g, '#1e3a6e', 156, 250, 118, 340, 28);
  limb(g, '#1e3a6e', 264, 250, 306, 320, 28);
  ell(g, '#e0cdb8', 116, 348, 15, 15);
  ell(g, '#e0cdb8', 308, 326, 15, 15);
  // staff
  limb(g, '#7a5a34', 340, 540, 340, 110, 10);
  ell(g, '#4fb8ff', 340, 96, 20, 20);
  glowHex(g, '#4fb8ff', 340, 96, 70, 0.8);
  // rune ring
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.strokeStyle = 'rgba(79,184,255,0.85)';
  g.lineWidth = 5;
  g.beginPath();
  g.ellipse(CX, 330, 150, 150, 0, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(CX, 330, 128, 128, 0, 0, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + 0.2;
    const x = CX + 139 * Math.cos(a);
    const y = 330 + 139 * Math.sin(a);
    g.fillStyle = 'rgba(180,230,255,0.95)';
    g.fillRect(x - 3, y - 12, 6, 24);
    g.fillRect(x - 12, y - 3, 24, 6);
  }
  g.restore();
  ell(g, '#e0cdb8', CX, 168, 36, 42);
  ell(g, '#1e3a6e', CX, 150, 52, 54);
  ell(g, '#12254a', CX, 172, 32, 36);
  ell(g, '#e0cdb8', CX, 176, 26, 30);
  ell(g, '#4fb8ff', 200, 172, 5, 4);
  ell(g, '#4fb8ff', 220, 172, 5, 4);
};

// ---- Sehra: a barbarian fighter, bare to the waist, fists wrapped, in a roaring stance ----
const sehra: Painter = (g) => {
  shadow(g, 130);
  limb(g, '#8a4a22', 180, 400, 160, FEET - 8, 44);
  limb(g, '#8a4a22', 244, 400, 270, FEET - 8, 44);
  rect(g, '#3a2418', 130, FEET - 24, 56, 24, 9);
  rect(g, '#3a2418', 248, FEET - 24, 56, 24, 9);
  poly(g, '#5a3a22', [
    [150, 370],
    [280, 370],
    [296, 450],
    [134, 450],
  ]); // fur wrap
  for (let i = 0; i < 8; i++)
    poly(g, '#7a5232', [
      [134 + i * 20, 440],
      [148 + i * 20, 440],
      [141 + i * 20, 470],
    ]);
  ell(g, '#d89a6a', CX, 290, 92, 100); // torso
  ell(g, '#d89a6a', 126, 230, 46, 40); // shoulders
  ell(g, '#d89a6a', 296, 230, 46, 40);
  poly(g, '#a8683c', [
    [CX, 210],
    [CX + 14, 380],
    [CX - 14, 380],
  ]);
  limb(g, '#d89a6a', 124, 250, 84, 340, 42);
  limb(g, '#d89a6a', 298, 250, 346, 330, 42);
  ell(g, '#efe2c8', 80, 358, 28, 28); // wrapped fists
  ell(g, '#efe2c8', 350, 348, 28, 28);
  g.strokeStyle = '#a88a60';
  g.lineWidth = 3;
  for (let i = -2; i <= 2; i++) {
    g.beginPath();
    g.moveTo(58, 358 + i * 8);
    g.lineTo(102, 354 + i * 8);
    g.stroke();
  }
  // head: wild hair, war paint
  ell(g, '#d89a6a', CX, 168, 40, 46);
  poly(g, '#2a1a12', [
    [164, 160],
    [176, 100],
    [210, 84],
    [244, 100],
    [258, 160],
    [240, 130],
    [180, 130],
  ]);
  limb(g, '#2a1a12', 170, 140, 126, 200, 18);
  limb(g, '#2a1a12', 250, 140, 296, 210, 18);
  rect(g, '#c0302a', 184, 160, 52, 8, 3);
  rect(g, '#c0302a', 196, 176, 8, 22, 3);
  ell(g, '#fff0d0', 200, 164, 4, 3);
  ell(g, '#fff0d0', 222, 164, 4, 3);
  glowHex(g, '#ffb060', CX, 290, 150, 0.25);
};

// ---- Astra: a spellblade in a starry coat with a star-crowned blade ----
const astra: Painter = (g) => {
  shadow(g, 105);
  limb(g, '#26306a', 192, 410, 184, FEET - 8, 30);
  limb(g, '#26306a', 232, 410, 240, FEET - 8, 30);
  rect(g, '#14183a', 156, FEET - 22, 50, 22, 8);
  rect(g, '#14183a', 222, FEET - 22, 50, 22, 8);
  poly(g, '#3a4896', [
    [164, 230],
    [256, 230],
    [290, 450],
    [130, 450],
  ]); // long coat
  poly(g, '#1a2060', [
    [196, 240],
    [224, 240],
    [236, 450],
    [184, 450],
  ]);
  poly(g, '#e8c860', [
    [160, 232],
    [260, 232],
    [250, 250],
    [170, 250],
  ]);
  rect(g, '#e8c860', 170, 336, 80, 8, 3);
  g.fillStyle = '#ffe9a0';
  for (const [x, y] of [
    [190, 300],
    [236, 360],
    [170, 400],
    [250, 290],
    [210, 420],
  ] as const)
    g.fillRect(x, y, 5, 5);
  limb(g, '#3a4896', 166, 252, 134, 336, 24);
  limb(g, '#3a4896', 254, 252, 310, 214, 24);
  ell(g, '#ecd6c0', 130, 346, 15, 15);
  ell(g, '#ecd6c0', 316, 206, 15, 15);
  // blade topped with a star
  poly(g, '#eaf2ff', [
    [318, 214],
    [330, 214],
    [334, 40],
    [324, 22],
    [314, 40],
  ]);
  rect(g, '#e8c860', 300, 208, 54, 10, 4);
  g.save();
  g.translate(324, 8);
  poly(
    g,
    '#ffe9a0',
    Array.from({ length: 10 }, (_, i): [number, number] => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? 9 : 22;
      return [r * Math.cos(a), r * Math.sin(a)];
    }),
  );
  g.restore();
  glowHex(g, '#ffe9a0', 324, 20, 70, 0.7);
  ell(g, '#ecd6c0', CX, 180, 36, 42);
  poly(g, '#d9e2ff', [
    [172, 170],
    [CX, 110],
    [250, 170],
    [244, 200],
    [176, 200],
  ]); // pale hair
  poly(g, '#e8c860', [
    [176, 126],
    [190, 96],
    [CX, 120],
    [230, 96],
    [244, 126],
  ]); // crown
  ell(g, '#ffe9a0', CX, 108, 7, 7);
};

// ---- Mire: a hunched necromancer in a drowned-green hood, lantern and bone staff ----
const mire: Painter = (g) => {
  shadow(g, 115);
  poly(g, '#142a1e', [
    [150, 230],
    [270, 230],
    [316, FEET],
    [104, FEET],
  ]);
  poly(g, '#0a1810', [
    [184, 250],
    [236, 250],
    [256, FEET],
    [164, FEET],
  ]);
  poly(g, '#244a34', [
    [136, 220],
    [284, 220],
    [270, 290],
    [150, 290],
  ]);
  limb(g, '#142a1e', 150, 262, 110, 330, 28);
  limb(g, '#142a1e', 272, 262, 322, 300, 28);
  ell(g, '#b9c8a8', 108, 338, 15, 15);
  ell(g, '#b9c8a8', 326, 300, 15, 15);
  // staff topped by a skull
  limb(g, '#d9d4bc', 356, 540, 356, 130, 10);
  ell(g, '#d9d4bc', 356, 112, 24, 22);
  ell(g, '#0a1810', 348, 110, 6, 7);
  ell(g, '#0a1810', 364, 110, 6, 7);
  rect(g, '#d9d4bc', 346, 128, 20, 12, 3);
  glowHex(g, '#9be86a', 356, 112, 60, 0.5);
  // hanging lantern
  limb(g, '#8a8f80', 108, 340, 108, 392, 4);
  rect(g, '#3a4a38', 92, 392, 32, 36, 6);
  ell(g, '#c8ff9a', 108, 410, 9, 12);
  glowHex(g, '#9be86a', 108, 410, 110, 0.85);
  // hood: a dark face with two green eyes
  ell(g, '#142a1e', CX, 176, 62, 66);
  poly(g, '#142a1e', [
    [170, 130],
    [CX, 70],
    [250, 130],
  ]);
  ell(g, '#050e08', CX, 188, 38, 42);
  ell(g, '#9be86a', 198, 186, 7, 5);
  ell(g, '#9be86a', 222, 186, 7, 5);
  glowHex(g, '#9be86a', CX, 186, 40, 0.5);
};

// ---- KP: short, fat and bald, with a hammer, a shotgun on his back and a window pane under his arm ----
const kp: Painter = (g) => {
  shadow(g, 135);
  // stumpy legs
  limb(g, '#5a4a3a', 176, 440, 170, FEET - 8, 46);
  limb(g, '#5a4a3a', 248, 440, 256, FEET - 8, 46);
  rect(g, '#2a2018', 138, FEET - 24, 60, 24, 10);
  rect(g, '#2a2018', 228, FEET - 24, 60, 24, 10);
  // shotgun across the back
  limb(g, '#2a2a30', 130, 300, 300, 420, 12);
  limb(g, '#7a4a22', 96, 276, 140, 306, 18);
  // a huge round belly in a torn coat
  ell(g, '#6a5a3e', CX, 380, 112, 104);
  ell(g, '#8a7650', CX, 392, 78, 76);
  rect(g, '#2a2018', 156, 420, 110, 12, 5);
  rect(g, '#d8b24c', CX - 10, 416, 20, 20, 3);
  ell(g, '#6a5a3e', CX, 300, 86, 56);
  // arms: hammer on the right, pane under the left
  limb(g, '#6a5a3e', 136, 330, 90, 410, 40);
  limb(g, '#6a5a3e', 290, 330, 352, 300, 40);
  ell(g, '#e0a88a', 86, 420, 22, 22);
  ell(g, '#e0a88a', 358, 296, 22, 22);
  // hammer
  limb(g, '#7a4a22', 360, 304, 380, 156, 12);
  rect(g, '#8a8f98', 330, 118, 96, 56, 8);
  rect(g, '#5a606a', 330, 118, 20, 56, 8);
  // window pane under the left arm: glass
  g.save();
  g.translate(60, 330);
  g.rotate(-0.12);
  rect(g, '#7a5a34', -34, -120, 72, 182, 4);
  rect(g, 'rgba(160,230,255,0.75)', -26, -112, 56, 166, 2);
  limb(g, '#7a5a34', 2, -112, 2, 54, 5);
  limb(g, '#7a5a34', -26, -30, 30, -30, 5);
  limb(g, 'rgba(255,255,255,0.8)', -18, -100, 4, -60, 4);
  limb(g, 'rgba(255,255,255,0.6)', -18, -50, 0, -20, 3);
  g.restore();
  // a bottle in the belt
  rect(g, '#3a8a4a', 252, 408, 18, 50, 6);
  rect(g, '#3a8a4a', 257, 392, 8, 20, 3);
  // bald head, red nose, big grey beard
  ell(g, '#e0a88a', CX, 224, 54, 52);
  ell(g, '#f0c0a0', CX - 14, 204, 18, 12);
  ell(g, '#d8605a', CX, 236, 14, 12);
  ell(g, '#fff0e0', 192, 218, 7, 5);
  ell(g, '#fff0e0', 228, 218, 7, 5);
  ell(g, '#2a1a12', 193, 219, 3, 3);
  ell(g, '#2a1a12', 229, 219, 3, 3);
  limb(g, '#6a4a3a', 178, 206, 204, 210, 6);
  limb(g, '#6a4a3a', 216, 210, 244, 206, 6);
  poly(g, '#b8b8c0', [
    [160, 244],
    [260, 244],
    [276, 330],
    [CX, 360],
    [144, 330],
  ]);
  ell(g, '#d8605a', CX, 258, 20, 8);
  // ears
  ell(g, '#e0a88a', 154, 228, 10, 16);
  ell(g, '#e0a88a', 266, 228, 10, 16);
  glowHex(g, '#ff9a3c', CX, 400, 120, 0.12);
};

const PAINTERS: Record<string, Painter> = {
  maren,
  rivet,
  kesh,
  vesper,
  quill,
  ilvane,
  sehra,
  astra,
  mire,
  kp,
};

const cache = new Map<string, HTMLCanvasElement>();

/** The hand-built figure for a Riftwalker, or undefined if it has none yet. */
export function bespokeHero(id: string): HTMLCanvasElement | undefined {
  const paint = PAINTERS[id];
  if (!paint) return undefined;
  let c = cache.get(id);
  if (!c) {
    c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    if (!g) return undefined;
    paint(g);
    light(g);
    cache.set(id, c);
  }
  return c;
}
