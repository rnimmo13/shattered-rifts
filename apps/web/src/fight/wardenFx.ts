import { Graphics } from 'pixi.js';
import { gsap } from 'gsap';
import { hex } from '../design/tokens';
import {
  burst,
  clawMarks,
  crescentWave,
  puff,
  ring,
  slashArc,
  thrownBlade,
  type FxCtx,
  type Pt,
} from './attackFx';
import type { WardenEffect } from './wardenMotion';

interface WardenStage {
  source: Pt;
  feet: Pt;
  target: Pt;
  targetFeet: Pt;
  dir: number;
  tint: string;
  hits: number;
}

type Draw = (g: Graphics, shade: number, stage: WardenStage) => void;

function shape(c: FxCtx, s: WardenStage, at: Pt, draw: Draw, duration = 0.4): void {
  const g = new Graphics();
  g.position.set(at.x, at.y);
  g.zIndex = 6000;
  c.parent.addChild(g);
  draw(g, hex(s.tint), s);
  const tl = c.track(gsap.timeline({ onComplete: () => g.destroy() }));
  tl.fromTo(g, { alpha: 0 }, { alpha: 1, duration: 0.05 }, 0);
  tl.fromTo(g.scale, { x: 0.78, y: 0.78 }, { x: 1, y: 1, duration, ease: 'power2.out' }, 0);
  tl.to(g, { alpha: 0, duration: duration * 0.65 }, duration * 0.35);
}

const fx: Record<WardenEffect, (c: FxCtx, s: WardenStage) => void> = {
  blade(c, s) {
    slashArc(c, s.target, s.dir, s.tint, { tilt: -0.7, size: 150 });
    if (s.hits > 1) slashArc(c, s.target, -s.dir, s.tint, { tilt: 0.36, size: 105, delay: 0.09 });
  },
  fang(c, s) {
    shape(
      c,
      s,
      s.target,
      (g, color) => {
        for (const side of [-1, 1])
          for (const x of [-43, -17, 11, 37])
            g.poly([x - 11, side * 48, x + 12, side * 44, x + 2, side * 5])
              .fill({ color, alpha: 0.86 })
              .stroke({ color: 0xffdfbb, width: 2 });
      },
      0.26,
    );
    burst(c, s.target, s.tint, 6, 42);
  },
  claw(c, s) {
    const count = Math.min(s.hits, 4);
    clawMarks(c, s.target, s.dir, s.tint);
    for (let i = 1; i < count; i++)
      c.track(
        gsap.delayedCall(i * 0.08, () => clawMarks(c, s.target, i % 2 ? -s.dir : s.dir, s.tint)),
      );
  },
  quake(c, s) {
    ring(c, s.targetFeet, s.tint, 108, 26);
    shape(c, s, s.targetFeet, (g, color) => {
      for (let i = -2; i <= 2; i++)
        g.poly([
          i * 40 - 22,
          3,
          i * 51,
          -53 + Math.abs(i) * 12,
          i * 40 + 10,
          -12,
          i * 40 + 25,
          4,
        ]).fill({ color, alpha: 0.64 });
    });
  },
  bell(c, s) {
    for (let i = 0; i < 3; i++)
      c.track(
        gsap.delayedCall(i * 0.07, () => ring(c, s.target, s.tint, 42 + i * 28, 70 + i * 18)),
      );
  },
  beam(c, s) {
    shape(
      c,
      s,
      s.source,
      (g, color) => {
        const x = s.target.x - s.source.x,
          y = s.target.y - s.source.y;
        g.moveTo(0, 0).lineTo(x, y).stroke({ color, width: 46, alpha: 0.28, cap: 'round' });
        g.moveTo(0, 0).lineTo(x, y).stroke({ color, width: 17, alpha: 0.9, cap: 'round' });
        g.moveTo(0, 0).lineTo(x, y).stroke({ color: 0xfff4ec, width: 4, alpha: 0.92 });
      },
      0.29,
    );
  },
  lightning(c, s) {
    shape(
      c,
      s,
      s.target,
      (g, color) => {
        for (let i = -1; i <= 1; i++) {
          g.moveTo(i * 95 - 30, -315)
            .lineTo(i * 79, -221)
            .lineTo(i * 50 - 18, -144)
            .lineTo(i * 29 + 25, -65)
            .lineTo(i * 13, 0)
            .stroke({ color, width: i === 0 ? 11 : 4, alpha: 0.9 });
        }
      },
      0.23,
    );
    burst(c, s.target, s.tint, 8, 57);
  },
  shards(c, s) {
    const count = Math.min(5, Math.max(3, s.hits));
    for (let i = 0; i < count; i++) {
      const start = {
        x: s.target.x + (i - (count - 1) / 2) * 61,
        y: s.target.y - 250 - (i % 2) * 54,
      };
      const end = { x: s.target.x + (i - (count - 1) / 2) * 20, y: s.target.y + 12 };
      void thrownBlade(c, start, end, s.tint, 0.16 + i * 0.035).then(() =>
        burst(c, end, s.tint, 4, 24),
      );
    }
  },
  tide(c, s) {
    const start = { x: s.source.x, y: s.feet.y - 38 };
    const end = { x: s.target.x, y: s.targetFeet.y - 45 };
    void crescentWave(c, start, end, s.tint, 1.08).then(() => ring(c, end, s.tint, 92, 21));
  },
  roots(c, s) {
    shape(
      c,
      s,
      s.targetFeet,
      (g, color) => {
        for (const x of [-80, -39, 0, 42, 82])
          g.moveTo(x * 1.5, 12)
            .quadraticCurveTo(x * 0.2, -30, x, -95 + Math.abs(x) * 0.4)
            .stroke({ color, width: 9, alpha: 0.82, cap: 'round' });
      },
      0.5,
    );
  },
  web(c, s) {
    shape(
      c,
      s,
      s.target,
      (g, color) => {
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          g.moveTo(0, 0).lineTo(120 * Math.cos(angle), 120 * Math.sin(angle));
        }
        g.stroke({ color, width: 2, alpha: 0.8 });
        for (const radius of [38, 72, 107]) {
          const points = Array.from({ length: 8 }, (_, i) => {
            const angle = (i * Math.PI) / 4;
            return [radius * Math.cos(angle), radius * Math.sin(angle)];
          }).flat();
          g.poly(points).stroke({ color, width: 3, alpha: 0.75 });
        }
      },
      0.55,
    );
  },
  gravity(c, s) {
    shape(
      c,
      s,
      s.target,
      (g, color) => {
        g.circle(0, 0, 44).fill({ color: 0x140d25, alpha: 0.86 }).stroke({ color, width: 5 });
        for (const radius of [66, 90, 115])
          g.ellipse(0, 0, radius, radius * 0.42).stroke({ color, width: 3 });
      },
      0.5,
    );
    ring(c, s.targetFeet, s.tint, 92, 26);
  },
  orbit(c, s) {
    shape(
      c,
      s,
      s.target,
      (g, color) => {
        g.ellipse(0, 0, 100, 46).stroke({ color, width: 4, alpha: 0.65 });
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2;
          const x = Math.cos(angle) * 100,
            y = Math.sin(angle) * 46;
          g.poly([x, y - 16, x + 9, y, x, y + 16, x - 9, y]).fill({ color, alpha: 0.88 });
        }
      },
      0.53,
    );
  },
  breath(c, s) {
    shape(
      c,
      s,
      s.source,
      (g, color) => {
        const x = s.target.x - s.source.x,
          y = s.target.y - s.source.y;
        g.moveTo(0, 0)
          .quadraticCurveTo(x * 0.5, y * 0.5 - 30, x, y - 91)
          .lineTo(x, y + 91)
          .quadraticCurveTo(x * 0.5, y * 0.5 + 37, 0, 0)
          .fill({ color, alpha: 0.35 })
          .stroke({ color, width: 5, alpha: 0.8 });
        for (const offset of [-32, 0, 32])
          g.moveTo(0, 0)
            .quadraticCurveTo(x * 0.53, y * 0.53 - offset, x, y + offset)
            .stroke({ color: 0xffd88f, width: 6, alpha: 0.69 });
      },
      0.39,
    );
    puff(c, s.target, s.tint, 57, 0.29);
  },
  curtain(c, s) {
    shape(
      c,
      s,
      s.target,
      (g, color) => {
        g.poly([-120, -170, 120, -170, 94, 55, 0, 75, -94, 55])
          .fill({ color, alpha: 0.18 })
          .stroke({ color, width: 4 });
        for (const x of [-72, -36, 0, 36, 72])
          g.moveTo(x, -167)
            .quadraticCurveTo(x * 0.55, -46, x * 1.25, 56)
            .stroke({ color, width: 3, alpha: 0.77 });
      },
      0.5,
    );
  },
  halo(c, s) {
    ring(c, s.feet, s.tint, 103, 30);
    ring(c, s.source, s.tint, 65, 23);
  },
  summon(c, s) {
    shape(
      c,
      s,
      s.feet,
      (g, color) => {
        g.ellipse(0, 0, 104, 32).stroke({ color, width: 6, alpha: 0.88 });
        g.ellipse(0, 0, 75, 22).stroke({ color, width: 2, alpha: 0.84 });
        for (const x of [-64, -32, 0, 32, 64])
          g.moveTo(x, 2)
            .lineTo(x * 0.67, -110 + Math.abs(x))
            .stroke({ color, width: 4, alpha: 0.7 });
      },
      0.56,
    );
  },
  hourglass(c, s) {
    shape(
      c,
      s,
      s.target,
      (g, color) => {
        g.poly([-62, -83, 62, -83, 5, 0, 62, 83, -62, 83, -5, 0])
          .fill({ color, alpha: 0.16 })
          .stroke({ color, width: 5 });
        g.moveTo(0, -28).lineTo(0, 42).stroke({ color, width: 4 });
        g.poly([-34, 76, 0, 47, 34, 76]).fill({ color, alpha: 0.6 });
      },
      0.48,
    );
  },
  rift(c, s) {
    shape(
      c,
      s,
      s.target,
      (g, color) => {
        g.poly([
          -15, -146, 28, -68, 2, -32, 43, 25, 14, 67, 30, 147, -21, 75, -8, 39, -48, -17, -17, -65,
        ])
          .fill({ color: 0x190d27, alpha: 0.85 })
          .stroke({ color, width: 7, alpha: 0.84 });
      },
      0.46,
    );
    burst(c, s.target, s.tint, 9, 58);
  },
};

export function wardenEffect(c: FxCtx, kind: WardenEffect, stage: WardenStage): void {
  fx[kind](c, stage);
}
