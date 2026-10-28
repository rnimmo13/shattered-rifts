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
    [/might/i, 1],
    [/consume/i, 2],
    [/blood/i, 3],
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
    [/feast|berserker|predator/i, 2],
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
    [/bleed|seared/i, 1],
    [/sleight/i, 2],
    [/basics/i, null],
  ],
  totemist: [
    [/totems/i, 0],
    [/whittling|elements/i, 1],
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
    [/court/i, 2],
    [/basics/i, null],
  ],
  // (Dorian is the Necrobinder's card list: a first sort only, as build paths are hidden for now, DECISIONS #365)
  necromancer: [
    [/fate/i, 0],
    [/thralls/i, 1],
    [/souls/i, 2],
    [/basics|glue/i, null],
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
  // brought back for the 20/30/25 rarity target (DECISIONS #341)
  'patch-job': 2,
  // brought back for the 20/30/25 rarity target (DECISIONS #341)
  'wreath-of-flame': 2,
  // new cards of the 20/30/25 rarity target (DECISIONS #341)
  'kindled-rite': 2,
  'smoke-offering': 2,
  sagitta: 2,
  aquila: 2,
  'double-tap': 0,
  bandolier: 0,
  'scattergun-symphony': 1,
  ricochet: 1,
  'deaths-ledger': 0,
  'soul-chain': 1,
  // brought back for the 20/30/25 rarity target (DECISIONS #341)
  'salvage-rights': 0,
  'scrapyard-king': 0,
  'echo-command': 1,
  'resonant-pulse': 1,
  'self-repair': 2,
  'pack-leader': 1,
  'poison-pantry': 0,
  'whisper-net': 0,
  'compound-fear': 1,
  hamstring: 1,
  'trick-of-the-light': 2,
  'stolen-moment': 2,
  'crystal-ward': 0,
  'cold-snap': 0,
  'rending-hands': 0,
  'blood-on-the-sand': 0,
  'open-palm': 1,
  'shield-of-faith': 2,
  'dutch-courage': 2,
  'mean-drunk': 2,
  'toll-in-advance': 0,
  'unquiet-rest': 1,
  'bone-pile': 2,
  // Kesh's Feast became Berserker (DECISIONS #340): Feral Instinct is Berserker now, the rest that stayed found the build path they fit
  'feral-instinct': 2,
  'devour-ally': 1,
  'gnarltooth-trap': 0,
  'gut-trap': 0,
  // new cards that fill a build path to its minimum (DECISIONS #337)
  buttstroke: 0,
  'spare-barrel': 0,
  'gun-oil': 0,
  'dead-eye': 0,
  // brought back to fill a build path to its minimum (DECISIONS #337)
  // Swarm goes wide, Core goes tall (DECISIONS #358)
  'heavy-plating': 0,
  'repair-bot': 0,
  reactor: 0,
  'sync-pulse': 1,
  overload: 1,
  'hardened-chassis': 2,
  spotlight: 1,
  'arc-flash': 0,
  'lattice-collapse': 0,
  'tuning-fork': 2,
  'rune-carapace': 2,
  birdshot: 1,
  'creeping-dread': 0,
  'thralls-cue': 1,
  ghostform: 2,
  'grave-robbery': 2,
  reanimate: 1,
  'death-feeds': 1,
  // every Legendary has a build path, one per path (DECISIONS #334, #337); glue cards have none
  // knight: none (Valeria's rares sit under their own headings, and her Legendaries are Rares now, DECISIONS #363)
  // engineer
  'drone-apotheosis': 0,
  'overclocked-legion': 1,
  'foundry-awakens': 2,
  // hunter
  'hunger-unleashed': 0,
  'bloodmoon-hunt': 1,
  'apex-maw': 2,
  // trapper
  'the-perfect-trap': 0,
  'the-long-ambush': 1,
  masquerade: 2,
  // assassin: none (his Legendaries went with his older cards: the Silent's list, docs/decisions-pending/assassin.md)
  // totemist
  'cataclysm-glyph': 0,
  'the-spirit-council': 1,
  'the-grand-design': 2,
  'chorus-of-glyphs': 2,
  'tune-the-lattice': 2,
  // barbarian
  'eye-of-the-storm': 0,
  'perfect-balance': 1,
  'still-flame-ascendant': 2,
  // (spellblade: her headings decide, she has no Legendary)
  // drunkard
  'the-twelve-gauge-opera': 0,
  'one-more-round': 1,
  'the-glass-palace': 2,
  'rolling-thunder': 0,
  'pick-up-the-brass': 0,
  // (necromancer: none, his former Legendaries sit under his pool headings now)
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
// glue cards: any build path can use them, so they belong to none (DECISIONS #337)
const NO_PATH = [
  'bone-crack',
  'whet-the-fangs',
  'primal-feast',
  'low-blow',
  'tear-the-veil',
  'step-aside',
  'tangle-wire',
  'quick-hands',
  'cold-open',
  'crushing-palm',
  'inner-sight',
  'quick-palms',
  'broken-bottle',
  'chaser',
  'dumpster-dive',
  // glue for the 20/30/25 rarity target (DECISIONS #341)
  'hunger-unbound',
  'relay-network',
  'thousand-palms',
  'unbroken-calm',
  // glue for the 20/30/25 rarity target (DECISIONS #341)
  // glue for the 20/30/25 rarity target (DECISIONS #341)
  'swarm-surge',
  'tear-loose',
  'ancient-fury',
  'curtain-call',
  'misdirection',
  'careful-plan',
  'countless-nicks',
  'plague-cloud',
  'biased-weave',
  'many-voices',
  'poise',
  'booby-trapped-window',
  'broken-window-theory',
  'soul-tithe',
  'soul-harvest',
  'requiem',
  'devour',
  // uncommon and rare glue that takes every pool to 70 (DECISIONS #339)
  'factory-floor',
  'blueprint',
  'bloodsong',
  'slip-the-leash',
  'between-worlds',
  'perfect-alibi',
  'sleight-of-hand',
  'mask-of-faces',
  'veil-of-dust',
  'tricksters-vanish',
  'nimble-hands',
  'overtune',
  'glyph-lattice',
  'spirit-shield',
  'breath-between-blows',
  'held-breath',
  'whiskey-miracle',
  'rock-bottom',
  'liquid-courage',
  'window-pane',
  'ominous-chimes',
  'deathless',
];
for (const id of NO_PATH) delete out[id];
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
