// One saved deck laid out like a post-game report: who it is for, when it was saved, and its cards by rarity, best
// first, as small cards (repeats stacked with a count). Hover a card for a large copy.

import { useMemo, useState } from 'react';
import { COMBAT_DB } from '@sr/content/v2';
import type { CardDef } from '@sr/combat';
import { arenaProblems } from '@sr/pvp';
import { ArenaProblems } from './ArenaRules';
import { CardHover, type Anchor } from '../fight/CardHover';
import { FightCard } from '../fight/FightCard';
import { HeroIcon } from '../ui/HeroIcon';
import { dateLabel, heroName, progressLabel, rarityCounts, reportCards } from './deckLayout';
import { entryFor, type VaultDeck } from './vault';

export const CARD_WIDTH = 112;

export function RarityTally(props: { deck: readonly string[] }) {
  const counts = rarityCounts(props.deck);
  return (
    <span className="deckrep__tally">
      {counts.map((c) => (
        <span key={c.rarity} className={`deckrep__rar deckrep__rar--${c.rarity}`}>
          {c.n} {c.rarity}
        </span>
      ))}
    </span>
  );
}

export function DeckReport(props: {
  deck: VaultDeck;
  onRemove?: () => void;
  /** its run cleared the campaign (DECISIONS #739): it is marked, and its ending can be opened again */
  completed?: boolean;
  onEnding?: () => void;
}) {
  const { deck } = props;
  const cards = reportCards(deck.deck);
  const problems = useMemo(() => arenaProblems(entryFor(deck, 'Riftwalker')), [deck]);
  const [hover, setHover] = useState<{ def: CardDef; at: Anchor } | null>(null);
  const [confirm, setConfirm] = useState(false);
  return (
    <article
      className={props.completed ? 'deckrep deckrep--complete' : 'deckrep'}
      aria-label={`${heroName(deck.hero, deck.ascendancy)}, ${dateLabel(deck.bankedAt)}${props.completed ? ', campaign complete' : ''}`}
    >
      {props.completed && (
        <p className="deckrep__crown">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden focusable="false">
            <path
              d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
          <b>Campaign complete</b>
          <span>This deck sealed the Rifts.</span>
          {props.onEnding && (
            <button type="button" className="btn btn--small" onClick={props.onEnding}>
              <span>See the ending again</span>
            </button>
          )}
        </p>
      )}
      <header className="deckrep__head">
        <HeroIcon hero={deck.hero} size={44} />
        <div className="deckrep__who">
          <b>{heroName(deck.hero, deck.ascendancy)}</b>
          <span>
            {props.completed ? 'Campaign complete' : progressLabel(deck.tier, deck.stage)} ·{' '}
            {dateLabel(deck.bankedAt)} · {deck.deck.length} cards
          </span>
        </div>
        <RarityTally deck={deck.deck} />
        {props.onRemove &&
          (confirm ? (
            <span className="deckrep__confirm">
              Remove this deck for good?{' '}
              <button
                type="button"
                className="btn btn--small"
                aria-label={`Remove the ${heroName(deck.hero, deck.ascendancy)} deck from ${dateLabel(deck.bankedAt)} for good`}
                onClick={props.onRemove}
              >
                <span>Remove</span>
              </button>
              <button
                type="button"
                className="btn btn--small"
                autoFocus
                onClick={() => setConfirm(false)}
              >
                <span>Keep</span>
              </button>
            </span>
          ) : (
            <button
              type="button"
              className="btn btn--small btn--ghost"
              aria-label={`Remove the ${heroName(deck.hero, deck.ascendancy)} deck from ${dateLabel(deck.bankedAt)}`}
              onClick={() => setConfirm(true)}
            >
              <span>Remove</span>
            </button>
          ))}
      </header>
      {/* whether the Arena takes it as it is, and if not every reason why (DECISIONS #729) */}
      {problems.length > 0 ? (
        <ArenaProblems problems={problems} className="deckrep__arena" />
      ) : (
        <p className="deckrep__ok">Ready for the Arena</p>
      )}
      {/* (no Boons: an Arena match is cards only, DECISIONS #236) */}
      <ul className="deckrep__cards">
        {cards.map(({ def, n }) => (
          <li key={def.id} className="deckrep__card">
            <button
              type="button"
              className="deckrep__cardbtn"
              aria-label={n > 1 ? `${def.name}, ${n} copies` : def.name}
              onMouseEnter={(e) => setHover({ def, at: e.currentTarget.getBoundingClientRect() })}
              onMouseLeave={() => setHover(null)}
              onFocus={(e) => setHover({ def, at: e.currentTarget.getBoundingClientRect() })}
              onBlur={() => setHover(null)}
            >
              <FightCard db={COMBAT_DB} def={def} width={CARD_WIDTH} />
              {n > 1 && <span className="deckrep__n">×{n}</span>}
            </button>
          </li>
        ))}
      </ul>
      <CardHover def={hover?.def ?? null} at={hover?.at ?? null} />
    </article>
  );
}
