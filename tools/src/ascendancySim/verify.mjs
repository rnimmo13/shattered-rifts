import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(
  new URL('../../../docs/balance-history/simulations/0.198.0/', import.meta.url),
);
const read = (name) =>
  existsSync(dir + name) ? readFileSync(dir + name) : gunzipSync(readFileSync(dir + name + '.gz'));
const parse = (name) => JSON.parse(read(name).toString());
const jsonl = (name) => read(name).toString().trim().split('\n').map(JSON.parse);
const runs = {
  'pilot-b300': 20,
  'train-b300': 1440,
  'evaluate-b300': 9480,
  'pilotcheck-b900': 660,
  'sensitivity-b300': 600,
  'bossprobe-b300': 600,
  'oathprobe-b300': 216,
};
const manifest = [];
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
for (const [name, count] of Object.entries(runs)) {
  const jobs = parse(name + '-jobs.json'),
    results = jsonl(name + '.jsonl');
  assert.equal(jobs.length, count);
  assert.equal(results.length, count);
  assert.equal(new Set(results.map((r) => r.id)).size, count);
  for (const r of results) {
    const j = jobs.find((j) => j.id === r.id);
    assert.ok(j);
    for (const field of ['mode', 'seed', 'budget']) assert.equal(r[field], j[field]);
    assert.equal(r.a, j.a.id);
    assert.equal(r.b, j.b?.id);
    assert.equal(r.quality, j.a.quality);
    assert.equal(r.censored, r.winner === null);
    assert.ok(r.winner === null || ['a', 'b', 'draw'].includes(r.winner));
    assert.ok(r.maxHp.a > 0 && r.maxHp.b > 0);
  }
  for (const file of [name + '-jobs.json', name + '.jsonl']) {
    const bytes = read(file),
      zipped = gzipSync(bytes, { level: 9 });
    assert.deepEqual(gunzipSync(zipped), bytes);
    if (process.argv.includes('--archive')) writeFileSync(dir + file + '.gz', zipped);
    if (existsSync(dir + file + '.gz'))
      assert.deepEqual(gunzipSync(readFileSync(dir + file + '.gz')), bytes);
    manifest.push({ file, bytes: bytes.length, sha256: sha(bytes), gzipBytes: zipped.length });
  }
}
const data = jsonl('evaluate-b300.jsonl');
const decks = parse('decks.json');
for (const quality of ['optimized', 'good'])
  for (const deck of decks.arena[quality]) {
    assert.equal(
      data.filter(
        (r) => r.mode === 'arena' && r.quality === quality && (r.a === deck.id || r.b === deck.id),
      ).length,
      116,
    );
    assert.equal(
      data.filter((r) => r.mode === 'boss' && r.quality === quality && r.a === deck.id).length,
      100,
    );
  }
for (const r of parse('representative-traces.json')) {
  const original = data.find((x) => x.id === r.id);
  for (const field of ['winner', 'censored', 'turns', 'steps', 'hp', 'plays'])
    assert.deepEqual(r[field], original[field]);
}
if (process.argv.includes('--archive'))
  writeFileSync(dir + 'archive-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(
  'Verified 13,016 outcomes, job identities, roster coverage, four diagnostic replays and lossless archives.',
);
