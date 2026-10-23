// The practice fight's deck builder, drawn as an open grimoire: every card in the game on parchment pages, one ribbon bookmark per
// realm, click a card to add a copy, − / + under it to take one away; chosen cards glow. Logic lives in deckCatalog.ts.

import { useMemo, useState } from 'react';
import { cardText, type CardDef, type CombatDb } from '@sr/combat';
import { CardHover } from './CardHover';
import { FightCard } from './FightCard';
import { useBookLayout } from './grimoireData';
import {
  TABS,
  catalog,
  filterCatalog,
  paginate,
  randomDeck,
  sortCards,
  tabCards,
  type CatalogFilter,
} from './deckCatalog';

type Counts = Record<string, number>;

const RARITIES = ['all', 'basic', 'common', 'uncommon', 'rare', 'legendary'] as const;

export function DeckBuilder(props: {
  db: CombatDb;
  counts: Counts;
  onChange: (next: Counts) => void;
  onReset: () => void;
  heroName: string;
}) {
  const { db, counts } = props;
  const { spread, cols, cardWidth } = useBookLayout(340, 99999);
  const all = useMemo(() => catalog(db), [db]);
  const [tab, setTab] = useState<string>(TABS[0]?.id ?? 'aurelion');
  const [leaf, setLeaf] = useState(0); // which spread is open
  const [dir, setDir] = useState<'next' | 'prev'>('next');
  const [hover, setHover] = useState<CardDef | null>(null);
  const [filter, setFilter] = useState<Omit<CatalogFilter, 'pool'>>({
    rarity: 'all',
    text: '',
    upgraded: false,
  });

  const searching = filter.text.trim() !== '';
  const pages = useMemo(() => {
    const shown = filterCatalog(all, { ...filter, pool: 'all' }, (c) => cardText(db, c));
    // a search reads through the whole book; otherwise only the open bookmark
    return paginate(searching ? sortCards(shown) : tabCards(shown, tab), cols * 2);
  }, [all, filter, db, tab, searching, cols]);
  const spreads = Math.max(1, Math.ceil(pages.length / spread));
  const at = Math.min(leaf, spreads - 1);
  const visible = pages.slice(at * spread, at * spread + spread);
  const tabTotals = useMemo(() => {
    const out: Record<string, number> = {};
    for (const t of TABS)
      out[t.id] = tabCards(all, t.id).reduce((n, c) => n + (counts[c.def.id] ?? 0), 0);
    return out;
  }, [all, counts]);

  const total = Object.values(counts).reduce((n, x) => n + x, 0);
  const add = (id: string, by: number): void => {
    const n = Math.max(0, (counts[id] ?? 0) + by);
    const next = { ...counts };
    if (n === 0) delete next[id];
    else next[id] = n;
    props.onChange(next);
  };
  const turn = (by: number): void => {
    setDir(by > 0 ? 'next' : 'prev');
    setHover(null);
    setLeaf(Math.max(0, Math.min(spreads - 1, at + by)));
  };
  const open = (id: string): void => {
    setDir(
      TABS.findIndex((t) => t.id === id) >= TABS.findIndex((t) => t.id === tab) ? 'next' : 'prev',
    );
    setTab(id);
    setHover(null);
    setLeaf(0);
  };
  const refilter = (next: Omit<CatalogFilter, 'pool'>): void => {
    setFilter(next);
    setHover(null);
    setLeaf(0);
  };
  const inDeck = Object.keys(counts)
    .map((id) => db.cards[id])
    .filter((c): c is NonNullable<typeof c> => !!c)
    .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
  const tabName = TABS.find((t) => t.id === tab)?.name ?? '';

  return (
    <div className="grim">
      <div className="grim__main">
        <div className="grim__filters">
          <label className="grim__search">
            <span>Search the whole book</span>
            <input
              type="search"
              placeholder="name or rules text"
              value={filter.text}
              onChange={(e) => refilter({ ...filter, text: e.target.value })}
            />
          </label>
          <label>
            <span>Rarity</span>
            <select
              value={filter.rarity}
              onChange={(e) =>
                refilter({ ...filter, rarity: e.target.value as CatalogFilter['rarity'] })
              }
            >
              {RARITIES.map((r) => (
                <option key={r} value={r}>
                  {r === 'all' ? 'Any' : r}
                </option>
              ))}
            </select>
          </label>
          <label className="grim__check">
            <input
              type="checkbox"
              checked={filter.upgraded}
              onChange={(e) => refilter({ ...filter, upgraded: e.target.checked })}
            />
            <span>Upgraded (+)</span>
          </label>
        </div>

        <div className="grim__tabs" role="tablist" aria-label="Realms">
          {TABS.map((t) => {
            const on = !searching && t.id === tab;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                className={`grim__ribbon grim__ribbon--${t.id}${on ? ' is-open' : ''}`}
                onClick={() => open(t.id)}
              >
                <span>{t.name}</span>
                {tabTotals[t.id] ? <b>{tabTotals[t.id]}</b> : null}
              </button>
            );
          })}
        </div>

        <div className={`grim__book grim__book--${spread}`}>
          <button
            className="grim__flip"
            disabled={at === 0}
            onClick={() => turn(-1)}
            aria-label="Previous pages"
          >
            ‹
          </button>
          <div
            key={`${tab}-${at}-${searching}-${filter.rarity}-${filter.upgraded}`}
            className={`grim__spread grim__spread--${dir}`}
          >
            {visible.length === 0 && (
              <section className="grim__page">
                <p className="grim__empty">No cards match.</p>
              </section>
            )}
            {visible.map((p, i) => (
              <section key={i} className="grim__page">
                <h4 className="grim__pagehead">
                  {searching ? 'Search results' : p.heroes.join(' · ') || tabName}
                </h4>
                <ul
                  className="grim__cards"
                  style={{ gridTemplateColumns: `repeat(${cols}, ${cardWidth}px)` }}
                >
                  {p.cards.map(({ def }) => {
                    const n = counts[def.id] ?? 0;
                    return (
                      <li key={def.id} className={`grim__slot${n > 0 ? ' is-in' : ''}`}>
                        <button
                          className="grim__card"
                          aria-label={`Add ${def.name}`}
                          onClick={() => add(def.id, 1)}
                          onMouseEnter={() => setHover(def)}
                          onMouseLeave={() => setHover(null)}
                          onFocus={() => setHover(def)}
                          onBlur={() => setHover(null)}
                        >
                          <FightCard db={db} def={def} width={cardWidth} />
                          {n > 0 && <span className="grim__badge">×{n}</span>}
                        </button>
                        <span className="grim__ctl">
                          <button
                            aria-label={`Remove one ${def.name}`}
                            disabled={n === 0}
                            onClick={() => add(def.id, -1)}
                          >
                            −
                          </button>
                          <b>{n}</b>
                          <button aria-label={`Add one ${def.name}`} onClick={() => add(def.id, 1)}>
                            +
                          </button>
                        </span>
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

      <aside className="grim__deck" aria-label="Your deck">
        <h3>
          Your deck <small>({total} cards)</small>
        </h3>
        <div className="db__deckbtns">
          <button className="btn btn--small" onClick={props.onReset}>
            <span>{props.heroName}’s starter</span>
          </button>
          <button className="btn btn--small" onClick={() => props.onChange({})}>
            <span>Clear</span>
          </button>
          <button
            className="btn btn--small"
            onClick={() => {
              const next: Counts = {};
              for (const id of randomDeck(db, 20, `${Date.now()}-${Math.random()}`))
                next[id] = (next[id] ?? 0) + 1;
              props.onChange(next);
            }}
          >
            <span>Random 20</span>
          </button>
        </div>
        {total === 0 && (
          <p className="db__empty">
            Click cards in the book to add them. A deck needs at least one.
          </p>
        )}
        <ul className="db__deckrows">
          {inDeck.map((def) => (
            <li key={def.id} onMouseEnter={() => setHover(def)} onMouseLeave={() => setHover(null)}>
              <span>
                {def.x ? 'X' : def.cost} {def.name}
              </span>
              <span className="db__ctl">
                <button aria-label={`Remove one ${def.name}`} onClick={() => add(def.id, -1)}>
                  −
                </button>
                <b>{counts[def.id]}</b>
                <button aria-label={`Add one ${def.name}`} onClick={() => add(def.id, 1)}>
                  +
                </button>
              </span>
            </li>
          ))}
        </ul>
      </aside>
      <CardHover def={hover} />
    </div>
  );
}
