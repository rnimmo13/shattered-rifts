// Cosmetic canvas effects, anchored to the drawn poses. No deformation of the character or weapon.
import { TEMPEST_SAGE_SKIN } from '../art/heroRigs';

export function hasSkinEffects(hero: string): boolean {
  return hero === `skins/${TEMPEST_SAGE_SKIN}`;
}

/** Whether an effect is moving on this clip right now: only then must the frame be redrawn on the effect clock. */
export function skinEffectActive(hero: string, clip: string, seconds: number): boolean {
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
  width: number,
  height: number,
  behind: boolean,
): void {
  ctx.save();
  ctx.scale(height, height);
  const aspect = width / height;
  if (hero === `skins/${TEMPEST_SAGE_SKIN}` && clip.startsWith('attack')) {
    tempest(ctx, clip, seconds, aspect, behind);
  }
  ctx.restore();
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

export type SheetEffect = { kind: 'conduit' | 'grimoire'; points: [number, number][] };

/** The manifest stores coordinates relative to the feet, in standing body heights. */
export function drawSheetEffect(
  ctx: CanvasRenderingContext2D,
  effect: SheetEffect,
  clock: number,
): void {
  const first = effect.points[0];
  if (!first) return;
  ctx.save();
  if (effect.kind === 'conduit') {
    ctx.beginPath();
    ctx.moveTo(...first);
    let length = 0;
    for (let i = 1; i < effect.points.length; i++) {
      const point = effect.points[i]!;
      const previous = effect.points[i - 1]!;
      ctx.lineTo(...point);
      length += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(57,173,227,.62)';
    ctx.lineWidth = 0.005;
    ctx.stroke();
    const pulse = 0.065;
    ctx.setLineDash([pulse, length + pulse]);
    ctx.lineDashOffset = pulse - ((clock % 1.48) / 1.48) * (length + 2 * pulse);
    ctx.strokeStyle = '#12aaff';
    ctx.lineWidth = 0.013;
    ctx.stroke();
    ctx.strokeStyle = '#b4f5ff';
    ctx.lineWidth = 0.004;
    ctx.stroke();
  } else {
    const [x, y] = first;
    const t = clock % 2.2;
    const pulse = Math.exp(-((t - 0.48) ** 2) / 0.13) + 0.33 * Math.exp(-((t - 0.92) ** 2) / 0.055);
    ctx.globalCompositeOperation = 'screen';
    const r = 0.045 + 0.022 * pulse;
    const light = ctx.createRadialGradient(x, y, 0, x, y, r);
    light.addColorStop(0, `rgba(188,255,72,${0.14 + 0.51 * pulse})`);
    light.addColorStop(0.5, `rgba(112,216,36,${0.08 + 0.23 * pulse})`);
    light.addColorStop(1, 'rgba(88,169,22,0)');
    ctx.fillStyle = light;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    for (let i = 0; i < 3; i++) {
      const age = (t - 0.2 - i * 0.15) / 1.1;
      if (age <= 0 || age >= 1) continue;
      const wx = x + 0.008 * i + Math.sin(age * 6 + i) * 0.008;
      const wy = y - age * 0.062;
      ctx.strokeStyle = `rgba(159,238,63,${Math.sin(Math.PI * age) * 0.54})`;
      ctx.lineWidth = 0.0025;
      ctx.beginPath();
      ctx.moveTo(wx, wy + 0.01);
      ctx.bezierCurveTo(wx + 0.014, wy + 0.003, wx - 0.012, wy - 0.006, wx + 0.003, wy - 0.015);
      ctx.stroke();
    }
  }
  ctx.restore();
}
