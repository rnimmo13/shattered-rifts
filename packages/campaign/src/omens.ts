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

// ---- THE place to tune the Omens (DECISIONS #257) -------------------------------------------------------------------------------
// Edit the numbers here; the Omens below, their text on screen and the How to play page all read them.
//   tier          the Rift Tier the Omen arrives at (it stays for every tier after)
//   { base, perTier, max }   the value at its own tier, how much it grows for each tier after that, and the most it ever reaches
//   { base, plusOneEvery }   the value at its own tier, and one more for every `plusOneEvery` tiers after that
//   a plain number           does not grow
type Grows = { base: number; perTier: number; max: number };
type Steps = { base: number; plusOneEvery: number };

export const OMEN_TUNING = {
  secondWind: {
    tier: 2,
    barrierPct: { base: 15, perTier: 1, max: 35 },
    might: { base: 1, plusOneEvery: 6 },
  },
  dearerRoads: { tier: 3, pricePct: { base: 10, perTier: 1, max: 30 } },
  hardenedHides: { tier: 4, thorns: { base: 1, plusOneEvery: 6 } },
  thinRest: { tier: 5, restPct: { base: 20, perTier: 1, max: 40 } },
  ralliedFoes: { tier: 6, barrierPct: { base: 10, perTier: 0.5, max: 20 } },
  leanPurses: { tier: 7, shardsPct: { base: 15, perTier: 1, max: 30 } },
  ironclad: { tier: 8, armored: { base: 1, plusOneEvery: 6 } },
  dread: { tier: 9, faltering: { base: 1, plusOneEvery: 6 } },
  narrowedFates: { tier: 10, fewerChoices: 1 },
  riftStatic: { tier: 11, staticCards: { base: 1, plusOneEvery: 7 } },
  bloodRites: { tier: 12, ritual: 1 },
  brittleWards: { tier: 13, brittle: { base: 2, plusOneEvery: 4 } },
  swarming: { tier: 14 },
  exposedSoul: { tier: 15, exposed: { base: 1, plusOneEvery: 4 } },
  thirdPhase: { tier: 16, atPct: 25, barrierPct: { base: 20, perTier: 2, max: 28 }, might: 2 },
  vigilant: { tier: 17, steadfast: 1 },
  wardensFury: { tier: 18, dmgPct: { base: 10, perTier: 2, max: 14 } },
  hunted: { tier: 19, firstHit: { base: 4, perTier: 2, max: 6 } },
  riftAwakens: { tier: 20, atPct: 50, barrierPct: 10, might: 1 },
} satisfies Record<string, { tier: number; [k: string]: number | Grows | Steps }>;
// ------------------------------------------------------------------------------------------------------------------------------

const T = OMEN_TUNING;
const add = (to: Partial<Record<StatusId, number>>, st: StatusId, n: number): void => {
  if (n > 0) to[st] = (to[st] ?? 0) + n;
};
/** a tuned value at a tier, for an Omen that arrived at `from` */
const at = (tier: number, from: number, v: Grows | Steps): number => {
  const past = Math.max(0, tier - from);
  return 'plusOneEvery' in v
    ? v.base + Math.floor(past / v.plusOneEvery)
    : Math.min(v.max, v.base + past * v.perTier);
};
const turns = (n: number): string => `${n} ${n === 1 ? 'turn' : 'turns'}`;

const secondWind = (t: number): Rise => ({
  atPct: 50,
  barrierPct: at(t, T.secondWind.tier, T.secondWind.barrierPct),
  might: at(t, T.secondWind.tier, T.secondWind.might),
});
const thirdPhase = (t: number): Rise => ({
  atPct: T.thirdPhase.atPct,
  barrierPct: at(t, T.thirdPhase.tier, T.thirdPhase.barrierPct),
  might: T.thirdPhase.might,
});

export const OMENS: Omen[] = [
  {
    tier: T.secondWind.tier,
    id: 'second-wind',
    name: 'Second Wind',
    text: (t) => {
      const r = secondWind(t);
      return `Elites and Wardens have a second phase: the first time they fall to half HP, they stop there and rise with Barrier (${r.barrierPct}% of their HP) and ${r.might} Might.`;
    },
    apply: (e, t) => void e.bossRise.push(secondWind(t)),
  },
  {
    tier: T.dearerRoads.tier,
    id: 'dearer-roads',
    name: 'Dearer Roads',
    text: (t) => `Merchants charge ${at(t, T.dearerRoads.tier, T.dearerRoads.pricePct)}% more.`,
    apply: (e, t) => void (e.pricePct += at(t, T.dearerRoads.tier, T.dearerRoads.pricePct)),
  },
  {
    tier: T.hardenedHides.tier,
    id: 'hardened-hides',
    name: 'Hardened Hides',
    text: (t) =>
      `Every enemy starts with ${at(t, T.hardenedHides.tier, T.hardenedHides.thorns)} Thorns.`,
    apply: (e, t) =>
      add(e.enemyStatuses, 'thorns', at(t, T.hardenedHides.tier, T.hardenedHides.thorns)),
  },
  {
    tier: T.thinRest.tier,
    id: 'thin-rest',
    name: 'Thin Rest',
    text: (t) => `Resting at a Shrine heals ${at(t, T.thinRest.tier, T.thinRest.restPct)}% less.`,
    apply: (e, t) => void (e.restPct += at(t, T.thinRest.tier, T.thinRest.restPct)),
  },
  {
    tier: T.ralliedFoes.tier,
    id: 'rallied-foes',
    name: 'Rallied Foes',
    text: (t) =>
      `In ordinary fights the strongest enemy has a second phase too: at half HP it stops and rises with Barrier (${at(t, T.ralliedFoes.tier, T.ralliedFoes.barrierPct)}% of its HP).`,
    apply: (e, t) =>
      void e.leaderRise.push({
        atPct: 50,
        barrierPct: at(t, T.ralliedFoes.tier, T.ralliedFoes.barrierPct),
        might: 0,
      }),
  },
  {
    tier: T.leanPurses.tier,
    id: 'lean-purses',
    name: 'Lean Purses',
    text: (t) => `Fights pay ${at(t, T.leanPurses.tier, T.leanPurses.shardsPct)}% fewer shards.`,
    apply: (e, t) => void (e.shardsPct += at(t, T.leanPurses.tier, T.leanPurses.shardsPct)),
  },
  {
    tier: T.ironclad.tier,
    id: 'ironclad',
    name: 'Ironclad',
    text: (t) =>
      `Elites and Wardens start with ${at(t, T.ironclad.tier, T.ironclad.armored)} Armored.`,
    apply: (e, t) => add(e.bossStatuses, 'armored', at(t, T.ironclad.tier, T.ironclad.armored)),
  },
  {
    tier: T.dread.tier,
    id: 'dread',
    name: 'Dread',
    text: (t) =>
      `You start every fight Faltering for ${turns(at(t, T.dread.tier, T.dread.faltering))} (25% less attack damage).`,
    apply: (e, t) => add(e.heroStatuses, 'faltering', at(t, T.dread.tier, T.dread.faltering)),
  },
  {
    tier: T.narrowedFates.tier,
    id: 'narrowed-fates',
    name: 'Narrowed Fates',
    text: () =>
      `Card rewards offer ${T.narrowedFates.fewerChoices === 1 ? 'one card' : `${T.narrowedFates.fewerChoices} cards`} fewer (the Warden’s Gift is untouched).`,
    apply: (e) => void (e.fewerChoices += T.narrowedFates.fewerChoices),
  },
  {
    tier: T.riftStatic.tier,
    id: 'rift-static',
    name: 'Rift Static',
    text: (t) => {
      const n = at(t, T.riftStatic.tier, T.riftStatic.staticCards);
      return `${n === 1 ? 'A Static card joins' : `${n} Static cards join`} your draw pile in every fight.`;
    },
    apply: (e, t) => {
      for (let i = 0; i < at(t, T.riftStatic.tier, T.riftStatic.staticCards); i++)
        e.fightCards.push('static');
    },
  },
  {
    tier: T.bloodRites.tier,
    id: 'rites',
    name: 'Blood Rites',
    text: () =>
      `Elites and Wardens start with ${T.bloodRites.ritual} Ritual: they gain ${T.bloodRites.ritual} Might at the end of each of their turns.`,
    apply: (e) => add(e.bossStatuses, 'ritual', T.bloodRites.ritual),
  },
  {
    tier: T.brittleWards.tier,
    id: 'brittle-wards',
    name: 'Brittle Wards',
    text: (t) =>
      `You start every fight Brittle for ${turns(at(t, T.brittleWards.tier, T.brittleWards.brittle))} (the Barrier you gain is 25% smaller).`,
    apply: (e, t) =>
      add(e.heroStatuses, 'brittle', at(t, T.brittleWards.tier, T.brittleWards.brittle)),
  },
  {
    tier: T.swarming.tier,
    id: 'swarming',
    name: 'Swarming',
    text: () => 'Elite fights bring one more of their weakest enemy (when there is room).',
    apply: (e) => void (e.swarm = true),
  },
  {
    tier: T.exposedSoul.tier,
    id: 'exposed-soul',
    name: 'Exposed Soul',
    text: (t) =>
      `You start every fight Exposed for ${turns(at(t, T.exposedSoul.tier, T.exposedSoul.exposed))} (50% more attack damage taken).`,
    apply: (e, t) =>
      add(e.heroStatuses, 'exposed', at(t, T.exposedSoul.tier, T.exposedSoul.exposed)),
  },
  {
    tier: T.thirdPhase.tier,
    id: 'third-phase',
    name: 'Third Phase',
    text: (t) => {
      const r = thirdPhase(t);
      return `Elites and Wardens rise once more at ${r.atPct === 25 ? 'a quarter' : `${r.atPct}%`} of their HP, with Barrier (${r.barrierPct}% of their HP) and ${r.might} Might.`;
    },
    apply: (e, t) => void e.bossRise.push(thirdPhase(t)),
  },
  {
    tier: T.vigilant.tier,
    id: 'vigilant',
    name: 'Vigilant',
    text: () =>
      `Every enemy starts with ${T.vigilant.steadfast} Steadfast: the first ${T.vigilant.steadfast === 1 ? 'debuff' : `${T.vigilant.steadfast} debuffs`} you put on it ${T.vigilant.steadfast === 1 ? 'is' : 'are'} ignored.`,
    apply: (e) => add(e.enemyStatuses, 'steadfast', T.vigilant.steadfast),
  },
  {
    tier: T.wardensFury.tier,
    id: 'wardens-fury',
    name: 'Warden’s Fury',
    text: (t) => `Wardens deal ${at(t, T.wardensFury.tier, T.wardensFury.dmgPct)}% more damage.`,
    apply: (e, t) => void (e.wardenDmgPct += at(t, T.wardensFury.tier, T.wardensFury.dmgPct)),
  },
  {
    tier: T.hunted.tier,
    id: 'hunted',
    name: 'Hunted',
    text: (t) =>
      `Every enemy's first attack deals ${at(t, T.hunted.tier, T.hunted.firstHit)} more damage.`,
    apply: (e, t) => add(e.enemyStatuses, 'vigor', at(t, T.hunted.tier, T.hunted.firstHit)),
  },
  {
    tier: T.riftAwakens.tier,
    id: 'rift-awakens',
    name: 'The Rift Awakens',
    text: () =>
      `Every enemy has a second phase: at ${T.riftAwakens.atPct === 50 ? 'half' : `${T.riftAwakens.atPct}% of its`} HP it stops and rises with Barrier (${T.riftAwakens.barrierPct}% of its HP) and ${T.riftAwakens.might} Might.`,
    apply: (e) =>
      void e.allRise.push({
        atPct: T.riftAwakens.atPct,
        barrierPct: T.riftAwakens.barrierPct,
        might: T.riftAwakens.might,
      }),
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
