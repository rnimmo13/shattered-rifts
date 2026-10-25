// The third Legendary of every Riftwalker (the first two live in each pool file). A deck holds at most
// V2_DECK_RULES.maxLegendary of them at a time (rewards.ts, canAdd), so being offered one is a real choice: it takes
// a Legendary slot another one could have had. Each is a payoff skill or attack, so a character's three are not all Powers.

import type { CardDef } from '@sr/combat';
import {
  ACT,
  barrier,
  channel,
  dmg,
  draw,
  heal,
  lose,
  mana,
  pool,
  revive,
  stance,
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
  m(
    'legendary',
    'bastion-of-dawn',
    'Bastion of Dawn',
    'skill',
    3,
    'none',
    [barrier(30), status('thorns', 4), draw(2)],
    { exhaust: true },
  ),
  r(
    'legendary',
    'drone-apotheosis',
    'Drone Apotheosis',
    'skill',
    2,
    'none',
    [summon('drone'), summon('drone'), summon('drone'), ACT],
    { exhaust: true },
  ),
  k(
    'legendary',
    'bloodmoon-hunt',
    'Bloodmoon Hunt',
    'attack',
    3,
    'none',
    [dmg(20, 'allFoes'), heal(15)],
    { exhaust: true },
  ),
  v(
    'legendary',
    'the-long-ambush',
    'The Long Ambush',
    'snare',
    3,
    'none',
    [dmg(25, 'allFoes'), status('stunned', 1, 'allFoes')],
    { trigger: { on: 'foeTurn' } },
  ),
  q(
    'legendary',
    'ten-thousand-cuts',
    'Ten Thousand Cuts',
    'attack',
    2,
    'foe',
    [dmg(3, 'target', 8)],
    {
      tags: ['knife'],
    },
  ),
  i(
    'legendary',
    'the-spirit-council',
    'The Spirit Council',
    'skill',
    3,
    'none',
    [channel('spark'), channel('ward'), channel('hollow'), status('resonance', 2)],
    {
      exhaust: true,
      up: {
        cost: 2,
        effects: [channel('spark'), channel('ward'), channel('hollow'), status('resonance', 3)],
      },
    },
  ),
  s(
    'legendary',
    'eye-of-the-storm',
    'Eye of the Storm',
    'skill',
    2,
    'none',
    [stance('calm'), barrier(20), mana(2)],
    { exhaust: true },
  ),
  a('legendary', 'shatterstorm', 'Shatterstorm', 'attack', 3, 'none', [dmg(40, 'allFoes')], {
    starCost: 5,
  }),
  g(
    'legendary',
    'grave-harvest',
    'Grave Harvest',
    'skill',
    2,
    'none',
    [status('doom', 18, 'allFoes'), revive],
    { exhaust: true, up: { cost: 1 } },
  ),
  p(
    'legendary',
    'the-twelve-gauge-opera',
    'The Twelve-Gauge Opera',
    'attack',
    3,
    'none',
    [dmg(25, 'allFoes'), lose(8)],
    { exhaust: true },
  ),
];
