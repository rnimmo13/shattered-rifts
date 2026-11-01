// Plays the painted effects and the little flights between the piles (DECISIONS #522): plain elements over the page, moved with the Web
// Animations API. They clean themselves up, follow the speed setting and the reduced-motion and reduced-effects settings, and nothing ever
// waits on them. A picture that fails to load simply shows nothing: the moment still has its flash and its number.

import { getBaseSpeed } from '../duel/scene/timescale';
import { loadEffectsMode, markEffectsMode, prefersReducedMotion } from '../duel/effects';
import { FX_IDS, type FxId } from './fxMoments';
import './fx.css';

export interface Spot {
  x: number;
  y: number;
}

/** No more than this many at once: a many-hit turn drops the extras rather than slowing the screen. */
const MAX_LIVE = 40;
/** The frame at its fullest, which is all that shows when nothing may move. */
const PEAK_AT = '60%';

const fxUrl = (id: FxId): string => `${import.meta.env.BASE_URL}art/fx/${id}.png`;

markEffectsMode();

let layer: HTMLElement | null = null;
function fxLayer(): HTMLElement {
  if (!layer || !layer.isConnected) {
    layer = document.createElement('div');
    layer.className = 'fxlayer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
  }
  return layer;
}

const room = (): boolean => fxLayer().childElementCount < MAX_LIVE;
const speed = (): number => Math.max(0.1, getBaseSpeed());
export const fxStill = (): boolean => prefersReducedMotion() || loadEffectsMode() === 'reduced';

/** Asks for the strips ahead of time, so the first of each does not arrive late. */
let preloaded = false;
export function preloadFx(): void {
  if (preloaded) return;
  preloaded = true;
  for (const id of FX_IDS) new Image().src = fxUrl(id);
}

/** Clears whatever is still playing (the fight has closed). */
export function clearFx(): void {
  layer?.replaceChildren();
}

/** One effect, centred on a point of the window. `angle` turns it (a trail is painted moving right), `flip` mirrors it. */
export function playFx(
  id: FxId,
  at: Spot,
  o: { size?: number; dur?: number; angle?: number; flip?: boolean; squash?: number } = {},
): void {
  if (!room()) return;
  const size = o.size ?? 220;
  const el = document.createElement('i');
  el.className = 'fxs';
  el.style.left = `${at.x}px`;
  el.style.top = `${at.y}px`;
  el.style.width = `${size}px`;
  el.style.height = `${size * (o.squash ?? 1)}px`;
  el.style.backgroundImage = `url("${fxUrl(id)}")`;
  el.style.transform = `translate(-50%, -50%) rotate(${o.angle ?? 0}deg)${o.flip ? ' scaleX(-1)' : ''}`;
  fxLayer().appendChild(el);
  const done = (): void => el.remove();
  if (fxStill()) {
    el.style.backgroundPositionX = PEAK_AT;
    el.animate([{ opacity: 0 }, { opacity: 0.9 }, { opacity: 0 }], { duration: 260 }).onfinish = done;
    return;
  }
  const duration = (o.dur ?? 460) / speed();
  // (six frames at 0%, 20%... 100% of the strip; the last ones fade too, as a few of them end with something still standing)
  el.animate([{ backgroundPositionX: '0%' }, { backgroundPositionX: '120%' }], {
    duration,
    easing: 'steps(6, end)',
    fill: 'forwards',
  });
  el.animate([{ opacity: 1 }, { opacity: 1, offset: 0.68 }, { opacity: 0 }], {
    duration,
    fill: 'forwards',
  }).onfinish = done;
}

export interface FlightOpts {
  dur?: number;
  delay?: number;
  /** how far it bows upward on the way */
  arc?: number;
  /** the streak it leaves */
  trail?: FxId;
  /** its width in pixels (a card is taller than it is wide) */
  size?: number;
  onArrive?: () => void;
}

function fly(el: HTMLElement, from: Spot, to: Spot, o: FlightOpts): void {
  if (fxStill() || !room()) {
    o.onArrive?.();
    return;
  }
  const delay = (o.delay ?? 0) / speed();
  const duration = (o.dur ?? 240) / speed();
  const arc = o.arc ?? 0;
  const at = (p: Spot, lift: number, scale: number): string =>
    `translate(-50%, -50%) translate(${p.x}px, ${p.y - lift}px) scale(${scale})`;
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  el.style.transform = at(from, 0, 1);
  el.style.opacity = '0';
  fxLayer().appendChild(el);
  const a = el.animate(
    [
      { transform: at(from, 0, 1), opacity: 1 },
      { transform: at(mid, arc, 1.08), opacity: 1 },
      { transform: at(to, 0, 0.7), opacity: 0.95 },
    ],
    { duration, delay, easing: 'cubic-bezier(.45,.05,.7,.95)', fill: 'both' },
  );
  a.onfinish = () => {
    el.remove();
    o.onArrive?.();
  };
  if (o.trail) {
    const { trail } = o;
    window.setTimeout(() => trailBetween(trail, from, to, o.dur ?? 240, arc * 0.7), delay);
  }
}

/** A streak along the way from one point to another. */
export function trailBetween(id: FxId, from: Spot, to: Spot, dur: number, lift = 0): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  playFx(
    id,
    { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - lift },
    {
      size: Math.max(90, Math.hypot(dx, dy) * 0.8),
      angle: (Math.atan2(dy, dx) * 180) / Math.PI,
      dur,
    },
  );
}

/** A small picture flying between two points: a status icon to its target, a potion to where it breaks. */
export function flyPicture(src: string, from: Spot, to: Spot, o: FlightOpts = {}): void {
  const el = document.createElement('img');
  el.className = 'fxpic';
  el.src = src;
  el.alt = '';
  el.style.width = `${o.size ?? 44}px`;
  fly(el, from, to, o);
}

/** A face-down card flying between two points. */
export function flyCard(from: Spot, to: Spot, o: FlightOpts = {}): void {
  const el = document.createElement('i');
  el.className = 'fxcard';
  el.style.width = `${o.size ?? 44}px`;
  fly(el, from, to, o);
}

/** The middle of an element on the page, if it is showing. */
export function centreOf(el: Element | null | undefined): Spot | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// (added on top of whatever the element's own style and animations do, as many of them are placed with a transform)
const moved = (el: Element | null | undefined, frames: Keyframe[], duration: number): void => {
  if (!el || fxStill()) return;
  el.animate(frames, { duration: duration / speed(), easing: 'ease-out', composite: 'add' });
};

/** A small bounce: a pile taking a card, a chip being added to, a gem being paid from. */
export function bump(el: Element | null | undefined, scale = 1.16): void {
  moved(el, [1, scale, 1].map((k) => ({ transform: `scale(${k})` })), 240);
}

/** A sideways shake: not enough Mana, or an enemy about to act. */
export function shake(el: Element | null | undefined, far = 6): void {
  moved(
    el,
    [0, -far, far, -far * 0.7, far * 0.7, 0].map((x) => ({ transform: `translateX(${x}px)` })),
    300,
  );
}

/** An intent mark swinging in as a new turn shows it. */
export function swingIn(el: Element | null | undefined): void {
  moved(
    el,
    [
      { transform: 'rotate(-14deg) scale(0.7)' },
      { transform: 'rotate(5deg) scale(1.08)', offset: 0.65 },
      { transform: 'rotate(0deg) scale(1)' },
    ],
    360,
  );
  if (el && !fxStill()) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 / speed() });
}

/** The whole screen dips dark for a beat: a Trap springing. */
export function dimScreen(duration = 700): void {
  if (fxStill() || !room()) return;
  const el = document.createElement('i');
  el.className = 'fxdim';
  fxLayer().appendChild(el);
  el.animate([{ opacity: 0 }, { opacity: 0.55, offset: 0.2 }, { opacity: 0.55, offset: 0.6 }, { opacity: 0 }], {
    duration: duration / speed(),
  }).onfinish = () => el.remove();
}
