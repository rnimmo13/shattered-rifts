import { Worker } from 'node:worker_threads';
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';
import { BOT_VERSION, BOT_SEARCH } from '@sr/combat';
import {
  COMBAT_DB as db,
  maxCopiesOf,
  rewardPool,
  RIFTWALKERS,
  ASCENDANCIES,
} from '@sr/content/v2';
import { type Deck, type Job, type Result, BOONS } from './fight';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const arg = (k: string, d: string) => {
  const i = process.argv.indexOf('--' + k);
  return i < 0 ? d : (process.argv[i + 1] ?? d);
};
const dir = resolve(root, arg('dir', 'docs/balance-history/simulations/0.200.0'));
const mode = arg('mode', 'pilot');
const budget = Number(arg('budget', String(BOT_SEARCH.budget)));
const workers = Number(arg('workers', '4'));
interface Candidate extends Omit<Deck, 'quality'> {
  core: string[];
  fallback: string[];
}
const candidates = JSON.parse(readFileSync(resolve(dir, 'candidates.json'), 'utf8')) as Candidate[];
const up = (id: string) => db.cards[id]!.upgrade ?? id;
function valid(d: Deck) {
  if (d.deck.length < 8) throw Error('Short deck');
  const counts = new Map<string, number>();
  const allowed = new Set([...rewardPool(d.hero), ...RIFTWALKERS[d.hero].starter]);
  for (const id of d.deck) {
    const base = id.replace(/\+$/, '');
    const c = db.cards[id];
    if (!c || !allowed.has(base)) throw Error(d.id + ' illegal ' + id);
    const n = (counts.get(base) ?? 0) + 1;
    counts.set(base, n);
    if (n > maxCopiesOf(c.rarity, c.kind)) throw Error(d.id + ' copies ' + id);
  }
}
for (const b of BOONS) if (!db.boons?.[b]) throw Error('Missing Boon ' + b);
if (candidates.length !== ASCENDANCIES.length) throw Error('Missing Ascendancy');
const base = candidates.map((c) => ({ ...c, deck: c.deck.map(up), quality: 'optimized' }));
base.forEach(valid);
const jobs: Job[] = [];
const databaseFile = resolve(dir, `${mode}-b${budget}-db.json.gz`);
const encoded = JSON.stringify(db);
if (existsSync(databaseFile) && gunzipSync(readFileSync(databaseFile)).toString() !== encoded)
  throw Error('Content changed since this experiment; use a new output directory.');
writeFileSync(databaseFile, gzipSync(encoded));
const add = (j: Omit<Job, 'id' | 'budget'>) =>
  jobs.push({ ...j, id: jobs.length, budget, databaseFile, policyVersion: BOT_VERSION });
if (mode === 'pilot')
  for (const a of base.filter((_, i) => i % 3 === 0)) {
    add({ mode: 'boss', a, seed: 'pilot-boss' });
    add({ mode: 'arena', a, b: base[(base.indexOf(a) + 3) % base.length]!, seed: 'pilot-arena' });
  }
else if (mode === 'train') {
  const variants: Deck[][] = base.map((d, i) => {
    const c = candidates[i]!;
    const remove = (deck: string[], n: number) => {
      const next = [...deck];
      for (let k = next.length - 1; k >= 8 && n > 0; k--)
        if (next.indexOf(next[k]!) !== k) {
          next.splice(k, 1);
          n--;
        }
      return next;
    };
    const protection: Record<string, string[]> = {
      knight: ['scarred-hide', 'bloodied-plate'],
      engineer: ['heavy-industry', 'static-field'],
      hunter: ['pack-leader', 'scarred-warrior'],
      trickster: ['mirror-veil', 'veil-dance'],
      assassin: ['chilling-shriek', 'fleet-step'],
      shaman: ['calm-before-the-storm', 'frostbound-hide'],
      monk: ['breath-between-blows', 'unbroken-calm'],
      spellblade: ['mirror-glass', 'obsidian-aegis'],
      necromancer: ['burial-shroud', 'withering-touch'],
      drunkard: ['bottomless-flask', 'glass-cover'],
    };
    const variants = [
      d,
      { ...d, deck: [...remove(d.deck, 2), ...c.fallback.map(up)], quality: 'optimized-defense' },
      { ...d, deck: remove(d.deck, 4), quality: 'optimized-lean' },
    ];
    for (const [k, picks] of [
      protection[d.hero]!,
      [...protection[d.hero]!, ...protection[d.hero]!],
      c.fallback.flatMap((x) => [x, x]),
    ].entries()) {
      const next = remove(d.deck, picks.length);
      for (const p of picks) {
        const id = up(p),
          card = db.cards[id]!;
        if (next.filter((x) => x === id).length < maxCopiesOf(card.rarity, card.kind))
          next.push(id);
      }
      variants.push({ ...d, deck: next, quality: 'optimized-alternative-' + k });
    }
    if (arg('broader', 'no') === 'yes') {
      const engines: Record<string, string[]> = {
        knight: ['unyielding-line', 'scarred-hide'],
        engineer: d.id.endsWith('golemancer')
          ? ['bulwark-frame', 'heavy-industry']
          : ['overclock-core', 'assemble'],
        hunter: ['pack-bond', 'devour'],
        trickster: ['mirror-veil', 'veil-dance'],
        assassin: ['shadow-echo', 'backspring'],
        shaman: ['spirit-pact', 'frostbound-hide'],
        monk: ['unbroken-calm', 'breath-between-blows'],
        spellblade: ['obsidian-aegis', 'measured-recharge'],
        necromancer: ['burial-shroud', 'withering-touch'],
        drunkard: ['bottomless-flask', 'glass-cover'],
      };
      for (const [k, picks] of [protection[d.hero]!, engines[d.hero]!].entries())
        for (const lean of [false, true]) {
          const next = [...d.deck.slice(4)];
          for (const pick of picks.flatMap((x) => [x, x])) {
            const id = up(pick),
              card = db.cards[id]!;
            if (!card) throw Error('Unknown support ' + pick);
            if (next.filter((x) => x === id).length < maxCopiesOf(card.rarity, card.kind))
              next.push(id);
          }
          variants.push({
            ...d,
            deck: lean ? remove(next, 4) : next,
            quality: `optimized-support-${k}-${lean ? 'lean' : 'full'}`,
          });
        }
    }
    return variants;
  });
  variants.flat().forEach(valid);
  writeFileSync(resolve(dir, 'variants.json'), JSON.stringify(variants, null, 2));
  for (let i = 0; i < base.length; i++)
    for (const a of variants[i]!) {
      for (let s = 0; s < 4; s++) add({ mode: 'boss', a, seed: `train-boss-${s}` });
      for (const off of [1, 4, 7, 10, 13, 16, 19, 22, 25, 28]) {
        const b = base[(i + off) % base.length]!;
        add({ mode: 'arena', a, b, seed: `train-arena-${off}` });
        add({ mode: 'arena', a: b, b: a, seed: `train-arena-${off}` });
      }
    }
} else if (mode === 'oathprobe') {
  const original = JSON.parse(
    readFileSync(resolve(dir, 'evaluate-b300-jobs.json'), 'utf8'),
  ) as Job[];
  for (const j of original.filter(
    (j) =>
      j.a.quality === 'optimized' &&
      ((j.mode === 'arena' && (j.a.id === 'knight:marshal' || j.b?.id === 'knight:marshal')) ||
        (j.mode === 'boss' && j.a.id === 'knight:marshal')),
  ))
    add({ ...j, bloodOathConsume: true });
} else if (['evaluate', 'sensitivity', 'pilotcheck', 'bossprobe'].includes(mode)) {
  const chosen = JSON.parse(readFileSync(resolve(dir, 'decks.json'), 'utf8')) as {
    arena: { optimized: Deck[]; good: Deck[] };
    boss: { optimized: Deck[]; good: Deck[] };
  };
  Object.values(chosen)
    .flatMap((x) => [...x.optimized, ...x.good])
    .forEach(valid);
  const n = Number(arg('seeds', mode === 'evaluate' ? '100' : '10'));
  for (const quality of ['optimized', 'good'] as const)
    for (const a of chosen.boss[quality])
      for (let s = 0; s < n; s++)
        add({
          mode: 'boss',
          a,
          seed: `holdout-boss-${s}`,
          ...(mode === 'sensitivity' ? { hpBonus: Number(arg('hp-bonus', '60')) } : {}),
          ...(mode === 'bossprobe' ? { bossHpFactor: 0.75, bossDamageFactor: 0.85 } : {}),
        });
  if (mode === 'evaluate')
    for (const quality of ['optimized', 'good'] as const)
      for (let i = 0; i < 30; i++)
        for (let k = i + 1; k < 30; k++)
          for (let s = 0; s < 2; s++) {
            const a = chosen.arena[quality][i]!,
              b = chosen.arena[quality][k]!;
            add({ mode: 'arena', a, b, seed: `holdout-arena-${i}-${k}-${s}` });
            add({ mode: 'arena', a: b, b: a, seed: `holdout-arena-${i}-${k}-${s}` });
          }
  if (mode === 'pilotcheck')
    for (let i = 0; i < 30; i++) {
      const k = (i + 7) % 30,
        a = chosen.arena.optimized[i]!,
        b = chosen.arena.optimized[k]!;
      const seed = `holdout-arena-${Math.min(i, k)}-${Math.max(i, k)}-0`;
      add({ mode: 'arena', a, b, seed });
      add({ mode: 'arena', a: b, b: a, seed });
    }
} else throw Error('Unknown mode');
const output = resolve(dir, `${mode}-b${budget}.jsonl`),
  jobFile = resolve(dir, `${mode}-b${budget}-jobs.json`);
if (existsSync(jobFile) && readFileSync(jobFile, 'utf8') !== JSON.stringify(jobs))
  throw Error('Existing output belongs to a different job specification; use a new result name.');
const done = new Set<number>(
  existsSync(output)
    ? readFileSync(output, 'utf8')
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((l) => (JSON.parse(l) as Result).id)
    : [],
);
writeFileSync(jobFile, JSON.stringify(jobs));
let next = 0,
  finished = done.size;
const start = Date.now();
console.log(JSON.stringify({ mode, budget, workers, jobs: jobs.length, resumed: done.size }));
await Promise.all(
  Array.from(
    { length: workers },
    () =>
      new Promise<void>((resolve, reject) => {
        const w = new Worker(new URL('./boot.mjs', import.meta.url));
        let closing = false;
        const feed = () => {
          while (next < jobs.length && done.has(jobs[next]!.id)) next++;
          if (next >= jobs.length) {
            closing = true;
            void w.terminate();
            resolve();
          } else w.postMessage(jobs[next++]);
        };
        w.on('message', (msg: { ok: boolean; result?: Result; error?: string; stack?: string }) => {
          if (!msg.ok) {
            closing = true;
            void w.terminate();
            reject(Error(msg.error + '\n' + msg.stack));
            return;
          }
          appendFileSync(output, JSON.stringify(msg.result) + '\n');
          finished++;
          if (finished % 20 === 0 || finished === jobs.length)
            console.log(`${finished}/${jobs.length} ${((Date.now() - start) / 1000).toFixed(1)}s`);
          feed();
        });
        w.on('error', reject);
        w.on('exit', (code) => {
          if (!closing) reject(Error('Worker exit ' + code));
        });
        feed();
      }),
  ),
);
