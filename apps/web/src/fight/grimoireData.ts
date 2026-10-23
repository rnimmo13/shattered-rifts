// Helpers for the grimoire views (kept out of the component file so fast refresh stays happy).

import { useEffect, useState } from 'react';
import type { CardDef, CombatDb } from '@sr/combat';

const WIDE = '(min-width: 1180px)';

/** One page of the book or two, depending on how wide the window is. */
export function useSpread(): 1 | 2 {
  const [wide, setWide] = useState(() => window.matchMedia(WIDE).matches);
  useEffect(() => {
    const m = window.matchMedia(WIDE);
    const on = (): void => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return wide ? 2 : 1;
}

/**
 * How big the book's cards can be: as large as the window allows (3 across, 2 on a phone), up to 280 px, so they can be read.
 * `sidePx` is room taken by a side panel; `maxPx` is the widest the book itself may be (a modal).
 */
export function useBookLayout(
  sidePx: number,
  maxPx = 1440,
): { spread: 1 | 2; cols: number; cardWidth: number } {
  const spread = useSpread();
  const [vw, setVw] = useState(() => window.innerWidth);
  useEffect(() => {
    const on = (): void => setVw(window.innerWidth);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  const cols = vw < 700 ? 2 : 3;
  const room = Math.min(vw, maxPx) - sidePx - 130;
  const cardWidth = Math.max(
    150,
    Math.min(280, Math.floor((room / spread - 44 - (cols - 1) * 14) / cols)),
  );
  return { spread, cols, cardWidth };
}

export interface GrimoireCard {
  def: CardDef;
  /** copies of it (shown as a badge when more than one) */
  n: number;
}

/** Counts per card id, from a list with an id repeated per copy. */
export function tally(ids: readonly string[], db: CombatDb): GrimoireCard[] {
  const m = new Map<string, number>();
  for (const id of ids) m.set(id, (m.get(id) ?? 0) + 1);
  return [...m.entries()].flatMap(([id, n]) => {
    const def = db.cards[id];
    return def ? [{ def, n }] : [];
  });
}
