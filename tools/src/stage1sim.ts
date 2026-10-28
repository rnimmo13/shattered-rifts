// `pnpm stage1sim`: a first run's stage 1 (tier 1) for every Riftwalker and each of their three starting kits, played by the
// runsim bot. Two bots: `draft` takes the best-rarity card on offer (as runsim does), `starter` never takes a card, so it shows
// how far the starting deck alone gets. The goal (Robert, 2026-10-27): with the starting kit alone, about 1 run in 4 reaches the
// stage 1 Warden and a little fewer beat it (DECISIONS #333).
//
//   pnpm stage1sim -- --n 60 --difficulty normal --heroes knight,drunkard

import type { Difficulty } from '@sr/campaign';
import { RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { scale, setPilot, playStage1, type Bot } from './stage1';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}
const N = Number(arg('n', '40'));
const DIFF = arg('difficulty', 'normal') as Difficulty;
const HEROES = (arg('heroes', Object.keys(RIFTWALKERS).join(',')).split(',') as HeroId[]).filter(
  (h) => RIFTWALKERS[h],
);
setPilot(arg('pilot', 'greedy') === 'smart' ? 'smart' : 'greedy');
// experiment knobs: --duelHp 1.2 --duelDmg 1.3 --wardenHp 0.8 --wardenDmg 0.9 (multipliers on top of the game's numbers)
for (const k of ['duelHp', 'duelDmg', 'wardenHp', 'wardenDmg'] as const)
  scale[k] = Number(arg(k, '1'));
const ONLY = arg('bots', 'starter,draft').split(',') as Bot[];

const pct = (x: number): string => `${Math.round(x * 100)}%`.padStart(5);
const avg = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

function row(h: HeroId, k: number, bot: Bot) {
  const rs = Array.from({ length: N }, (_, i) => playStage1(h, k, bot, i, DIFF));
  const at = rs.filter((r) => r.bossReached);
  return {
    reach: at.length / N,
    clear: rs.filter((r) => r.cleared).length / N,
    hp: avg(at.map((r) => r.bossHp)),
    lost: avg(rs.map((r) => r.lost)),
    cards: avg(rs.map((r) => r.cards)),
  };
}

const NONE = { reach: 0, clear: 0, hp: 0, lost: 0, cards: 0 };
const all: { s: typeof NONE; d: typeof NONE }[] = [];
console.log(`stage1sim: ${N} runs per pair of starting uncommons, ${DIFF}, tier 1, stage 1 only\n`);
console.log(
  'hero        kit  path               | starter: boss  clear  HP@boss | draft: boss  clear  HP@boss cards',
);
for (const h of HEROES) {
  for (let k = 0; k < 3; k++) {
    const s = ONLY.includes('starter') ? row(h, k, 'starter') : NONE;
    const d = ONLY.includes('draft') ? row(h, k, 'draft') : NONE;
    all.push({ s, d });
    const path = `pair ${k + 1}`;
    console.log(
      `${h.padEnd(12)}${String.fromCharCode(97 + k).padEnd(5)}${path.padEnd(19)}|        ${pct(s.reach)}  ${pct(s.clear)}    ${pct(s.hp)} |      ${pct(d.reach)}  ${pct(d.clear)}    ${pct(d.hp)} ${d.cards.toFixed(1).padStart(5)}`,
    );
  }
}

const mean = (f: (x: (typeof all)[number]) => number): number => avg(all.map(f));
console.log(
  `\naverage: starter reach ${pct(mean((x) => x.s.reach))}, starter clear ${pct(mean((x) => x.s.clear))}, draft reach ${pct(mean((x) => x.d.reach))}, draft clear ${pct(mean((x) => x.d.clear))}`,
);
