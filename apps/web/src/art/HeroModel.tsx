// A Riftwalker's model outside battle (the home stage, the character picker, the Vault, the Models page, the lore page): the
// animated 2D rig when the hero's default look has one (DECISIONS #680), over the still picture it replaces. The picture stays in
// place underneath and is used for still-only looks, without WebGL2,
// with reduced motion or on Low graphics, if the browser takes the rig's GL context away, or until the rig has loaded. Hovering
// the model with a mouse, or clicking or tapping it, plays its attack. The rig code (and the Pixi it brings) is only loaded for a hero that has a rig.

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { SHEET_PREFIX, VIDEO_PREFIX, heroRigFor } from './heroRigs';
import { HERO_VIDEOS } from './heroVideos';
import { useSettingsChanged, type SettingKind } from '../app/settings';
// (a type only: the rig code itself is loaded on demand below)
import type { HeroSprite } from '../fight/heroSprite';
import './heroModel.css';

const still = (): boolean =>
  (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) ||
  document.documentElement.dataset['graphics'] === 'low';

// (DECISIONS #755) A pose-sheet model holds its whole atlas, about 100 MB decoded: a page showing every Riftwalker (the Models page,
// the lore page) animates at most this many at once, the ones nearest the screen; the rest show their picture until one is let go.
const SHEET_SLOTS = 3;
/** How far past each side of its box a contained figure may run, as a share of the box's width (DECISIONS #773): fitted to the width
 * alone, a figure holding a great sword out came out tiny in a narrow box. */
const CONTAIN_SPILL = 0.18;
let sheetsLive = 0;
const slotWaiters = new Set<() => void>();
function freeSheetSlot(): void {
  sheetsLive = Math.max(0, sheetsLive - 1);
  for (const w of [...slotWaiters]) w();
}

export function HeroModel(props: {
  hero: string;
  /** the skin worn, if any */
  skin?: string | undefined;
  /** the wrapper's own classes (it takes the place, and the layout class, of the picture it holds) */
  className?: string;
  /** how much of the box's height the body fills, feet on its bottom edge */
  fill?: number;
  /** the whole resting figure, weapon and all, stands in the middle of the box (the Store's and the Collection's boxes), at its full
   * height: a wide pose may run past each side by up to CONTAIN_SPILL of the box's width (the tip of a sword, not the body), and is
   * made smaller only past that. Without it the feet stand in the middle (DECISIONS #772, #773) */
  contain?: boolean;
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
  const rigId = heroRigFor(props.hero, props.skin);
  const fill = props.fill ?? 0.94;
  const contain = props.contain === true;
  // (DECISIONS #755) a model is only loaded while it is on screen or near it, and let go when it scrolls well away
  const [near, setNear] = useState(() => typeof IntersectionObserver !== 'function');
  // (no pose-sheet slot free: the picture, until one is; `slot` counts the times one was freed, to try again)
  const [waiting, setWaiting] = useState(false);
  const [slot, setSlot] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver !== 'function') return;
    const io = new IntersectionObserver(([e]) => setNear(!!e?.isIntersecting), {
      rootMargin: '200px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // (DECISIONS #724) while a rig that will be shown is loading, the crest turns in its place, never the still picture first and then a
  // jump to the rig
  const loading = !!rigId && near && !waiting && !live && !fallback && !still();

  useEffect(() => {
    const el = box.current;
    if (!rigId || !el || still() || !near) return;
    const sheet = rigId.startsWith(SHEET_PREFIX);
    if (sheet && sheetsLive >= SHEET_SLOTS) {
      // (the picture meanwhile, not the loading crest; tried again each time a slot is freed)
      let on = true;
      queueMicrotask(() => {
        if (on) setWaiting(true);
      });
      const retry = (): void => setSlot((n) => n + 1);
      slotWaiters.add(retry);
      return () => {
        on = false;
        slotWaiters.delete(retry);
      };
    }
    let holds = sheet;
    if (holds) sheetsLive++;
    const release = (): void => {
      if (!holds) return;
      holds = false;
      freeSheetSlot();
    };
    let sprite: HeroSprite | null = null;
    let raf = 0;
    let gone = false;
    let last = performance.now();
    let size = { w: 0, h: 0 };
    // (a slot of its own now, and a fresh try: not the picture of an earlier failure)
    queueMicrotask(() => {
      if (gone) return;
      setWaiting(false);
      setFallback(false);
    });
    // (a slow download: the picture after 8 seconds, and the rig over it when it comes)
    const slow = window.setTimeout(() => setFallback(true), 8000);

    // (the canvas: the body `fill` of the box tall, feet on the bottom edge in the middle; a wider stance may reach past the sides)
    const place = (): void => {
      if (!sprite) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      let height = Math.max(8, size.h * fill);
      let shift = 0;
      if (contain && sprite.restSpan && size.w > 0) {
        let span = sprite.restSpan(height);
        const room = size.w * (1 + 2 * CONTAIN_SPILL);
        if (span.left + span.right > room) {
          height = Math.max(8, (height * room) / (span.left + span.right));
          span = sprite.restSpan(height);
        }
        shift = (span.left - span.right) / 2;
      }
      const changed = sprite.resize(height, dpr);
      const c = sprite.canvas;
      const w = c.width * sprite.stageScale;
      const h = c.height * sprite.stageScale;
      const a = sprite.anchor;
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      c.style.left = `${size.w / 2 - a.x * w + shift}px`;
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
    // (a mouse over the model, or a click or a tap on it, plays its attack: each weapon's clip in turn for a model with more than one.
    // A touch only counts as a tap, so a finger scrolling the page past the model does not set it off)
    // (a pose-sheet model with a second attack alternates with it: the Drunkard's shotgun, the Spellblade's spell, DECISIONS #756)
    const variants = rigId.startsWith(VIDEO_PREFIX)
      ? Object.keys(HERO_VIDEOS[rigId.slice(VIDEO_PREFIX.length)] ?? {})
          .filter((c) => c.startsWith('strike:'))
          .map((c) => c.slice('strike:'.length))
      : rigId === `${SHEET_PREFIX}drunkard`
        ? ['hammer', 'shotgun']
        : rigId === `${SHEET_PREFIX}spellblade`
          ? ['blade', 'spell']
          : [];
    let swings = 0;
    const attack = (): void => {
      if (!sprite || sprite.clip !== 'idle') return;
      const variant = variants[swings % Math.max(1, variants.length)];
      // (a video model whose attack clip is still loading waits for it: the canvas's stand-in lunge slid the whole figure across the
      // screen and back, which a fight needs on time but a hover does not)
      if (sprite.ready && !sprite.ready('strike', variant)) return;
      swings++;
      sprite.play('strike', variant ? { variant } : {});
    };
    const hover = (e: PointerEvent): void => {
      if (e.pointerType === 'mouse') attack();
    };
    // (everything the rig holds let go, and the picture shown again: on unmount, a lost context, or a switch to Low graphics)
    const stop = (): void => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      el.removeEventListener('pointerenter', hover);
      el.removeEventListener('click', attack);
      const s = sprite;
      sprite = null;
      if (s) {
        s.canvas.remove();
        s.dispose();
      }
      release();
      // (always, the cleanup included: switching to a hero with no rig keeps this component, and its picture must show again)
      setLive(false);
    };

    // (the rig could not be made: the picture, at once)
    const fail = (): void => {
      release();
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
        el.addEventListener('pointerenter', hover);
        el.addEventListener('click', attack);
        window.clearTimeout(slow);
        setLive(true);
        raf = requestAnimationFrame(frame);
      })
      .catch(fail);

    return () => {
      gone = true;
      window.clearTimeout(slow);
      stop();
      release();
    };
  }, [rigId, fill, contain, near, slot]);

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
