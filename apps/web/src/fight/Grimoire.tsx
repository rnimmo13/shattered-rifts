// A set of cards shown as an open grimoire: parchment pages, realm ribbons (when the cards come from more than one realm), page
// flips. Used wherever a player looks at a deck or a pile; the practice deck builder has its own, editable book (DeckBuilder.tsx).
// The book is sized by the box it sits in and the cards by the book (inside a fixed range, CARD_SIZES), never the other way round,
// so nothing it draws can make it grow, shrink or jump. GrimoireModal opens one over the whole window.

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { CardDef } from '@sr/combat';
import { COMBAT_DB } from '@sr/content/v2';
import { HeroIcon } from '../ui/HeroIcon';
import { CardHover, type Anchor } from './CardHover';
import { FightCard } from './FightCard';
import { NARROW_BELOW, fitBook, useSize, type CardSize, type GrimoireCard } from './grimoireData';
import { TABS, paginate, poolOf, sortCards, tabOf, type CatalogCard } from './deckCatalog';

export interface GrimoireProps {
  cards: readonly GrimoireCard[];
  /** pick a card (to upgrade or remove it, say) */
  onPick?: (id: string) => void;
  /** only these ids can be picked; the rest are dimmed */
  pickable?: ReadonlySet<string>;
  cols?: number;
  rows?: number;
  /** force one page (or two) whatever the box */
  spread?: 1 | 2;
  emptyText?: string;
  /** the range the cards are drawn in (see CARD_SIZES): 'pick' when choosing a card, 'read' (the default) for a deck or pile */
  size?: CardSize;
  /**
   * 'fill' (the default): the book fills the box it sits in, which must have a height of its own (a GrimoireModal, say).
   * 'grow': the book is as tall as its cards (a short starter deck).
   */
  height?: 'fill' | 'grow';
  /**
   * Size the cards as if the book held this many (the Card library: every card of the game), so a filter that shows fewer never
   * makes the cards jump in size (DECISIONS #446). Default: the cards it holds.
   */
  fitCount?: number;
}

export function Grimoire(props: GrimoireProps) {
  const grow = props.height === 'grow';
  const [bookRef, box] = useSize();
  // every copy gets its own card: three Attacks are three cards on the page, never one card with a number on it
  const entries = useMemo(
    () =>
      sortCards(
        props.cards.flatMap((c): CatalogCard[] =>
          Array.from({ length: Math.max(1, c.n) }, () => ({
            def: c.def,
            pool: poolOf(c.def),
            upgraded: c.def.id.endsWith('+'),
          })),
        ),
        'rarity',
      ),
    [props.cards],
  );
  // sized for every card in the book (not just the open ribbon's), so turning to another realm never resizes the cards
  // (a phone: the book's edges are slimmer, so two cards fit across a page, DECISIONS #443)
  const narrow = window.innerWidth < NARROW_BELOW;
  const { spread, cols, rows, cardWidth } = fitBook(
    box.w,
    grow ? Infinity : box.h,
    Math.max(entries.length, props.fitCount ?? 0),
    props.size ?? 'read',
    {
      ...(props.spread ? { spread: props.spread } : {}),
      ...(props.cols ? { cols: props.cols } : {}),
      ...(props.rows ? { rows: props.rows } : {}),
      ...(narrow ? { narrow } : {}),
    },
  );
  const tabs = useMemo(() => {
    const present = new Set(entries.map((e) => tabOf(e.def)));
    return TABS.filter((t) => present.has(t.id));
  }, [entries]);
  const [tab, setTab] = useState<string | 'all'>('all');
  const [leaf, setLeaf] = useState(0);
  const [dir, setDir] = useState<'next' | 'prev'>('next');
  const [hover, setHover] = useState<{ def: CardDef; at: Anchor } | null>(null);

  const shown = tab === 'all' ? entries : entries.filter((e) => tabOf(e.def) === tab);
  const pages = useMemo(() => paginate(shown, cols * rows, true), [shown, cols, rows]);
  const spreads = Math.max(1, Math.ceil(pages.length / spread));
  const at = Math.min(leaf, spreads - 1);
  const visible = pages.slice(at * spread, at * spread + spread);
  const turn = (by: number): void => {
    setDir(by > 0 ? 'next' : 'prev');
    setLeaf(Math.max(0, Math.min(spreads - 1, at + by)));
  };
  // the arrow keys turn the pages of a book that fills its box (one on screen at a time)
  useEffect(() => {
    if (grow) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.target instanceof HTMLElement && e.target.closest('input, select, textarea')) return;
      if (e.key === 'ArrowRight') turn(1);
      else if (e.key === 'ArrowLeft') turn(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const total = entries.length;
  const tabCount = (id: string): number => entries.filter((e) => tabOf(e.def) === id).length;
  return (
    <div
      className={`grim grim--view grim--${grow ? 'grow' : 'fill'}${narrow ? ' grim--narrow' : ''}`}
    >
      <div className="grim__main">
        {tabs.length > 1 && (
          <div className="grim__tabs" role="tablist" aria-label="Realms">
            {[{ id: 'all', name: 'Everything' }, ...tabs].map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={t.id === tab}
                className={`grim__ribbon grim__ribbon--${t.id === 'all' ? 'other' : t.id}${t.id === tab ? ' is-open' : ''}`}
                onClick={() => {
                  setTab(t.id);
                  setLeaf(0);
                }}
              >
                <span>{t.name}</span>
                <b>{t.id === 'all' ? total : tabCount(t.id)}</b>
              </button>
            ))}
          </div>
        )}
        <div className={`grim__book grim__book--${spread}`} ref={bookRef}>
          <button
            className="grim__flip"
            disabled={at === 0}
            onClick={() => turn(-1)}
            aria-label="Previous pages"
          >
            ‹
          </button>
          <div key={`${tab}-${at}`} className={`grim__spread grim__spread--${dir}`}>
            {visible.length === 0 && (
              <section className="grim__page">
                <p className="grim__empty">{props.emptyText ?? 'Empty.'}</p>
              </section>
            )}
            {visible.map((p, i) => (
              <section key={i} className="grim__page">
                <h4 className="grim__pagehead">
                  {p.heroIds.map((h) => (
                    <HeroIcon key={h} hero={h} size={26} />
                  ))}
                  <span>
                    {p.heroes.length !== 1 && p.heroes.length !== 2
                      ? 'By rarity'
                      : p.heroes.join(' · ') || 'Cards'}
                  </span>
                </h4>
                <ul
                  className="grim__cards"
                  style={{ gridTemplateColumns: `repeat(${cols}, ${cardWidth}px)` }}
                >
                  {p.cards.map(({ def }, idx) => {
                    const ok = !!props.onPick && (!props.pickable || props.pickable.has(def.id));
                    return (
                      <li
                        key={`${def.id}-${idx}`}
                        className={`grim__slot grim__slot--view${props.onPick && !ok ? ' is-off' : ''}`}
                      >
                        <button
                          className="grim__card"
                          disabled={!!props.onPick && !ok}
                          aria-label={props.onPick ? `Choose ${def.name}` : def.name}
                          onClick={() => ok && props.onPick?.(def.id)}
                          onMouseEnter={(e) =>
                            setHover({ def, at: e.currentTarget.getBoundingClientRect() })
                          }
                          onMouseLeave={() => setHover(null)}
                          onFocus={(e) =>
                            setHover({ def, at: e.currentTarget.getBoundingClientRect() })
                          }
                          onBlur={() => setHover(null)}
                        >
                          <FightCard db={COMBAT_DB} def={def} width={cardWidth} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <span className="grim__folio">{at * spread + i + 1}</span>
              </section>
            ))}
          </div>
          <button
            className="grim__flip"
            disabled={at >= spreads - 1}
            onClick={() => turn(1)}
            aria-label="Next pages"
          >
            ›
          </button>
        </div>
      </div>
      <CardHover def={hover?.def ?? null} at={hover?.at ?? null} />
    </div>
  );
}

/**
 * A grimoire over the whole window: the full width, and all the height there is, whatever screen it is opened from. Without
 * onClose it cannot be dismissed (a card must be chosen).
 */
export function GrimoireModal(
  props: GrimoireProps & {
    title: ReactNode;
    hint?: ReactNode;
    onClose?: () => void;
    /** the close button's words (default "Close") */
    closeLabel?: string;
  },
) {
  const { title, hint, onClose, closeLabel, ...book } = props;
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // focus moves into the book while it is open, and back to where it was when it closes
  useEffect(() => {
    const before = document.activeElement;
    panelRef.current?.focus();
    return () => {
      if (before instanceof HTMLElement) before.focus();
    };
  }, []);
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  // (in a portal, so no transformed or clipped ancestor can shrink it)
  return createPortal(
    <div
      className="grimmodal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onPointerDown={(e) => {
        if (onClose && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="grimmodal__panel" ref={panelRef} tabIndex={-1}>
        <header className="grimmodal__head">
          <div>
            <h2 className="grimmodal__title" id={titleId}>
              {title}
            </h2>
            {hint && <p className="grimmodal__hint">{hint}</p>}
          </div>
          {onClose && (
            <button className="btn btn--small" onClick={onClose}>
              <span>{closeLabel ?? 'Close'}</span>
            </button>
          )}
        </header>
        <div className="grimmodal__body">
          <Grimoire {...book} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
