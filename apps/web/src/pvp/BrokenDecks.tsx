// Saved decks an update left unplayable (DECISIONS #754): a card or Riftwalker they need is no longer in the game, or a deck rule
// changed under them. Each is shown with why, until the player acknowledges it; from then on it is inactive, listed small at the
// foot of the page. Nothing is removed unless the player removes it.

import { useState } from 'react';
import { RIFTWALKERS } from '@sr/content/v2';
import type { BrokenDeck, DeckFault } from '@sr/pvp';
import { dateLabel, heroName } from './deckLayout';

const FAULT_TEXT: Record<DeckFault, string> = {
  hero: 'Its Riftwalker is no longer in the game.',
  card: 'It holds a card that is no longer in the game.',
  size: 'It no longer has a legal number of cards.',
  rules: 'A deck rule changed, and it no longer follows it.',
  unreadable: 'Its cards could not be read.',
};

/** Why the deck no longer plays, in plain words. */
const faultText = (fault: DeckFault): string => FAULT_TEXT[fault];

/** Whose deck it was: its class, or a plain word for a Riftwalker the game no longer has. */
const brokenName = (d: Pick<BrokenDeck, 'hero'>): string =>
  d.hero && Object.hasOwn(RIFTWALKERS, d.hero) ? heroName(d.hero) : 'Unknown Riftwalker';

/** "Tier 4 · Nov 3, 2026 · 31 cards" */
const brokenLine = (d: BrokenDeck): string =>
  [`Tier ${d.tier}`, dateLabel(d.bankedAt), d.cards > 0 ? `${d.cards} cards` : '']
    .filter(Boolean)
    .join(' · ');

function RemoveButton(props: { deck: BrokenDeck; onRemove: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const what = `the ${brokenName(props.deck)} deck from ${dateLabel(props.deck.bankedAt)}`;
  return confirm ? (
    <span className="deckrep__confirm">
      Remove this deck for good?{' '}
      <button
        type="button"
        className="btn btn--small"
        aria-label={`Remove ${what} for good`}
        onClick={props.onRemove}
      >
        <span>Remove</span>
      </button>
      <button type="button" className="btn btn--small" autoFocus onClick={() => setConfirm(false)}>
        <span>Keep</span>
      </button>
    </span>
  ) : (
    <button
      type="button"
      className="btn btn--small btn--ghost"
      aria-label={`Remove ${what}`}
      onClick={() => setConfirm(true)}
    >
      <span>Remove</span>
    </button>
  );
}

/** The decks the player has not been told of yet: one notice each, at the top of the page. */
export function BrokenNotices(props: {
  decks: readonly BrokenDeck[];
  onAcknowledge: (d: BrokenDeck) => void;
  onRemove: (d: BrokenDeck) => void;
}) {
  const fresh = props.decks.filter((d) => !d.inactive);
  if (fresh.length === 0) return null;
  return (
    <section className="decks__broken" aria-label="Decks an update left unplayable">
      {fresh.map((d) => (
        <article key={d.id} className="deckbroken">
          <b className="deckbroken__head">An update left this deck unplayable</b>
          <p className="deckbroken__who">
            <b>{brokenName(d)}</b> <span>{brokenLine(d)}</span>
          </p>
          <p className="deckbroken__why">
            {faultText(d.fault)} It cannot enter the Arena. It stays saved and takes none of your
            deck slots, and it comes back by itself if a later update makes it playable again.
          </p>
          <p className="deckbroken__acts">
            <button
              type="button"
              className="btn btn--small btn--primary"
              aria-label={`Got it: set the ${brokenName(d)} deck from ${dateLabel(d.bankedAt)} to inactive`}
              onClick={() => props.onAcknowledge(d)}
            >
              <span>Got it</span>
            </button>
            <RemoveButton deck={d} onRemove={() => props.onRemove(d)} />
          </p>
        </article>
      ))}
    </section>
  );
}

/** The decks the player has acknowledged: a folded list at the foot of the page. */
export function InactiveDecks(props: {
  decks: readonly BrokenDeck[];
  onRemove: (d: BrokenDeck) => void;
}) {
  const inactive = props.decks.filter((d) => d.inactive);
  if (inactive.length === 0) return null;
  return (
    <details className="decks__inactive">
      <summary>
        Inactive decks ({inactive.length}): unplayable since an update, and taking no deck slot
      </summary>
      <ul className="decks__inactivelist">
        {inactive.map((d) => (
          <li key={d.id} className="deckinactive">
            <span className="deckinactive__who">
              <b>{brokenName(d)}</b> <span>{brokenLine(d)}</span>
            </span>
            <span className="deckinactive__why">{faultText(d.fault)}</span>
            <RemoveButton deck={d} onRemove={() => props.onRemove(d)} />
          </li>
        ))}
      </ul>
    </details>
  );
}
