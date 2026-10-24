// Ser Maren Ashcourt (Aurelion). No companions. Three lanes:
//   Bulwark     - Barrier that scales, and hits for the Barrier you hold
//   Thorns      - retaliation: Thorns, punishing Traps, payoffs for the Thorns you carry
//   Sanctified  - healing, Shielded and Radiant Powers
// Glue cards (marked) serve two lanes. Numbers assume 3 Mana and a 5-card hand.

import type { CardDef } from '@sr/combat';
import {
  barrier,
  dmg,
  doubleSt,
  draw,
  heal,
  lose,
  manaNext,
  on,
  per,
  pool,
  PREVENT,
  scaled,
  status,
} from '../build';

const m = pool('maren', 'aurelion');

export const MAREN: CardDef[] = [
  // --- basics ---
  m('basic', 'dawn-smite', 'Dawn Smite', 'attack', 1, 'foe', [dmg(6), barrier(3)]),
  m('basic', 'oathbound', 'Oathbound', 'skill', 1, 'none', [barrier(7), status('thorns', 1)]),

  // --- Bulwark ---
  m('common', 'stand-firm', 'Stand Firm', 'skill', 1, 'none', [barrier(10)], { retain: true }),
  m('common', 'gilded-bastion', 'Gilded Bastion', 'skill', 2, 'none', [barrier(16)]),
  m('common', 'brace-up', 'Brace Up', 'skill', 0, 'none', [barrier(4)]),
  m('common', 'bulwark-blow', 'Bulwark Blow', 'attack', 1, 'foe', [scaled(dmg(2), per('barrier'))]),
  m('uncommon', 'anvil-strike', 'Anvil Strike', 'attack', 2, 'foe', [
    scaled(dmg(11), per('barrier', 1)),
  ]),
  m('uncommon', 'gilded-wall', 'Gilded Wall', 'skill', 2, 'none', [
    scaled(barrier(0), per('barrier')),
  ]),
  m('uncommon', 'plate-discipline', 'Plate Discipline', 'power', 1, 'none', [
    on('turnEnd', [barrier(4)]),
  ]),
  m(
    'rare',
    'impregnable',
    'Impregnable',
    'skill',
    2,
    'none',
    [scaled(barrier(0), per('barrier', 2))],
    {
      exhaust: true,
    },
  ),

  m('common', 'iron-vigil', 'Iron Vigil', 'skill', 1, 'none', [barrier(6), draw(1)]),
  m('common', 'shield-bash', 'Shield Bash', 'attack', 1, 'foe', [
    scaled(dmg(3), per('barrier', 0.5)),
  ]),
  m('uncommon', 'rampart', 'Rampart', 'power', 1, 'none', [
    on('play', [barrier(2)], { filter: 'attack' }),
  ]),
  m('rare', 'citadel-march', 'Citadel March', 'power', 2, 'none', [
    on('turnEnd', [scaled(dmg(0, 'allFoes'), per('barrier', 0.25))]),
  ]),

  // (more Bulwark)
  m('uncommon', 'oath-of-iron', 'Oath of Iron', 'skill', 1, 'none', [barrier(8), draw(1)], {
    retain: true,
  }),
  m('uncommon', 'shield-charge', 'Shield Charge', 'attack', 2, 'foe', [dmg(12), barrier(8)]),
  m('rare', 'bastion-engine', 'Bastion Engine', 'power', 2, 'none', [
    on('barrier', [dmg(4, 'randomFoe')]),
  ]),
  m('rare', 'immovable-oath', 'Immovable Oath', 'skill', 2, 'none', [barrier(30)], {
    exhaust: true,
  }),
  m('rare', 'colossus-blow', 'Colossus Blow', 'attack', 2, 'foe', [
    scaled(dmg(0), per('barrier', 1.5)),
  ]),
  m('rare', 'rampart-of-ages', 'Rampart of Ages', 'power', 2, 'none', [status('bracing', 2)]),

  // --- Thorns ---
  m('common', 'thornmail', 'Thornmail', 'skill', 1, 'none', [status('thorns', 3)]),
  m('common', 'righteous-rebuke', 'Righteous Rebuke', 'snare', 1, 'none', [dmg(10, 'attacker')], {
    trigger: { on: 'attacked' },
  }),
  m('common', 'reprisal', 'Reprisal', 'snare', 1, 'none', [dmg(9, 'allFoes')], {
    trigger: { on: 'hpLost', min: 4 },
  }),
  m('uncommon', 'retribution', 'Retribution', 'attack', 1, 'foe', [
    scaled(dmg(0), per('thorns', 3)),
  ]),
  m('uncommon', 'barbed-oath', 'Barbed Oath', 'power', 1, 'none', [
    on('turnStart', [status('thorns', 1)]),
  ]),
  m(
    'uncommon',
    'mirror-shield',
    'Mirror Shield',
    'snare',
    1,
    'none',
    [dmg(4, 'attacker'), scaled(dmg(0, 'attacker'), per('thorns', 2))],
    { trigger: { on: 'attacked' } },
  ),
  m('rare', 'radiant-oath', 'Radiant Oath', 'power', 2, 'none', [status('thorns', 4)]),
  m('rare', 'thornlord', 'Thornlord', 'power', 2, 'none', [
    on('play', [status('thorns', 1)], { filter: 'skill' }),
  ]),

  m('common', 'barbed-guard', 'Barbed Guard', 'skill', 1, 'none', [
    barrier(5),
    status('thorns', 2),
  ]),
  m('common', 'thorn-lash', 'Thorn Lash', 'attack', 1, 'foe', [scaled(dmg(4), per('thorns', 1))]),
  m(
    'uncommon',
    'caltrops',
    'Caltrops',
    'snare',
    1,
    'none',
    [dmg(5, 'attacker'), status('faltering', 1, 'attacker')],
    { trigger: { on: 'attacked' } },
  ),
  m('rare', 'bramble-storm', 'Bramble Storm', 'power', 2, 'none', [
    on('turnEnd', [scaled(dmg(0, 'allFoes'), per('thorns', 0.5))]),
  ]),

  // (more Thorns)
  m('uncommon', 'ember-ward', 'Ember Ward', 'skill', 1, 'none', [
    barrier(10),
    status('thorns', 4, 'self', true),
  ]),
  m('uncommon', 'mirrored-aegis', 'Mirrored Aegis', 'skill', 2, 'none', [
    barrier(14),
    status('thorns', 2),
  ]),
  m('rare', 'briar-heart', 'Briar Heart', 'power', 3, 'none', [
    on('barrier', [status('thorns', 1)]),
  ]),

  // --- Sanctified ---
  m('common', 'lightbearer', 'Lightbearer', 'skill', 1, 'none', [heal(4), barrier(5)]),
  m('common', 'prayer', 'Prayer', 'skill', 0, 'none', [heal(4), draw(1)], { exhaust: true }),
  m('uncommon', 'aegis-of-the-warden', 'Aegis of the Warden', 'skill', 2, 'none', [
    barrier(6),
    status('shielded', 1),
  ]),
  m('uncommon', 'benediction', 'Benediction', 'skill', 2, 'none', [heal(10), barrier(6)], {
    exhaust: true,
  }),
  m('uncommon', 'ward-of-ages', 'Ward of Ages', 'skill', 1, 'none', [
    status('shielded', 1),
    draw(1),
  ]),
  m('uncommon', 'sacred-vow', 'Sacred Vow', 'power', 2, 'none', [on('turnEnd', [heal(3)])]),
  m('rare', 'hallowed-ground', 'Hallowed Ground', 'power', 2, 'none', [status('shielded', 2)]),
  m('rare', 'halo', 'Halo', 'power', 3, 'none', [on('turnStart', [status('shielded', 1)])]),
  m(
    'rare',
    'absolution',
    'Absolution',
    'skill',
    3,
    'none',
    [heal(12), barrier(12), status('shielded', 1)],
    { exhaust: true },
  ),

  m('common', 'sunlit-blow', 'Sunlit Blow', 'attack', 1, 'foe', [dmg(6), heal(2)]),
  m('uncommon', 'gracebound', 'Gracebound', 'power', 1, 'none', [
    on('play', [heal(1)], { filter: 'skill' }),
  ]),
  m('rare', 'radiant-renewal', 'Radiant Renewal', 'skill', 2, 'none', [heal(8), draw(2)], {
    exhaust: true,
  }),

  // (more Sanctified)
  m('uncommon', 'heartening-hymn', 'Heartening Hymn', 'skill', 1, 'none', [
    heal(6, 'allFriends'),
    barrier(4, 'allFriends'),
  ]),
  m('rare', 'crown-of-light', 'Crown of Light', 'power', 2, 'none', [
    on('turnStart', [heal(2), barrier(4)]),
  ]),
  m(
    'rare',
    'dawn-chorus',
    'Dawn Chorus',
    'skill',
    2,
    'none',
    [heal(10, 'allFriends'), status('shielded', 1)],
    { exhaust: true },
  ),
  m('rare', 'holy-reckoning', 'Holy Reckoning', 'attack', 2, 'none', [dmg(8, 'allFoes'), heal(6)]),
  m(
    'rare',
    'last-stand',
    'Last Stand',
    'skill',
    1,
    'none',
    [barrier(8), scaled(barrier(0), per('missingHp', 0.5))],
    { exhaust: true },
  ),

  // --- glue and plain strikes ---
  m('common', 'bell-toll', 'Bell Toll', 'attack', 1, 'none', [dmg(5, 'allFoes'), barrier(3)]),
  m('common', 'dawnlance', 'Dawnlance', 'attack', 2, 'foe', [dmg(12), barrier(6)]),
  m('common', 'zealous-charge', 'Zealous Charge', 'attack', 1, 'foe', [dmg(4, 'target', 3)]),
  m('common', 'gilded-blow', 'Gilded Blow', 'attack', 1, 'foe', [dmg(8), barrier(2)]),
  m('common', 'spiked-aegis', 'Spiked Aegis', 'skill', 1, 'none', [
    barrier(6),
    status('thorns', 1),
  ]), // Bulwark + Thorns
  m('uncommon', 'radiant-bulwark', 'Radiant Bulwark', 'skill', 2, 'none', [barrier(12), heal(4)]), // Bulwark + Sanctified
  m('uncommon', 'vengeful-light', 'Vengeful Light', 'attack', 2, 'foe', [
    dmg(11),
    scaled(heal(0), per('thorns')),
  ]), // Thorns + Sanctified
  m('uncommon', 'crusade', 'Crusade', 'attack', 2, 'foe', [dmg(7, 'target', 2), barrier(4)]),
  m('uncommon', 'sanctuary', 'Sanctuary', 'snare', 2, 'none', [PREVENT, barrier(8)], {
    trigger: { on: 'attacked' },
  }),
  m('uncommon', 'sunburst', 'Sunburst', 'attack', 2, 'none', [
    dmg(9, 'allFoes'),
    status('faltering', 1, 'allFoes'),
  ]),
  m('rare', 'dawns-verdict', "Dawn's Verdict", 'attack', 3, 'foe', [
    dmg(28),
    status('exposed', 2, 'target'),
  ]),
  m('common', 'shell-cracker', 'Shell Cracker', 'attack', 1, 'foe', [
    dmg(4),
    status('brittle', 2, 'target'),
  ]),
  m('uncommon', 'plated-resolve', 'Plated Resolve', 'skill', 1, 'none', [status('armored', 2)]),
  m('uncommon', 'sure-footing', 'Sure Footing', 'power', 1, 'none', [status('bracing', 1)]),
  m('rare', 'unbroken-wall', 'Unbroken Wall', 'power', 2, 'none', [status('fortified', 1)]),
  m('legendary', 'the-last-oath', 'The Last Oath', 'power', 3, 'none', [
    status('fortified', 1),
    status('thorns', 3),
    status('bracing', 1),
  ]),
  m(
    'legendary',
    'dawn-incarnate',
    'Dawn Incarnate',
    'attack',
    3,
    'none',
    [barrier(10), scaled(dmg(0, 'allFoes'), per('barrier', 2))],
    { exhaust: true },
  ),
  m('uncommon', 'steady-resolve', 'Steady Resolve', 'skill', 1, 'none', [barrier(5), manaNext(2)]),

  // --- Bulwark (more) ---
  m('uncommon', 'bulwark-sweep', 'Bulwark Sweep', 'attack', 2, 'none', [
    scaled(dmg(4, 'allFoes'), per('barrier', 0.5)),
  ]),
  m(
    'uncommon',
    'hold-the-line',
    'Hold the Line',
    'skill',
    1,
    'none',
    [scaled(barrier(4), per('skillsPlayed', 3))],
    { retain: true },
  ),
  m(
    'rare',
    'forged-in-iron',
    'Forged in Iron',
    'skill',
    0,
    'none',
    [scaled(barrier(0), per('x', 6))],
    { x: true },
  ),
  m('uncommon', 'tower-shield', 'Tower Shield', 'power', 1, 'none', [
    on('play', [barrier(3)], { filter: 'skill' }),
  ]),
  m('common', 'iron-tithe', 'Iron Tithe', 'skill', 1, 'none', [
    barrier(6),
    scaled(barrier(0), per('exhausted', 2)),
  ]),
  m('common', 'crushing-weight', 'Crushing Weight', 'attack', 2, 'foe', [
    scaled(dmg(9), per('barrier', 0.5)),
    status('exposed', 1, 'target'),
  ]),
  m('rare', 'endless-vigil', 'Endless Vigil', 'power', 2, 'none', [
    on('turnEnd', [scaled(barrier(0), per('hand', 2))]),
  ]),

  // --- Thorns (more) ---
  m(
    'common',
    'spiked-retort',
    'Spiked Retort',
    'snare',
    1,
    'none',
    [dmg(6, 'attacker'), status('thorns', 2)],
    { trigger: { on: 'attacked' } },
  ),
  m('uncommon', 'thorn-volley', 'Thorn Volley', 'attack', 1, 'none', [
    scaled(dmg(2, 'allFoes'), per('thorns', 1)),
  ]),
  m('uncommon', 'thorn-covenant', 'Thorn Covenant', 'power', 1, 'none', [
    on('snare', [status('thorns', 2)]),
  ]),
  m('uncommon', 'barbed-bastion', 'Barbed Bastion', 'skill', 2, 'none', [
    scaled(barrier(6), per('thorns', 2)),
  ]),
  m('common', 'lacerate', 'Lacerate', 'attack', 1, 'foe', [
    dmg(7),
    status('faltering', 1, 'target'),
  ]),
  m('rare', 'briar-bloom', 'Briar Bloom', 'skill', 1, 'none', [doubleSt('thorns', 'self')], {
    exhaust: true,
  }),
  m(
    'uncommon',
    'punishing-gale',
    'Punishing Gale',
    'snare',
    2,
    'none',
    [dmg(8, 'allFoes'), scaled(dmg(0, 'allFoes'), per('thorns', 1))],
    { trigger: { on: 'foeTurn' } },
  ),

  // --- Sanctified (more) ---
  m('common', 'quick-orison', 'Quick Orison', 'skill', 0, 'none', [heal(3), draw(1)], {
    retain: true,
  }),
  m('uncommon', 'sunforged-edge', 'Sunforged Edge', 'attack', 2, 'foe', [
    scaled(dmg(8), per('missingHp', 0.25)),
  ]),
  m('uncommon', 'vigil-of-dawn', 'Vigil of Dawn', 'power', 1, 'none', [on('exhaust', [heal(2)])]),
  m('uncommon', 'consecrate', 'Consecrate', 'skill', 2, 'none', [
    heal(5, 'allFriends'),
    barrier(5, 'allFriends'),
    draw(1),
  ]),
  m('common', 'blessed-onslaught', 'Blessed Onslaught', 'attack', 1, 'foe', [
    dmg(5),
    scaled(heal(0), per('attacksPlayed', 1)),
  ]),
  m(
    'rare',
    'martyrs-grace',
    "Martyr's Grace",
    'skill',
    1,
    'none',
    [lose(5), barrier(15), status('shielded', 2)],
    { exhaust: true },
  ),
  m('rare', 'radiance-eternal', 'Radiance Eternal', 'power', 3, 'none', [
    on('turnStart', [heal(1)]),
    on('turnEnd', [status('shielded', 1)]),
  ]),
];
