// Choose a Riftwalker: a row of crests, then the chosen character's playstyle and starter deck.
// Used by the Sanctum (campaign).

import { RIFTWALKERS, heroesByRealm, type HeroId } from '@sr/content/v2';
import { DeckStrip } from './Pickers';
import './run.css';

const REALM_NAME: Record<string, string> = {
  aurelion: 'Aurelion',
  nexus: 'Nexus-9',
  wyldmaw: 'Wyldmaw',
  umbral: 'Umbral Veil',
  starfall: 'Starfall',
  gloomfen: 'Gloomfen',
};

export function CharacterPicker(props: { value: HeroId; onChange: (id: HeroId) => void }) {
  const c = RIFTWALKERS[props.value];
  return (
    <div className="picker">
      <div className="picker__realms" role="radiogroup" aria-label="Riftwalker">
        {heroesByRealm().map((g) => (
          <section key={g.realm} className="picker__realm-group">
            <h3 className={`picker__realm-name realm--${g.realm}`}>{g.name}</h3>
            <div className="picker__row">
              {g.heroes.map((id) => {
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
                    <span className="picker__role">{x.role}</span>
                    <span className="picker__realm">{REALM_NAME[x.realm]}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="picker__detail">
        <div className="picker__about">
          <h2 className="picker__title">
            {c.hero.name} <small className="picker__titlerole">{c.role}</small>
          </h2>
          <p className="picker__style">{c.blurb}</p>
          <ul className="picker__how" aria-label="How it works">
            {c.howTo.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
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
