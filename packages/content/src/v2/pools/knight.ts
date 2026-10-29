// Valeria, the knight (Aurelion). No companions. Rebuilt 2026-10-29 (docs/BASE_CLASS_REWORKS.md §4, DECISIONS #415): a disciplined
// armoured knight who meets attacks, makes openings and punishes contact. Her Ironclad copy (DECISIONS #364-367) is archived in
// reviews/balance-baselines/2026-10-29-pre-identity-reworks/.
//
// Guard (her trait, `HeroTrait.openings`): an enemy attack hit her Barrier stops completely leaves the attacker Open (one Opening an
// enemy, until the end of her next turn). A Riposte (`counter` damage or the `riposte` op) spends the target's Opening for a bonus;
// ordinary attacks never spend it. Some cards leave an enemy Open themselves (`leaveOpen`); only a Guard block "earns" one (the
// 'opening' trigger). Thorns are the temporary retaliation they always were (`statusTheirs`), with their own payoffs.
//
// Three strategies, plus glue (build paths stay hidden, DECISIONS #365):
//   Guard   - precise defence: Barrier that answers attacks, and pays for every Opening earned
//   Riposte - heavy counters that spend Openings, and ways to open enemies that will not attack
//   Thorns  - retaliation: Thorns cards and the payoffs that read them
// Costs and points are in docs/reworks/KNIGHT.md (priced with docs/14_CARD_COSTING.md, Openings at the §15 rates).

import type { CardDef, Op } from '@sr/combat';
import {
  barrier,
  counter,
  dmg,
  draw,
  drawNext,
  leaveOpen,
  manaNext,
  on,
  per,
  pool,
  riposte,
  scaled,
  scry,
  status,
  statusTheirs,
  upgradeOp,
  when,
} from '../build';

const m = pool('knight', 'aurelion');
/** Thorns until the enemy turn is over (Ember Ward's) */
const thornsTurn = (n: number) => statusTheirs('thorns', n, 'self');
/** the target is Open (it does not spend the Opening) */
const ifOpen = (...ops: Op[]): Op => when('opening', { atLeast: 1, of: 'target' }, ops);
/** an enemy is Open */
const anyOpen = (...ops: Op[]): Op => when('foesOpen', { atLeast: 1 }, ops);
/** Shed the Spines: shed up to n temporary Thorns, then one hit of base + per a Thorns shed (a played card's target is alive, so
 * nothing is shed into a dead enemy) */
const shed = (base: number, n: number, each: number): Op[] => [
  { op: 'shedTemp', status: 'thorns', amount: n },
  scaled(dmg(base), per('thornsSpent', each)),
];
/** Spine Volley: the same against every enemy (no target to check) */
const shedAll = (base: number, n: number, each: number): Op[] => [
  { op: 'shedTemp', status: 'thorns', amount: n },
  scaled(dmg(base, 'allFoes'), per('thornsSpent', each)),
];
const strip: Op = { op: 'strip', to: 'target' };

export const KNIGHT: CardDef[] = [
  // --- basics ---
  // (her signature: a strike that is good on its own and better as a counter)
  m(
    'basic',
    'sundering-blow',
    'Sundering Blow',
    'attack',
    2,
    'foe',
    [counter(9, 6), status('exposed', 1, 'target')],
    { up: { effects: [counter(13, 6), status('exposed', 1, 'target')] } },
  ),
  // (DECISIONS #427: a 1-Mana counter in the starter, so an Opening finds a Riposte more often than Sundering Blow alone)
  m('basic', 'counter-cut', 'Counter Cut', 'attack', 1, 'foe', [counter(6, 4)], {
    up: { effects: [counter(9, 4)] },
  }),
  m('basic', 'briarplate', 'Briarplate', 'skill', 1, 'none', [barrier(5), thornsTurn(2)], {
    up: { effects: [barrier(8), thornsTurn(2)] },
  }),

  // --- glue (kept from before the rework: general defence, draw and Exposed) ---
  m('common', 'oath-of-iron', 'Oath of Iron', 'skill', 1, 'none', [barrier(8), draw(1)], {
    up: { effects: [barrier(11), draw(1)] },
  }),
  m('common', 'dawn-smite', 'Dawn Smite', 'attack', 1, 'foe', [dmg(5), barrier(5)], {
    up: { effects: [dmg(8), barrier(5)] },
  }),
  m('common', 'hilt-strike', 'Hilt Strike', 'attack', 1, 'foe', [dmg(9), draw(1)], {
    up: { effects: [dmg(12), draw(1)] },
  }),
  m('common', 'field-repairs', 'Field Repairs', 'skill', 1, 'none', [
    barrier(5),
    upgradeOp('random'),
  ]),
  m(
    'common',
    'clarion-clap',
    'Clarion Clap',
    'attack',
    1,
    'none',
    [dmg(4, 'allFoes'), status('exposed', 1, 'allFoes')],
    { up: { effects: [dmg(7, 'allFoes'), status('exposed', 1, 'allFoes')] } },
  ),
  m('common', 'squires-drill', "Squire's Drill", 'skill', 1, 'none', [draw(2), barrier(2)], {
    up: { effects: [draw(2), barrier(5)] },
  }),
  m('common', 'rebuke', 'Rebuke', 'attack', 1, 'foe', [dmg(7), status('faltering', 1, 'target')], {
    up: { effects: [dmg(10), status('faltering', 1, 'target')] },
  }),
  m(
    'uncommon',
    'provoke',
    'Provoke',
    'skill',
    1,
    'foe',
    [barrier(7), status('exposed', 1, 'target')],
    {
      up: { effects: [barrier(10), status('exposed', 1, 'target')] },
    },
  ),
  m(
    'uncommon',
    'clang-of-steel',
    'Clang of Steel',
    'skill',
    1,
    'none',
    [barrier(5), status('exposed', 1, 'allFoes')],
    { up: { effects: [barrier(8), status('exposed', 1, 'allFoes')] } },
  ),
  m(
    'uncommon',
    'sweeping-guard',
    'Sweeping Guard',
    'attack',
    2,
    'none',
    [dmg(9, 'allFoes'), barrier(6)],
    { up: { effects: [dmg(11, 'allFoes'), barrier(8)] } },
  ),
  m(
    'uncommon',
    'rallying-cry',
    'Rallying Cry',
    'skill',
    1,
    'none',
    // (the Mana is next turn's: a card that paid itself back now could be played again and again while an enemy is Open)
    [draw(2), barrier(2), when('foesOpen', { atLeast: 1 }, [manaNext(1)])],
    { up: { effects: [draw(3), barrier(2), when('foesOpen', { atLeast: 1 }, [manaNext(1)])] } },
  ),

  // --- Guard: precise defence ---
  m(
    'common',
    'measured-guard',
    'Measured Guard',
    'skill',
    1,
    'none',
    [barrier(6), on('opening', [draw(1)], { times: 1 })],
    { up: { effects: [barrier(9), on('opening', [draw(1)], { times: 1 })] } },
  ),
  m('common', 'shield-wall', 'Shield Wall', 'skill', 2, 'none', [barrier(14), drawNext(1)], {
    up: { effects: [barrier(18), drawNext(1)] },
  }),
  m(
    'common',
    'guarded-advance',
    'Guarded Advance',
    'attack',
    1,
    'foe',
    [counter(5, 3), barrier(4)],
    {
      up: { effects: [counter(8, 3), barrier(4)] },
    },
  ),
  m(
    'uncommon',
    'stoneskin',
    'Stoneskin',
    'power',
    1,
    'none',
    [on('turnEnd', [barrier(2)]), on('opening', [barrier(2)])],
    { up: { effects: [on('turnEnd', [barrier(3)]), on('opening', [barrier(2)])] } },
  ),
  m(
    'uncommon',
    'giants-stance',
    "Giant's Stance",
    'skill',
    1,
    'foe',
    [barrier(6), status('faltering', 1, 'target'), ifOpen(status('faltering', 1, 'target'))],
    {
      up: {
        effects: [
          barrier(9),
          status('faltering', 1, 'target'),
          ifOpen(status('faltering', 1, 'target')),
        ],
      },
    },
  ),
  m(
    'uncommon',
    'watchful-eye',
    'Watchful Eye',
    'skill',
    1,
    'none',
    [barrier(6), when('foesOpen', { atLeast: 1 }, [draw(2)])],
    { up: { effects: [barrier(9), when('foesOpen', { atLeast: 1 }, [draw(2)])] } },
  ),
  m(
    'uncommon',
    'sentinels-patience',
    "Sentinel's Patience",
    'skill',
    1,
    'none',
    [scaled(barrier(5), per('foes', 2))],
    { retain: true, up: { effects: [scaled(barrier(8), per('foes', 2))] } },
  ),
  m(
    'uncommon',
    'patient-guard',
    'Patient Guard',
    'skill',
    1,
    'none',
    [barrier(5), status('guarded', 5)],
    {
      retain: true,
      up: { effects: [barrier(7), status('guarded', 6)] },
    },
  ),
  m('rare', 'immovable-oath', 'Immovable Oath', 'skill', 2, 'none', [barrier(26)], {
    exhaust: true,
    up: { effects: [barrier(34)] },
  }),
  m(
    'rare',
    'bastion-engine',
    'Bastion Engine',
    'power',
    1,
    'none',
    [on('opening', [dmg(8, 'target')])],
    { up: { effects: [on('opening', [dmg(10, 'target')])] } },
  ),
  // (an Opening earned by Guard, once a turn, pays next turn: one a card gives does not, so Warlord's Oath cannot feed it)
  m(
    'uncommon',
    'iron-cadence',
    'Iron Cadence',
    'power',
    1,
    'none',
    [on('opening', [manaNext(1), barrier(2)], { once: true })],
    { up: { innate: true } },
  ),
  m(
    'rare',
    'aegis-eternal',
    'Aegis Eternal',
    'skill',
    3,
    'none',
    [barrier(22), status('blur', 1)],
    {
      up: { effects: [barrier(29), status('blur', 1)] },
    },
  ),

  // --- Riposte: heavy counters, and ways to open an enemy ---
  m('common', 'return-the-blow', 'Return the Blow', 'attack', 1, 'foe', [counter(7, 5)], {
    up: { effects: [counter(10, 5)] },
  }),
  m('common', 'draw-them-in', 'Draw Them In', 'skill', 1, 'foe', [barrier(4), leaveOpen()], {
    up: { effects: [barrier(7), leaveOpen()] },
  }),
  m(
    'common',
    'steady-blade',
    'Steady Blade',
    'attack',
    1,
    'foe',
    [dmg(8), when('opening', { atLeast: 1, of: 'target' }, [draw(1)])],
    { up: { effects: [dmg(11), when('opening', { atLeast: 1, of: 'target' }, [draw(1)])] } },
  ),
  m('common', 'counterstroke', 'Counterstroke', 'attack', 2, 'foe', [counter(14, 7)], {
    up: { effects: [counter(19, 7)] },
  }),
  m('common', 'shoulder-check', 'Shoulder Check', 'attack', 0, 'foe', [dmg(4), riposte(draw(1))], {
    up: { effects: [dmg(6), riposte(draw(1))] },
  }),
  m('uncommon', 'bulwark-blow', 'Bulwark Blow', 'attack', 1, 'foe', [counter(4, 12)], {
    up: { effects: [counter(7, 12)] },
  }),
  m(
    'uncommon',
    'iron-rejoinder',
    'Iron Rejoinder',
    'attack',
    2,
    'foe',
    [riposte(barrier(7)), dmg(15)],
    {
      up: { effects: [riposte(barrier(7)), dmg(20)] },
    },
  ),
  m(
    'uncommon',
    'break-guard',
    'Break Guard',
    'attack',
    1,
    'foe',
    [dmg(8), riposte(status('exposed', 2, 'target'))],
    {
      up: { effects: [dmg(11), riposte(status('exposed', 2, 'target'))] },
    },
  ),
  m('uncommon', 'breaking-point', 'Breaking Point', 'attack', 3, 'foe', [counter(22, 12)], {
    up: { effects: [counter(30, 12)] },
  }),
  m(
    'uncommon',
    'challenge',
    'Challenge',
    'skill',
    1,
    'foe',
    [leaveOpen(), statusTheirs('sapped', 3, 'target'), barrier(4)],
    { up: { effects: [leaveOpen(), statusTheirs('sapped', 3, 'target'), barrier(7)] } },
  ),
  m(
    'uncommon',
    'deflecting-blow',
    'Deflecting Blow',
    'attack',
    1,
    'foe',
    [riposte(barrier(7)), dmg(7)],
    { up: { effects: [riposte(barrier(7)), dmg(10)] } },
  ),
  m(
    'uncommon',
    'exploit-the-gap',
    'Exploit the Gap',
    'power',
    1,
    'none',
    [on('riposte', [draw(1), barrier(3)])],
    { up: { effects: [on('riposte', [draw(1), barrier(5)])] } },
  ),
  m('rare', 'perfect-counter', 'Perfect Counter', 'attack', 1, 'foe', [counter(6, 14)], {
    up: { effects: [counter(8, 18)] },
  }),
  m('rare', 'masterstroke', 'Masterstroke', 'attack', 3, 'foe', [dmg(20), riposte(dmg(20))], {
    up: { effects: [dmg(26), riposte(dmg(26))] },
  }),
  m(
    'rare',
    'last-bastion',
    'Last Bastion',
    'skill',
    2,
    'none',
    [barrier(15), leaveOpen('allFoes')],
    {
      up: { effects: [barrier(20), leaveOpen('allFoes')] },
    },
  ),
  m(
    'rare',
    'warlords-oath',
    "Warlord's Oath",
    'power',
    2,
    'none',
    [on('turnStart', [leaveOpen('front'), barrier(5)])],
    { up: { innate: true } },
  ),
  m('rare', 'duelists-focus', "Duelist's Focus", 'skill', 0, 'foe', [leaveOpen(), draw(1)], {
    exhaust: true,
    retain: true,
    up: { effects: [leaveOpen(), draw(2)] },
  }),

  // --- Thorns: retaliation ---
  m(
    'common',
    'spiked-pauldron',
    'Spiked Pauldron',
    'skill',
    1,
    'none',
    [barrier(4), thornsTurn(3)],
    {
      up: { effects: [barrier(4), thornsTurn(5)] },
    },
  ),
  m(
    'common',
    'bramble-guard',
    'Bramble Guard',
    'skill',
    1,
    'none',
    [barrier(7), when('thorns', { atLeast: 1 }, [barrier(3)])],
    { up: { effects: [barrier(9), when('thorns', { atLeast: 1 }, [barrier(3)])] } },
  ),
  m('common', 'briar-lash', 'Briar Lash', 'attack', 1, 'foe', [scaled(dmg(5), per('thorns', 2))], {
    up: { effects: [scaled(dmg(8), per('thorns', 2))] },
  }),
  m('common', 'thorned-gauntlet', 'Thorned Gauntlet', 'attack', 1, 'foe', [dmg(6), thornsTurn(2)], {
    up: { effects: [dmg(9), thornsTurn(2)] },
  }),
  m('uncommon', 'ember-ward', 'Ember Ward', 'skill', 2, 'none', [barrier(12), thornsTurn(4)]),
  m(
    'uncommon',
    'thornburst',
    'Thornburst',
    'attack',
    1,
    'none',
    [scaled(dmg(3, 'allFoes'), per('thorns', 2))],
    {
      up: { effects: [scaled(dmg(6, 'allFoes'), per('thorns', 2))] },
    },
  ),
  // (DECISIONS #423: Barrier over two enemy turns and Thorns for this one, Hold; Ember Ward stays the plain big source)
  m(
    'uncommon',
    'barbed-vigil',
    'Barbed Vigil',
    'skill',
    2,
    'none',
    [barrier(7), status('guarded', 6), thornsTurn(4)],
    { retain: true, up: { effects: [barrier(9), status('guarded', 8), thornsTurn(4)] } },
  ),
  m(
    'uncommon',
    'barbed-retort',
    'Barbed Retort',
    'attack',
    1,
    'foe',
    [dmg(8), riposte(thornsTurn(3))],
    {
      up: { effects: [dmg(11), riposte(thornsTurn(3))] },
    },
  ),
  m(
    'uncommon',
    'thornwake',
    'Thornwake',
    'power',
    1,
    'none',
    [on('thorns', [leaveOpen('attacker'), barrier(2)], { once: true })],
    { up: { effects: [on('thorns', [leaveOpen('attacker'), barrier(4)], { once: true })] } },
  ),
  m('rare', 'wall-of-briars', 'Wall of Briars', 'skill', 2, 'none', [barrier(12), thornsTurn(8)], {
    up: { effects: [barrier(15), thornsTurn(10)] },
  }),
  m(
    'rare',
    'vengeful-strike',
    'Vengeful Strike',
    'attack',
    2,
    'foe',
    [scaled(dmg(18), per('thorns', 2))],
    {
      up: { effects: [scaled(dmg(23), per('thorns', 2))] },
    },
  ),
  m(
    'rare',
    'crown-of-thorns',
    'Crown of Thorns',
    'power',
    1,
    'none',
    [on('turnEnd', [thornsTurn(3)])],
    { up: { effects: [on('turnEnd', [thornsTurn(4)])] } },
  ),
  // (active Thorns: the ones she put up this turn, spent as damage instead of kept for the enemy turn)
  m('uncommon', 'shed-the-spines', 'Shed the Spines', 'attack', 1, 'foe', shed(6, 4, 3), {
    up: { effects: shed(9, 4, 3) },
  }),

  // --- Riposte: the Duelist (DECISIONS #423): attacks that keep an Opening, and pay for keeping it ---
  m('common', 'testing-cut', 'Testing Cut', 'attack', 1, 'foe', [dmg(7), ifOpen(barrier(4))], {
    up: { effects: [dmg(10), ifOpen(barrier(4))] },
  }),
  m(
    'common',
    'measured-footwork',
    'Measured Footwork',
    'skill',
    1,
    'none',
    [barrier(5), draw(1), anyOpen(barrier(2))],
    { up: { effects: [barrier(8), draw(1), anyOpen(barrier(2))] } },
  ),
  m(
    'common',
    'keep-your-distance',
    'Keep Your Distance',
    'attack',
    1,
    'foe',
    [dmg(8), ifOpen(statusTheirs('sapped', 2, 'target'))],
    { up: { effects: [dmg(11), ifOpen(statusTheirs('sapped', 2, 'target'))] } },
  ),
  m(
    'uncommon',
    'patient-edge',
    'Patient Edge',
    'attack',
    1,
    'foe',
    [scaled(dmg(8), per('opening', 4, 'target'))],
    { retain: true, up: { effects: [scaled(dmg(11), per('opening', 4, 'target'))] } },
  ),
  m(
    'uncommon',
    'read-the-duel',
    'Read the Duel',
    'skill',
    1,
    'none',
    [barrier(5), scry(2), anyOpen(draw(1))],
    { up: { effects: [barrier(8), scry(2), anyOpen(draw(1))] } },
  ),
  // (the Riposte reward comes after the hit: a kill leaves nothing to spend)
  m(
    'uncommon',
    'closing-argument',
    'Closing Argument',
    'attack',
    2,
    'foe',
    [dmg(16), riposte(draw(2))],
    { up: { effects: [dmg(21), riposte(draw(2))] } },
  ),
  // (every enemy: each Open one spends its own Opening for its own bonus, and answers Exploit the Gap once)
  m(
    'uncommon',
    'answer-them-all',
    'Answer Them All',
    'attack',
    2,
    'none',
    [counter(10, 8, 'allFoes')],
    { up: { effects: [counter(13, 8, 'allFoes')] } },
  ),
  m(
    'common',
    'probing-thrust',
    'Probing Thrust',
    'attack',
    0,
    'foe',
    [dmg(5), ifOpen(status('exposed', 1, 'target'))],
    {
      up: { effects: [dmg(7), ifOpen(status('exposed', 1, 'target'))] },
    },
  ),
  m(
    'common',
    'keen-eye',
    'Keen Eye',
    'skill',
    1,
    'foe',
    [barrier(5), ifOpen(status('exposed', 2, 'target'))],
    { up: { effects: [barrier(8), ifOpen(status('exposed', 2, 'target'))] } },
  ),
  // (spend the Opening for its triggers and the Barrier, and leave the enemy Open again: not an earned one)
  m(
    'uncommon',
    'second-intention',
    'Second Intention',
    'attack',
    1,
    'foe',
    [dmg(8), riposte(leaveOpen(), barrier(3))],
    { up: { effects: [dmg(11), riposte(leaveOpen(), barrier(3))] } },
  ),
  // (a Riposte spends the Opening before its hit, so only an attack that keeps it answers this)
  m(
    'uncommon',
    'measured-tempo',
    'Measured Tempo',
    'power',
    1,
    'none',
    [on('hitFoe', [ifOpen(barrier(2))])],
    { up: { innate: true } },
  ),
  // (Mana made for less than it costs: Consume, guide §6)
  m(
    'rare',
    'seize-the-moment',
    'Seize the Moment',
    'skill',
    0,
    'none',
    [anyOpen({ op: 'mana', amount: 2 }), draw(1)],
    { exhaust: true, up: { effects: [anyOpen({ op: 'mana', amount: 2 }), draw(2)] } },
  ),
  // (her turn-end triggers run before her Openings wear off, so one she kept still counts)
  m(
    'rare',
    'knights-composure',
    "Knight's Composure",
    'power',
    1,
    'none',
    [on('turnEnd', [anyOpen(barrier(6))])],
    { up: { effects: [on('turnEnd', [anyOpen(barrier(8))])] } },
  ),

  // --- Guard: the formation fighter (DECISIONS #423): many enemies, and which of them are Open ---
  m(
    'common',
    'ring-of-steel',
    'Ring of Steel',
    'skill',
    1,
    'none',
    [scaled(barrier(5), per('foesOpen', 3))],
    { up: { effects: [scaled(barrier(8), per('foesOpen', 3))] } },
  ),
  m(
    'common',
    'sweep-the-line',
    'Sweep the Line',
    'attack',
    1,
    'none',
    [dmg(6, 'allFoes'), anyOpen(barrier(3))],
    { up: { effects: [dmg(8, 'allFoes'), anyOpen(barrier(3))] } },
  ),
  m(
    'uncommon',
    'pick-them-apart',
    'Pick Them Apart',
    'attack',
    1,
    'foe',
    [scaled(dmg(7), per('foesOpen', 3))],
    { retain: true, up: { effects: [scaled(dmg(10), per('foesOpen', 3))] } },
  ),
  // (the splash comes first, so a killing blow still splashes)
  m(
    'uncommon',
    'cleaving-riposte',
    'Cleaving Riposte',
    'attack',
    2,
    'foe',
    [riposte(dmg(8, 'allFoes')), dmg(14)],
    { up: { effects: [riposte(dmg(8, 'allFoes')), dmg(18)] } },
  ),
  m(
    'uncommon',
    'marshals-eye',
    "Marshal's Eye",
    'power',
    1,
    'none',
    [on('riposte', [leaveOpen('front'), barrier(2)], { once: true })],
    { up: { effects: [on('riposte', [leaveOpen('front'), barrier(4)], { once: true })] } },
  ),

  // --- Guard: the patient defender (DECISIONS #423): defence now, Mana and cards for the next turn ---
  m('common', 'steady-breath', 'Steady Breath', 'skill', 1, 'none', [barrier(5), manaNext(1)], {
    up: { effects: [barrier(8), manaNext(1)] },
  }),
  m(
    'uncommon',
    'night-watch',
    'Night Watch',
    'skill',
    1,
    'none',
    [status('guarded', 5), drawNext(2)],
    { retain: true, up: { effects: [status('guarded', 8), drawNext(2)] } },
  ),
  m(
    'uncommon',
    'steel-before-dawn',
    'Steel Before Dawn',
    'skill',
    2,
    'none',
    [barrier(10), manaNext(1), drawNext(1)],
    { up: { effects: [barrier(14), manaNext(1), drawNext(1)] } },
  ),
  m(
    'rare',
    'bulwark-of-dawn',
    'Bulwark of Dawn',
    'skill',
    2,
    'none',
    [status('guarded', 12), manaNext(2)],
    { retain: true, up: { effects: [status('guarded', 16), manaNext(2)] } },
  ),
  // (it pays in Mana and cards, never in more Barrier: a defence that turns into the next attack)
  m(
    'rare',
    'prepared-ground',
    'Prepared Ground',
    'power',
    1,
    'none',
    [on('turnEnd', [when('barrier', { atLeast: 8 }, [manaNext(1), drawNext(1)])])],
    { up: { innate: true } },
  ),

  // --- Thorns: offensive Thorns (DECISIONS #423): keep them for the enemy turn, or spend them now ---
  m('common', 'bristle', 'Bristle', 'skill', 0, 'none', [thornsTurn(4)], {
    up: { effects: [thornsTurn(5)] },
  }),
  m(
    'uncommon',
    'splinter-guard',
    'Splinter Guard',
    'skill',
    1,
    'none',
    [barrier(5), scaled(thornsTurn(2), per('foes'))],
    { up: { effects: [barrier(8), scaled(thornsTurn(2), per('foes'))] } },
  ),
  m('uncommon', 'spine-volley', 'Spine Volley', 'attack', 1, 'none', shedAll(4, 3, 3), {
    up: { effects: shedAll(7, 3, 3) },
  }),
  m(
    'uncommon',
    'thorned-momentum',
    'Thorned Momentum',
    'power',
    1,
    'none',
    [on('play', [thornsTurn(1)], { filter: 'attack' })],
    { up: { innate: true } },
  ),
  m('rare', 'thornstorm-rush', 'Thornstorm Rush', 'attack', 2, 'foe', shed(12, 6, 4), {
    up: { effects: shed(16, 6, 4) },
  }),

  // --- Riposte: the siege fighter (DECISIONS #423): open enemies that will not attack, and break their defence ---
  m('common', 'feinting-cut', 'Feinting Cut', 'attack', 1, 'foe', [dmg(6), leaveOpen()], {
    up: { effects: [dmg(9), leaveOpen()] },
  }),
  m(
    'common',
    'batter-down',
    'Batter Down',
    'attack',
    1,
    'foe',
    [dmg(8), status('brittle', 2, 'target')],
    { up: { effects: [dmg(11), status('brittle', 2, 'target')] } },
  ),
  m('uncommon', 'sunder-armour', 'Sunder Armour', 'attack', 1, 'foe', [strip, dmg(8)], {
    up: { effects: [strip, dmg(11)] },
  }),
  m(
    'uncommon',
    'breach-the-wall',
    'Breach the Wall',
    'skill',
    1,
    'foe',
    [strip, leaveOpen(), draw(1)],
    { up: { effects: [strip, leaveOpen(), draw(2)] } },
  ),
  m(
    'uncommon',
    'siege-doctrine',
    'Siege Doctrine',
    'power',
    1,
    'none',
    [on('debuffFoe', [leaveOpen('target')], { once: true })],
    { up: { innate: true } },
  ),
  m(
    'rare',
    'siege-line',
    'Siege Line',
    'attack',
    2,
    'foe',
    [dmg(12), leaveOpen(), status('exposed', 2, 'target')],
    { up: { effects: [dmg(16), leaveOpen(), status('exposed', 2, 'target')] } },
  ),
];
