// #/play: pick a character and an opponent, then duel the AI on the real battlefield.

import { useState } from 'react';
import { ENEMIES, type CharacterId } from '@sr/content';
import { CharacterPicker } from '../run/CharacterPicker';
import { DuelView } from './DuelView';
import type { DuelSetup } from './session';
import './play.css';

const REALM_NAME: Record<string, string> = {
  aurelion: 'Aurelion',
  nexus: 'Nexus',
  wyldmaw: 'Wyldmaw',
  umbral: 'Umbral Veil',
  all: 'All realms',
};

const KIND_ORDER = ['regular', 'elite', 'warden', 'finale'] as const;
const KIND_LABEL: Record<string, string> = {
  regular: 'Duelists',
  elite: 'Elites',
  warden: 'Wardens',
  finale: 'Finale',
};

const newSeed = (): string =>
  `play-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

export default function PlayScreen() {
  const [char, setChar] = useState<CharacterId>('maren');
  const [foe, setFoe] = useState<string>(ENEMIES[0]?.id ?? '');
  const [setup, setSetup] = useState<DuelSetup | null>(null);

  if (setup) {
    return (
      <DuelView
        key={setup.seed}
        setup={setup}
        onExit={() => setSetup(null)}
        onAgain={() => setSetup({ ...setup, seed: newSeed() })}
      />
    );
  }

  return (
    <main className="setup setup--wide">
      <a className="btn btn--small setup__back" href="#/">
        <span>Back</span>
      </a>
      <h1 className="setup__title">Duel the rift</h1>
      <p className="setup__lead">
        Pick a Riftwalker and an opponent. Each starts with their starter deck. This is a practice
        duel: the campaign is built on top of it.
      </p>

      <CharacterPicker value={char} onChange={setChar} />

      <section aria-labelledby="vs">
        <h2 id="vs" className="setup__h">
          Opponent
        </h2>
        <label className="setup__select">
          <span className="sr-only">Opponent</span>
          <select value={foe} onChange={(e) => setFoe(e.target.value)}>
            {KIND_ORDER.map((k) => (
              <optgroup key={k} label={KIND_LABEL[k]}>
                {ENEMIES.filter((e) => e.kind === k).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} · {REALM_NAME[e.realm]} · {e.essence} Essence
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </section>

      <button
        className="btn btn--primary setup__go"
        onClick={() => setSetup({ seed: newSeed(), character: char, enemyId: foe })}
      >
        <span>Begin the duel</span>
      </button>
    </main>
  );
}
