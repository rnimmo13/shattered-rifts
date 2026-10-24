// Choose a Riftwalker: a row of crests, then the chosen character's playstyle and starter deck.
// Used by the Sanctum (campaign).

import { useMemo, useState } from 'react';
import { RIFTWALKERS, heroesByRealm, laneSizes, type HeroId } from '@sr/content/v2';
import { heroFigure } from '../fight/art';
import { HeroIcon } from '../ui/HeroIcon';
import { DeckStrip } from './Pickers';
import './run.css';

export function CharacterPicker(props: { value: HeroId; onChange: (id: HeroId) => void }) {
  const c = RIFTWALKERS[props.value];
  // the chosen Riftwalker, standing beside the tiles
  const figureUrl = useMemo(() => heroFigure(props.value).toDataURL('image/png'), [props.value]);
  // a line of their own; picking a character draws a new one
  const [pick, setPick] = useState(() => Math.floor(Math.random() * 1000));
  const quote = c.quotes?.[pick % c.quotes.length];
  return (
    <div className="picker">
      <div className="picker__stage">
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
                      onClick={() => {
                        setPick(Math.floor(Math.random() * 1000));
                        props.onChange(id);
                      }}
                    >
                      <HeroIcon hero={id} size={58} />
                      <span className="picker__name">{x.hero.name}</span>
                      <span className="picker__role">{x.role}</span>
                      <span className="picker__realm">
                        {x.lanes.map((l) => l.split(':')[0]).join(' · ')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <figure className="picker__figure">
          <img src={figureUrl} alt={`${c.hero.name}, ${c.role}`} />
        </figure>
      </div>

      <div className="picker__detail">
        <div className="picker__about">
          <h2 className="picker__title">
            <HeroIcon hero={props.value} size={44} />
            {c.hero.name} <small className="picker__titlerole">{c.role}</small>
          </h2>
          <p className="picker__style">{c.blurb}</p>
          {quote && <p className="picker__quote">{quote}</p>}
          <p className="picker__trait">
            <b>Innate: {c.trait.name}</b> {c.trait.text}
          </p>
          <ul className="picker__how" aria-label="How it works">
            {c.howTo.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <ul className="picker__lanes" aria-label="Card builds">
            {c.lanes.map((l, i) => (
              <li key={l}>
                {l} <small>· {laneSizes(props.value)[i]} cards</small>
              </li>
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
