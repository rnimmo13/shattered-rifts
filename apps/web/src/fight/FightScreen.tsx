// #/fight: pick a Riftwalker and an encounter, then fight it on the new Combat v2 stage.

import { useState } from 'react';
import { HeroShowcase } from '../app/HeroShowcase';
import {
  COMBAT_DB,
  ENCOUNTERS,
  RIFTWALKERS,
  TRAINING_ENCOUNTERS,
  encounter,
  classNameOf,
  type EncounterKind,
  type HeroId,
} from '@sr/content/v2';
import type { CombatSetup } from '@sr/combat';
import { kindOfEncounter } from './fightKind';
import { ARENA_START_HP as ARENA_HP } from '@sr/pvp';
import { DeckBuilder } from './DeckBuilder';
import { countsOf, flatten } from './deckCatalog';
import { getHero, rememberHero } from '../app/heroChoice';
import { FightView } from './FightView';
import { venueFor } from '../duel/scene/venue';
import { enemyScale } from '@sr/campaign';
import { SavedDeckPicker } from './SavedDeckPicker';
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
/** localStorage "sr.testEnemies" = "a,b,c": the enemies a developer's layout check stands (only ids the game knows), else null */
function testEnemies(): string[] | null {
  try {
    const ids = localStorage
      .getItem('sr.testEnemies')
      ?.split(',')
      .filter((id) => !!COMBAT_DB.units[id]);
    return ids && ids.length ? ids : null;
  } catch {
    return null;
  }
}

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
  const [ascendancy, setAscendancy] = useState<string | null>(null);
  const [testHp, setTestHp] = useState<{ hp: number; maxHp: number } | null>(null);
  const [campaignTier, setCampaignTier] = useState<number | null>(null);
  const [enc, setEnc] = useState<string>(ENCOUNTERS[0]?.id ?? '');
  const [setup, setSetup] = useState<{
    cfg: CombatSetup;
    title: string;
    kind: EncounterKind;
  } | null>(null);

  if (setup) {
    return (
      <FightView
        key={setup.cfg.seed}
        db={COMBAT_DB}
        setup={setup.cfg}
        title={setup.title}
        kind={kindOfEncounter(setup.kind)}
        subtitle="Sandbox"
        venue={venueFor(encounter(enc), setup.cfg.seed)}
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
            setAscendancy(null);
            setTestHp(null);
            setCampaignTier(null);
          }}
        />
      </section>
      <SavedDeckPicker
        onLoad={(deck) => {
          setHero(deck.hero as HeroId);
          setCounts(countsOf(deck.deck));
          setBoons([...deck.boons]);
          setAscendancy(deck.ascendancy ?? null);
          setPotions([]);
          setEasy(false);
          setCampaignTier(deck.tier);
          setTestHp(deck.maxHp && deck.maxHp > 0 ? { hp: deck.maxHp, maxHp: deck.maxHp } : null);
        }}
      />
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
            <optgroup label="Training">
              {TRAINING_ENCOUNTERS.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · 1000 HP
                </option>
              ))}
            </optgroup>
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
      <label className="setup__select">
        <input
          type="checkbox"
          checked={testHp?.maxHp === ARENA_HP}
          onChange={(e) => setTestHp(e.target.checked ? { hp: ARENA_HP, maxHp: ARENA_HP } : null)}
        />{' '}
        Arena-size HP ({ARENA_HP}) for your hero. HP costs stay at the card's number here; only real
        Arena fights multiply them by 5
      </label>
      {campaignTier !== null && (
        <div>
          <p className="setup__lead">
            Saved deck setup: {classNameOf(hero, ascendancy ?? undefined)} · Tier {campaignTier}
            {testHp ? ` · ${testHp.hp} / ${testHp.maxHp} HP` : ''}. Card edits keep these test
            stats.
          </p>
          <button
            className="btn btn--small"
            onClick={() => {
              setAscendancy(null);
              setTestHp(null);
              setCampaignTier(null);
            }}
          >
            <span>Reset test stats to base class</span>
          </button>
        </div>
      )}
      <button
        className="btn btn--primary setup__go"
        disabled={Object.keys(counts).length === 0}
        onClick={() => {
          const e = encounter(enc);
          // (a training dummy keeps its own numbers: Easy mode and a saved deck's tier never scale it)
          const training = TRAINING_ENCOUNTERS.includes(e);
          const scale =
            campaignTier === null || training ? { hp: 100, dmg: 100 } : enemyScale(campaignTier, 1);
          const elite = campaignTier !== null && e.kind === 'elite';
          setSetup({
            title: e.name,
            kind: e.kind,
            cfg: {
              seed: newSeed(),
              a: {
                hero,
                deck: flatten(counts),
                potions,
                ...(ascendancy ? { ascendancy } : {}),
                ...(testHp ? testHp : {}),
                ...(boons.length ? { boons } : {}),
              },
              b: {
                // (a developer's check: localStorage "sr.testEnemies" = "vorthax,rift-ward,..." stands exactly those enemies in place
                // of the encounter's, to see a crowd a fight only reaches later, such as Drago's court. Nothing sets it in the game.)
                enemies: testEnemies() ?? e.units,
                hpPct: easy && !training ? 60 : Math.round(scale.hp * (elite ? 1.25 : 1)),
                dmgPct: easy && !training ? 55 : Math.round(scale.dmg * (elite ? 1.08 : 1)),
              },
            },
          });
        }}
      >
        <span>Begin the fight</span>
      </button>
    </main>
  );
}
