/** Owner-only Arena analysis. No simulations and no credentials written to the report. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { isArenaBalanceGame, type ArenaBalanceGame } from '@sr/pvp';
import { COMBAT_DB } from '@sr/content/v2';

const arg = (name: string) => {
  const i = process.argv.indexOf('--' + name);
  return i < 0 ? undefined : process.argv[i + 1];
};
const out = resolve(arg('out') ?? '../.wrangler/arena-balance');
let games: ArenaBalanceGame[] = [];
const input = arg('input');
if (input) {
  const data = JSON.parse(readFileSync(resolve(input), 'utf8')) as { games: unknown[] };
  if (!Array.isArray(data.games) || !data.games.every(isArenaBalanceGame))
    throw Error('Invalid Arena export');
  games = data.games;
} else {
  const server = arg('server');
  const token = process.env.BALANCE_ADMIN_TOKEN;
  if (!server || !token)
    throw Error(
      'Use --server https://your-worker with BALANCE_ADMIN_TOKEN in the environment, or --input export.json',
    );
  const url = new URL('/admin/balance', server);
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname))
    throw Error('Use HTTPS');
  let cursor = 0;
  for (let page = 0; page < 100; page++) {
    url.searchParams.set('after', String(cursor));
    const res = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
      throw Error(`Balance export failed (${res.status}); verify the server secret and URL`);
    const body = (await res.json()) as { games: unknown[]; next: number; more: boolean };
    if (!Array.isArray(body.games) || !body.games.every(isArenaBalanceGame))
      throw Error('Invalid server data');
    games.push(...body.games);
    if (!body.more) break;
    if (!Number.isSafeInteger(body.next) || body.next <= cursor)
      throw Error('Invalid export cursor');
    cursor = body.next;
    if (page === 99) throw Error('Export pagination limit exceeded');
  }
}
const unique = new Map<string, ArenaBalanceGame>();
for (const game of games) {
  const prior = unique.get(game.id);
  if (prior && JSON.stringify(prior) !== JSON.stringify(game)) throw Error('Conflicting game ID');
  unique.set(game.id, game);
}
games = [...unique.values()];
const rows = games.flatMap((g) =>
  (['a', 'b'] as const).map((seat) => {
    const d = g[seat];
    const key = JSON.stringify([
      g.rules,
      g.startingHp,
      g.bot,
      g.source,
      g.ghostSeat === seat ? 'ghost' : 'human',
      d.hero,
      d.ascendancy,
      [...d.cards].sort(),
    ]);
    return {
      ...d,
      key,
      id: createHash('sha256').update(key).digest('hex').slice(0, 16),
      game: g.id,
      at: g.at,
      rules: g.rules,
      hp: g.startingHp,
      bot: g.bot,
      source: g.source,
      pilot: g.ghostSeat === seat ? 'ghost' : 'human',
      seat,
      outcome: g.winner === 'draw' ? 'draw' : g.winner === seat ? 'win' : 'loss',
      reason: g.reason,
      turns: g.turns[seat],
      damage: g.heroDamage[seat],
      peak: g.peakHeroDamage[seat],
      durationMs: g.durationMs,
    };
  }),
);
const names = Object.fromEntries(Object.values(COMBAT_DB.cards).map((c) => [c.id, c.name]));
mkdirSync(out, { recursive: true });
writeFileSync(resolve(out, 'games.json'), JSON.stringify({ schema: 1, games }, null, 2));
writeFileSync(resolve(out, 'deck-observations.json'), JSON.stringify(rows, null, 2));
const csv = [
  [
    'deck',
    'game',
    'rules',
    'hp',
    'bot',
    'source',
    'pilot',
    'hero',
    'ascendancy',
    'seat',
    'outcome',
    'reason',
    'turns',
    'hero_damage',
    'peak_hero_damage',
    'cards',
  ],
  ...rows.map((r) => [
    r.id,
    r.game,
    r.rules,
    r.hp,
    r.bot,
    r.source,
    r.pilot,
    r.hero,
    r.ascendancy,
    r.seat,
    r.outcome,
    r.reason,
    r.turns,
    r.damage,
    r.peak,
    r.cards.join(';'),
  ]),
];
writeFileSync(
  resolve(out, 'decks.csv'),
  csv
    .map((r) => r.map((x) => '"' + String(x ?? '').replaceAll('"', '""') + '"').join(','))
    .join('\n'),
);
const data = JSON.stringify({ rows, names }).replaceAll('<', '\\u003c');
writeFileSync(
  resolve(out, 'report.html'),
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shattered Rifts — Arena balance</title>
<style>body{font:16px system-ui;background:#121923;color:#ecedf2;max-width:1200px;margin:32px auto;padding:0 18px}input,select{font:inherit;background:#263446;color:inherit;padding:10px;border:1px solid #64748b;border-radius:6px;max-width:100%}.filters{display:flex;gap:12px;flex-wrap:wrap}details{background:#1b2839;padding:16px;margin:12px 0;border-radius:8px}summary{cursor:pointer;font-weight:700}table{border-collapse:collapse;width:100%;font-size:14px}td,th{padding:8px;text-align:left;border-bottom:1px solid #41516a}.scroll{overflow:auto}small,p{color:#c4cddd}button{font:inherit}li{margin:5px 0}</style>
<style>*{box-sizing:border-box}.filters>label{display:grid;gap:4px;flex:1 1 240px;min-width:0;max-width:100%}.filters input,.filters select{width:100%;min-width:0}summary,p{overflow-wrap:anywhere}</style>
<h1>Arena balance review</h1><p>Exact decks from completed server games. No player names or account credentials. Filters keep rules, HP, AI version and opponent type separate. One game has two deck observations.</p>
<div class="filters"><label>Search <input id="q" placeholder="Class, Ascendancy or card"></label><label>Field <select id="field"></select></label><label>Results <select id="ends"><option value="normal">Combat wins and pass draws</option><option value="all">Include resignations, disconnects and time limits</option></select></label></div>
<p id="count"></p><p>Damage is attributed opposing-hero HP loss, not theoretical output. It excludes blocked damage, self-payment and unattributed effects such as some damage-over-time/Fate. Healing, Barrier, control and matchup distribution also matter. No automated A-tier claims.</p><div id="decks"></div>
<script>const DATA=${data};
const $=id=>document.getElementById(id), esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const field=r=>r.rules+' / '+r.hp+' HP / '+r.bot+' / '+r.source;
const fields=[...new Set(DATA.rows.map(field))].sort(); $('field').innerHTML=fields.map(f=>'<option>'+esc(f)+'</option>').join('');
function render(){const q=$('q').value.toLowerCase();const rs=DATA.rows.filter(r=>field(r)===$('field').value&&($('ends').value==='all'||['win','passes'].includes(r.reason)));const groups=new Map();for(const r of rs){if(!groups.has(r.id))groups.set(r.id,[]);groups.get(r.id).push(r)}
const median=xs=>{xs.sort((a,b)=>a-b);return xs.length?(xs[Math.floor((xs.length-1)/2)]+xs[Math.floor(xs.length/2)])/2:0};
$('count').textContent=new Set(rs.map(r=>r.game)).size+' games • '+groups.size+' exact decks • '+rs.length+' seat observations';
$('decks').innerHTML=[...groups.values()].sort((a,b)=>b.length-a.length).filter(g=>[g[0].hero,g[0].ascendancy,...g[0].cards.map(c=>DATA.names[c]||c)].join(' ').toLowerCase().includes(q)).map(g=>{const r=g[0],w=g.filter(x=>x.outcome==='win').length,l=g.filter(x=>x.outcome==='loss').length,d=g.length-w-l;const counts={};for(const c of r.cards)counts[c]=(counts[c]||0)+1;return '<details><summary>'+esc(r.ascendancy||r.hero)+' — '+esc(r.pilot)+' — '+w+'W / '+l+'L / '+d+'D — '+(w+l?(100*w/(w+l)).toFixed(1)+'% decisive':'no decisive games')+'</summary><p>Deck '+r.id+' • '+r.cards.length+' cards • '+g.length+' observations'+(g.length<30?' • Small sample':'')+'</p><p>Median own turns '+median(g.map(x=>x.turns))+' • Median attributed hero damage '+median(g.map(x=>x.damage))+' • Highest turn burst '+Math.max(...g.map(x=>x.peak))+'</p><ul>'+Object.entries(counts).map(([c,n])=>'<li>'+n+' × '+esc(DATA.names[c]||c)+'</li>').join('')+'</ul><div class="scroll"><table><tr><th>Game</th><th>Seat</th><th>Result</th><th>End</th><th>Turns</th><th>HP damage</th><th>Peak</th></tr>'+g.map(x=>'<tr><td>'+esc(x.game)+'</td><td>'+x.seat+'</td><td>'+x.outcome+'</td><td>'+x.reason+'</td><td>'+x.turns+'</td><td>'+x.damage+'</td><td>'+x.peak+'</td></tr>').join('')+'</table></div></details>'}).join('')||'<p>No matching games. Collection begins after deployment; historical or offline games are not invented.</p>'}
for(const id of ['q','field','ends'])$(id).addEventListener('input',render);render();</script></html>`,
);
console.log(`Saved ${games.length} games and ${rows.length} deck observations to ${out}`);
