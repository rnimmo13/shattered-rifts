// Rift Omens (DECISIONS #245): every Rift Tier from II on brings an Omen, and Omens stack, so a run at Tier VII lives under the
// Omens of Tiers II to VII. Each Omen also grows with the tier you are in, so the early ones still bite deep in the Rift. They make
// a tier play differently, not just hit harder: enemies rise into a second phase, foes start guarded, the hero starts shaken,
// rewards and rest grow thinner.
//
// Pure: `omenEffects(tier)` adds up what the Omens of a tier do, and the run applies it where each belongs (a fight's setup, the
// merchant, a rest, a reward).

import type { EnemyMod, Rise, StatusId } from '@sr/combat';

export interface OmenEffects {
  /** phases for elites and Wardens */
  bossRise: Rise[];
  /** phases for the strongest enemy of an ordinary fight */
  leaderRise: Rise[];
  /** phases for every enemy */
  allRise: Rise[];
  /** what every enemy starts with */
  enemyStatuses: Partial<Record<StatusId, number>>;
  /** what elites and Wardens start with */
  bossStatuses: Partial<Record<StatusId, number>>;
  /** what you start every fight with */
  heroStatuses: Partial<Record<StatusId, number>>;
  /** percent more on everything a merchant sells */
  pricePct: number;
  /** percent less healing from a rest */
  restPct: number;
  /** percent fewer shards from fights */
  shardsPct: number;
  /** fewer card choices in an ordinary reward */
  fewerChoices: number;
  /** cards that join your draw pile for each fight (not your deck) */
  fightCards: string[];
  /** elite fights bring one more of their weakest enemy */
  swarm: boolean;
  /** percent more damage from Wardens */
  wardenDmgPct: number;
}

export interface Omen {
  /** the tier it comes at */
  tier: number;
  id: string;
  name: string;
  /** what it does at a tier (the numbers grow with it) */
  text: (tier: number) => string;
  apply: (e: OmenEffects, tier: number) => void;
}

const add = (to: Partial<Record<StatusId, number>>, st: StatusId, n: number): void => {
  if (n > 0) to[st] = (to[st] ?? 0) + n;
};
/** grows by `per` for every tier past `from`, capped */
const grow = (tier: number, from: number, base: number, per: number, cap: number): number =>
  Math.min(cap, base + Math.max(0, tier - from) * per);
/** one more every `every` tiers past `from` */
const steps = (tier: number, from: number, base: number, every: number): number =>
  base + Math.floor(Math.max(0, tier - from) / every);

const secondWind = (t: number): Rise => ({
  atPct: 50,
  barrierPct: grow(t, 2, 15, 1, 35),
  might: steps(t, 2, 1, 6),
});

export const OMENS: Omen[] = [
  {
    tier: 2,
    id: 'second-wind',
    name: 'Second Wind',
    text: (t) => {
      const r = secondWind(t);
      return `Elites and Wardens have a second phase: the first time they fall to half HP, they stop there and rise with Barrier (${r.barrierPct}% of their HP) and ${r.might} Might.`;
    },
    apply: (e, t) => void e.bossRise.push(secondWind(t)),
  },
  {
    tier: 3,
    id: 'dearer-roads',
    name: 'Dearer Roads',
    text: (t) => `Merchants charge ${grow(t, 3, 10, 1, 30)}% more.`,
    apply: (e, t) => void (e.pricePct += grow(t, 3, 10, 1, 30)),
  },
  {
    tier: 4,
    id: 'hardened-hides',
    name: 'Hardened Hides',
    text: (t) => `Every enemy starts with ${steps(t, 4, 1, 6)} Thorns.`,
    apply: (e, t) => add(e.enemyStatuses, 'thorns', steps(t, 4, 1, 6)),
  },
  {
    tier: 5,
    id: 'thin-rest',
    name: 'Thin Rest',
    text: (t) => `Resting at a Shrine heals ${grow(t, 5, 20, 1, 40)}% less.`,
    apply: (e, t) => void (e.restPct += grow(t, 5, 20, 1, 40)),
  },
  {
    tier: 6,
    id: 'rallied-foes',
    name: 'Rallied Foes',
    text: (t) =>
      `In ordinary fights the strongest enemy has a second phase too: at half HP it stops and rises with Barrier (${grow(t, 6, 10, 0.5, 20)}% of its HP).`,
    apply: (e, t) =>
      void e.leaderRise.push({ atPct: 50, barrierPct: grow(t, 6, 10, 0.5, 20), might: 0 }),
  },
  {
    tier: 7,
    id: 'lean-purses',
    name: 'Lean Purses',
    text: (t) => `Fights pay ${grow(t, 7, 15, 1, 30)}% fewer shards.`,
    apply: (e, t) => void (e.shardsPct += grow(t, 7, 15, 1, 30)),
  },
  {
    tier: 8,
    id: 'ironclad',
    name: 'Ironclad',
    text: (t) => `Elites and Wardens start with ${steps(t, 8, 1, 6)} Armored.`,
    apply: (e, t) => add(e.bossStatuses, 'armored', steps(t, 8, 1, 6)),
  },
  {
    tier: 9,
    id: 'dread',
    name: 'Dread',
    text: (t) =>
      `You start every fight Faltering for ${steps(t, 9, 1, 6)} ${steps(t, 9, 1, 6) === 1 ? 'turn' : 'turns'} (25% less attack damage).`,
    apply: (e, t) => add(e.heroStatuses, 'faltering', steps(t, 9, 1, 6)),
  },
  {
    tier: 10,
    id: 'narrowed-fates',
    name: 'Narrowed Fates',
    text: () => 'Card rewards offer one card fewer (the Warden’s Gift is untouched).',
    apply: (e) => void (e.fewerChoices += 1),
  },
  {
    tier: 11,
    id: 'rift-static',
    name: 'Rift Static',
    text: (t) =>
      `${steps(t, 11, 1, 7) === 1 ? 'A Static card joins' : `${steps(t, 11, 1, 7)} Static cards join`} your draw pile in every fight.`,
    apply: (e, t) => {
      for (let i = 0; i < steps(t, 11, 1, 7); i++) e.fightCards.push('static');
    },
  },
  {
    tier: 12,
    id: 'rites',
    name: 'Blood Rites',
    text: () =>
      'Elites and Wardens start with 1 Ritual: they gain 1 Might at the end of each of their turns.',
    apply: (e) => add(e.bossStatuses, 'ritual', 1),
  },
  {
    tier: 13,
    id: 'brittle-wards',
    name: 'Brittle Wards',
    text: (t) =>
      `You start every fight Brittle for ${steps(t, 13, 2, 4)} turns (the Barrier you gain is 25% smaller).`,
    apply: (e, t) => add(e.heroStatuses, 'brittle', steps(t, 13, 2, 4)),
  },
  {
    tier: 14,
    id: 'swarming',
    name: 'Swarming',
    text: () => 'Elite fights bring one more of their weakest enemy (when there is room).',
    apply: (e) => void (e.swarm = true),
  },
  {
    tier: 15,
    id: 'exposed-soul',
    name: 'Exposed Soul',
    text: (t) =>
      `You start every fight Exposed for ${steps(t, 15, 1, 4)} ${steps(t, 15, 1, 4) === 1 ? 'turn' : 'turns'} (50% more attack damage taken).`,
    apply: (e, t) => add(e.heroStatuses, 'exposed', steps(t, 15, 1, 4)),
  },
  {
    tier: 16,
    id: 'third-phase',
    name: 'Third Phase',
    text: (t) =>
      `Elites and Wardens rise once more at a quarter of their HP, with Barrier (${grow(t, 16, 20, 2, 28)}% of their HP) and 2 Might.`,
    apply: (e, t) =>
      void e.bossRise.push({ atPct: 25, barrierPct: grow(t, 16, 20, 2, 28), might: 2 }),
  },
  {
    tier: 17,
    id: 'vigilant',
    name: 'Vigilant',
    text: () => 'Every enemy starts with 1 Steadfast: the first debuff you put on it is ignored.',
    apply: (e) => add(e.enemyStatuses, 'steadfast', 1),
  },
  {
    tier: 18,
    id: 'wardens-fury',
    name: 'Warden’s Fury',
    text: (t) => `Wardens deal ${grow(t, 18, 10, 2, 14)}% more damage.`,
    apply: (e, t) => void (e.wardenDmgPct += grow(t, 18, 10, 2, 14)),
  },
  {
    tier: 19,
    id: 'hunted',
    name: 'Hunted',
    text: (t) => `Every enemy's first attack deals ${grow(t, 19, 4, 2, 6)} more damage.`,
    apply: (e, t) => add(e.enemyStatuses, 'vigor', grow(t, 19, 4, 2, 6)),
  },
  {
    tier: 20,
    id: 'rift-awakens',
    name: 'The Rift Awakens',
    text: () =>
      'Every enemy has a second phase: at half HP it stops and rises with Barrier (10% of its HP) and 1 Might.',
    apply: (e) => void e.allRise.push({ atPct: 50, barrierPct: 10, might: 1 }),
  },
];

/** The Omens in force at a tier (every one from Tier II up to it). */
export const omensAt = (tier: number): Omen[] => OMENS.filter((o) => o.tier <= tier);

/** The Omen a tier brings (none at Tier I). */
export const omenOf = (tier: number): Omen | undefined => OMENS.find((o) => o.tier === tier);

/** Everything the Omens of a tier do, added up. */
export function omenEffects(tier: number): OmenEffects {
  const e: OmenEffects = {
    bossRise: [],
    leaderRise: [],
    allRise: [],
    enemyStatuses: {},
    bossStatuses: {},
    heroStatuses: {},
    pricePct: 0,
    restPct: 0,
    shardsPct: 0,
    fewerChoices: 0,
    fightCards: [],
    swarm: false,
    wardenDmgPct: 0,
  };
  for (const o of omensAt(tier)) o.apply(e, tier);
  return e;
}

/**
 * What the Omens change about one fight's enemies: `units` are the encounter's unit ids (front to back), `boss` whether it is an
 * elite or Warden fight, and `hpOf` a unit's designed HP (the strongest is the one with the most).
 */
export function omenMods(
  e: OmenEffects,
  units: readonly string[],
  boss: boolean,
  hpOf: (id: string) => number,
): EnemyMod[] {
  const mods: EnemyMod[] = [];
  if (Object.keys(e.enemyStatuses).length) mods.push({ statuses: { ...e.enemyStatuses } });
  let lead = 0;
  units.forEach((id, i) => {
    if (hpOf(id) > hpOf(units[lead] ?? '')) lead = i;
  });
  // (every enemy's phase: the one with its own phases already has a stronger one)
  const ownRise = boss ? e.bossRise.length > 0 : e.leaderRise.length > 0;
  if (e.allRise.length)
    mods.push({
      ...(ownRise ? { units: units.map((_, i) => i).filter((i) => i !== lead) } : {}),
      rise: [...e.allRise],
    });
  if (boss) {
    if (Object.keys(e.bossStatuses).length || e.bossRise.length)
      mods.push({
        units: [lead],
        ...(Object.keys(e.bossStatuses).length ? { statuses: { ...e.bossStatuses } } : {}),
        ...(e.bossRise.length ? { rise: [...e.bossRise] } : {}),
      });
  } else if (e.leaderRise.length) mods.push({ units: [lead], rise: [...e.leaderRise] });
  return mods;
}
