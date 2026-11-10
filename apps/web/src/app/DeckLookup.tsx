// (DECISIONS #723) The deck lookup, #/deck-lookup: search a player by username and see their saved decks, or scan every name on the
// leaderboards. The decks are public (Robert, 2026-11-09); the page is unlisted: nothing in the game links to it.
import { useEffect, useRef, useState } from 'react';
import { COMBAT_DB, classNameOf } from '@sr/content/v2';
import { lookupDecks, viewBoard, type PlayerDeck, type PlayerDecks } from '../pvp/boardApi';

const cardName = (id: string): string => COMBAT_DB.cards[id]?.name ?? id;

/** "Strike x3" lines, by name. */
function tally(cards: readonly string[]): { id: string; name: string; n: number }[] {
  const by = new Map<string, number>();
  for (const c of cards) by.set(c, (by.get(c) ?? 0) + 1);
  return [...by.entries()]
    .map(([id, n]) => ({ id, name: cardName(id), n }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function Deck({ d }: { d: PlayerDeck }) {
  return (
    <div className="lookup__deck">
      <h3>
        {classNameOf(d.hero, d.ascendancy)} · Tier {d.tier}
        {d.stage !== null ? `, floor ${d.stage}` : ''}
        {d.maxHp !== null ? ` · ${d.maxHp} max HP` : ''}
      </h3>
      <p className="lookup__meta">
        {d.cards.length} cards · Arena {d.wins}-{d.losses} · as a ghost {d.ghostWins}-
        {d.ghostLosses} · saved {new Date(d.savedAt).toLocaleDateString()}
      </p>
      <ul className="lookup__cards">
        {tally(d.cards).map((c) => (
          <li key={c.id}>
            {c.name}
            {c.n > 1 ? ` ×${c.n}` : ''}
          </li>
        ))}
      </ul>
      {d.boons.length > 0 && <p className="lookup__meta">Boons: {d.boons.join(', ')}</p>}
    </div>
  );
}

function Player({ p }: { p: PlayerDecks }) {
  return (
    <section className="lookup__player">
      <h2>{p.name}</h2>
      {!p.found && <p className="learn__note">No player by that name.</p>}
      {p.found && p.decks.length === 0 && (
        <p className="learn__note">
          No saved decks (a deck is kept once its run has cleared Tier 3).
        </p>
      )}
      {p.decks.map((d, i) => (
        <Deck key={i} d={d} />
      ))}
    </section>
  );
}

export function DeckLookup() {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState('');
  const [found, setFound] = useState<PlayerDecks[]>([]);
  const [error, setError] = useState('');
  // (leaving the page stops a scan part way)
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
    },
    [],
  );

  const search = async (): Promise<void> => {
    if (!name.trim()) return;
    setBusy('Looking…');
    setError('');
    const p = await lookupDecks(name);
    setBusy('');
    if (!p) setError('The server could not be reached.');
    else setFound([p]);
  };

  // every name on this week's and this month's Campaign and Arena boards, one lookup each
  const scan = async (): Promise<void> => {
    setError('');
    setBusy('Reading the leaderboards…');
    const boards = await Promise.all([
      viewBoard('runs', 'week'),
      viewBoard('runs', 'month'),
      viewBoard('pvp', 'week'),
      viewBoard('pvp', 'month'),
    ]);
    const names = [...new Set(boards.flatMap((b) => b?.board.map((r) => r.name) ?? []))].slice(
      0,
      60,
    );
    const out: PlayerDecks[] = [];
    for (const [i, n] of names.entries()) {
      if (!alive.current) return;
      setBusy(`Looking up ${n} (${i + 1} of ${names.length})…`);
      const p = await lookupDecks(n);
      if (p && p.decks.length) out.push(p);
    }
    setBusy('');
    setFound(out);
    if (!names.length)
      setError('No names on the leaderboards (or the server could not be reached).');
    else if (!out.length)
      setError(`None of the ${names.length} players on the boards has a saved deck.`);
  };

  return (
    <main className="learn lookup">
      <a className="btn btn--small" href="#/">
        <span>Back</span>
      </a>
      <h1 className="learn__title">Deck lookup</h1>
      <form
        className="lookup__search"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player name"
          aria-label="Player name"
          maxLength={40}
        />
        <button className="btn btn--small" type="submit" disabled={!!busy}>
          <span>Search</span>
        </button>
        <button
          className="btn btn--small"
          type="button"
          disabled={!!busy}
          onClick={() => void scan()}
        >
          <span>Scan the leaderboards</span>
        </button>
      </form>
      {busy && <p className="learn__note">{busy}</p>}
      {error && <p className="learn__note">{error}</p>}
      {found.map((p, i) => (
        <Player key={`${i}-${p.name}`} p={p} />
      ))}
    </main>
  );
}
