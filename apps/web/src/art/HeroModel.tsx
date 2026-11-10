// A Riftwalker's model outside battle (the home stage, the character picker, the Vault, the Models page, the lore page): the
// animated 2D rig when the hero's default look has one (DECISIONS #680), over the still picture it replaces. The picture stays in
// place underneath, so the layout and anything that reads it are unchanged, and it is what shows with a skin worn, without WebGL2,
// with reduced motion or on Low graphics, if the browser takes the rig's GL context away, or until the rig has loaded. Hovering
// the model raises its aura. The rig code (and the Pixi it brings) is only loaded for a hero that has a rig.

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { heroRigFor } from './heroRigs';
import { useSettingsChanged, type SettingKind } from '../app/settings';
// (a type only: the rig code itself is loaded on demand below)
import type { HeroSprite } from '../fight/heroSprite';
import './heroModel.css';

const still = (): boolean =>
  (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) ||
  document.documentElement.dataset['graphics'] === 'low';

export function HeroModel(props: {
  hero: string;
  /** the skin worn, if any: a skin is a still picture */
  skin?: string | undefined;
  /** the wrapper's own classes (it takes the place, and the layout class, of the picture it holds) */
  className?: string;
  /** how much of the box's height the body fills, feet on its bottom edge */
  fill?: number;
  /** the still picture */
  children: ReactNode;
}) {
  const box = useRef<HTMLSpanElement>(null);
  const [live, setLive] = useState(false);
  // (DECISIONS #724) the rig could not be shown, or took too long: the picture after all
  const [fallback, setFallback] = useState(false);
  // (the beta video models are turned on or off in Settings: the model follows at once)
  const [, setModels] = useState(0);
  useSettingsChanged(
    useCallback((kind: SettingKind) => {
      if (kind === 'models') setModels((n) => n + 1);
    }, []),
  );
  const rigId = !props.skin ? heroRigFor(props.hero) : undefined;
  const fill = props.fill ?? 0.94;
  // (DECISIONS #724) while a rig that will be shown is loading, the crest turns in its place, never the still picture first and then a
  // jump to the rig
  const loading = !!rigId && !live && !fallback && !still();

  useEffect(() => {
    const el = box.current;
    if (!rigId || !el || still()) return;
    let sprite: HeroSprite | null = null;
    let raf = 0;
    let gone = false;
    let last = performance.now();
    let size = { w: 0, h: 0 };
    setFallback(false);
    // (a slow download: the picture after 8 seconds, and the rig over it when it comes)
    const slow = window.setTimeout(() => setFallback(true), 8000);

    // (the canvas: the body `fill` of the box tall, feet on the bottom edge in the middle; a wider stance may reach past the sides)
    const place = (): void => {
      if (!sprite) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const height = Math.max(8, size.h * fill);
      const changed = sprite.resize(height, dpr);
      const c = sprite.canvas;
      const w = c.width * sprite.stageScale;
      const h = c.height * sprite.stageScale;
      const a = sprite.anchor;
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      c.style.left = `${size.w / 2 - a.x * w}px`;
      c.style.top = `${size.h - a.y * h}px`;
      if (changed) sprite.render();
    };
    const frame = (now: number): void => {
      raf = requestAnimationFrame(frame);
      if (!sprite || document.hidden) {
        last = now;
        return;
      }
      // (switched to Low graphics or reduced motion meanwhile: the picture again)
      if (still()) {
        stop();
        return;
      }
      sprite.update(Math.min(0.1, (now - last) / 1000));
      last = now;
      place();
      sprite.render();
    };
    const resize = new ResizeObserver(([e]) => {
      if (!e) return;
      size = { w: e.contentRect.width, h: e.contentRect.height };
      place();
    });
    const aura = (): void => {
      if (sprite && sprite.clip === 'idle') sprite.play('aura');
    };
    // (everything the rig holds let go, and the picture shown again: on unmount, a lost context, or a switch to Low graphics)
    const stop = (): void => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      el.removeEventListener('pointerenter', aura);
      const s = sprite;
      sprite = null;
      if (s) {
        s.canvas.remove();
        s.dispose();
      }
      // (always, the cleanup included: switching to a hero with no rig keeps this component, and its picture must show again)
      setLive(false);
    };

    // (the rig could not be made: the picture, at once)
    const fail = (): void => {
      if (!gone) setFallback(true);
    };
    void import('../fight/heroSprite')
      .then(async (rigs) => {
        const assets = await rigs.loadRig(rigId);
        if (gone) return;
        if (!assets || still()) return fail();
        sprite = rigs.HeroSprite.create(rigId, assets, 'right');
        if (!sprite) return fail();
        sprite.onLost(() => {
          stop();
          fail();
        });
        sprite.canvas.className = 'hero-model__rig';
        sprite.canvas.setAttribute('aria-hidden', 'true');
        el.appendChild(sprite.canvas);
        const r = el.getBoundingClientRect();
        size = { w: r.width, h: r.height };
        place();
        sprite.render();
        resize.observe(el);
        el.addEventListener('pointerenter', aura);
        window.clearTimeout(slow);
        setLive(true);
        raf = requestAnimationFrame(frame);
      })
      .catch(fail);

    return () => {
      gone = true;
      window.clearTimeout(slow);
      stop();
    };
  }, [rigId, fill]);

  return (
    <span
      ref={box}
      className={`hero-model${live ? ' is-live' : ''}${loading ? ' is-loading' : ''} ${props.className ?? ''}`}
    >
      {props.children}
      {loading && (
        <span className="hero-model__loader" aria-hidden="true">
          <img src={`${import.meta.env.BASE_URL}branding/logo-192.png`} alt="" />
        </span>
      )}
    </span>
  );
}
