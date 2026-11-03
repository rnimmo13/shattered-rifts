// Plays the painted effects and the little flights between the piles (DECISIONS #522): plain elements over the page, moved with the Web
// Animations API. They clean themselves up, follow the speed setting and the reduced-motion and reduced-effects settings, and nothing ever
// waits on them. A picture that fails to load simply shows nothing: the moment still has its flash and its number.

import { getBaseSpeed } from '../duel/scene/timescale';
import { loadEffectsMode, markEffectsMode, prefersReducedMotion } from '../duel/effects';
import { stripRoll } from '@sr/content/v2';
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

interface StripOpts {
  size?: number;
  dur?: number;
  angle?: number;
  flip?: boolean;
  squash?: number;
}

/** One effect, centred on a point of the window. `angle` turns it (a trail is painted moving right), `flip` mirrors it. */
export function playFx(id: FxId, at: Spot, o: StripOpts = {}): void {
  playStrip(fxUrl(id), at, o);
}

// --- every Rare's and Uncommon's own effect (DECISIONS #567, #568) -----------------------------------------------------

/** Where a card's effect plays: on its target, on the hero who played it, or over the whole enemy line. */
export type CardFxAt = 'target' | 'self' | 'all';
/** each rarity's effects are in their own folder, with its own index */
const CARD_FX_DIRS = ['rare', 'uncommon'] as const;
const cardFx: Record<string, { at: CardFxAt; dir: string }> = {};
const cardFxRead = new Set<string>();
let cardFxLoading: Promise<void> | null = null;
const cardFxUrl = (id: string): string => `${import.meta.env.BASE_URL}art/fx/${cardFx[id]?.dir ?? 'rare'}/${id}.png`;

/** Reads which cards have their own effect (safe to call again; a list that does not come lets the next fight try again). */
export function loadCardFx(): Promise<void> {
  cardFxLoading ??= (async () => {
    const left = CARD_FX_DIRS.filter((d) => !cardFxRead.has(d));
    const done = await Promise.all(
      left.map(async (dir) => {
        try {
          const res = await fetch(`${import.meta.env.BASE_URL}art/fx/${dir}/index.json`, { cache: 'no-cache' });
          if (!res.ok) throw new Error(String(res.status));
          const index = (await res.json()) as Record<string, CardFxAt>;
          for (const [id, at] of Object.entries(index)) cardFx[id] = { at, dir };
          cardFxRead.add(dir);
          return true;
        } catch {
          return false;
        }
      }),
    );
    if (done.includes(false)) cardFxLoading = null;
  })();
  return cardFxLoading;
}

/** Asks ahead for the effects of these cards only (the deck in a fight): all of them together are far too big to fetch at once. */
const cardFxAsked = new Set<string>();
export async function preloadCardFx(cards: Iterable<string>): Promise<void> {
  await loadCardFx();
  for (const card of cards) {
    const id = baseCard(card);
    if (!cardFx[id] || cardFxAsked.has(id)) continue;
    cardFxAsked.add(id);
    new Image().src = cardFxUrl(id);
  }
}

/** Where this card's own effect plays, or null if it has none (yet). An upgrade, a rolled or an engraved card plays its base card's. */
const baseCard = (card: string): string => {
  const id = stripRoll(card);
  return id.endsWith('+') ? id.slice(0, -1) : id;
};

export function cardFxAt(card: string): CardFxAt | null {
  return cardFx[baseCard(card)]?.at ?? null;
}

/** A card's own effect, centred on a point of the window. */
export function playCardFx(card: string, at: Spot, o: StripOpts = {}): void {
  if (!cardFxAt(card)) return;
  playStrip(cardFxUrl(baseCard(card)), at, { dur: 620, ...o });
}

function playStrip(url: string, at: Spot, o: StripOpts): void {
  if (!room()) return;
  const size = o.size ?? 220;
  const el = document.createElement('i');
  el.className = 'fxs';
  el.style.left = `${at.x}px`;
  el.style.top = `${at.y}px`;
  el.style.width = `${size}px`;
  el.style.height = `${size * (o.squash ?? 1)}px`;
  el.style.backgroundImage = `url("${url}")`;
  el.style.transform = `translate(-50%, -50%) rotate(${o.angle ?? 0}deg)${o.flip ? ' scaleX(-1)' : ''}`;
  fxLayer().appendChild(el);
  const done = (): void => el.remove();
  if (fxStill()) {
    el.style.backgroundPositionX = PEAK_AT;
    el.animate([{ opacity: 0 }, { opacity: 0.9 }, { opacity: 0 }], { duration: 260 }).onfinish =
      done;
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
  moved(
    el,
    [1, scale, 1].map((k) => ({ transform: `scale(${k})` })),
    240,
  );
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

// one jaw of a trap: a steel bar with its teeth along the bottom edge (the other jaw is the same, turned over)
const JAW =
  '<svg viewBox="0 0 100 34" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M4 6 Q50 -6 96 6 L96 16 L89 34 L82 16 L75 34 L68 16 L61 34 L54 16 L46 34 L39 16 L32 34 L25 16 L18 34 L11 16 L4 16 Z" ' +
  'fill="#c9d0d8" stroke="#16191e" stroke-width="3" stroke-linejoin="round"/>' +
  '<path d="M8 8 Q50 -2 92 8" fill="none" stroke="#f3f6fa" stroke-width="2" stroke-linecap="round" opacity="0.8"/>' +
  '</svg>';

/** A Trap springing on someone: two steel jaws swing in from above and below and snap shut on them, then let go. */
export function trapJaws(at: Spot, size = 200): void {
  if (!room()) return;
  const box = document.createElement('i');
  box.className = 'fxjaws';
  box.style.left = `${at.x}px`;
  box.style.top = `${at.y}px`;
  box.style.width = `${size}px`;
  box.style.height = `${size * 0.8}px`;
  const top = document.createElement('i');
  const bottom = document.createElement('i');
  top.innerHTML = JAW;
  bottom.innerHTML = JAW;
  top.className = 'fxjaws__top';
  bottom.className = 'fxjaws__bottom';
  box.append(top, bottom);
  fxLayer().appendChild(box);
  const done = (): void => box.remove();
  if (fxStill()) {
    // (shut and still: it shows for a moment and fades)
    top.style.cssText = 'opacity: 1; transform: translateY(14%)';
    bottom.style.cssText = 'opacity: 1; transform: translateY(-14%)';
    box.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: 420 }).onfinish =
      done;
    return;
  }
  const k = speed();
  // open wide, then slammed shut (the last stretch is the snap), held a beat, then gone
  // (shut, each jaw has gone a little past the middle, so the teeth close between each other)
  const shut = (from: string, closed: string): Keyframe[] => [
    { transform: from, opacity: 0 },
    { transform: from, opacity: 1, offset: 0.25, easing: 'ease-in' },
    { transform: closed, opacity: 1, offset: 0.4 },
    { transform: closed, opacity: 1, offset: 0.8 },
    { transform: closed, opacity: 0 },
  ];
  const t = { duration: 900 / k, fill: 'forwards' as const };
  top.animate(shut('translateY(-55%) rotate(-28deg)', 'translateY(14%) rotate(0deg)'), t);
  bottom.animate(shut('translateY(55%) rotate(28deg)', 'translateY(-14%) rotate(0deg)'), t);
  // the snap jolts the whole trap
  box.animate(
    [
      { transform: 'translate(-50%, -50%)' },
      { transform: 'translate(-50%, -50%)', offset: 0.4 },
      { transform: 'translate(calc(-50% + 5px), calc(-50% + 3px))', offset: 0.45 },
      { transform: 'translate(calc(-50% - 4px), calc(-50% - 2px))', offset: 0.5 },
      { transform: 'translate(-50%, -50%)', offset: 0.56 },
      { transform: 'translate(-50%, -50%)' },
    ],
    { duration: 900 / k },
  ).onfinish = done;
}
