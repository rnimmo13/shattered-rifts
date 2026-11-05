// Offline experiments only. Never imported by the game or production ghost pilot.
import {
  applyAction,
  chooseSmartAction,
  BOT_VERSION,
  createCombat,
  heroOf,
  type Side,
  type CombatState,
  type CombatDb,
} from '@sr/combat';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { chooseSmartAction as reviewAction } from './reviewPilot';
import { COMBAT_DB as db, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { duelPlan, newRun } from '@sr/campaign';
import { ARENA_START_HP, EMPTY_TURN_LIMIT } from '@sr/pvp';
import { chooseSmartAction as legacyAction } from './legacyPilot';

export interface Deck {
  id: string;
  hero: HeroId;
  name: string;
  deck: string[];
  quality: string;
}
export interface Job {
  policyVersion?: string;
  id: number;
  mode: 'arena' | 'boss';
  a: Deck;
  b?: Deck;
  seed: string;
  budget: number;
  hpBonus?: number;
  tier?: number;
  bossHpFactor?: number;
  bossDamageFactor?: number;
  trace?: boolean;
  bloodOathConsume?: boolean;
  databaseFile?: string;
  pilot?: 'released' | 'review' | 'legacy';
  opponentPilot?: 'released' | 'legacy';
}
export interface Result {
  bot?: string;
  id: number;
  mode: string;
  a: string;
  b?: string;
  quality: string;
  seed: string;
  budget: number;
  winner: Side | 'draw' | null;
  censored: boolean;
  turns: { a: number; b: number };
  steps: number;
  hp: { a: number; b: number };
  maxHp: { a: number; b: number };
  bossFraction?: number;
  plays: Record<string, number>;
  ms: number;
  hpBonus: number;
  tier: number;
  bossHpFactor?: number;
  bossDamageFactor?: number;
  trace?: {
    turn: number;
    side: Side;
    card: string;
    mana: number;
    reserves: number;
    hp: number;
    foeHp: number;
    barrier: number;
  }[];
  peakPlayed?: { a: number; b: number };
  bloodOathConsume?: boolean;
}
export const BOONS = [
  'iron-sigil',
  'might-idol',
  'ember-lamp',
  'rift-satchel',
  'crystal-heart',
  'vigor-wick',
  'thorn-charm',
  'hunters-lens',
  'aegis-of-ages',
  'hex-lantern',
  'gilded-crown',
  'healing-vial',
];
const databases = new Map<string, CombatDb>();
export function fight(j: Job): Result {
  if (j.policyVersion && j.policyVersion !== BOT_VERSION)
    throw Error('Use the recorded AI version to replay this experiment.');
  const started = Date.now();
  if (j.databaseFile && !databases.has(j.databaseFile))
    databases.set(
      j.databaseFile,
      JSON.parse(gunzipSync(readFileSync(j.databaseFile)).toString()) as CombatDb,
    );
  const sourceDb = j.databaseFile ? databases.get(j.databaseFile)! : db;
  const combatDb = j.bloodOathConsume
    ? {
        ...sourceDb,
        cards: {
          ...sourceDb.cards,
          'blood-oath': { ...sourceDb.cards['blood-oath']!, exhaust: true },
          'blood-oath+': { ...sourceDb.cards['blood-oath+']!, exhaust: true },
        },
      }
    : sourceDb;
  const hp = () => ARENA_START_HP;
  let state: CombatState;
  if (j.mode === 'arena') {
    if (!j.b) throw Error('Missing opponent');
    state = createCombat(combatDb, {
      seed: j.seed,
      a: {
        hero: j.a.hero,
        deck: j.a.deck,
        ascendancy: j.a.id,
        maxHp: hp(),
        hp: hp(),
      },
      b: {
        hero: j.b.hero,
        deck: j.b.deck,
        ascendancy: j.b.id,
        maxHp: hp(),
        hp: hp(),
      },
    }).state;
  } else {
    const run = newRun(j.a.hero, j.seed);
    const boss = run.map.nodes.find((n) => n.kind === 'warden');
    if (!boss) throw Error('Missing boss node');
    boss.enemyId = 'vorthax';
    const maxHp =
      RIFTWALKERS[j.a.hero].hero.maxHp +
      BOONS.reduce((n, b) => n + (db.boons?.[b]?.maxHp ?? 0), 0) +
      (j.hpBonus ?? 0);
    Object.assign(run, {
      phase: 'duel',
      context: { nodeId: boss.id },
      difficulty: 'normal',
      tier: j.tier ?? 20,
      deck: j.a.deck,
      boons: BOONS,
      hp: maxHp,
      maxHp,
      ascendancy: j.a.id,
    });
    const p = duelPlan(run);
    if (!p) throw Error('No duel plan');
    state = createCombat(combatDb, {
      seed: j.seed,
      a: {
        hero: j.a.hero,
        deck: p.deck,
        boons: p.boons,
        hp: p.hp,
        maxHp: p.maxHp,
        ascendancy: j.a.id,
        statuses: p.heroStatuses,
      },
      b: {
        enemies: p.units,
        tier: p.tier,
        hpPct: Math.round(p.hpPct * (j.bossHpFactor ?? 1)),
        dmgPct: Math.round(p.dmgPct * (j.bossDamageFactor ?? 1)),
        mods: p.mods,
      },
    }).state;
  }
  const maxHp = {
    a: heroOf(state.sides.a)!.maxHp,
    b:
      j.mode === 'arena'
        ? heroOf(state.sides.b)!.maxHp
        : state.sides.b.units.find((u) => u.def === 'vorthax')!.maxHp,
  };
  const turns = { a: 1, b: 0 };
  const plays: Record<string, number> = {};
  const trace: NonNullable<Result['trace']> = [];
  const peakPlayed = { a: 0, b: 0 };
  let steps = 0;
  const passes = { a: 0, b: 0 };
  for (; !state.winner && steps < 3000 && Math.max(turns.a, turns.b) <= 40; steps++) {
    const before = state;
    const side = before.active;
    peakPlayed[side] = Math.max(peakPlayed[side], before.sides[side].played);
    const pilot = side === 'b' && j.opponentPilot ? j.opponentPilot : j.pilot;
    const act = (
      pilot === 'review' ? reviewAction : pilot === 'legacy' ? legacyAction : chooseSmartAction
    )(combatDb, before, {
      budget: j.budget,
      width: 8,
      depth: 10,
    });
    if (j.trace && trace.length < 300)
      trace.push({
        turn: before.turn,
        side,
        card:
          act.type === 'play'
            ? before.sides[side].hand.find((c) => c.id === act.card)!.card
            : act.type,
        mana: before.sides[side].mana,
        reserves: before.sides[side].reserves,
        hp: heroOf(before.sides[side])?.hp ?? 0,
        foeHp: heroOf(before.sides[side === 'a' ? 'b' : 'a'])?.hp ?? 0,
        barrier: heroOf(before.sides[side])?.barrier ?? 0,
      });
    if (act.type === 'play') {
      const c = before.sides[side].hand.find((c) => c.id === act.card);
      if (c) {
        const key = side + ':' + c.card;
        plays[key] = (plays[key] ?? 0) + 1;
      }
    }
    state = applyAction(combatDb, before, act).state;
    if (act.type === 'play') passes[side] = 0;
    if (j.mode === 'arena' && state.turn !== before.turn) {
      passes[side] = before.sides[side].played === 0 ? passes[side] + 1 : 0;
      if (!state.winner && passes.a >= EMPTY_TURN_LIMIT && passes.b >= EMPTY_TURN_LIMIT)
        state.winner = 'draw';
    }
    if (!state.winner && state.turn !== before.turn) {
      if (j.mode === 'boss') turns.a++;
      else turns[state.active]++;
    }
  }
  const boss = state.sides.b.units.find((u) => u.def === 'vorthax');
  return {
    bot:
      j.pilot === 'legacy'
        ? 'legacy-1'
        : j.pilot === 'review'
          ? 'experimental-review'
          : BOT_VERSION,
    id: j.id,
    mode: j.mode,
    a: j.a.id,
    ...(j.b ? { b: j.b.id } : {}),
    quality: j.a.quality,
    seed: j.seed,
    budget: j.budget,
    winner: state.winner,
    censored: state.winner === null,
    turns,
    steps,
    hp: {
      a: heroOf(state.sides.a)?.hp ?? 0,
      b: j.mode === 'arena' ? (heroOf(state.sides.b)?.hp ?? 0) : (boss?.hp ?? 0),
    },
    maxHp,
    ...(j.mode === 'boss' ? { bossFraction: (boss?.hp ?? 0) / maxHp.b } : {}),
    plays,
    ms: Date.now() - started,
    hpBonus: j.hpBonus ?? 0,
    tier: j.tier ?? 20,
    ...(j.bossHpFactor !== undefined ? { bossHpFactor: j.bossHpFactor } : {}),
    ...(j.bossDamageFactor !== undefined ? { bossDamageFactor: j.bossDamageFactor } : {}),
    ...(j.trace ? { trace, peakPlayed } : {}),
    ...(j.bloodOathConsume ? { bloodOathConsume: true } : {}),
  };
}
