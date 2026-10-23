// Ser Maren Ashcourt (Aurelion). No companions. Three lanes:
//   Bulwark     - Barrier that scales, and hits for the Barrier you hold
//   Thorns      - retaliation: Thorns, punishing Snares, payoffs for the Thorns you carry
//   Sanctified  - healing, Shielded and Radiant Powers
// Glue cards (marked) serve two lanes. Numbers assume 3 Mana and a 5-card hand.

import type { CardDef } from '@sr/combat';
import {
  PREVENT,
  barrier,
  dmg,
  draw,
  heal,
  on,
  per,
  pool,
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
  m('common', 'bulwark-blow', 'Bulwark Blow', 'attack', 1, 'foe', [
    scaled(dmg(2), per('barrier')),
  ]),
  m('uncommon', 'anvil-strike', 'Anvil Strike', 'attack', 2, 'foe', [
    scaled(dmg(8), per('barrier', 0.5)),
  ]),
  m('uncommon', 'gilded-wall', 'Gilded Wall', 'skill', 2, 'none', [
    scaled(barrier(0), per('barrier')),
  ]),
  m('uncommon', 'plate-discipline', 'Plate Discipline', 'power', 1, 'none', [
    on('turnEnd', [barrier(4)]),
  ]),
  m('rare', 'impregnable', 'Impregnable', 'skill', 2, 'none', [scaled(barrier(0), per('barrier', 2))], {
    exhaust: true,
  }),

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

  // --- Sanctified ---
  m('common', 'lightbearer', 'Lightbearer', 'skill', 1, 'none', [heal(4), barrier(5)]),
  m('common', 'prayer', 'Prayer', 'skill', 0, 'none', [heal(4), draw(1)], { exhaust: true }),
  m('uncommon', 'aegis-of-the-warden', 'Aegis of the Warden', 'skill', 1, 'none', [
    barrier(8),
    status('shielded', 1),
  ]),
  m('uncommon', 'benediction', 'Benediction', 'skill', 2, 'none', [heal(10), barrier(6)], {
    exhaust: true,
  }),
  m('uncommon', 'ward-of-ages', 'Ward of Ages', 'skill', 1, 'none', [status('shielded', 1), draw(1)]),
  m('uncommon', 'sacred-vow', 'Sacred Vow', 'power', 2, 'none', [on('turnEnd', [heal(3)])]),
  m('rare', 'hallowed-ground', 'Hallowed Ground', 'power', 2, 'none', [status('shielded', 2)]),
  m('rare', 'halo', 'Halo', 'power', 3, 'none', [on('turnStart', [status('shielded', 1)])]),
  m('rare', 'absolution', 'Absolution', 'skill', 3, 'none', [
    heal(12),
    barrier(12),
    status('shielded', 1),
  ], { exhaust: true }),

  // --- glue and plain strikes ---
  m('common', 'bell-toll', 'Bell Toll', 'attack', 1, 'none', [dmg(5, 'allFoes'), barrier(3)]),
  m('common', 'dawnlance', 'Dawnlance', 'attack', 2, 'foe', [dmg(12), barrier(6)]),
  m('common', 'zealous-charge', 'Zealous Charge', 'attack', 1, 'foe', [dmg(4, 'target', 3)]),
  m('common', 'gilded-blow', 'Gilded Blow', 'attack', 1, 'foe', [dmg(8), barrier(2)]),
  m('common', 'spiked-aegis', 'Spiked Aegis', 'skill', 1, 'none', [barrier(6), status('thorns', 1)]), // Bulwark + Thorns
  m('uncommon', 'radiant-bulwark', 'Radiant Bulwark', 'skill', 2, 'none', [barrier(12), heal(4)]), // Bulwark + Sanctified
  m('uncommon', 'vengeful-light', 'Vengeful Light', 'attack', 2, 'foe', [
    dmg(9),
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
  m('rare', 'dawns-verdict', "Dawn's Verdict", 'attack', 3, 'foe', [dmg(24), status('exposed', 2, 'target')]),
  m('common', 'shell-cracker', 'Shell Cracker', 'attack', 1, 'foe', [
    dmg(4),
    status('brittle', 2, 'target'),
  ]),
  m('uncommon', 'plated-resolve', 'Plated Resolve', 'skill', 1, 'none', [status('armored', 3)]),
  m('uncommon', 'sure-footing', 'Sure Footing', 'power', 1, 'none', [status('bracing', 2)]),
  m('rare', 'unbroken-wall', 'Unbroken Wall', 'power', 2, 'none', [status('fortified', 1)]),
];
