// `pnpm ghostsim [matches per pairing]`: how much better the smart bot (the pilot of a ghost) is than the greedy bot. Every pair of
// starting decks is played in both seats, the smart bot on one side and the greedy bot on the other, and the smart bot's win rate is
// counted. A bot that is no better than the greedy one would show near 50%. Also reports how long the smart bot thinks per move.

import { chooseAction, chooseSmartAction } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { Match } from '@sr/pvp';

const PER = Number(process.argv[2] ?? 2);
/** `pnpm ghostsim 2 width depth budget` tries other search sizes */
const OPTS = {
  ...(process.argv[3] ? { width: Number(process.argv[3]) } : {}),
  ...(process.argv[4] ? { depth: Number(process.argv[4]) } : {}),
  ...(process.argv[5] ? { budget: Number(process.argv[5]) } : {}),
};
const heroes = Object.keys(RIFTWALKERS) as HeroId[];
const entry = (h: HeroId) => ({
  name: h,
  hero: h,
  deck: [...RIFTWALKERS[h].starter],
  boons: [],
  tier: 1,
});

let smartWins = 0;
let greedyWins = 0;
let draws = 0;
let moves = 0;
let ms = 0;
const byHero = new Map<string, { w: number; n: number }>();

for (const x of heroes)
  for (const y of heroes) {
    if (x === y) continue;
    for (let i = 0; i < PER; i++) {
      // the smart bot plays x in one match (seat a) and y in the mirror match (seat b)
      for (const smartSeat of ['a', 'b'] as const) {
        const m = new Match(`ghost-${x}-${y}-${i}-${smartSeat}`, entry(x), entry(y), 0);
        let guard = 0;
        while (!m.over && guard++ < 4000) {
          let action;
          if (m.active === smartSeat) {
            const t = performance.now();
            action = chooseSmartAction(COMBAT_DB, m.state, OPTS);
            ms += performance.now() - t;
            moves++;
          } else action = chooseAction(COMBAT_DB, m.state);
          const r = m.submit(m.active, m.log.length + 1, action, 0);
          if (!r.ok) throw new Error(r.message);
        }
        const w = m.over?.winner ?? 'draw';
        const hero = smartSeat === 'a' ? x : y;
        const rec = byHero.get(hero) ?? { w: 0, n: 0 };
        rec.n++;
        if (w === smartSeat) {
          smartWins++;
          rec.w++;
        } else if (w === 'draw') draws++;
        else greedyWins++;
        byHero.set(hero, rec);
      }
    }
  }

const n = smartWins + greedyWins + draws;
console.log(
  `${n} matches (${PER} per pairing in each seat, starter decks): smart bot ${smartWins} wins (${((100 * smartWins) / n).toFixed(1)}%), greedy bot ${greedyWins}, draws ${draws}`,
);
console.log(
  `the smart bot thought ${(ms / Math.max(1, moves)).toFixed(1)} ms per move on average (${moves} moves)`,
);
console.log('hero      smart bot wins with it');
for (const [h, r] of byHero)
  console.log(
    `${h.padEnd(9)} ${((100 * r.w) / Math.max(1, r.n)).toFixed(0).padStart(5)}%  (${r.n})`,
  );
