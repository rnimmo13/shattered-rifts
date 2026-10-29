// Solen, the Still Flame (Aurelion). A monk of the Gilded Order's silent branch (the Barbarian until DECISIONS #391). No companions.
// Rebuilt 2026-10-29 (docs/BASE_CLASS_REWORKS.md §12, Option A, approved by Robert; DECISIONS #419): Martial Forms and Mastery. His
// Watcher-shaped stances (Serene's Mana, Fury's double damage, Fervor to a Radiant turn) are archived in
// reviews/balance-baselines/2026-10-29-pre-identity-reworks/.
//
// Forms (one at a time; he starts every fight in Current): a form changes which two techniques complete his objective this turn.
//   Root    - two different Defensive techniques
//   Current - a Defensive technique, then a Striking technique (another card)
//   Ember   - two different Striking techniques aimed at the same enemy
// Only cards tagged as techniques count (DEFENSIVE / STRIKING below), only when played from hand (an echo or a free play does not),
// and the objective completes at most once a turn however often he changes form. Completing it gives 1 Mastery (at most 3, kept
// between turns); techniques spend it, at most 2 a card. No form multiplies damage, makes Mana or hurts him.
//
// Three strategies, plus glue (build paths stay hidden, DECISIONS #365):
//   Root    - discipline: efficient Defensive techniques and defensive Mastery spends
//   Current - flow: alternate the two roles, plan the hand (Foresee, Hold)
//   Ember   - pressure: varied strikes at one target, Mastery spent on a finisher
// Costs and points: docs/reworks/MONK.md and monk-ledger.md (docs/14_CARD_COSTING.md §15). (Card ids are older than some names: an
// id keeps a card's art and every saved deck.)

import type { CardDef } from '@sr/combat';
import {
  barrier,
  DEFENSIVE,
  dmg,
  draw,
  form,
  manaNext,
  on,
  per,
  pool,
  scaled,
  scry,
  spendMastery,
  status,
  STRIKING,
  when,
} from '../build';

const s = pool('monk', 'aurelion');

export const MONK: CardDef[] = [
  // --- basics ---
  s(
    'basic',
    'kindle-fury',
    'Kindle Strike',
    'attack',
    1,
    'foe',
    // (the starter's Mastery spender: his first completed technique has a use from the next turn)
    [spendMastery(1), scaled(dmg(6), per('masterySpent', 4))],
    { ...STRIKING, up: { effects: [spendMastery(1), scaled(dmg(9), per('masterySpent', 4))] } },
  ),
  s('basic', 'still-guard', 'Still Guard', 'skill', 1, 'none', [barrier(6)], {
    ...DEFENSIVE,
    up: { effects: [barrier(8)] },
  }),

  // --- glue: general attacks, defence and planning ---
  s(
    'common',
    'settle-the-root',
    'Settle into Root',
    'skill',
    1,
    'none',
    [barrier(7), form('root')],
    {
      up: { effects: [barrier(10), form('root')] },
    },
  ),
  s(
    'common',
    'find-the-current',
    'Find the Current',
    'skill',
    1,
    'none',
    [barrier(2), draw(2), form('current')],
    { up: { effects: [barrier(5), draw(2), form('current')] } },
  ),
  s(
    'common',
    'stoke-the-ember',
    'Stoke the Ember',
    'attack',
    1,
    'foe',
    [dmg(7), status('exposed', 1, 'target'), form('ember')],
    { up: { effects: [dmg(10), status('exposed', 1, 'target'), form('ember')] } },
  ),
  s(
    'uncommon',
    'read-the-rhythm',
    'Read the Rhythm',
    'skill',
    1,
    'none',
    [barrier(4), scry(3), form('*')],
    {
      up: { effects: [barrier(7), scry(3), form('*')] },
    },
  ),
  s('uncommon', 'inner-sight', 'Inner Sight', 'skill', 1, 'none', [barrier(5), scry(4)], {
    up: { effects: [barrier(8), scry(4)] },
  }),
  s('uncommon', 'deep-breath', 'Gather Breath', 'skill', 1, 'none', [manaNext(2), draw(2)], {
    exhaust: true,
    up: { effects: [manaNext(2), draw(3)] },
  }),
  s(
    'uncommon',
    'held-breath',
    'Held Breath',
    'skill',
    1,
    'none',
    [barrier(7), status('holdfast', 1)],
    {
      up: { effects: [barrier(10), status('holdfast', 1)] },
    },
  ),
  s(
    'uncommon',
    'cornered-beast',
    'Coiled Serpent',
    'snare',
    1,
    'none',
    [dmg(9, 'attacker'), barrier(4), status('mastery', 1)],
    {
      trigger: { on: 'hpLost', min: 5 },
      up: { effects: [dmg(12, 'attacker'), barrier(4), status('mastery', 1)] },
    },
  ),
  s('rare', 'scrawl', 'Flood of Visions', 'skill', 1, 'none', [draw(5)], {
    exhaust: true,
    up: { effects: [draw(6)] },
  }),
  s(
    'rare',
    'perfected-motion',
    'Perfected Motion',
    'power',
    1,
    'none',
    [on('technique', [draw(1), barrier(3)])],
    { up: { innate: true } },
  ),
  s(
    'rare',
    'grandmasters-patience',
    "Grandmaster's Patience",
    'power',
    1,
    'none',
    [on('turnStart', [when('mastery', { atLeast: 3 }, [barrier(6), dmg(6, 'allFoes')])])],
    {
      up: {
        effects: [
          on('turnStart', [when('mastery', { atLeast: 3 }, [barrier(8), dmg(8, 'allFoes')])]),
        ],
      },
    },
  ),

  // --- Root: discipline ---
  s(
    'common',
    'planted-heel',
    'Planted Heel',
    'skill',
    1,
    'none',
    [barrier(6), when('techniquesTurn', { atMost: 0 }, [barrier(2)])],
    {
      ...DEFENSIVE,
      up: { effects: [barrier(8), when('techniquesTurn', { atMost: 0 }, [barrier(2)])] },
    },
  ),
  s('common', 'iron-shirt', 'Iron Shirt', 'skill', 1, 'none', [barrier(8)], {
    ...DEFENSIVE,
    up: { effects: [barrier(11)] },
  }),
  s('common', 'centre-yourself', 'Centre Yourself', 'skill', 0, 'none', [barrier(5)], {
    ...DEFENSIVE,
    up: { effects: [barrier(7)] },
  }),
  s('common', 'bowing-low', 'Bowing Low', 'skill', 0, 'none', [barrier(3), scry(1)], {
    ...DEFENSIVE,
    exhaust: true,
    up: { effects: [barrier(5), scry(1)] },
  }),
  s(
    'uncommon',
    'rooted-resolve',
    'Rooted Resolve',
    'skill',
    1,
    'none',
    [barrier(7), spendMastery(1), when('masterySpent', { atLeast: 1 }, [barrier(2), draw(1)])],
    {
      ...DEFENSIVE,
      up: {
        effects: [
          barrier(10),
          spendMastery(1),
          when('masterySpent', { atLeast: 1 }, [barrier(2), draw(1)]),
        ],
      },
    },
  ),
  s(
    'uncommon',
    'shield-of-faith',
    'Shield of Calm',
    'skill',
    1,
    'none',
    [spendMastery(1), scaled(barrier(7), per('masterySpent', 4))],
    {
      ...DEFENSIVE,
      up: { effects: [spendMastery(1), scaled(barrier(10), per('masterySpent', 4))] },
    },
  ),
  s(
    'uncommon',
    'still-water',
    'Still Water',
    'skill',
    1,
    'none',
    [barrier(8), when('techniquesTurn', { atLeast: 1 }, [draw(1)])],
    {
      ...DEFENSIVE,
      up: { effects: [barrier(11), when('techniquesTurn', { atLeast: 1 }, [draw(1)])] },
    },
  ),
  s(
    'rare',
    'perfect-calm',
    'Perfect Calm',
    'skill',
    2,
    'none',
    [spendMastery(2), scaled(barrier(14), per('masterySpent', 4))],
    {
      ...DEFENSIVE,
      up: { effects: [spendMastery(2), scaled(barrier(18), per('masterySpent', 4))] },
    },
  ),
  s(
    'rare',
    'spirit-shield',
    "Mountain's Stillness",
    'skill',
    2,
    'none',
    [scaled(barrier(8), per('hand', 3))],
    { ...DEFENSIVE, up: { effects: [scaled(barrier(11), per('hand', 3))] } },
  ),
  s(
    'rare',
    'unbroken-calm',
    'Unbroken Calm',
    'power',
    1,
    'none',
    [on('turnStart', [barrier(3), when('inRoot', { atLeast: 1 }, [draw(1)])])],
    { up: { effects: [on('turnStart', [barrier(4), when('inRoot', { atLeast: 1 }, [draw(1)])])] } },
  ),
  s(
    'rare',
    'breath-between-blows',
    'Breath Between Blows',
    'power',
    1,
    'none',
    [on('play', [barrier(3)], { tag: 'defensive' })],
    { up: { effects: [on('play', [barrier(4)], { tag: 'defensive' })] } },
  ),

  // --- Current: flow ---
  s('common', 'deflecting-palm', 'Deflecting Palm', 'attack', 1, 'foe', [dmg(4), barrier(5)], {
    ...DEFENSIVE,
    up: { effects: [dmg(7), barrier(5)] },
  }),
  s('common', 'swift-step', 'Swift Step', 'skill', 1, 'none', [barrier(6), draw(1)], {
    ...DEFENSIVE,
    up: { effects: [barrier(9), draw(1)] },
  }),
  s(
    'common',
    'flowing-step',
    'Flowing Step',
    'skill',
    1,
    'none',
    [barrier(6), when('inCurrent', { atLeast: 1 }, [draw(1)])],
    { ...DEFENSIVE, up: { effects: [barrier(9), when('inCurrent', { atLeast: 1 }, [draw(1)])] } },
  ),
  s('common', 'vigilance', 'Vigilance', 'skill', 1, 'none', [barrier(5), scry(2)], {
    ...DEFENSIVE,
    up: { effects: [barrier(8), scry(2)] },
  }),
  s(
    'common',
    'turning-palm',
    'Turning Palm',
    'attack',
    1,
    'foe',
    [dmg(7), when('defensiveTurn', { atLeast: 1 }, [dmg(4)])],
    { ...STRIKING, up: { effects: [dmg(10), when('defensiveTurn', { atLeast: 1 }, [dmg(4)])] } },
  ),
  s(
    'common',
    'redirect',
    'Redirect',
    'attack',
    1,
    'foe',
    [dmg(6), when('defensiveTurn', { atLeast: 1 }, [barrier(4)])],
    { ...STRIKING, up: { effects: [dmg(9), when('defensiveTurn', { atLeast: 1 }, [barrier(4)])] } },
  ),
  s('uncommon', 'fearless', 'Fearless', 'attack', 1, 'foe', [dmg(6), barrier(4)], {
    ...STRIKING,
    up: { effects: [dmg(9), barrier(4)] },
  }),
  s('uncommon', 'open-palm', 'Open Palm', 'attack', 1, 'foe', [dmg(5, 'target', 2)], {
    ...STRIKING,
    up: { effects: [dmg(6, 'target', 2)] },
  }),
  s(
    'uncommon',
    'foretold-flame',
    'Foretold Flame',
    'attack',
    1,
    'foe',
    [spendMastery(2), scaled(dmg(5), per('masterySpent', 3)), scry(2)],
    {
      ...STRIKING,
      up: { effects: [spendMastery(2), scaled(dmg(8), per('masterySpent', 3)), scry(2)] },
    },
  ),
  s(
    'uncommon',
    'river-turns',
    'The River Turns',
    'power',
    1,
    'none',
    [
      on('play', [barrier(1)], { tag: 'defensive' }),
      on('play', [dmg(2, 'randomFoe')], { tag: 'striking' }),
    ],
    {
      up: {
        effects: [
          on('play', [barrier(1)], { tag: 'defensive' }),
          on('play', [dmg(3, 'randomFoe')], { tag: 'striking' }),
        ],
      },
    },
  ),
  s(
    'uncommon',
    'unmoved-mind',
    'Unmoved Mind',
    'power',
    1,
    'none',
    [on('technique', [dmg(4, 'allFoes')])],
    { up: { effects: [on('technique', [dmg(5, 'allFoes')])] } },
  ),
  s(
    'uncommon',
    'wreath-of-flame',
    'Wreath of Flame',
    'skill',
    1,
    'none',
    [barrier(6), draw(1), when('techniqueDone', { atLeast: 1 }, [status('mastery', 1)])],
    {
      up: {
        effects: [
          barrier(9),
          draw(1),
          when('techniqueDone', { atLeast: 1 }, [status('mastery', 1)]),
        ],
      },
    },
  ),

  // --- Ember: pressure ---
  s(
    'common',
    'ember-step',
    'Ember Step',
    'attack',
    1,
    'foe',
    [dmg(7), status('exposed', 1, 'target')],
    {
      ...STRIKING,
      up: { effects: [dmg(10), status('exposed', 1, 'target')] },
    },
  ),
  s(
    'common',
    'crushing-palm',
    'Crushing Palm',
    'attack',
    1,
    'foe',
    [dmg(8), status('faltering', 1, 'target')],
    { ...STRIKING, up: { effects: [dmg(11), status('faltering', 1, 'target')] } },
  ),
  s('common', 'flurry-of-palms', 'Flurry of Palms', 'attack', 0, 'foe', [dmg(3, 'target', 2)], {
    ...STRIKING,
    up: { effects: [dmg(4, 'target', 2)] },
  }),
  s('common', 'quick-palms', 'Quick Palms', 'attack', 0, 'foe', [dmg(6)], {
    ...STRIKING,
    up: { effects: [dmg(8)] },
  }),
  s('common', 'sunlit-blade', 'Sunlit Kick', 'attack', 1, 'foe', [dmg(9)], {
    ...STRIKING,
    up: { effects: [dmg(12)] },
  }),
  s(
    'common',
    'focused-strike',
    'Focused Strike',
    'attack',
    1,
    'foe',
    [dmg(8), when('inEmber', { atLeast: 1 }, [dmg(3)])],
    { ...STRIKING, up: { effects: [dmg(11), when('inEmber', { atLeast: 1 }, [dmg(3)])] } },
  ),
  s(
    'common',
    'ashen-fist',
    'Ashen Fist',
    'attack',
    2,
    'foe',
    [dmg(14), status('exposed', 1, 'target')],
    {
      ...STRIKING,
      up: { effects: [dmg(18), status('exposed', 1, 'target')] },
    },
  ),
  s(
    'common',
    'angry-palm',
    'Angry Palm',
    'attack',
    1,
    'foe',
    [spendMastery(1), scaled(dmg(6), per('masterySpent', 5))],
    { ...STRIKING, up: { effects: [spendMastery(1), scaled(dmg(9), per('masterySpent', 5))] } },
  ),
  s('common', 'red-mist', 'Scattering Kick', 'attack', 1, 'none', [dmg(7, 'allFoes')], {
    ...STRIKING,
    up: { effects: [dmg(9, 'allFoes')] },
  }),
  s(
    'uncommon',
    'mountain-breaker',
    'Mountain Breaker',
    'attack',
    2,
    'foe',
    [spendMastery(2), scaled(dmg(16), per('masterySpent', 3))],
    { ...STRIKING, up: { effects: [spendMastery(2), scaled(dmg(21), per('masterySpent', 3))] } },
  ),
  s(
    'uncommon',
    'wheel-kick',
    'Spinning Heel',
    'attack',
    2,
    'foe',
    [dmg(12), status('exposed', 2, 'target'), draw(1)],
    { ...STRIKING, up: { effects: [dmg(16), status('exposed', 2, 'target'), draw(1)] } },
  ),
  s(
    'uncommon',
    'temper-flare',
    'Temper Flare',
    'attack',
    1,
    'foe',
    [dmg(3, 'target', 3), status('exposed', 1, 'target')],
    { ...STRIKING, up: { effects: [dmg(4, 'target', 3), status('exposed', 1, 'target')] } },
  ),
  s(
    'uncommon',
    'masters-flourish',
    "Master's Flourish",
    'attack',
    0,
    'foe',
    [spendMastery(2), scaled(dmg(0), per('masterySpent', 5))],
    { ...STRIKING, up: { effects: [spendMastery(2), scaled(dmg(0), per('masterySpent', 6))] } },
  ),
  s('rare', 'thousand-palms', 'Thousand Palms', 'attack', 2, 'foe', [dmg(3, 'target', 7)], {
    ...STRIKING,
    up: { effects: [dmg(4, 'target', 7)] },
  }),
  s(
    'rare',
    'final-account',
    'Final Account',
    'attack',
    3,
    'foe',
    [spendMastery(2), scaled(dmg(24), per('masterySpent', 6))],
    { ...STRIKING, up: { effects: [spendMastery(2), scaled(dmg(30), per('masterySpent', 6))] } },
  ),
  s('rare', 'rage-of-ages', 'Rage of Ages', 'attack', 3, 'none', [dmg(8, 'allFoes', 3)], {
    ...STRIKING,
    up: { effects: [dmg(9, 'allFoes', 3)] },
  }),
  s(
    'rare',
    'last-rites-of-flame',
    'Last Ember',
    'attack',
    3,
    'none',
    [spendMastery(2), scaled(dmg(19, 'allFoes'), per('masterySpent', 4))],
    {
      ...STRIKING,
      up: { effects: [spendMastery(2), scaled(dmg(24, 'allFoes'), per('masterySpent', 4))] },
    },
  ),
];
