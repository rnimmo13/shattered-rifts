// Sylas (id assassin, Umbral). No companions. Rebuilt 2026-10-29 (docs/BASE_CLASS_REWORKS.md §6, DECISIONS #416): he sets up a
// precise kill, plants knives in his enemies, and chooses when to pull them. His Silent copy (DECISIONS #368) is archived in
// reviews/balance-baselines/2026-10-29-pre-identity-reworks/.
//
// Two resources, connected but not the same:
//   Preparation (`prep`, at most 3, kept between turns): setup cards and his trait earn it; finishers spend it (`spendPrep`, read
//     with per('prepSpent')). An ordinary attack never clears it, and nothing makes it on its own every turn.
//   Knives (`knives` on an enemy, at most 3 each): a knife card embeds one after its attack lands on a surviving enemy (`embed`); a
//     card pulls them for a one-time payoff (`pull`, read with per('extracted') or per knife). A pulled knife is gone; the dead keep
//     theirs (nothing is looted from them); a knife does nothing while it sits there.
//
// Three strategies, plus glue (build paths stay hidden, DECISIONS #365):
//   Execution - build Preparation, then a finisher spends it on one target
//   Knives    - spread knives over the enemies, then pull them where it counts
//   Shadow    - defence and cycling on the move, with small pulls for Barrier and cards
// Costs and points: docs/reworks/ASSASSIN.md and assassin-ledger.md (docs/14_CARD_COSTING.md §15).

import type { CardDef, Op } from '@sr/combat';
import {
  barrier,
  discard,
  dmg,
  draw,
  drawNext,
  embed,
  extraReward,
  manaNext,
  on,
  onKill,
  per,
  pool,
  prepare,
  pull,
  scaled,
  scry,
  spendPrep,
  status,
  statusTheirs,
  topdeck,
  when,
} from '../build';

const q = pool('assassin', 'umbral');
// (the pool expansion, DECISIONS #424)
/** if the target has a knife in it (it is read, not pulled) */
const ifKnifed = (...ops: Op[]): Op => when('knives', { atLeast: 1, of: 'target' }, ops);
/** Exacting Pull: a knife pulled for each Preparation spent (up to 2), each paying `each` to the target */
const pullPerPrep = (each: number): Op[] => [
  spendPrep(2),
  when('prepSpent', { atLeast: 1 }, [pull(1, [dmg(each, 'target')])]),
  when('prepSpent', { atLeast: 2 }, [pull(1, [dmg(each, 'target')])]),
];

export const ASSASSIN: CardDef[] = [
  // --- basics ---
  q('basic', 'quiet-incision', 'Quiet Incision', 'attack', 1, 'foe', [dmg(6), embed()], {
    tags: ['knife'],
    up: { effects: [dmg(9), embed()] },
  }),
  q(
    'basic',
    'draw-steel',
    'Draw Steel',
    'attack',
    1,
    'foe',
    [pull(2), scaled(dmg(4), per('extracted', 4))],
    {
      up: { effects: [pull(2), scaled(dmg(7), per('extracted', 4))] },
    },
  ),
  q(
    'basic',
    'finishing-thrust',
    'Finishing Thrust',
    'attack',
    2,
    'foe',
    [spendPrep(3), scaled(dmg(8), per('prepSpent', 4))],
    { up: { effects: [spendPrep(3), scaled(dmg(12), per('prepSpent', 4))] } },
  ),
  q('basic', 'patient-footwork', 'Patient Footwork', 'skill', 1, 'none', [barrier(5), prepare(1)], {
    up: { effects: [barrier(7), prepare(1)] },
  }),

  // --- glue: Faltering, attacks, a little Bleed (Bleed itself is unchanged for everyone) ---
  q(
    'common',
    'hobbling-jab',
    'Hobbling Jab',
    'attack',
    0,
    'foe',
    [dmg(3), status('faltering', 1, 'target')],
    {
      up: { effects: [dmg(5), status('faltering', 1, 'target')] },
    },
  ),
  q(
    'common',
    'dirty-hit',
    'Dirty Hit',
    'attack',
    1,
    'foe',
    [dmg(8), status('faltering', 1, 'target')],
    {
      up: { effects: [dmg(10), status('faltering', 2, 'target')] },
    },
  ),
  q('common', 'quick-slash', 'Quick Slash', 'attack', 0, 'foe', [dmg(6)]),
  q(
    'common',
    'barbed-stab',
    'Barbed Stab',
    'attack',
    1,
    'foe',
    [dmg(6), status('seared', 3, 'target')],
    {
      up: { effects: [dmg(8), status('seared', 4, 'target')] },
    },
  ),
  q('common', 'cartwheel-cut', 'Cartwheel Cut', 'attack', 1, 'none', [dmg(7, 'allFoes')], {
    up: { effects: [dmg(9, 'allFoes')] },
  }),

  // --- Execution: build Preparation, then spend it ---
  q(
    'common',
    'read-the-guard',
    'Read the Guard',
    'skill',
    1,
    'none',
    [prepare(1), draw(2), barrier(2)],
    {
      up: { effects: [prepare(1), draw(3), barrier(2)] },
    },
  ),
  q('common', 'stalkers-lunge', "Stalker's Lunge", 'attack', 2, 'foe', [dmg(14), drawNext(2)], {
    up: { effects: [dmg(19), drawNext(2)] },
  }),
  q(
    'uncommon',
    'knife-in-the-back',
    'Knife in the Back',
    'attack',
    1,
    'foe',
    [spendPrep(99), scaled(dmg(5), per('prepSpent', 5))],
    { up: { effects: [spendPrep(99), scaled(dmg(8), per('prepSpent', 5))] } },
  ),
  q(
    'uncommon',
    'severing-finish',
    'Severing Finish',
    'attack',
    2,
    'foe',
    [spendPrep(3), scaled(dmg(14), per('prepSpent', 4))],
    { up: { effects: [spendPrep(3), scaled(dmg(19), per('prepSpent', 4))] } },
  ),
  q(
    'uncommon',
    'throat-cut',
    'Throat Cut',
    'attack',
    1,
    'foe',
    [
      spendPrep(2),
      scaled(dmg(5), per('prepSpent', 4)),
      when('prepSpent', { atLeast: 1 }, [status('faltering', 1, 'target')]),
    ],
    {
      up: {
        effects: [
          spendPrep(2),
          scaled(dmg(8), per('prepSpent', 4)),
          when('prepSpent', { atLeast: 1 }, [status('faltering', 1, 'target')]),
        ],
      },
    },
  ),
  q(
    'uncommon',
    'prepared-ambush',
    'Prepared Ambush',
    'skill',
    1,
    'none',
    [prepare(2), barrier(6)],
    {
      up: { effects: [prepare(2), barrier(9)] },
    },
  ),
  q(
    'uncommon',
    'side-slip',
    'Side Slip',
    'skill',
    0,
    'none',
    [manaNext(1), prepare(1), barrier(1)],
    {
      up: { effects: [manaNext(1), prepare(2), barrier(1)] },
    },
  ),
  q(
    'uncommon',
    'lay-bare',
    'Lay Bare',
    'skill',
    0,
    'foe',
    [{ op: 'strip', to: 'target' }, status('exposed', 1, 'target'), prepare(1)],
    {
      exhaust: true,
      up: { effects: [{ op: 'strip', to: 'target' }, status('exposed', 2, 'target'), prepare(1)] },
    },
  ),
  q(
    'rare',
    'killing-stroke',
    'Killing Stroke',
    'attack',
    1,
    'foe',
    [spendPrep(99), scaled(dmg(8), per('prepSpent', 6))],
    {
      innate: true,
      exhaust: true,
      up: { effects: [spendPrep(99), scaled(dmg(12), per('prepSpent', 6))] },
    },
  ),
  q(
    'rare',
    'final-cut',
    'Final Cut',
    'attack',
    3,
    'foe',
    [
      spendPrep(99),
      pull(99),
      scaled(dmg(16), per('prepSpent', 6)),
      when('extracted', { atLeast: 1 }, [scaled(dmg(0), per('extracted', 6))]),
    ],
    {
      up: {
        effects: [
          spendPrep(99),
          pull(99),
          scaled(dmg(22), per('prepSpent', 6)),
          when('extracted', { atLeast: 1 }, [scaled(dmg(0), per('extracted', 6))]),
        ],
      },
    },
  ),
  q(
    'rare',
    'eyes-in-the-dark',
    'Eyes in the Dark',
    'power',
    1,
    'none',
    [on('spend', [draw(1), barrier(4)], { status: 'prep', once: true })],
    { up: { effects: [on('spend', [draw(1), barrier(6)], { status: 'prep', once: true })] } },
  ),
  q(
    'rare',
    'marked-for-death',
    'Marked for Death',
    'attack',
    1,
    'foe',
    [onKill(dmg(10), [extraReward(1)])],
    {
      exhaust: true,
      up: { effects: [onKill(dmg(15), [extraReward(1)])] },
    },
  ),

  // --- Knives: embed them, then pull them where it counts ---
  q('common', 'knife-juggle', 'Knife Juggle', 'skill', 1, 'foe', [embed(2), barrier(4)], {
    up: { effects: [embed(2), barrier(7)] },
  }),
  q('common', 'feint-strike', 'Feint Strike', 'attack', 1, 'foe', [dmg(5), embed(2)], {
    tags: ['knife'],
    up: { effects: [dmg(8), embed(2)] },
  }),
  q('common', 'shroud-and-shank', 'Shroud and Shank', 'skill', 1, 'foe', [barrier(6), embed()], {
    up: { effects: [barrier(9), embed()] },
  }),
  q(
    'common',
    'blade-flurry',
    'Blade Flurry',
    'attack',
    1,
    'none',
    [dmg(5, 'allFoes'), embed(1, 'allFoes')],
    {
      tags: ['knife'],
      up: { effects: [dmg(7, 'allFoes'), embed(1, 'allFoes')] },
    },
  ),
  q(
    'common',
    'pinning-throw',
    'Pinning Throw',
    'attack',
    1,
    'foe',
    [dmg(5), embed(), status('faltering', 1, 'target')],
    { tags: ['knife'], up: { effects: [dmg(8), embed(), status('faltering', 1, 'target')] } },
  ),
  q(
    'common',
    'twist-the-blade',
    'Twist the Blade',
    'attack',
    1,
    'foe',
    [pull(1), scaled(dmg(6), per('extracted', 6))],
    {
      up: { effects: [pull(1), scaled(dmg(9), per('extracted', 6))] },
    },
  ),
  q(
    'common',
    'flick-knife',
    'Flick Knife',
    'attack',
    1,
    'foe',
    [dmg(7), embed(), draw(1), discard(1)],
    {
      tags: ['knife'],
      up: { effects: [dmg(10), embed(), draw(1), discard(1)] },
    },
  ),
  q(
    'uncommon',
    'whetted-edge',
    'Whetted Edge',
    'power',
    1,
    'none',
    [on('extract', [dmg(2, 'target'), barrier(1)])],
    { up: { effects: [on('extract', [dmg(3, 'target'), barrier(1)])] } },
  ),
  q('uncommon', 'pincushion', 'Pincushion', 'attack', 2, 'foe', [dmg(5, 'target', 3), embed(3)], {
    tags: ['knife'],
    up: { effects: [dmg(7, 'target', 3), embed(3)] },
  }),
  q(
    'uncommon',
    'harvest-the-field',
    'Harvest the Field',
    'attack',
    1,
    'none',
    [pull(99, [dmg(6, 'target')], 'allFoes')],
    {
      up: { effects: [pull(99, [dmg(7, 'target')], 'allFoes')] },
    },
  ),
  q(
    'uncommon',
    'scatter-knives',
    'Scatter Knives',
    'skill',
    1,
    'none',
    [embed(1, 'allFoes'), prepare(1), barrier(5)],
    {
      up: { effects: [embed(1, 'allFoes'), prepare(1), barrier(8)] },
    },
  ),
  q(
    'uncommon',
    'worry-the-wound',
    'Worry the Wound',
    'attack',
    0,
    'foe',
    [scaled(dmg(2), per('knives', 3, 'target'))],
    {
      up: { effects: [scaled(dmg(4), per('knives', 3, 'target'))] },
    },
  ),
  q(
    'rare',
    'executioners-mark',
    "Executioner's Mark",
    'skill',
    1,
    'foe',
    [embed(3), prepare(1), barrier(4)],
    {
      up: { effects: [embed(3), prepare(1), barrier(7)] },
    },
  ),
  q(
    'rare',
    'flurry-of-steel',
    'Flurry of Steel',
    'attack',
    2,
    'foe',
    [dmg(5, 'target', 4), embed()],
    {
      tags: ['knife'],
      up: { effects: [dmg(6, 'target', 4), embed(2)] },
    },
  ),
  q(
    'rare',
    'twist-and-pull',
    'Twist and Pull',
    'skill',
    1,
    'foe',
    [pull(99, [{ op: 'loseHp', amount: 5, to: 'target' }, status('faltering', 1, 'target')])],
    {
      up: {
        effects: [
          pull(99, [{ op: 'loseHp', amount: 7, to: 'target' }, status('faltering', 1, 'target')]),
        ],
      },
    },
  ),
  q(
    'rare',
    'recall-the-blades',
    'Recall the Blades',
    'skill',
    1,
    'none',
    [pull(99, [prepare(1), barrier(4)], 'allFoes')],
    {
      up: { effects: [pull(99, [prepare(1), barrier(5)], 'allFoes')] },
    },
  ),
  q(
    'rare',
    'thread-the-needle',
    'Thread the Needle',
    'attack',
    0,
    'foe',
    [when('knives', { atLeast: 3, of: 'target' }, [pull(99)]), scaled(dmg(4), per('extracted', 5))],
    {
      up: {
        effects: [
          when('knives', { atLeast: 3, of: 'target' }, [pull(99)]),
          scaled(dmg(7), per('extracted', 5)),
        ],
      },
    },
  ),
  q(
    'rare',
    'reap-the-steel',
    'Reap the Steel',
    'attack',
    1,
    'none',
    [dmg(6, 'allFoes'), pull(99, [dmg(4, 'target')], 'allFoes')],
    {
      up: { effects: [dmg(8, 'allFoes'), pull(99, [dmg(4, 'target')], 'allFoes')] },
    },
  ),

  // --- Shadow: defence and cycling on the move ---
  q(
    'common',
    'duck-and-weave',
    'Duck and Weave',
    'skill',
    1,
    'none',
    [barrier(8), discard(1), prepare(1)],
    {
      up: { effects: [barrier(11), discard(1), prepare(1)] },
    },
  ),
  q('common', 'backspring', 'Backspring', 'skill', 1, 'none', [barrier(3), draw(2)], {
    up: { effects: [barrier(6), draw(2)] },
  }),
  q('common', 'turn-aside', 'Turn Aside', 'skill', 0, 'none', [barrier(4)], {
    up: { effects: [barrier(6)] },
  }),
  q('common', 'roll-away', 'Roll Away', 'skill', 1, 'none', [barrier(4), status('guarded', 4)], {
    up: { effects: [barrier(6), status('guarded', 5)] },
  }),
  q(
    'uncommon',
    'leave-no-trace',
    'Leave No Trace',
    'skill',
    1,
    'foe',
    [barrier(5), pull(1, [barrier(6)])],
    {
      up: { effects: [barrier(8), pull(1, [barrier(6)])] },
    },
  ),
  q(
    'uncommon',
    'cut-and-run',
    'Cut and Run',
    'attack',
    1,
    'foe',
    [dmg(8), pull(1, [draw(1), prepare(1)])],
    {
      up: { effects: [dmg(11), pull(1, [draw(1), prepare(1)])] },
    },
  ),
  q(
    'uncommon',
    'disarm',
    'Disarm',
    'skill',
    1,
    'foe',
    [pull(3, [status('faltering', 1, 'target'), barrier(4)])],
    { up: { effects: [pull(3, [status('faltering', 1, 'target'), barrier(5)])] } },
  ),
  q('uncommon', 'darting-strike', 'Darting Strike', 'attack', 2, 'foe', [barrier(10), dmg(10)]),
  q(
    'uncommon',
    'nimble-deal',
    'Nimble Deal',
    'skill',
    1,
    'none',
    [draw(3), discard(1), prepare(1)],
    {
      up: { effects: [draw(4), discard(1), prepare(1)] },
    },
  ),
  q('uncommon', 'smoke-veil', 'Smoke Veil', 'skill', 1, 'none', [barrier(5), status('blur', 1)], {
    up: { effects: [barrier(8), status('blur', 1)] },
  }),
  q(
    'uncommon',
    'practiced-hands',
    'Practiced Hands',
    'skill',
    1,
    'none',
    [{ op: 'draw', amount: 2, hold: true }, prepare(1)],
    {
      up: { effects: [{ op: 'draw', amount: 3, hold: true }, prepare(1)] },
    },
  ),
  q(
    'uncommon',
    'sweep-the-leg',
    'Sweep the Leg',
    'skill',
    2,
    'foe',
    [status('faltering', 2, 'target'), barrier(11)],
    {
      up: { effects: [status('faltering', 3, 'target'), barrier(14)] },
    },
  ),
  q(
    'uncommon',
    'fade-out',
    'Fade Out',
    'skill',
    1,
    'none',
    [barrier(7), draw(1), when('prep', { atMost: 0 }, [prepare(1)])],
    { up: { effects: [barrier(10), draw(1), when('prep', { atMost: 0 }, [prepare(1)])] } },
  ),
  q(
    'rare',
    'hidden-in-plain-sight',
    'Hidden in Plain Sight',
    'power',
    1,
    'none',
    [on('extract', [prepare(1), barrier(4)], { once: true })],
    { up: { effects: [on('extract', [prepare(1), barrier(6)], { once: true })] } },
  ),
  q(
    'rare',
    'vanishing-act',
    'Vanishing Act',
    'skill',
    1,
    'none',
    [barrier(6), status('blur', 1), prepare(2)],
    {
      up: { effects: [barrier(9), status('blur', 1), prepare(2)] },
    },
  ),
  q(
    'rare',
    'bladestorm-ward',
    'Bladestorm Ward',
    'skill',
    2,
    'none',
    [barrier(15), embed(1, 'allFoes')],
    {
      up: { effects: [barrier(19), embed(1, 'allFoes')] },
    },
  ),
  // --- Execution: precision (DECISIONS #424): partial spenders, and reasons to keep Preparation ---
  q(
    'common',
    'measured-cut',
    'Measured Cut',
    'attack',
    1,
    'foe',
    [spendPrep(1), scaled(dmg(7), per('prepSpent', 5))],
    { up: { effects: [spendPrep(1), scaled(dmg(10), per('prepSpent', 5))] } },
  ),
  // (reads Preparation, never spends it)
  q(
    'uncommon',
    'poised-strike',
    'Poised Strike',
    'attack',
    2,
    'foe',
    [scaled(dmg(12), per('prep', 4))],
    {
      up: { effects: [scaled(dmg(16), per('prep', 4))] },
    },
  ),
  q(
    'uncommon',
    'mark-the-vein',
    'Mark the Vein',
    'skill',
    1,
    'foe',
    [
      barrier(6),
      spendPrep(1),
      scaled(status('exposed', 0, 'target'), per('prepSpent')),
      scaled(status('faltering', 0, 'target'), per('prepSpent')),
    ],
    {
      up: {
        effects: [
          barrier(9),
          spendPrep(1),
          scaled(status('exposed', 0, 'target'), per('prepSpent')),
          scaled(status('faltering', 0, 'target'), per('prepSpent')),
        ],
      },
    },
  ),
  q(
    'uncommon',
    'calculated-retreat',
    'Calculated Retreat',
    'skill',
    1,
    'none',
    [barrier(6), spendPrep(1), scaled(barrier(0), per('prepSpent', 6))],
    { up: { effects: [barrier(9), spendPrep(1), scaled(barrier(0), per('prepSpent', 6))] } },
  ),
  q('common', 'steady-hand', 'Steady Hand', 'skill', 0, 'none', [barrier(3), prepare(1)], {
    retain: true,
    up: { effects: [barrier(5), prepare(1)] },
  }),
  q(
    'common',
    'weigh-the-moment',
    'Weigh the Moment',
    'skill',
    1,
    'none',
    [scry(2), prepare(1), barrier(4)],
    {
      up: { effects: [scry(3), prepare(1), barrier(6)] },
    },
  ),
  q(
    'rare',
    'silent-massacre',
    'Silent Massacre',
    'attack',
    2,
    'none',
    [spendPrep(3), scaled(dmg(8, 'allFoes'), per('prepSpent', 5))],
    { up: { effects: [spendPrep(3), scaled(dmg(11, 'allFoes'), per('prepSpent', 5))] } },
  ),
  // (a kill gives 2 back, at most 3 as always: never needed against one boss)
  q(
    'rare',
    'assassinate',
    'Assassinate',
    'attack',
    2,
    'foe',
    [spendPrep(3), onKill(scaled(dmg(12), per('prepSpent', 6)), [prepare(2)])],
    { up: { effects: [spendPrep(3), onKill(scaled(dmg(16), per('prepSpent', 6)), [prepare(2)])] } },
  ),
  q(
    'uncommon',
    'economy-of-motion',
    'Economy of Motion',
    'power',
    1,
    'none',
    [
      on('spend', [when('prep', { atLeast: 1 }, [draw(1), barrier(3)])], {
        status: 'prep',
        once: true,
      }),
    ],
    {
      up: {
        effects: [
          on('spend', [when('prep', { atLeast: 1 }, [draw(1), barrier(5)])], {
            status: 'prep',
            once: true,
          }),
        ],
      },
    },
  ),
  q(
    'uncommon',
    'patient-coil',
    'Patient Coil',
    'power',
    1,
    'none',
    [on('turnEnd', [scaled(barrier(0), per('prep', 2))])],
    { up: { innate: true } },
  ),
  q(
    'rare',
    'the-waiting-blade',
    'The Waiting Blade',
    'power',
    1,
    'none',
    [
      on('turnStart', [
        when('prep', { atLeast: 3 }, [{ op: 'mana', amount: 1 }, draw(1), barrier(3)]),
      ]),
    ],
    { up: { innate: true } },
  ),

  // --- Execution: hybrid (DECISIONS #424): knives read into Preparation, Preparation into pulls (one way) ---
  q(
    'common',
    'read-the-wound',
    'Read the Wound',
    'attack',
    1,
    'foe',
    [dmg(8), ifKnifed(prepare(1))],
    {
      up: { effects: [dmg(11), ifKnifed(prepare(1))] },
    },
  ),
  q('uncommon', 'exacting-pull', 'Exacting Pull', 'attack', 1, 'foe', [dmg(4), ...pullPerPrep(8)], {
    up: { effects: [dmg(7), ...pullPerPrep(8)] },
  }),

  // --- Knives: leave the knife, and fieldwork (DECISIONS #424) ---
  q(
    'common',
    'lodged-steel',
    'Lodged Steel',
    'attack',
    1,
    'foe',
    [dmg(7), ifKnifed(status('faltering', 1, 'target'))],
    { up: { effects: [dmg(10), ifKnifed(status('faltering', 1, 'target'))] } },
  ),
  q(
    'uncommon',
    'pinned',
    'Pinned',
    'skill',
    1,
    'foe',
    [barrier(5), scaled(statusTheirs('sapped', 0, 'target'), per('knives', 2, 'target'))],
    {
      up: {
        effects: [
          barrier(8),
          scaled(statusTheirs('sapped', 0, 'target'), per('knives', 2, 'target')),
        ],
      },
    },
  ),
  q(
    'uncommon',
    'barbed-anchor',
    'Barbed Anchor',
    'skill',
    1,
    'foe',
    [embed(), scaled(status('faltering', 0, 'target'), per('knives', 1, 'target')), barrier(3)],
    {
      up: {
        effects: [
          embed(),
          scaled(status('faltering', 0, 'target'), per('knives', 1, 'target')),
          barrier(6),
        ],
      },
    },
  ),
  // (one hit, and one more for each knife in the target; the knives stay)
  q(
    'rare',
    'thousand-cuts',
    'Thousand Cuts',
    'attack',
    2,
    'foe',
    [scaled(dmg(7, 'target', 1), per('knives', 1, 'target', 'hits'))],
    { up: { effects: [scaled(dmg(9, 'target', 1), per('knives', 1, 'target', 'hits'))] } },
  ),
  q(
    'uncommon',
    'steel-rain',
    'Steel Rain',
    'attack',
    2,
    'none',
    [scaled(dmg(8, 'allFoes'), per('knives', 5, 'each'))],
    { up: { effects: [scaled(dmg(11, 'allFoes'), per('knives', 5, 'each'))] } },
  ),
  q(
    'common',
    'fan-of-blades',
    'Fan of Blades',
    'skill',
    1,
    'none',
    [embed(1, 'randomFoe'), embed(1, 'randomFoe'), draw(1), barrier(3)],
    { up: { effects: [embed(1, 'randomFoe'), embed(1, 'randomFoe'), draw(1), barrier(5)] } },
  ),
  q(
    'common',
    'reaping-arc',
    'Reaping Arc',
    'attack',
    1,
    'none',
    [dmg(5, 'allFoes'), pull(1, [dmg(4, 'target')], 'allFoes')],
    { up: { effects: [dmg(7, 'allFoes'), pull(1, [dmg(4, 'target')], 'allFoes')] } },
  ),
  q(
    'uncommon',
    'lingering-steel',
    'Lingering Steel',
    'power',
    1,
    'none',
    [on('turnStart', [scaled(statusTheirs('sapped', 0, 'allFoes'), per('knives', 1, 'each'))])],
    { up: { innate: true } },
  ),
  q(
    'uncommon',
    'steel-thicket',
    'Steel Thicket',
    'power',
    1,
    'none',
    [on('turnEnd', [scaled(barrier(0), per('knivesAll'))])],
    { up: { innate: true } },
  ),
  q(
    'uncommon',
    'cruel-precision',
    'Cruel Precision',
    'power',
    1,
    'none',
    [on('debuffFoe', [ifKnifed(barrier(2))])],
    { up: { innate: true } },
  ),

  // --- Shadow: selective extraction, timing and setup (DECISIONS #424) ---
  q(
    'common',
    'quick-pull',
    'Quick Pull',
    'attack',
    0,
    'foe',
    [dmg(3), pull(1, [dmg(5, 'target')])],
    {
      up: { effects: [dmg(5), pull(1, [dmg(5, 'target')])] },
    },
  ),
  q(
    'uncommon',
    'pry-loose',
    'Pry Loose',
    'attack',
    1,
    'foe',
    [dmg(7), pull(1, [status('exposed', 2, 'target')])],
    { up: { effects: [dmg(10), pull(1, [status('exposed', 2, 'target')])] } },
  ),
  q(
    'common',
    'sleight-of-steel',
    'Sleight of Steel',
    'skill',
    1,
    'foe',
    [barrier(5), pull(1, [draw(2)])],
    {
      up: { effects: [barrier(8), pull(1, [draw(2)])] },
    },
  ),
  q(
    'uncommon',
    'bide-in-shadow',
    'Bide in Shadow',
    'skill',
    1,
    'none',
    [status('guarded', 6), drawNext(1)],
    { retain: true, up: { effects: [status('guarded', 9), drawNext(1)] } },
  ),
  q('common', 'melt-away', 'Melt Away', 'skill', 1, 'none', [barrier(7), topdeck(1)], {
    up: { effects: [barrier(10), topdeck(1)] },
  }),
  q(
    'common',
    'feign-weakness',
    'Feign Weakness',
    'skill',
    1,
    'foe',
    [barrier(5), statusTheirs('sapped', 2, 'target'), prepare(1)],
    { up: { effects: [barrier(8), statusTheirs('sapped', 2, 'target'), prepare(1)] } },
  ),
  q(
    'uncommon',
    'choking-smoke',
    'Choking Smoke',
    'skill',
    1,
    'none',
    [status('faltering', 2, 'allFoes'), barrier(4)],
    { up: { effects: [status('faltering', 2, 'allFoes'), barrier(7)] } },
  ),
  q('uncommon', 'set-the-stage', 'Set the Stage', 'skill', 1, 'none', [manaNext(1), drawNext(2)], {
    retain: true,
    up: { effects: [manaNext(1), drawNext(3)] },
  }),
  q(
    'rare',
    'cold-patience',
    'Cold Patience',
    'skill',
    1,
    'none',
    [prepare(2), status('guarded', 8)],
    {
      retain: true,
      up: { effects: [prepare(2), status('guarded', 11)] },
    },
  ),
  q(
    'uncommon',
    'strike-from-shadow',
    'Strike from Shadow',
    'attack',
    2,
    'foe',
    [dmg(16), when('faltering', { atLeast: 1, of: 'target' }, [dmg(8)])],
    {
      retain: true,
      up: { effects: [dmg(20), when('faltering', { atLeast: 1, of: 'target' }, [dmg(8)])] },
    },
  ),
  q(
    'uncommon',
    'clean-extraction',
    'Clean Extraction',
    'power',
    1,
    'none',
    [on('extract', [draw(1), barrier(1)], { once: true })],
    { up: { innate: true } },
  ),
  q(
    'uncommon',
    'lie-in-wait',
    'Lie in Wait',
    'power',
    1,
    'none',
    [on('turnEnd', [when('attacksPlayed', { atMost: 0 }, [barrier(6), prepare(1)])])],
    {
      up: {
        effects: [on('turnEnd', [when('attacksPlayed', { atMost: 0 }, [barrier(9), prepare(1)])])],
      },
    },
  ),
  // (once a turn: a knife pulled sends another into a random enemy)
  q(
    'rare',
    'recycled-steel',
    'Recycled Steel',
    'power',
    1,
    'none',
    [on('extract', [embed(1, 'randomFoe'), barrier(3)], { once: true })],
    { up: { innate: true } },
  ),
];
