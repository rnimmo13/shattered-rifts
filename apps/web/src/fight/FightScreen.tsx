// #/fight: pick a Riftwalker and an encounter, then fight it on the new Combat v2 stage.

import { useState } from 'react';
import { COMBAT_DB, ENCOUNTERS, RIFTWALKERS, encounter, type HeroId } from '@sr/content/v2';
import type { CombatSetup } from '@sr/combat';
import { FightView } from './FightView';
import '../play/play.css';
import '../duel/duel.css';

const REALM_NAME: Record<string, string> = {
  aurelion: 'Aurelion',
  nexus: 'Nexus',
  wyldmaw: 'Wyldmaw',
  umbral: 'Umbral Veil',
  starfall: 'Starfall',
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
  const [hero, setHero] = useState<HeroId>('maren');
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
        onExit={() => setSetup(null)}
        onDone={() => setSetup(null)}
      />
    );
  }

  return (
    <main className="setup setup--wide">
      <a className="btn btn--small setup__back" href="#/">
        <span>Back</span>
      </a>
      <h1 className="setup__title">Fight the rift</h1>
      <p className="setup__lead">
        The new combat: play cards with Mana, read what each enemy is about to do, and bring
        companions and Snares. This is a preview of the rebuilt game.
      </p>
      <section>
        <h2 className="setup__h">Riftwalker</h2>
        <div className="setup__chars">
          {(Object.keys(RIFTWALKERS) as HeroId[]).map((h) => (
            <button
              key={h}
              className={`setup__char${hero === h ? ' is-on' : ''}`}
              onClick={() => setHero(h)}
            >
              <span className="setup__charName">{RIFTWALKERS[h].hero.name}</span>
              <span>
                {RIFTWALKERS[h].hero.maxHp} HP · {REALM_NAME[RIFTWALKERS[h].realm]}
              </span>
              <span>{RIFTWALKERS[h].blurb}</span>
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
        onClick={() => {
          const e = encounter(enc);
          setSetup({
            title: e.name,
            cfg: {
              seed: newSeed(),
              a: {
                hero,
                deck: RIFTWALKERS[hero].starter,
                potions: ['fire-flask', 'guard-draught'],
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
