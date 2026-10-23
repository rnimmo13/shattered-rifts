// Choose a Riftwalker: a row of crests, then the chosen character's Sigil, playstyle and starter deck.
// Used by the Sanctum (campaign) and the practice duel setup.

import { CARD_DB, CHARACTERS, character, starterDeck, type CharacterId } from '@sr/content';
import { DeckStrip } from './Pickers';
import './run.css';

const REALM_NAME: Record<string, string> = {
  aurelion: 'Aurelion',
  nexus: 'Nexus-9',
  wyldmaw: 'Wyldmaw',
  umbral: 'Umbral Veil',
};

/** Short player-facing descriptions (the rules live in the card data and docs/03_CAMPAIGN.md). */
const PLAYSTYLE: Record<CharacterId, string> = {
  maren: 'Sturdy midrange: shields, Guardians, and punishing anyone who attacks you.',
  rivet: 'Go wide with little machines, then Assemble them into something big.',
  kesh: 'Fast and hungry: sacrifice your own units for value and snowball.',
  vesper: 'Traps and ambushes: bluff with held Mana and spring the surprise.',
};

export function CharacterPicker(props: {
  value: CharacterId;
  onChange: (id: CharacterId) => void;
}) {
  const c = character(props.value);
  const sigil = CARD_DB[c.sigil];
  return (
    <div className="picker">
      <div className="picker__row" role="radiogroup" aria-label="Riftwalker">
        {CHARACTERS.map((x) => (
          <button
            key={x.id}
            role="radio"
            aria-checked={props.value === x.id}
            className={`picker__char realm--${x.realm}${props.value === x.id ? ' is-on' : ''}`}
            onClick={() => props.onChange(x.id)}
          >
            <span className={`crest crest--${x.realm}`} aria-hidden>
              <b>{x.name.charAt(0)}</b>
            </span>
            <span className="picker__name">{x.name}</span>
            <span className="picker__realm">{REALM_NAME[x.realm]}</span>
          </button>
        ))}
      </div>

      <div className="picker__detail">
        <div className="picker__about">
          <h2 className="picker__title">{c.name}</h2>
          <p className="picker__style">{PLAYSTYLE[c.id]}</p>
          {sigil && (
            <p className="picker__sigil">
              <b>{sigil.name}</b>
              <span>{sigil.text.replace(/\*\*/g, '')}</span>
            </p>
          )}
          <p className="picker__deckname">
            Starter deck: <i>{c.starterName}</i> · 20 cards
          </p>
        </div>
        <DeckStrip deck={starterDeck(c.id)} />
      </div>
    </div>
  );
}
