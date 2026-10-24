// Helpers for the grimoire views (kept out of the component file so fast refresh stays happy).

import { useCallback, useEffect, useState } from 'react';
import type { CardDef, CombatDb } from '@sr/combat';

/** The width of an element's content box, px. */
function contentWidth(el: HTMLElement): number {
  const cs = getComputedStyle(el);
  return Math.floor(el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
}

/**
 * The width of an element in px, kept up to date (0 until it has been measured). Use the returned function as its ref.
 * The ref measures at once, before the first paint, so a book that is rebuilt (a new filter) never flashes at a fallback size.
 */
export function useWidth(): [(el: HTMLElement | null) => void, number] {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [w, setW] = useState(0);
  const ref = useCallback((node: HTMLElement | null) => {
    setEl(node);
    if (node) setW(contentWidth(node));
  }, []);
  useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver((entries) =>
      setW(Math.floor(entries[0]?.contentRect.width ?? 0)),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [ref, w];
}

const PAGE_PAD = 64; // a page's side padding plus the book's edge, px
const FLIPS = 150; // the two page-turn buttons and the cover, px
const GAP = 14.4;
/** a browsing book aims for cards about this wide, and no narrower than the minimum (px) */
const DENSE_CARD = 150;
const DENSE_MIN = 120;

/** The smallest a card is allowed to be before the book turns into a single big page (px). */
const MIN_COMFY = 150;

/**
 * How the book lays out in a box `width` px wide: one page or two, how many cards across, and how big they can be (as large as
 * fits, up to 240 px, and never so tall that two rows run off the bottom of the window). Measured from the box the book sits in, so pages never run into each other.
 * Two pages are only used when the cards on them stay a readable size; otherwise one page with bigger cards is better.
 */
export function bookLayout(
  width: number,
  fixedCols?: number,
  fixedSpread?: 1 | 2,
  /** a browsing book (the Card library, a pile): as many smaller cards as fit, in as many columns and rows as the window allows */
  dense = false,
): { spread: 1 | 2; cols: number; cardWidth: number; rows: number } {
  if (width <= 0) return { spread: 1, cols: fixedCols ?? 3, cardWidth: 150, rows: 2 };
  const fit = (spread: 1 | 2): { spread: 1 | 2; cols: number; cardWidth: number; rows: number } => {
    const perPage = (width - FLIPS) / spread - PAGE_PAD;
    if (dense) {
      const cols =
        fixedCols ?? Math.max(2, Math.min(6, Math.round((perPage + GAP) / (DENSE_CARD + GAP))));
      let cardWidth = Math.max(
        DENSE_MIN,
        Math.min(240, Math.floor((perPage - (cols - 1) * GAP) / cols)),
      );
      // the book's room in the window: at least two rows must fit, and more rows are added while they do
      const room = window.innerHeight - 330;
      const rowH = (w: number): number => w * 1.4 + GAP;
      while (cardWidth > DENSE_MIN && 2 * rowH(cardWidth) > room) cardWidth -= 4;
      const rows = Math.max(2, Math.min(5, Math.floor(room / rowH(cardWidth))));
      return { spread, cols, cardWidth, rows };
    }
    const cols = fixedCols ?? (width < 560 ? 2 : 3);
    // two rows of cards (1.4 x as tall as wide, plus the page header and the book's edges) must fit in the window
    const byHeight = Math.floor((window.innerHeight - 380) / 2.9);
    const byWidth = Math.floor((perPage - (cols - 1) * GAP) / cols);
    return {
      spread,
      cols,
      cardWidth: Math.max(110, Math.min(240, byWidth, Math.max(150, byHeight))),
      rows: 2,
    };
  };
  if (fixedSpread) return fit(fixedSpread);
  const two = fit(2);
  return width >= 1000 && two.cardWidth >= (dense ? DENSE_MIN + 10 : MIN_COMFY) ? two : fit(1);
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
