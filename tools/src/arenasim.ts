// `pnpm arenasim -- [--levels t5,t10,t20] [--mults 3,5,6] [--per 1] [--shard 0/1]`: Arena matches between drafted decks (the balance
// audit's drafts, tools/src/audit/decks.ts), no Boons (DECISIONS #236), the ghost pilot (the smart bot) on both seats, at several Arena
// HP multipliers. Prints one JSON line per match (seat, heroes, rounds, the biggest single turn each side dealt as a share of the
// other's max HP, who won), for `--report` to sum up: how long matches last, how often someone dies having had one turn or two, and
// whether the first seat wins too often.
//
// `--ghost [--ks 0.6,1,1.4] [--dmgs full,half]`: ghost Wardens instead (see ghostFight), summed up by `--ghostreport`.
//
// A bot is not a person: read it as a hint about the shape, not the exact numbers.

import { applyAction, chooseSmartAction, createCombat, heroOf, type CombatState } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { enemyScale } from '@sr/campaign';
import { readFileSync } from 'node:fs';
import { buildDeck, hashSeed, LEVEL_SPEC, type Level } from './audit/decks';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}

const lines = (file: string): string[] =>
  readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.startsWith('{'));
const med = (xs: number[]): number => [...xs].sort((p, q) => p - q)[Math.floor(xs.length / 2)] ?? 0;
const p90 = (xs: number[]): number =>
  [...xs].sort((p, q) => p - q)[Math.floor(xs.length * 0.9)] ?? 0;
const pct = (n: number, d: number): string => `${Math.round((100 * n) / Math.max(1, d))}%`;

interface Row {
  level: string;
  mult: number;
  a: string;
  b: string;
  rounds: number;
  winner: 'a' | 'b' | 'draw';
  /** the biggest single turn each side dealt to the other hero, percent of the other's max HP */
  peakA: number;
  peakB: number;
  /** how many turns the loser had had when it died */
  loserTurns: number;
}

function play(level: Level, mult: number, x: HeroId, y: HeroId, seed: string): Row {
  const deckOf = (h: HeroId, k: string) =>
    buildDeck(h, level, hashSeed(`${h}/${level}/${k}`)).deck;
  const hp = (h: HeroId, extra: number) => db.heroes[h]!.maxHp * mult + extra;
  let s: CombatState = createCombat(db, {
    seed,
    a: { hero: x, deck: deckOf(x, `${seed}a`), hp: hp(x, 0), maxHp: hp(x, 0) },
    b: { hero: y, deck: deckOf(y, `${seed}b`), hp: hp(y, 10 * mult), maxHp: hp(y, 10 * mult) },
  }).state;
  const peak = { a: 0, b: 0 };
  const maxOf = { a: heroOf(s.sides.a)!.maxHp, b: heroOf(s.sides.b)!.maxHp };
  const turns = { a: 0, b: 0 };
  let side = s.active;
  let otherStart = heroOf(s.sides[side === 'a' ? 'b' : 'a'])!.hp;
  turns[side]++;
  let guard = 0;
  while (!s.winner && guard++ < 3000) {
    s = applyAction(db, s, chooseSmartAction(db, s, { budget: 600 })).state;
    const foe = side === 'a' ? 'b' : 'a';
    const dealt = otherStart - Math.max(0, heroOf(s.sides[foe])?.hp ?? 0);
    peak[side] = Math.max(peak[side], (100 * dealt) / maxOf[foe]);
    if (s.active !== side && !s.winner) {
      side = s.active;
      turns[side]++;
      otherStart = heroOf(s.sides[side === 'a' ? 'b' : 'a'])?.hp ?? 0;
    }
  }
  const winner = s.winner === 'a' || s.winner === 'b' ? s.winner : 'draw';
  const loser = winner === 'a' ? 'b' : 'a';
  return {
    level,
    mult,
    a: x,
    b: y,
    rounds: Math.ceil(s.turn / 2),
    winner,
    peakA: Math.round(peak.a),
    peakB: Math.round(peak.b),
    loserTurns: winner === 'draw' ? 0 : turns[loser],
  };
}

function report(file: string): void {
  const rows = lines(file).map((l) => JSON.parse(l) as Row);
  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const k = `${r.level} x${r.mult}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  console.log(
    'level mult   n  rounds(med/p10)  died after 1 turn / 2 turns  peak turn %maxHP (med/p90)  seat a wins',
  );
  for (const [k, g] of [...groups].sort()) {
    const rounds = g.map((r) => r.rounds);
    const peaks = g.flatMap((r) => [r.peakA, r.peakB]);
    const sorted = [...rounds].sort((p, q) => p - q);
    console.log(
      `${k.padEnd(10)} ${String(g.length).padStart(4)}  ${String(med(rounds)).padStart(5)}/${String(sorted[Math.floor(g.length * 0.1)] ?? 0).padEnd(10)}` +
        `${pct(g.filter((r) => r.loserTurns === 1).length, g.length).padStart(8)} / ${pct(g.filter((r) => r.loserTurns === 2).length, g.length).padEnd(18)}` +
        `${String(med(peaks)).padStart(8)}/${String(p90(peaks)).padEnd(22)}${pct(g.filter((r) => r.winner === 'a').length, g.length)}`,
    );
  }
  // which Riftwalkers deal the biggest turns
  const by = new Map<string, number[]>();
  for (const r of rows) {
    by.set(r.a, [...(by.get(r.a) ?? []), r.peakA]);
    by.set(r.b, [...(by.get(r.b) ?? []), r.peakB]);
  }
  console.log(
    '\nbiggest turn by Riftwalker, all levels and multipliers (%maxHP, med/p90) and win %',
  );
  for (const [h, xs] of [...by].sort()) {
    const games = rows.filter((r) => r.a === h || r.b === h);
    const wins = games.filter(
      (r) => (r.a === h && r.winner === 'a') || (r.b === h && r.winner === 'b'),
    ).length;
    console.log(
      `${h.padEnd(12)} ${String(med(xs)).padStart(4)}/${String(p90(xs)).padEnd(5)} ${pct(wins, games.length)}`,
    );
  }
}

interface GhostRow {
  level: string;
  k: number;
  dmg: 'full' | 'half' | 'none' | 'rel';
  a: string;
  b: string;
  won: boolean;
  rounds: number;
  hpLost: number;
  ghostHp: number;
  dmgPct: number;
}

/**
 * A ghost Warden. The player (deck and Boons of this level, its campaign HP) against another Riftwalker's deck of the same level (with
 * its Boons, as a ghost Warden has), whose HP is its base x k x the tier table's HP for this level's tier and stage, and whose damage is
 * the tier table's (`full`) or half of what the table adds (`half`).
 */
function ghostFight(
  level: Level,
  k: number,
  dmg: 'full' | 'half' | 'none' | 'rel',
  x: HeroId,
  y: HeroId,
  seed: string,
): GhostRow {
  const sp = LEVEL_SPEC[level];
  const sc = enemyScale(sp.tier, sp.stage);
  const me = buildDeck(x, level, hashSeed(`${x}/${level}/${seed}a`));
  const gh = buildDeck(y, level, hashSeed(`${y}/${level}/${seed}b`));
  const myHp = db.heroes[x]!.maxHp + me.boons.reduce((n, b) => n + (db.boons[b]?.maxHp ?? 0), 0);
  // (--flat: k alone, without the tier table; today's ghost Warden is 1.65 + 0.07 a tier past 3)
  const ghostHp = Math.round(
    (db.heroes[y]!.maxHp *
      k *
      (process.argv.includes('--flat')
        ? 100
        : process.argv.includes('--rel')
          ? (100 * sc.hp) / enemyScale(4, 1).hp
          : sc.hp)) /
      100,
  );
  const dmgPct =
    dmg === 'full'
      ? sc.dmg
      : dmg === 'half'
        ? Math.round(100 + (sc.dmg - 100) / 2)
        : dmg === 'rel'
          ? Math.round((100 * sc.dmg) / enemyScale(4, 1).dmg)
          : 100;
  let st: CombatState = createCombat(db, {
    seed,
    a: { hero: x, deck: me.deck, boons: me.boons, hp: myHp, maxHp: myHp },
    b: { hero: y, deck: gh.deck, boons: gh.boons, hp: ghostHp, maxHp: ghostHp, dmgPct },
  }).state;
  let guard = 0;
  while (!st.winner && guard++ < 4000)
    st = applyAction(db, st, chooseSmartAction(db, st, { budget: 600 })).state;
  const left = Math.max(0, heroOf(st.sides.a)?.hp ?? 0);
  return {
    level,
    k,
    dmg,
    a: x,
    b: y,
    won: st.winner === 'a',
    rounds: Math.ceil(st.turn / 2),
    hpLost: Math.round((100 * (myHp - left)) / myHp),
    ghostHp,
    dmgPct,
  };
}

function ghostReport(file: string): void {
  const rows = lines(file).map((l) => JSON.parse(l) as GhostRow);
  const groups = new Map<string, GhostRow[]>();
  for (const r of rows) {
    const key = `${r.level} k${r.k} ${r.dmg}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  console.log(
    'level k dmg          n  player wins  rounds(med)  HP lost when won (med)  ghost HP / dmg%',
  );
  for (const [key, g] of [...groups].sort()) {
    const won = g.filter((r) => r.won);
    console.log(
      `${key.padEnd(18)} ${String(g.length).padStart(4)}  ${pct(won.length, g.length).padStart(9)}  ${String(med(g.map((r) => r.rounds))).padStart(8)}  ${String(med(won.map((r) => r.hpLost))).padStart(14)}%       ${med(g.map((r) => r.ghostHp))} / ${g[0]?.dmgPct ?? 0}`,
    );
  }
}

const [shard, shards] = arg('shard', '0/1').split('/').map(Number) as [number, number];
const heroes = Object.keys(RIFTWALKERS) as HeroId[];
if (process.argv.includes('--ghostreport')) ghostReport(arg('ghostreport', ''));
else if (process.argv.includes('--report')) report(arg('report', ''));
else if (process.argv.includes('--ghost')) {
  const levels = arg('levels', 't5,t10,t20').split(',') as Level[];
  const ks = arg('ks', '0.6,1,1.4').split(',').map(Number);
  const dmgs = arg('dmgs', 'full,half').split(',') as ('full' | 'half' | 'none' | 'rel')[];
  let n = 0;
  for (const level of levels)
    for (const x of heroes)
      for (const y of heroes) {
        if (x === y || n++ % shards !== shard) continue;
        for (const k of ks)
          for (const d of dmgs)
            console.log(JSON.stringify(ghostFight(level, k, d, x, y, `ghost-${level}-${x}-${y}`)));
      }
} else {
  const levels = arg('levels', 't5,t10,t20').split(',') as Level[];
  const mults = arg('mults', '3,5,6').split(',').map(Number);
  const per = Number(arg('per', '1'));
  let n = 0;
  for (const level of levels)
    for (const x of heroes)
      for (const y of heroes) {
        if (x === y) continue;
        for (let i = 0; i < per; i++) {
          if (n++ % shards !== shard) continue;
          for (const mult of mults)
            console.log(JSON.stringify(play(level, mult, x, y, `arena-${level}-${x}-${y}-${i}`)));
        }
      }
}
