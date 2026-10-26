// #/constructed: the Constructed deck builder (DECISIONS #242). A deck built card by card from one Riftwalker's whole pool (their
// own cards, Neutral cards, their basics and the Ancestral cards; plain versions only), within the Constructed limits, and kept in
// this browser. The Constructed Arena itself is not open yet (ARENA_MODES.constructed): decks can be built, not yet played.

import { useCallback, useMemo, useState } from 'react';
import { COMBAT_DB, RIFTWALKERS, heroesByRealm, type HeroId } from '@sr/content/v2';
import type { CardDef } from '@sr/combat';
import {
  ARENA_MODES,
  CONSTRUCTED_RULES,
  checkConstructed,
  constructedPool,
  constructedRoom,
} from '@sr/pvp';
import { DeckBuilder } from '../fight/DeckBuilder';
import { countsOf, flatten } from '../fight/deckCatalog';
import { HeroIcon } from '../ui/HeroIcon';
import { getHero, rememberHero } from '../app/heroChoice';
import {
  CONSTRUCTED_SLOTS,
  loadConstructed,
  saveConstructed,
  stillLegal,
  type ConstructedDeck,
} from './constructedDecks';
import '../play/play.css';
import '../duel/duel.css';
import './decks.css';

const newId = (): string => `c-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6)}`;

export default function ConstructedScreen() {
  const [hero, setHeroState] = useState<HeroId>(getHero);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [decks, setDecks] = useState<ConstructedDeck[]>(loadConstructed);
  const [note, setNote] = useState<string | null>(null);

  const pool = useMemo(() => new Set(constructedPool(hero)), [hero]);
  const allow = useCallback((def: CardDef) => pool.has(def.id), [pool]);
  const canAdd = useCallback(
    (c: Record<string, number>, id: string) => constructedRoom(hero, flatten(c), id),
    [hero],
  );
  const deck = flatten(counts);
  const check = checkConstructed(hero, deck);
  const r = CONSTRUCTED_RULES;

  const setHero = (h: HeroId): void => {
    setHeroState(h);
    rememberHero(h);
    setCounts({});
    setEditing(null);
    setName('');
  };

  const save = (): void => {
    if (!check.ok) return;
    const kept: ConstructedDeck = {
      id: editing ?? newId(),
      name: name.trim().slice(0, 30) || `${RIFTWALKERS[hero].hero.name.split(',')[0]} deck`,
      hero,
      deck,
      at: Date.now(),
    };
    const rest = decks.filter((d) => d.id !== kept.id);
    if (!editing && rest.length >= CONSTRUCTED_SLOTS) {
      setNote(`You can keep ${CONSTRUCTED_SLOTS} Constructed decks. Delete one first.`);
      return;
    }
    const next = [kept, ...rest];
    setDecks(next);
    setEditing(kept.id);
    setNote(saveConstructed(next) ? `Saved "${kept.name}".` : 'This browser would not keep it.');
  };

  return (
    <main className="setup setup--wide">
      <nav className="setup__nav" aria-label="Constructed">
        <a className="btn btn--small" href="#/arena">
          <span>Back to the Arena</span>
        </a>
      </nav>
      <h1 className="setup__title">Constructed decks</h1>
      <p className="setup__lead">
        Build an Arena deck card by card from one Riftwalker’s whole pool: their own cards, the
        Neutral cards, their basics and the Ancestral cards, plain versions only (no upgrades or
        Sanctum rolls). A deck holds {r.minSize} to {r.maxSize} cards, at most {r.maxCopies} of any
        card, {r.maxLegendary} Legendary and {r.maxAncestral} Ancestral.
      </p>
      <p className={ARENA_MODES.constructed ? 'pvp__hint' : 'notice'} role="note">
        {ARENA_MODES.constructed
          ? 'The Constructed Arena is open.'
          : 'The Constructed Arena is not open yet. Build and keep your decks now; they will be ready to play when it opens.'}
      </p>

      <section>
        <h2 className="setup__h">Riftwalker</h2>
        {heroesByRealm().map((g) => (
          <div key={g.realm} className="setup__realm">
            <h3 className="setup__realmName">{g.name}</h3>
            <div className="setup__chars">
              {g.heroes.map((h) => (
                <button
                  key={h}
                  className={`setup__char${hero === h ? ' is-on' : ''}`}
                  onClick={() => setHero(h)}
                >
                  <HeroIcon hero={h} size={40} />
                  <span className="setup__charName">
                    {RIFTWALKERS[h].hero.name}{' '}
                    <small className="setup__charRole">{RIFTWALKERS[h].role}</small>
                  </span>
                  <span>{RIFTWALKERS[h].buildPaths.map((l) => l.split(':')[0]).join(' · ')}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      {decks.length > 0 && (
        <section>
          <h2 className="setup__h">
            Your decks{' '}
            <small>
              ({decks.length} of {CONSTRUCTED_SLOTS})
            </small>
          </h2>
          <ul className="db__deckrows">
            {decks.map((d) => (
              <li key={d.id}>
                <span>
                  {Object.hasOwn(RIFTWALKERS, d.hero) && <HeroIcon hero={d.hero} size={22} />}{' '}
                  <b>{d.name}</b> · {d.deck.length} cards
                  {!stillLegal(d) && ' · no longer legal (the rules or cards changed)'}
                </span>
                <span className="db__ctl">
                  <button
                    className="btn btn--small"
                    onClick={() => {
                      if (Object.hasOwn(RIFTWALKERS, d.hero)) setHeroState(d.hero as HeroId);
                      setCounts(countsOf(d.deck));
                      setName(d.name);
                      setEditing(d.id);
                      setNote(null);
                    }}
                  >
                    <span>Edit</span>
                  </button>
                  <button
                    className="btn btn--small btn--ghost"
                    onClick={() => {
                      const next = decks.filter((x) => x.id !== d.id);
                      setDecks(next);
                      saveConstructed(next);
                      if (editing === d.id) setEditing(null);
                    }}
                  >
                    <span>Delete</span>
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="setup__h">Deck</h2>
        <DeckBuilder
          db={COMBAT_DB}
          counts={counts}
          onChange={(c) => {
            setCounts(c);
            setNote(null);
          }}
          onReset={() =>
            setCounts(countsOf(RIFTWALKERS[hero].starter.filter((id) => pool.has(id))))
          }
          heroName={RIFTWALKERS[hero].hero.name}
          allow={allow}
          canAdd={canAdd}
          noUpgrades
          noRandom
          deckNote={
            <div className="db__empty" role="status">
              {check.ok ? (
                <b>A legal Constructed deck.</b>
              ) : (
                <span>
                  {deck.length === 0 ? `Add ${r.minSize} to ${r.maxSize} cards.` : check.message}
                </span>
              )}
              <label className="pvp__field">
                <span>Name</span>
                <input
                  value={name}
                  maxLength={30}
                  placeholder="My deck"
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <span className="modal__row">
                <button className="btn btn--small btn--primary" disabled={!check.ok} onClick={save}>
                  <span>{editing ? 'Save changes' : 'Save deck'}</span>
                </button>
                {editing && (
                  <button
                    className="btn btn--small"
                    onClick={() => {
                      setEditing(null);
                      setNote(null);
                    }}
                  >
                    <span>Save as a new deck next</span>
                  </button>
                )}
                <button
                  className="btn btn--small"
                  disabled
                  title={
                    ARENA_MODES.constructed
                      ? 'The Constructed queue is on its way.'
                      : 'The Constructed Arena is not open yet.'
                  }
                >
                  <span>Play (coming soon)</span>
                </button>
              </span>
              {note && <span>{note}</span>}
            </div>
          }
        />
      </section>
    </main>
  );
}
