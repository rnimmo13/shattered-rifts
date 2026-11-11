// Hero mastery (DECISIONS #739, #741): a Riftwalker's mastery is how many times the campaign has been cleared with it, and the first
// clear gives that Riftwalker's card back. Beside it are plain numbers for a snapshot of the player's time with that Riftwalker: the
// highest Rift Tier cleared, Arena matches won against players, and matches won against ghosts. And the log of what a player has earned by playing, which a
// device shows once for the player to acknowledge. Pure rules shared by the browser and the server.
//
// The numbers only ever grow, so two copies (another device's, the server's) are brought together by taking the larger of each. Like
// cosmetics, no wipe touches them.

import { MAX_TIER } from '@sr/campaign';
import { RIFTWALKERS, canonicalHero, cosmeticDef, heroCardBack } from '@sr/content/v2';
import { RUN_PREFIX, runOf, safeId } from './vault';

export interface HeroMastery {
  /** the highest Rift Tier cleared (0: none; MASTERY_TIERS: the campaign) */
  best: number;
  /** campaigns cleared: the Riftwalker's mastery */
  clears: number;
  /** Arena matches (a best of three is one match) won against another player */
  arenaWins: number;
  /** matches won against a ghost */
  ghostWins: number;
}

/** By Riftwalker id. A Riftwalker never played is left out. */
export type Mastery = Record<string, HeroMastery>;

/** The tiers of the campaign: clearing the last one clears it. */
export const MASTERY_TIERS: number = MAX_TIER;

export const NO_HERO_MASTERY: HeroMastery = { best: 0, clears: 0, arenaWins: 0, ghostWins: 0 };

const COUNT_MAX = 999_999;
const count = (x: unknown, max: number): number =>
  typeof x === 'number' && Number.isFinite(x) ? Math.min(max, Math.max(0, Math.floor(x))) : 0;

const empty = (h: HeroMastery): boolean =>
  h.best === 0 && h.clears === 0 && h.arenaWins === 0 && h.ghostWins === 0;

/** What arrives from outside, kept only as far as it makes sense: known Riftwalkers, whole numbers within reason. */
export function cleanMastery(raw: unknown): Mastery {
  const out: Mastery = {};
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return out;
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    const hero = canonicalHero(id);
    if (!Object.hasOwn(RIFTWALKERS, hero) || typeof v !== 'object' || v === null) continue;
    const r = v as Record<string, unknown>;
    const clears = count(r['clears'], COUNT_MAX);
    const one: HeroMastery = {
      // (a campaign cleared is every tier cleared, and nothing else clears the last one)
      best: clears > 0 ? MASTERY_TIERS : count(r['best'], MASTERY_TIERS - 1),
      clears,
      arenaWins: count(r['arenaWins'], COUNT_MAX),
      ghostWins: count(r['ghostWins'], COUNT_MAX),
    };
    if (!empty(one)) out[hero] = mergeHero(out[hero], one);
  }
  return out;
}

const mergeHero = (a: HeroMastery | undefined, b: HeroMastery): HeroMastery =>
  a
    ? {
        best: Math.max(a.best, b.best),
        clears: Math.max(a.clears, b.clears),
        arenaWins: Math.max(a.arenaWins, b.arenaWins),
        ghostWins: Math.max(a.ghostWins, b.ghostWins),
      }
    : b;

/** Two copies together: the larger of each number. */
export function mergeMastery(a: Mastery, b: Mastery): Mastery {
  const out: Mastery = { ...a };
  for (const [hero, m] of Object.entries(b)) out[hero] = mergeHero(out[hero], m);
  return out;
}

export const sameMastery = (a: Mastery, b: Mastery): boolean => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const x = a[k] ?? NO_HERO_MASTERY;
    const y = b[k] ?? NO_HERO_MASTERY;
    if (
      x.best !== y.best ||
      x.clears !== y.clears ||
      x.arenaWins !== y.arenaWins ||
      x.ghostWins !== y.ghostWins
    )
      return false;
  }
  return true;
};

export const heroMastery = (m: Mastery, hero: string): HeroMastery => m[hero] ?? NO_HERO_MASTERY;

/** A Riftwalker is mastered once the campaign has been cleared with it. */
export const isMastered = (h: HeroMastery): boolean => h.clears > 0;

/** How far a run has got: the Rift Tiers it has cleared. */
export function tiersCleared(run: { tier: number; tierCleared: boolean; won?: boolean }): number {
  if (run.won) return MASTERY_TIERS;
  // (a run of the older, longer campaign can stand past the last tier without having cleared the campaign: it stops one short)
  return Math.min(MASTERY_TIERS - 1, Math.max(0, run.tierCleared ? run.tier : run.tier - 1));
}

/** The copy with a run's progress counted: the highest tier cleared, and a campaign cleared when `newClear` says this one is new. */
export function withRun(
  m: Mastery,
  hero: string,
  run: { tier: number; tierCleared: boolean; won?: boolean },
  newClear: boolean,
): Mastery {
  const id = canonicalHero(hero);
  if (!Object.hasOwn(RIFTWALKERS, id)) return m;
  const was = heroMastery(m, id);
  const clears = was.clears + (run.won && newClear ? 1 : 0);
  const best = clears > 0 ? MASTERY_TIERS : Math.max(was.best, tiersCleared(run));
  if (best === was.best && clears === was.clears) return m;
  return { ...m, [id]: { ...was, best, clears } };
}

/** The copy with one more match won: against another player, or against a ghost. */
export function withArenaWin(m: Mastery, hero: string, ghost = false): Mastery {
  const id = canonicalHero(hero);
  if (!Object.hasOwn(RIFTWALKERS, id)) return m;
  const was = heroMastery(m, id);
  const key = ghost ? 'ghostWins' : 'arenaWins';
  return { ...m, [id]: { ...was, [key]: Math.min(COUNT_MAX, was[key] + 1) } };
}

/**
 * What the campaign says of a copy (the highest tier and the clears) with only the match counts of another. The server counts the
 * campaign itself, from the decks a run saves, so a device's copy is taken for its match counts alone (DECISIONS #741).
 */
export function matchCountsOnly(m: Mastery): Mastery {
  const out: Mastery = {};
  for (const [hero, h] of Object.entries(m))
    if (h.arenaWins > 0 || h.ghostWins > 0)
      out[hero] = { ...NO_HERO_MASTERY, arenaWins: h.arenaWins, ghostWins: h.ghostWins };
  return out;
}

/** The copy with the campaign numbers of `campaign` (the server's) and the larger match counts of the two. */
export function withCampaignOf(campaign: Mastery, mine: Mastery): Mastery {
  return mergeMastery(campaign, matchCountsOnly(mine));
}

/** A run as mastery counts it: which run, whose, and how far it got. */
export interface RunFacts {
  /** the run, as a saved deck's id names it (so a deck and a history record of one run are counted once) */
  run: string;
  hero: string;
  tier: number;
  tierCleared: boolean;
  won: boolean;
}

/** What a saved deck says of its run. */
export const deckRunFacts = (d: {
  id: string;
  hero: string;
  tier: number;
  stage?: number;
  won?: true;
}): RunFacts => ({
  run: runOf(d.id),
  hero: d.hero,
  tier: d.tier,
  tierCleared: d.stage === 3,
  won: d.won === true,
});

/**
 * What a record of the run history says of its run, or null if it is not one. A run is won if its record says so, or if the last
 * fight it kept was a win against the campaign's last enemy (records made before runs said so: DECISIONS #701).
 */
export function historyRunFacts(item: unknown): RunFacts | null {
  if (typeof item !== 'object' || item === null) return null;
  const r = item as Record<string, unknown>;
  const { id, hero, tier } = r;
  if (typeof id !== 'string' || id === '' || typeof hero !== 'string') return null;
  if (typeof tier !== 'number' || !Number.isFinite(tier)) return null;
  const fight = r['lastFight'] as
    { won?: unknown; setup?: { b?: { enemies?: unknown } } } | undefined | null;
  const foes = fight?.setup?.b?.enemies;
  const won =
    r['won'] === true || (fight?.won === true && Array.isArray(foes) && foes.includes(FINAL_ENEMY));
  return {
    run: runOf(safeId(RUN_PREFIX + id)),
    hero,
    tier: Math.floor(tier),
    // (a run that was saved and ended, as older builds allowed, had cleared the tier it stood on)
    tierCleared: r['end'] === 'banked',
    won,
  };
}

/** The campaign's last enemy (Drago; its id is from before he was renamed, DECISIONS #631). */
const FINAL_ENEMY = 'vorthax';

/**
 * Count runs into a mastery record: each one's highest tier, and a campaign cleared for every won run not in `counted`. Returns the
 * new record and the runs newly counted (the same record, and none, when nothing changed).
 */
export function countRuns(
  m: Mastery,
  counted: readonly string[],
  runs: readonly RunFacts[],
): { mastery: Mastery; newlyCounted: string[] } {
  const have = new Set(counted);
  const newlyCounted: string[] = [];
  let out = m;
  for (const f of runs) {
    const fresh = f.won && !have.has(f.run);
    out = withRun(out, f.hero, f, fresh);
    if (fresh) {
      have.add(f.run);
      newlyCounted.push(f.run);
    }
  }
  return { mastery: out, newlyCounted };
}

/** The cosmetics a mastery record has earned: the card back of every Riftwalker mastered. */
export function masteryRewards(m: Mastery): string[] {
  return Object.entries(m)
    .filter(([, h]) => isMastered(h))
    .map(([hero]) => heroCardBack(hero))
    .filter((id) => cosmeticDef(id)?.kind === 'cardBack');
}

/** All a player has done, added up across Riftwalkers. */
export function masteryTotals(m: Mastery): {
  clears: number;
  arenaWins: number;
  ghostWins: number;
  mastered: number;
} {
  let clears = 0;
  let arenaWins = 0;
  let ghostWins = 0;
  let mastered = 0;
  for (const h of Object.values(m)) {
    clears += h.clears;
    arenaWins += h.arenaWins;
    ghostWins += h.ghostWins;
    if (isMastered(h)) mastered++;
  }
  return { clears, arenaWins, ghostWins, mastered };
}

// ---- what a player has earned ----

/** Why something was given: a Riftwalker mastered, a season's reward, or a gift from the game (a keepsake). */
export type EarnedWhy = 'mastery' | 'season' | 'gift';
const WHYS: readonly EarnedWhy[] = ['mastery', 'season', 'gift'];

/** One thing earned: a cosmetic, when the server gave it, and why. `seen` once the player has acknowledged it. */
export interface Earned {
  /** one entry per cosmetic: "cosmetic:<id>" */
  id: string;
  at: number;
  cosmetic: string;
  why: EarnedWhy;
  seen?: true;
}

/** The most entries the log keeps (the newest). */
export const EARNED_KEEP = 300;

export const earnedId = (cosmetic: string): string => `cosmetic:${cosmetic}`;

/** The log as it arrives from outside: known cosmetics only, one entry each, newest first. */
export function cleanEarned(raw: unknown): Earned[] {
  if (!Array.isArray(raw)) return [];
  const out = new Map<string, Earned>();
  for (const v of raw as unknown[]) {
    if (typeof v !== 'object' || v === null) continue;
    const r = v as Record<string, unknown>;
    const cosmetic = r['cosmetic'];
    const at = r['at'];
    if (typeof cosmetic !== 'string' || !cosmeticDef(cosmetic)) continue;
    if (typeof at !== 'number' || !Number.isFinite(at) || at < 0) continue;
    const id = earnedId(cosmetic);
    if (out.has(id)) continue;
    const why = WHYS.find((w) => w === r['why']) ?? 'gift';
    out.set(id, { id, at, cosmetic, why, ...(r['seen'] === true ? { seen: true } : {}) });
  }
  return [...out.values()].sort((a, b) => b.at - a.at).slice(0, EARNED_KEEP);
}

/** The log with cosmetics just given added (one already in it stays as it was). */
export function withEarned(
  log: readonly Earned[],
  cosmetics: readonly string[],
  why: EarnedWhy,
  now: number,
): Earned[] {
  const have = new Set(log.map((e) => e.id));
  const fresh = cosmetics
    .filter((c) => cosmeticDef(c) && !have.has(earnedId(c)))
    .map((cosmetic): Earned => ({ id: earnedId(cosmetic), at: now, cosmetic, why }));
  return [...fresh, ...log].sort((a, b) => b.at - a.at).slice(0, EARNED_KEEP);
}

/** The log with these entries acknowledged. */
export const withSeen = (log: readonly Earned[], ids: readonly string[]): Earned[] =>
  log.map((e) => (ids.includes(e.id) && !e.seen ? { ...e, seen: true as const } : e));

export const unseenEarned = (log: readonly Earned[]): Earned[] => log.filter((e) => !e.seen);
