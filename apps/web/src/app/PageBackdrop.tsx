// The painted place behind a menu page (DECISIONS #745, #747): seven pictures cover every page that is not a fight, a run or the
// lore. A page keeps its own layout; this only puts the picture behind it, under a dark wash so the words on top read as before.
// Nothing is shown while a fight is on screen (a fight has its own arena).

import { useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { battleActive, subscribeBattle } from '../battleActivity';
import './backdrops.css';

export type Place =
  'sanctum' | 'market' | 'vault' | 'crossing-gate' | 'archive' | 'champions' | 'chronicle';

const PLACES: Readonly<Record<string, Place>> = {
  '': 'sanctum',
  '#': 'sanctum',
  '#/': 'sanctum',
  '#/store': 'market',
  '#/cosmetics': 'vault',
  '#/earned': 'vault',
  '#/arena': 'crossing-gate',
  '#/pvp': 'crossing-gate',
  '#/arena-rules': 'crossing-gate',
  '#/ghosts': 'crossing-gate',
  '#/decks': 'archive',
  '#/cards': 'archive',
  '#/history': 'archive',
  '#/board': 'champions',
  '#/trophies': 'champions',
  '#/learn': 'chronicle',
  '#/patch-notes': 'chronicle',
  '#/credits': 'chronicle',
};

/** The place a page is in, if it has one (a fight, a run, a replay and the lore have their own pictures). */
const placeOf = (hash: string): Place | undefined =>
  Object.hasOwn(PLACES, hash) ? PLACES[hash] : undefined;

/** Where the middle of the lit dais is in the Sanctum painting, as fractions of its width and height. */
const DAIS = { x: 0.61, y: 0.612 };
/** The painting is drawn this much larger than the screen needs, so there is room to slide it under the Riftwalker. */
const SANCTUM_SCALE = 1.1;

/**
 * The home page's painting is placed by the Riftwalker, not by the window (DECISIONS #749): the dais is slid under the picked
 * Riftwalker's feet (the floor shadow the home page draws there) and kept there when the window changes size or the layout stacks
 * on a phone; it lies on the page, so it scrolls with the Riftwalker. It never slides so far that it stops covering its box.
 */
function useDaisUnderFeet(on: boolean): React.RefObject<HTMLDivElement | null> {
  const el = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!on) return;
    let frame = 0;
    let tries = 0;
    let watched: Element | null = null;
    const sizes = new ResizeObserver(() => ask());
    const put = (): void => {
      frame = 0;
      const box = el.current;
      const floor = document.querySelector('.home__floor');
      if (!box) return;
      if (!floor) {
        // (the home page draws a moment after this does: look again for a little while)
        if (tries++ < 180) ask();
        return;
      }
      if (floor !== watched) {
        if (watched) sizes.unobserve(watched);
        sizes.observe((watched = floor));
      }
      // The painting lies on the page, not on the window, so it scrolls with the Riftwalker and needs no placing again as the page
      // moves. It covers the first screen, and reaches a little below the Riftwalker where they stand lower than that (a phone,
      // where the menu comes first); below it the page is its own dark colour (the wash fades to it).
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const feet = floor.getBoundingClientRect();
      const fx = feet.left + window.scrollX + feet.width / 2;
      const fy = feet.top + window.scrollY + feet.height / 2;
      const height = Math.min(
        document.documentElement.scrollHeight,
        Math.max(vh, Math.round(fy + vh * 0.3)),
      );
      // As large as covering the box takes, and larger if that is what it takes for the dais to reach the feet without the
      // painting's edge coming into view (a short window, where the Riftwalker stands high on the screen).
      const w = Math.max(
        Math.max(vw, (height * 16) / 9) * SANCTUM_SCALE,
        fx / DAIS.x,
        (vw - fx) / (1 - DAIS.x),
        ((fy / DAIS.y) * 16) / 9,
        (((height - fy) / (1 - DAIS.y)) * 16) / 9,
      );
      const h = (w * 9) / 16;
      const within = (v: number, low: number): number => Math.min(0, Math.max(low, v));
      const x = within(fx - DAIS.x * w, vw - w);
      const y = within(fy - DAIS.y * h, height - h);
      box.style.height = `${height}px`;
      box.style.backgroundSize = `${Math.round(w)}px ${Math.round(h)}px`;
      box.style.backgroundPosition = `${Math.round(x)}px ${Math.round(y)}px`;
    };
    const ask = (): void => {
      if (!frame) frame = requestAnimationFrame(put);
    };
    put();
    sizes.observe(document.body);
    window.addEventListener('resize', ask);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      sizes.disconnect();
      window.removeEventListener('resize', ask);
    };
  }, [on]);
  return el;
}

const pictureOf = (place: Place): string =>
  `url("${import.meta.env.BASE_URL}art/backgrounds/${place}.webp")`;

/**
 * A place's painting, still behind the page: for a page that decides for itself when it has one (the Sanctum is one screen of
 * #/run, shown only until a run begins, so the address alone cannot say).
 */
export function StillBackdrop(props: { place: Place }) {
  return (
    <div
      className={`backdrop backdrop--still backdrop--${props.place}`}
      style={{ backgroundImage: pictureOf(props.place) }}
      aria-hidden
    />
  );
}

export function PageBackdrop(props: { hash: string }) {
  const place = placeOf(props.hash);
  const inBattle = useSyncExternalStore(subscribeBattle, battleActive);
  const shown = !!place && !inBattle;
  // (only the home page stands a Riftwalker on the hall's dais)
  const el = useDaisUnderFeet(shown && place === 'sanctum');
  if (!shown) return null;
  return (
    <div
      ref={el}
      // (keyed by the place, so moving between two pages of one place does not fade it in again)
      key={place}
      className={`backdrop backdrop--${place}${place === 'sanctum' ? ' backdrop--home' : ''}`}
      style={{ backgroundImage: pictureOf(place) }}
      aria-hidden
    />
  );
}
