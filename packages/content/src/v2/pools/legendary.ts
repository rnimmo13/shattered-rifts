// The third top-rarity card of every Riftwalker (the others live in each pool file). These were the Legendaries: Robert put
// Legendary away for now (2026-10-28, DECISIONS #363: "do away with legendary cards for now, we will add those once the base set of
// common/uncommon/rare is balanced"), so they are Rares until it comes back. Each belongs to one build path and is a build-around
// for it, never a one-off pile of Barrier (Robert, 2026-10-27; DECISIONS #338).

import type { CardDef } from '@sr/combat';
import {
  ACT,
  barrier,
  dmg,
  forge,
  on,
  per,
  pool,
  scaled,
  stance,
  stars,
  status,
  summon,
} from '../build';

const r = pool('engineer', 'nexus');
const k = pool('hunter', 'wyldmaw');
const v = pool('trapper', 'umbral');
const q = pool('assassin', 'umbral');
const i = pool('totemist', 'nexus');
const s = pool('barbarian', 'aurelion');
const a = pool('spellblade', 'starfall');
const p = pool('drunkard', 'midden');

export const LEGENDARIES: CardDef[] = [
  r(
    'rare',
    'drone-apotheosis',
    'Drone Uprising',
    'skill',
    2,
    'none',
    // (they arrive charged up: Rivet keeps only 3 "act now" cards, DECISIONS #361)
    [summon('drone'), summon('drone'), summon('drone'), status('vigor', 3, 'allAllies')],
    { exhaust: true },
  ),
  // Pack: two more Hounds, and the whole pack strikes at once
  k(
    'rare',
    'bloodmoon-hunt',
    'Bloodmoon Hunt',
    'skill',
    2,
    'none',
    [summon('hound'), summon('hound'), status('might', 3, 'allAllies'), ACT],
    { exhaust: true, up: { cost: 1 } },
  ),
  // Exposed: it marks every enemy as it springs
  v(
    'rare',
    'the-long-ambush',
    'The Long Ambush',
    'snare',
    3,
    'none',
    [dmg(25, 'allFoes'), status('stunned', 2, 'allFoes'), status('exposed', 3, 'allFoes')],
    { trigger: { on: 'foeTurn' } },
  ),
  // Sleight: the more you discarded this turn, the more it hits
  q('rare', 'ten-thousand-cuts', 'Death by Inches', 'attack', 1, 'foe', [
    scaled(dmg(5, 'target', 2), per('discarded', 2, undefined, 'hits')),
  ]),
  // Elements: Spirit every turn, and every enemy struck for all of it (DECISIONS #353)
  i(
    'rare',
    'the-spirit-council',
    'Avatar of the Elements',
    'power',
    3,
    'none',
    [on('turnStart', [status('resonance', 1), scaled(dmg(0, 'allFoes'), per('resonance'))])],
    { up: { cost: 2 } },
  ),
  // Fury: in Fury every turn, and every turn it lashes out
  s(
    'rare',
    'eye-of-the-storm',
    'Eye of the Storm',
    'power',
    2,
    'none',
    [on('turnStart', [stance('wrath'), dmg(6, 'allFoes'), barrier(6)])],
    { up: { cost: 1 } },
  ),
  // Sigils: Arcana every turn, and a strike on every enemy for each Aura you have
  a(
    'rare',
    'shatterstorm',
    'Shatterstorm',
    'power',
    3,
    'none',
    [on('turnStart', [stars(2), scaled(dmg(0, 'allFoes'), per('powers', 3))])],
    { up: { cost: 2 } },
  ),
  // (the necromancer's Grave Harvest is gone: Dorian is the Necrobinder's card list, docs/decisions-pending/necromancer.md)
  // Gun: a sharper gun at once, and every shot sharpens it again and covers you
  p(
    'rare',
    'the-twelve-gauge-opera',
    'The Twelve-Gauge Opera',
    'power',
    2,
    'none',
    [
      forge('old-twelve-gauge', 6),
      on('play', [forge('old-twelve-gauge', 2), barrier(4)], { tag: 'gun' }),
    ],
    { up: { cost: 1 } },
  ),
];
