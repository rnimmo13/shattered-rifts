// Placeholder card art, painted in code until real illustrations exist (docs/05_ART_PIPELINE.md).
// Each card gets (a) a 4:3 art window with a realm-coloured painted backdrop and (b) a transparent
// "cut-out" of its subject, which is what stands on the battlefield in Phase 3.
// The subject is chosen from the card's tribes and type. Everything is seeded by the card id, so a
// card always looks the same. Swapping in real art later means replacing cardArt() only.

import type { CardDef, Realm } from '@sr/engine';
import { color, rgba } from '../design/tokens';
import { rng } from '../duel/scene/noise';

export type Archetype =
  | 'knight'
  | 'cleric'
  | 'mage'
  | 'engineer'
  | 'cultist'
  | 'wanderer'
  | 'drone'
  | 'mech'
  | 'turret'
  | 'beast'
  | 'insect'
  | 'shade'
  | 'spirit'
  | 'dragon'
  | 'elemental'
  | 'spell'
  | 'trap'
  | 'relic'
  | 'rift';

/** Which silhouette a card gets, from its tribes and type. */
export function archetypeOf(def: Pick<CardDef, 'type' | 'tribes' | 'name'>): Archetype {
  if (def.type === 'spell') return 'spell';
  if (def.type === 'trap') return 'trap';
  if (def.type === 'relic') return 'relic';
  if (def.type === 'rift') return 'rift';
  const t = def.tribes ?? [];
  const has = (x: string) => t.includes(x);
  if (has('Dragon')) return 'dragon';
  if (has('Kaiju')) return 'beast';
  if (has('Insect')) return 'insect';
  if (has('Drone')) return 'drone';
  if (has('AI')) return 'drone';
  if (has('Mech')) return 'mech';
  if (has('Construct')) return /turret/i.test(def.name) ? 'turret' : 'mech';
  if (has('Shade') || has('Lord') || has('Queen')) return 'shade';
  if (has('Spirit')) return 'spirit';
  if (has('Elemental')) return 'elemental';
  if (has('Beast')) return 'beast';
  if (has('Knight')) return 'knight';
  if (has('Cleric')) return 'cleric';
  if (has('Mage')) return 'mage';
  if (has('Engineer') || has('Hacker')) return 'engineer';
  if (has('Cultist')) return 'cultist';
  if (has('Wanderer')) return 'wanderer';
  return 'wanderer';
}

interface Palette {
  sky: [string, string, string];
  glow: string;
  body: [string, string];
  dark: string;
  rim: string;
  eye: string;
}

const PALETTE: Record<Realm, Palette> = {
  aurelion: {
    sky: ['#17265a', '#4a5fb0', '#f3d58a'],
    glow: color.goldLight,
    body: ['#f9efd2', '#a98a45'],
    dark: '#1a1f45',
    rim: color.goldPale,
    eye: '#fff6cf',
  },
  nexus: {
    sky: ['#06121b', '#0e3a4c', '#ff8a3d'],
    glow: color.cyan,
    body: ['#a8bccb', '#2c3d4a'],
    dark: '#0a141c',
    rim: color.cyanGlow,
    eye: color.cyan,
  },
  wyldmaw: {
    sky: ['#1b0a0f', '#521320', '#8a9a40'],
    glow: '#ff6a52',
    body: ['#e3d3ad', '#6f4a2c'],
    dark: '#1a0a0c',
    rim: '#ff8a6a',
    eye: '#ffd08a',
  },
  umbral: {
    sky: ['#0a0615', '#2b1654', '#8ff5e0'],
    glow: color.violetGlow,
    body: ['#46347a', '#0d0919'],
    dark: '#07050f',
    rim: '#8ff5e0',
    eye: '#8ff5e0',
  },
  neutral: {
    sky: ['#0a0c17', '#252845', '#ff4fd8'],
    glow: color.cyanGlow,
    body: ['#d6dcff', '#3a406a'],
    dark: '#0c0e1c',
    rim: color.magenta,
    eye: color.cyanGlow,
  },
};

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  if (!g) throw new Error('2D canvas is unavailable');
  return [c, g];
}

// ---------------------------------------------------------------------------------------------
// Silhouette painters. All draw into a W×H canvas, subject centred, feet near the bottom.
// ---------------------------------------------------------------------------------------------

interface Ctx {
  g: CanvasRenderingContext2D;
  W: number;
  H: number;
  p: Palette;
  r: () => number;
}

/** A body fill: lit from the upper left, falling into shadow, plus a thin rim light. */
function bodyFill(c: Ctx, x0: number, y0: number, x1: number, y1: number): CanvasGradient {
  const gr = c.g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, c.p.body[0]);
  gr.addColorStop(0.45, c.p.body[1]);
  gr.addColorStop(1, c.p.dark);
  return gr;
}

function shape(c: Ctx, pts: [number, number][], fill: string | CanvasGradient, rim = true): void {
  const g = c.g;
  g.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  if (rim) {
    g.strokeStyle = rgba(c.p.rim, 0.55);
    g.lineWidth = 2.2;
    g.lineJoin = 'round';
    g.stroke();
  }
}

function ellipse(
  c: Ctx,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string | CanvasGradient,
  rim = true,
): void {
  const g = c.g;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = fill;
  g.fill();
  if (rim) {
    g.strokeStyle = rgba(c.p.rim, 0.5);
    g.lineWidth = 2;
    g.stroke();
  }
}

function glowDot(c: Ctx, x: number, y: number, r: number, col: string, a = 1): void {
  const g = c.g;
  g.save();
  g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(x, y, 0, x, y, r * 3.2);
  gr.addColorStop(0, rgba(col, a));
  gr.addColorStop(0.35, rgba(col, a * 0.5));
  gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr;
  g.fillRect(x - r * 3.2, y - r * 3.2, r * 6.4, r * 6.4);
  g.restore();
  g.fillStyle = col;
  g.beginPath();
  g.arc(x, y, r * 0.55, 0, Math.PI * 2);
  g.fill();
}

function groundShadow(c: Ctx, w: number): void {
  const g = c.g;
  const gr = g.createRadialGradient(c.W / 2, c.H * 0.94, 0, c.W / 2, c.H * 0.94, w);
  gr.addColorStop(0, 'rgba(0,0,0,0.55)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr;
  g.save();
  g.translate(0, 0);
  g.fillRect(c.W / 2 - w, c.H * 0.94 - w * 0.25, w * 2, w * 0.5);
  g.restore();
}

type Held = 'swordShield' | 'staff' | 'lantern' | 'tool' | 'none';
type Head = 'helm' | 'hood' | 'mask' | 'visor' | 'bare';

function humanoid(c: Ctx, head: Head, held: Held, cape: boolean, scale = 1): void {
  const { g, W, H } = c;
  const cx = W / 2;
  const top = H * (1 - 0.86 * scale) - 6;
  const u = H * 0.86 * scale; // figure height
  const Y = (f: number) => top + u * f;

  groundShadow(c, W * 0.3);
  if (cape) {
    shape(
      c,
      [
        [cx - u * 0.17, Y(0.3)],
        [cx + u * 0.17, Y(0.3)],
        [cx + u * 0.3, Y(0.97)],
        [cx + u * 0.05, Y(0.93)],
        [cx - u * 0.06, Y(1)],
        [cx - u * 0.3, Y(0.94)],
      ],
      bodyFill(c, cx - u * 0.3, Y(0.3), cx + u * 0.3, Y(1)),
    );
  }
  // legs
  shape(
    c,
    [
      [cx - u * 0.1, Y(0.6)],
      [cx - u * 0.01, Y(0.6)],
      [cx - u * 0.03, Y(1)],
      [cx - u * 0.13, Y(1)],
    ],
    bodyFill(c, cx - 40, Y(0.6), cx, Y(1)),
  );
  shape(
    c,
    [
      [cx + u * 0.01, Y(0.6)],
      [cx + u * 0.1, Y(0.6)],
      [cx + u * 0.13, Y(1)],
      [cx + u * 0.03, Y(1)],
    ],
    bodyFill(c, cx, Y(0.6), cx + 40, Y(1)),
  );
  // torso
  shape(
    c,
    [
      [cx - u * 0.14, Y(0.3)],
      [cx + u * 0.14, Y(0.3)],
      [cx + u * 0.1, Y(0.62)],
      [cx - u * 0.1, Y(0.62)],
    ],
    bodyFill(c, cx - u * 0.14, Y(0.3), cx + u * 0.14, Y(0.62)),
  );
  // shoulders
  if (head === 'helm' || held === 'swordShield') {
    ellipse(
      c,
      cx - u * 0.16,
      Y(0.33),
      u * 0.075,
      u * 0.05,
      bodyFill(c, cx - 60, Y(0.28), cx - 20, Y(0.4)),
    );
    ellipse(
      c,
      cx + u * 0.16,
      Y(0.33),
      u * 0.075,
      u * 0.05,
      bodyFill(c, cx + 20, Y(0.28), cx + 60, Y(0.4)),
    );
  }
  // head
  const hy = Y(0.2);
  if (head === 'hood' || head === 'mask') {
    shape(
      c,
      [
        [cx, Y(0.04)],
        [cx + u * 0.1, Y(0.18)],
        [cx + u * 0.12, Y(0.34)],
        [cx - u * 0.12, Y(0.34)],
        [cx - u * 0.1, Y(0.18)],
      ],
      bodyFill(c, cx - 30, Y(0.04), cx + 40, Y(0.34)),
    );
    ellipse(c, cx, hy + 4, u * 0.055, u * 0.065, head === 'mask' ? c.p.body[0] : '#05060c', false);
    glowDot(c, cx - u * 0.022, hy + 2, 3.2, c.p.eye, 0.95);
    glowDot(c, cx + u * 0.022, hy + 2, 3.2, c.p.eye, 0.95);
  } else {
    ellipse(c, cx, hy, u * 0.07, u * 0.075, bodyFill(c, cx - 30, hy - 30, cx + 30, hy + 30));
    if (head === 'helm' || head === 'visor') {
      // visor slit and a plume
      c.g.fillStyle = '#05060c';
      c.g.fillRect(cx - u * 0.05, hy - 2, u * 0.1, 5);
      glowDot(c, cx, hy + 0.5, 2.4, c.p.eye, 0.8);
      if (head === 'helm')
        shape(
          c,
          [
            [cx, hy - u * 0.07],
            [cx + u * 0.03, hy - u * 0.15],
            [cx + u * 0.1, hy - u * 0.1],
            [cx + u * 0.04, hy - u * 0.05],
          ],
          c.p.glow,
          false,
        );
    }
  }
  // held items
  if (held === 'swordShield') {
    // shield on the left, sword on the right
    shape(
      c,
      [
        [cx - u * 0.3, Y(0.36)],
        [cx - u * 0.14, Y(0.36)],
        [cx - u * 0.14, Y(0.52)],
        [cx - u * 0.22, Y(0.64)],
        [cx - u * 0.3, Y(0.52)],
      ],
      bodyFill(c, cx - u * 0.3, Y(0.36), cx - u * 0.1, Y(0.64)),
    );
    g.strokeStyle = rgba(c.p.glow, 0.8);
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(cx - u * 0.22, Y(0.39));
    g.lineTo(cx - u * 0.22, Y(0.6));
    g.moveTo(cx - u * 0.28, Y(0.46));
    g.lineTo(cx - u * 0.16, Y(0.46));
    g.stroke();
    shape(
      c,
      [
        [cx + u * 0.22, Y(0.3)],
        [cx + u * 0.235, Y(0.62)],
        [cx + u * 0.205, Y(0.62)],
      ],
      '#e9f0ff',
    );
    g.fillStyle = c.p.glow;
    g.fillRect(cx + u * 0.19, Y(0.62), u * 0.07, 5);
  } else if (held === 'staff') {
    g.strokeStyle = bodyFill(c, cx + u * 0.2, Y(0.1), cx + u * 0.24, Y(1));
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(cx + u * 0.22, Y(0.02));
    g.lineTo(cx + u * 0.22, Y(0.98));
    g.stroke();
    glowDot(c, cx + u * 0.22, Y(0.0), 9, c.p.glow, 1);
  } else if (held === 'lantern') {
    g.strokeStyle = rgba(c.p.rim, 0.7);
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(cx + u * 0.15, Y(0.4));
    g.lineTo(cx + u * 0.24, Y(0.52));
    g.stroke();
    glowDot(c, cx + u * 0.25, Y(0.56), 9, c.p.glow, 1);
  } else if (held === 'tool') {
    shape(
      c,
      [
        [cx + u * 0.16, Y(0.42)],
        [cx + u * 0.3, Y(0.4)],
        [cx + u * 0.32, Y(0.47)],
        [cx + u * 0.17, Y(0.5)],
      ],
      bodyFill(c, cx + 60, Y(0.4), cx + 120, Y(0.5)),
    );
    glowDot(c, cx + u * 0.3, Y(0.44), 4, c.p.glow, 0.9);
  }
}

function drone(c: Ctx, big: boolean): void {
  const { g, W, H } = c;
  const cx = W / 2;
  const cy = H * 0.5;
  const r = H * (big ? 0.3 : 0.24);
  groundShadow(c, W * 0.22);
  // hover glow beneath
  glowDot(c, cx, H * 0.9, 16, c.p.glow, 0.5);
  // thruster arms
  for (const s of [-1, 1]) {
    shape(
      c,
      [
        [cx + s * r * 0.8, cy - 8],
        [cx + s * r * 1.5, cy - 24],
        [cx + s * r * 1.55, cy - 8],
        [cx + s * r * 0.9, cy + 12],
      ],
      bodyFill(c, cx, cy - 30, cx + s * 120, cy + 20),
    );
  }
  // orbit ring
  g.strokeStyle = rgba(c.p.glow, 0.7);
  g.lineWidth = 4;
  g.beginPath();
  g.ellipse(cx, cy, r * 1.25, r * 0.38, -0.25, 0, Math.PI * 2);
  g.stroke();
  // shell
  const shell = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
  shell.addColorStop(0, c.p.body[0]);
  shell.addColorStop(0.6, c.p.body[1]);
  shell.addColorStop(1, c.p.dark);
  ellipse(c, cx, cy, r, r, shell);
  // plating seam and the eye
  g.strokeStyle = 'rgba(0,0,0,0.55)';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(cx, cy, r * 0.82, Math.PI * 0.15, Math.PI * 0.85);
  g.stroke();
  ellipse(c, cx, cy, r * 0.36, r * 0.36, '#05080d', false);
  glowDot(c, cx, cy, r * 0.2, c.p.eye, 1);
}

function mech(c: Ctx): void {
  const { g, W, H } = c;
  const cx = W / 2;
  groundShadow(c, W * 0.32);
  const t = H * 0.12;
  const u = H * 0.82;
  const Y = (f: number) => t + u * f;
  // legs (piston-like)
  for (const s of [-1, 1]) {
    shape(
      c,
      [
        [cx + s * u * 0.05, Y(0.6)],
        [cx + s * u * 0.22, Y(0.6)],
        [cx + s * u * 0.26, Y(0.82)],
        [cx + s * u * 0.18, Y(1)],
        [cx + s * u * 0.06, Y(1)],
        [cx + s * u * 0.1, Y(0.82)],
      ],
      bodyFill(c, cx + s * 20, Y(0.6), cx + s * 100, Y(1)),
    );
  }
  // torso
  shape(
    c,
    [
      [cx - u * 0.26, Y(0.25)],
      [cx + u * 0.26, Y(0.25)],
      [cx + u * 0.2, Y(0.64)],
      [cx - u * 0.2, Y(0.64)],
    ],
    bodyFill(c, cx - u * 0.26, Y(0.25), cx + u * 0.26, Y(0.64)),
  );
  // shoulder cannons
  for (const s of [-1, 1]) {
    shape(
      c,
      [
        [cx + s * u * 0.26, Y(0.2)],
        [cx + s * u * 0.42, Y(0.22)],
        [cx + s * u * 0.44, Y(0.38)],
        [cx + s * u * 0.26, Y(0.42)],
      ],
      bodyFill(c, cx + s * 80, Y(0.2), cx + s * 160, Y(0.42)),
    );
    glowDot(c, cx + s * u * 0.4, Y(0.3), 5, c.p.glow, 0.8);
  }
  // head with a visor
  shape(
    c,
    [
      [cx - u * 0.1, Y(0.08)],
      [cx + u * 0.1, Y(0.08)],
      [cx + u * 0.12, Y(0.24)],
      [cx - u * 0.12, Y(0.24)],
    ],
    bodyFill(c, cx - 30, Y(0.08), cx + 30, Y(0.24)),
  );
  g.fillStyle = '#05080d';
  g.fillRect(cx - u * 0.08, Y(0.14), u * 0.16, 7);
  glowDot(c, cx, Y(0.145), 3, c.p.eye, 1);
  // core glow in the chest
  glowDot(c, cx, Y(0.45), 9, c.p.glow, 0.9);
}

function turret(c: Ctx): void {
  const { g, W, H } = c;
  const cx = W / 2;
  groundShadow(c, W * 0.26);
  shape(
    c,
    [
      [cx - W * 0.22, H * 0.93],
      [cx + W * 0.22, H * 0.93],
      [cx + W * 0.16, H * 0.74],
      [cx - W * 0.16, H * 0.74],
    ],
    bodyFill(c, cx - 80, H * 0.74, cx + 80, H * 0.93),
  );
  const dome = g.createRadialGradient(cx - 20, H * 0.5, 10, cx, H * 0.58, W * 0.2);
  dome.addColorStop(0, c.p.body[0]);
  dome.addColorStop(1, c.p.dark);
  g.beginPath();
  g.arc(cx, H * 0.7, W * 0.2, Math.PI, 0);
  g.closePath();
  g.fillStyle = dome;
  g.fill();
  g.strokeStyle = rgba(c.p.rim, 0.5);
  g.lineWidth = 2;
  g.stroke();
  shape(
    c,
    [
      [cx + 6, H * 0.52],
      [cx + W * 0.36, H * 0.44],
      [cx + W * 0.37, H * 0.51],
      [cx + 8, H * 0.6],
    ],
    bodyFill(c, cx, H * 0.45, cx + 140, H * 0.55),
  );
  glowDot(c, cx + W * 0.36, H * 0.475, 6, c.p.glow, 1);
  glowDot(c, cx, H * 0.68, 5, c.p.eye, 0.9);
}

function beast(c: Ctx, huge: boolean): void {
  const { g, W, H } = c;
  const cx = W / 2;
  const s = huge ? 1.08 : 0.94;
  const Y = (f: number) => H * (0.06 + 0.9 * f);
  const X = (f: number) => cx + W * f * s;
  groundShadow(c, W * 0.34);
  // shoulders / mane spikes
  for (let i = 0; i < 7; i++) {
    const a = Math.PI + (i / 6) * Math.PI;
    const px = cx + Math.cos(a) * W * 0.38 * s;
    const py = Y(0.55) + Math.sin(a) * H * 0.2 * s;
    shape(
      c,
      [
        [px - 14, py + 24],
        [px + (px < cx ? -22 : 22), py - 36 - c.r() * 20],
        [px + 14, py + 24],
      ],
      bodyFill(c, px - 20, py - 40, px + 20, py + 30),
      true,
    );
  }
  // body mass
  shape(
    c,
    [
      [X(-0.4), Y(1)],
      [X(-0.34), Y(0.55)],
      [X(-0.18), Y(0.38)],
      [X(0.18), Y(0.38)],
      [X(0.34), Y(0.55)],
      [X(0.4), Y(1)],
    ],
    bodyFill(c, X(-0.4), Y(0.38), X(0.4), Y(1)),
  );
  // head: heavy skull
  shape(
    c,
    [
      [X(-0.2), Y(0.22)],
      [X(-0.12), Y(0.06)],
      [X(0.12), Y(0.06)],
      [X(0.2), Y(0.22)],
      [X(0.16), Y(0.46)],
      [X(0.07), Y(0.55)],
      [X(-0.07), Y(0.55)],
      [X(-0.16), Y(0.46)],
    ],
    bodyFill(c, X(-0.2), Y(0.06), X(0.2), Y(0.55)),
  );
  // horns
  for (const sgn of [-1, 1]) {
    g.beginPath();
    g.moveTo(X(sgn * 0.12), Y(0.1));
    g.quadraticCurveTo(X(sgn * 0.34), Y(0.08), X(sgn * 0.3), Y(-0.03));
    g.quadraticCurveTo(X(sgn * 0.22), Y(0.04), X(sgn * 0.08), Y(0.16));
    g.closePath();
    g.fillStyle = c.p.body[0];
    g.fill();
    g.strokeStyle = rgba(c.p.rim, 0.5);
    g.lineWidth = 2;
    g.stroke();
  }
  // maw with teeth
  g.fillStyle = '#05060c';
  g.beginPath();
  g.moveTo(X(-0.12), Y(0.4));
  g.lineTo(X(0.12), Y(0.4));
  g.lineTo(X(0.08), Y(0.54));
  g.lineTo(X(-0.08), Y(0.54));
  g.closePath();
  g.fill();
  g.fillStyle = '#f4ecd6';
  for (let i = 0; i < 6; i++) {
    const tx = X(-0.11 + i * 0.044);
    g.beginPath();
    g.moveTo(tx, Y(0.4));
    g.lineTo(tx + 6, Y(0.4));
    g.lineTo(tx + 3, Y(0.4) + 18 + (i % 2) * 6);
    g.closePath();
    g.fill();
  }
  // eyes
  glowDot(c, X(-0.075), Y(0.25), 5, c.p.eye, 1);
  glowDot(c, X(0.075), Y(0.25), 5, c.p.eye, 1);
}

function insect(c: Ctx): void {
  const { g, W, H } = c;
  const cx = W / 2;
  groundShadow(c, W * 0.3);
  // wings
  g.save();
  g.globalAlpha = 0.5;
  for (const s of [-1, 1]) {
    shape(
      c,
      [
        [cx + s * 12, H * 0.38],
        [cx + s * W * 0.42, H * 0.12],
        [cx + s * W * 0.36, H * 0.46],
        [cx + s * 14, H * 0.5],
      ],
      rgba(c.p.glow, 0.28),
    );
  }
  g.restore();
  // legs
  g.strokeStyle = c.p.dark;
  g.lineWidth = 6;
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(cx + s * 16, H * (0.5 + i * 0.08));
      g.lineTo(cx + s * (W * 0.24 + i * 6), H * (0.6 + i * 0.1));
      g.lineTo(cx + s * (W * 0.3 + i * 8), H * 0.95);
      g.stroke();
    }
  }
  // abdomen, thorax, head
  ellipse(c, cx, H * 0.7, W * 0.17, H * 0.2, bodyFill(c, cx - 60, H * 0.5, cx + 60, H * 0.9));
  ellipse(c, cx, H * 0.46, W * 0.12, H * 0.1, bodyFill(c, cx - 40, H * 0.36, cx + 40, H * 0.56));
  ellipse(c, cx, H * 0.3, W * 0.1, H * 0.085, bodyFill(c, cx - 30, H * 0.22, cx + 30, H * 0.38));
  for (const s of [-1, 1]) {
    shape(
      c,
      [
        [cx + s * 10, H * 0.34],
        [cx + s * 40, H * 0.4],
        [cx + s * 20, H * 0.43],
      ],
      c.p.body[0],
      false,
    );
    glowDot(c, cx + s * 22, H * 0.28, 4, c.p.eye, 1);
  }
}

function shade(c: Ctx): void {
  const { g, W, H } = c;
  const cx = W / 2;
  // tall wispy cloak fading into tendrils
  shape(
    c,
    [
      [cx, H * 0.04],
      [cx + W * 0.13, H * 0.2],
      [cx + W * 0.2, H * 0.55],
      [cx + W * 0.3, H * 0.96],
      [cx + W * 0.14, H * 0.88],
      [cx + W * 0.06, H],
      [cx - W * 0.06, H * 0.9],
      [cx - W * 0.17, H * 0.99],
      [cx - W * 0.3, H * 0.92],
      [cx - W * 0.2, H * 0.55],
      [cx - W * 0.13, H * 0.2],
    ],
    bodyFill(c, cx - W * 0.2, H * 0.04, cx + W * 0.2, H),
  );
  g.save();
  g.globalCompositeOperation = 'destination-out';
  const fade = g.createLinearGradient(0, H * 0.7, 0, H);
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(1, 'rgba(0,0,0,0.85)');
  g.fillStyle = fade;
  g.fillRect(0, H * 0.7, W, H * 0.3);
  g.restore();
  ellipse(c, cx, H * 0.19, W * 0.07, H * 0.075, '#04030a', false);
  glowDot(c, cx - W * 0.03, H * 0.185, 4.5, c.p.eye, 1);
  glowDot(c, cx + W * 0.03, H * 0.185, 4.5, c.p.eye, 1);
}

function spirit(c: Ctx): void {
  const { g, W, H } = c;
  const cx = W / 2;
  // afterimages
  for (let i = 3; i >= 0; i--) {
    g.save();
    g.globalAlpha = 0.12 + (3 - i) * 0.1;
    g.translate(-i * 26, i * 10);
    g.beginPath();
    g.moveTo(cx + 30, H * 0.3);
    g.bezierCurveTo(cx + 90, H * 0.45, cx + 10, H * 0.82, cx - 70, H * 0.9);
    g.bezierCurveTo(cx - 20, H * 0.72, cx - 40, H * 0.5, cx - 20, H * 0.32);
    g.fillStyle = c.p.glow;
    g.fill();
    g.restore();
  }
  const bodyGr = g.createRadialGradient(cx, H * 0.3, 4, cx, H * 0.38, W * 0.26);
  bodyGr.addColorStop(0, '#ffffff');
  bodyGr.addColorStop(0.4, c.p.body[0]);
  bodyGr.addColorStop(1, rgba(c.p.glow, 0.1));
  g.beginPath();
  g.ellipse(cx, H * 0.36, W * 0.2, H * 0.2, 0, 0, Math.PI * 2);
  g.fillStyle = bodyGr;
  g.fill();
  glowDot(c, cx - 14, H * 0.34, 4, '#10131f', 1);
  glowDot(c, cx + 14, H * 0.34, 4, '#10131f', 1);
}

function dragon(c: Ctx): void {
  const { g, W, H } = c;
  const cx = W / 2;
  groundShadow(c, W * 0.3);
  // wings, spread wide
  for (const s of [-1, 1]) {
    shape(
      c,
      [
        [cx + s * 20, H * 0.34],
        [cx + s * W * 0.46, H * 0.04],
        [cx + s * W * 0.5, H * 0.3],
        [cx + s * W * 0.4, H * 0.34],
        [cx + s * W * 0.42, H * 0.5],
        [cx + s * W * 0.3, H * 0.46],
        [cx + s * W * 0.28, H * 0.6],
        [cx + s * 22, H * 0.5],
      ],
      bodyFill(c, cx, H * 0.04, cx + s * 200, H * 0.6),
    );
    g.strokeStyle = rgba(c.p.dark, 0.7);
    g.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(cx + s * 24, H * 0.36);
      g.lineTo(cx + s * W * (0.34 + i * 0.07), H * (0.12 + i * 0.16));
      g.stroke();
    }
  }
  // body, neck and head
  ellipse(c, cx, H * 0.62, W * 0.14, H * 0.22, bodyFill(c, cx - 50, H * 0.4, cx + 50, H * 0.9));
  shape(
    c,
    [
      [cx - W * 0.04, H * 0.46],
      [cx + W * 0.04, H * 0.46],
      [cx + W * 0.06, H * 0.22],
      [cx - W * 0.05, H * 0.22],
    ],
    bodyFill(c, cx - 20, H * 0.2, cx + 20, H * 0.46),
  );
  shape(
    c,
    [
      [cx - W * 0.07, H * 0.2],
      [cx + W * 0.07, H * 0.2],
      [cx + W * 0.1, H * 0.1],
      [cx, H * 0.06],
      [cx - W * 0.1, H * 0.1],
    ],
    bodyFill(c, cx - 30, H * 0.06, cx + 30, H * 0.2),
  );
  for (const s of [-1, 1]) {
    shape(
      c,
      [
        [cx + s * W * 0.04, H * 0.09],
        [cx + s * W * 0.12, H * 0.0],
        [cx + s * W * 0.07, H * 0.1],
      ],
      c.p.body[0],
      false,
    );
    glowDot(c, cx + s * W * 0.035, H * 0.13, 3.5, c.p.eye, 1);
  }
  glowDot(c, cx, H * 0.58, 12, c.p.glow, 0.8);
}

function elemental(c: Ctx): void {
  const { g, W, H } = c;
  const cx = W / 2;
  groundShadow(c, W * 0.3);
  const crystals: [number, number, number, number, number][] = [
    [-0.18, 0.95, 0.12, 0.56, -0.18],
    [0.2, 0.95, 0.12, 0.5, 0.16],
    [0, 0.97, 0.16, 0.88, 0],
    [-0.08, 0.95, 0.1, 0.66, -0.07],
    [0.1, 0.95, 0.1, 0.7, 0.08],
  ];
  for (const [dx, base, w, h, lean] of crystals) {
    const bx = cx + dx * W;
    const by = H * base;
    const tx = bx + lean * W;
    const ty = by - h * H;
    const fill = g.createLinearGradient(bx - w * W, by, bx + w * W, ty);
    fill.addColorStop(0, c.p.dark);
    fill.addColorStop(0.5, c.p.body[1]);
    fill.addColorStop(1, c.p.body[0]);
    shape(
      c,
      [
        [bx - w * W * 0.5, by],
        [bx - w * W * 0.55, by - h * H * 0.7],
        [tx, ty],
        [bx + w * W * 0.55, by - h * H * 0.7],
        [bx + w * W * 0.5, by],
      ],
      fill,
    );
    g.strokeStyle = rgba(c.p.glow, 0.55);
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(tx, ty);
    g.lineTo(bx, by - h * H * 0.2);
    g.stroke();
  }
  glowDot(c, cx, H * 0.55, 16, c.p.glow, 0.7);
}

function spellBurst(c: Ctx): void {
  const { g, W, H } = c;
  const cx = W / 2;
  const cy = H * 0.52;
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + c.r() * 0.2;
    const len = W * (0.28 + c.r() * 0.22);
    const gr = g.createLinearGradient(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    gr.addColorStop(0, rgba(c.p.glow, 0.9));
    gr.addColorStop(1, rgba(c.p.glow, 0));
    g.strokeStyle = gr;
    g.lineWidth = 3 + c.r() * 5;
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    g.stroke();
  }
  g.restore();
  // rune circle
  g.strokeStyle = rgba(c.p.rim, 0.8);
  g.lineWidth = 3;
  for (const [r, dash] of [
    [W * 0.3, [4, 10]],
    [W * 0.22, []],
    [W * 0.14, [2, 6]],
  ] as [number, number[]][]) {
    g.setLineDash(dash);
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.stroke();
  }
  g.setLineDash([]);
  glowDot(c, cx, cy, 20, '#ffffff', 1);
}

function trapJaws(c: Ctx): void {
  const { g, W, H } = c;
  const cx = W / 2;
  const cy = H * 0.52;
  // a dark pit with a sealed-eye glow, ringed by fangs (the moment a trap springs)
  const pit = g.createRadialGradient(cx, cy, 6, cx, cy, W * 0.34);
  pit.addColorStop(0, rgba(c.p.glow, 0.9));
  pit.addColorStop(0.3, '#05060c');
  pit.addColorStop(1, 'rgba(5,6,12,0)');
  g.fillStyle = pit;
  g.beginPath();
  g.ellipse(cx, cy, W * 0.36, H * 0.3, 0, 0, Math.PI * 2);
  g.fill();
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rx = W * 0.34;
    const ry = H * 0.28;
    const bx = cx + Math.cos(a) * rx;
    const by = cy + Math.sin(a) * ry;
    const tx = cx + Math.cos(a) * rx * 0.55;
    const ty = cy + Math.sin(a) * ry * 0.55;
    const nx = -Math.sin(a) * 15;
    const ny = Math.cos(a) * 15;
    shape(
      c,
      [
        [bx + nx, by + ny],
        [tx, ty],
        [bx - nx, by - ny],
      ],
      '#f2ead2',
    );
  }
  glowDot(c, cx, cy, 10, c.p.eye, 1);
}

function relicObject(c: Ctx): void {
  const { g, W, H } = c;
  const cx = W / 2;
  groundShadow(c, W * 0.28);
  // plinth
  shape(
    c,
    [
      [cx - W * 0.2, H * 0.94],
      [cx + W * 0.2, H * 0.94],
      [cx + W * 0.15, H * 0.76],
      [cx - W * 0.15, H * 0.76],
    ],
    bodyFill(c, cx - 80, H * 0.76, cx + 80, H * 0.94),
  );
  // floating crystal in a cradle
  glowDot(c, cx, H * 0.5, 22, c.p.glow, 0.7);
  const fill = g.createLinearGradient(cx - 60, H * 0.28, cx + 60, H * 0.72);
  fill.addColorStop(0, '#ffffff');
  fill.addColorStop(0.4, c.p.glow);
  fill.addColorStop(1, c.p.dark);
  shape(
    c,
    [
      [cx, H * 0.26],
      [cx + W * 0.13, H * 0.48],
      [cx, H * 0.74],
      [cx - W * 0.13, H * 0.48],
    ],
    fill,
  );
  g.strokeStyle = rgba('#ffffff', 0.5);
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(cx, H * 0.26);
  g.lineTo(cx, H * 0.74);
  g.moveTo(cx - W * 0.13, H * 0.48);
  g.lineTo(cx + W * 0.13, H * 0.48);
  g.stroke();
}

const PAINT: Record<Archetype, (c: Ctx) => void> = {
  knight: (c) => humanoid(c, 'helm', 'swordShield', true),
  cleric: (c) => humanoid(c, 'hood', 'staff', true),
  mage: (c) => humanoid(c, 'hood', 'staff', true),
  engineer: (c) => humanoid(c, 'visor', 'tool', false),
  cultist: (c) => humanoid(c, 'mask', 'lantern', true),
  wanderer: (c) => humanoid(c, 'hood', 'lantern', true),
  drone: (c) => drone(c, false),
  mech: mech,
  turret: turret,
  beast: (c) => beast(c, false),
  insect: insect,
  shade: shade,
  spirit: spirit,
  dragon: dragon,
  elemental: elemental,
  spell: spellBurst,
  trap: trapJaws,
  relic: relicObject,
  rift: () => undefined,
};

// ---------------------------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------------------------

export interface CardArt {
  /** 4:3 art window: backdrop + subject. */
  window: HTMLCanvasElement;
  /** The subject alone on a transparent background (what stands on the battlefield). */
  cutout: HTMLCanvasElement;
  archetype: Archetype;
}

const cache = new Map<string, CardArt>();

export function cardArt(def: CardDef): CardArt {
  const hit = cache.get(def.id);
  if (hit) return hit;
  const palette = PALETTE[def.realm];
  const archetype = archetypeOf(def);
  const r = rng(hashSeed(def.id));

  // --- cut-out ---
  const CW = 420;
  const CH = 560;
  const [cutout, cg] = canvas(CW, CH);
  const big = def.rarity === 'legendary' || def.rarity === 'mythic';
  const ctx: Ctx = { g: cg, W: CW, H: CH, p: palette, r };
  if (archetype === 'beast' && def.tribes?.includes('Kaiju')) beast(ctx, true);
  else if (archetype === 'drone' && def.tribes?.includes('AI')) drone(ctx, true);
  else PAINT[archetype](ctx);
  void big;

  // --- window ---
  const WW = 640;
  const WH = 480;
  const [win, g] = canvas(WW, WH);
  const sky = g.createLinearGradient(0, 0, 0, WH);
  sky.addColorStop(0, palette.sky[0]);
  sky.addColorStop(0.55, palette.sky[1]);
  sky.addColorStop(1, palette.sky[2]);
  g.fillStyle = sky;
  g.fillRect(0, 0, WW, WH);
  // painterly blobs and brush strokes
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 12; i++) {
    const x = r() * WW;
    const y = r() * WH;
    const rad = 80 + r() * 160;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, rgba(palette.glow, 0.07 + r() * 0.06));
    gr.addColorStop(1, rgba(palette.glow, 0));
    g.fillStyle = gr;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  g.globalCompositeOperation = 'source-over';
  // distant jagged horizon
  g.fillStyle = rgba(palette.dark, 0.7);
  g.beginPath();
  g.moveTo(0, WH * 0.78);
  for (let x = 0; x <= WW; x += 32) g.lineTo(x, WH * (0.68 + r() * 0.12));
  g.lineTo(WW, WH);
  g.lineTo(0, WH);
  g.closePath();
  g.fill();
  // halo behind the subject
  g.globalCompositeOperation = 'lighter';
  const halo = g.createRadialGradient(WW / 2, WH * 0.5, 0, WW / 2, WH * 0.5, WH * 0.62);
  halo.addColorStop(0, rgba(palette.glow, 0.5));
  halo.addColorStop(1, rgba(palette.glow, 0));
  g.fillStyle = halo;
  g.fillRect(0, 0, WW, WH);
  g.globalCompositeOperation = 'source-over';

  if (archetype === 'rift') {
    // a landscape with a tear: no single subject
    g.fillStyle = '#05060c';
    g.beginPath();
    g.moveTo(0, WH * 0.8);
    for (let x = 0; x <= WW; x += 40) g.lineTo(x, WH * (0.7 + r() * 0.16));
    g.lineTo(WW, WH);
    g.lineTo(0, WH);
    g.fill();
    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = rgba(palette.glow, 0.9);
    g.lineWidth = 8;
    g.beginPath();
    g.moveTo(WW * 0.55, 0);
    for (let y = 0; y <= WH * 0.75; y += 40) g.lineTo(WW * 0.5 + (r() - 0.5) * 60, y);
    g.stroke();
    g.strokeStyle = '#ffffff';
    g.lineWidth = 2.5;
    g.stroke();
    g.globalCompositeOperation = 'source-over';
  } else {
    const k = (WH * 0.96) / CH;
    const dw = CW * k;
    g.drawImage(cutout, (WW - dw) / 2, WH * 0.04, dw, CH * k);
  }
  // soft vignette at the window's edges
  const vg = g.createRadialGradient(WW / 2, WH / 2, WH * 0.35, WW / 2, WH / 2, WH * 0.85);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  g.fillStyle = vg;
  g.fillRect(0, 0, WW, WH);
  // film grain
  g.fillStyle = 'rgba(255,255,255,0.035)';
  for (let i = 0; i < 700; i++) g.fillRect(r() * WW, r() * WH, 1.5, 1.5);

  const art = { window: win, cutout, archetype };
  cache.set(def.id, art);
  return art;
}

const urlCache = new Map<string, string>();
/** The art window as a data URL for <img> (cached). */
export function cardArtUrl(def: CardDef): string {
  let u = urlCache.get(def.id);
  if (!u) {
    u = cardArt(def).window.toDataURL('image/webp', 0.88);
    cache.get(def.id)?.window.getContext('2d')?.clearRect(0, 0, 1, 1);
    urlCache.set(def.id, u);
  }
  return u;
}

const avatarCache = new Map<string, HTMLCanvasElement>();
/** A standing figure for a Riftwalker or enemy: a cut-out like a monster's, painted in a realm's colours. */
export function avatarCutout(kind: Archetype, realm: Realm, seedKey: string): HTMLCanvasElement {
  const key = `${kind}:${realm}:${seedKey}`;
  const hit = avatarCache.get(key);
  if (hit) return hit;
  const [c, g] = canvas(420, 560);
  PAINT[kind]({ g, W: 420, H: 560, p: PALETTE[realm], r: rng(hashSeed(seedKey)) });
  avatarCache.set(key, c);
  return c;
}
