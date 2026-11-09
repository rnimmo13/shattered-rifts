// pnpm goldfish (DECISIONS #704): how fast each deck kills, with nobody fighting back. Every deck plays the Arena (1000 HP each, its
// Ascendancy on) against a training opponent who only ends turns, and the damage it deals is recorded own turn by own turn. That shows
// each build's damage curve (burst, steady, setup then payoff, ramp) and its kill turn, without the noise of a matchup. Offline only.
//
// Usage: pnpm goldfish -- --decks <file.json> [--seeds 4] [--workers 16] [--out <file.json>] [--only "<deck name>"]
//   [--spar [start,step,hits]]: the opponent hits back (default 50,10,4: 50 damage on its first turn, 10 more each turn, 4 Strikes)
//   [--hero-only]: the sparring opponent never hits companions (by default it finishes off any companion a hit would kill)
//   [--patch <file.json>]: try card changes first ({ "cards": { "<id>": { ...fields } } }, see goldfish.ts)
//   [--breakdown]: also print where each deck's damage came from, card by card (average per game)
//   decks file: [{ "id": "<hero>:<ascendancy>", "hero": "<hero>", "name": "<unique name>", "deck": ["card", ...] }, ...]
import { Worker } from 'node:worker_threads';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEFAULT_SPARRING, type GoldfishJob, type GoldfishResult, type Sparring } from './goldfish';

const arg = (k: string, d?: string): string | undefined => {
  const i = process.argv.indexOf('--' + k);
  return i < 0 ? d : (process.argv[i + 1] ?? d);
};
const decksFile = arg('decks');
if (!decksFile) throw Error('Pass --decks <file.json>');
const seeds = Number(arg('seeds', '4'));
const workers = Number(arg('workers', '16'));
const only = arg('only');
const sparArg = process.argv.includes('--spar') ? arg('spar', '') : undefined;
const sparring: Sparring | undefined =
  sparArg === undefined
    ? undefined
    : /^\d+,\d+,\d+$/.test(sparArg)
      ? (([start, step, hits]) => ({ start: start!, step: step!, hits: hits! }))(
          sparArg.split(',').map(Number),
        )
      : DEFAULT_SPARRING;
if (sparring && process.argv.includes('--hero-only')) sparring.aim = 'hero';
const breakdown = process.argv.includes('--breakdown');
const patchArg = arg('patch');
const patch = patchArg ? resolve(patchArg) : undefined;
type Built = { id: string; hero: string; name: string; deck: string[] };
const decks = (JSON.parse(readFileSync(resolve(decksFile), 'utf8')) as Built[]).filter(
  (d) => !only || d.name === only,
);
if (decks.length === 0) throw Error('No decks');

const jobs: GoldfishJob[] = decks.flatMap((d) =>
  Array.from({ length: seeds }, (_, s) => ({
    deck: d,
    seed: `goldfish-${d.name}-${s}`,
    ...(sparring ? { sparring } : {}),
    ...(patch ? { patch } : {}),
  })),
);
const results: GoldfishResult[] = [];
let next = 0;
await Promise.all(
  Array.from(
    { length: Math.min(workers, jobs.length) },
    () =>
      new Promise<void>((done, fail) => {
        const w = new Worker(new URL('./boot.mjs', import.meta.url));
        const feed = (): void => {
          if (next >= jobs.length) {
            void w.terminate();
            done();
          } else w.postMessage(jobs[next++]);
        };
        w.on('message', (m: { ok: boolean; result?: GoldfishResult; error?: string }) => {
          if (m.ok) results.push(m.result!);
          else console.error(m.error);
          if (results.length % 20 === 0) console.error(`${results.length}/${jobs.length}`);
          feed();
        });
        w.on('error', fail);
        feed();
      }),
  ),
);

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[s.length >> 1]! : 0;
};
const TURNS = 15;
const rows = decks.map((d) => {
  const mine = results.filter((r) => r.name === d.name);
  // damage on each own turn (a game that already killed counts its turns after as 0, so the curve is the deck's, not survivors')
  const curve = Array.from({ length: TURNS }, (_, t) =>
    Math.round(median(mine.map((r) => r.perTurn[t] ?? 0))),
  );
  return {
    name: d.name,
    id: d.id,
    killTurn: median(mine.map((r) => r.killTurn ?? TURNS + 1)),
    kills: mine.filter((r) => r.killTurn !== null).length,
    games: mine.length,
    by5: Math.round(median(mine.map((r) => r.perTurn.slice(0, 5).reduce((a, b) => a + b, 0)))),
    biggestTurn: Math.round(median(mine.map((r) => Math.max(0, ...r.perTurn)))),
    died: mine.filter((r) => r.diedTurn !== null).length,
    diedTurn: median(mine.map((r) => r.diedTurn ?? TURNS + 1)),
    lostBy5: Math.round(
      median(mine.map((r) => r.lostPerTurn.slice(0, 5).reduce((a, b) => a + b, 0))),
    ),
    curve,
  };
});
rows.sort((a, b) => a.killTurn - b.killTurn || b.by5 - a.by5);
const out = arg('out');
if (out) writeFileSync(resolve(out), JSON.stringify({ seeds, sparring, rows }, null, 1));
const t = (n: number): string => String(n > TURNS ? '>' + TURNS : n).padStart(4);
console.log(
  (sparring
    ? `sparring ${sparring.start}+${sparring.step}/turn in ${sparring.hits} hits; `
    : 'passive; ') +
    'kill = median own turn it kills; died = games lost / median turn; lost5 = HP lost by turn 5',
);
console.log('kill  by5  peak  died      lost5  deck  | damage per own turn 1-' + TURNS);
for (const r of rows)
  console.log(
    `${t(r.killTurn)} ${String(r.by5).padStart(4)} ${String(r.biggestTurn).padStart(5)}  ${r.died}/${r.games} ${t(r.diedTurn)} ${String(r.lostBy5).padStart(5)}  ${r.name} | ${r.curve.join(' ')}`,
  );
if (breakdown)
  for (const r of rows) {
    const mine = results.filter((x) => x.name === r.name);
    const sum: Record<string, number> = {};
    for (const g of mine)
      for (const [k, v] of Object.entries(g.bySource)) sum[k] = (sum[k] ?? 0) + v / mine.length;
    const total = Object.values(sum).reduce((a, b) => a + b, 0);
    const top = Object.entries(sum)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k, v]) => `${k} ${Math.round(v)} (${Math.round((100 * v) / total)}%)`);
    console.log(`
${r.name}: ${top.join(', ')}`);
  }
