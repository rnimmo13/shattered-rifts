// Drawn attack effects (slash arcs, claw marks, tracers, orbs, shock rings) for Fighters.attack. Plain Pixi Graphics
// animated with GSAP: no art files, so every hero and enemy gets one. Each effect cleans itself up when it ends.

import { Graphics, type Container } from 'pixi.js';
import { gsap } from 'gsap';
import { hex } from '../design/tokens';

export interface FxCtx {
  parent: Container;
  track: <T extends gsap.core.Animation>(a: T) => T;
}
export interface Pt {
  x: number;
  y: number;
}

const lerp = (a: Pt, b: Pt, v: number): Pt => ({ x: a.x + (b.x - a.x) * v, y: a.y + (b.y - a.y) * v });

function spawn(c: FxCtx, x = 0, y = 0): Graphics {
  const g = new Graphics();
  g.position.set(x, y);
  g.zIndex = 6000;
  g.blendMode = 'add';
  c.parent.addChild(g);
  return g;
}
const kill = (g: Graphics): void => {
  if (!g.destroyed) g.destroy();
};

/** A bright crescent sweeping down across the target, like a sword cut. `dir` is 1 when attacking rightwards. */
export function slashArc(
  c: FxCtx,
  at: Pt,
  dir: number,
  tint: string,
  o: { tilt?: number; size?: number; delay?: number } = {},
): void {
  const size = o.size ?? 120;
  const tilt = o.tilt ?? -0.55;
  const g = spawn(c, at.x, at.y);
  g.arc(-size * 0.45, 0, size, -0.95, 0.95).stroke({ width: 18, color: hex(tint), alpha: 0.4, cap: 'round' });
  g.arc(-size * 0.45, 0, size, -0.8, 0.8).stroke({ width: 5, color: 0xffffff, alpha: 0.95, cap: 'round' });
  g.alpha = 0;
  g.scale.set(dir * 0.85, 0.85);
  g.rotation = dir * (tilt - 0.55);
  const tl = c.track(gsap.timeline({ delay: o.delay ?? 0, onComplete: () => kill(g) }));
  tl.to(g, { alpha: 1, duration: 0.04 }, 0);
  tl.to(g, { rotation: dir * (tilt + 0.55), duration: 0.2, ease: 'power2.out' }, 0);
  tl.to(g.scale, { x: dir * 1.1, y: 1.1, duration: 0.2 }, 0);
  tl.to(g, { alpha: 0, duration: 0.14 }, 0.1);
}

/** Three scratch marks drawn from the top down. */
export function clawMarks(c: FxCtx, at: Pt, dir: number, tint: string): void {
  const g = spawn(c, at.x, at.y);
  g.scale.x = dir;
  const p = { v: 0 };
  const tl = c.track(gsap.timeline({ onComplete: () => kill(g) }));
  tl.to(p, {
    v: 1,
    duration: 0.16,
    ease: 'power2.out',
    onUpdate: () => {
      g.clear();
      for (const i of [-1, 0, 1]) {
        const sx = i * 26 - 22;
        const sy = -52 + Math.abs(i) * 6;
        const ex = sx + 44 * p.v;
        const ey = sy + 104 * p.v;
        g.moveTo(sx, sy).lineTo(ex, ey).stroke({ width: 11, color: hex(tint), alpha: 0.45, cap: 'round' });
        g.moveTo(sx, sy).lineTo(ex, ey).stroke({ width: 4, color: 0xffffff, alpha: 0.95, cap: 'round' });
      }
    },
  });
  tl.to(g, { alpha: 0, duration: 0.16 });
}

/** Short lines flying outwards from a point: the spark of an impact. */
export function burst(c: FxCtx, at: Pt, tint: string, n = 7, len = 46): void {
  const g = spawn(c, at.x, at.y);
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2 + (i % 2) * 0.3;
    const r0 = 8;
    const r1 = len * (0.7 + 0.3 * ((i * 5) % 3) / 2);
    g.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0).lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
  }
  g.stroke({ width: 4, color: hex(tint), alpha: 0.95, cap: 'round' });
  g.circle(0, 0, 14).fill({ color: 0xffffff, alpha: 0.8 });
  g.scale.set(0.4);
  const tl = c.track(gsap.timeline({ onComplete: () => kill(g) }));
  tl.to(g.scale, { x: 1.25, y: 1.25, duration: 0.2, ease: 'power2.out' }, 0);
  tl.to(g, { alpha: 0, duration: 0.2 }, 0.05);
}

/** An expanding ring on the ground (a heavy blow) or in the air (a spell landing). */
export function ring(c: FxCtx, at: Pt, tint: string, rx = 70, ry = 22): void {
  const g = spawn(c, at.x, at.y);
  g.ellipse(0, 0, rx, ry).stroke({ width: 6, color: hex(tint), alpha: 0.9 });
  g.scale.set(0.3);
  const tl = c.track(gsap.timeline({ onComplete: () => kill(g) }));
  tl.to(g.scale, { x: 1.7, y: 1.7, duration: 0.32, ease: 'power2.out' }, 0);
  tl.to(g, { alpha: 0, duration: 0.3 }, 0.05);
}

/** A soft flash that swells and fades: a muzzle flash, or a spell gathering in a hand. */
export function puff(c: FxCtx, at: Pt, tint: string, r: number, dur = 0.16): void {
  const g = spawn(c, at.x, at.y);
  g.circle(0, 0, r).fill({ color: hex(tint), alpha: 0.55 });
  g.circle(0, 0, r * 0.5).fill({ color: 0xffffff, alpha: 0.85 });
  g.scale.set(0.3);
  const tl = c.track(gsap.timeline({ onComplete: () => kill(g) }));
  tl.to(g.scale, { x: 1.2, y: 1.2, duration: dur, ease: 'power2.out' }, 0);
  tl.to(g, { alpha: 0, duration: dur }, dur * 0.4);
}

/** A bright streak that runs from `a` to `b`. Resolves on arrival. */
export function streak(c: FxCtx, a: Pt, b: Pt, tint: string, dur: number, width = 4): Promise<void> {
  return new Promise((resolve) => {
    const g = spawn(c);
    const p = { v: 0 };
    const tl = c.track(gsap.timeline({ onComplete: () => kill(g) }));
    tl.to(p, {
      v: 1,
      duration: dur,
      ease: 'none',
      onUpdate: () => {
        const head = lerp(a, b, p.v);
        const tail = lerp(a, b, Math.max(0, p.v - 0.5));
        g.clear();
        g.moveTo(tail.x, tail.y).lineTo(head.x, head.y).stroke({ width: width * 3, color: hex(tint), alpha: 0.4, cap: 'round' });
        g.moveTo(tail.x, tail.y).lineTo(head.x, head.y).stroke({ width, color: 0xffffff, alpha: 0.95, cap: 'round' });
      },
    });
    tl.call(resolve);
    tl.to(g, { alpha: 0, duration: 0.1 });
  });
}

/** A knife spinning through the air in a shallow arc. Resolves on arrival. */
export function thrownBlade(c: FxCtx, a: Pt, b: Pt, tint: string, dur: number): Promise<void> {
  return new Promise((resolve) => {
    const g = spawn(c, a.x, a.y);
    g.poly([-20, 0, 0, -6, 22, 0, 0, 6]).fill({ color: 0xffffff, alpha: 0.95 });
    g.poly([-26, 0, 0, -11, 28, 0, 0, 11]).stroke({ width: 3, color: hex(tint), alpha: 0.8 });
    const p = { v: 0 };
    const tl = c.track(gsap.timeline({ onComplete: () => kill(g) }));
    tl.to(p, {
      v: 1,
      duration: dur,
      ease: 'power1.in',
      onUpdate: () => {
        const pt = lerp(a, b, p.v);
        g.position.set(pt.x, pt.y - Math.sin(Math.PI * p.v) * 34);
        g.rotation = p.v * Math.PI * 6;
      },
    });
    tl.call(resolve);
    tl.to(g, { alpha: 0, duration: 0.05 });
  });
}

/** A glowing orb with a short fading trail. Resolves on arrival. */
export function orb(c: FxCtx, a: Pt, b: Pt, tint: string, dur: number, r = 16): Promise<void> {
  return new Promise((resolve) => {
    const trail = [0, 1, 2, 3].map(() => spawn(c, a.x, a.y));
    trail.forEach((t, i) => {
      t.circle(0, 0, r * (0.75 - i * 0.14)).fill({ color: hex(tint), alpha: 0.5 - i * 0.1 });
    });
    const head = spawn(c, a.x, a.y);
    head.circle(0, 0, r * 1.5).fill({ color: hex(tint), alpha: 0.35 });
    head.circle(0, 0, r).fill({ color: hex(tint), alpha: 0.9 });
    head.circle(0, 0, r * 0.5).fill({ color: 0xffffff, alpha: 0.95 });
    const p = { v: 0 };
    const tl = c.track(
      gsap.timeline({
        onComplete: () => {
          kill(head);
          trail.forEach(kill);
        },
      }),
    );
    tl.to(p, {
      v: 1,
      duration: dur,
      ease: 'power1.in',
      onUpdate: () => {
        head.position.set(lerp(a, b, p.v).x, lerp(a, b, p.v).y);
        trail.forEach((t, i) => {
          const q = lerp(a, b, Math.max(0, p.v - 0.07 * (i + 1)));
          t.position.set(q.x, q.y);
        });
      },
    });
    tl.call(resolve);
  });
}
