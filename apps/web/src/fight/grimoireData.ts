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
