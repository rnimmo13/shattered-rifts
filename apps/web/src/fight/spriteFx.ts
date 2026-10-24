// Sprite-sheet effects (Free Magic Effects by SovDigital, see CREDITS.md). Sheets are packed by tools/pack-fx.ps1 into
// public/art/fx: a grid PNG per effect plus fx.json (frame size, count, fps, pivot). Missing files just mean no effect.
import { AnimatedSprite, Rectangle, Texture, type Container } from 'pixi.js';
import { gsap } from 'gsap';

export type FxName = 'fire' | 'frost' | 'portalOpen' | 'portalClose';

interface FxMeta {
  file: string;
  w: number;
  h: number;
  frames: number;
  cols: number;
  fps: number;
  px: number;
  py: number;
}

export interface FxOpts {
  x: number;
  y: number;
  scale?: number | undefined;
  /** first frame to play (skips a wind-up) */
  from?: number | undefined;
  /** playback speed multiplier on the sheet's own fps */
  rate?: number | undefined;
  zIndex?: number;
  flip?: boolean;
}

const sheets = new Map<FxName, { meta: FxMeta; frames: Texture[] }>();
let loading: Promise<void> | null = null;

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Fetch and slice every sheet once; safe to call again. */
export function loadSpriteFx(): Promise<void> {
  loading ??= (async () => {
    const base = `${import.meta.env.BASE_URL}art/fx/`;
    let manifest: Record<string, FxMeta>;
    try {
      const res = await fetch(`${base}fx.json`);
      if (!res.ok) return;
      manifest = (await res.json()) as Record<string, FxMeta>;
    } catch {
      return;
    }
    await Promise.all(
      Object.entries(manifest).map(async ([name, meta]) => {
        const img = await loadImage(base + meta.file);
        if (!img) return;
        const whole = Texture.from(img);
        const frames: Texture[] = [];
        for (let i = 0; i < meta.frames; i++) {
          const frame = new Rectangle((i % meta.cols) * meta.w, Math.floor(i / meta.cols) * meta.h, meta.w, meta.h);
          frames.push(new Texture({ source: whole.source, frame }));
        }
        sheets.set(name as FxName, { meta, frames });
      }),
    );
  })();
  return loading;
}

/** Play a one-shot effect on `layer`; resolves when it ends. Resolves at once if the sheet is not loaded. */
export function playSpriteFx(
  layer: Container,
  name: FxName,
  o: FxOpts,
  track: <T extends gsap.core.Animation>(a: T) => T,
): Promise<void> {
  const s = sheets.get(name);
  if (!s) return Promise.resolve();
  const from = Math.min(o.from ?? 0, s.frames.length - 1);
  const spr = new AnimatedSprite(s.frames.slice(from));
  spr.anchor.set(s.meta.px / s.meta.w, s.meta.py / s.meta.h);
  spr.position.set(o.x, o.y);
  spr.scale.set((o.flip ? -1 : 1) * (o.scale ?? 1), o.scale ?? 1);
  spr.zIndex = o.zIndex ?? 0;
  spr.eventMode = 'none';
  layer.addChild(spr);
  const n = spr.totalFrames;
  const state = { f: 0 };
  return new Promise((resolve) => {
    track(
      gsap.to(state, {
        f: n - 1,
        duration: n / (s.meta.fps * (o.rate ?? 1)),
        ease: 'none',
        onUpdate: () => spr.gotoAndStop(Math.round(state.f)),
        onComplete: () => {
          spr.destroy();
          resolve();
        },
      }),
    );
  });
}
