// A set of cards shown as an open grimoire: parchment pages, realm ribbons (when the cards come from more than one realm), page
// flips. Used wherever a player looks at a deck or a pile; the practice deck builder has its own, editable book (DeckBuilder.tsx).

import { useMemo, useState } from 'react';
import type { CardDef } from '@sr/combat';
import { COMBAT_DB } from '@sr/content/v2';
import { CardHover } from './CardHover';
import { FightCard } from './FightCard';
import { useBookLayout, type GrimoireCard } from './grimoireData';
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
  /** the widest the book may be (a modal is narrower than the window) */
  maxWidth?: number;
}) {
  const layout = useBookLayout(120, props.maxWidth);
  const { rows = 2 } = props;
  const cardWidth = props.cardWidth ?? layout.cardWidth;
  const cols = props.cols ?? layout.cols;
  const spread = props.spread ?? layout.spread;
  const entries = useMemo(
    () =>
      sortCards(
        props.cards.map((c): CatalogCard => ({
          def: c.def,
          pool: poolOf(c.def),
          upgraded: c.def.id.endsWith('+'),
        })),
      ),
    [props.cards],
  );
  const counts = useMemo(() => new Map(props.cards.map((c) => [c.def.id, c.n])), [props.cards]);
  const tabs = useMemo(() => {
    const present = new Set(entries.map((e) => tabOf(e.def)));
    return TABS.filter((t) => present.has(t.id));
  }, [entries]);
  const [tab, setTab] = useState<string | 'all'>('all');
  const [leaf, setLeaf] = useState(0);
  const [dir, setDir] = useState<'next' | 'prev'>('next');
  const [hover, setHover] = useState<CardDef | null>(null);

  const shown = tab === 'all' ? entries : entries.filter((e) => tabOf(e.def) === tab);
  const pages = useMemo(() => paginate(shown, cols * rows), [shown, cols, rows]);
  const spreads = Math.max(1, Math.ceil(pages.length / spread));
  const at = Math.min(leaf, spreads - 1);
  const visible = pages.slice(at * spread, at * spread + spread);
  const turn = (by: number): void => {
    setDir(by > 0 ? 'next' : 'prev');
    setLeaf(Math.max(0, Math.min(spreads - 1, at + by)));
  };
  const total = props.cards.reduce((n, c) => n + c.n, 0);
  const tabCount = (id: string): number =>
    entries.filter((e) => tabOf(e.def) === id).reduce((n, e) => n + (counts.get(e.def.id) ?? 0), 0);

  return (
    <div className="grim grim--view">
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
                <h4 className="grim__pagehead">{p.heroes.join(' · ') || 'Cards'}</h4>
                <ul
                  className="grim__cards"
                  style={{ gridTemplateColumns: `repeat(${cols}, ${cardWidth}px)` }}
                >
                  {p.cards.map(({ def }) => {
                    const n = counts.get(def.id) ?? 1;
                    const ok = !!props.onPick && (!props.pickable || props.pickable.has(def.id));
                    return (
                      <li
                        key={def.id}
                        className={`grim__slot grim__slot--view${props.onPick && !ok ? ' is-off' : ''}`}
                      >
                        <button
                          className="grim__card"
                          disabled={!!props.onPick && !ok}
                          aria-label={props.onPick ? `Choose ${def.name}` : def.name}
                          onClick={() => ok && props.onPick?.(def.id)}
                          onMouseEnter={() => setHover(def)}
                          onMouseLeave={() => setHover(null)}
                          onFocus={() => setHover(def)}
                          onBlur={() => setHover(null)}
                        >
                          <FightCard db={COMBAT_DB} def={def} width={cardWidth} />
                          {n > 1 && <span className="grim__badge">×{n}</span>}
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
      <CardHover def={hover} />
    </div>
  );
}
