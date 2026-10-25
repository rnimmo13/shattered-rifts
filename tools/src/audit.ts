// `pnpm audit:balance`: the balance audit (docs/BALANCE.md, "Balance audit"). Decks are drafted the way a person drafts (one lane, best card
// on offer, Strikes cut, upgrades and Boons by depth: tools/src/audit/decks.ts), played by the beam-search bot, on every core.
//
//   pnpm audit:balance -- burst  [--seeds 12] [--heroes barbarian,knight]   the most damage a deck can deal on turn 1 and turn 3 (a combo search)
//   pnpm audit:balance -- ladder [--decks 4] [--levels t1s1,t5]             each deck level against its own tier: win %, turns, HP lost, peak round
//   pnpm audit:balance -- matrix [--decks 3] [--tiers 1,2,3,5,10,15,20]     deck level x tier: Warden + Vorthax win % (is a tier an accomplishment?)
//
// Read every number as a bot playing: the beam bot plans a turn but not a fight, so a person does better with engines (stances,
// totems) and worse with nothing. Burst is a search, so it is close to what a person hunting for a combo finds.

import { availableParallelism } from 'node:os';
import { Worker } from 'node:worker_threads';
import { writeFileSync } from 'node:fs';
import { enemyScale } from '@sr/campaign';
import { COMBAT_DB as db, ENCOUNTERS, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { LEVEL_SPEC, LEVELS, type Level } from './audit/decks';
import type { Job } from './audit/worker';
import type { FightResult } from './audit/fight';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}
const MODE = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ladder';
const HEROES = arg('heroes', Object.keys(RIFTWALKERS).join(',')).split(',') as HeroId[];
const LVLS = arg('levels', LEVELS.join(',')).split(',') as Level[];
const DECKS = Number(arg('decks', MODE === 'matrix' ? '3' : '4'));
const SEEDS = Number(arg('seeds', '12'));
const WORKERS = Number(arg('workers', String(Math.max(1, availableParallelism() - 2))));
const OUT = arg('out', '');

type Kind = 'regular' | 'elite' | 'warden' | 'finale';
const byKind = (k: Kind) => ENCOUNTERS.filter((e) => e.kind === k);
const scale = (tier: number, stage: number) => enemyScale(tier, stage);
const encHp = (units: string[], hpPct: number) =>
  units.reduce((s, u) => s + Math.round(((db.units[u]?.maxHp ?? 0) * hpPct) / 100), 0);

async function runAll<T>(jobs: Job[], chunk = 4): Promise<Map<number, T>> {
  const results = new Map<number, T>();
  const chunks: Job[][] = [];
  for (let i = 0; i < jobs.length; i += chunk) chunks.push(jobs.slice(i, i + chunk));
  let next = 0;
  let done = 0;
  const started = Date.now();
  await Promise.all(
    Array.from({ length: Math.min(WORKERS, chunks.length) }, () => {
      const w = new Worker(new URL('./audit/boot.mjs', import.meta.url));
      return new Promise<void>((resolve, reject) => {
        const feed = () => {
          if (next >= chunks.length) {
            void w.terminate();
            resolve();
            return;
          }
          w.postMessage(chunks[next++]);
        };
        w.on('message', (out: ({ id: number } & Record<string, unknown>)[]) => {
          for (const o of out) results.set(o.id, (o.fight ?? o.burst ?? o.optimize) as T);
          done += out.length;
          if (process.stderr.isTTY)
            process.stderr.write(
              `\r${done}/${jobs.length} (${Math.round((Date.now() - started) / 1000)}s)   `,
            );
          feed();
        });
        w.on('error', reject);
        // a worker that dies without an error would leave the run waiting for ever
        w.on('exit', (code) => {
          if (code !== 0 && next <= chunks.length) reject(new Error(`audit worker exited with code ${code}`));
        });
        feed();
      });
    }),
  );
  if (process.stderr.isTTY) process.stderr.write('\n');
  return results;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const quant = (xs: number[], q: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s[Math.min(s.length - 1, Math.floor(q * s.length))] as number) : 0;
};

async function burstMode(): Promise<void> {
  const jobs: Job[] = [];
  const meta: { hero: HeroId; level: Level; turn: number }[] = [];
  for (const hero of HEROES)
    for (const level of LVLS)
      for (const lane of [0, 1, 2])
        for (let s = 0; s < SEEDS; s++)
          for (const turn of [1, 3]) {
            meta[jobs.length] = { hero, level, turn };
            jobs.push({
              id: jobs.length,
              kind: 'burst',
              hero,
              lane,
              level,
              deckSeed: s % 3,
              enemies: ['seraphine'],
              hpPct: 100,
              dmgPct: scale(LEVEL_SPEC[level].tier, LEVEL_SPEC[level].stage).dmg,
              seed: `burst-${s}`,
              turn,
            });
          }
  const res = await runAll<number>(jobs);
  console.log(
    `\nBurst: most damage in one round (search), ${SEEDS} shuffles x 3 lanes. Cell = turn 1 median / p90 | turn 3 p90`,
  );
  console.log(`(the Warden's HP at that level's tier and stage 2 is in brackets in the header)\n`);
  const wardenHp = (l: Level) =>
    Math.round(avg(byKind('warden').map((e) => encHp(e.units, scale(LEVEL_SPEC[l].tier, 2).hp))));
  console.log('hero'.padEnd(12) + LVLS.map((l) => `${l}(${wardenHp(l)})`.padEnd(18)).join(''));
  const table: Record<string, Record<string, number[]>> = {};
  for (const hero of HEROES) {
    let row = hero.padEnd(12);
    for (const level of LVLS) {
      const t1 = jobs
        .filter(
          (j) => meta[j.id]!.hero === hero && meta[j.id]!.level === level && meta[j.id]!.turn === 1,
        )
        .map((j) => res.get(j.id) ?? 0);
      const t3 = jobs
        .filter(
          (j) => meta[j.id]!.hero === hero && meta[j.id]!.level === level && meta[j.id]!.turn === 3,
        )
        .map((j) => res.get(j.id) ?? 0);
      (table[hero] ??= {})[level] = t1;
      row += `${quant(t1, 0.5)}/${quant(t1, 0.9)} | ${quant(t3, 0.9)}`.padEnd(18);
    }
    console.log(row);
  }
  if (OUT) writeFileSync(OUT, JSON.stringify(table));
}

interface Cell {
  n: number;
  wins: number;
  turns: number[];
  hp: number[];
  peak: number[];
  stalls: number;
}
const cell = (): Cell => ({ n: 0, wins: 0, turns: [], hp: [], peak: [], stalls: 0 });
function add(c: Cell, f: FightResult): void {
  c.n++;
  if (f.won) {
    c.wins++;
    c.turns.push(f.turns);
    c.hp.push(f.hpLost);
  }
  c.peak.push(f.peak / Math.max(1, f.enemyHp));
  if (f.stalled) c.stalls++;
}
const show = (c: Cell) =>
  c.n
    ? `${pct(c.wins / c.n)} ${avg(c.turns).toFixed(1)}t -${pct(avg(c.hp))} pk${pct(avg(c.peak))}`
    : '-';

/** a spread of encounters of a kind, `n` of them, the same for every deck */
const pick = (k: Kind, n: number) => {
  const all = byKind(k);
  return all.filter((_, i) => i % Math.max(1, Math.floor(all.length / n)) === 0).slice(0, n);
};

async function ladderMode(): Promise<void> {
  const kinds: Kind[] = ['regular', 'elite', 'warden', 'finale'];
  const jobs: Job[] = [];
  const meta: { hero: HeroId; level: Level; kind: Kind }[] = [];
  for (const hero of HEROES)
    for (const level of LVLS) {
      const sp = LEVEL_SPEC[level];
      for (const kind of kinds) {
        if (kind === 'finale' && sp.stage < 3 && sp.tier === 1) continue;
        const encs =
          kind === 'regular'
            ? pick('regular', 5)
            : kind === 'elite'
              ? pick('elite', 4)
              : byKind(kind);
        const stage = kind === 'finale' ? 3 : sp.stage;
        const sc = scale(sp.tier, stage);
        for (const lane of [0, 1, 2])
          for (let d = 0; d < DECKS; d++)
            for (const e of encs) {
              meta[jobs.length] = { hero, level, kind };
              jobs.push({
                id: jobs.length,
                kind: 'fight',
                hero,
                lane,
                level,
                deckSeed: d,
                enemies: e.units,
                hpPct: sc.hp,
                dmgPct: sc.dmg,
                seed: `ladder-${e.id}-${d}`,
              });
            }
      }
    }
  const res = await runAll<FightResult>(jobs);
  const cells = new Map<string, Cell>();
  for (const j of jobs) {
    const m = meta[j.id]!;
    const f = res.get(j.id);
    if (!f) continue;
    for (const key of [`${m.hero}|${m.level}|${m.kind}`, `ALL|${m.level}|${m.kind}`]) {
      if (!cells.has(key)) cells.set(key, cell());
      add(cells.get(key)!, f);
    }
  }
  console.log(
    `\nLadder: each deck level against its own tier. Cell = win% avgTurns -HP lost on wins, pk = peak round as share of enemy HP`,
  );
  for (const level of LVLS) {
    const sp = LEVEL_SPEC[level];
    const sc = scale(sp.tier, sp.stage);
    console.log(
      `\n${level}: Tier ${sp.tier} stage ${sp.stage} (enemies ${sc.hp}% HP / ${sc.dmg}% damage)`,
    );
    console.log('hero'.padEnd(12) + kinds.map((k) => k.padEnd(28)).join(''));
    for (const hero of [...HEROES, 'ALL']) {
      console.log(
        hero.padEnd(12) +
          kinds.map((k) => show(cells.get(`${hero}|${level}|${k}`) ?? cell()).padEnd(28)).join(''),
      );
    }
  }
  const stalls = [...cells.entries()]
    .filter(([k]) => k.startsWith('ALL'))
    .reduce((s, [, c]) => s + c.stalls, 0);
  console.log(`\n${stalls} fights hit the step cap`);
  if (OUT) writeFileSync(OUT, JSON.stringify(Object.fromEntries(cells)));
}

async function matrixMode(): Promise<void> {
  const tiers = arg('tiers', '1,2,3,5,8,10,15,20').split(',').map(Number);
  const jobs: Job[] = [];
  const meta: { hero: HeroId; level: Level; tier: number }[] = [];
  const bosses = [
    ...byKind('warden').map((e) => ({ e, stage: 2 })),
    { e: byKind('finale')[0]!, stage: 3 },
  ];
  for (const hero of HEROES)
    for (const level of LVLS)
      for (const tier of tiers)
        for (const lane of [0, 1, 2])
          for (let d = 0; d < DECKS; d++)
            for (const { e, stage } of bosses) {
              const sc = scale(tier, stage);
              meta[jobs.length] = { hero, level, tier };
              jobs.push({
                id: jobs.length,
                kind: 'fight',
                hero,
                lane,
                level,
                deckSeed: d,
                enemies: e.units,
                hpPct: sc.hp,
                dmgPct: sc.dmg,
                seed: `matrix-${e.id}-${d}`,
              });
            }
  const res = await runAll<FightResult>(jobs);
  const cells = new Map<string, Cell>();
  for (const j of jobs) {
    const m = meta[j.id]!;
    const f = res.get(j.id);
    if (!f) continue;
    for (const key of [`${m.hero}|${m.level}|${m.tier}`, `ALL|${m.level}|${m.tier}`]) {
      if (!cells.has(key)) cells.set(key, cell());
      add(cells.get(key)!, f);
    }
  }
  console.log(
    `\nMatrix: boss win % (4 Wardens at stage 2 + Vorthax at stage 3), full HP. Rows = deck level, columns = Rift Tier.`,
  );
  console.log(`Cell = win% / avg turns on wins\n`);
  for (const who of ['ALL', ...(HEROES.length > 1 ? HEROES : [])]) {
    console.log(who === 'ALL' ? 'All heroes' : who);
    console.log('level'.padEnd(8) + tiers.map((t) => `T${t}`.padEnd(11)).join(''));
    for (const level of LVLS) {
      let row = level.padEnd(8);
      for (const t of tiers) {
        const c = cells.get(`${who}|${level}|${t}`) ?? cell();
        row += (c.n ? `${pct(c.wins / c.n)}/${avg(c.turns).toFixed(1)}` : '-').padEnd(11);
      }
      console.log(row);
    }
    console.log('');
  }
  if (OUT) writeFileSync(OUT, JSON.stringify(Object.fromEntries(cells)));
}

/**
 * The optimizer: per character and lane, hill-climb the deck towards the most damage over the opening rounds, then play the best
 * deck against every Warden at the level's tier. Prints the damage ceiling and how fast that deck kills.
 */
async function optimizeMode(): Promise<void> {
  const level = (arg('level', 't10') as Level) ?? 't10';
  const sp = LEVEL_SPEC[level];
  const rounds = Number(arg('rounds', '3'));
  const opt = {
    rounds,
    seeds: Number(arg('oseeds', '3')),
    iterations: Number(arg('iterations', '10')),
    moves: Number(arg('moves', '24')),
  };
  const dmgPct = scale(sp.tier, sp.stage).dmg;
  const jobs: Job[] = [];
  for (const hero of HEROES)
    for (const lane of [0, 1, 2])
      jobs.push({
        id: jobs.length,
        kind: 'optimize',
        hero,
        lane,
        level,
        deckSeed: 0,
        enemies: [],
        hpPct: 100,
        dmgPct,
        seed: '',
        opt,
      });
  const res = await runAll<{ deck: string[]; boons: string[]; score: number; perRound: number[] }>(
    jobs,
    1,
  );
  // play each optimized deck against every Warden at this level's tier
  const fights: Job[] = [];
  const sc = scale(sp.tier, sp.stage);
  for (const j of jobs) {
    const o = res.get(j.id);
    if (!o) continue;
    for (const e of byKind('warden'))
      for (let s = 0; s < 3; s++)
        fights.push({
          id: 100000 + fights.length,
          kind: 'fight',
          hero: j.hero,
          lane: j.lane,
          level,
          deckSeed: j.id,
          deck: o.deck,
          boons: o.boons,
          enemies: e.units,
          hpPct: sc.hp,
          dmgPct: sc.dmg,
          seed: `optfight-${e.id}-${s}`,
        });
  }
  const fr = await runAll<FightResult>(fights);
  const wardenHp = Math.round(avg(byKind('warden').map((e) => encHp(e.units, sc.hp))));
  console.log(
    `\nOptimizer at ${level} (Tier ${sp.tier} stage ${sp.stage}; a Warden has ~${wardenHp} HP there).`,
  );
  console.log(
    `Damage per round over the first ${rounds} rounds of the best deck found, then that deck against every Warden.\n`,
  );
  console.log(
    'hero'.padEnd(12) +
      'lane'.padEnd(6) +
      'per round'.padEnd(22) +
      'vs Wardens'.padEnd(30) +
      'deck',
  );
  const out: Record<string, unknown> = {};
  for (const j of jobs) {
    const o = res.get(j.id);
    if (!o) continue;
    const c = cell();
    for (const f of fights.filter((x) => x.deckSeed === j.id)) {
      const r = fr.get(f.id);
      if (r) add(c, r);
    }
    out[`${j.hero}/${j.lane}`] = { ...o, fights: c };
    console.log(
      j.hero.padEnd(12) +
        String(j.lane).padEnd(6) +
        o.perRound
          .map((x) => Math.round(x))
          .join(' / ')
          .padEnd(22) +
        show(c).padEnd(30) +
        o.deck.filter((x) => db.cards[x]?.rarity !== 'basic').join(' '),
    );
  }
  if (OUT) writeFileSync(OUT, JSON.stringify(out));
}

const modes: Record<string, () => Promise<void>> = {
  burst: burstMode,
  ladder: ladderMode,
  matrix: matrixMode,
  optimize: optimizeMode,
};
const run = modes[MODE];
if (!run) {
  console.error(`unknown mode "${MODE}" (burst | ladder | matrix)`);
  process.exit(1);
}
await run();
