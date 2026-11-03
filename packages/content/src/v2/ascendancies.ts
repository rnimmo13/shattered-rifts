// Ascendancies (DECISIONS #519): the reward for beating Tier III's last Warden, in place of its usual Gift. A Riftwalker takes one of
// three and becomes that class for the rest of the run: the name changes (Knight to Paladin), and a new trait sits beside the old one,
// leaning the deck one way. The banked deck keeps it, so it goes to the Arena and to ghosts. Numbers are a first pass.

import type { CombatDb, HeroDef, HeroTrait, Op } from '@sr/combat';
import {
  barrier,
  dmg,
  draw,
  growHp,
  heal,
  mana,
  on,
  per,
  raise,
  scaled,
  status,
  stars,
} from './build';

export interface Ascendancy {
  /** `<hero>:<name>`, so a class named after another's id can never be taken for it */
  id: string;
  hero: string;
  /** the class it becomes */
  name: string;
  /** what it gives, as the player reads it */
  text: string;
  /** the way it leans, in a word or two */
  leans: string;
  fightStart?: Op[];
  turnStart?: Op[];
  triggers?: NonNullable<HeroTrait['triggers']>;
  /** fields of the base trait it replaces */
  set?: Partial<Pick<HeroTrait, 'maxReserves' | 'shareMight' | 'clutch' | 'keepBarrier'>>;
  /** companions it starts every fight with, on top of the class's */
  startUnits?: HeroDef['startUnits'];
  /** companion slots, in place of the class's (DECISIONS #569) */
  maxAllies?: number;
}

const a = (
  hero: string,
  name: string,
  leans: string,
  text: string,
  rest: Omit<Ascendancy, 'id' | 'hero' | 'name' | 'leans' | 'text'>,
): Ascendancy => ({
  id: `${hero}:${name.toLowerCase().replace(/[^a-z]+/g, '-')}`,
  hero,
  name,
  leans,
  text,
  ...rest,
});

export const ASCENDANCIES: readonly Ascendancy[] = [
  a(
    'knight',
    'Paladin',
    'Barrier',
    // (60% of it, not Fortified's 75%: always Fortified was a free rare, DECISIONS #545; a card that Fortifies still keeps 75%)
    'You keep 60% of your Barrier at the start of your turn (Fortified still keeps 75%).',
    {
      set: { keepBarrier: 60 },
    },
  ),
  a(
    'knight',
    'Marshal',
    'Reserves',
    // (Max Reserves 4, was 5, DECISIONS #545)
    'Max Reserves 4. At the start of your turn, gain Primed equal to your Reserves.',
    {
      set: { maxReserves: 4 },
      turnStart: [scaled(status('vigor', 0), per('reserves'))],
    },
  ),
  a(
    'knight',
    'Blood Knight',
    'Paying blood',
    // (once a round, not once a turn: the enemy's turn is a turn too, so it gave 2 Might a round, DECISIONS #542; and 3 a fight at most,
    // as Might kept on rising in a long fight, #544)
    "The first time you lose HP each round (your turn and the enemy's), gain 1 Might, up to 3 Might a fight.",
    {
      triggers: [on('hurt', [status('might', 1)], { round: true, times: 3 })],
    },
  ),

  a(
    'engineer',
    'Foreman',
    'Many machines',
    // (25% more, not 1 more: a flat point was nothing against Tier XX, DECISIONS #542)
    "Start each fight with a second Drone. Your companions' attacks deal 25% more damage.",
    {
      startUnits: [{ unit: 'drone', hp: 6 }],
      fightStart: [{ op: 'allyPct', amount: 25 }],
    },
  ),
  a(
    'engineer',
    'Golemancer',
    'One big machine',
    // (3, was 2, DECISIONS #545)
    'At the start of your turn, your companions gain 3 more max HP.',
    {
      turnStart: [growHp(3, 'allAllies')],
    },
  ),
  // (the Overclocker until DECISIONS #569: the only class with a 4th companion slot; 1 Primed each, was 2, as there can be one more
  // to take it)
  a(
    'engineer',
    'Swarmwright',
    'A fourth machine',
    'You have a 4th companion slot. At the start of your turn, each of your companions gains 1 Primed.',
    {
      maxAllies: 4,
      turnStart: [status('vigor', 1, 'allAllies')],
    },
  ),

  // (three quarters, not all of it: the full share rose with the hero's Might all fight, DECISIONS #544)
  a(
    'hunter',
    'Beastmaster',
    'The pack',
    'Your companions share three quarters of your Might, not half.',
    {
      set: { shareMight: 0.75 },
    },
  ),
  a(
    'hunter',
    'Reaver',
    'Paying blood',
    // (and 2 Primed, DECISIONS #545)
    'The first time each turn one of your own effects costs you HP, draw 1 card and gain 2 Primed.',
    {
      triggers: [on('loseHp', [draw(1), status('vigor', 2)], { once: true })],
    },
  ),
  a(
    'hunter',
    'Predator',
    'Big turns',
    // (2, was 1: Primed loses half each turn now, DECISIONS #533, #545)
    'Whenever you draw a card during your turn, gain 2 Primed.',
    {
      triggers: [on('drawMidTurn', [status('vigor', 2)])],
    },
  ),

  a(
    'trickster',
    'Trapmaster',
    'Traps',
    // (2 Barrier, was 3, DECISIONS #545)
    'Whenever one of your Traps springs, draw 1 card and gain 2 Barrier.',
    {
      triggers: [on('snare', [draw(1), barrier(2)])],
    },
  ),
  a('trickster', 'Cardsharp', 'Suits', 'A Full Trick also gives you 1 Mana.', {
    triggers: [on('allSuits', [mana(1)])],
  }),
  a('trickster', 'Seer', 'Exposed', 'At the start of your turn, a random enemy gains 1 Exposed.', {
    turnStart: [status('exposed', 1, 'randomFoe')],
  }),

  // (the class is the Rogue; the Assassin is what one can become, DECISIONS #519)
  a(
    'assassin',
    'Assassin',
    'Daggers',
    // (10%, was 25%: a percentage that grew with the deck, DECISIONS #544)
    'Your Daggers deal 2 more damage, and your first Attack each turn deals 10% more.',
    {
      fightStart: [status('edge', 2), status('lethality', 10)],
    },
  ),
  a(
    'assassin',
    'Bladedancer',
    'A hand of knives',
    'At the start of your turn, add a second Dagger to your hand.',
    {
      turnStart: [{ op: 'addCard', card: 'sleeve-knife', to: 'hand', side: 'self' }],
    },
  ),
  a(
    'assassin',
    'Bloodletter',
    'Bleed',
    'Bleed and Burn on your enemies deal their damage one more time each turn, losing 1 for it.',
    {
      fightStart: [status('virulent', 1)],
    },
  ),

  // (1 Spirit and 8 Barrier, was 2 Spirit: a second Spirit from the first turn was the strongest start in the game, DECISIONS #545)
  a('shaman', 'Totemist', 'Totems', 'Start each fight with 1 Spirit and 8 Barrier.', {
    fightStart: [status('spirit', 1), barrier(8)],
  }),
  a(
    'shaman',
    'Spiritwalker',
    'Commands',
    // (4 Barrier, was 2, DECISIONS #545)
    'The first time a totem acts each turn on your order or as it leaves the row, draw 1 card and gain 4 Barrier.',
    {
      triggers: [on('command', [draw(1), barrier(4)], { once: true })],
    },
  ),
  // (the Elementalist took the Pyromancer's place, DECISIONS #542: one burst for each element the first time it is cast each turn)
  a(
    'shaman',
    'Elementalist',
    'Elements',
    'The first time each turn you cast a Flame card, a random enemy gains 3 Burn; a Frost card, gain 3 Barrier; a Storm card, deal 2 damage to ALL enemies.',
    {
      triggers: [
        on('play', [status('burn', 3, 'randomFoe')], { tag: 'flame', once: true }),
        // (3 and 2, were 4 and 3: casting two elements a turn made it the strongest start, DECISIONS #545)
        on('play', [barrier(3)], { tag: 'frost', once: true }),
        on('play', [dmg(2, 'allFoes')], { tag: 'storm', once: true }),
      ],
    },
  ),

  a('monk', 'Sage', 'Serene', 'The first time each turn you leave Serene, gain 1 more Mana.', {
    triggers: [on('stanceLeft', [mana(1)], { stance: 'calm', once: true })],
  }),
  // (the first time each turn: Fury loops made 14-22 Barrier a turn, DECISIONS #542)
  a('monk', 'Zealot', 'Fury', 'The first time each turn you enter Fury, gain 6 Barrier.', {
    triggers: [on('stance', [barrier(6)], { stance: 'wrath', once: true })],
  }),
  // (the first stance each turn, not every one: a Flow deck reached Radiant every turn, DECISIONS #544)
  a(
    'monk',
    'Sunwalker',
    'Radiant',
    'The first time each turn you enter a stance, gain 1 more Fervor.',
    {
      triggers: [on('stance', [status('mantra', 1)], { once: true })],
    },
  ),

  // (Keen 1 and a card for the first Sword each turn, was Keen 2, DECISIONS #545)
  a(
    'spellblade',
    'Blademaster',
    'Swords',
    'Every hit of your Swords deals 1 more damage, and the first Sword you play each turn draws 1 card.',
    {
      fightStart: [status('keen', 1)],
      triggers: [on('play', [draw(1)], { tag: 'sword', once: true })],
    },
  ),
  a(
    'spellblade',
    'Archmage',
    'Spells',
    // (20% more on the first Attack, not 1 more per point spent: what a late deck spends kept on growing, DECISIONS #544)
    'Start each fight with 3 more Spell Power. Your first Attack each turn deals 20% more.',
    {
      fightStart: [stars(3), status('lethality', 20)],
    },
  ),
  // (15% more, not 5 more: a percentage grows as the Shatters do, DECISIONS #542)
  a('spellblade', 'Shatterer', 'Fracture', 'Every Shatter deals 15% more damage.', {
    fightStart: [{ op: 'shatterUp', amount: 0, pct: 15 }],
  }),

  // (and 1 Might for the turn, DECISIONS #545)
  a(
    'drunkard',
    'Brewmaster',
    'Hangover',
    'At the start of your turn, heal 2 HP and gain 1 Might for the turn.',
    {
      turnStart: [heal(2, 'self'), status('might', 1, 'self', true)],
    },
  ),
  // (and 2 sharper every turn: 3 once was less than a common card, DECISIONS #542)
  a(
    'drunkard',
    'Gunslinger',
    'The Gun',
    'The Old Twelve Gauge starts each fight 3 sharper, and grows 2 sharper at the start of each of your turns.',
    {
      fightStart: [{ op: 'forge', card: 'old-twelve-gauge', amount: 3 }],
      turnStart: [{ op: 'forge', card: 'old-twelve-gauge', amount: 2 }],
    },
  ),
  a(
    'drunkard',
    'Deathwish',
    'Low HP',
    // (1.25%, and at most +100%: uncapped at 2%, Hangover took him to 10% HP for +180%, DECISIONS #542, #544; never less than
    // the class's own 1%)
    'Clutch Genes gives 1.25% more attack damage for every 1% of your HP you are missing, up to 100% more.',
    {
      set: { clutch: { perMissingPct: 1.25, max: 100 } },
    },
  ),

  a(
    'necromancer',
    'Bonelord',
    'Thralls',
    'At the start of your turn, Raise 1 more. Your companions deal 1 more damage.',
    {
      turnStart: [raise(1)],
      fightStart: [status('marrow', 1)],
    },
  ),
  a(
    'necromancer',
    'Fateweaver',
    'Fate',
    // (2 and a share of the enemy's max HP: a flat 3 was nothing against Tier XX, DECISIONS #542; 5% was too much late, #544)
    'At the start of your turn, curse a random enemy with 2 Fate, plus 2% of its max HP.',
    {
      turnStart: [scaled(status('doom', 2, 'randomFoe'), per('maxHp', 0.02, 'each'))],
    },
  ),
  // (4, was 2, DECISIONS #545)
  a('necromancer', 'Soulreaper', 'Consume', 'Whenever a card is consumed, gain 4 Barrier.', {
    triggers: [on('exhaust', [barrier(4)])],
  }),
];

/** The three a Riftwalker can choose from. */
export const ascendanciesOf = (hero: string): Ascendancy[] =>
  ASCENDANCIES.filter((x) => x.hero === hero);

/** Ascendancies that have been replaced: a run, deck or ghost saved with the old one has the new one (DECISIONS #542). */
const RENAMED: Readonly<Record<string, string>> = {
  'shaman:pyromancer': 'shaman:elementalist',
  'engineer:overclocker': 'engineer:swarmwright',
};

/** One of a Riftwalker's own Ascendancies (a replaced one read as what replaced it), or undefined for anything else (a made-up id). */
export function ascendancyOf(hero: string, id: unknown): Ascendancy | undefined {
  if (typeof id !== 'string') return undefined;
  const now = RENAMED[id] ?? id;
  return ASCENDANCIES.find((x) => x.id === now && x.hero === hero);
}

/** The hero as an Ascendancy makes it: its name, its trait with the new one added. */
export function ascendedHero(base: HeroDef, x: Ascendancy): HeroDef {
  const trait = base.trait;
  return {
    ...base,
    name: x.name,
    ...(x.maxAllies ? { maxAllies: x.maxAllies } : {}),
    ...(x.startUnits ?{ startUnits: [...(base.startUnits ?? []), ...x.startUnits] } : {}),
    trait: {
      ...trait,
      ...x.set,
      name: trait?.name ?? x.name,
      text: `${trait?.text ?? ''} ${x.name}: ${x.text}`.trim(),
      ...(x.fightStart || trait?.fightStart
        ? { fightStart: [...(trait?.fightStart ?? []), ...(x.fightStart ?? [])] }
        : {}),
      ...(x.turnStart || trait?.turnStart
        ? { turnStart: [...(trait?.turnStart ?? []), ...(x.turnStart ?? [])] }
        : {}),
      ...(x.triggers || trait?.triggers
        ? { triggers: [...(trait?.triggers ?? []), ...(x.triggers ?? [])] }
        : {}),
    },
  };
}

export const ascendedHeroes = (heroes: CombatDb['heroes']): Record<string, HeroDef> => {
  const out: Record<string, HeroDef> = Object.fromEntries(
    ASCENDANCIES.flatMap((x) => {
      const base = heroes[x.hero];
      return base ? [[x.id, ascendedHero(base, x)]] : [];
    }),
  );
  // (a replaced one's old id, kept in a saved ghost or a server row, plays as what replaced it: DECISIONS #542)
  for (const [old, now] of Object.entries(RENAMED)) if (out[now]) out[old] = out[now];
  return out;
};
