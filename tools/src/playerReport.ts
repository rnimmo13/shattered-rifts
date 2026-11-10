// pnpm balance:players (DECISIONS #714): what real players' games say about balance. Pulls the owner-only export (every online Campaign
// fight with its numbers and replay, Arena games with their replays, Campaign deck snapshots with their deck choices), or reads a saved
// pull, and writes a report: what is strong, what players use for their biggest turns, where runs die and which builds lack damage.
//
// Usage: pnpm balance:players -- --out <dir>   (the live server by default; --server for another)
//        pnpm balance:players -- --input <dir with fights.json, arena.json, campaign.json> --out <dir>
// The pull is saved to <out> as fights.json, arena.json and campaign.json, so a report can be made again without the server.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { COMBAT_DB as db, classNameOf } from '@sr/content/v2';
import {
  RULES_VERSION,
  cleanFightStats,
  fightStats,
  setupFor,
  type Entry,
  type FightStats,
} from '@sr/pvp';
import type { CombatSetup, Side } from '@sr/combat';
import { LIVE_SERVER } from './adminAccess';

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf('--' + name);
  return i < 0 ? undefined : process.argv[i + 1];
};
const out = resolve(arg('out') ?? 'player-report');
mkdirSync(out, { recursive: true });

type Row = Record<string, unknown>;
async function pull(kind: 'fights' | 'arena' | 'campaign'): Promise<Row[]> {
  const input = arg('input');
  if (input) {
    const f = join(resolve(input), `${kind}.json`);
    return existsSync(f) ? (JSON.parse(readFileSync(f, 'utf8')) as Row[]) : [];
  }
  const server = arg('server') ?? LIVE_SERVER;
  const rows: Row[] = [];
  let after = 0;
  for (let page = 0; page < 10_000; page++) {
    const url = new URL('/admin/balance', server);
    url.searchParams.set('kind', kind);
    url.searchParams.set('after', String(after));
    const res = await fetch(url);
    if (!res.ok)
      throw Error(`Export of ${kind} failed (${res.status}): check the server and secret`);
    const d = (await res.json()) as {
      fights?: Row[];
      games?: Row[];
      snapshots?: Row[];
      next: number;
      more: boolean;
    };
    rows.push(...(d.fights ?? d.games ?? d.snapshots ?? []));
    if (!d.more) break;
    after = d.next;
  }
  writeFileSync(join(out, `${kind}.json`), JSON.stringify(rows));
  return rows;
}

const median = (xs: number[]): number => {
  const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  return s.length ? s[s.length >> 1]! : 0;
};
const pct = (a: number, b: number): string => (b ? `${Math.round((100 * a) / b)}%` : '-');
const base = (id: string): string =>
  id
    .replace(/^(hi|lo)~/, '')
    .replace(/^[a-z]+\^/, '')
    .replace(/\+$/, '');
const cardName = (id: string): string => db.cards[id]?.name ?? db.cards[base(id)]?.name ?? id;
const build = (hero: unknown, asc: unknown): string =>
  typeof hero === 'string' ? classNameOf(hero, typeof asc === 'string' ? asc : undefined) : '?';
const band = (tier: number): string =>
  tier <= 4 ? 'I-IV' : tier <= 8 ? 'V-VIII' : tier <= 11 ? 'IX-XI' : 'XII+';
const table = (head: string[], rows: (string | number)[][]): string =>
  [
    `| ${head.join(' | ')} |`,
    `|${head.map(() => '---').join('|')}|`,
    ...rows.map((r) => `| ${r.join(' | ')} |`),
  ].join('\n');

/** A fight's stats: as the client sent them, or worked out now from its replay when the rules are today's. */
function statsOf(
  stats: unknown,
  replay: unknown,
  rules: unknown,
  me: Side = 'a',
): FightStats | null {
  // (worked out again from the replay whenever today's rules can play it: what a client sent is only used for older fights)
  const r = replay as { setup?: CombatSetup; moves?: { seat: Side; action: never }[] } | undefined;
  if (rules === RULES_VERSION && r?.setup && Array.isArray(r.moves)) {
    try {
      const fresh = fightStats(db, r.setup, r.moves, me);
      if (!fresh.partial) return fresh;
    } catch {
      /* fall back to what was sent */
    }
  }
  const sent = cleanFightStats(stats);
  return sent && sent.me === me ? sent : null;
}

const fights = await pull('fights');
const arena = await pull('arena');
const campaign = await pull('campaign');
const lines: string[] = [
  `# Player balance report`,
  ``,
  `${fights.length} Campaign fights, ${arena.length} Arena games, ${campaign.length} Campaign deck snapshots. Rules now: ${RULES_VERSION}. ` +
    `Made ${new Date().toISOString().slice(0, 10)}.`,
  ``,
];

// ---- Campaign fights ----
type F = {
  build: string;
  tier: number;
  won: boolean;
  encounter: string;
  node: string;
  player: string;
  deck: string[];
  s: FightStats | null;
};
const camp: F[] = fights.map((f) => {
  const replay = f['replay'] as { setup?: CombatSetup } | undefined;
  const deck = (replay?.setup?.a as { deck?: string[] } | undefined)?.deck ?? [];
  return {
    build: build(f['hero'], f['ascendancy']),
    tier: Number(f['tier']) || 0,
    won: f['won'] === true,
    encounter: typeof f['encounter'] === 'string' ? f['encounter'] : '?',
    node: typeof f['node'] === 'string' ? f['node'] : '?',
    player: typeof f['player'] === 'string' ? f['player'] : '?',
    deck,
    s: statsOf(f['stats'], f['replay'], f['rules']),
  };
});

// builds by tier band: how often they win, how fast they kill, how hard they are hit
{
  const groups = new Map<string, F[]>();
  for (const f of camp) {
    const k = `${f.build}|${band(f.tier)}`;
    groups.set(k, [...(groups.get(k) ?? []), f]);
  }
  const rows = [...groups.entries()]
    .filter(([, g]) => g.length >= 3)
    .map(([k, g]) => {
      const [b, t] = k.split('|');
      const st = g.flatMap((f) => (f.s ? [f.s] : []));
      const dpt = st.map((s) => s.dealt / Math.max(1, s.turns));
      const killShare = st.map((s) => (s.foeHp ? s.dealt / s.foeHp / Math.max(1, s.turns) : 0));
      const hpLost = st.map((s) => (s.hp.max ? (100 * (s.hp.start - s.hp.end)) / s.hp.max : 0));
      return [
        b!,
        t!,
        g.length,
        new Set(g.map((f) => f.player)).size,
        pct(g.filter((f) => f.won).length, g.length),
        median(st.map((s) => s.turns)),
        Math.round(median(dpt)),
        `${Math.round(100 * median(killShare))}%`,
        `${Math.round(median(hpLost))}%`,
      ];
    })
    .sort(
      (x, y) =>
        String(x[0]).localeCompare(String(y[0])) || String(x[1]).localeCompare(String(y[1])),
    );
  lines.push(
    '## Campaign: builds by Rift Tier',
    '',
    "Kill pace = median share of the enemies' HP taken each own turn (a 4-turn kill is 25%). HP lost = median per fight, % of max.",
    '',
    table(
      [
        'Build',
        'Tiers',
        'Fights',
        'Players',
        'Won',
        'Turns',
        'Damage/turn',
        'Kill pace',
        'HP lost',
      ],
      rows,
    ),
    '',
  );
}

// where runs die: the fights players lose most, by encounter
{
  const groups = new Map<string, F[]>();
  for (const f of camp)
    groups.set(`${f.encounter}|${band(f.tier)}`, [
      ...(groups.get(`${f.encounter}|${band(f.tier)}`) ?? []),
      f,
    ]);
  const rows = [...groups.entries()]
    .filter(([, g]) => g.length >= 3)
    .map(([k, g]) => ({ k, g, lost: g.filter((f) => !f.won).length }))
    .filter((r) => r.lost > 0)
    .sort((a, b) => b.lost / b.g.length - a.lost / a.g.length || b.lost - a.lost)
    .slice(0, 25)
    .map(({ k, g, lost }) => {
      const [enc, t] = k.split('|');
      const losers = g.filter((f) => !f.won);
      const left = losers.flatMap((f) => (f.s ? [1 - f.s.dealt / Math.max(1, f.s.foeHp)] : []));
      const builds = [...new Set(losers.map((f) => f.build))].slice(0, 4).join(', ');
      return [
        enc!,
        t!,
        g.length,
        pct(lost, g.length),
        `${Math.round(100 * Math.max(0, median(left)))}%`,
        builds,
      ];
    });
  lines.push(
    '## Campaign: where players lose',
    '',
    "Enemy HP left = median share of the enemies' HP still standing when the player lost (high: the player could not deal the damage).",
    '',
    table(['Encounter', 'Tiers', 'Fights', 'Lost', 'Enemy HP left', 'Builds that lost'], rows),
    '',
  );
}

// lacking damage: builds whose losses leave the enemy mostly standing, and whose fights drag
{
  const groups = new Map<string, F[]>();
  for (const f of camp) groups.set(f.build, [...(groups.get(f.build) ?? []), f]);
  const rows = [...groups.entries()]
    .filter(([, g]) => g.length >= 5)
    .map(([b, g]) => {
      const st = g.flatMap((f) => (f.s ? [{ f, s: f.s }] : []));
      const losses = st.filter((x) => !x.f.won);
      const pace = median(
        st.map((x) => (x.s.foeHp ? x.s.dealt / x.s.foeHp / Math.max(1, x.s.turns) : 0)),
      );
      const left = median(losses.map((x) => 1 - x.s.dealt / Math.max(1, x.s.foeHp)));
      const long = st.filter((x) => x.s.turns >= 8).length;
      return { b, n: g.length, pace, left, long, lost: losses.length };
    })
    .sort((a, b) => a.pace - b.pace)
    .slice(0, 12)
    .map((r) => [
      r.b,
      r.n,
      `${Math.round(100 * r.pace)}%`,
      pct(r.long, r.n),
      r.lost,
      `${Math.round(100 * Math.max(0, r.left))}%`,
    ]);
  lines.push(
    '## Builds that lack damage (slowest kill pace first)',
    '',
    table(
      ['Build', 'Fights', 'Kill pace', 'Fights of 8+ turns', 'Losses', 'Enemy HP left when lost'],
      rows,
    ),
    '',
  );
}

// ---- cards: what players play, what it deals, and what it does to winning ----
type C = {
  plays: number;
  dealt: number;
  inDecks: number;
  wonWith: number;
  peakDealt: number;
  peaks: number;
};
const cards = new Map<string, C>();
const cardRow = (id: string): C => {
  const k = base(id);
  let c = cards.get(k);
  if (!c)
    cards.set(k, (c = { plays: 0, dealt: 0, inDecks: 0, wonWith: 0, peakDealt: 0, peaks: 0 }));
  return c;
};
for (const f of camp) {
  for (const id of new Set(f.deck.map(base))) {
    const c = cardRow(id);
    c.inDecks++;
    if (f.won) c.wonWith++;
  }
  if (!f.s) continue;
  for (const [id, r] of Object.entries(f.s.byCard)) {
    const c = cardRow(id);
    c.plays += r.plays;
    c.dealt += r.dealt;
  }
  for (const p of f.s.peak.cards) {
    const c = cardRow(p.card);
    c.peakDealt += p.dealt;
    c.peaks++;
  }
}
const winAll = camp.length ? camp.filter((f) => f.won).length / camp.length : 0;
{
  const rows = [...cards.entries()]
    .filter(([, c]) => c.plays >= 5)
    .sort((a, b) => b[1].dealt - a[1].dealt)
    .slice(0, 40)
    .map(([id, c]) => [
      cardName(id),
      c.inDecks,
      c.plays,
      c.dealt,
      Math.round(c.dealt / c.plays),
      pct(c.wonWith, c.inDecks),
      c.peaks,
    ]);
  lines.push(
    '## Cards: most damage dealt by players (Campaign)',
    '',
    `Win rate with = fights won when the card was in the deck (all fights: ${pct(winAll * 1000, 1000)}). In big turns = how often it was one of the top cards of a fight's biggest turn.`,
    '',
    table(['Card', 'Decks', 'Plays', 'Damage', 'Per play', 'Win rate with', 'In big turns'], rows),
    '',
  );
}

// exploits: the biggest single turns, against what the enemies had
{
  const turns = camp
    .flatMap((f) => (f.s && f.s.peak.dealt > 0 ? [{ f, s: f.s }] : []))
    .sort(
      (a, b) =>
        b.s.peak.dealt / Math.max(1, b.s.foeHp) - a.s.peak.dealt / Math.max(1, a.s.foeHp) ||
        b.s.peak.dealt - a.s.peak.dealt,
    )
    .slice(0, 25)
    .map(({ f, s }) => [
      f.build,
      f.tier,
      f.encounter,
      `turn ${s.peak.turn}`,
      s.peak.dealt,
      `${Math.round((100 * s.peak.dealt) / Math.max(1, s.foeHp))}%`,
      s.peak.cards.map((c) => `${cardName(c.card)} ${c.dealt}`).join(', '),
    ]);
  lines.push(
    '## Biggest single turns (what players use for burst)',
    '',
    "Share = that turn's damage against all the enemies' starting HP.",
    '',
    table(['Build', 'Tier', 'Encounter', 'When', 'Damage', 'Share', 'Cards that did it'], turns),
    '',
  );
}

// ---- deck choices: what players take when it is offered ----
{
  // (the newest snapshot of each run holds that run's choices so far)
  const latest = new Map<string, Row>();
  for (const s of campaign) {
    const run = typeof s['run'] === 'string' ? s['run'] : '';
    const at = Number(s['at'] ?? 0);
    if (!latest.has(run) || Number(latest.get(run)!['at'] ?? 0) < at) latest.set(run, s);
  }
  const offered = new Map<string, { shown: number; taken: number }>();
  let skips = 0;
  let rewards = 0;
  for (const s of latest.values())
    for (const d of (s['drafts'] as
      { k: string; took: string | null; offered?: string[] }[] | undefined) ?? []) {
      if (d.k !== 'reward' || !d.offered) continue;
      rewards++;
      if (d.took === null) skips++;
      for (const c of d.offered) {
        const r = offered.get(base(c)) ?? { shown: 0, taken: 0 };
        r.shown++;
        if (d.took && base(d.took) === base(c)) r.taken++;
        offered.set(base(c), r);
      }
    }
  const ranked = [...offered.entries()].filter(([, r]) => r.shown >= 5);
  const top = [...ranked]
    .sort((a, b) => b[1].taken / b[1].shown - a[1].taken / a[1].shown)
    .slice(0, 20);
  const bottom = [...ranked]
    .sort((a, b) => a[1].taken / a[1].shown - b[1].taken / b[1].shown)
    .slice(0, 20);
  lines.push(
    '## Card rewards: what players take',
    '',
    `${latest.size} runs, ${rewards} card rewards, ${pct(skips, rewards)} skipped.`,
    '',
    '### Taken most often when offered',
    '',
    table(
      ['Card', 'Offered', 'Taken', 'Pick rate'],
      top.map(([c, r]) => [cardName(c), r.shown, r.taken, pct(r.taken, r.shown)]),
    ),
    '',
    '### Passed over most',
    '',
    table(
      ['Card', 'Offered', 'Taken', 'Pick rate'],
      bottom.map(([c, r]) => [cardName(c), r.shown, r.taken, pct(r.taken, r.shown)]),
    ),
    '',
  );
}

// ---- Arena: real games ----
{
  const wins = new Map<string, { n: number; won: number; turns: number[]; humans: number }>();
  const arenaCards = new Map<string, { plays: number; dealt: number }>();
  let replayed = 0;
  for (const g of arena) {
    for (const seat of ['a', 'b'] as const) {
      const side = g[seat] as { hero?: string; ascendancy?: string } | undefined;
      const b = build(side?.hero, side?.ascendancy);
      const r = wins.get(b) ?? { n: 0, won: 0, turns: [], humans: 0 };
      r.n++;
      if (g['winner'] === seat) r.won++;
      const turns = (g['turns'] as Record<string, number> | undefined)?.[seat];
      if (typeof turns === 'number') r.turns.push(turns);
      // (a ghost game has one human seat: the other is a saved deck the bot plays)
      if (g['source'] === 'human' || g['ghostSeat'] !== seat) r.humans++;
      wins.set(b, r);
      const rep = g['replay'] as
        | { rules?: number; seed?: string; a?: Row; b?: Row; log?: { seat: Side; action: never }[] }
        | undefined;
      if (rep?.rules === RULES_VERSION && rep.seed && rep.a && rep.b && Array.isArray(rep.log)) {
        // (the same setup the Arena room made: HP, seats and opening hands)
        const s = statsOf(
          undefined,
          {
            setup: setupFor(rep.seed, rep.a as unknown as Entry, rep.b as unknown as Entry),
            moves: rep.log,
          },
          RULES_VERSION,
          seat,
        );
        if (s) {
          replayed++;
          for (const [id, c] of Object.entries(s.byCard)) {
            const row = arenaCards.get(base(id)) ?? { plays: 0, dealt: 0 };
            row.plays += c.plays;
            row.dealt += c.dealt;
            arenaCards.set(base(id), row);
          }
        }
      }
    }
  }
  const rows = [...wins.entries()]
    .filter(([, r]) => r.n >= 3)
    .sort((a, b) => b[1].won / b[1].n - a[1].won / a[1].n)
    .map(([b, r]) => [b, r.n, r.humans, pct(r.won, r.n), median(r.turns)]);
  lines.push(
    '## Arena: builds in real games',
    '',
    table(['Build', 'Games', 'Human seats', 'Won', 'Own turns'], rows),
    '',
  );
  const top = [...arenaCards.entries()]
    .filter(([, c]) => c.plays >= 5)
    .sort((a, b) => b[1].dealt - a[1].dealt)
    .slice(0, 25);
  lines.push(
    `### Arena: most damage by card (${replayed} seats replayed under today's rules)`,
    '',
    table(
      ['Card', 'Plays', 'Damage', 'Per play'],
      top.map(([c, r]) => [cardName(c), r.plays, r.dealt, Math.round(r.dealt / r.plays)]),
    ),
    '',
  );
}

writeFileSync(join(out, 'report.md'), lines.join('\n'));
console.log(`Wrote ${join(out, 'report.md')}`);
