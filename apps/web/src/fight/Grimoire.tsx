// A set of cards shown as an open grimoire: one long parchment page that scrolls, with realm ribbons (when the cards come from more
// than one realm). Used wherever a player looks at a deck or a pile; the practice deck builder has its own, editable book
// (DeckBuilder.tsx). The book is sized by the box it sits in and the cards by the page's width (inside a fixed range, CARD_SIZES),
// never the other way round, so nothing it draws can make it grow, shrink or jump. GrimoireModal opens one over the whole window.
// (It turned pages until DECISIONS #725: a scroll reads better on a touch screen and lets a row span the page.)

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import type { CardDef } from '@sr/combat';
import { COMBAT_DB } from '@sr/content/v2';
import { HeroIcon } from '../ui/HeroIcon';
import { CardHover, type Anchor } from './CardHover';
import { FightCard } from './FightCard';
import {
  NARROW_BELOW,
  PAGE_ENDS,
  fitScroll,
  useSize,
  useWidth,
  type CardSize,
  type GrimoireCard,
} from './grimoireData';
import { TABS, paginate, poolOf, sortCards, tabOf, type CatalogCard } from './deckCatalog';

export interface GrimoireProps {
  cards: readonly GrimoireCard[];
  /** pick a card (to upgrade or remove it, say) */
  onPick?: (id: string) => void;
  /** only these ids can be picked; the rest are dimmed */
  pickable?: ReadonlySet<string>;
  cols?: number;
  /** (unused since the book scrolls, DECISIONS #725) */
  rows?: number;
  /** (unused since the book scrolls, DECISIONS #725: it is always one page) */
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
   * (unused since the book scrolls, DECISIONS #725: card size no longer depends on the count at all)
   * Size the cards as if the book held this many (the Card library: every card of the game), so a filter that shows fewer never
   * makes the cards jump in size (DECISIONS #446). Default: the cards it holds.
   */
  fitCount?: number;
}

/** the kinds of card, in the order the page's header counts them, and what the player calls them (one, many) */
const KIND_ORDER = ['attack', 'skill', 'power', 'summon', 'snare'] as const;
const KIND_LABEL: Record<string, [string, string]> = {
  attack: ['Attack', 'Attacks'],
  skill: ['Skill', 'Skills'],
  power: ['Aura', 'Auras'],
  summon: ['Summon', 'Summons'],
  snare: ['Trap', 'Traps'],
};

export function Grimoire(props: GrimoireProps) {
  const grow = props.height === 'grow';
  // the book's page is measured (its height: how tall a card may be) and so is the list in it (its width, less any scrollbar)
  const [pageRef, page] = useSize();
  const [listRef, listW] = useWidth();
  const scrollRef = useRef<HTMLElement | null>(null);
  // (stable refs: a ref made anew each render is detached and attached again every time, and each attach measures and re-renders)
  const narrowNow = window.innerWidth < NARROW_BELOW;
  const pageEl = useCallback(
    (el: HTMLElement | null) => {
      scrollRef.current = el;
      pageRef(el);
    },
    [pageRef],
  );
  const listEl = useCallback(
    (el: HTMLElement | null) => {
      listRef(el);
      // (on a phone it is the list that scrolls)
      if (narrowNow && el) scrollRef.current = el;
    },
    [listRef, narrowNow],
  );
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
  // (a phone: the book's edges are slimmer and two cards fit across, DECISIONS #443)
  const narrow = narrowNow;
  // one long page that scrolls, not pages to turn (DECISIONS #725: a swipe down is how a touch screen reads a list). The cards
  // are as many across as fit and as big as their size range allows, so a row spans the page; they never depend on how many
  // cards there are or which realm ribbon is open, so a filter or a short pile never resizes them.
  const fit = fitScroll(
    listW,
    // (a phone's list is narrower than any card is tall, so only the book's page limits a card's height)
    grow || narrow ? Infinity : page.h - PAGE_ENDS,
    props.size ?? 'read',
    narrow,
  );
  const cols = props.cols ?? fit.cols;
  const cardWidth = fit.cardWidth;
  const tabs = useMemo(() => {
    const present = new Set(entries.map((e) => tabOf(e.def)));
    return TABS.filter((t) => present.has(t.id));
  }, [entries]);
  const [tab, setTab] = useState<string | 'all'>('all');
  const [hover, setHover] = useState<{ def: CardDef; at: Anchor } | null>(null);

  const shown = tab === 'all' ? entries : entries.filter((e) => tabOf(e.def) === tab);
  // the page's heading: the characters whose cards are on it
  const head = useMemo(() => paginate(shown, Math.max(1, shown.length), true)[0], [shown]);
  const total = entries.length;
  const tabCount = (id: string): number => entries.filter((e) => tabOf(e.def) === id).length;
  // the page's makeup, in its header: how many of each kind, and the average Mana of the cards that can be played
  const stats = useMemo(() => {
    const kinds = new Map<string, number>();
    let mana = 0;
    let playable = 0;
    for (const { def } of shown) {
      kinds.set(def.kind, (kinds.get(def.kind) ?? 0) + 1);
      if (!def.unplayable) {
        mana += def.cost;
        playable++;
      }
    }
    return {
      kinds: KIND_ORDER.filter((k) => kinds.has(k)).map((k) => ({
        kind: k,
        n: kinds.get(k) ?? 0,
      })),
      avg: playable ? mana / playable : 0,
    };
  }, [shown]);
  const realmTabs = (cls: string) => (
    <div className={cls} role="tablist" aria-label="Realms">
      {[{ id: 'all', name: 'Everything' }, ...tabs].map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={t.id === tab}
          className={`grim__ribbon grim__ribbon--${t.id}${t.id === tab ? ' is-open' : ''}`}
          onClick={() => {
            setTab(t.id);
            // another realm starts at its top
            scrollRef.current?.scrollTo({ top: 0 });
          }}
        >
          <span>{t.name}</span>
          <b>{t.id === 'all' ? total : tabCount(t.id)}</b>
        </button>
      ))}
    </div>
  );
  const cardList = (hoverable: boolean, listClass: string) =>
    shown.length === 0 ? (
      <p className="grim__empty">{props.emptyText ?? 'Empty.'}</p>
    ) : (
      <ul
        // (a realm opened afresh: its cards rise into place again)
        key={tab}
        className={listClass}
        ref={listEl}
        style={{ gridTemplateColumns: `repeat(${cols}, ${cardWidth}px)` }}
      >
        {shown.map(({ def }, idx) => {
          const ok = !!props.onPick && (!props.pickable || props.pickable.has(def.id));
          return (
            <li
              key={`${def.id}-${idx}`}
              // (its realm's colour for the glow when it is hovered; the first rows come in one after another)
              className={`grim__slot grim__slot--view grim__slot--${tabOf(def)}${props.onPick && !ok ? ' is-off' : ''}`}
              style={{ '--i': Math.min(idx, 24) } as CSSProperties}
            >
              <button
                className="grim__card"
                disabled={!!props.onPick && !ok}
                aria-label={props.onPick ? `Choose ${def.name}` : def.name}
                onClick={() => ok && props.onPick?.(def.id)}
                {...(hoverable
                  ? {
                      onMouseEnter: (e: MouseEvent<HTMLButtonElement>) =>
                        setHover({ def, at: e.currentTarget.getBoundingClientRect() }),
                      onMouseLeave: () => setHover(null),
                      onFocus: (e: FocusEvent<HTMLButtonElement>) =>
                        setHover({ def, at: e.currentTarget.getBoundingClientRect() }),
                      onBlur: () => setHover(null),
                    }
                  : {})}
              >
                <FightCard db={COMBAT_DB} def={def} width={cardWidth} />
              </button>
            </li>
          );
        })}
      </ul>
    );
  // a phone: no book. The realms are a row of chips that slides sideways, and every card of the open one is in a list two
  // across that scrolls (Robert, 2026-11-02: the book's tabs overlapped and its pages held four cards each)
  if (narrow) {
    return (
      <div className={`grim grim--phone grim--${grow ? 'grow' : 'fill'}`} ref={pageRef}>
        {tabs.length > 1 && realmTabs('grim__chips')}
        {cardList(false, 'grim__list')}
      </div>
    );
  }
  return (
    <div className={`grim grim--view grim--scroll grim--${grow ? 'grow' : 'fill'}`}>
      <div className="grim__main">
        {tabs.length > 1 && realmTabs('grim__tabs')}
        <div className="grim__book grim__book--1">
          <section
            className="grim__page"
            ref={pageEl}
            // (the big preview is placed where the card was; once the list moves it would point at another card)
            onScroll={() => setHover(null)}
          >
            {shown.length > 0 && (
              <h4 className="grim__pagehead">
                <span className="grim__who">
                  {head?.heroIds.map((h) => (
                    <HeroIcon key={h} hero={h} size={26} />
                  ))}
                  <span className="grim__whoname">
                    {!head || (head.heroes.length !== 1 && head.heroes.length !== 2)
                      ? 'By rarity'
                      : head.heroes.join(' · ') || 'Cards'}
                  </span>
                </span>
                <span className="grim__stats" aria-label="What is on this page">
                  <span className="grim__stat grim__stat--total">
                    <b>{shown.length}</b> {shown.length === 1 ? 'card' : 'cards'}
                  </span>
                  {stats.kinds.map(({ kind, n }) => (
                    <span key={kind} className={`grim__stat grim__stat--${kind}`}>
                      <b>{n}</b> {KIND_LABEL[kind]?.[n === 1 ? 0 : 1] ?? kind}
                    </span>
                  ))}
                  {stats.avg > 0 && (
                    <span className="grim__stat grim__stat--mana">
                      <b>{stats.avg.toFixed(1)}</b> avg Mana
                    </span>
                  )}
                </span>
              </h4>
            )}
            {cardList(true, 'grim__cards')}
          </section>
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
