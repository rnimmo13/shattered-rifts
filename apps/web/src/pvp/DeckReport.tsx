// One saved deck laid out like a post-game report: who it is for, when it was saved, its Boons, and its cards by rarity, best
// first, as small cards (repeats stacked with a count). Hover a card for a large copy.

import { useState } from 'react';
import { COMBAT_DB } from '@sr/content/v2';
import type { CardDef } from '@sr/combat';
import { CardHover, type Anchor } from '../fight/CardHover';
import { FightCard } from '../fight/FightCard';
import { BoonChip } from '../fight/BoonChip';
import { HeroIcon } from '../ui/HeroIcon';
import { dateLabel, heroName, rarityCounts, reportCards, tierLabel } from './deckLayout';
import type { VaultDeck } from './vault';

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

export function DeckReport(props: { deck: VaultDeck; onRemove?: () => void }) {
  const { deck } = props;
  const cards = reportCards(deck.deck);
  const [hover, setHover] = useState<{ def: CardDef; at: Anchor } | null>(null);
  const [confirm, setConfirm] = useState(false);
  return (
    <article className="deckrep" aria-label={`${heroName(deck.hero)}, ${dateLabel(deck.bankedAt)}`}>
      <header className="deckrep__head">
        <HeroIcon hero={deck.hero} size={44} />
        <div className="deckrep__who">
          <b>{heroName(deck.hero)}</b>
          <span>
            {tierLabel(deck)} · {dateLabel(deck.bankedAt)} · {deck.deck.length} cards
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
                aria-label={`Remove the ${heroName(deck.hero)} deck from ${dateLabel(deck.bankedAt)} for good`}
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
              aria-label={`Remove the ${heroName(deck.hero)} deck from ${dateLabel(deck.bankedAt)}`}
              onClick={() => setConfirm(true)}
            >
              <span>Remove</span>
            </button>
          ))}
      </header>
      {deck.boons.length > 0 && (
        <p className="deckrep__boons">
          <span>Boons</span>
          {deck.boons.map((id) => (
            <BoonChip key={id} id={id} />
          ))}
        </p>
      )}
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
