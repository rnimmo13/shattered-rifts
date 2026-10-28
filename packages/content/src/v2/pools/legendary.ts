// The third top-rarity card of most Riftwalkers (the others live in each pool file; Sylas, Obsidia, Dorian and Ilvane have none). These were the Legendaries: Robert put
// Legendary away for now (2026-10-28, DECISIONS #363: "do away with legendary cards for now, we will add those once the base set of
// common/uncommon/rare is balanced"), so they are Rares until it comes back. Each belongs to one build path and is a build-around
// for it, never a one-off pile of Barrier (Robert, 2026-10-27; DECISIONS #338).

import type { CardDef } from '@sr/combat';
import { ACT, barrier, dmg, forge, on, pool, stance, status, summon } from '../build';

const k = pool('hunter', 'wyldmaw');
const v = pool('trickster', 'umbral');
const s = pool('barbarian', 'aurelion');
const p = pool('drunkard', 'midden');

// (the Engineer's Drone Uprising was retired into Drone Carrier by the costing pass, DECISIONS #383)
export const LEGENDARIES: CardDef[] = [
  // Pack: two more Hounds, and the whole pack strikes at once
  k(
    'rare',
    'bloodmoon-hunt',
    'Bloodmoon Hunt',
    'skill',
    2,
    'none',
    [summon('hound'), status('might', 2, 'allAllies'), ACT],
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
