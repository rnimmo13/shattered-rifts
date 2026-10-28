// `pnpm bosssim`: every Riftwalker's three starting kits (starter deck + kit, full HP, no other cards) against one stage 1 Warden at
// Tier 1 Normal scaling, played by the smart bot. Prints win rate, average turns, and how hurt the Warden was on a loss.
//   --warden kron|seraphine|gorrmaw|nyxara   (default gorrmaw)   --n 60   --pilot smart|greedy

import { applyAction, chooseAction, chooseSmartAction, createCombat, heroOf } from '@sr/combat';
import { enemyScale, newRun } from '@sr/campaign';
import { COMBAT_DB as db, ENCOUNTERS, RIFTWALKERS, type HeroId } from '@sr/content/v2';

const arg = (k: string, d: string): string => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? (process.argv[i + 1] ?? d) : d;
};
const wardenId = arg('warden', 'gorrmaw');
const n = Number(arg('n', '60'));
const smart = arg('pilot', 'smart') === 'smart';
const warden = ENCOUNTERS.find((e) => e.id === wardenId);
if (!warden) throw new Error(`No encounter ${wardenId}`);
const sc = enemyScale(1, 1);
console.log(
  `Warden ${wardenId} (${warden.units.join(', ')}), Tier 1 stage 1 scaling hp ${sc.hp}% dmg ${sc.dmg}%, ${n} fights per kit, ${smart ? 'smart' : 'greedy'} bot\n`,
);
console.log('| Riftwalker | Kit | Wins | Avg turns | Turns (won) | Warden HP left on a loss | Your HP left on a win |');
console.log('|---|---|---|---|---|---|---|');

for (const hero of Object.keys(RIFTWALKERS) as HeroId[]) {
  const base = newRun(hero, `boss-${hero}`);
  for (const kit of [{ id: 'starter', k: 0 }]) {
    const run = base;
    let wins = 0;
    let turns = 0;
    let wonTurns = 0;
    let bossLeft = 0;
    let hpLeft = 0;
    for (let i = 0; i < n; i++) {
      let { state } = createCombat(db, {
        seed: `boss:${hero}:${kit.id}:${i}`,
        a: { hero, deck: run.deck, hp: run.maxHp, maxHp: run.maxHp },
        b: { enemies: warden.units, tier: 1, hpPct: sc.hp, dmgPct: sc.dmg },
      });
      const max = state.sides.b.units.reduce((s, u) => s + u.maxHp, 0);
      for (let t = 0; t < 1500 && !state.winner; t++)
        state = applyAction(db, state, smart ? chooseSmartAction(db, state) : chooseAction(db, state)).state;
      const heroTurns = Math.ceil(state.turn / 2);
      turns += heroTurns;
      if (state.winner === 'a') {
        wins++;
        wonTurns += heroTurns;
        const h = heroOf(state.sides.a);
        hpLeft += h ? h.hp / h.maxHp : 0;
      } else {
        const left = state.sides.b.units.reduce((s, u) => s + Math.max(0, u.hp), 0);
        bossLeft += left / max;
      }
    }
    const losses = n - wins;
    const pct = (x: number) => `${Math.round(x * 100)}%`;
    console.log(
      `| ${hero} | ${kit.id} | ${pct(wins / n)} | ${(turns / n).toFixed(1)} | ${wins ? (wonTurns / wins).toFixed(1) : '-'} | ${losses ? pct(bossLeft / losses) : '-'} | ${wins ? pct(hpLeft / wins) : '-'} |`,
    );
  }
}
