// Choose a Riftwalker: a row of crests, then the chosen character's playstyle and starter deck.
// Used by the Sanctum (campaign).

import { useEffect, useMemo, useState } from 'react';
import { ART_READY_EVENT } from '../art/assets';
import { RIFTWALKERS, ascendanciesOf, heroesByRealm, type HeroId } from '@sr/content/v2';
import { crestPic } from '../fight/fxMoments';
import { Picture } from '../ui/Picture';
import { heroFigure } from '../fight/art';
import { wornSkin } from '@sr/pvp';
import { useCosmetics } from '../cosmetics/cosmetics';
import { HeroIcon } from '../ui/HeroIcon';
import { DeckStrip } from './Pickers';
import './run.css';

export function CharacterPicker(props: { value: HeroId; onChange: (id: HeroId) => void }) {
  const c = RIFTWALKERS[props.value];
  // the chosen Riftwalker, standing beside the tiles
  // (in the look you chose for them, DECISIONS #406)
  const skin = wornSkin(useCosmetics(), props.value);
  // (drawn again when a skin's figure arrives after the picker opened)
  const [art, setArt] = useState(0);
  useEffect(() => {
    const on = (): void => setArt((v) => v + 1);
    window.addEventListener(ART_READY_EVENT, on);
    return () => window.removeEventListener(ART_READY_EVENT, on);
  }, []);
  const figureUrl = useMemo(
    () => (art >= 0 ? heroFigure(props.value, skin).toDataURL('image/png') : ''),
    [props.value, skin, art],
  );
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
                      aria-label={x.hero.name}
                      aria-checked={props.value === id}
                      className={`picker__char realm--${x.realm}${props.value === id ? ' is-on' : ''}`}
                      onClick={() => {
                        setPick(Math.floor(Math.random() * 1000));
                        props.onChange(id);
                      }}
                    >
                      <HeroIcon hero={id} size={58} />
                      <span className="picker__name">{x.hero.name}</span>
                      {/* (the classes they can become, DECISIONS #537; their mechanics are in the detail beside) */}
                      <span className="picker__realm">
                        {ascendanciesOf(id)
                          .map((a) => a.name)
                          .join(' · ')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <figure className="picker__figure">
          <img src={figureUrl} alt={c.hero.name} />
        </figure>
      </div>

      <div className="picker__detail">
        <div className="picker__about">
          <h2 className="picker__title">
            <HeroIcon hero={props.value} size={44} />
            {c.hero.name}
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
          <ul className="picker__paths" aria-label="Mechanics">
            {c.mechanics.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <h3 className="picker__ascendTitle">Ascendancies</h3>
          <p className="picker__ascendHint">
            Beat Tier 3 and choose one: the class this run becomes.
          </p>
          {/* a tile each, side by side where there is room (Robert, 2026-11-02: boxes with subtext, as other pages have) */}
          <ul className="picker__ascend">
            {ascendanciesOf(props.value).map((a) => (
              <li key={a.id} className="picker__ascTile">
                <Picture id={crestPic(a.id)} className="picker__ascendCrest">
                  {null}
                </Picture>
                <b>{a.name}</b>
                <small>{a.leans}</small>
                <p>{a.text}</p>
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
