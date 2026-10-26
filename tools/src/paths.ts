// `pnpm build paths`: work out which build path of its Riftwalker each card belongs to, from the section comments in the pool files
// ("// --- Bulwark ---"), and write packages/content/src/v2/paths.generated.ts (card id -> build path 0, 1 or 2). Cards under a
// heading that is not a build path (basics, legendary, glue) get no build path. Run it after adding cards or changing a build path name.

import { readFileSync, writeFileSync } from 'node:fs';
import { COMBAT_DB, RIFTWALKERS, type HeroId } from '@sr/content/v2';

const POOLS: Record<HeroId, string> = {
  knight: 'knight',
  engineer: 'engineer',
  hunter: 'hunter',
  trapper: 'trapper',
  assassin: 'assassin',
  totemist: 'totemist',
  barbarian: 'barbarian',
  spellblade: 'spellblade',
  necromancer: 'necromancer',
  drunkard: 'drunkard',
};
/** which pool heading is which build path (a heading that matches nothing here carries on with the build path before it; null = no build path) */
const HEADS: Record<HeroId, [RegExp, number | null][]> = {
  knight: [
    [/bulwark/i, 0],
    [/thorns/i, 1],
    [/devotion/i, 2],
    [/basics|glue/i, null],
  ],
  engineer: [
    [/swarm/i, 0],
    [/assemble/i, 1],
    [/core/i, 2],
    [/basics|shared/i, null],
  ],
  hunter: [
    [/bloodrage/i, 0],
    [/pack/i, 1],
    [/feast/i, 2],
    [/basics/i, null],
  ],
  trapper: [
    [/snares|traps/i, 0],
    [/exposed/i, 1],
    [/bluff/i, 2],
    [/basics/i, null],
  ],
  assassin: [
    [/shivs/i, 0],
    [/seared/i, 1],
    [/sleight/i, 2],
    [/basics/i, null],
  ],
  totemist: [
    [/hawk/i, 0],
    [/bear/i, 1],
    [/elder/i, 2],
    [/basics|glue/i, null],
  ],
  barbarian: [
    [/wrath/i, 0],
    [/calm/i, 1],
    [/mantra/i, 2],
    [/basics/i, null],
  ],
  spellblade: [
    [/blade/i, 0],
    [/arcana/i, 1],
    [/sigils/i, 2],
    [/basics/i, null],
  ],
  necromancer: [
    [/doom/i, 0],
    [/thralls/i, 1],
    [/ashes/i, 2],
    [/basics|shared|dead come back/i, null],
  ],
  drunkard: [
    [/junk traps/i, 0],
    [/hangover|glass/i, 1],
    [/shells|liquid courage|old twelve gauge/i, 2],
    [/basics|legendary/i, null],
  ],
};

const out: Record<string, number> = {};
/** cards under a heading that is not a build path but that belong to one */
const BY_ID: Record<string, number> = {
  'grave-robbery': 2,
  'bone-pile': 2,
  reanimate: 1,
  'death-feeds': 1,
};
const report: string[] = [];
for (const h of Object.keys(POOLS) as HeroId[]) {
  const text = readFileSync(
    new URL(`../../packages/content/src/v2/pools/${POOLS[h]}.ts`, import.meta.url),
    'utf8',
  );
  const items: { at: number; head?: string; id?: string }[] = [];
  for (const m of text.matchAll(/\n\s*\/\/ --- ([^\n]*?) ---/g))
    items.push({ at: m.index ?? 0, head: m[1] ?? '' });
  for (const m of text.matchAll(
    /\n {2}[a-z]\(\s*'(?:basic|common|uncommon|rare|legendary)',\s*'([a-z0-9-]+)'/g,
  ))
    items.push({ at: m.index ?? 0, id: m[1] ?? '' });
  items.sort((a, b) => a.at - b.at);
  let path = -1;
  const counts = [0, 0, 0];
  for (const it of items) {
    if (it.head !== undefined) {
      const hit = HEADS[h].find(([re]) => re.test(it.head ?? ''));
      if (hit) path = hit[1] ?? -1;
    } else if (it.id && path >= 0) {
      out[it.id] = path;
      counts[path] = (counts[path] ?? 0) + 1;
    }
  }
}
// KP's pool is sectioned by theme, not by build path: his three build paths are named by card here
const KP_GUN = [
  'old-twelve-gauge',
  'rack-the-slide',
  'powder-load',
  'pistol-whip',
  'glass-cover',
  'hair-trigger',
  'reload',
  'extended-mag',
  'rack-and-ruin',
  'one-more-round',
  'gunmetal-polish',
  'trigger-discipline',
  'barrel-roll',
  'aim',
  'scope',
  'steady-hands',
  'ironsights',
  'gunmetal-soul',
  'hot-brass',
];
const KP_SHELLS = [
  'buckshot-shell',
  'load-shells',
  'shell-pocket',
  'slug-round',
  'rock-salt',
  'double-barrel',
  'pump-action',
  'shotgun-wedding',
  'shell-game',
  'boomstick',
  'last-shell',
  'shell-shock',
  'birdshot',
  'shell-casing',
  'slugfest',
  'magazine',
  'shellshocked',
  'fire-in-the-hole',
  'ammo-dump',
  'sawn-off',
  'pit-of-bottles',
  'shard-toss',
  'last-orders',
  'rusty-nail-board',
  'molotov-cocktail',
  'broken-window-theory',
  'tin-can-alley',
  'pick-up-the-brass',
  'spray-and-pray',
  'rolling-thunder',
];
const kpFile = readFileSync(
  new URL('../../packages/content/src/v2/pools/drunkard.ts', import.meta.url),
  'utf8',
);
for (const m of kpFile.matchAll(
  /\n {2}p\(\s*'(?:basic|common|uncommon|rare|legendary)',\s*'([a-z0-9-]+)'/g,
)) {
  const id = m[1] ?? '';
  if (['pane-up', 'hammer-swing', 'bottle-tripwire'].includes(id)) continue;
  out[id] = KP_GUN.includes(id) ? 0 : KP_SHELLS.includes(id) ? 1 : 2;
}
Object.assign(out, BY_ID);
const body = Object.entries(out)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([id, l]) => `  '${id}': ${l},`)
  .join('\n');
writeFileSync(
  new URL('../../packages/content/src/v2/paths.generated.ts', import.meta.url),
  `// GENERATED by \`pnpm buildPaths\` (tools/src/buildPaths.ts): which path (0, 1 or 2 of Riftwalker.buildPaths) each card belongs to. Do not edit.\n\nexport const PATH_OF: Record<string, number> = {\n${body}\n};\n`,
);
for (const h of Object.keys(POOLS) as HeroId[]) {
  const names = RIFTWALKERS[h].buildPaths.map((l) => (l.split(':')[0] ?? '').toLowerCase());
  const n = names.map(
    (_, i) =>
      Object.entries(out).filter(([id, l]) => l === i && COMBAT_DB.cards[id]?.hero === h).length,
  );
  report.push(`${h.padEnd(8)} ${names.map((k, i) => `${k}: ${n[i]}`).join('   ')}`);
}
console.log(report.join('\n'));
