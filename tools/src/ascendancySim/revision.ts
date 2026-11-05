import { Worker } from 'node:worker_threads';
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMBAT_DB, maxCopiesOf, rewardPool, RIFTWALKERS } from '@sr/content/v2';
import type { Job, Result, Deck } from './fight';
import { RULES_VERSION } from '@sr/pvp';
if (Number(RULES_VERSION) !== 82)
  throw Error(
    'Historical 0.199 runner requires rules82 source; do not mix current results into that archive.',
  );
const root = fileURLToPath(new URL('../../../', import.meta.url));
const dir = resolve(root, 'docs/balance-history/simulations/0.199.0');
const arg = (key: string, fallback: string) => {
  const i = process.argv.indexOf('--' + key);
  return i < 0 ? fallback : process.argv[i + 1]!;
};
const label = arg('label', '');
if (!/^[a-z0-9-]+$/.test(label)) throw Error('A new --label is required');
const pilot = arg('pilot', 'released') as Job['pilot'];
if (pilot !== 'released' && pilot !== 'review') throw Error('Unknown pilot');
const baseline = arg('data', 'live') === 'baseline';
const file = resolve(dir, label + '.jsonl');
if (existsSync(file)) throw Error('Never overwrite an experiment; choose a new label');
const databaseFile = resolve(dir, baseline ? 'baseline-db.json.gz' : label + '-db.json.gz');
if (!baseline) writeFileSync(databaseFile, gzipSync(JSON.stringify(COMBAT_DB), { level: 9 }));
const original = JSON.parse(
  gunzipSync(
    readFileSync(
      resolve(root, 'docs/balance-history/simulations/0.198.0/evaluate-b300-jobs.json.gz'),
    ),
  ).toString(),
) as Job[];
const audit = arg('mode', 'audit') === 'audit';
const bossSeeds = Number(arg('seeds', audit ? '10' : '100'));
const seedStart = Number(arg('seed-start', '0'));
const arenaSeedOffset = Number(arg('arena-seed-offset', '0'));
const focus = arg('focus', '');
const onlyMode = arg('only-mode', '');
const onlyQuality = arg('only-quality', '');
type DeckLists = Record<'arena' | 'boss', Record<string, Deck[]>>;
const originalDecks = JSON.parse(
  readFileSync(resolve(root, 'docs/balance-history/simulations/0.198.0/decks.json'), 'utf8'),
) as DeckLists;
const deckFile = arg('decks', '');
const decks: DeckLists = deckFile
  ? (JSON.parse(readFileSync(resolve(root, deckFile), 'utf8')) as DeckLists)
  : originalDecks;
const ids: string[] = originalDecks.arena.optimized!.map((d: Deck) => d.id);
for (const mode of ['arena', 'boss'] as const)
  for (const quality of ['optimized', 'good'])
    for (const deck of decks[mode][quality] as Deck[]) {
      const allowed = new Set([...rewardPool(deck.hero), ...RIFTWALKERS[deck.hero].starter]);
      const counts = new Map<string, number>();
      for (const id of deck.deck) {
        const base = id.replace(/\+$/, '');
        const card = COMBAT_DB.cards[id];
        const count = (counts.get(base) ?? 0) + 1;
        counts.set(base, count);
        if (!card || !allowed.has(base) || count > maxCopiesOf(card.rarity, card.kind))
          throw Error('Illegal deck ' + deck.id + ': ' + id);
      }
    }
const jobs = original
  .filter((j) => {
    if (focus && j.a.id !== focus && j.b?.id !== focus) return false;
    if (onlyMode && j.mode !== onlyMode) return false;
    if (onlyQuality && j.a.quality !== onlyQuality) return false;
    if (j.mode === 'boss') {
      const seed = Number(j.seed.split('-').at(-1));
      return seed >= seedStart && seed < bossSeeds;
    }
    if (!audit) return true;
    const a = ids.indexOf(j.a.id),
      b = ids.indexOf(j.b!.id);
    return (
      j.a.quality === 'optimized' &&
      j.seed.endsWith('-0') &&
      ((a + 7) % 30 === b || (b + 7) % 30 === a)
    );
  })
  .map((j, id): Job => ({
    ...j,
    id,
    pilot,
    databaseFile,
    seed:
      j.mode === 'arena'
        ? j.seed.replace(/\d+$/, (n) => String(Number(n) + arenaSeedOffset))
        : j.seed,
    a: decks[j.mode][j.a.quality]!.find((d: Deck) => d.id === j.a.id)!,
    ...(j.b ? { b: decks[j.mode][j.b.quality]!.find((d: Deck) => d.id === j.b!.id)! } : {}),
  }));
writeFileSync(resolve(dir, label + '-jobs.json.gz'), gzipSync(JSON.stringify(jobs), { level: 9 }));
let next = 0,
  finished = 0;
const started = Date.now();
console.log(JSON.stringify({ label, pilot, baseline, jobs: jobs.length }));
await Promise.all(
  Array.from(
    { length: Number(arg('workers', '8')) },
    () =>
      new Promise<void>((done, fail) => {
        const worker = new Worker(new URL('./boot.mjs', import.meta.url));
        let closing = false;
        const feed = () => {
          if (next >= jobs.length) {
            closing = true;
            void worker.terminate();
            done();
          } else worker.postMessage(jobs[next++]);
        };
        worker.on('message', (message: { ok: boolean; result: Result; error?: string }) => {
          if (!message.ok) {
            closing = true;
            void worker.terminate();
            fail(Error(message.error));
            return;
          }
          appendFileSync(file, JSON.stringify(message.result) + '\n');
          finished++;
          if (finished % 60 === 0 || finished === jobs.length)
            console.log(
              `${finished}/${jobs.length} ${((Date.now() - started) / 1000).toFixed(1)}s`,
            );
          feed();
        });
        worker.on('error', fail);
        worker.on('exit', (code) => {
          if (!closing) fail(Error('Worker exited ' + code));
        });
        feed();
      }),
  ),
);
writeFileSync(file + '.gz', gzipSync(readFileSync(file), { level: 9 }));
