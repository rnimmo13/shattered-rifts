// The practice fight's deck builder: every card in the game, filterable, with any number of copies; plus the deck you have so far.

import { useMemo, useState } from 'react';
import { cardText, type CombatDb } from '@sr/combat';
import { RIFTWALKERS } from '@sr/content/v2';
import {
  catalog,
  filterCatalog,
  poolOf,
  randomDeck,
  type CatalogFilter,
  type PoolKey,
} from './deckCatalog';

type Counts = Record<string, number>;

const POOL_LABEL = (p: PoolKey): string =>
  p === 'all'
    ? 'Every card'
    : p === 'neutral'
      ? 'Neutral'
      : p === 'wardens'
        ? 'Warden gifts'
        : p === 'tokens'
          ? 'Tokens'
          : p === 'other'
            ? 'Other'
            : (RIFTWALKERS[p as keyof typeof RIFTWALKERS]?.hero.name ?? p);

const SHOW_LIMIT = 250;

export function DeckBuilder(props: {
  db: CombatDb;
  counts: Counts;
  onChange: (next: Counts) => void;
  onReset: () => void;
  heroName: string;
}) {
  const { db, counts } = props;
  const all = useMemo(() => catalog(db), [db]);
  const [filter, setFilter] = useState<CatalogFilter>({
    pool: 'all',
    rarity: 'all',
    text: '',
    upgraded: false,
  });
  const shown = useMemo(
    () => filterCatalog(all, filter, (c) => cardText(db, c)),
    [all, filter, db],
  );
  const total = Object.values(counts).reduce((n, x) => n + x, 0);

  const add = (id: string, by: number): void => {
    const n = Math.max(0, (counts[id] ?? 0) + by);
    const next = { ...counts };
    if (n === 0) delete next[id];
    else next[id] = n;
    props.onChange(next);
  };
  const addShown = (): void => {
    const next = { ...counts };
    for (const c of shown.slice(0, SHOW_LIMIT)) next[c.def.id] = (next[c.def.id] ?? 0) + 1;
    props.onChange(next);
  };
  const inDeck = Object.keys(counts)
    .map((id) => db.cards[id])
    .filter((c): c is NonNullable<typeof c> => !!c)
    .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));

  const pools: PoolKey[] = [
    'all',
    ...(Object.keys(RIFTWALKERS)),
    'neutral',
    'wardens',
    'tokens',
    'other',
  ];

  return (
    <div className="db">
      <div className="db__list">
        <div className="db__filters">
          <label>
            <span>Cards from</span>
            <select
              value={filter.pool}
              onChange={(e) => setFilter({ ...filter, pool: e.target.value })}
            >
              {pools.map((p) => (
                <option key={p} value={p}>
                  {POOL_LABEL(p)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Rarity</span>
            <select
              value={filter.rarity}
              onChange={(e) =>
                setFilter({ ...filter, rarity: e.target.value as CatalogFilter['rarity'] })
              }
            >
              {['all', 'basic', 'common', 'uncommon', 'rare'].map((r) => (
                <option key={r} value={r}>
                  {r === 'all' ? 'Any' : r}
                </option>
              ))}
            </select>
          </label>
          <label className="db__search">
            <span>Search</span>
            <input
              type="search"
              placeholder="name or rules text"
              value={filter.text}
              onChange={(e) => setFilter({ ...filter, text: e.target.value })}
            />
          </label>
          <label className="db__check">
            <input
              type="checkbox"
              checked={filter.upgraded}
              onChange={(e) => setFilter({ ...filter, upgraded: e.target.checked })}
            />
            <span>Upgraded (+)</span>
          </label>
          <button className="btn btn--small" onClick={addShown}>
            <span>Add all shown ×1</span>
          </button>
        </div>
        <p className="db__count">
          {shown.length} card{shown.length === 1 ? '' : 's'}
          {shown.length > SHOW_LIMIT ? ` (showing the first ${SHOW_LIMIT}: narrow the filter)` : ''}
        </p>
        <ul className="db__rows">
          {shown.slice(0, SHOW_LIMIT).map(({ def }) => {
            const n = counts[def.id] ?? 0;
            return (
              <li key={def.id} className={`db__row${n > 0 ? ' is-in' : ''}`}>
                <span className="db__cost" title="Mana cost">
                  {def.x ? 'X' : def.cost}
                  {def.starCost ? <small>★{def.starCost}</small> : null}
                </span>
                <span className="db__name">
                  {def.name}
                  <small>
                    {def.kind === 'power' ? 'aura' : def.kind} · {def.rarity ?? 'common'} ·{' '}
                    {POOL_LABEL(poolOf(def))}
                  </small>
                </span>
                <span className="db__text">{cardText(db, def)}</span>
                <span className="db__ctl">
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
      </div>

      <aside className="db__deck" aria-label="Your deck">
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
              const deck = randomDeck(db, 20, `${Date.now()}-${Math.random()}`);
              const next: Counts = {};
              for (const id of deck) next[id] = (next[id] ?? 0) + 1;
              props.onChange(next);
            }}
          >
            <span>Random 20</span>
          </button>
        </div>
        {total === 0 && (
          <p className="db__empty">Add cards from the list. A deck needs at least one.</p>
        )}
        <ul className="db__deckrows">
          {inDeck.map((def) => (
            <li key={def.id}>
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
    </div>
  );
}

