// Ascendancies (DECISIONS #519): the reward for beating Tier III's last Warden, in place of its usual Gift. A Riftwalker takes one of
// three and becomes that class for the rest of the run: the name changes (Knight to Paladin), and a new trait sits beside the old one,
// leaning the deck one way. The banked deck keeps it in Arena and ghosts. The identity pass is documented in DECISIONS #580.

import type { CombatDb, HeroDef, HeroTrait, Op } from '@sr/combat';
import { barrier, draw, growHp, mana, on, per, raise, scaled, status, stars } from './build';

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
    'Max Reserves 4. Your Attacks deal 10% more damage per Reserve spent this turn, up to 40% more.',
    {
      set: { maxReserves: 4 },
      fightStart: [{ op: 'discipline', rule: { kind: 'reserves', perSpent: 10, cap: 40 } }],
    },
  ),
  a(
    'knight',
    'Blood Knight',
    'Retaliation',
    'Actual HP lost charges Retaliation: +2% damage on your next Attack per 1% of max HP lost. Charge up to 30% each round and store up to 60%. The Attack spends the charge.',
    {
      fightStart: [
        { op: 'discipline', rule: { kind: 'retaliation', perLostPct: 2, roundCap: 30, cap: 60 } },
      ],
    },
  ),

  a(
    'engineer',
    'Artillerist',
    'Personal weapons',
    'At the start of your turn, gain 1 Might. The first Attack you play on your turn gives you 3 Barrier.',
    {
      turnStart: [status('might', 1)],
      triggers: [on('play', [barrier(3)], { filter: 'attack', once: true, ownTurn: true })],
    },
  ),
  a(
    'engineer',
    'Golemancer',
    'One big machine',
    // (3, was 2, DECISIONS #545)
    'At the start of your turn, your companions gain 3 more max HP. Heavy and Colossal companions deal 1% more attack damage per max HP, up to 100% more.',
    {
      turnStart: [growHp(3, 'allAllies')],
      fightStart: [{ op: 'discipline', rule: { kind: 'frame', minSlots: 2, perHp: 1, cap: 100 } }],
    },
  ),
  // (the Overclocker until DECISIONS #569: the only class with a 4th companion slot; 1 Primed each, was 2, as there can be one more
  // to take it)
  a(
    'engineer',
    'Swarmwright',
    'A fourth machine',
    'You have a 4th companion slot. At the start of your turn, each companion gains 1 Primed. Fabrication: your companions deal +1 attack damage per hit for every 4 companions summoned this fight. Starting companions do not count; replacements keep the bonus.',
    {
      maxAllies: 4,
      turnStart: [status('vigor', 1, 'allAllies')],
      fightStart: [{ op: 'attackAura', amount: 0, scope: 'companions', perSummons: 4 }],
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
  a(
    'trickster',
    'Seer',
    'Marked prey',
    'Your first damaging aimed Attack each turn marks its enemy and applies 1 Exposed. Keeping the same mark builds +10% attack damage against it each qualifying turn, up to +50%; choosing a new mark restarts at +10%.',
    {
      fightStart: [
        { op: 'discipline', rule: { kind: 'pursuit', perTurn: 10, cap: 50, exposed: 1 } },
      ],
    },
  ),

  // (the class is the Rogue; the Assassin is what one can become, DECISIONS #519)
  a(
    'assassin',
    'Assassin',
    'Preparation and execution',
    'Each Skill you finish on your turn prepares +15% damage for your next Attack, up to +60%. Your Attacks also deal 20% more damage against enemies at half HP or less. These bonuses add together.',
    {
      fightStart: [
        {
          op: 'discipline',
          rule: { kind: 'execution', perSkill: 15, cap: 60, woundedPct: 50, bonus: 20 },
        },
      ],
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
  a(
    'shaman',
    'Totemist',
    'Cultivating totems',
    'Start each fight with 1 Spirit and 8 Barrier. End your turn with at least two totems standing, without commanding or pushing any out that turn, to gain 1 Spirit.',
    {
      fightStart: [
        status('spirit', 1),
        barrier(8),
        { op: 'discipline', rule: { kind: 'cultivation', minimum: 2, spirit: 1 } },
      ],
    },
  ),
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
    'The first Flame, Frost and Storm card you finish on your turn gives 3 Burn to a random enemy, 3 Barrier, or 2 damage to ALL enemies respectively. Each element’s bonus grows by 1 each time it triggers this fight. Switching from the last triggered element adds 2 to that bonus.',
    {
      fightStart: [
        { op: 'discipline', rule: { kind: 'elements', flame: 3, frost: 3, storm: 2, sequence: 2 } },
      ],
    },
  ),

  a('monk', 'Sage', 'Serene', 'The first time each turn you leave Serene, gain 1 more Mana.', {
    triggers: [on('stanceLeft', [mana(1)], { stance: 'calm', once: true })],
  }),
  // (the first time each turn: Fury loops made 14-22 Barrier a turn, DECISIONS #542)
  a(
    'monk',
    'Zealot',
    'Controlled Fury',
    'Your first Fury entry on your turn builds +8% attack damage while in Fury, up to +40% this fight. Your first Fury exit on your turn gives 4 Barrier plus 2 per earned step of that growth.',
    {
      fightStart: [
        { op: 'discipline', rule: { kind: 'fury', perEntry: 8, cap: 40, barrier: 4, perExit: 2 } },
      ],
    },
  ),
  // (the first stance each turn, not every one: a Flow deck reached Radiant every turn, DECISIONS #544)
  a(
    'monk',
    'Sunwalker',
    'Radiant',
    'The first time each turn you enter a stance, gain 1 more Fervor. Your first Radiant exit on your turn returns 2 Fervor; each later qualifying exit this fight returns 1 more, up to 4.',
    {
      triggers: [on('stance', [status('mantra', 1)], { once: true })],
      fightStart: [{ op: 'discipline', rule: { kind: 'radiance', first: 2, step: 1, cap: 4 } }],
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
    'Start each fight with 3 more Spell Power. Your first Spell Attack each turn that spends Spell Power deals 1 extra damage per point spent on every hit. Half that expenditure, rounded down, returns next turn.',
    {
      fightStart: [
        stars(3),
        { op: 'discipline', rule: { kind: 'spellCycle', perSpent: 1, refundDivisor: 2 } },
      ],
    },
  ),
  // (15% more, not 5 more: a percentage grows as the Shatters do, DECISIONS #542)
  a('spellblade', 'Shatterer', 'Fracture', 'Every Shatter deals 15% more damage.', {
    fightStart: [{ op: 'shatterUp', amount: 0, pct: 15 }],
  }),

  a(
    'drunkard',
    'Brewmaster',
    'Hangover',
    'Your first actual Hangover payment on your turn builds 1 Fermentation, up to 5. At the end of your turn, each Fermentation heals 1% of your max HP and gives 2 Barrier. Fermentation lasts for the fight.',
    {
      fightStart: [{ op: 'discipline', rule: { kind: 'brewing', cap: 5, healPct: 1, barrier: 2 } }],
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
    'At 40% HP or less, your Attacks deal 25% more damage, on top of ordinary Clutch Genes. Once each fight, a lethal enemy attack leaves you at 1 HP and gives Barrier equal to 10% of your max HP. Later hits can still kill you.',
    {
      fightStart: [
        {
          op: 'discipline',
          rule: { kind: 'desperation', threshold: 40, bonus: 25, emergencyBarrierPct: 10 },
        },
      ],
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
  a(
    'necromancer',
    'Soulreaper',
    'Harvest of Souls',
    'Whenever a card is consumed, gain 3 Barrier. At the end of your turn, after Fleeting cards are consumed and companions act, if you consumed any cards that turn, Reap the lowest-HP enemy for 4 damage plus 2 per card consumed this fight. Reap is non-attack damage and Barrier can absorb it.',
    {
      fightStart: [{ op: 'discipline', rule: { kind: 'harvest', base: 4, perConsumed: 2 } }],
      triggers: [on('exhaust', [barrier(3)])],
    },
  ),
];

/** The three a Riftwalker can choose from. */
export const ascendanciesOf = (hero: string): Ascendancy[] =>
  ASCENDANCIES.filter((x) => x.hero === hero);

/** Ascendancies that have been replaced: a run, deck or ghost saved with the old one has the new one (DECISIONS #542). */
const RENAMED: Readonly<Record<string, string>> = {
  'engineer:foreman': 'engineer:artillerist',
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
    ...(x.startUnits ? { startUnits: [...(base.startUnits ?? []), ...x.startUnits] } : {}),
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
