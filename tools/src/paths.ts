// `pnpm paths`: work out which build path of its Riftwalker each card belongs to, from the section comments in the pool files
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
    [/patience/i, 2],
    [/basics/i, null],
  ],
  assassin: [
    [/shivs/i, 0],
    [/seared/i, 1],
    [/sleight/i, 2],
    [/basics/i, null],
  ],
  totemist: [
    [/totems/i, 0],
    [/whittling/i, 1],
    [/rites/i, 2],
    [/basics|glue/i, null],
  ],
  barbarian: [
    [/fury/i, 0],
    [/flow/i, 1],
    [/radiant/i, 2],
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
  reanimate: 1,
  'death-feeds': 1,
  // every card has a build path, Legendaries and the old glue cards too (DECISIONS #334): 8 common, 7 uncommon, 5 rare and 1 Legendary each
  // knight
  'dawn-incarnate': 0,
  'the-last-oath': 1,
  'bastion-of-dawn': 2,
  'bell-toll': 0,
  'gilded-blow': 0,
  'unbroken-wall': 0,
  'steady-resolve': 0,
  'zealous-charge': 1,
  'dawns-verdict': 1,
  'vengeful-light': 1,
  sanctuary: 1,
  // engineer
  'drone-apotheosis': 0,
  'overclocked-legion': 1,
  'foundry-awakens': 2,
  'static-field': 0,
  overcharge: 1,
  railgun: 1,
  plating: 2,
  'ion-lance': 2,
  // hunter
  'hunger-unleashed': 0,
  'bloodmoon-hunt': 1,
  'apex-maw': 2,
  // trapper
  'the-perfect-trap': 0,
  'the-long-ambush': 1,
  masquerade: 2,
  // assassin
  'deck-of-a-thousand-knives': 0,
  'death-warrant': 1,
  'ten-thousand-cuts': 2,
  // totemist
  'cataclysm-glyph': 0,
  'the-spirit-council': 1,
  'the-grand-design': 2,
  'rune-burst': 0,
  'harmonic-wave': 0,
  retune: 1,
  'prism-cut': 1,
  'leyline-tap': 2,
  'chorus-of-glyphs': 2,
  'tune-the-lattice': 2,
  // barbarian
  'eye-of-the-storm': 0,
  'perfect-balance': 1,
  'still-flame-ascendant': 2,
  // spellblade
  'the-sovereigns-crown': 0,
  'birth-of-a-star': 1,
  shatterstorm: 2,
  // drunkard
  'the-twelve-gauge-opera': 0,
  'one-more-round': 1,
  'the-glass-palace': 2,
  'rolling-thunder': 0,
  'pick-up-the-brass': 0,
  // necromancer
  'the-last-toll': 0,
  'the-drowned-king': 1,
  'grave-harvest': 2,
  'sepulchral-gaze': 0,
  'rattling-charge': 0,
  'grave-trap': 1,
  dredge: 2,
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
  'trigger-discipline',
  'aim',
  'scope',
  'ironsights',
  'gunmetal-soul',
  'hot-brass',
];
const KP_SHELLS = [
  'buckshot-shell',
  'load-shells',
  'slug-round',
  'pump-action',
  'shotgun-wedding',
  'shell-game',
  'boomstick',
  'last-shell',
  'shell-shock',
  'slugfest',
  'shellshocked',
  'fire-in-the-hole',
  'ammo-dump',
  'sawn-off',
  'shard-toss',
  'last-orders',
  'rusty-nail-board',
  'molotov-cocktail',
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
  `// GENERATED by \`pnpm paths\` (tools/src/paths.ts): which build path (0, 1 or 2 of Riftwalker.buildPaths) each card belongs to. Do not edit.\n\nexport const PATH_OF: Record<string, number> = {\n${body}\n};\n`,
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
