// Combat v2 content: heroes, starter decks, cards, companions and encounters (docs/08_COMBAT_V2.md).

import { validateDb, type CombatDb, type HeroDef } from '@sr/combat';
import { V2_CARDS } from './cards';
import { ALLIES, ENEMY_UNITS } from './units';

export type RealmId = 'aurelion' | 'nexus' | 'wyldmaw' | 'umbral';
export type HeroId = 'maren' | 'rivet' | 'kesh' | 'vesper';

export interface Riftwalker {
  hero: HeroDef;
  realm: RealmId;
  /** which card ids it may draft from (its realm + neutral) */
  starter: string[];
  blurb: string;
}

const rep = (id: string, n: number): string[] => Array<string>(n).fill(id);

export const RIFTWALKERS: Record<HeroId, Riftwalker> = {
  maren: {
    realm: 'aurelion',
    hero: { id: 'maren', name: 'Ser Maren Ashcourt', maxHp: 80, mana: 3, handSize: 5 },
    starter: [...rep('strike', 4), ...rep('defend', 4), 'dawn-smite', 'oathbound'],
    blurb: 'A knight of the Gilded Order. No companions: Barrier, Thorns and punishing Snares.',
  },
  rivet: {
    realm: 'nexus',
    hero: { id: 'rivet', name: 'Rivet', maxHp: 72, mana: 3, handSize: 5, startUnits: ['drone'] },
    starter: [...rep('strike', 4), ...rep('defend', 3), ...rep('deploy-drone', 2), 'overclock'],
    blurb:
      'A scrap-built tinkerer. Starts every fight with a Drone and builds an army of machines.',
  },
  kesh: {
    realm: 'wyldmaw',
    hero: {
      id: 'kesh',
      name: 'Kesh the Unfed',
      maxHp: 76,
      mana: 3,
      handSize: 5,
      startUnits: ['hound'],
    },
    starter: [...rep('strike', 4), ...rep('defend', 3), ...rep('savage-bite', 2), 'blood-frenzy'],
    blurb: 'A hunter with a Hound. Pays HP to buff the whole pack with Might.',
  },
  vesper: {
    realm: 'umbral',
    hero: { id: 'vesper', name: 'Vesper Nightlace', maxHp: 68, mana: 3, handSize: 5 },
    starter: [...rep('strike', 3), ...rep('defend', 4), ...rep('veil-strike', 2), 'set-the-web'],
    blurb: 'A masked trapper. No companions: Snares, Exposed and Seared.',
  },
};

export type EncounterKind = 'regular' | 'elite' | 'warden' | 'finale';

export interface Encounter {
  id: string;
  name: string;
  realm: RealmId | 'all';
  kind: EncounterKind;
  /** front to back */
  units: string[];
}

const enc = (
  id: string,
  name: string,
  realm: Encounter['realm'],
  kind: EncounterKind,
  ...units: string[]
): Encounter => ({
  id,
  name,
  realm,
  kind,
  units,
});

export const ENCOUNTERS: Encounter[] = [
  enc('squire-pair', 'Gilded Squires', 'aurelion', 'regular', 'squire', 'squire'),
  enc('squire-recruit', 'Squire Recruit', 'aurelion', 'regular', 'squire-recruit'),
  enc('bell-cleric', 'Bell Cleric and Squire', 'aurelion', 'regular', 'squire', 'bell-cleric'),
  enc('wandering-knight', 'Wandering Knight', 'aurelion', 'regular', 'wandering-knight'),
  enc('aldric', 'Templar-Commander Aldric', 'aurelion', 'elite', 'templar-aldric'),
  enc('maelis', 'High Inquisitor Maelis', 'aurelion', 'elite', 'inquisitor-maelis'),
  enc('seraphine', 'Seraphine, the Gilded Warden', 'aurelion', 'warden', 'seraphine'),

  enc('line-technician', 'Line Technician', 'nexus', 'regular', 'line-technician'),
  enc('patrol-unit', 'Patrol Unit 44', 'nexus', 'regular', 'patrol-unit'),
  enc('scrap-collector', 'Scrap Collector', 'nexus', 'regular', 'scrap-collector'),
  enc('drone-nest', 'Drone Nest', 'nexus', 'regular', 'scrap-drone', 'scrap-drone', 'patrol-unit'),
  enc('hive-7', 'Hive-7', 'nexus', 'elite', 'hive-7'),
  enc('ghostwire', 'Ghostwire', 'nexus', 'elite', 'ghostwire'),
  enc('kron', 'KR-0N "Kron", Foundry Overseer', 'nexus', 'warden', 'kron'),

  enc('raptor-pack', 'Raptor Pack', 'wyldmaw', 'regular', 'raptor', 'raptor', 'raptor'),
  enc('acid-spitter', 'Spitter Nest', 'wyldmaw', 'regular', 'acid-spitter'),
  enc('feral-riftling', 'Feral Riftling', 'wyldmaw', 'regular', 'feral-riftling'),
  enc('packmother-ruhn', 'Packmother Ruhn', 'wyldmaw', 'elite', 'packmother-ruhn'),
  enc('bloated-one', 'The Bloated One', 'wyldmaw', 'elite', 'bloated-one'),
  enc('gorrmaw', 'Gorrmaw, the Hunger Below', 'wyldmaw', 'warden', 'gorrmaw'),

  enc('hooded-acolyte', 'Hooded Acolyte', 'umbral', 'regular', 'hooded-acolyte'),
  enc('whisperer', 'The Whisperer', 'umbral', 'regular', 'whisperer'),
  enc('lost-courtier', 'Lost Courtier', 'umbral', 'regular', 'lost-courtier'),
  enc('lamplighter', 'The Lamplighter', 'umbral', 'elite', 'lamplighter'),
  enc('choir-of-silence', 'Choir of Silence', 'umbral', 'elite', 'choir-of-silence'),
  enc('nyxara', 'Nyxara, the Veiled Matriarch', 'umbral', 'warden', 'nyxara'),

  enc('vorthax', 'Vorthax, Heart of the Rift', 'all', 'finale', 'vorthax'),
];

export const encounter = (id: string): Encounter => {
  const e = ENCOUNTERS.find((x) => x.id === id);
  if (!e) throw new Error(`Unknown encounter "${id}"`);
  return e;
};

export const COMBAT_DB: CombatDb = {
  cards: Object.fromEntries(V2_CARDS.map((c) => [c.id, c])),
  units: Object.fromEntries([...ALLIES, ...ENEMY_UNITS].map((u) => [u.id, u])),
  heroes: Object.fromEntries(Object.values(RIFTWALKERS).map((r) => [r.hero.id, r.hero])),
};

/** Cards a Riftwalker may be offered as rewards: their realm and Neutral, never basics or junk. */
export function rewardPool(hero: HeroId): string[] {
  const realm = RIFTWALKERS[hero].realm;
  return V2_CARDS.filter(
    (c) =>
      (c.realm === realm || c.realm === 'neutral') &&
      c.rarity !== 'basic' &&
      !c.id.endsWith('+') &&
      !c.unplayable,
  ).map((c) => c.id);
}

export { validateDb };

/** Deck rules for Combat v2 runs: a deck never drops below minSize cards, and no non-basic card has more than maxCopies copies. */
export const V2_DECK_RULES = { minSize: 8, maxCopies: 4, vaultSlots: 5 } as const;
