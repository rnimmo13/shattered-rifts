// Combat v2 content: heroes, starter decks, cards, companions and encounters (docs/08_COMBAT_V2.md).

import { validateDb, type CombatDb, type HeroDef, type HeroTrait } from '@sr/combat';
import { addTo, barrier, channel, heal, stance, stars, status } from './build';
import { BOONS } from './boons';
import { V2_CARDS } from './cards';
import { RUNES } from './pools/ilvane';
import { POTIONS } from './potions';
import { stripRoll, withRolls } from './sanctify';
import { ALLIES, ENEMY_UNITS } from './units';

export type RealmId =
  'aurelion' | 'nexus' | 'wyldmaw' | 'umbral' | 'starfall' | 'gloomfen' | 'midden';
export type HeroId =
  'maren' | 'rivet' | 'kesh' | 'vesper' | 'quill' | 'ilvane' | 'sehra' | 'astra' | 'mire' | 'kp';

export interface Riftwalker {
  hero: HeroDef;
  realm: RealmId;
  starter: string[];
  blurb: string;
  /** the three lanes of its card pool, shown on the character screen (docs/09_ROSTER.md) */
  /** what kind of fighter this is, in one word players know ("Knight", "Assassin"...) */
  role: string;
  /** the innate trait every one of this character's fights starts with (shown on the character screens) */
  trait: HeroTrait;
  lanes: [string, string, string];
  /** a few plain sentences on how this character plays (shown on the character screen and the Learn page) */
  howTo: string[];
  /** things the character says (shown on the character screen, one at random) */
  quotes?: string[];
}

const rep = (id: string, n: number): string[] => Array<string>(n).fill(id);

export const RIFTWALKERS: Record<HeroId, Riftwalker> = {
  maren: {
    realm: 'aurelion',
    role: 'Knight',
    trait: {
      name: 'Oathkeeper',
      text: 'Start every turn with 2 Barrier.',
      turnStart: [barrier(2)],
    },
    hero: { id: 'maren', name: 'Maren', maxHp: 66, mana: 3, handSize: 5 },
    starter: [...rep('strike', 4), ...rep('defend', 4), 'dawn-smite', 'oathbound'],
    blurb: 'A knight of the Gilded Order. No companions: Barrier, Thorns and punishing Snares.',
    lanes: [
      'Bulwark: hit with your Barrier',
      'Thorns: punish attackers',
      'Sanctified: heal and Shielded',
    ],
    howTo: [
      'Barrier soaks damage, but it falls away at the start of your next turn.',
      'Thorns hurt whatever attacks you, so being hit can be part of the plan.',
      'Pick a lane: hit with your Barrier (Bulwark), punish attackers (Thorns), or heal and stay Shielded (Sanctified).',
    ],
  },
  rivet: {
    realm: 'nexus',
    role: 'Engineer',
    trait: {
      name: 'Tinkerer',
      text: 'At the start of your turn, you and your companions heal 1.',
      turnStart: [heal(1, 'allFriends')],
    },
    hero: { id: 'rivet', name: 'Rivet', maxHp: 60, mana: 3, handSize: 5, startUnits: ['drone'] },
    starter: [...rep('strike', 5), ...rep('defend', 3), 'deploy-drone', 'overclock'],
    blurb:
      'A tinkerer of machines. She starts every fight with a Drone and builds an army of them.',
    lanes: ['Swarm: many cheap bodies', 'Assemble: allies act again', 'Core: a few big constructs'],
    howTo: [
      'You start with a Drone. Allies attack for you when you end your turn.',
      'You can have 3 allies. Buff them with Might, or make them act again (Assemble).',
      'Enemies can hit your allies too; an ally with Taunt has to be attacked first.',
    ],
  },
  kesh: {
    realm: 'wyldmaw',
    role: 'Hunter',
    trait: {
      name: 'Pack Instinct',
      text: 'Start every fight with 1 Might for you and your companions.',
      fightStart: [status('might', 1, 'allFriends')],
    },
    hero: {
      id: 'kesh',
      name: 'Kesh the Unfed',
      maxHp: 80,
      mana: 3,
      handSize: 5,
      startUnits: ['hound'],
    },
    starter: [...rep('strike', 5), ...rep('defend', 3), 'savage-bite', 'blood-frenzy'],
    blurb: 'A hunter with a Hound. Pays HP to buff the whole pack with Might.',
    lanes: ['Bloodrage: HP for Might', 'Pack: feed the companions', 'Feast: Exhaust and Devour'],
    howTo: [
      'You start with a Hound. Might makes every attack hit harder, permanently.',
      'Many of your cards cost HP. Spend it to buff the pack, then heal with Devour and Feast cards.',
      'Consume cards (they leave the fight) to power the Feast lane.',
    ],
  },
  vesper: {
    realm: 'umbral',
    role: 'Trapper',
    trait: {
      name: 'Ambusher',
      text: 'Every enemy starts the fight Exposed for 3 turns, and you start with 6 Barrier.',
      fightStart: [status('exposed', 3, 'allFoes'), barrier(6)],
    },
    hero: { id: 'vesper', name: 'Vesper Nightlace', maxHp: 134, mana: 3, handSize: 5 },
    starter: [...rep('strike', 3), ...rep('defend', 4), ...rep('veil-strike', 2), 'set-the-web'],
    blurb: 'A masked trapper. No companions: Snares, Exposed and patience.',
    lanes: [
      'Snares: traps of every trigger',
      'Exposed: mark, then spend the mark',
      'Bluff: Hold, Foresee, held Mana',
    ],
    howTo: [
      'A Snare is played face down and springs on its own when its trigger happens.',
      'Read the icon above each enemy and set the Snare that answers what it is about to do.',
      'Exposed enemies take 50% more damage: mark them, then spend the mark.',
    ],
  },
  quill: {
    realm: 'umbral',
    role: 'Assassin',
    trait: {
      name: 'Weak Spot',
      text: 'At the start of your turn, a random enemy becomes Exposed.',
      turnStart: [status('exposed', 1, 'randomFoe')],
    },
    hero: {
      id: 'quill',
      name: 'Scarlet',
      maxHp: 78,
      mana: 3,
      handSize: 5,
      sigil: [addTo('sleeve-knife')],
    },
    starter: [...rep('strike', 4), ...rep('defend', 3), ...rep('quick-jab', 2), 'slip-away'],
    blurb:
      'A cutpurse with a sleeve full of blades. Starts every fight with a Sleeve Knife. Knives, Bleed and discard tricks.',
    lanes: [
      'Knives: 0-cost blades',
      'Bleed: stack, double, cash out',
      'Sleight: discard and cycle',
    ],
    howTo: [
      'You start with a Sleeve Knife: a 0-cost Attack that is consumed when played.',
      'Bleed hurts for its stacks every turn and then shrinks. Double it, then cash it out.',
      'Discarding is a resource: Foresee and Discard cards trigger payoffs.',
    ],
  },
  ilvane: {
    realm: 'nexus',
    role: 'Runecaster',
    trait: {
      name: 'Attuned',
      text: 'Start every fight with 2 Resonance.',
      fightStart: [status('resonance', 2)],
    },
    hero: {
      id: 'ilvane',
      name: 'Ilvane Glyphwright',
      maxHp: 100,
      mana: 3,
      handSize: 5,
      sigil: [channel('spark')],
    },
    starter: [...rep('strike', 4), ...rep('defend', 3), ...rep('spark-cast', 2), 'twin-evocation'],
    blurb:
      'Carves runes into the air. Starts every fight with a Spark rune. Runes fire every turn, then burst when evoked.',
    lanes: [
      'Spark: damage runes (one enemy or all)',
      'Ward: Barrier runes',
      'Hollow: charge and Resonance',
    ],
    howTo: [
      'You start with a Spark rune. Runes sit in a column of 3 slots beside you.',
      'At the end of your turn every rune fires a small effect. A 4th rune pushes the oldest out and it fires its big effect.',
      'Release cards fire runes early. Resonance makes every rune stronger.',
    ],
  },
  sehra: {
    realm: 'aurelion',
    role: 'Barbarian',
    trait: {
      name: 'Inner Fire',
      text: 'Start every fight with 2 Fervor.',
      fightStart: [status('mantra', 2)],
    },
    hero: {
      id: 'sehra',
      name: 'Ragnar',
      maxHp: 104,
      mana: 3,
      handSize: 5,
      sigil: [stance('calm')],
    },
    starter: [...rep('strike', 4), ...rep('defend', 4), 'kindle-fury', 'still-guard'],
    blurb:
      'A barbarian who fights in stances. Starts every fight Serene. Fury for burst, Serene for tempo, Fervor for Radiance.',
    lanes: ['Fury: burst', 'Serene: Mana and cards', 'Fervor: build to Radiant'],
    howTo: [
      'You start Serene. You are in at most one stance at a time.',
      'Fury doubles the damage you deal, but you take 50% more. Leaving Serene gives you 2 Mana.',
      'Fervor builds to 5, then you enter Radiant: triple damage until your turn ends.',
    ],
  },
  astra: {
    realm: 'starfall',
    role: 'Spellblade',
    trait: {
      name: 'Starborn',
      text: 'Gain 3 Lumen at the start of your turn.',
      turnStart: [stars(3)],
    },
    hero: {
      id: 'astra',
      name: 'Astra',
      maxHp: 112,
      mana: 3,
      handSize: 5,
      sigil: [stars(3), addTo('starforged-blade')],
    },
    // Gather Light (makes Lumen) and Lumen Bolt (spends it) are Innate: the opening hand can always do both
    starter: [
      ...rep('strike', 2),
      ...rep('defend', 4),
      'meteor-jab',
      'gather-light',
      ...rep('lumen-bolt', 2),
    ],
    blurb:
      'A scholar of fallen stars. Starts with 3 Lumen and a Starforged Blade that every Sharpen improves for good.',
    lanes: [
      'Blade: sharpen one weapon',
      'Lumen: spend for finishers',
      'Constellations: ticking Auras',
    ],
    howTo: [
      'Lumen is a second resource. Cards with a gold orb spend it; others gain it.',
      'You start with a Starforged Blade. Every Sharpen card makes every copy hit harder for the whole fight.',
      'Auras (your constellations) keep working until the fight ends.',
    ],
  },
  kp: {
    realm: 'midden',
    role: 'Drunkard',
    trait: {
      name: 'Clutch Genes',
      text: 'While at or below 60% HP, you deal 60% more attack damage.',
      clutch: { below: 60, damagePct: 60 },
    },
    hero: {
      id: 'kp',
      name: 'KP, the Homeless Drunk',
      maxHp: 106,
      mana: 3,
      handSize: 5,
      sigil: [addTo('old-twelve-gauge')],
    },
    starter: [
      ...rep('strike', 3),
      ...rep('defend', 3),
      ...rep('hammer-swing', 2),
      'pane-up',
      'bottle-tripwire',
    ],
    blurb:
      'A short, fat, bald dwarf with a hammer, an Old Twelve Gauge that hits every enemy and gets sharper, and a trolley of window panes. Booby traps, glass and buckshot.',
    lanes: [
      'Gun: sharpen the Old Twelve Gauge',
      'Shells: buckshot that hits everyone',
      'Hangover: the more it hurts, the harder you hit',
    ],
    howTo: [
      'Window panes and hammer blows get stronger the more HP you are missing, and Clutch Genes makes you hit even harder below half HP.',
      'You start every fight with the Old Twelve Gauge: it hits EVERY enemy, you keep it in hand, and every Sharpen card (Rack the Slide...) makes it hit harder for the whole fight.',
      'Shells are 0-cost attacks that hit every enemy and are consumed. Playing one can sharpen the gun (Hair Trigger).',
      'Swigs heal and hit harder for a turn. KP has a few Snares, but he is not the trapper Vesper is.',
    ],
    quotes: [
      '"I ain\'t homeless. I\'m between windows."',
      '"This is a 12 gauge. That\'s how many friends I have."',
      '"Mind the glass. Or don\'t. It\'s mostly insurance."',
      '"I\'m not drunk. The floor is just very enthusiastic."',
      '"Back off, I got a hammer and a bad attitude."',
      '"Everybody\'s got a trolley full of problems. Mine\'s got wheels."',
    ],
  },
  mire: {
    realm: 'gloomfen',
    role: 'Necromancer',
    trait: {
      name: 'Grave Chill',
      text: 'Every enemy starts the fight with 4 Fate.',
      fightStart: [status('doom', 4, 'allFoes')],
    },
    hero: {
      id: 'mire',
      name: 'Dorian Blackthorn',
      maxHp: 86,
      mana: 3,
      handSize: 5,
      startUnits: ['bone-thrall'],
    },
    starter: [
      ...rep('strike', 3),
      ...rep('defend', 3),
      ...rep('grave-touch', 2),
      ...rep('bone-ward', 2),
    ],
    blurb:
      'A warden of the drowned dead. Starts with a Bone Thrall. Curses enemies with Fate until the end comes for them.',
    lanes: [
      'Fate: curse, double, cash in',
      'Thralls: the dead fight for you',
      'Ashes: consumed cards fuel you',
    ],
    howTo: [
      'You start with a Bone Thrall, which attacks when you end your turn.',
      'Cursed with Fate, an enemy dies at the end of its turn if its HP is at or below its Fate. Curse it, double it, finish it.',
      'Cards you consume fuel your Ashes lane: Gravesouls, Requiem and more.',
    ],
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
  enc(
    'page-troop',
    'Page Troop',
    'aurelion',
    'regular',
    'gilded-page',
    'gilded-page',
    'gilded-page',
    'gilded-page',
    'gilded-page',
    'gilded-page',
  ),
  enc('aldric', 'Templar-Commander Aldric', 'aurelion', 'elite', 'templar-aldric'),
  enc('maelis', 'High Inquisitor Maelis', 'aurelion', 'elite', 'inquisitor-maelis'),
  enc('seraphine', 'Seraphine, the Gilded Warden', 'aurelion', 'warden', 'seraphine'),

  enc('line-technician', 'Line Technician', 'nexus', 'regular', 'line-technician'),
  enc('patrol-unit', 'Patrol Unit 44', 'nexus', 'regular', 'patrol-unit'),
  enc('scrap-collector', 'Scrap Collector', 'nexus', 'regular', 'scrap-collector'),
  enc('drone-nest', 'Drone Nest', 'nexus', 'regular', 'scrap-drone', 'scrap-drone', 'patrol-unit'),
  enc(
    'drone-swarm',
    'Drone Swarm',
    'nexus',
    'regular',
    'scrap-drone',
    'scrap-drone',
    'scrap-drone',
    'scrap-drone',
    'scrap-drone',
    'scrap-drone',
  ),
  enc('hive-7', 'Hive-7', 'nexus', 'elite', 'hive-7'),
  enc('ghostwire', 'Ghostwire', 'nexus', 'elite', 'ghostwire'),
  enc('kron', 'KR-0N "Kron", Foundry Overseer', 'nexus', 'warden', 'kron'),

  enc('raptor-pack', 'Raptor Pack', 'wyldmaw', 'regular', 'raptor', 'raptor', 'raptor'),
  enc('raptor-horde', 'Raptor Horde', 'wyldmaw', 'regular', 'raptor', 'raptor', 'raptor', 'raptor'),
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

// two cards sharing an id would silently overwrite each other in the table below
{
  const seen = new Set<string>();
  for (const c of V2_CARDS) {
    if (seen.has(c.id)) throw new Error(`Duplicate card id "${c.id}"`);
    seen.add(c.id);
  }
}

export const COMBAT_DB: CombatDb = {
  runes: Object.fromEntries(RUNES.map((r) => [r.id, r])),
  // (also answers for sanctified ids like "hi~strike": derived on demand, never listed)
  cards: withRolls(Object.fromEntries(V2_CARDS.map((c) => [c.id, c]))),
  boons: Object.fromEntries(BOONS.map((b) => [b.id, b])),
  potions: Object.fromEntries(POTIONS.map((p) => [p.id, p])),
  units: Object.fromEntries([...ALLIES, ...ENEMY_UNITS].map((u) => [u.id, u])),
  heroes: Object.fromEntries(
    Object.values(RIFTWALKERS).map((r) => [r.hero.id, { ...r.hero, trait: r.trait }]),
  ),
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

/** The ancestral cards (base versions): powerful, classless, offered only by special events (docs/03_CAMPAIGN.md). */
export function ancestralCards(): string[] {
  return V2_CARDS.filter((c) => c.rarity === 'ancestral' && !c.id.endsWith('+')).map((c) => c.id);
}

/** A Warden's signature cards (the Warden's Gift). The id is the encounter id. */
export function signatureCards(encounterId: string): string[] {
  return V2_CARDS.filter((c) => c.source === `boss:${encounterId}` && !c.id.endsWith('+')).map(
    (c) => c.id,
  );
}

export { validateDb };
export { canRoll, rolledId, rollOf, stripRoll } from './sanctify';
import { LANE_OF } from './lanes.generated';

/** Which of its Riftwalker's three lanes (0, 1 or 2 in `Riftwalker.lanes`) a card belongs to, or undefined (basics, glue, legendaries). */
export function laneOf(cardId: string): number | undefined {
  return LANE_OF[stripRoll(cardId).replace(/\+$/, '')];
}

/** The short name of a lane ("Bulwark"), and the whole line ("Bulwark: hit with your Barrier"). */
export function laneName(hero: HeroId, lane: number): string {
  return (RIFTWALKERS[hero].lanes[lane] ?? '').split(':')[0] ?? '';
}

/** How many cards (base versions) a Riftwalker has in each of its lanes. */
export function laneSizes(hero: HeroId): [number, number, number] {
  const n: [number, number, number] = [0, 0, 0];
  for (const [id, lane] of Object.entries(LANE_OF))
    if (COMBAT_DB.cards[id]?.hero === hero && lane >= 0 && lane <= 2) n[lane as 0 | 1 | 2]++;
  return n;
}

/** Deck rules for Combat v2 runs: a deck never drops below minSize cards, and no non-basic card has more than maxCopies copies. */
export const V2_DECK_RULES = { minSize: 8, maxCopies: 4, vaultSlots: 5 } as const;

export { BOONS, POTIONS };

/** The playable realms in the order every screen lists them, with the name players read. */
export const REALMS: { id: RealmId; name: string }[] = [
  { id: 'aurelion', name: 'Aurelion' },
  { id: 'nexus', name: 'Nexus-9' },
  { id: 'wyldmaw', name: 'Wyldmaw' },
  { id: 'umbral', name: 'Umbral Veil' },
  { id: 'starfall', name: 'Starfall' },
  { id: 'gloomfen', name: 'Gloomfen' },
  { id: 'midden', name: 'The Midden' },
];

/** Riftwalkers grouped by realm (every screen that lists characters uses this, so they always group alike). */
export function heroesByRealm(): { realm: RealmId; name: string; heroes: HeroId[] }[] {
  const all = Object.keys(RIFTWALKERS) as HeroId[];
  return REALMS.map((r) => ({
    realm: r.id,
    name: r.name,
    heroes: all.filter((h) => RIFTWALKERS[h].realm === r.id),
  })).filter((g) => g.heroes.length > 0);
}
