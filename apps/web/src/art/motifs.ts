// Card-art motifs: what a card DOES drawn as a bold picture (slashes, a shield, a burst, a flame...), so cards stop looking
// alike. Painted on the shared 640x480 art window, in the realm's colours, deterministic per card. Placeholder art until
// the real art pipeline (docs/05) replaces it.

import { rgba } from '../design/tokens';

export type Motif =
  | 'slash'
  | 'flurry'
  | 'burst'
  | 'shield'
  | 'heal'
  | 'flame'
  | 'curse'
  | 'draw'
  | 'power'
  | 'snare'
  | 'crystal'
  | 'rune';

export interface MotifPalette {
  glow: string;
  rim: string;
  dark: string;
  body: [string, string];
}

type G = CanvasRenderingContext2D;

function glowStroke(g: G, color: string, width: number, draw: () => void): void {
  g.save();
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.globalCompositeOperation = 'lighter';
  g.strokeStyle = rgba(color, 0.35);
  g.lineWidth = width * 4;
  draw();
  g.stroke();
  g.strokeStyle = rgba(color, 0.7);
  g.lineWidth = width * 2;
  draw();
  g.stroke();
  g.globalCompositeOperation = 'source-over';
  g.strokeStyle = '#ffffff';
  g.lineWidth = width * 0.7;
  draw();
  g.stroke();
  g.restore();
}

function sparks(
  g: G,
  W: number,
  H: number,
  p: MotifPalette,
  r: () => number,
  n: number,
  cx = W / 2,
  cy = H / 2,
  spread = 0.4,
): void {
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = (0.05 + r() * spread) * W;
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d * 0.8;
    const s = 1.5 + r() * 4;
    const gr = g.createRadialGradient(x, y, 0, x, y, s * 3);
    gr.addColorStop(0, rgba(p.rim, 0.95));
    gr.addColorStop(1, rgba(p.glow, 0));
    g.fillStyle = gr;
    g.fillRect(x - s * 3, y - s * 3, s * 6, s * 6);
  }
  g.restore();
}

function slash(
  g: G,
  W: number,
  H: number,
  p: MotifPalette,
  r: () => number,
  count: number,
  big: boolean,
): void {
  const baseAngle = -0.5 + (r() - 0.5) * 0.5;
  for (let i = 0; i < count; i++) {
    const off = (i - (count - 1) / 2) * (big ? 70 : 46);
    const len = (big ? 0.62 : 0.45) * W * (0.85 + r() * 0.3);
    const cx = W / 2 + off * 0.6;
    const cy = H / 2 + off * 0.35;
    const a = baseAngle + (r() - 0.5) * 0.25;
    const dx = Math.cos(a) * len * 0.5;
    const dy = Math.sin(a) * len * 0.5;
    glowStroke(g, p.glow, big ? 9 : 5, () => {
      g.beginPath();
      g.moveTo(cx - dx, cy + dy);
      g.quadraticCurveTo(cx + dy * 0.6, cy + dx * 0.4 - 40, cx + dx, cy - dy);
    });
  }
  sparks(g, W, H, p, r, 26);
}

function burst(g: G, W: number, H: number, p: MotifPalette, r: () => number): void {
  const cx = W / 2;
  const cy = H * 0.52;
  g.save();
  g.globalCompositeOperation = 'lighter';
  const core = g.createRadialGradient(cx, cy, 0, cx, cy, H * 0.5);
  core.addColorStop(0, rgba('#ffffff', 0.95));
  core.addColorStop(0.25, rgba(p.rim, 0.7));
  core.addColorStop(1, rgba(p.glow, 0));
  g.fillStyle = core;
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + r() * 0.2;
    const len = H * (0.28 + r() * 0.22);
    g.strokeStyle = rgba(p.rim, 0.75);
    g.lineWidth = 2 + r() * 5;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * H * 0.1, cy + Math.sin(a) * H * 0.1);
    g.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    g.stroke();
  }
  g.restore();
  glowStroke(g, p.glow, 4, () => {
    g.beginPath();
    g.ellipse(cx, cy, H * 0.36, H * 0.3, 0, 0, Math.PI * 2);
  });
  sparks(g, W, H, p, r, 30, cx, cy, 0.38);
}

function shield(g: G, W: number, H: number, p: MotifPalette, r: () => number): void {
  const cx = W / 2;
  const top = H * 0.14;
  const bot = H * 0.9;
  const w = H * 0.36;
  const path = () => {
    g.beginPath();
    g.moveTo(cx - w, top + 40);
    g.quadraticCurveTo(cx, top - 28, cx + w, top + 40);
    g.lineTo(cx + w, H * 0.5);
    g.quadraticCurveTo(cx + w * 0.8, bot - 70, cx, bot);
    g.quadraticCurveTo(cx - w * 0.8, bot - 70, cx - w, H * 0.5);
    g.closePath();
  };
  g.save();
  const fill = g.createLinearGradient(cx - w, top, cx + w, bot);
  fill.addColorStop(0, p.body[0]);
  fill.addColorStop(1, p.body[1]);
  path();
  g.fillStyle = fill;
  g.fill();
  g.globalCompositeOperation = 'lighter';
  const sheen = g.createLinearGradient(cx - w, top, cx, bot);
  sheen.addColorStop(0, rgba('#ffffff', 0.35));
  sheen.addColorStop(0.5, rgba('#ffffff', 0));
  path();
  g.fillStyle = sheen;
  g.fill();
  g.restore();
  glowStroke(g, p.rim, 4, path);
  // emblem
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.fillStyle = rgba(p.glow, 0.85);
  g.beginPath();
  g.moveTo(cx, H * 0.28);
  g.lineTo(cx + w * 0.42, H * 0.46);
  g.lineTo(cx, H * 0.66);
  g.lineTo(cx - w * 0.42, H * 0.46);
  g.closePath();
  g.fill();
  g.restore();
  sparks(g, W, H, p, r, 14, cx, H * 0.5, 0.3);
}

function heal(g: G, W: number, H: number, p: MotifPalette, r: () => number): void {
  const cx = W / 2;
  const cy = H * 0.52;
  g.save();
  g.globalCompositeOperation = 'lighter';
  const aura = g.createRadialGradient(cx, cy, 0, cx, cy, H * 0.55);
  aura.addColorStop(0, rgba('#9dffc8', 0.55));
  aura.addColorStop(1, rgba('#9dffc8', 0));
  g.fillStyle = aura;
  g.fillRect(0, 0, W, H);
  g.restore();
  const arm = H * 0.26;
  const thick = H * 0.1;
  glowStroke(g, '#6df0a8', 7, () => {
    g.beginPath();
    g.rect(cx - thick, cy - arm, thick * 2, arm * 2);
    g.rect(cx - arm, cy - thick, arm * 2, thick * 2);
  });
  sparks(g, W, H, { ...p, rim: '#d8ffe9', glow: '#6df0a8' }, r, 34, cx, cy, 0.34);
}

function flame(g: G, W: number, H: number, p: MotifPalette, r: () => number): void {
  const cx = W / 2;
  const base = H * 0.88;
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const x = cx + (i - 2) * W * 0.08 + (r() - 0.5) * 20;
    const h = H * (0.45 + r() * 0.35) * (1 - Math.abs(i - 2) * 0.12);
    const w = W * (0.07 + r() * 0.04);
    const gr = g.createLinearGradient(0, base, 0, base - h);
    gr.addColorStop(0, rgba('#ff5a2a', 0.9));
    gr.addColorStop(0.55, rgba('#ffb347', 0.85));
    gr.addColorStop(1, rgba('#fff3b0', 0));
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(x - w, base);
    g.quadraticCurveTo(x - w * 1.3, base - h * 0.55, x + (r() - 0.5) * 20, base - h);
    g.quadraticCurveTo(x + w * 1.3, base - h * 0.5, x + w, base);
    g.closePath();
    g.fill();
  }
  g.restore();
  sparks(g, W, H, { ...p, rim: '#ffe3a0', glow: '#ff8a3d' }, r, 38, cx, H * 0.5, 0.36);
}

function curse(g: G, W: number, H: number, p: MotifPalette, r: () => number): void {
  const cx = W / 2;
  const cy = H * 0.5;
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    g.strokeStyle = rgba(p.glow, 0.5);
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * H * 0.34, cy + Math.sin(a) * H * 0.2);
    g.lineTo(cx + Math.cos(a) * H * 0.56, cy + Math.sin(a) * H * 0.38);
    g.stroke();
  }
  g.restore();
  glowStroke(g, p.glow, 6, () => {
    g.beginPath();
    g.moveTo(cx - H * 0.45, cy);
    g.quadraticCurveTo(cx, cy - H * 0.36, cx + H * 0.45, cy);
    g.quadraticCurveTo(cx, cy + H * 0.36, cx - H * 0.45, cy);
  });
  g.save();
  g.globalCompositeOperation = 'lighter';
  const iris = g.createRadialGradient(cx, cy, 0, cx, cy, H * 0.17);
  iris.addColorStop(0, '#ffffff');
  iris.addColorStop(0.35, rgba(p.rim, 0.95));
  iris.addColorStop(1, rgba(p.glow, 0.2));
  g.fillStyle = iris;
  g.beginPath();
  g.arc(cx, cy, H * 0.17, 0, Math.PI * 2);
  g.fill();
  g.restore();
  g.fillStyle = '#05030a';
  g.beginPath();
  g.ellipse(cx, cy, H * 0.045, H * 0.12, 0, 0, Math.PI * 2);
  g.fill();
  sparks(g, W, H, p, r, 20);
}

function draw(g: G, W: number, H: number, p: MotifPalette, r: () => number): void {
  const cx = W / 2;
  const cy = H * 0.62;
  for (let i = 0; i < 5; i++) {
    const a = (i - 2) * 0.28;
    g.save();
    g.translate(cx, cy + H * 0.2);
    g.rotate(a);
    g.translate(0, -H * 0.5);
    const w = H * 0.26;
    const h = H * 0.38;
    const fill = g.createLinearGradient(0, 0, 0, h);
    fill.addColorStop(0, p.body[0]);
    fill.addColorStop(1, p.body[1]);
    g.fillStyle = fill;
    g.fillRect(-w / 2, 0, w, h);
    g.strokeStyle = p.rim;
    g.lineWidth = 3;
    g.strokeRect(-w / 2, 0, w, h);
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = rgba(p.glow, 0.6);
    g.beginPath();
    g.arc(0, h / 2, w * 0.18, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  sparks(g, W, H, p, r, 24, cx, H * 0.4, 0.34);
}

function power(g: G, W: number, H: number, p: MotifPalette, r: () => number): void {
  const cx = W / 2;
  const cy = H * 0.52;
  const R = H * 0.38;
  glowStroke(g, p.glow, 4, () => {
    g.beginPath();
    g.arc(cx, cy, R, 0, Math.PI * 2);
    g.moveTo(cx + R * 0.7, cy);
    g.arc(cx, cy, R * 0.7, 0, Math.PI * 2);
  });
  const pts = 5 + Math.floor(r() * 3);
  glowStroke(g, p.rim, 3, () => {
    g.beginPath();
    for (let i = 0; i <= pts; i++) {
      const a = -Math.PI / 2 + (((i * 2) % pts) / pts) * Math.PI * 2;
      const x = cx + Math.cos(a) * R * 0.68;
      const y = cy + Math.sin(a) * R * 0.68;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
  });
  g.save();
  g.globalCompositeOperation = 'lighter';
  const core = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.45);
  core.addColorStop(0, '#ffffff');
  core.addColorStop(1, rgba(p.glow, 0));
  g.fillStyle = core;
  g.fillRect(0, 0, W, H);
  g.restore();
  sparks(g, W, H, p, r, 22, cx, cy, 0.34);
}

function snare(g: G, W: number, H: number, p: MotifPalette, r: () => number): void {
  const cx = W / 2;
  const cy = H * 0.55;
  glowStroke(g, p.glow, 3.5, () => {
    g.beginPath();
    g.ellipse(cx, cy, H * 0.42, H * 0.2, 0, 0, Math.PI * 2);
    g.moveTo(cx + H * 0.3, cy);
    g.ellipse(cx, cy, H * 0.3, H * 0.14, 0, 0, Math.PI * 2);
  });
  // teeth of the trap
  g.save();
  g.fillStyle = p.rim;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const x = cx + Math.cos(a) * H * 0.42;
    const y = cy + Math.sin(a) * H * 0.2;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(cx + Math.cos(a + 0.12) * H * 0.3, cy + Math.sin(a + 0.12) * H * 0.14);
    g.lineTo(cx + Math.cos(a - 0.12) * H * 0.3, cy + Math.sin(a - 0.12) * H * 0.14);
    g.closePath();
    g.fill();
  }
  g.restore();
  // a closed eye in the middle: it watches until it springs
  glowStroke(g, p.rim, 3, () => {
    g.beginPath();
    g.moveTo(cx - H * 0.14, cy);
    g.quadraticCurveTo(cx, cy + H * 0.1, cx + H * 0.14, cy);
  });
  sparks(g, W, H, p, r, 16, cx, cy, 0.3);
}

function crystal(g: G, W: number, H: number, p: MotifPalette, r: () => number): void {
  const cx = W / 2;
  const cy = H * 0.52;
  const R = H * 0.34;
  const path = () => {
    g.beginPath();
    g.moveTo(cx, cy - R * 1.2);
    g.lineTo(cx + R * 0.7, cy - R * 0.2);
    g.lineTo(cx + R * 0.45, cy + R * 0.9);
    g.lineTo(cx - R * 0.45, cy + R * 0.9);
    g.lineTo(cx - R * 0.7, cy - R * 0.2);
    g.closePath();
  };
  g.save();
  const fill = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  fill.addColorStop(0, rgba('#ffffff', 0.9));
  fill.addColorStop(0.4, rgba(p.rim, 0.8));
  fill.addColorStop(1, rgba(p.glow, 0.6));
  path();
  g.fillStyle = fill;
  g.fill();
  g.restore();
  glowStroke(g, p.rim, 3, path);
  sparks(g, W, H, p, r, 24, cx, cy, 0.34);
}

function rune(g: G, W: number, H: number, p: MotifPalette, r: () => number): void {
  power(g, W, H, p, r);
}

const PAINTERS: Record<
  Motif,
  (g: G, W: number, H: number, p: MotifPalette, r: () => number) => void
> = {
  slash: (g, W, H, p, r) => slash(g, W, H, p, r, 1, true),
  flurry: (g, W, H, p, r) => slash(g, W, H, p, r, 3, false),
  burst,
  shield,
  heal,
  flame,
  curse,
  draw,
  power,
  snare,
  crystal,
  rune,
};

export function paintMotif(
  g: G,
  W: number,
  H: number,
  p: MotifPalette,
  motif: Motif,
  r: () => number,
): void {
  PAINTERS[motif](g, W, H, p, r);
}
