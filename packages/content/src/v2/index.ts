// Combat v2 content: heroes, starter decks, cards, companions and encounters (docs/08_COMBAT_V2.md).

import { validateDb, type CombatDb, type HeroDef, type HeroTrait } from '@sr/combat';
import {
  addTo,
  barrier,
  channel,
  draw,
  forge,
  heal,
  on,
  per,
  scaled,
  stance,
  stars,
  status,
} from './build';
import { BOONS, HEARTS } from './boons';
import { V2_CARDS } from './cards';
import { RUNES } from './pools/totemist';
import { POTIONS } from './potions';
import { isVariant, stripRoll, withRolls } from './sanctify';
import { ALLIES, ENEMY_UNITS } from './units';

export type RealmId =
  'aurelion' | 'nexus' | 'wyldmaw' | 'umbral' | 'starfall' | 'gloomfen' | 'midden';
export type HeroId =
  | 'knight'
  | 'engineer'
  | 'hunter'
  | 'trapper'
  | 'assassin'
  | 'totemist'
  | 'barbarian'
  | 'spellblade'
  | 'necromancer'
  | 'drunkard';

export interface Riftwalker {
  hero: HeroDef;
  realm: RealmId;
  starter: string[];
  blurb: string;
  /** the three build paths of its card pool, shown on the character screen (docs/09_ROSTER.md) */
  /** what kind of fighter this is, in one word players know ("Knight", "Assassin"...) */
  role: string;
  /** the innate trait every one of this character's fights starts with (shown on the character screens) */
  trait: HeroTrait;
  buildPaths: [string, string, string];
  /** a few plain sentences on how this character plays (shown on the character screen and the Learn page) */
  howTo: string[];
  /** things the character says (shown on the character screen, one at random) */
  quotes?: string[];
}

const rep = (id: string, n: number): string[] => Array<string>(n).fill(id);

export const RIFTWALKERS: Record<HeroId, Riftwalker> = {
  knight: {
    realm: 'aurelion',
    role: 'Knight',
    trait: {
      name: 'Oathkeeper',
      text: 'Start every fight with 6 Barrier and 6 Plating: your Barrier survives each turn up to your Plating, which shrinks by 1 a turn. Whenever you heal, gain that much Devotion, even at full HP.',
      fightStart: [barrier(6), status('plating', 6)],
      triggers: [on('heal', [scaled(status('devotion', 0), per('healed'))])],
    },
    hero: { id: 'knight', name: 'Valeria', maxHp: 80, mana: 3, handSize: 5 },
    starter: [...rep('strike', 4), ...rep('defend', 4), 'dawn-smite', 'oathbound'],
    blurb: 'A knight of the Gilded Order. No companions: Barrier, Thorns and punishing Traps.',
    buildPaths: [
      'Bulwark: hit with your Barrier',
      'Thorns: punish attackers',
      'Devotion: heal to build Devotion, spend it on big hits',
    ],
    howTo: [
      'Barrier soaks damage, but it falls away at the start of your next turn. Your Plating keeps some of it through the first turns.',
      'Thorns hurt whatever attacks you, so being hit can be part of the plan.',
      'Pick a build: hit with your Barrier (Bulwark), punish attackers (Thorns), or heal to build Devotion and spend it on big hits (Devotion).',
    ],
  },
  engineer: {
    realm: 'nexus',
    role: 'Engineer',
    trait: {
      name: 'Tinkerer',
      text: 'At the start of your turn, you and your companions heal 1.',
      turnStart: [heal(1, 'allFriends')],
    },
    hero: { id: 'engineer', name: 'Rivet', maxHp: 70, mana: 3, handSize: 5, startUnits: ['drone'] },
    starter: [...rep('strike', 5), ...rep('defend', 3), 'deploy-drone', 'overclock'],
    blurb:
      'A tinkerer of machines. She starts every fight with a Drone and builds an army of them.',
    buildPaths: [
      'Swarm: many cheap bodies',
      'Assemble: allies act again',
      'Core: a few big constructs',
    ],
    howTo: [
      'You start with a Drone. Allies attack for you when you end your turn.',
      'You can have 3 allies. Buff them with Might, or make them act again (Assemble).',
      'Enemies can hit your allies too; an ally with Taunt has to be attacked first.',
    ],
  },
  hunter: {
    realm: 'wyldmaw',
    role: 'Hunter',
    trait: {
      name: 'Pack Instinct',
      // (DECISIONS #285: her Might is the pack's, and she recovers between fights from what her own cards cost her)
      text: 'Your companions share half your Might (rounded down), and a new companion arrives with it. Start every fight with 1 Might. Heal 6 after every fight you win.',
      fightStart: [status('might', 1)],
      shareMight: 0.5,
      healAfterFight: 6,
    },
    hero: {
      id: 'hunter',
      name: 'Kesh the Unfed',
      maxHp: 80,
      mana: 3,
      handSize: 5,
      startUnits: ['hound'],
    },
    starter: [...rep('strike', 4), ...rep('defend', 3), 'savage-bite', 'blood-frenzy', 'rend'],
    blurb: 'A hunter with a Hound. Pays HP to buff the whole pack with Might.',
    buildPaths: [
      'Bloodrage: HP for Might',
      'Pack: feed the companions',
      'Feast: Exhaust and Devour',
    ],
    howTo: [
      'You start with a Hound. Might makes every attack hit harder, permanently.',
      'Many of your cards cost HP. Spend it to buff the pack, then heal with Devour and Feast cards.',
      'Consume cards (they leave the fight) to power the Feast build.',
    ],
  },
  trapper: {
    realm: 'umbral',
    role: 'Trapper',
    trait: {
      name: 'Lying in Wait',
      text: 'Start every fight with 6 Barrier and 2 extra cards in hand. At the start of your turn, gain 4 Barrier.',
      fightStart: [barrier(6), draw(2)],
      turnStart: [barrier(4)],
    },
    hero: { id: 'trapper', name: 'Vesper Nightlace', maxHp: 80, mana: 3, handSize: 5 },
    starter: [...rep('strike', 3), ...rep('defend', 4), ...rep('veil-strike', 2), 'set-the-web'],
    blurb:
      'A masked trapper who always sees the next move coming. No companions: Traps, Exposed and patience.',
    buildPaths: [
      'Traps: one for every trigger',
      'Exposed: mark, then spend the mark',
      'Patience: Hold your cards, keep your Mana, strike later',
    ],
    howTo: [
      'A Trap is played face down and springs on its own when its trigger happens.',
      'Read the icon above each enemy and set the Trap that answers what it is about to do.',
      'Exposed enemies take 50% more damage: mark them, then spend the mark.',
      'Patience: Hold cards for later and leave Mana unspent; those cards pay for a full hand and for the Mana you kept.',
    ],
  },
  assassin: {
    realm: 'umbral',
    role: 'Assassin',
    trait: {
      name: 'Hidden Blades',
      text: 'At the start of your turn, add a Sleeve Knife to your hand.',
      turnStart: [addTo('sleeve-knife')],
    },
    hero: {
      id: 'assassin',
      name: 'Sylas',
      maxHp: 72,
      mana: 3,
      handSize: 5,
    },
    starter: [...rep('strike', 4), ...rep('defend', 3), ...rep('quick-jab', 2), 'slip-away'],
    blurb:
      'A cutpurse with a sleeve full of blades: a Sleeve Knife finds its way into his hand every turn. Knives, Bleed and discard tricks.',
    buildPaths: [
      'Knives: 0-cost blades',
      'Bleed: stack, double, cash out',
      'Sleight: discard and cycle',
    ],
    howTo: [
      'Every turn a Sleeve Knife comes to your hand (Hidden Blades): a 0-cost Attack that is consumed when played. Knife payoffs, Bleed on knives (Tainted Edges) and discard payoffs all use it.',
      'Bleed hurts for its stacks every turn and then shrinks. Double it, then cash it out.',
      'Discarding is a resource: Foresee and Discard cards trigger payoffs.',
    ],
  },
  totemist: {
    realm: 'nexus',
    role: 'Totemist',
    trait: {
      name: 'Totem-bound',
      text: 'Start every fight with three different totems: Hawk, Bear and Splinter.',
      fightStart: [channel('spark'), channel('ward'), channel('splinter')],
    },
    hero: {
      id: 'totemist',
      name: 'Ilvane',
      maxHp: 76,
      mana: 3,
      handSize: 5,
    },
    starter: [...rep('strike', 4), ...rep('defend', 3), ...rep('spark-cast', 2), 'twin-evocation'],
    blurb:
      'An elder shaman who carves: totems that hold spirits, small Carvings by the handful, and the rites that wake them. Starts every fight with three totems (Hawk, Bear and Splinter).',
    buildPaths: [
      'Totems: plant, empower with Spirit, awaken',
      'Whittling: small free Carvings that keep coming back',
      'Rites: every Aura makes the next one pay',
    ],
    howTo: [
      'You start with a Hawk, a Bear and a Splinter totem. Totems stand in a column of 3 slots beside you, pulse a small effect at the end of your turn, and a 4th pushes the oldest out, awakening it for its big effect.',
      'Totems: plant many, make them stronger with Spirit and more slots, and awaken them on purpose.',
      'Whittling: Carvings cost nothing; play a handful a turn, then gather them back from your discard pile.',
      'Rites: an Aura stays all fight. Rite cards pay off for every Aura you already have.',
    ],
  },
  barbarian: {
    realm: 'aurelion',
    role: 'Barbarian',
    trait: {
      name: 'Inner Fire',
      text: 'Whenever you enter a stance, gain 1 Fervor and 2 Barrier.',
      triggers: [on('stance', [status('mantra', 1), barrier(2)])],
    },
    hero: {
      id: 'barbarian',
      name: 'Sehra',
      maxHp: 82,
      mana: 3,
      handSize: 5,
      sigil: [stance('calm')],
    },
    starter: [...rep('strike', 4), ...rep('defend', 4), 'kindle-fury', 'still-guard'],
    blurb:
      'A barbarian who fights in stances. Starts every fight Serene, and every stance she enters stokes her Fervor towards Radiance.',
    buildPaths: [
      'Fury: get in, hit hard, live through it',
      'Flow: change stance again and again; every change pays',
      'Radiant: build Fervor to 10 for a triple-damage turn',
    ],
    howTo: [
      'You start Serene. You are in at most one stance at a time, and every stance you enter gives 1 Fervor and 2 Barrier (Inner Fire).',
      'Fury doubles the damage you deal, but you take 50% more. Leaving Serene gives you 2 Mana (once a turn).',
      'Fervor builds to 10, then you enter Radiant: triple damage until your turn ends.',
      'Pick a build: burst in Fury, dance between stances (Flow), or build to Radiant.',
    ],
  },
  spellblade: {
    realm: 'starfall',
    role: 'Spellblade',
    trait: {
      name: 'Kindled',
      text: 'At the start of your turn, gain 1 Arcana and Sharpen your Obsidian Blade by 1.',
      turnStart: [stars(1), forge('starforged-blade', 1)],
    },
    hero: {
      id: 'spellblade',
      name: 'Obsidia',
      maxHp: 82,
      mana: 3,
      handSize: 5,
      sigil: [stars(3), addTo('starforged-blade')],
    },
    // Gather Arcana (makes Arcana) and Arcane Bolt (spends it) are Innate: the opening hand can always do both
    starter: [
      ...rep('strike', 2),
      ...rep('defend', 4),
      'meteor-jab',
      'gather-light',
      ...rep('lumen-bolt', 2),
    ],
    blurb:
      'A spellblade of black glass and ember. Starts with 3 Arcana and an Obsidian Blade that every Sharpen improves for good.',
    buildPaths: [
      'Blade: sharpen one weapon',
      'Arcana: spend for finishers',
      'Sigils: ticking Auras',
    ],
    howTo: [
      'Arcana is a second resource. Cards with an orange orb spend it; others gain it.',
      'You start with an Obsidian Blade. Every Sharpen card makes every copy hit harder for the whole fight.',
      'Auras (your sigils) keep working until the fight ends.',
    ],
  },
  drunkard: {
    realm: 'midden',
    role: 'Drunkard',
    trait: {
      name: 'Clutch Genes',
      text: 'While at or below half HP, you deal 50% more attack damage.',
      clutch: { below: 50, damagePct: 50 },
    },
    hero: {
      id: 'drunkard',
      name: 'KP, the Homeless Drunk',
      maxHp: 88,
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
    buildPaths: [
      'Gun: sharpen the Old Twelve Gauge',
      'Shells: buckshot that hits everyone',
      'Hangover: the more it hurts, the harder you hit',
    ],
    howTo: [
      'Window panes and hammer blows get stronger the more HP you are missing, and Clutch Genes makes you hit harder at half HP and below.',
      'You start every fight with the Old Twelve Gauge: it hits EVERY enemy, you keep it in hand, and every Sharpen card (Rack the Slide...) makes it hit harder for the whole fight.',
      'Shells are 0-cost attacks that hit every enemy and are consumed. Playing one can sharpen the gun (Hair Trigger).',
      'Swigs heal and hit harder for a turn. KP has a few Traps, but he is not the trapper Vesper is.',
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
  necromancer: {
    realm: 'gloomfen',
    role: 'Necromancer',
    trait: {
      name: 'Grave Chill',
      text: 'Every enemy starts the fight with 3 Fate. Whenever one of your allies dies or a card is consumed, curse a random enemy with 3 Fate.',
      fightStart: [status('doom', 3, 'allFoes')],
      triggers: [
        on('allyDies', [status('doom', 3, 'randomFoe')]),
        on('exhaust', [status('doom', 3, 'randomFoe')]),
      ],
    },
    hero: {
      id: 'necromancer',
      name: 'Dorian Blackthorn',
      maxHp: 76,
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
      'A warden of the drowned dead. Starts with a Bone Thrall. Every death and every spent card brings the end closer for his enemies.',
    buildPaths: [
      'Fate: curse, double, cash in',
      'Thralls: the dead fight for you',
      'Ashes: consumed cards fuel you',
    ],
    howTo: [
      'You start with a Bone Thrall, which attacks when you end your turn.',
      'Cursed with Fate, an enemy dies at the end of its turn if its HP is at or below its Fate. Curse it, double it, finish it.',
      'Cards you consume fuel your Ashes build: Gravesouls, Requiem and more.',
      'Grave Chill: every enemy starts with 3 Fate, and whenever an ally of yours dies or a card is consumed a random enemy is cursed with 3 more, whichever build you follow.',
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
  boons: Object.fromEntries([...BOONS, ...HEARTS].map((b) => [b.id, b])),
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

/**
 * Is this a card a deck may hold: a listed card, or one derived from one (a sanctified roll "hi~strike", an engraved tag "hold^strike").
 * Every check of a deck that came from outside (a save, an Arena deck, a ghost) uses this, so those cards travel everywhere.
 */
export const isDeckCard = (id: unknown): id is string =>
  typeof id === 'string' &&
  (Object.hasOwn(COMBAT_DB.cards, id) || (isVariant(id) && COMBAT_DB.cards[id] !== undefined));

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
export {
  MARK_INFO,
  canMark,
  canRoll,
  isSanctified,
  isVariant,
  markOf,
  markedId,
  rolledId,
  rollOf,
  stripRoll,
  type CardMark,
} from './sanctify';
import { PATH_OF } from './paths.generated';

/** Which of its Riftwalker's three build paths (0, 1 or 2 in `Riftwalker.buildPaths`) a card belongs to, or undefined (basics, glue, legendaries). */
export function pathOf(cardId: string): number | undefined {
  return PATH_OF[stripRoll(cardId).replace(/\+$/, '')];
}

/** The short name of a build path ("Bulwark"), and the whole line ("Bulwark: hit with your Barrier"). */
export function pathName(hero: HeroId, path: number): string {
  return (RIFTWALKERS[hero].buildPaths[path] ?? '').split(':')[0] ?? '';
}

/** How many cards (base versions) a Riftwalker has in each of its build paths. */
export function pathSizes(hero: HeroId): [number, number, number] {
  const n: [number, number, number] = [0, 0, 0];
  for (const [id, path] of Object.entries(PATH_OF))
    if (COMBAT_DB.cards[id]?.hero === hero && path >= 0 && path <= 2) n[path as 0 | 1 | 2]++;
  return n;
}

/**
 * Deck rules for Combat v2 runs: a deck never drops below minSize cards, no non-basic card has more than maxCopies copies, and at most
 * maxLegendary Legendary and maxAncestral Ancestral cards fit in the deck at once (one Legendary and two Ancestral since DECISIONS
 * #238; a deck that already held more keeps them, but takes no more).
 */
export const V2_DECK_RULES = {
  minSize: 8,
  maxCopies: 4,
  vaultSlots: 10,
  maxLegendary: 1,
  maxAncestral: 2,
} as const;

export { BOONS, HEARTS, POTIONS };

/**
 * The Riftwalker ids before they were named for their class (DECISIONS #190, 2026-10-25). A run save, a Vault deck, a remembered
 * choice or a server row made before then still says the old id: everything that reads one passes it through canonicalHero.
 */
export const LEGACY_HERO_IDS: Readonly<Record<string, HeroId>> = {
  maren: 'knight',
  rivet: 'engineer',
  kesh: 'hunter',
  vesper: 'trapper',
  quill: 'assassin',
  ilvane: 'totemist',
  sehra: 'barbarian',
  astra: 'spellblade',
  mire: 'necromancer',
  kp: 'drunkard',
};

/**
 * Cards taken out of the game, and the card each becomes wherever an old save or deck still holds it (DECISIONS #312): a run, a
 * saved Arena deck, a ghost. Its Sanctum roll, engraving and upgrade carry over ("hi~heel+" becomes "hi~thick-hide+").
 */
export const RETIRED_CARDS: Readonly<Record<string, string>> = {
  'guard-dog': 'rend',
  heel: 'thick-hide',
  'call-gnashlings': 'thick-hide',
  howl: 'pack-tactics',
};

/** A card id as it is now: a retired card becomes its replacement, keeping its roll, engraving and upgrade; anything else is unchanged. */
export function canonicalCard(id: string): string {
  const m = /^((?:hi|lo)~)?((?:hold|opening|flare)\^)?(.+?)(\+?)$/.exec(id);
  const now = m ? RETIRED_CARDS[m[3] as string] : undefined;
  return m && now ? `${m[1] ?? ''}${m[2] ?? ''}${now}${m[4] ?? ''}` : id;
}

/** A Riftwalker id as it is now: an old id becomes its class id, and anything else comes back as it was. */
export function canonicalHero(id: string): string {
  return Object.hasOwn(LEGACY_HERO_IDS, id) ? (LEGACY_HERO_IDS[id] as string) : id;
}

/** The playable realms in the order every screen lists them, with the name players read. */
export const REALMS: { id: RealmId; name: string }[] = [
  { id: 'aurelion', name: 'Aurelion' },
  { id: 'nexus', name: 'Nexus-9' },
  { id: 'wyldmaw', name: 'Wyldmaw' },
  { id: 'umbral', name: 'Umbral Veil' },
  { id: 'starfall', name: 'The Hollow Crown' },
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
