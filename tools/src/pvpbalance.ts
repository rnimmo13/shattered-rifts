// `pnpm pvpbalance [matches per pairing]`: plays PvP matches between starting decks with the greedy bot on both seats and
// counts how often the seat that moves first (a) and the one that moves second (b) wins. It is the number behind the question
// "does going first matter?" (docs/BALANCE.md). The bot is not a person, so read it as a hint, not a verdict.

import { chooseAction } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { Match } from '@sr/pvp';

const PER = Number(process.argv[2] ?? 6);
const heroes = Object.keys(RIFTWALKERS) as HeroId[];
const entry = (h: HeroId) => ({
  name: h,
  hero: h,
  deck: [...RIFTWALKERS[h].starter],
  boons: [],
  tier: 1,
});

let first = 0;
let second = 0;
let draws = 0;
const turns: number[] = [];
const byHero = new Map<string, { as1: number; g1: number; as2: number; g2: number }>();
const note = (h: string, seat: 'a' | 'b', won: boolean): void => {
  const r = byHero.get(h) ?? { as1: 0, g1: 0, as2: 0, g2: 0 };
  if (seat === 'a') {
    r.g1++;
    if (won) r.as1++;
  } else {
    r.g2++;
    if (won) r.as2++;
  }
  byHero.set(h, r);
};

for (const x of heroes)
  for (const y of heroes) {
    if (x === y) continue;
    for (let i = 0; i < PER; i++) {
      const m = new Match(`bal-${x}-${y}-${i}`, entry(x), entry(y), 0);
      let guard = 0;
      while (!m.over && guard++ < 4000) {
        const r = m.submit(m.active, m.log.length + 1, chooseAction(COMBAT_DB, m.state), 0);
        if (!r.ok) throw new Error(r.message);
      }
      const w = m.over?.winner ?? 'draw';
      if (w === 'a') first++;
      else if (w === 'b') second++;
      else draws++;
      turns.push(m.state.turn);
      if (w !== 'draw') {
        note(x, 'a', w === 'a');
        note(y, 'b', w === 'b');
      }
    }
  }

const n = first + second + draws;
console.log(`${n} matches (${PER} per pairing, starter decks, greedy bot on both seats)`);
console.log(
  `moves first (a): ${first} wins (${((100 * first) / n).toFixed(1)}%)   moves second (b): ${second} wins (${((100 * second) / n).toFixed(1)}%)   draws: ${draws}`,
);
console.log(
  `average length: ${(turns.reduce((s, t) => s + t, 0) / turns.length).toFixed(1)} turns`,
);
console.log('hero      wins moving first   wins moving second');
for (const [h, r] of byHero)
  console.log(
    `${h.padEnd(9)} ${((100 * r.as1) / Math.max(1, r.g1)).toFixed(0).padStart(5)}%            ${((100 * r.as2) / Math.max(1, r.g2)).toFixed(0).padStart(5)}%`,
  );
