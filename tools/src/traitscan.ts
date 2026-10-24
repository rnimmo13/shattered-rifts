// `pnpm traitscan`: how much is each Riftwalker's trait worth? The same drafted deck fights the same elites and Wardens with the trait
// and without it (paired seeds); the score is the share of HP the hero has left (0 for a loss). The difference is the trait's value.
// Noise is about +-4 points at 80 seeds, so only read the gaps.
//
//   pnpm traitscan -- --seeds 120 --hp 115 --dmg 110

import { applyAction, chooseAction, createCombat, heroOf } from '@sr/combat';
import { COMBAT_DB as db, ENCOUNTERS, RIFTWALKERS, rewardPool, type HeroId } from '@sr/content/v2';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}
const HEROES = (arg('heroes', Object.keys(RIFTWALKERS).join(',')).split(',') as HeroId[]).filter(
  (h) => RIFTWALKERS[h],
);
const SEEDS = Number(arg('seeds', '80'));
const HP = Number(arg('hp', '115'));
const DMG = Number(arg('dmg', '110'));
const DRAFT = Number(arg('draft', '8'));

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

type Db = typeof db;
function score(d: Db, h: HeroId, deck: string[], seedKey: string, foe: (typeof FOES)[number]): number {
  let { state } = createCombat(d, {
    seed: seedKey,
    a: { hero: h, deck },
    b: { enemies: foe.units, hpPct: HP, dmgPct: DMG },
  });
  const maxHp = heroOf(state.sides.a)?.maxHp ?? 1;
  for (let t = 0; t < 700 && !state.winner; t++)
    state = applyAction(d, state, chooseAction(d, state)).state;
  return state.winner === 'a' ? (heroOf(state.sides.a)?.hp ?? 0) / maxHp : 0;
}

console.log(`trait value = HP left with the trait minus without it, ${SEEDS} paired fights each\n`);
const rows: { h: HeroId; name: string; on: number; off: number }[] = [];
for (const h of HEROES) {
  const own = rewardPool(h).filter((id) => db.cards[id]?.hero === h);
  const hero = db.heroes[h];
  if (!hero) continue;
  const bare: Db = { ...db, heroes: { ...db.heroes, [h]: { ...hero, trait: { name: '', text: '' } } } };
  let on = 0;
  let off = 0;
  for (let i = 0; i < SEEDS; i++) {
    const r = rnd(i + 7);
    const deck = [...RIFTWALKERS[h].starter];
    for (let k = 0; k < DRAFT; k++) deck.push(own[Math.floor(r() * own.length)] as string);
    const foe = FOES[i % FOES.length] as (typeof FOES)[number];
    on += score(db, h, deck, `trait-${h}-${i}`, foe);
    off += score(bare, h, deck, `trait-${h}-${i}`, foe);
  }
  rows.push({ h, name: RIFTWALKERS[h].trait.name, on: on / SEEDS, off: off / SEEDS });
}
rows.sort((a, b) => b.on - b.off - (a.on - a.off));
for (const r of rows) {
  const d = (r.on - r.off) * 100;
  console.log(
    `${r.h.padEnd(8)} ${r.name.padEnd(16)} with ${(r.on * 100).toFixed(0).padStart(3)}%  without ${(r.off * 100).toFixed(0).padStart(3)}%  value ${(d >= 0 ? '+' : '') + d.toFixed(1)}`,
  );
}
