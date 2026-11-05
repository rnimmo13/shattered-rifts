import { readFileSync, writeFileSync } from 'node:fs';
import { fight, type Job } from './fight';
import { fileURLToPath } from 'node:url';
const dir = new URL('../../../docs/balance-history/simulations/0.198.0/', import.meta.url);
const jobs = JSON.parse(readFileSync(new URL('evaluate-b300-jobs.json', dir), 'utf8')) as Job[];
const wanted = [
  ['knight:marshal', 'necromancer:soulreaper'],
  ['necromancer:bonelord', 'engineer:golemancer'],
  ['monk:sunwalker', 'knight:paladin'],
  ['assassin:bloodletter', 'shaman:totemist'],
];
const traces = wanted.map(([a, b]) => {
  const j = jobs.find(
    (j) => j.mode === 'arena' && j.a.id === a && j.b?.id === b && j.a.quality === 'optimized',
  );
  if (!j) throw Error(String(a));
  return fight({ ...j, trace: true });
});
writeFileSync(
  fileURLToPath(new URL('representative-traces.json', dir)),
  JSON.stringify(traces, null, 2) + '\n',
);
console.log(
  traces.map((r) => ({ a: r.a, b: r.b, winner: r.winner, turns: r.turns, peak: r.peakPlayed })),
);
