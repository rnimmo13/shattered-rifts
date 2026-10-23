// Helpers for the grimoire views (kept out of the component file so fast refresh stays happy).

import { useEffect, useState } from 'react';
import type { CardDef, CombatDb } from '@sr/combat';

/** The width of an element in px, kept up to date (0 until it has been measured). Use the returned function as its ref. */
export function useWidth(): [(el: HTMLElement | null) => void, number] {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver((entries) =>
      setW(Math.floor(entries[0]?.contentRect.width ?? 0)),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, w];
}

const PAGE_PAD = 44; // a page's side padding plus the book's edge, px
const FLIPS = 130; // the two page-turn buttons and the cover, px
const GAP = 14.4;

/**
 * How the book lays out in a box `width` px wide: one page or two, how many cards across, and how big they can be (as large as
 * fits, up to 280 px, so they can be read). Measured from the box the book sits in, so pages never run into each other.
 */
export function bookLayout(
  width: number,
  fixedCols?: number,
  fixedSpread?: 1 | 2,
): { spread: 1 | 2; cols: number; cardWidth: number } {
  if (width <= 0) return { spread: 1, cols: fixedCols ?? 3, cardWidth: 150 };
  const spread: 1 | 2 = fixedSpread ?? (width >= 1000 ? 2 : 1);
  const cols = fixedCols ?? (width < 560 ? 2 : 3);
  const perPage = (width - FLIPS) / spread - PAGE_PAD;
  const cardWidth = Math.max(110, Math.min(280, Math.floor((perPage - (cols - 1) * GAP) / cols)));
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
