// Combat v2 content: heroes, starter decks, cards, companions and encounters (docs/08_COMBAT_V2.md).

import { validateDb, type CombatDb, type HeroDef } from '@sr/combat';
import { addTo, channel, stance, stars } from './build';
import { BOONS } from './boons';
import { V2_CARDS } from './cards';
import { RUNES } from './pools/ilvane';
import { POTIONS } from './potions';
import { ALLIES, ENEMY_UNITS } from './units';

export type RealmId = 'aurelion' | 'nexus' | 'wyldmaw' | 'umbral' | 'starfall';
export type HeroId =
  | 'maren'
  | 'rivet'
  | 'kesh'
  | 'vesper'
  | 'quill'
  | 'ilvane'
  | 'sehra'
  | 'astra';

export interface Riftwalker {
  hero: HeroDef;
  realm: RealmId;
  starter: string[];
  blurb: string;
  /** the three lanes of its card pool, shown on the character screen (docs/09_ROSTER.md) */
  lanes: [string, string, string];
}

const rep = (id: string, n: number): string[] => Array<string>(n).fill(id);

export const RIFTWALKERS: Record<HeroId, Riftwalker> = {
  maren: {
    realm: 'aurelion',
    hero: { id: 'maren', name: 'Ser Maren Ashcourt', maxHp: 80, mana: 3, handSize: 5 },
    starter: [...rep('strike', 4), ...rep('defend', 4), 'dawn-smite', 'oathbound'],
    blurb: 'A knight of the Gilded Order. No companions: Barrier, Thorns and punishing Snares.',
    lanes: ['Bulwark: hit with your Barrier', 'Thorns: punish attackers', 'Sanctified: heal and Shielded'],
  },
  rivet: {
    realm: 'nexus',
    hero: { id: 'rivet', name: 'Rivet', maxHp: 72, mana: 3, handSize: 5, startUnits: ['drone'] },
    starter: [...rep('strike', 4), ...rep('defend', 3), ...rep('deploy-drone', 2), 'overclock'],
    blurb:
      'A scrap-built tinkerer. Starts every fight with a Drone and builds an army of machines.',
    lanes: ['Swarm: many cheap bodies', 'Assemble: allies act again', 'Core: a few big constructs'],
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
    lanes: ['Bloodrage: HP for Might', 'Pack: feed the companions', 'Feast: Exhaust and Devour'],
  },
  vesper: {
    realm: 'umbral',
    hero: { id: 'vesper', name: 'Vesper Nightlace', maxHp: 68, mana: 3, handSize: 5 },
    starter: [...rep('strike', 3), ...rep('defend', 4), ...rep('veil-strike', 2), 'set-the-web'],
    blurb: 'A masked trapper. No companions: Snares, Exposed and patience.',
    lanes: ['Snares: traps of every trigger', 'Exposed: mark, then spend the mark', 'Bluff: Retain, Scry, held Mana'],
  },
  quill: {
    realm: 'umbral',
    hero: {
      id: 'quill',
      name: 'Quill, the Knife-Dancer',
      maxHp: 66,
      mana: 3,
      handSize: 5,
      sigil: [addTo('sleeve-knife')],
    },
    starter: [...rep('strike', 4), ...rep('defend', 3), ...rep('quick-jab', 2), 'slip-away'],
    blurb: 'A cutpurse with a sleeve full of blades. Starts every fight with a Shiv. Shivs, Seared and discard tricks.',
    lanes: ['Shivs: 0-cost blades', 'Seared: stack, double, cash out', 'Sleight: discard and cycle'],
  },
  ilvane: {
    realm: 'nexus',
    hero: {
      id: 'ilvane',
      name: 'Ilvane, the Glyphwright',
      maxHp: 70,
      mana: 3,
      handSize: 5,
      sigil: [channel('spark')],
    },
    starter: [...rep('strike', 4), ...rep('defend', 3), ...rep('spark-cast', 2), 'twin-evocation'],
    blurb: 'Carves runes into the air. Starts every fight with a Spark rune. Runes fire every turn, then burst when evoked.',
    lanes: ['Spark: damage runes', 'Ward: Barrier runes', 'Hollow: charge and Resonance'],
  },
  sehra: {
    realm: 'aurelion',
    hero: {
      id: 'sehra',
      name: 'Sehra, the Still Flame',
      maxHp: 72,
      mana: 3,
      handSize: 5,
      sigil: [stance('calm')],
    },
    starter: [...rep('strike', 4), ...rep('defend', 4), 'kindle-fury', 'still-guard'],
    blurb: 'A monk who fights in stances. Starts every fight Serene. Fury for burst, Serene for tempo, Fervor for Radiance.',
    lanes: ['Fury: burst', 'Serene: Mana and cards', 'Fervor: build to Radiant'],
  },
  astra: {
    realm: 'starfall',
    hero: {
      id: 'astra',
      name: 'Astra, the Starcaller',
      maxHp: 74,
      mana: 3,
      handSize: 5,
      sigil: [stars(2), addTo('starforged-blade')],
    },
    starter: [...rep('strike', 4), ...rep('defend', 4), 'meteor-jab', 'gather-light'],
    blurb: 'A scholar of fallen stars. Starts with 2 Lumen and a Starforged Blade that every Sharpen improves for good.',
    lanes: ['Blade: sharpen one weapon', 'Lumen: spend for finishers', 'Constellations: ticking Auras'],
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
  runes: Object.fromEntries(RUNES.map((r) => [r.id, r])),
  cards: Object.fromEntries(V2_CARDS.map((c) => [c.id, c])),
  boons: Object.fromEntries(BOONS.map((b) => [b.id, b])),
  potions: Object.fromEntries(POTIONS.map((p) => [p.id, p])),
  units: Object.fromEntries([...ALLIES, ...ENEMY_UNITS].map((u) => [u.id, u])),
  heroes: Object.fromEntries(Object.values(RIFTWALKERS).map((r) => [r.hero.id, r.hero])),
};

/** Cards a Riftwalker may be offered as rewards: their own pool and Neutral, never basics, tokens or junk. */
export function rewardPool(hero: HeroId): string[] {
  return V2_CARDS.filter(
    (c) =>
      (c.hero === hero || c.hero === 'neutral') &&
      c.rarity !== 'basic' &&
      !c.id.endsWith('+') &&
      // a card that cannot be played is only worth offering if discarding it pays (Reflex, Tactician)
      (!c.unplayable || c.onDiscard !== undefined) &&
      !c.source,
  ).map((c) => c.id);
}

/** The pool a card belongs to (a Riftwalker id, or 'neutral'). */
export const poolOf = (cardId: string): string => COMBAT_DB.cards[cardId]?.hero ?? 'neutral';

/** A Warden's signature cards (the Warden's Gift). The id is the encounter id. */
export function signatureCards(encounterId: string): string[] {
  return V2_CARDS.filter((c) => c.source === `boss:${encounterId}` && !c.id.endsWith('+')).map(
    (c) => c.id,
  );
}

export { validateDb };

/** Deck rules for Combat v2 runs: a deck never drops below minSize cards, and no non-basic card has more than maxCopies copies. */
export const V2_DECK_RULES = { minSize: 8, maxCopies: 4, vaultSlots: 5 } as const;

export { BOONS, POTIONS };
