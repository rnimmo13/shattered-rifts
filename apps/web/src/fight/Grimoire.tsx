// A set of cards shown as an open grimoire: parchment pages, realm ribbons (when the cards come from more than one realm), page
// flips. Used wherever a player looks at a deck or a pile; the practice deck builder has its own, editable book (DeckBuilder.tsx).

import { useMemo, useState } from 'react';
import type { CardDef } from '@sr/combat';
import { COMBAT_DB } from '@sr/content/v2';
import { CardHover, type Anchor } from './CardHover';
import { FightCard } from './FightCard';
import { bookLayout, useWidth, type GrimoireCard } from './grimoireData';
import { TABS, paginate, poolOf, sortCards, tabOf, type CatalogCard } from './deckCatalog';

export function Grimoire(props: {
  cards: readonly GrimoireCard[];
  /** pick a card (to upgrade or remove it, say) */
  onPick?: (id: string) => void;
  /** only these ids can be picked; the rest are dimmed */
  pickable?: ReadonlySet<string>;
  cardWidth?: number;
  cols?: number;
  rows?: number;
  /** force one page (or two) whatever the window width */
  spread?: 1 | 2;
  emptyText?: string;
}) {
  const [rootRef, width] = useWidth();
  const layout = bookLayout(width, props.cols, props.spread);
  const { rows = 2 } = props;
  const cardWidth = props.cardWidth ?? layout.cardWidth;
  const cols = props.cols ?? layout.cols;
  const spread = props.spread ?? layout.spread;
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
      ),
    [props.cards],
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
  const pages = useMemo(() => paginate(shown, cols * rows), [shown, cols, rows]);
  const spreads = Math.max(1, Math.ceil(pages.length / spread));
  const at = Math.min(leaf, spreads - 1);
  const visible = pages.slice(at * spread, at * spread + spread);
  const turn = (by: number): void => {
    setDir(by > 0 ? 'next' : 'prev');
    setLeaf(Math.max(0, Math.min(spreads - 1, at + by)));
  };
  const total = entries.length;
  const tabCount = (id: string): number => entries.filter((e) => tabOf(e.def) === id).length;
  return (
    <div className="grim grim--view" ref={rootRef}>
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
        <div className={`grim__book grim__book--${spread}`}>
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
                  {[p.heroes.join(' · '), p.lane].filter(Boolean).join(' · ') || 'Cards'}
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
      <CardHover def={hover?.def ?? null} at={hover?.at ?? null} plus={!!props.onPick} />
    </div>
  );
}
