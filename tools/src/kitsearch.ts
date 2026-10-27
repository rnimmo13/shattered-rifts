// `pnpm kitsearch`: for each starting kit, try every uncommon of its build path as the kit's third card and play stage 1 with the
// starter-only bot, to find the third card that puts the kit closest to the target: about 1 run in 4 reaches the stage 1 Warden
// and a little fewer beat it (DECISIONS #333). Prints the best few per kit; the chosen cards go into KIT_CARDS by hand.
//
//   pnpm kitsearch -- --n 40 --heroes knight,hunter --reach 0.25 --clear 0.18

import { KIT_CARDS } from '@sr/campaign';
import { COMBAT_DB, RIFTWALKERS, pathOf, type HeroId } from '@sr/content/v2';
import { setPilot, playStage1 } from './stage1';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback;
}
const N = Number(arg('n', '40'));
// (--reach -1 leaves reaching the Warden out of the score: only how often the kit beats it counts)
const REACH = Number(arg('reach', '0.25'));
const CLEAR = Number(arg('clear', '0.18'));
const HEROES = (arg('heroes', Object.keys(RIFTWALKERS).join(',')).split(',') as HeroId[]).filter(
  (h) => RIFTWALKERS[h],
);
setPilot(arg('pilot', 'greedy') === 'smart' ? 'smart' : 'greedy');

const kits = KIT_CARDS as unknown as Record<HeroId, string[][]>;

function measure(h: HeroId, path: number): { reach: number; clear: number } {
  let reach = 0;
  let clear = 0;
  for (let i = 0; i < N; i++) {
    const r = playStage1(h, path, 'starter', i);
    if (r.bossReached) reach++;
    if (r.cleared) clear++;
  }
  return { reach: reach / N, clear: clear / N };
}
const score = (m: { reach: number; clear: number }): number =>
  (REACH >= 0 ? Math.abs(m.reach - REACH) : 0) +
  Math.abs(m.clear - CLEAR) * (REACH >= 0 ? 0.5 : 1) +
  (m.clear > m.reach ? 1 : 0);
const pct = (x: number): string => `${Math.round(x * 100)}%`.padStart(4);

console.log(
  `kitsearch: ${N} starter-only runs per candidate; target ${pct(REACH)} reach the Warden, ${pct(CLEAR)} beat it\n`,
);
for (const h of HEROES) {
  for (let path = 0; path < 3; path++) {
    const kit = kits[h][path] as string[];
    const base = kit.slice(0, 2);
    const taken = new Set(kits[h].flatMap((k, p) => (p === path ? base : k)));
    const candidates = Object.values(COMBAT_DB.cards)
      .filter(
        (c) =>
          c.hero === h &&
          c.rarity === 'uncommon' &&
          !c.id.endsWith('+') &&
          !c.unplayable &&
          pathOf(c.id) === path &&
          !taken.has(c.id),
      )
      .map((c) => c.id);
    const before = measure(h, path);
    const tried = candidates.map((id) => {
      kits[h][path] = [...base, id];
      const m = measure(h, path);
      return { id, ...m, s: score(m) };
    });
    tried.sort((a, b) => a.s - b.s);
    kits[h][path] = kit;
    const name = (RIFTWALKERS[h].buildPaths[path] ?? '').split(':')[0];
    console.log(
      `${h} ${name} (now ${pct(before.reach)} / ${pct(before.clear)}): ` +
        tried
          .slice(0, 4)
          .map((t) => `${t.id} ${pct(t.reach)}/${pct(t.clear)}`)
          .join(' | '),
    );
  }
}
