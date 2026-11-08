// Ascendancies (DECISIONS #519): the reward for beating Tier III's last Warden, in place of its usual Gift. A Riftwalker takes one of
// three and becomes that class for the rest of the run: the name changes (Knight to Paladin), and a new trait sits beside the old one,
// leaning the deck one way. The banked deck keeps it in Arena and ghosts. The identity pass is documented in DECISIONS #580.

import type { CombatDb, HeroDef, HeroTrait, Op } from '@sr/combat';
import {
  barrier,
  deathBurst,
  draw,
  growHp,
  mana,
  on,
  per,
  plant,
  scaled,
  status,
  stars,
  reserves,
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
  /** (#692) what the class trait's own turn-start does instead (the Rogue's Hidden Blades gives the Ascendancy's own token) */
  traitTurnStart?: Op[];
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
    'Max Reserves 4. At the start of your turn, gain 1 Reserve. Your Attacks deal 10% more damage per Reserve spent this turn, up to 40% more.',
    {
      set: { maxReserves: 4 },
      turnStart: [reserves(1)],
      fightStart: [{ op: 'discipline', rule: { kind: 'reserves', perSpent: 10, cap: 40 } }],
    },
  ),
  a(
    'knight',
    'Blood Knight',
    'Retaliation',
    'Actual HP lost charges Retaliation: +2% damage on your next Attack per 1% of max HP lost. Your first actual HP payment from your own card effects on your turn charges 10% more. Charge up to 30% each round and store up to 60%. The Attack spends the charge.',
    {
      fightStart: [
        {
          op: 'discipline',
          rule: { kind: 'retaliation', perLostPct: 2, roundCap: 30, cap: 60, paymentBonus: 10 },
        },
      ],
    },
  ),

  a(
    'engineer',
    'Artillerist',
    'Personal weapons',
    // (up to 12 Might from it, the first 6 turns: uncapped it ran away in long Arena fights, DECISIONS #685)
    'At the start of your first 6 turns, gain 2 Might (up to 12). The first Attack you play on your turn gives you 6 Barrier.',
    {
      triggers: [
        on('turnStart', [status('might', 2)], { times: 6 }),
        on('play', [barrier(6)], { filter: 'attack', once: true, ownTurn: true }),
      ],
    },
  ),
  a(
    'engineer',
    'Golemancer',
    'One big machine',
    // (3, was 2, DECISIONS #545)
    "At the start of your turn, your companions gain 3 more max HP, then you gain Barrier equal to 10% of your largest companion's max HP, rounded down, up to 12. Heavy and Colossal companions deal 1% more attack damage per max HP, up to 100% more. When one dies, save half its earned max HP growth, up to 30, for your next new Heavy or Colossal build this fight. Inherited growth does not count. Scrapping and revivals do not use this reserve.",
    {
      turnStart: [
        growHp(3, 'allAllies'),
        scaled(barrier(0), { by: 'biggestAlly', mult: 0.1, max: 12 }),
      ],
      fightStart: [
        {
          op: 'discipline',
          rule: { kind: 'frame', minSlots: 2, perHp: 1, cap: 100, recoverPct: 50, recoverCap: 30 },
        },
      ],
    },
  ),
  // (the Overclocker until DECISIONS #569: the only class with a 4th companion slot; 1 Primed each, was 2, as there can be one more
  // to take it)
  a(
    'engineer',
    'Swarmwright',
    'A fourth machine',
    'You have a 4th companion slot. At the start of your turn, each companion gains 1 Primed. Your first 3 successful summons on your turn each give you 3 Barrier. Fabrication: your companions deal +1 attack damage per hit for every 3 companions summoned this fight. Starting companions do not count; replacements keep the bonus.',
    {
      maxAllies: 4,
      triggers: [on('summon', [barrier(3)], { ownTurn: true, perTurnLimit: 3 })],
      turnStart: [status('vigor', 1, 'allAllies')],
      fightStart: [{ op: 'attackAura', amount: 0, scope: 'companions', perSummons: 3 }],
    },
  ),

  // (three quarters, not all of it: the full share rose with the hero's Might all fight, DECISIONS #544)
  a(
    'hunter',
    'Beastmaster',
    'The pack',
    // (all your Might, and companions that grow every turn, so a pack can win on its own; the Might stops at 10: Robert 2026-11-08, #693)
    'Your companions share all your Might. At the start of your turn, each of your companions gains 2 max HP, and in your first 10 turns you gain 1 Might.',
    {
      set: { shareMight: 1 },
      turnStart: [growHp(2, 'allAllies')],
      triggers: [on('turnStart', [status('might', 1)], { times: 10 })],
    },
  ),
  a(
    'hunter',
    'Reaver',
    'Paying blood',
    // (and 2 Primed, DECISIONS #545)
    // (and 1 Might, DECISIONS #685: something that grows; a more distinct Reaver is still wanted)
    // (Bloodlust, modelled on the Blood Knight's scaling: what he pays is kept as Might, up to 12, and he heals when low, so paying HP
    // is fuel he can survive: Robert 2026-11-08, #693)
    'Bloodlust: every 3 HP your own effects cost you gives 1 Might for the rest of the fight (up to 12). The first time each turn one of your own effects costs you HP, draw 1 card and gain 4 Barrier. At half HP or less, your Attacks heal you for 20% of the HP they take off.',
    {
      fightStart: [
        {
          op: 'discipline',
          rule: { kind: 'bloodlust', perHp: 3, cap: 12, healPct: 20, lowPct: 50 },
        },
      ],
      triggers: [on('loseHp', [draw(1), barrier(4)], { once: true })],
    },
  ),
  a(
    'hunter',
    'Predator',
    'Big turns',
    // (2, was 1: Primed loses half each turn now, DECISIONS #533, #545)
    // (Ambush, the Assassin's Preparation built by draws, and Exposed that draws: two ways to win, Robert 2026-11-08, #693)
    'Ambush: each card you draw on your turn after your opening hand adds 10% to your next Attack (up to 60%). That Attack uses it all, even a free one, and Ambush waits for you across turns. The first time each turn you apply Exposed, draw 1 card.',
    {
      fightStart: [
        { op: 'discipline', rule: { kind: 'execution', perDraw: 10, cap: 60, name: 'Ambush' } },
      ],
      triggers: [on('exposeFoe', [draw(1)], { once: true, ownTurn: true })],
    },
  ),

  a(
    'trickster',
    'Trapmaster',
    'Traps',
    // (2 Barrier, was 3, DECISIONS #545; two more Traps and Trap damage that grows, DECISIONS #685)
    // (Trap damage and Trap control both grow through the fight: 10% a Trap up to double, and a Barrier that grows with every Trap
    // sprung. Robert 2026-11-08, #694)
    'You can have 2 more Traps set. Whenever one of your Traps springs, draw 1 card and gain 2 Barrier, plus 1 for every Trap sprung this fight (up to 8 more). Your Traps deal 10% more damage for each of your Traps sprung before it this fight, up to 100% more.',
    {
      fightStart: [
        { op: 'snareSlot', amount: 2 },
        { op: 'discipline', rule: { kind: 'snarecraft', perSprung: 10, cap: 100 } },
      ],
      triggers: [on('snare', [draw(1), scaled(barrier(2), { by: 'snaresSprung', max: 8 })])],
    },
  ),
  // (and 1 Might, DECISIONS #685)
  // (2 Might, up to 12, and a draw at 3 suits so Full Tricks come reliably: Robert 2026-11-08, #694)
  a(
    'trickster',
    'Cardsharp',
    'Suits',
    'A Full Trick also gives you 1 Mana and 2 Might (up to 12 Might this way). The first time each turn you have shown 3 suits, draw 1 card.',
    {
      triggers: [
        on('allSuits', [mana(1)]),
        on('allSuits', [status('might', 2)], { times: 6 }),
        on('play', [draw(1)], { once: true, ownTurn: true, only: { by: 'suits', atLeast: 3 } }),
      ],
    },
  ),
  a(
    'trickster',
    'Seer',
    'Marked prey',
    // (when the mark dies, the next keeps the bonus, #694)
    'Your first damaging aimed Attack each turn marks its enemy and applies 1 Exposed. Keeping the same mark builds +10% attack damage against it each qualifying turn, up to +50%; choosing a new mark restarts at +10%, unless your marked enemy has died, when the new mark keeps the bonus.',
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
    // (clearer wording, and Hidden Blades gives a Shadow Feint, a free Skill, instead of a Dagger: Robert 2026-11-08, #692)
    // (plainer still at Robert's request, same day: Skills build Preparation, the next Attack spends it)
    'Every Skill you play builds up 15% Preparation (up to 60%). Your next Attack deals that much more damage, then your Preparation is spent (a Dagger spends it too). It waits for you across turns. Your Attacks also deal 20% more to an enemy at half HP or less. Hidden Blades gives you a Shadow Feint (a free Skill: gain 3 Barrier) instead of a Dagger.',
    {
      traitTurnStart: [{ op: 'addCard', card: 'shadow-feint', to: 'hand', side: 'self' }],
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
    // (and a Volley that ramps within the turn, DECISIONS #685)
    'At the start of your turn, add a second Dagger to your hand. Each Dagger deals 10% more damage for each Dagger played before it this turn, up to 50% more.',
    {
      turnStart: [{ op: 'addCard', card: 'sleeve-knife', to: 'hand', side: 'self' }],
      fightStart: [
        { op: 'discipline', rule: { kind: 'volley', tag: 'knife', perCard: 10, cap: 50 } },
      ],
    },
  ),
  a(
    'assassin',
    'Bloodletter',
    'Bleed',
    // (Hidden Blades gives a Barbed Dagger instead of a Dagger: Robert 2026-11-08, #692)
    'Hidden Blades gives a Barbed Dagger (1 damage and 3 Bleed) instead of a Dagger. Bleed and Burn on your enemies deal their damage one more time each turn, losing 1 for it.',
    {
      traitTurnStart: [{ op: 'addCard', card: 'barbed-dagger', to: 'hand', side: 'self' }],
      fightStart: [status('virulent', 1)],
    },
  ),

  // (1 Spirit and 8 Barrier, was 2 Spirit: a second Spirit from the first turn was the strongest start in the game, DECISIONS #545)
  a(
    'shaman',
    'Totemist',
    'Cultivating totems',
    // (two more totem positions, and a second Hawk and Bear planted behind the class's three: a row of five, Robert 2026-11-07)
    // (no opening Spirit or Barrier, and Cultivation stops at 5 Spirit: it grew without end, DECISIONS #685)
    'You have 2 more totem positions, and start each fight with a second Hawk and Bear behind your other totems. End your turn with at least two totems standing, without commanding or pushing any out that turn, to gain 1 Spirit (up to 5 Spirit this way each fight).',
    {
      fightStart: [
        { op: 'totemSlot', amount: 2 },
        plant('hawk'),
        plant('bear'),
        { op: 'discipline', rule: { kind: 'cultivation', minimum: 2, spirit: 1, cap: 5 } },
      ],
    },
  ),
  a(
    'shaman',
    'Spiritwalker',
    'Spirit',
    // (Robert 2026-11-07, DECISIONS #683: a reason to stack Spirit; the 4 Barrier on the first totem act went)
    'Your first ordered totem command on your turn draws 1 card and gives 1 Spirit. Your cards deal 5% more damage for each Spirit you have, up to 50% more (totems already grow with Spirit).',
    {
      fightStart: [{ op: 'discipline', rule: { kind: 'attunement', perSpirit: 5, cap: 50 } }],
      triggers: [
        on('orderedCommand', [draw(1), status('spirit', 1)], { once: true, ownTurn: true }),
      ],
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

  // (and a card, and Enlightenment that grows over the fight, DECISIONS #686)
  a(
    'monk',
    'Sage',
    'Serene',
    'The first time each turn you leave Serene, gain 1 more Mana and draw 1 card. Enlightenment: the first 5 times you do, also gain 1 Might; the first 3 times, also 1 Bracing (+1 to every Barrier you gain).',
    {
      triggers: [
        on('stanceLeft', [mana(1), draw(1)], { stance: 'calm', once: true }),
        on('stanceLeft', [status('might', 1)], { stance: 'calm', once: true, times: 5 }),
        on('stanceLeft', [status('bracing', 1)], { stance: 'calm', once: true, times: 3 }),
      ],
    },
  ),
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
    // (Dawn: what Radiant gives partly stays, rather than Radiant more often, DECISIONS #686)
    'The first time each turn you enter a stance, gain 1 more Fervor. Your first Radiant exit on your turn returns 2 Fervor; each later qualifying exit this fight returns 1 more, up to 4. Dawn: the first 5 times you enter Radiant, gain 2 Might.',
    {
      triggers: [
        on('stance', [status('mantra', 1)], { once: true }),
        on('stance', [status('might', 2)], { stance: 'radiant', times: 5 }),
      ],
      fightStart: [{ op: 'discipline', rule: { kind: 'radiance', first: 2, step: 1, cap: 4 } }],
    },
  ),

  // (Keen 1 and a card for the first Sword each turn, was Keen 2, DECISIONS #545)
  a(
    'spellblade',
    'Blademaster',
    'Swords',
    // (and Keen that stacks to 5, DECISIONS #685)
    'Start each fight with 1 Keen (every hit of your Swords deals 1 more damage per Keen). The first Sword you play each turn draws 1 card, gives 4 Barrier and, after it resolves, 1 more Keen (4 more Keen at most this fight).',
    {
      fightStart: [status('keen', 1)],
      triggers: [
        on('play', [draw(1), barrier(4)], { tag: 'sword', once: true }),
        on('play', [status('keen', 1)], { tag: 'sword', once: true, times: 4 }),
      ],
    },
  ),
  a(
    'spellblade',
    'Archmage',
    'Spells',
    'Start each fight with 3 more Spell Power and gain 2 Spell Power at the start of your turn. Your first Spell Attack each turn that spends Spell Power deals 1 extra damage per point spent on every hit. Half that expenditure, rounded down, returns next turn.',
    {
      fightStart: [
        stars(3),
        { op: 'discipline', rule: { kind: 'spellCycle', perSpent: 1, refundDivisor: 2 } },
      ],
      turnStart: [stars(2)],
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
    // (up to 8, 1% each, and an Attack bonus: Hangover damage or sustain, Robert 2026-11-08, #695)
    'Your first actual Hangover payment on your turn builds 1 Fermentation, up to 8. At the end of your turn, each Fermentation heals 1% of your max HP (rounded up once, after adding them all) and gives 2 Barrier. Your Attacks deal 4% more for each Fermentation. Fermentation lasts for the fight.',
    {
      fightStart: [
        {
          op: 'discipline',
          rule: { kind: 'brewing', cap: 8, healPct: 1, barrier: 2, attackPct: 4 },
        },
      ],
    },
  ),
  // (and 2 sharper every turn: 3 once was less than a common card, DECISIONS #542)
  a(
    'drunkard',
    'Gunslinger',
    'The Gun',
    // (and each Shell sharpens it: the big gun or Shell spam, and it keeps growing, his far-scaling engine: Robert 2026-11-08, #695)
    'The Old Twelve Gauge starts each fight 3 sharper, and grows 2 sharper at the start of each of your turns. Each Shell you play makes it 1 sharper.',
    {
      fightStart: [{ op: 'forge', card: 'old-twelve-gauge', amount: 3 }],
      turnStart: [{ op: 'forge', card: 'old-twelve-gauge', amount: 2 }],
      triggers: [
        on('play', [{ op: 'forge', card: 'old-twelve-gauge', amount: 1 }], { tag: 'shell' }),
      ],
    },
  ),
  a(
    'drunkard',
    'Deathwish',
    'Low HP',
    // (and on to +40% at 10% HP, DECISIONS #685)
    'Below 70% HP, your extra Attack damage grows gradually to +30% at 40% HP and on to +50% at 10% HP, on top of Clutch Genes. Twice each turn, when your own cards or Hangover cost you HP, deal that much (up to 4) to a random enemy. Your first Attack on your turn grants 5% of your max HP as Barrier, rounded up, before resolving if you are at 40% HP or lower. Once each fight, lethal opposing damage leaves you at 1 HP and gives Barrier equal to 10% of your max HP. Follow-up hits can kill. Self-payments, Fate execution and sudden death do not trigger the rescue.',
    {
      fightStart: [
        {
          op: 'discipline',
          rule: {
            kind: 'desperation',
            threshold: 40,
            bonus: 30,
            emergencyBarrierPct: 10,
            rampFrom: 70,
            attackBarrierPct: 5,
            deepBonus: 50,
            deepAt: 10,
          },
        },
      ],
      // (#695: the pain route, every payment strikes back)
      triggers: [
        on(
          'loseHp',
          [scaled({ op: 'damage', amount: 0, to: 'randomFoe' }, { by: 'hpLostNow', max: 4 })],
          { perTurnLimit: 2 },
        ),
      ],
    },
  ),

  a(
    'necromancer',
    'Bonelord',
    'Companions',
    // (an army, not a wall: Robert 2026-11-07, DECISIONS #684; the extra Raise a turn and the Barrier for each Thrall went)
    // (3 more damage and 2 max HP a turn, so the army grows: back to A after the #691 card pass, Robert 2026-11-08, #696)
    'You have 4 companion slots (two Grave Colossi fit). Your companions deal 3 more damage, and at the start of your turn each gains 2 max HP. A companion an enemy kills bursts for its full max HP at that enemy, not half.',
    {
      maxAllies: 4,
      fightStart: [status('marrow', 3)],
      turnStart: [growHp(2, 'allAllies')],
      // (the other half of the burst: Grave Chill gives the first)
      triggers: [on('allyDies', [deathBurst(0.5, true)])],
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
    'The first 3 cards consumed each round add 1 Harvest each. The first 6 grant 3 Barrier each. A round runs from the start of your turn to your next turn. At the end of your turn, after Fleeting cleanup and companion actions, if you consumed a card that turn, Reap the lowest-HP enemy for 4 damage plus 2 per Harvest this fight. Barrier absorbs Reap. Other Consume effects still work beyond these limits.',
    {
      fightStart: [
        { op: 'discipline', rule: { kind: 'harvest', base: 4, perConsumed: 2, roundLimit: 3 } },
      ],
      triggers: [on('exhaust', [barrier(3)], { perRoundLimit: 6 })],
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
      ...(x.turnStart || trait?.turnStart || x.traitTurnStart
        ? {
            turnStart: [...(x.traitTurnStart ?? trait?.turnStart ?? []), ...(x.turnStart ?? [])],
          }
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
