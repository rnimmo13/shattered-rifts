// `pnpm cardscan`: which cards are far stronger or weaker than the rest? Every card of a Riftwalker's pool is added twice to a
// starter deck plus a few fixed random cards, and the deck fights elites and Wardens. The score is the share of HP the hero has
// left (0 for a loss), compared with the same decks without the card. Noise is large (one card among ~26), so only read the
// extremes. See docs/BALANCE.md.
//
//   pnpm cardscan -- --heroes vesper,kp --seeds 14 --hp 115 --dmg 110 --top 10

import { applyAction, chooseAction, createCombat, heroOf } from '@sr/combat';
import { COMBAT_DB as db, ENCOUNTERS, RIFTWALKERS, rewardPool, type HeroId } from '@sr/content/v2';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}
const HEROES = (arg('heroes', Object.keys(RIFTWALKERS).join(',')).split(',') as HeroId[]).filter(
  (h) => RIFTWALKERS[h],
);
const SEEDS = Number(arg('seeds', '14'));
const HP = Number(arg('hp', '115'));
const DMG = Number(arg('dmg', '110'));
const TOP = Number(arg('top', '8'));
const DRAFT = Number(arg('draft', '8'));
const COPIES = Number(arg('copies', '2'));

const FOES = ENCOUNTERS.filter(
  (e) => (e.kind === 'elite' || e.kind === 'warden') && !['vorthax', 'nyxara'].includes(e.id),
);

function rnd(seed: number): () => number {
  let x = seed * 2654435761 + 1;
  return () => {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    return x / 2 ** 32;
  };
}

function score(h: HeroId, deck: string[], seedKey: string, foe: (typeof FOES)[number]): number {
  let { state } = createCombat(db, {
    seed: seedKey,
    a: { hero: h, deck },
    b: { enemies: foe.units, hpPct: HP, dmgPct: DMG },
  });
  const maxHp = heroOf(state.sides.a)?.maxHp ?? 1;
  for (let t = 0; t < 700 && !state.winner; t++)
    state = applyAction(db, state, chooseAction(db, state)).state;
  return state.winner === 'a' ? (heroOf(state.sides.a)?.hp ?? 0) / maxHp : 0;
}

for (const h of HEROES) {
  const own = rewardPool(h).filter((id) => db.cards[id]?.hero === h);
  const base = (i: number): string[] => {
    const r = rnd(i + 7);
    const deck = [...RIFTWALKERS[h].starter];
    for (let k = 0; k < DRAFT; k++) deck.push(own[Math.floor(r() * own.length)] as string);
    return deck;
  };
  const run = (extra: string[]): number => {
    let sum = 0;
    let n = 0;
    for (let i = 0; i < SEEDS; i++) {
      const foe = FOES[i % FOES.length] as (typeof FOES)[number];
      sum += score(h, [...base(i), ...extra], `scan-${h}-${i}`, foe);
      n++;
    }
    return sum / n;
  };
  const baseline = run([]);
  const rows = own
    .map((id) => ({ id, v: run(Array<string>(COPIES).fill(id)) - baseline }))
    .sort((a, b) => b.v - a.v);
  const fmt = (r: { id: string; v: number }): string =>
    `${(db.cards[r.id]?.name ?? r.id).padEnd(26)} ${(r.v >= 0 ? '+' : '') + (r.v * 100).toFixed(0)}  (${db.cards[r.id]?.rarity}, ${db.cards[r.id]?.kind})`;
  console.log(
    `\n== ${h}: baseline ${Math.round(baseline * 100)}% of HP left, ${own.length} cards ==`,
  );
  console.log('strongest:');
  for (const r of rows.slice(0, TOP)) console.log('  ' + fmt(r));
  console.log('weakest:');
  for (const r of rows.slice(-Math.max(3, Math.floor(TOP / 2)))) console.log('  ' + fmt(r));
}
