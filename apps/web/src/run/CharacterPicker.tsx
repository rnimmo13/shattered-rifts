// Choose a Riftwalker: a row of crests, then the chosen character's playstyle and starter deck.
// Used by the Sanctum (campaign).

import { RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { DeckStrip } from './Pickers';
import './run.css';

const REALM_NAME: Record<string, string> = {
  aurelion: 'Aurelion',
  nexus: 'Nexus-9',
  wyldmaw: 'Wyldmaw',
  umbral: 'Umbral Veil',
  starfall: 'Starfall',
};

const HEROES = Object.keys(RIFTWALKERS) as HeroId[];

export function CharacterPicker(props: { value: HeroId; onChange: (id: HeroId) => void }) {
  const c = RIFTWALKERS[props.value];
  return (
    <div className="picker">
      <div className="picker__row" role="radiogroup" aria-label="Riftwalker">
        {HEROES.map((id) => {
          const x = RIFTWALKERS[id];
          return (
            <button
              key={id}
              role="radio"
              aria-checked={props.value === id}
              className={`picker__char realm--${x.realm}${props.value === id ? ' is-on' : ''}`}
              onClick={() => props.onChange(id)}
            >
              <span className={`crest crest--${x.realm}`} aria-hidden>
                <b>{x.hero.name.charAt(0)}</b>
              </span>
              <span className="picker__name">{x.hero.name}</span>
              <span className="picker__realm">{REALM_NAME[x.realm]}</span>
            </button>
          );
        })}
      </div>

      <div className="picker__detail">
        <div className="picker__about">
          <h2 className="picker__title">{c.hero.name}</h2>
          <p className="picker__style">{c.blurb}</p>
          <ul className="picker__lanes" aria-label="Card lanes">
            {c.lanes.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <p className="picker__deckname">
            {c.hero.maxHp} HP · {c.hero.mana} Mana · starter deck of {c.starter.length} cards
            {c.hero.startUnits?.length ? ' · starts with a companion' : ''}
          </p>
        </div>
        <DeckStrip deck={c.starter} />
      </div>
    </div>
  );
}
