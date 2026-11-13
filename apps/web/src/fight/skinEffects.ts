// Cosmetic canvas effects, anchored to the drawn poses. No deformation of the character or weapon.
import { GOTHIC_PUPPETEER_SKIN, TEMPEST_SAGE_SKIN } from '../art/heroRigs';

export function hasSkinEffects(hero: string): boolean {
  return hero === `skins/${GOTHIC_PUPPETEER_SKIN}` || hero === `skins/${TEMPEST_SAGE_SKIN}`;
}

/** Whether an effect is moving on this clip right now: only then must the frame be redrawn on the effect clock. */
export function skinEffectActive(hero: string, clip: string, seconds: number): boolean {
  if (hero === `skins/${GOTHIC_PUPPETEER_SKIN}`) return clip === 'idle';
  if (hero === `skins/${TEMPEST_SAGE_SKIN}`)
    return clip.startsWith('attack') && seconds >= 2 / 30 && seconds < 7 / 30;
  return false;
}

function glow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  strength = 1,
): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${0.85 * strength})`);
  g.addColorStop(0.17, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/** Coordinates are local to the cropped frame, in units of its height. The caller handles quality, facing and stage scale. */
export function drawSkinEffects(
  ctx: CanvasRenderingContext2D,
  hero: string,
  clip: string,
  seconds: number,
  clock: number,
  width: number,
  height: number,
  behind: boolean,
  source?: { image: CanvasImageSource; x: number; y: number; w: number; h: number },
): void {
  ctx.save();
  ctx.scale(height, height);
  const aspect = width / height;
  if (hero === `skins/${GOTHIC_PUPPETEER_SKIN}` && clip === 'idle') {
    if (behind && source) scytheAura(ctx, clock, aspect, source);
  } else if (hero === `skins/${TEMPEST_SAGE_SKIN}` && clip.startsWith('attack')) {
    tempest(ctx, clip, seconds, aspect, behind);
  }
  ctx.restore();
}

// Like Demon Knight's soft silhouette rim, but restricted to the scythe and without its rising ribbons.
const SCYTHE_AURAS = new WeakMap<object, { dark: HTMLCanvasElement; edge: HTMLCanvasElement }>();
function scytheAura(
  ctx: CanvasRenderingContext2D,
  t: number,
  aspect: number,
  source: { image: CanvasImageSource; x: number; y: number; w: number; h: number },
): void {
  const body = 400,
    pad = 32;
  let cached = SCYTHE_AURAS.get(source.image);
  if (!cached) {
    const width = Math.ceil(body * aspect);
    const mask = document.createElement('canvas');
    mask.width = width + pad * 2;
    mask.height = body + pad * 2;
    const m = mask.getContext('2d');
    if (!m) return;
    m.save();
    m.translate(pad, pad);
    // Follow the crown and angled shaft, excluding the hood, body and raised hand.
    m.beginPath();
    m.moveTo(0, 0);
    m.lineTo(width * 0.54, 0);
    m.lineTo(width * 0.54, body * 0.115);
    m.lineTo(width * 0.18, body * 0.115);
    m.lineTo(width * 0.17, body * 0.22);
    m.lineTo(width * 0.32, body * 0.98);
    m.lineTo(width * 0.245, body * 0.98);
    m.lineTo(width * 0.075, body * 0.22);
    m.lineTo(0, body * 0.18);
    m.closePath();
    m.clip();
    m.drawImage(source.image, source.x, source.y, source.w, source.h, 0, 0, width, body);
    m.restore();
    m.globalCompositeOperation = 'source-in';
    m.fillStyle = '#07050c';
    m.fillRect(0, 0, mask.width, mask.height);
    const aura = document.createElement('canvas');
    aura.width = mask.width;
    aura.height = mask.height;
    const c = aura.getContext('2d');
    if (!c) return;
    c.shadowColor = '#07050c';
    c.shadowBlur = 10;
    c.globalAlpha = 0.32;
    for (let n = 0; n < 8; n++) {
      const angle = (n * Math.PI) / 4;
      c.drawImage(mask, Math.cos(angle) * 4, Math.sin(angle) * 4);
    }
    c.shadowBlur = 4;
    c.globalAlpha = 0.72;
    c.drawImage(mask, 0, 0);
    const edge = document.createElement('canvas');
    edge.width = aura.width;
    edge.height = aura.height;
    const e = edge.getContext('2d');
    if (!e) return;
    e.drawImage(aura, 0, 0);
    e.globalCompositeOperation = 'source-in';
    e.fillStyle = '#49474f';
    e.fillRect(0, 0, edge.width, edge.height);
    cached = { dark: aura, edge };
    SCYTHE_AURAS.set(source.image, cached);
  }
  const { dark, edge } = cached;
  // Broad shadow crests travel upward through the silhouette. Small outward offsets let
  // the aura breathe off the edges without drawing ribbons, spirals or detached particles.
  for (let row = 0; row < dark.height; row += 3) {
    const slice = Math.min(3, dark.height - row);
    const v = (row - pad) / body;
    const phase = Math.PI * 2 * (v * 2.5 + t / 3);
    const crest = Math.pow(0.5 + 0.5 * Math.sin(phase), 3);
    const spread = 0.002 + 0.012 * crest;
    const y = (row - pad) / body;
    ctx.globalAlpha = 0.12 + 0.3 * crest;
    for (const side of [-1, 1]) {
      ctx.drawImage(
        edge,
        0,
        row,
        edge.width,
        slice,
        -pad / body + side * (spread + 0.003),
        y,
        edge.width / body,
        slice / body,
      );
    }
    ctx.globalAlpha = 0.48 + 0.46 * crest;
    for (const side of [-1, 1]) {
      ctx.drawImage(
        dark,
        0,
        row,
        dark.width,
        slice,
        -pad / body + side * spread,
        y,
        dark.width / body,
        slice / body,
      );
    }
  }
  ctx.globalAlpha = 0.55;
  ctx.drawImage(dark, -pad / body, -pad / body, dark.width / body, dark.height / body);
}

function tempest(
  ctx: CanvasRenderingContext2D,
  clip: string,
  t: number,
  a: number,
  behind: boolean,
): void {
  // All four drawn strikes make contact at 0.1 s; the hand recovers at 0.233 s.
  if (t < 2 / 30 || t >= 7 / 30) return;
  const fury = clip.endsWith('Fury'),
    radiant = clip.endsWith('Radiant'),
    serene = clip.endsWith('Serene');
  if (fury && t < 0.1) return;
  const x = a * (radiant ? 0.94 : 0.92);
  const y = fury ? 0.24 : radiant ? 0.2 : serene ? 0.28 : 0.3;
  const color = fury ? '255,104,36' : radiant ? '255,218,106' : '110,222,255';
  const p = Math.max(0, (t - 0.1) / (4 / 30));
  const strength = t < 0.1 ? 0.45 : Math.pow(1 - p, 0.6);
  ctx.globalAlpha = strength;
  if (behind) {
    glow(ctx, x, y, 0.19, `rgba(${color},.65)`);
    return;
  }
  ctx.globalCompositeOperation = 'lighter';
  // A dense mantle of power wraps the fist and erupts forward in overlapping flame-shaped tongues.
  // Colored outer bodies keep it substantial at battle size; white cores emphasize the impact.
  const reach = t < 0.1 ? 0.07 : 0.16 + p * 0.1;
  for (let n = 0; n < 7; n++) {
    const angle = (n - 3) * 0.23;
    const length = reach * (n % 2 ? 0.83 : 1);
    ctx.save();
    ctx.translate(x - 0.035, y);
    ctx.rotate(angle);
    const flame = ctx.createLinearGradient(-0.14, 0, length, 0);
    flame.addColorStop(0, `rgba(${color},0)`);
    flame.addColorStop(0.33, `rgba(${color},.22)`);
    flame.addColorStop(0.63, `rgba(${color},.65)`);
    flame.addColorStop(0.86, `rgba(${color},.38)`);
    flame.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = flame;
    const wave = Math.sin(t * 35 + n * 2) * 0.018;
    ctx.beginPath();
    ctx.moveTo(-0.14, -0.02);
    ctx.bezierCurveTo(-0.06, -0.07, length * 0.55, -0.09 + wave, length, -0.025 + wave);
    ctx.quadraticCurveTo(length * 0.45, -0.012, length * 0.7, 0.035);
    ctx.bezierCurveTo(length * 0.23, 0.09, -0.09, 0.065, -0.14, 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(${color},.55)`;
    ctx.lineWidth = 0.004;
    ctx.beginPath();
    ctx.moveTo(-0.09, -0.018);
    ctx.bezierCurveTo(0, -0.065, length * 0.55, -0.058 + wave, length * 0.92, -0.025 + wave);
    ctx.stroke();
    ctx.restore();
  }
  glow(ctx, x + 0.015, y, 0.09, `rgba(${color},.8)`);
  // A tapering wake and pressure front carry the energy away from the fist.
  const trail = ctx.createLinearGradient(x - 0.2, y, x + 0.02, y);
  trail.addColorStop(0, `rgba(${color},0)`);
  trail.addColorStop(0.8, `rgba(${color},.55)`);
  trail.addColorStop(1, 'rgba(255,255,255,.9)');
  ctx.fillStyle = trail;
  ctx.beginPath();
  ctx.moveTo(x - 0.21, y - 0.018);
  ctx.quadraticCurveTo(x - 0.08, y - 0.035, x + 0.018, y - 0.014);
  ctx.lineTo(x + 0.018, y + 0.015);
  ctx.quadraticCurveTo(x - 0.09, y + 0.036, x - 0.21, y + 0.018);
  ctx.fill();
  glow(ctx, x, y, 0.047, `rgba(${color},.8)`);
  if (t >= 0.1) {
    const rx = x + 0.018 + p * 0.15,
      radius = 0.06 + p * 0.065;
    for (let j = 0; j < 2; j++) {
      ctx.strokeStyle = j ? 'rgba(255,255,240,.9)' : `rgba(${color},.7)`;
      ctx.lineWidth = j ? 0.002 : 0.008;
      ctx.beginPath();
      ctx.ellipse(rx, y, radius * 0.3, radius, -0.18, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Uneven lightning filaments connect the fist to the pressure front, with short branches.
    for (let n = 0; n < 4; n++) {
      const direction = n % 2 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(x - 0.015, y);
      for (let j = 1; j <= 5; j++) {
        const distance = j / 5;
        const xx = x + distance * (0.055 + p * 0.14);
        const yy =
          y +
          direction *
            (Math.sin(distance * Math.PI) * (0.02 + p * 0.04) + Math.sin(j * 8 + n * 3) * 0.009);
        ctx.lineTo(xx, yy);
      }
      ctx.strokeStyle = `rgba(${color},.7)`;
      ctx.lineWidth = 0.006;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.lineWidth = 0.0015;
      ctx.stroke();
    }
    for (let n = 0; n < 11; n++) {
      const angle = (n / 10 - 0.5) * 2.4;
      const length = 0.04 + p * (0.08 + (n % 3) * 0.025);
      const sx = x + Math.cos(angle) * length,
        sy = y + Math.sin(angle) * length * 0.55;
      ctx.strokeStyle = n % 3 ? `rgba(${color},.85)` : 'rgba(255,255,255,.95)';
      ctx.lineWidth = 0.0015 + (n % 2) * 0.001;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 0.015 + p * 0.022, sy + Math.sin(angle) * 0.012);
      ctx.stroke();
    }
  }
}
