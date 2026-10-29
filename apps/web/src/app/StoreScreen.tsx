// #/store: the Store. It sells cosmetics only (never power: the game's pillars rule out pay-to-win). Riftwalker looks (skins, DECISIONS
// #402, #406) are on sale, free for now: each one's figure, named, grouped by class, with Get (it goes on your account) and Wear (it
// becomes your hero's look, chosen again on #/cosmetics). The other shelves are locked tiles with the Store's mark, coming soon.

import { useEffect, useState } from 'react';
import { RIFTWALKERS, skinDef } from '@sr/content/v2';
import { wornSkin } from '@sr/pvp';
import { getSkin, useCosmetics, wear } from '../cosmetics/cosmetics';
import { preloadArt, realSkins, type Skin } from '../art/assets';
import { skinClass as className, skinName } from '../art/skins';
import { StoreIcon } from './StoreIcon';
import './store.css';

const SHELVES: { name: string; text: string }[] = [
  { name: 'Card backs', text: 'New designs for the back of every card you draw.' },
  { name: 'Riftwalker looks', text: 'Other outfits and colours for your Riftwalkers.' },
  { name: 'Battlefields', text: 'Arenas to fight on, from drowned halls to burning skies.' },
  { name: 'Card frames', text: 'Foil and gilded frames for the cards you love most.' },
  { name: 'Titles and banners', text: 'Show them on your Arena player card.' },
  { name: 'Emotes', text: 'Something to say to your opponent in the Arena.' },
];

export function StoreScreen() {
  const mine = useCosmetics();
  const [skins, setSkins] = useState<Skin[]>(() => realSkins());
  useEffect(() => {
    let live = true;
    void preloadArt().then(() => {
      if (live) setSkins(realSkins());
    });
    return () => {
      live = false;
    };
  }, []);
  // in the order the classes are shown everywhere else
  const order = Object.keys(RIFTWALKERS);
  // (a skin for a class the game does not have sorts last)
  const rank = (hero: string): number => {
    const i = order.indexOf(hero);
    return i < 0 ? order.length : i;
  };
  // (only what the Store sells: a figure with no catalog entry is not for sale)
  const looks = [...skins]
    .filter((s) => skinDef(s.id))
    .sort((a, b) => rank(a.hero) - rank(b.hero) || a.id.localeCompare(b.id));
  return (
    <main className="store">
      <a className="btn btn--small store__back" href="#/">
        <span>Back</span>
      </a>
      <header className="store__head">
        <StoreIcon size={56} className="store__mark" />
        <div>
          <h1 className="store__title">Store</h1>
          <p className="store__lead">
            Cosmetics only: ways to make the game look like yours. Nothing in it will ever make a
            deck stronger. Riftwalker looks are free for now.
          </p>
          <a className="btn btn--small" href="#/cosmetics">
            <span>Choose your looks</span>
          </a>
        </div>
      </header>
      {looks.length > 0 && (
        <section className="store__looks" aria-labelledby="store-looks">
          <h2 id="store-looks" className="store__section">
            Riftwalker looks
          </h2>
          <p className="store__note">
            Other outfits for your Riftwalkers. They change how a hero looks, never how it plays.
          </p>
          <ul className="store__skins">
            {looks.map((s) => (
              <li key={s.id} className={`store__skin store__skin--${s.hero}`}>
                <div className="store__figure">
                  <img
                    src={s.url}
                    alt={`${skinName(s)}: a look for the ${className(s.hero)}`}
                    loading="lazy"
                  />
                </div>
                <b>{skinName(s)}</b>
                <span>{className(s.hero)}</span>
                {!mine.owned.includes(s.id) ? (
                  <button
                    type="button"
                    className="btn btn--small store__get"
                    onClick={() => getSkin(s.id)}
                  >
                    <span>Get (free)</span>
                  </button>
                ) : wornSkin(mine, s.hero) === s.id ? (
                  <button type="button" className="btn btn--small store__wear is-on" disabled>
                    <span>Wearing</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn--small store__wear"
                    onClick={() => wear(s.hero, s.id)}
                  >
                    <span>Wear</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      <ul className="store__shelves">
        {SHELVES.filter((s) => !(looks.length > 0 && s.name === 'Riftwalker looks')).map((s) => (
          <li key={s.name} className="store__shelf">
            <StoreIcon size={34} />
            <b>{s.name}</b>
            <span>{s.text}</span>
            <i className="store__soon">Coming soon</i>
          </li>
        ))}
      </ul>
    </main>
  );
}
