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
/** a book to read (a deck viewed in a run) aims for bigger cards, and keeps them at least this wide so the text stays legible */
const READ_CARD = 190;
const READ_MIN = 170;
/** what a page spends on its own head, folio and the book's edges, px */
const BOOK_CHROME = 165;

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
  /** the height (px) from the top of the book to the bottom of the window: the book never grows past it */
  room?: number,
  /** a dense book meant for reading (not just browsing): bigger cards, with a higher floor */
  reading = false,
): { spread: 1 | 2; cols: number; cardWidth: number; rows: number } {
  if (width <= 0) return { spread: 1, cols: fixedCols ?? 3, cardWidth: 150, rows: 2 };
  const fit = (spread: 1 | 2): { spread: 1 | 2; cols: number; cardWidth: number; rows: number } => {
    const perPage = (width - FLIPS) / spread - PAGE_PAD;
    const target = reading ? READ_CARD : DENSE_CARD;
    const floor = reading ? READ_MIN : DENSE_MIN;
    if (dense) {
      let cols =
        fixedCols ?? Math.max(1, Math.min(6, Math.round((perPage + GAP) / (target + GAP))));
      const across = (n: number): number => Math.floor((perPage - (n - 1) * GAP) / n);
      // a narrow window gets fewer columns rather than a book wider than itself
      while (!fixedCols && cols > 1 && across(cols) < floor) cols--;
      let cardWidth = Math.max(60, Math.min(240, across(cols)));
      // the book's room in the window (less the page head, the book's edges and the folio): two rows if they fit, one if not, and more
      // rows are added while they do. The cards shrink before the book is allowed past the bottom of the window.
      const space = (room ?? window.innerHeight - 330) - BOOK_CHROME;
      const rowH = (w: number): number => w * 1.4 + GAP;
      const fits = (w: number): number => Math.floor(space / rowH(w));
      while (cardWidth > floor && fits(cardWidth) < 2) cardWidth -= 4;
      while (cardWidth > 60 && fits(cardWidth) < 1) cardWidth -= 4;
      const rows = Math.max(1, Math.min(5, fits(cardWidth)));
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
  return width >= 1000 &&
    two.cardWidth >= (dense ? (reading ? READ_MIN : DENSE_MIN) + 10 : MIN_COMFY)
    ? two
    : fit(1);
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

/** The size of an element's border box in px, kept up to date ({0, 0} until measured). Use the returned function as its ref. */
export function useSize(): [(el: HTMLElement | null) => void, { w: number; h: number }] {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const ref = useCallback((node: HTMLElement | null) => {
    setEl(node);
    if (node) setSize({ w: Math.floor(node.offsetWidth), h: Math.floor(node.offsetHeight) });
  }, []);
  useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.borderBoxSize[0];
      if (!r) return;
      const next = { w: Math.floor(r.inlineSize), h: Math.floor(r.blockSize) };
      setSize((s) => (s.w === next.w && s.h === next.h ? s : next));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [ref, size];
}

/**
 * How big a grimoire's cards may be, px wide (a card is 1.4 x as tall). Cards are never drawn outside their range: a window too
 * small for the smallest gets fewer cards to a page, never smaller ones.
 */
export const CARD_SIZES = {
  /** a starting deck beside the character picker */
  small: { min: 100, max: 170 },
  /** the Card library: many cards to a page */
  browse: { min: 150, max: 200 },
  /** a deck or a pile to read */
  read: { min: 165, max: 220 },
  /** choosing a card (to upgrade or remove it): big and easy to read */
  pick: { min: 185, max: 250 },
} as const;
export type CardSize = keyof typeof CARD_SIZES;

// the box measured is the whole book (cover, brass edge, page-turn buttons); these are what it spends on things other than cards.
// They match play.css (.grim__book, .grim__page, .grim__cards): keep the two in step.
/** the cover's padding and border plus the two page-turn columns, px */
export const BOOK_SIDES = 104;
/** the cover's padding and border, top and bottom, px */
export const BOOK_ENDS = 40;
/** a page's side padding, px */
export const PAGE_SIDES = 36;
/** a page's head, top padding and folio, px */
export const PAGE_ENDS = 92;
/** (DECISIONS #443) on a phone the book's chrome is slimmer (play.css, .grim--narrow), so two cards fit across a page */
export const NARROW_BOOK_SIDES = 68;
export const NARROW_PAGE_SIDES = 20;
/** below this window width the book is narrow */
export const NARROW_BELOW = 520;
export const COL_GAP = 14;
export const ROW_GAP = 12;
const ASPECT = 1.4;

export interface BookFit {
  spread: 1 | 2;
  cols: number;
  rows: number;
  cardWidth: number;
}

/**
 * The layout of a book `w` x `h` px holding `n` cards (h: Infinity when the book grows with its cards). Of every page count, column
 * count and row count whose cards stay inside the size range, it takes the one that shows the cards on the fewest spreads, then
 * the one with the biggest cards, then the one with the fewest empty places. So a short deck fills one spread with big cards, a
 * long one packs pages with cards near the low end of the range, and the size never depends on which realm ribbon is open.
 */
export function fitBook(
  w: number,
  h: number,
  n: number,
  size: CardSize,
  fixed: { spread?: 1 | 2; cols?: number; rows?: number; narrow?: boolean } = {},
): BookFit {
  const bookSides = fixed.narrow ? NARROW_BOOK_SIDES : BOOK_SIDES;
  const pageSides = fixed.narrow ? NARROW_PAGE_SIDES : PAGE_SIDES;
  // (a phone: cards may be smaller, so two fit across a page; a tap shows one big)
  const min = fixed.narrow ? Math.min(CARD_SIZES[size].min, 110) : CARD_SIZES[size].min;
  const { max } = CARD_SIZES[size];
  if (w <= 0) return { spread: 1, cols: fixed.cols ?? 3, rows: fixed.rows ?? 2, cardWidth: min };
  const cards = Math.max(1, n);
  let best: (BookFit & { spreads: number; spare: number }) | null = null;
  for (const spread of fixed.spread ? [fixed.spread] : ([1, 2] as const)) {
    const pageW = (w - bookSides) / spread - pageSides;
    const pageH = h - BOOK_ENDS - PAGE_ENDS;
    for (let cols = fixed.cols ?? 1; cols <= (fixed.cols ?? 8); cols++) {
      const byW = Math.floor((pageW - (cols - 1) * COL_GAP) / cols);
      if (byW < min) break;
      // a book that grows with its cards: just enough rows for them
      const rowRange = Number.isFinite(h)
        ? [1, fixed.rows ?? 6]
        : [
            fixed.rows ?? Math.ceil(cards / spread / cols),
            fixed.rows ?? Math.ceil(cards / spread / cols),
          ];
      for (let rows = fixed.rows ?? rowRange[0]!; rows <= rowRange[1]!; rows++) {
        const byH = Number.isFinite(h)
          ? Math.floor((pageH - (rows - 1) * ROW_GAP) / rows / ASPECT)
          : Infinity;
        // (a multiple of 5, so a window dragged a few px wider does not redraw every card)
        const cardWidth = Math.floor(Math.min(max, byW, byH) / 5) * 5;
        if (cardWidth < min) break;
        const perSpread = spread * cols * rows;
        const pages = Math.ceil(cards / (cols * rows));
        // two pages with only one page of cards: one big page is better
        if (spread === 2 && pages < 2 && !fixed.spread) continue;
        // (a book that grows with its cards: the fewest rows, so as many across as fit)
        const spreads = Number.isFinite(h) ? Math.ceil(cards / perSpread) : rows;
        const spare = spreads * perSpread - cards;
        const better =
          !best ||
          spreads < best.spreads ||
          (spreads === best.spreads &&
            (cardWidth > best.cardWidth || (cardWidth === best.cardWidth && spare < best.spare)));
        if (better) best = { spread, cols, rows, cardWidth, spreads, spare };
      }
    }
  }
  if (best)
    return { spread: best.spread, cols: best.cols, rows: best.rows, cardWidth: best.cardWidth };
  // a box too small for even one card of the smallest size: one card a page, at that size (the page scrolls)
  const cols = fixed.cols ?? 1;
  const rows = fixed.rows ?? (Number.isFinite(h) ? 1 : Math.ceil(cards / cols));
  return { spread: 1, cols, rows, cardWidth: min };
}
