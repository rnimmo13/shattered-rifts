// #/cards: every card in the game, read-only, in the grimoire. Filter by character, type, rarity or words; show the base
// cards, their upgraded versions, or both side by side. Hover any card for a big preview (with its upgrade).

import { useMemo, useState } from 'react';
import { cardText, type CardDef } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS } from '@sr/content/v2';
import { Grimoire } from './Grimoire';
import { catalog, type PoolKey } from './deckCatalog';
import '../play/play.css';

const KINDS: { id: CardDef['kind'] | 'all'; label: string }[] = [
  { id: 'all', label: 'Any type' },
  { id: 'attack', label: 'Attacks' },
  { id: 'skill', label: 'Skills' },
  { id: 'power', label: 'Auras' },
  { id: 'summon', label: 'Summons' },
  { id: 'snare', label: 'Traps' },
];
const RARITIES = ['all', 'basic', 'common', 'uncommon', 'rare', 'legendary', 'ancestral'] as const;

const POOL_LABEL = (p: PoolKey): string =>
  p === 'all'
    ? 'Every character'
    : p === 'neutral'
      ? 'Neutral'
      : p === 'wardens'
        ? 'Warden gifts'
        : p === 'tokens'
          ? 'Tokens'
          : p === 'other'
            ? 'Other'
            : (RIFTWALKERS[p as keyof typeof RIFTWALKERS]?.hero.name ?? p);

export function CardLibrary() {
  const all = useMemo(() => catalog(COMBAT_DB), []);
  const [text, setText] = useState('');
  const [pool, setPool] = useState<PoolKey>('all');
  const [kind, setKind] = useState<CardDef['kind'] | 'all'>('all');
  const [rarity, setRarity] = useState<(typeof RARITIES)[number]>('all');
  const [show, setShow] = useState<'base' | 'upgraded' | 'both'>('base');

  const cards = useMemo(() => {
    const q = text.trim().toLowerCase();
    return all
      .filter((c) => {
        if (show === 'base' && c.upgraded) return false;
        if (show === 'upgraded' && !c.upgraded) return false;
        if (pool !== 'all' && c.pool !== pool) return false;
        if (kind !== 'all' && c.def.kind !== kind) return false;
        if (rarity !== 'all' && (c.def.rarity ?? 'common') !== rarity) return false;
        if (q && !`${c.def.name} ${cardText(COMBAT_DB, c.def)}`.toLowerCase().includes(q))
          return false;
        return true;
      })
      .map((c) => ({ def: c.def, n: 1 }));
  }, [all, text, pool, kind, rarity, show]);

  const pools: PoolKey[] = [
    'all',
    ...Object.keys(RIFTWALKERS),
    'neutral',
    'wardens',
    'tokens',
    'other',
  ];
  // a new filter starts the book from its first page again
  const bookKey = `${text}|${pool}|${kind}|${rarity}|${show}`;

  return (
    <main className="setup setup--wide">
      <a className="btn btn--small setup__back" href="#/">
        <span>Back</span>
      </a>
      <header className="setup__head">
        <h1 className="setup__title">Card library</h1>
        <p className="setup__lead">
          Every card in the game. {cards.length} card{cards.length === 1 ? '' : 's'} shown. Hover a
          card for a big preview; pages are grouped by realm, then character, then rarity.
        </p>
      </header>
      <div className="grim__filters lib__filters">
        <label className="grim__search">
          <span>Search names and rules text</span>
          <input
            type="search"
            placeholder="for example: Barrier, Trap, draw"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <label>
          <span>Character</span>
          <select value={pool} onChange={(e) => setPool(e.target.value)}>
            {pools.map((p) => (
              <option key={p} value={p}>
                {POOL_LABEL(p)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Type</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Rarity</span>
          <select value={rarity} onChange={(e) => setRarity(e.target.value as typeof rarity)}>
            {RARITIES.map((r) => (
              <option key={r} value={r}>
                {r === 'all' ? 'Any' : r}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Show</span>
          <select value={show} onChange={(e) => setShow(e.target.value as typeof show)}>
            <option value="base">Base cards</option>
            <option value="upgraded">Upgraded (+)</option>
            <option value="both">Both</option>
          </select>
        </label>
      </div>
      <Grimoire key={bookKey} cards={cards} emptyText="No cards match those filters." />
    </main>
  );
}
