// The rest of every Riftwalker's five Legendary cards (the first two live in each pool file). A deck holds at most
// V2_DECK_RULES.maxLegendary of them at a time (rewards.ts, canAdd), so being offered one is a real choice: it takes
// a Legendary slot another one could have had. One per lane for each character, in that lane's own idiom.

import type { CardDef } from '@sr/combat';
import {
  ACT,
  addTo,
  barrier,
  channel,
  dmg,
  draw,
  evoke,
  forge,
  heal,
  lose,
  mana,
  on,
  pool,
  revive,
  stance,
  stars,
  status,
  summon,
} from '../build';

const m = pool('maren', 'aurelion');
const r = pool('rivet', 'nexus');
const k = pool('kesh', 'wyldmaw');
const v = pool('vesper', 'umbral');
const q = pool('quill', 'umbral');
const i = pool('ilvane', 'nexus');
const s = pool('sehra', 'aurelion');
const a = pool('astra', 'starfall');
const g = pool('mire', 'gloomfen');
const p = pool('kp', 'midden');

export const LEGENDARIES: CardDef[] = [
  // --- Maren: Bulwark / Thorns / Sanctified ---
  m('legendary', 'aegis-eternal', 'Aegis Eternal', 'power', 3, 'none', [
    status('fortified', 1),
    on('turnEnd', [barrier(3)]),
  ]),
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
  m('legendary', 'crown-of-thorns', 'Crown of Thorns', 'power', 2, 'none', [
    status('thorns', 2),
    on('barrier', [dmg(3, 'randomFoe')]),
  ]),

  // --- Rivet: Swarm / Assemble / Core ---
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
  r('legendary', 'the-assembly-line', 'The Assembly Line', 'power', 3, 'none', [
    on('summon', [draw(1), barrier(3)]),
  ]),
  r('legendary', 'master-schematic', 'Master Schematic', 'power', 3, 'none', [
    status('might', 2, 'allFriends'),
    on('turnStart', [status('might', 1, 'allFriends')]),
  ]),

  // --- Kesh: Bloodrage / Pack / Feast ---
  k(
    'legendary',
    'alphas-howl',
    "Alpha's Howl",
    'skill',
    2,
    'none',
    [status('might', 3, 'allFriends'), status('vigor', 6), draw(2)],
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
  k('legendary', 'the-pack-eternal', 'The Pack Eternal', 'power', 3, 'none', [
    on('allyDies', [summon('hound'), heal(6)]),
  ]),

  // --- Vesper: Snares / Exposed / Bluff ---
  v('legendary', 'web-of-lies', 'Web of Lies', 'power', 3, 'none', [
    on('snare', [status('exposed', 2, 'allFoes'), dmg(5, 'allFoes')]),
  ]),
  v(
    'legendary',
    'final-bow',
    'Final Bow',
    'skill',
    2,
    'none',
    [status('exposed', 3, 'allFoes'), status('faltering', 2, 'allFoes'), barrier(15)],
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

  // --- Quill: Sleeve Knives / Bleed / Sleight ---
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
  q('legendary', 'crimson-ledger', 'Crimson Ledger', 'power', 2, 'none', [
    on('turnStart', [status('seared', 3, 'allFoes')]),
  ]),
  q(
    'legendary',
    'grand-finale',
    'Grand Finale',
    'skill',
    2,
    'none',
    [draw(4), mana(2), addTo('sleeve-knife', 4)],
    { exhaust: true },
  ),

  // --- Ilvane: Hawk / Bear / Elder ---
  i(
    'legendary',
    'the-spirit-council',
    'The Spirit Council',
    'skill',
    3,
    'none',
    [channel('spark'), channel('ward'), channel('hollow'), status('resonance', 2)],
    { exhaust: true },
  ),
  i('legendary', 'ancestral-fury', 'Ancestral Fury', 'power', 3, 'none', [
    on('turnStart', [evoke(1, 1, true)]),
  ]),
  i(
    'legendary',
    'the-world-totem',
    'The World Totem',
    'skill',
    2,
    'none',
    [status('resonance', 3), draw(2), mana(1)],
    { exhaust: true },
  ),

  // --- Sehra: Fury / Serene / Fervor ---
  s('legendary', 'eternal-rage', 'Eternal Rage', 'power', 2, 'none', [
    stance('wrath'),
    on('turnStart', [status('vigor', 4), barrier(4)]),
  ]),
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
  s('legendary', 'ascension', 'Ascension', 'skill', 1, 'none', [status('mantra', 5), draw(2)], {
    exhaust: true,
  }),

  // --- Obsidia: Blade / Arcana / Sigils ---
  a('legendary', 'molten-heart', 'Molten Heart', 'power', 2, 'none', [
    on('turnStart', [stars(2), forge('starforged-blade', 2)]),
  ]),
  a('legendary', 'shatterstorm', 'Shatterstorm', 'attack', 3, 'none', [dmg(40, 'allFoes')], {
    starCost: 5,
  }),
  a('legendary', 'the-obsidian-throne', 'The Obsidian Throne', 'power', 3, 'none', [
    on('play', [barrier(4)], { tag: 'blade' }),
    on('turnEnd', [dmg(6, 'allFoes')]),
  ]),

  // --- Mire: Fate / Thralls / Ashes ---
  g(
    'legendary',
    'grave-harvest',
    'Grave Harvest',
    'skill',
    2,
    'none',
    [status('doom', 12, 'allFoes'), revive],
    { exhaust: true },
  ),
  g(
    'legendary',
    'legion-of-the-drowned',
    'Legion of the Drowned',
    'skill',
    3,
    'none',
    [revive, revive, status('might', 2, 'allFriends')],
    { exhaust: true },
  ),
  g('legendary', 'ashes-to-ashes', 'Ashes to Ashes', 'power', 2, 'none', [
    on('exhaust', [dmg(5, 'allFoes'), status('doom', 2, 'allFoes')]),
  ]),

  // --- KP: Gun / Shells / Hangover ---
  p(
    'legendary',
    'final-round',
    'Final Round',
    'skill',
    2,
    'none',
    [draw(3), addTo('buckshot-shell', 4), heal(12)],
    { exhaust: true },
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
  p('legendary', 'hitting-bottom', 'Hitting Bottom', 'power', 2, 'none', [
    status('thorns', 4),
    on('loseHp', [barrier(8), status('might', 1)]),
  ]),
];
