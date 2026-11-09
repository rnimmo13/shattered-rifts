// Training dummies for the Sandbox and the test tools (DECISIONS #704): a big, fixed target to measure how much a deck deals turn
// by turn, and one that hits back a little so defence can be tried. They are never part of a Campaign map or the Arena.
import type { UnitDef } from '@sr/combat';
import { cycle, dmg, foe, move } from './build';

export const TRAINING_UNITS: UnitDef[] = [
  // stands still: every point of damage a deck deals shows on its HP bar
  foe('training-dummy', 'Training Dummy', 1000, [move('stand', 'Stands still')], cycle('stand')),
  // three small hits a turn (a Tier I regular's pressure, split so Sapped and Barrier both show)
  foe(
    'sparring-dummy',
    'Sparring Dummy',
    1000,
    [move('jab', 'Three Jabs', dmg(6, 'target', 3))],
    cycle('jab'),
  ),
];

/** Their ids, for screens that list the world's enemies (the Models page) and leave the dummies out. */
export const TRAINING_UNIT_IDS: ReadonlySet<string> = new Set(TRAINING_UNITS.map((u) => u.id));
