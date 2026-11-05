/** Private observed Campaign deck snapshots. Never runs games or estimates player skill. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const arg = (name: string) => {
  const i = process.argv.indexOf('--' + name);
  return i < 0 ? undefined : process.argv[i + 1];
};
const out = resolve(arg('out') ?? '../.wrangler/campaign-balance');
type Snapshot = {
  id: string;
  run: string;
  at: number;
  rules: number;
  version: string;
  source: string;
  hero: string;
  ascendancy: string | null;
  cards: string[];
  boons: string[];
  tier: number;
  difficulty: string;
  phase: string;
  hp: number | null;
  maxHp: number | null;
  fightsWon: number | null;
  fightsLost: number | null;
};
const snapshots: Snapshot[] = [];
function accept(raw: unknown) {
  if (!raw || typeof raw !== 'object') throw Error('Invalid Campaign export');
  const list = (raw as { snapshots?: unknown }).snapshots;
  if (!Array.isArray(list)) throw Error('Expected Campaign snapshots');
  for (const s of list as Snapshot[]) {
    if (
      !s ||
      typeof s.id !== 'string' ||
      typeof s.run !== 'string' ||
      s.source !== 'client-observed' ||
      !Array.isArray(s.cards) ||
      !s.cards.every((c) => typeof c === 'string') ||
      !Array.isArray(s.boons) ||
      !s.boons.every((b) => typeof b === 'string')
    )
      throw Error('Invalid Campaign snapshot');
    snapshots.push(s);
  }
}
if (arg('input')) accept(JSON.parse(readFileSync(resolve(arg('input')!), 'utf8')) as unknown);
else {
  const server = arg('server'),
    token = process.env.BALANCE_ADMIN_TOKEN;
  if (!server || !token)
    throw Error('Use --server with BALANCE_ADMIN_TOKEN, or --input snapshots.json');
  const url = new URL('/admin/balance', server);
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname))
    throw Error('Use HTTPS');
  url.searchParams.set('kind', 'campaign');
  let after = 0;
  for (let page = 0; page < 100; page++) {
    url.searchParams.set('after', String(after));
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw Error(`Campaign export failed (${res.status})`);
    const body = (await res.json()) as { next: number; more: boolean };
    accept(body);
    if (!body.more) break;
    if (!Number.isSafeInteger(body.next) || body.next <= after)
      throw Error('Invalid export cursor');
    after = body.next;
    if (page === 99) throw Error('Export pagination limit exceeded');
  }
}
const unique = new Map<string, Snapshot>();
for (const s of snapshots) {
  const before = unique.get(s.id);
  if (before && JSON.stringify(before) !== JSON.stringify(s))
    throw Error('Conflicting snapshot ID');
  unique.set(s.id, s);
}
const rows = [...unique.values()].sort((a, b) => a.at - b.at);
mkdirSync(out, { recursive: true });
writeFileSync(
  resolve(out, 'snapshots.json'),
  JSON.stringify({ schema: 1, snapshots: rows }, null, 2),
);
const escape = (x: string | number | null | undefined) =>
  String(x ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
const csv = (x: string | number | null | undefined) =>
  '"' + String(x ?? '').replaceAll('"', '""') + '"';
writeFileSync(
  resolve(out, 'decks.csv'),
  [
    [
      'snapshot',
      'run',
      'at',
      'rules',
      'version',
      'hero',
      'ascendancy',
      'tier',
      'difficulty',
      'phase',
      'cards',
      'boons',
    ],
    ...rows.map((s) => [
      s.id,
      s.run,
      s.at,
      s.rules,
      s.version,
      s.hero,
      s.ascendancy,
      s.tier,
      s.difficulty,
      s.phase,
      s.cards.join(';'),
      s.boons.join(';'),
    ]),
  ]
    .map((r) => r.map(csv).join(','))
    .join('\n'),
);
writeFileSync(
  resolve(out, 'report.html'),
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Campaign deck review</title>
<style>body{font:16px system-ui;background:#121923;color:#eee;max-width:1000px;margin:24px auto;padding:16px}details{background:#1b2839;padding:16px;margin:12px 0;border-radius:8px}p,summary{overflow-wrap:anywhere}summary{cursor:pointer}</style>
<h1>Private Campaign deck review</h1><p>${rows.length} snapshots from ${new Set(rows.map((s) => s.run)).size} anonymous runs. Client-observed online save positions, not verified fights, independent matches or complete reward histories. Identical positions are deduplicated. Missing snapshots do not mean a player declined a card or lost a fight. Keep rules and difficulty separate. The file contains card IDs as recorded, including upgrades; definitions may have changed.</p>
${
  rows
    .map(
      (
        s,
      ) => `<details><summary>${escape(s.ascendancy ?? s.hero)} · Tier ${escape(s.tier)} · ${escape(s.difficulty)} · rules ${escape(s.rules)}</summary>
<p>Run ${escape(s.run)} · ${escape(new Date(s.at).toISOString())} · ${escape(s.phase)} · v${escape(s.version)}</p>
<p>HP ${escape(s.hp)}/${escape(s.maxHp)} · reported fights ${escape(s.fightsWon)} won / ${escape(s.fightsLost)} lost. These are cumulative run counters.</p>
<p>Cards: ${s.cards.map(escape).join(', ')}</p><p>Boons: ${s.boons.map(escape).join(', ')}</p></details>`,
    )
    .join('') || '<p>No observed Campaign decks yet.</p>'
}</html>`,
);
console.log(`Saved ${rows.length} Campaign snapshots to ${out}`);
