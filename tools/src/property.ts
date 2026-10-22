// `pnpm test:property`: the engine's property gate (07_TECH_ARCHITECTURE §5).
// Plays N random legal games (default 10,000) between random legal decks drawn from the WHOLE card
// pool, checking invariants after every action: card conservation, zone bookkeeping, slot limits,
// finite numbers, every game ends within 200 turns, engine safety caps never hit.
//
//   pnpm test:property                      10,000 games, all cores
//   pnpm test:property -- --games 500       a quicker run
//   pnpm test:property -- --only 1234       replay one game by index (single thread) to debug it
//   flags: --seed S  --workers N

import { Worker } from 'node:worker_threads';
import { defaultWorkers } from './sim/runner';
import { runPropertyGame, type PropertyResult } from './sim/propertyGame';

const argv = process.argv.slice(2).filter((x) => x !== '--');
const flag = (name: string): string | undefined => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const games = Number(flag('games') ?? 10_000);
if (!Number.isInteger(games) || games <= 0) {
  console.error('--games must be a positive whole number');
  process.exit(1);
}
const seed = flag('seed') ?? 'property';
const workers = Number(flag('workers') ?? defaultWorkers());
const only = flag('only');

async function run(indices: number[]): Promise<PropertyResult[]> {
  if (workers <= 1 || indices.length < 16) return indices.map((i) => runPropertyGame(i, seed));
  const n = Math.min(workers, indices.length);
  const chunks: number[][] = Array.from({ length: n }, () => []);
  indices.forEach((idx, k) => (chunks[k % n] as number[]).push(idx));
  const parts = await Promise.all(
    chunks.map(
      (chunk) =>
        new Promise<PropertyResult[]>((resolve, reject) => {
          const w = new Worker(new URL('./sim/worker-entry.mjs', import.meta.url), {
            workerData: { module: './property-worker.ts' },
          });
          w.once('message', (r: PropertyResult[]) => {
            resolve(r);
            void w.terminate();
          });
          w.once('error', reject);
          w.postMessage({ indices: chunk, seed });
        }),
    ),
  );
  return parts.flat();
}

async function main(): Promise<void> {
  const started = Date.now();
  if (only !== undefined) {
    const r = runPropertyGame(Number(only), seed);
    console.log(
      r.ok
        ? `game ${only}: ok (${r.turns} turns, ${r.actions} actions)`
        : `game ${only}: FAILED: ${r.error}`,
    );
    process.exitCode = r.ok ? 0 : 1;
    return;
  }
  console.log(
    `Property gate: ${games} random games, ${workers} worker${workers === 1 ? '' : 's'}, seed "${seed}"`,
  );
  const results = await run(Array.from({ length: games }, (_, i) => i));
  const failures = results.filter((r) => !r.ok);
  const ok = results.filter((r) => r.ok);
  const avg = (f: (r: PropertyResult) => number) =>
    ok.reduce((t, r) => t + f(r), 0) / Math.max(1, ok.length);
  console.log(
    `${ok.length}/${results.length} games clean. avg ${avg((r) => r.turns).toFixed(1)} turns, ${avg((r) => r.actions).toFixed(0)} actions; ` +
      `longest ${Math.max(0, ...ok.map((r) => r.turns))} turns; ${ok.filter((r) => r.draw).length} draws; ${((Date.now() - started) / 1000).toFixed(1)}s`,
  );
  if (failures.length > 0) {
    console.error(
      `\n${failures.length} FAILED. First few (replay with: pnpm test:property -- --only <index> --seed ${seed}):`,
    );
    for (const f of failures.slice(0, 10)) console.error(`  game ${f.index}: ${f.error}`);
    process.exitCode = 1;
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
