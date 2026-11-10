// What makes a deck one the Arena takes, said the same way everywhere it is shown: the reasons a deck is not (ArenaProblems), and
// the rules themselves (ArenaRules), on the Arena screen, the saved decks and the map's Arena notice. The numbers come from the check
// the Arena makes (@sr/pvp ARENA_RULES), so the words cannot drift from it.

import { useMemo } from 'react';
import { COMBAT_DB, isDeckCard } from '@sr/content/v2';
import { ARENA_RULES, type ArenaProblem } from '@sr/pvp';
import './arenaRules.css';

/** Every reason a deck cannot go into the Arena, one per line (nothing when there are none). */
export function ArenaProblems(props: { problems: readonly ArenaProblem[]; className?: string }) {
  const { problems } = props;
  if (problems.length === 0) return null;
  return (
    <div className={`arenaprob ${props.className ?? ''}`} role="status">
      <b className="arenaprob__head">
        {problems.length === 1
          ? 'Not valid for the Arena:'
          : `Not valid for the Arena (${problems.length} problems):`}
      </b>
      <ul className="arenaprob__list">
        {problems.map((p) => (
          <li key={p.kind + p.text}>{p.text}</li>
        ))}
      </ul>
      <a className="arenaprob__rules" href="#/arena-rules">
        What the Arena takes
      </a>
    </div>
  );
}

/** The rules a deck must meet to go into the Arena. */
export function ArenaRules(props: { className?: string }) {
  const r = ARENA_RULES;
  const junk = useMemo(
    () =>
      [
        ...new Set(
          Object.values(COMBAT_DB.cards)
            .filter(
              (c) =>
                c.unplayable &&
                !c.onDiscard &&
                isDeckCard(c.id) &&
                !c.id.endsWith('+') &&
                // (a Wound is left behind when the deck is saved, DECISIONS #515)
                c.id !== 'wound',
            )
            .map((c) => c.name),
        ),
      ].join(', '),
    [],
  );
  return (
    <section className={`arenarules ${props.className ?? ''}`} aria-labelledby="arena-rules-title">
      <h2 id="arena-rules-title" className="arenarules__title">
        What the Arena takes
      </h2>
      <p className="arenarules__lead">
        Every deck is checked before a match. A run saves its deck to your Vault as you play; the
        map&apos;s Arena button turns red, and says why, while the deck as it stands would not pass.
      </p>
      <ul className="arenarules__list">
        <li>
          <b>
            {r.minCards} to {r.maxCards} cards.
          </b>{' '}
          A starting deck of ten is too small: add cards from fights, shops and events.
        </li>
        <li>
          <b>
            Up to {r.maxCopies} copies of a card, {r.maxAuraCopies} of an Aura.
          </b>{' '}
          A card and its upgrade count as the same card. Extra copies are not refused, but they do
          not count towards the {r.minCards}.
        </li>
        <li>
          <b>Status cards come along.</b> Ones a run picked up ({junk}) stay in the deck and count
          towards the {r.minCards}, as a handicap. A Wound is the run&apos;s own and is left behind.
        </li>
        <li>
          <b>
            At most {r.maxLegendary} Legendary and {r.maxAncestral} Ancestral cards
          </b>
          , and each of them one of a kind: a deck holds one copy of it.
        </li>
        <li>
          <b>Cards only.</b> Boons, potions and Warden Hearts stay in the Campaign; an Ascendancy
          taken after Tier III comes along.
        </li>
      </ul>
    </section>
  );
}
