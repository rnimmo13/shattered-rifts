// `pnpm sim`: Combat v2 balance sim. Starter decks (and optionally a drafted deck) played by the greedy bot against every
// encounter. Win rate and average HP lost on a win, per Riftwalker.
//
//   pnpm sim                    starter decks, 40 fights each
//   pnpm sim -- --n 100 --draft 8   add 8 random reward cards (seeded) to each deck first

import { applyAction, chooseAction, createCombat, heroOf } from '@sr/combat';
import { COMBAT_DB as db, ENCOUNTERS, RIFTWALKERS, rewardPool, type HeroId } from '@sr/content/v2';

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? Number(process.argv[i + 1] ?? fallback) : fallback;
}
const N = arg('n', 40);
const DRAFT = arg('draft', 0);

function deckFor(h: HeroId, seed: number): string[] {
  const deck = [...RIFTWALKERS[h].starter];
  const pool = rewardPool(h);
  let x = seed * 2654435761 + 1;
  for (let i = 0; i < DRAFT; i++) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    deck.push(pool[x % pool.length] as string);
  }
  return deck;
}

let stalls = 0;
const heroes = Object.keys(RIFTWALKERS) as HeroId[];
console.log(
  `Combat v2 sim: ${N} fights per cell, +${DRAFT} drafted cards. Cell = win% / avg HP lost on wins\n`,
);
console.log('encounter'.padEnd(26) + heroes.map((h) => h.padEnd(14)).join(''));
for (const e of ENCOUNTERS) {
  let row = `${e.kind[0]}:${e.id}`.padEnd(26);
  for (const h of heroes) {
    let wins = 0;
    let lost = 0;
    for (let i = 0; i < N; i++) {
      let { state } = createCombat(db, {
        seed: `${h}-${e.id}-${i}`,
        a: { hero: h, deck: deckFor(h, i) },
        b: { enemies: e.units },
      });
      const maxHp = heroOf(state.sides.a)?.maxHp ?? 0;
      for (let t = 0; t < 800 && !state.winner; t++)
        state = applyAction(db, state, chooseAction(db, state)).state;
      if (!state.winner) stalls++;
      if (state.winner === 'a') {
        wins++;
        lost += maxHp - (heroOf(state.sides.a)?.hp ?? 0);
      }
    }
    row += `${Math.round((wins / N) * 100)}% / ${wins ? Math.round(lost / wins) : '-'}`.padEnd(14);
  }
  console.log(row);
}
console.log(`\n${stalls} fights hit the action cap (counted as losses)`);
