// #/cosmetics: choose the look each of your Riftwalkers wears (DECISIONS #406). Every Riftwalker has its own look, plus the skins you
// own for it; the one you pick is drawn as your hero on the home screen, in the character picker and in your fights (never on an
// opponent's). Skins are got in the Store (free for now). Presentation only: nothing here changes how a hero plays.

import { useEffect, useMemo, useState } from 'react';
import { RIFTWALKERS, SKINS, type HeroId } from '@sr/content/v2';
import { wornSkin } from '@sr/pvp';
import { preloadArt, realSkins } from '../art/assets';
import { skinName } from '../art/skins';
import { useCosmetics, wear } from '../cosmetics/cosmetics';
import { heroFigure } from '../fight/art';
import { StoreIcon } from './StoreIcon';
import './store.css';

/** The hero's own look, as an image (the figure is a canvas). */
const ownLook = (hero: HeroId): string => heroFigure(hero).toDataURL('image/png');

const HEROES = Object.keys(RIFTWALKERS) as HeroId[];

export function CosmeticsScreen() {
  const mine = useCosmetics();
  const [art, setArt] = useState<Map<string, string>>(
    () => new Map(realSkins().map((s) => [s.id, s.url])),
  );
  useEffect(() => {
    let live = true;
    void preloadArt().then(() => {
      if (live) setArt(new Map(realSkins().map((s) => [s.id, s.url])));
    });
    return () => {
      live = false;
    };
  }, []);
  // (each Riftwalker's own look is drawn once, not on every Wear)
  const own = useMemo(() => new Map(HEROES.map((h) => [h, ownLook(h)])), []);
  return (
    <main className="store">
      <a className="btn btn--small store__back" href="#/">
        <span>Back</span>
      </a>
      <header className="store__head">
        <StoreIcon size={56} className="store__mark" />
        <div>
          <h1 className="store__title">Cosmetics</h1>
          <p className="store__lead">
            Choose how each of your Riftwalkers looks. Your choice is your hero on the home screen
            and in every fight, on this device and any other you sign in on. It never changes how a
            hero plays.
          </p>
          <a className="btn btn--small" href="#/store">
            <span>Get more looks in the Store</span>
          </a>
        </div>
      </header>
      {HEROES.map((hero) => {
        const owned = SKINS.filter(
          (s) => s.hero === hero && mine.owned.includes(s.id) && art.has(s.id),
        );
        const worn = wornSkin(mine, hero) ?? null;
        const name = RIFTWALKERS[hero].hero.name;
        const looks: { id: string | null; label: string; src: string }[] = [
          { id: null, label: `The ${name}'s own look`, src: own.get(hero) ?? '' },
          ...owned.map((s) => ({ id: s.id, label: skinName(s), src: art.get(s.id) ?? '' })),
        ];
        return (
          <section key={hero} className="store__looks" aria-labelledby={`looks-${hero}`}>
            <h2 id={`looks-${hero}`} className="store__section">
              {name}
            </h2>
            <ul className="store__skins" role="radiogroup" aria-label={`The ${name}'s look`}>
              {looks.map((l) => {
                const on = l.id === worn;
                return (
                  <li key={l.id ?? 'own'} className={`store__skin${on ? ' is-worn' : ''}`}>
                    <div className="store__figure">
                      <img src={l.src} alt="" loading="lazy" />
                    </div>
                    <b>{l.id === null ? 'Own look' : l.label}</b>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={l.label}
                      className={`btn btn--small store__wear${on ? ' is-on' : ''}`}
                      onClick={() => wear(hero, l.id)}
                    >
                      <span>{on ? 'Wearing' : 'Wear'}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {owned.length === 0 && (
              <p className="store__note">
                No other looks yet. <a href="#/store">The Store</a> has{' '}
                {SKINS.filter((s) => s.hero === hero).length} for the {name}.
              </p>
            )}
          </section>
        );
      })}
    </main>
  );
}
