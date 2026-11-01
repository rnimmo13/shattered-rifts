// Ascendancies (DECISIONS #519): the reward for beating Tier III's last Warden, in place of its usual Gift. A Riftwalker takes one of
// three and becomes that class for the rest of the run: the name changes (Knight to Paladin), and a new trait sits beside the old one,
// leaning the deck one way. The banked deck keeps it, so it goes to the Arena and to ghosts. Numbers are a first pass.

import type { CombatDb, HeroDef, HeroTrait, Op } from '@sr/combat';
import { barrier, draw, growHp, heal, mana, on, per, raise, scaled, status, stars } from './build';

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
  set?: Partial<Pick<HeroTrait, 'maxReserves' | 'shareMight' | 'clutch'>>;
  /** companions it starts every fight with, on top of the class's */
  startUnits?: HeroDef['startUnits'];
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
    'You are Fortified: you keep 75% of your Barrier at the start of your turn.',
    {
      fightStart: [status('fortified', 1)],
    },
  ),
  a(
    'knight',
    'Marshal',
    'Reserves',
    'Max Reserves 5. At the start of your turn, gain Primed equal to your Reserves.',
    {
      set: { maxReserves: 5 },
      turnStart: [scaled(status('vigor', 0), per('reserves'))],
    },
  ),
  a(
    'knight',
    'Blood Knight',
    'Paying blood',
    'The first time you lose HP each turn, gain 1 Might.',
    {
      triggers: [on('hurt', [status('might', 1)], { once: true })],
    },
  ),

  a(
    'engineer',
    'Foreman',
    'Many machines',
    'Start each fight with a second Drone. Your companions deal 1 more damage.',
    {
      startUnits: [{ unit: 'drone', hp: 6 }],
      fightStart: [status('marrow', 1)],
    },
  ),
  a(
    'engineer',
    'Golemancer',
    'One big machine',
    'At the start of your turn, your companions gain 2 more max HP.',
    {
      turnStart: [growHp(2, 'allAllies')],
    },
  ),
  a(
    'engineer',
    'Overclocker',
    'Primed machines',
    'At the start of your turn, each of your companions gains 2 Primed.',
    {
      turnStart: [status('vigor', 2, 'allAllies')],
    },
  ),

  a('hunter', 'Beastmaster', 'The pack', 'Your companions share all of your Might, not half.', {
    set: { shareMight: 1 },
  }),
  a(
    'hunter',
    'Reaver',
    'Paying blood',
    'The first time each turn one of your own effects costs you HP, draw 1 card.',
    {
      triggers: [on('loseHp', [draw(1)], { once: true })],
    },
  ),
  a(
    'hunter',
    'Predator',
    'Big turns',
    'Whenever you draw a card during your turn, gain 1 Primed.',
    {
      triggers: [on('drawMidTurn', [status('vigor', 1)])],
    },
  ),

  a(
    'trickster',
    'Trapmaster',
    'Traps',
    'Whenever one of your Traps springs, draw 1 card and gain 3 Barrier.',
    {
      triggers: [on('snare', [draw(1), barrier(3)])],
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
    'Your Daggers deal 2 more damage, and your first Attack each turn deals 25% more.',
    {
      fightStart: [status('edge', 2), status('lethality', 25)],
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

  a('shaman', 'Totemist', 'Totems', 'Start each fight with 2 Spirit.', {
    fightStart: [status('spirit', 2)],
  }),
  a(
    'shaman',
    'Spiritwalker',
    'Commands',
    'The first time a totem acts each turn on your order or as it leaves the row, draw 1 card and gain 2 Barrier.',
    {
      triggers: [on('command', [draw(1), barrier(2)], { once: true })],
    },
  ),
  a('shaman', 'Pyromancer', 'Burn', 'At the start of your turn, a random enemy gains 2 Burn.', {
    turnStart: [status('burn', 2, 'randomFoe')],
  }),

  a('monk', 'Sage', 'Serene', 'The first time each turn you leave Serene, gain 1 more Mana.', {
    triggers: [on('stanceLeft', [mana(1)], { stance: 'calm', once: true })],
  }),
  a('monk', 'Zealot', 'Fury', 'Whenever you enter Fury, gain 6 Barrier.', {
    triggers: [on('stance', [barrier(6)], { stance: 'wrath' })],
  }),
  a('monk', 'Sunwalker', 'Radiant', 'Whenever you enter a stance, gain 1 more Fervor.', {
    triggers: [on('stance', [status('mantra', 1)])],
  }),

  a('spellblade', 'Blademaster', 'Swords', 'Every hit of your Swords deals 2 more damage.', {
    fightStart: [status('keen', 2)],
  }),
  a(
    'spellblade',
    'Archmage',
    'Spells',
    'Start each fight with 3 more Spell Power. Your first Spell Attack each turn that spends Spell Power deals 1 more per point spent.',
    {
      fightStart: [stars(3), status('ruinous', 1)],
    },
  ),
  a('spellblade', 'Shatterer', 'Fracture', 'Every Shatter deals 5 more damage.', {
    fightStart: [{ op: 'shatterUp', amount: 5 }],
  }),

  a('drunkard', 'Brewmaster', 'Hangover', 'At the start of your turn, heal 2 HP.', {
    turnStart: [heal(2, 'self')],
  }),
  a('drunkard', 'Gunslinger', 'The Gun', 'The Old Twelve Gauge starts each fight 3 sharper.', {
    fightStart: [{ op: 'forge', card: 'old-twelve-gauge', amount: 3 }],
  }),
  a(
    'drunkard',
    'Deathwish',
    'Low HP',
    'Clutch Genes gives 2% more attack damage for every 1% of your HP you are missing.',
    {
      set: { clutch: { perMissingPct: 2 } },
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
    'At the start of your turn, curse a random enemy with 3 Fate.',
    {
      turnStart: [status('doom', 3, 'randomFoe')],
    },
  ),
  a('necromancer', 'Soulreaper', 'Consume', 'Whenever a card is consumed, gain 2 Barrier.', {
    triggers: [on('exhaust', [barrier(2)])],
  }),
];

/** The three a Riftwalker can choose from. */
export const ascendanciesOf = (hero: string): Ascendancy[] =>
  ASCENDANCIES.filter((x) => x.hero === hero);

/** One of a Riftwalker's own Ascendancies, or undefined for anything else (a retired one, a made-up id). */
export function ascendancyOf(hero: string, id: unknown): Ascendancy | undefined {
  return typeof id === 'string'
    ? ASCENDANCIES.find((x) => x.id === id && x.hero === hero)
    : undefined;
}

/** The hero as an Ascendancy makes it: its name, its trait with the new one added. */
export function ascendedHero(base: HeroDef, x: Ascendancy): HeroDef {
  const trait = base.trait;
  return {
    ...base,
    name: x.name,
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

export const ascendedHeroes = (heroes: CombatDb['heroes']): Record<string, HeroDef> =>
  Object.fromEntries(
    ASCENDANCIES.flatMap((x) => {
      const base = heroes[x.hero];
      return base ? [[x.id, ascendedHero(base, x)]] : [];
    }),
  );
