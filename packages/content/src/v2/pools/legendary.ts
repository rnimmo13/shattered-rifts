// The third Legendary of every Riftwalker (the first two live in each pool file). A deck holds at most
// V2_DECK_RULES.maxLegendary of them at a time (rewards.ts, canAdd), so being offered one is a real choice: it takes
// a Legendary slot another one could have had. Each belongs to one build path and is a build-around for it, never a one-off pile of
// Barrier (Robert, 2026-10-27; DECISIONS #338).

import type { CardDef } from '@sr/combat';
import {
  ACT,
  barrier,
  dmg,
  forge,
  heal,
  on,
  per,
  pool,
  scaled,
  stance,
  stars,
  status,
  summon,
} from '../build';

const m = pool('knight', 'aurelion');
const r = pool('engineer', 'nexus');
const k = pool('hunter', 'wyldmaw');
const v = pool('trapper', 'umbral');
const q = pool('assassin', 'umbral');
const i = pool('totemist', 'nexus');
const s = pool('barbarian', 'aurelion');
const a = pool('spellblade', 'starfall');
const g = pool('necromancer', 'gloomfen');
const p = pool('drunkard', 'midden');

export const LEGENDARIES: CardDef[] = [
  // Devotion: every heal also strikes (the whole heal, past full HP too), and she heals every turn
  m(
    'legendary',
    'bastion-of-dawn',
    "Dawn's Mercy",
    'power',
    3,
    'none',
    [on('heal', [scaled(dmg(0, 'randomFoe'), per('healed'))]), on('turnStart', [heal(3)])],
    { up: { cost: 2 } },
  ),
  r(
    'legendary',
    'drone-apotheosis',
    'Drone Uprising',
    'skill',
    2,
    'none',
    [summon('drone'), summon('drone'), summon('drone'), ACT],
    { exhaust: true },
  ),
  // Pack: two more Hounds, and the whole pack strikes at once
  k(
    'legendary',
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
    'legendary',
    'the-long-ambush',
    'The Long Ambush',
    'snare',
    3,
    'none',
    [dmg(25, 'allFoes'), status('stunned', 2, 'allFoes'), status('exposed', 3, 'allFoes')],
    { trigger: { on: 'foeTurn' } },
  ),
  // Sleight: the more you discarded this turn, the more it hits
  q('legendary', 'ten-thousand-cuts', 'Death by Inches', 'attack', 1, 'foe', [
    scaled(dmg(5, 'target', 2), per('discarded', 2, undefined, 'hits')),
  ]),
  // Elements: Spirit every turn, and every enemy struck for all of it (DECISIONS #353)
  i(
    'legendary',
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
    'legendary',
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
    'legendary',
    'shatterstorm',
    'Shatterstorm',
    'power',
    3,
    'none',
    [on('turnStart', [stars(2), scaled(dmg(0, 'allFoes'), per('powers', 3))])],
    { up: { cost: 2 } },
  ),
  // Ashes: every card consumed strikes and curses every enemy
  g(
    'legendary',
    'grave-harvest',
    'Grave Harvest',
    'power',
    2,
    'none',
    [on('exhaust', [dmg(4, 'allFoes'), status('doom', 2, 'allFoes')])],
    { up: { cost: 1 } },
  ),
  // Gun: a sharper gun at once, and every shot sharpens it again and covers you
  p(
    'legendary',
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
