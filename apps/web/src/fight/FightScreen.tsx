// #/fight: pick a Riftwalker and an encounter, then fight it on the new Combat v2 stage.

import { useState } from 'react';
import { HeroShowcase } from '../app/HeroShowcase';
import { COMBAT_DB, ENCOUNTERS, RIFTWALKERS, encounter, type HeroId } from '@sr/content/v2';
import type { CombatSetup } from '@sr/combat';
import { DeckBuilder } from './DeckBuilder';
import { countsOf, flatten } from './deckCatalog';
import { getHero, rememberHero } from '../app/heroChoice';
import { FightView } from './FightView';
import { venueForRealm } from '../duel/scene/venue';
import '../play/play.css';
import '../duel/duel.css';

const REALM_NAME: Record<string, string> = {
  aurelion: 'Aurelion',
  nexus: 'Nexus',
  wyldmaw: 'Wyldmaw',
  umbral: 'Umbral Veil',
  starfall: 'The Hollow Crown',
  gloomfen: 'Gloomfen',
  midden: 'The Midden',
  beyond: 'The Far Rifts',
  all: 'All realms',
};
const KINDS = ['regular', 'elite', 'warden', 'finale'] as const;
const KIND_LABEL: Record<string, string> = {
  regular: 'Fights',
  elite: 'Elites',
  warden: 'Wardens',
  finale: 'Finale',
};

const newSeed = (): string =>
  `fight-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

export default function FightScreen() {
  const [hero, setHeroState] = useState<HeroId>(getHero);
  const setHero = (h: HeroId): void => {
    setHeroState(h);
    rememberHero(h);
  };
  // the practice deck: any cards from the whole game, any number of copies
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    countsOf(RIFTWALKERS[getHero()].starter),
  );
  const [boons, setBoons] = useState<string[]>([]);
  const [potions, setPotions] = useState<string[]>(['fire-flask', 'guard-draught']);
  const [easy, setEasy] = useState(true);
  const [enc, setEnc] = useState<string>(ENCOUNTERS[0]?.id ?? '');
  const [setup, setSetup] = useState<{ cfg: CombatSetup; title: string } | null>(null);

  if (setup) {
    return (
      <FightView
        key={setup.cfg.seed}
        db={COMBAT_DB}
        setup={setup.cfg}
        title={setup.title}
        venue={venueForRealm(encounter(enc).realm)}
        onExit={() => setSetup(null)}
        onDone={() => setSetup(null)}
      />
    );
  }

  return (
    <main className="setup setup--wide">
      <nav className="setup__nav" aria-label="Sandbox">
        <a className="btn btn--small" href="#/">
          <span>Back</span>
        </a>
        <a className="btn btn--small" href="#/trials">
          <span>Elite Events</span>
        </a>
      </nav>
      <h1 className="setup__title">Fight the rift</h1>
      <p className="setup__lead">
        The new combat: play cards with Mana, read what each enemy is about to do, and bring
        companions and Traps. This is a preview of the rebuilt game.
      </p>
      <section>
        <h2 className="setup__h">Riftwalker</h2>
        <HeroShowcase
          compact
          picked={hero}
          onPick={(h) => {
            setHero(h);
            setCounts(countsOf(RIFTWALKERS[h].starter));
          }}
        />
      </section>
      <section className="setup__full">
        <h2 className="setup__h">Deck</h2>
        <p className="setup__lead">
          Build any deck from every card in the game: another Riftwalker’s cards, Neutral, Warden
          gifts, tokens, upgraded versions, as many copies as you like.
        </p>
        <DeckBuilder
          db={COMBAT_DB}
          counts={counts}
          onChange={setCounts}
          onReset={() => setCounts(countsOf(RIFTWALKERS[hero].starter))}
          heroName={RIFTWALKERS[hero].hero.name}
        />
      </section>
      <section>
        <h2 className="setup__h">Boons and Potions</h2>
        <div className="db__chips" aria-label="Boons">
          {Object.values(COMBAT_DB.boons).map((b) => (
            <button
              key={b.id}
              className={`db__chip${boons.includes(b.id) ? ' is-on' : ''}`}
              title={b.text}
              onClick={() =>
                setBoons(boons.includes(b.id) ? boons.filter((x) => x !== b.id) : [...boons, b.id])
              }
            >
              {b.name}
            </button>
          ))}
        </div>
        <div className="db__chips" aria-label="Potions (up to 3)">
          {Object.values(COMBAT_DB.potions).map((p) => (
            <button
              key={p.id}
              className={`db__chip db__chip--potion${potions.includes(p.id) ? ' is-on' : ''}`}
              title={p.text}
              onClick={() =>
                setPotions(
                  potions.includes(p.id)
                    ? potions.filter((x) => x !== p.id)
                    : potions.length < 3
                      ? [...potions, p.id]
                      : potions,
                )
              }
            >
              {p.name}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h2 className="setup__h">Encounter</h2>
        <label className="setup__select">
          <span className="sr-only">Encounter</span>
          <select value={enc} onChange={(e) => setEnc(e.target.value)}>
            {KINDS.map((k) => (
              <optgroup key={k} label={KIND_LABEL[k]}>
                {ENCOUNTERS.filter((e) => e.kind === k).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} · {REALM_NAME[e.realm]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </section>
      <label className="setup__select">
        <input type="checkbox" checked={easy} onChange={(e) => setEasy(e.target.checked)} /> Easy
        mode (weaker enemies)
      </label>
      <button
        className="btn btn--primary setup__go"
        disabled={Object.keys(counts).length === 0}
        onClick={() => {
          const e = encounter(enc);
          setSetup({
            title: e.name,
            cfg: {
              seed: newSeed(),
              a: {
                hero,
                deck: flatten(counts),
                potions,
                ...(boons.length ? { boons } : {}),
              },
              b: { enemies: e.units, hpPct: easy ? 60 : 100, dmgPct: easy ? 55 : 100 },
            },
          });
        }}
      >
        <span>Begin the fight</span>
      </button>
    </main>
  );
}
