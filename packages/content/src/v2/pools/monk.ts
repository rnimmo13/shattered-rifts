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

import type { CardDef, Op } from '@sr/combat';
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
  topdeck,
  when,
} from '../build';

const s = pool('monk', 'aurelion');
// (the expansion, DECISIONS #426)
/** "if you played a Defensive technique this turn" */
const afterDefensive = (...ops: Op[]): Op => when('defensiveTurn', { atLeast: 1 }, ops);
/** "if the target is Exposed" */
const ifExposed = (...ops: Op[]): Op => when('exposed', { atLeast: 1, of: 'target' }, ops);
/** Vigor: its next attack deals this much more (spent by that attack) */
const vigor = (n: number): Op => status('vigor', n);
/** Primed only when not Primed already (Coiled Stance: copies and turns never stack it onto a many-hit attack, DECISIONS #426) */
const unprimed = (n: number): Op => when('vigor', { atMost: 0 }, [vigor(n)]);
/** a random technique of the tag from the discard pile into the hand */
const recover = (tag: 'defensive' | 'striking'): Op => ({
  op: 'fetch',
  amount: 1,
  to: 'hand',
  tag,
});
/** spend up to n Mastery, then these ops if any was spent */
const ifSpent = (n: 1 | 2, ...ops: Op[]): Op[] => [
  spendMastery(n),
  when('masterySpent', { atLeast: 1 }, ops),
];

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

  // --- Root: discipline that turns into damage (DECISIONS #426) ---
  s('common', 'coiled-stance', 'Coiled Stance', 'skill', 1, 'none', [barrier(6), unprimed(3)], {
    ...DEFENSIVE,
    up: { effects: [barrier(9), unprimed(3)] },
  }),
  s(
    'common',
    'mountain-roots',
    'Mountain Roots',
    'skill',
    1,
    'none',
    [barrier(5), status('faltering', 1, 'allFoes')],
    { ...DEFENSIVE, up: { effects: [barrier(8), status('faltering', 1, 'allFoes')] } },
  ),
  s(
    'uncommon',
    'unleashed-stillness',
    'Unleashed Stillness',
    'attack',
    1,
    'foe',
    [scaled(dmg(7), per('defensiveTurn', 3))],
    { ...STRIKING, up: { effects: [scaled(dmg(10), per('defensiveTurn', 3))] } },
  ),
  s(
    'uncommon',
    'earth-shrug',
    'Earth Shrug',
    'skill',
    1,
    'none',
    [barrier(7), when('inRoot', { atLeast: 1 }, [manaNext(1)])],
    { ...DEFENSIVE, up: { effects: [barrier(10), when('inRoot', { atLeast: 1 }, [manaNext(1)])] } },
  ),
  s(
    'rare',
    'patient-thunder',
    'Patient Thunder',
    'skill',
    1,
    'none',
    [barrier(7), when('inRoot', { atLeast: 1 }, [dmg(6, 'allFoes')])],
    {
      ...DEFENSIVE,
      retain: true,
      up: { effects: [barrier(9), when('inRoot', { atLeast: 1 }, [dmg(8, 'allFoes')])] },
    },
  ),
  // (it never stacks: only when not Primed, so a turtle cannot grow a hit; Primed goes on every hit, so it stays small)
  s(
    'uncommon',
    'stored-strength',
    'Stored Strength',
    'power',
    1,
    'none',
    [
      on('turnEnd', [
        when('inRoot', { atLeast: 1 }, [
          when('techniqueDone', { atLeast: 1 }, [when('vigor', { atMost: 0 }, [vigor(4)])]),
        ]),
      ]),
    ],
    { up: { innate: true } },
  ),
  // (Mastery kept, not spent: benefits at 1 or 2 as well as 3)
  s(
    'common',
    'quiet-confidence',
    'Quiet Confidence',
    'skill',
    1,
    'none',
    [scaled(barrier(6), per('mastery', 2))],
    { ...DEFENSIVE, up: { effects: [scaled(barrier(9), per('mastery', 2))] } },
  ),
  s(
    'rare',
    'masters-calm',
    "Master's Calm",
    'skill',
    1,
    'none',
    [scaled(barrier(3), per('mastery', 4))],
    { ...DEFENSIVE, retain: true, up: { effects: [scaled(barrier(5), per('mastery', 4))] } },
  ),
  s(
    'uncommon',
    'inner-reserve',
    'Inner Reserve',
    'power',
    1,
    'none',
    [on('turnEnd', [when('mastery', { atLeast: 1 }, [barrier(4)])])],
    { up: { effects: [on('turnEnd', [when('mastery', { atLeast: 1 }, [barrier(5)])])] } },
  ),
  s(
    'uncommon',
    'deflecting-spirit',
    'Deflecting Spirit',
    'skill',
    1,
    'none',
    [barrier(5), spendMastery(2), scaled(status('faltering', 0, 'allFoes'), per('masterySpent'))],
    {
      ...DEFENSIVE,
      up: {
        effects: [
          barrier(8),
          spendMastery(2),
          scaled(status('faltering', 0, 'allFoes'), per('masterySpent')),
        ],
      },
    },
  ),

  // --- Current: the ordered pair, and small spends (DECISIONS #426) ---
  s('common', 'ebbing-guard', 'Ebbing Guard', 'skill', 1, 'none', [barrier(7)], {
    ...DEFENSIVE,
    retain: true,
    up: { effects: [barrier(10)] },
  }),
  s(
    'uncommon',
    'riverstone-strike',
    'Riverstone Strike',
    'attack',
    1,
    'foe',
    [dmg(7), afterDefensive(status('faltering', 2, 'target'))],
    { ...STRIKING, up: { effects: [dmg(10), afterDefensive(status('faltering', 2, 'target'))] } },
  ),
  s('uncommon', 'undertow', 'Undertow', 'attack', 1, 'foe', [dmg(8), recover('defensive')], {
    ...STRIKING,
    up: { effects: [dmg(11), recover('defensive')] },
  }),
  s(
    'uncommon',
    'read-the-water',
    'Read the Water',
    'skill',
    1,
    'none',
    [barrier(3), draw(2), topdeck(1)],
    {
      up: { effects: [barrier(6), draw(2), topdeck(1)] },
    },
  ),
  s(
    'rare',
    'rivers-answer',
    "River's Answer",
    'attack',
    2,
    'foe',
    [dmg(14), afterDefensive(dmg(12))],
    { ...STRIKING, up: { effects: [dmg(18), afterDefensive(dmg(12))] } },
  ),
  s(
    'uncommon',
    'ebb-and-flow',
    'Ebb and Flow',
    'power',
    1,
    'none',
    [
      on('play', [afterDefensive(barrier(2), status('faltering', 1, 'target'))], {
        tag: 'striking',
        once: true,
      }),
    ],
    { up: { innate: true } },
  ),
  s(
    'common',
    'clear-mind',
    'Clear Mind',
    'skill',
    1,
    'none',
    [barrier(4), draw(1), ...ifSpent(1, draw(1))],
    {
      up: { effects: [barrier(7), draw(1), ...ifSpent(1, draw(1))] },
    },
  ),
  s(
    'uncommon',
    'long-exhale',
    'Long Exhale',
    'skill',
    1,
    'none',
    [barrier(6), ...ifSpent(1, manaNext(1))],
    {
      ...DEFENSIVE,
      up: { effects: [barrier(9), ...ifSpent(1, manaNext(1))] },
    },
  ),
  s(
    'uncommon',
    'composed-mind',
    'Composed Mind',
    'skill',
    1,
    'none',
    [barrier(5), draw(1), when('mastery', { atLeast: 2 }, [draw(1)])],
    { up: { effects: [barrier(8), draw(1), when('mastery', { atLeast: 2 }, [draw(1)])] } },
  ),
  s(
    'rare',
    'decisive-moment',
    'Decisive Moment',
    'skill',
    1,
    'none',
    [
      barrier(3),
      spendMastery(2),
      scaled(draw(0), per('masterySpent')),
      scaled(barrier(0), per('masterySpent', 3)),
    ],
    {
      up: {
        effects: [
          barrier(6),
          spendMastery(2),
          scaled(draw(0), per('masterySpent')),
          scaled(barrier(0), per('masterySpent', 3)),
        ],
      },
    },
  ),
  s(
    'uncommon',
    'flowing-release',
    'Flowing Release',
    'power',
    1,
    'none',
    [on('spend', [barrier(3)], { status: 'mastery' })],
    { up: { effects: [on('spend', [barrier(4)], { status: 'mastery' })] } },
  ),

  // --- Ember: commitment to one enemy (DECISIONS #426) ---
  s(
    'common',
    'first-touch',
    'First Touch',
    'attack',
    0,
    'foe',
    [dmg(3), status('exposed', 1, 'target')],
    {
      ...STRIKING,
      up: { effects: [dmg(5), status('exposed', 1, 'target')] },
    },
  ),
  s('common', 'follow-through', 'Follow-Through', 'attack', 1, 'foe', [dmg(8), ifExposed(dmg(4))], {
    ...STRIKING,
    up: { effects: [dmg(11), ifExposed(dmg(4))] },
  }),
  s(
    'uncommon',
    'embers-edge',
    "Ember's Edge",
    'attack',
    1,
    'foe',
    [dmg(9), when('formProgress', { atLeast: 1, atMost: 1 }, [dmg(4)])],
    {
      ...STRIKING,
      up: { effects: [dmg(12), when('formProgress', { atLeast: 1, atMost: 1 }, [dmg(4)])] },
    },
  ),
  s(
    'uncommon',
    'searing-combination',
    'Searing Combination',
    'attack',
    2,
    'foe',
    [dmg(10), ifExposed(dmg(5)), status('exposed', 2, 'target')],
    { ...STRIKING, up: { effects: [dmg(14), ifExposed(dmg(5)), status('exposed', 2, 'target')] } },
  ),
  s(
    'rare',
    'heart-of-the-ember',
    'Heart of the Ember',
    'attack',
    2,
    'foe',
    [spendMastery(2), scaled(dmg(10), per('masterySpent', 1, undefined, 'hits'))],
    {
      ...STRIKING,
      up: {
        effects: [spendMastery(2), scaled(dmg(12), per('masterySpent', 1, undefined, 'hits'))],
      },
    },
  ),
  s(
    'uncommon',
    'kindled-focus',
    'Kindled Focus',
    'power',
    1,
    'none',
    [
      on(
        'play',
        [
          status('exposed', 1, 'target'),
          when('inEmber', { atLeast: 1 }, [status('exposed', 1, 'target')]),
        ],
        { tag: 'striking', once: true },
      ),
    ],
    { up: { innate: true } },
  ),
  s(
    'common',
    'centred-strike',
    'Centred Strike',
    'attack',
    1,
    'foe',
    [scaled(dmg(7), per('mastery', 2))],
    {
      ...STRIKING,
      up: { effects: [scaled(dmg(10), per('mastery', 2))] },
    },
  ),
  s(
    'uncommon',
    'unhurried-sweep',
    'Unhurried Sweep',
    'attack',
    2,
    'none',
    [scaled(dmg(12, 'allFoes'), per('mastery', 2))],
    { ...STRIKING, up: { effects: [scaled(dmg(15, 'allFoes'), per('mastery', 2))] } },
  ),
  // (the spend comes first, so the hit lands on the Exposed)
  s(
    'common',
    'pinpoint-strike',
    'Pinpoint Strike',
    'attack',
    1,
    'foe',
    [...ifSpent(1, status('exposed', 2, 'target')), dmg(7)],
    { ...STRIKING, up: { effects: [...ifSpent(1, status('exposed', 2, 'target')), dmg(10)] } },
  ),

  // --- glue: adapting the form to the hand (DECISIONS #426; a change still starts the progress again) ---
  s('common', 'shifting-stance', 'Shifting Stance', 'skill', 1, 'none', [barrier(6), form('*')], {
    ...DEFENSIVE,
    up: { effects: [barrier(9), form('*')] },
  }),
  s('common', 'change-of-heart', 'Change of Heart', 'attack', 1, 'foe', [dmg(8), form('*')], {
    ...STRIKING,
    up: { effects: [dmg(11), form('*')] },
  }),
  s(
    'uncommon',
    'adapting-flow',
    'Adapting Flow',
    'skill',
    1,
    'none',
    [barrier(3), draw(2), when('techniqueDone', { atMost: 0 }, [form('*')])],
    { up: { effects: [barrier(6), draw(2), when('techniqueDone', { atMost: 0 }, [form('*')])] } },
  ),
  s(
    'common',
    'seek-the-strike',
    'Seek the Strike',
    'skill',
    1,
    'none',
    [barrier(5), recover('striking')],
    {
      up: { effects: [barrier(8), recover('striking')] },
    },
  ),
  s(
    'rare',
    'thousand-forms',
    'Thousand Forms',
    'skill',
    2,
    'none',
    [barrier(14), form('*'), draw(1)],
    { ...DEFENSIVE, up: { effects: [barrier(18), form('*'), draw(1)] } },
  ),
  s(
    'uncommon',
    'unfinished-form',
    'Unfinished Form',
    'power',
    1,
    'none',
    [on('turnEnd', [when('techniqueDone', { atMost: 0 }, [status('holdfast', 1), barrier(4)])])],
    { up: { innate: true } },
  ),
];
