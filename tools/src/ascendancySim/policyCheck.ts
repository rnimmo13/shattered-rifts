/** Matched policy comparison, not a fresh class tier ranking. */
import { Worker } from 'node:worker_threads';
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { COMBAT_DB } from '@sr/content/v2';
import { BOT_SEARCH, BOT_VERSION } from '@sr/combat';
import type { Deck, Job, Result } from './fight';
const dir = fileURLToPath(
  new URL('../../../docs/balance-history/simulations/0.200.0/', import.meta.url),
);
mkdirSync(dir, { recursive: true });
const file = dir + 'policy-check.jsonl';
if (existsSync(file)) throw Error('Refusing to overwrite the policy benchmark');
const decks = JSON.parse(
  readFileSync(
    new URL('../../../docs/balance-history/simulations/0.199.0/decks.json', import.meta.url),
    'utf8',
  ),
) as Record<'arena' | 'boss', { optimized: Deck[] }>;
const databaseFile = dir + 'policy-db.json.gz';
writeFileSync(databaseFile, gzipSync(JSON.stringify(COMBAT_DB)));
const jobs: Job[] = [];
for (const d of decks.arena.optimized)
  for (const first of [true, false])
    jobs.push({
      id: jobs.length,
      mode: 'arena',
      a: d,
      b: d,
      seed: 'policy-mirror-200-' + d.id,
      budget: BOT_SEARCH.budget,
      databaseFile,
      pilot: first ? 'released' : 'legacy',
      opponentPilot: first ? 'legacy' : 'released',
    });
for (const d of decks.boss.optimized)
  for (const pilot of ['released', 'legacy'] as const)
    jobs.push({
      id: jobs.length,
      mode: 'boss',
      a: d,
      seed: 'policy-boss-200-' + d.id,
      budget: BOT_SEARCH.budget,
      databaseFile,
      pilot,
    });
writeFileSync(dir + 'policy-jobs.json.gz', gzipSync(JSON.stringify(jobs)));
let next = 0,
  done = 0;
const results: Result[] = [];
await Promise.all(
  Array.from(
    { length: 8 },
    () =>
      new Promise<void>((resolve, reject) => {
        const worker = new Worker(new URL('./boot.mjs', import.meta.url));
        let closing = false;
        const feed = () => {
          if (next >= jobs.length) {
            closing = true;
            void worker.terminate();
            resolve();
          } else worker.postMessage(jobs[next++]);
        };
        worker.on('message', (m: { ok: boolean; result: Result; error?: string }) => {
          if (!m.ok) {
            closing = true;
            void worker.terminate();
            reject(Error(m.error));
            return;
          }
          results.push(m.result);
          appendFileSync(file, JSON.stringify(m.result) + '\n');
          if (++done % 10 === 0) console.log(`${done}/${jobs.length}`);
          feed();
        });
        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (!closing) reject(Error('Worker exit ' + code));
        });
        feed();
      }),
  ),
);
writeFileSync(file + '.gz', gzipSync(readFileSync(file)));
const arena = results.filter((r) => r.mode === 'arena');
const newWins = arena.filter(
  (r) => r.winner === (jobs[r.id]!.pilot === 'released' ? 'a' : 'b'),
).length;
const oldWins = arena.filter(
  (r) => r.winner === (jobs[r.id]!.pilot === 'legacy' ? 'a' : 'b'),
).length;
const summary = {
  bot: BOT_VERSION,
  search: BOT_SEARCH,
  matches: results.length,
  arena: {
    newWins,
    oldWins,
    draws: arena.filter((r) => r.winner === 'draw').length,
    unresolved: arena.filter((r) => r.censored).length,
  },
  boss: Object.fromEntries(
    ['released', 'legacy'].map((p) => {
      const rs = results.filter((r) => r.mode === 'boss' && jobs[r.id]!.pilot === p);
      return [
        p,
        {
          wins: rs.filter((r) => r.winner === 'a').length,
          attempts: rs.length,
          unresolved: rs.filter((r) => r.censored).length,
        },
      ];
    }),
  ),
  limitation:
    'One seed per style, same frozen tuned decks, mirrored Arena seats. Current shared 1000-HP/card-only second-seat rules for both policies. No deck retuning, human games, learning or class tier inference. Legacy has draw-order foreknowledge; current policy does not.',
};
writeFileSync(dir + 'policy-summary.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary));
