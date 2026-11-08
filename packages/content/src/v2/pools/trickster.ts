// Vesper Nightlace (Umbral). No companions. Three themes (DECISIONS #255, #387):
//   Traps    - set traps with different triggers; payoffs for having them out
//   Exposed  - mark the enemy, then spend the mark
//   Suits    - every card shows a suit; show all four in a turn for a Full Trick, and payoffs for every suit shown
// (Card ids are older than some names: an id keeps a card's art and every saved deck.)

import type { CardDef } from '@sr/combat';
import {
  addTo,
  barrier,
  dmg,
  draw,
  manaNext,
  on,
  per,
  pool,
  PREVENT,
  scaled,
  scry,
  status,
  drawNext,
  cheapen,
  maxMana,
  discard,
  doubleSt,
  mana,
  fetchCards,
  when,
  barrierNext,
} from '../build';

const v = pool('trickster', 'umbral');

export const TRICKSTER: CardDef[] = [
  // --- basics ---
  v(
    'basic',
    'veil-strike',
    'Veil Strike',
    'attack',
    1,
    'foe',
    [dmg(6), status('exposed', 1, 'target')],
    { up: { effects: [dmg(9), status('exposed', 1, 'target')] } },
  ),
  v(
    'basic',
    'set-the-web',
    'Set the Web',
    'snare',
    1,
    'none',
    [dmg(7, 'attacker'), status('exposed', 1, 'attacker')],
    {
      trigger: { on: 'attacked' },
      up: { effects: [dmg(10, 'attacker'), status('exposed', 1, 'attacker')] },
    },
  ),

  // a ♦ for the starting deck, so it holds all four suits (DECISIONS #387)
  v('basic', 'pick-a-card', 'Pick a Card', 'skill', 0, 'none', [scry(2)]),
  // (a second Trap for the starting deck: a class basic, Robert 2026-10-30)
  v('basic', 'pinprick-trap', 'Pinprick Trap', 'snare', 0, 'none', [dmg(6, 'attacker')], {
    trigger: { on: 'attacked' },
  }),

  // --- Traps ---
  v('common', 'trip-line', 'Trip Line', 'snare', 0, 'none', [dmg(8, 'attacker')], {
    trigger: { on: 'attacked' },
  }),
  v(
    'common',
    'hollow-snare',
    'Hollow Trap',
    'snare',
    1,
    'none',
    [dmg(10, 'attacker'), status('faltering', 1, 'attacker')],
    { trigger: { on: 'attacked' } },
  ),
  // (the Trap engine cards are ♣, whatever they give you: DECISIONS #387)
  v('common', 'snare-kit', 'Trap Kit', 'skill', 1, 'none', [addTo('trip-line', 2)], {
    exhaust: true,
    suit: 'clubs',
  }),
  v(
    'uncommon',
    'mirror-veil',
    'Mirror Veil',
    'snare',
    1,
    'none',
    [PREVENT, status('faltering', 1, 'attacker')],
    { trigger: { on: 'attacked' } },
  ),
  // (15 since #694: B 112%; ~140%; upgraded 19)
  v('rare', 'time-bomb', 'Time Bomb', 'snare', 1, 'none', [dmg(15, 'allFoes')], {
    trigger: { on: 'foeTurn' },
    up: { effects: [dmg(19, 'allFoes')] },
  }),
  v('common', 'spring-loaded', 'Spring-Loaded', 'skill', 1, 'none', [
    scaled(barrier(0), per('snares', 5)),
  ]),
  v(
    'rare',
    'master-trapper',
    'Master Trapper',
    'power',
    1,
    'none',
    [on('play', [draw(1), barrier(3)], { filter: 'snare' })],
    { suit: 'clubs', up: { effects: [on('play', [draw(1), barrier(5)], { filter: 'snare' })] } },
  ),
  v(
    'rare',
    'bait-and-switch',
    'Bait and Switch',
    'snare',
    2,
    'none',
    // (18 and 2 Exposed since #694: C 86%; ~129%; upgraded 28)
    [PREVENT, dmg(18, 'attacker'), status('exposed', 2, 'attacker')],
    {
      trigger: { on: 'attacked' },
      up: { effects: [PREVENT, dmg(28, 'attacker'), status('exposed', 2, 'attacker')] },
    },
  ),
  v(
    'rare',
    'silencing-snare',
    'Silencing Trap',
    'snare',
    2,
    'none',
    // (Stun 3 and 2 Exposed since #694: C 89%; ~136%; upgraded it costs 1)
    [status('stunned', 3, 'attacker'), status('shielded', 1), status('exposed', 2, 'attacker')],
    {
      trigger: { on: 'attacked' },
      up: { cost: 1 },
    },
  ),

  // (more Traps)
  v(
    'uncommon',
    'tripwire-garrote',
    'Tripwire Garrote',
    'snare',
    1,
    'none',
    [dmg(7, 'attacker'), status('exposed', 2, 'attacker')],
    {
      trigger: { on: 'attacked' },
    },
  ),
  v(
    'uncommon',
    'snare-net',
    'Trap Net',
    'snare',
    1,
    'none',
    [dmg(6, 'allFoes'), status('faltering', 1, 'allFoes')],
    {
      trigger: { on: 'foeTurn' },
      up: { effects: [dmg(9, 'allFoes'), status('faltering', 1, 'allFoes')] },
    },
  ),
  v(
    'rare',
    'trappers-dividend',
    "Trapper's Dividend",
    'power',
    1,
    'none',
    [on('snare', [draw(1), barrier(5)])],
    // (upgraded 7 since #694: 8 was +40%)
    { suit: 'clubs', up: { effects: [on('snare', [draw(1), barrier(7)])] } },
  ),
  // (8 + 6 a Trap since #694: B 108%; ~136%; upgraded 10 + 8)
  v('rare', 'spring-the-trap', 'Spring the Trap', 'attack', 1, 'foe', [scaled(dmg(8), per('snares', 6))], {
    up: { effects: [scaled(dmg(10), per('snares', 8))] },
  }),

  // --- Exposed ---
  v('common', 'mark-prey', 'Mark Prey', 'skill', 0, 'foe', [status('exposed', 2, 'target')]),
  v('common', 'unmask', 'Unmask', 'skill', 1, 'none', [status('exposed', 2, 'allFoes')]),
  v('common', 'exploit-weakness', 'Exploit Weakness', 'attack', 1, 'foe', [
    scaled(dmg(5), per('exposed', 2, 'target')),
  ]),
  v(
    'common',
    'veil-dance',
    'Veil Dance',
    'skill',
    1,
    'none',
    [status('faltering', 1, 'allFoes'), barrier(5)],
    { up: { effects: [status('faltering', 1, 'allFoes'), barrier(8)] } },
  ),
  v('uncommon', 'death-mark', 'Death Mark', 'attack', 2, 'foe', [
    dmg(12),
    status('exposed', 3, 'target'),
  ]),
  v('uncommon', 'shadow-volley', 'Shadow Volley', 'attack', 1, 'none', [dmg(4, 'randomFoe', 3)]),
  v(
    'rare',
    'coup-de-grace',
    'Coup de Grace',
    'attack',
    // (2 Mana, 20 + 5 an Exposed since #694: C 74%; ~126%; upgraded 26 + 6)
    2,
    'foe',
    [scaled(dmg(20), per('exposed', 5, 'target'))],
    { up: { effects: [scaled(dmg(26), per('exposed', 6, 'target'))] } },
  ),

  v(
    'rare',
    'patient-hunter',
    'Patient Hunter',
    'power',
    0,
    'none',
    // (0 Mana and Opening hand since #694: B 90%; ~150%; upgraded also 1 Faltering to all when played)
    [on('turnStart', [status('exposed', 1, 'allFoes')])],
    {
      innate: true,
      up: { effects: [on('turnStart', [status('exposed', 1, 'allFoes')]), status('faltering', 1, 'allFoes')] },
    },
  ),

  // (more Exposed)
  // (Cheap Shot and Stalk were the Assassin's Dirty Hit and Stalker's Lunge word for word: each now leans on a Trickster mechanic)
  v(
    'common',
    'cheap-shot',
    'Cheap Shot',
    'attack',
    1,
    'foe',
    [
      dmg(6),
      status('faltering', 1, 'target'),
      when('snares', { atLeast: 1 }, [status('exposed', 1, 'target')]),
    ],
    {
      up: {
        effects: [
          dmg(9),
          status('faltering', 1, 'target'),
          when('snares', { atLeast: 1 }, [status('exposed', 1, 'target')]),
        ],
      },
    },
  ),
  v('uncommon', 'stalk', 'Stalk', 'attack', 2, 'foe', [
    dmg(16),
    when('exposed', { atLeast: 1, of: 'target' }, [drawNext(2)]),
  ]),
  v('uncommon', 'strip-the-guard', 'Strip the Guard', 'skill', 1, 'foe', [
    status('exposed', 3, 'target'),
    status('brittle', 2, 'target'),
  ]),
  v(
    'uncommon',
    'smoke-bomb',
    'Smoke Bomb',
    'skill',
    1,
    'none',
    [status('faltering', 1, 'allFoes'), status('exposed', 1, 'allFoes'), barrier(3)],
    {
      up: {
        effects: [status('faltering', 1, 'allFoes'), status('exposed', 2, 'allFoes'), barrier(3)],
      },
    },
  ),
  v(
    'rare',
    'opening-strike',
    'Opening Strike',
    'attack',
    0,
    'foe',
    [dmg(8), status('exposed', 2, 'target')],
    {
      innate: true,
      exhaust: true,
    },
  ),
  // (1 Mana and Opening hand since #694: D 63%; ~150%; upgraded it costs 0)
  v(
    'rare',
    'hunters-eye',
    "Hunter's Eye",
    'power',
    1,
    'none',
    [on('play', [status('exposed', 1, 'target')], { filter: 'attack' })],
    { innate: true, up: { cost: 0 } },
  ),
  // (not consumed since #694: B 104%; ~131%; upgraded 30)
  v('rare', 'blindside', 'Blindside', 'attack', 2, 'foe', [dmg(22), status('exposed', 3, 'target')], {
    up: { effects: [dmg(30), status('exposed', 3, 'target')] },
  }),

  // --- Suits ---
  // (DECISIONS #387) every card shows a suit: ♠ Attacks, ♥ protection, ♦ cards and Mana, ♣ Traps and debuffs (the rule is in
  // @sr/combat suits.ts); a turn that shows all four is a Full Trick (the trait). These cards pay for the suits you show.
  v('common', 'cold-read', 'Cold Read', 'skill', 0, 'none', [scry(4)]),
  v('common', 'patient-blade', 'Patient Blade', 'attack', 1, 'foe', [dmg(9)], { retain: true }),
  v('common', 'shadow-cloak', 'Shadow Cloak', 'skill', 1, 'none', [barrier(6), draw(1)], {
    up: { effects: [barrier(9), draw(1)] },
  }),
  // (draw 2 since #694: C 80%; upgraded draw 3)
  v('common', 'roll-with-it', 'Weigh the Odds', 'skill', 1, 'none', [scry(3), draw(2)], {
    retain: true,
    up: { effects: [scry(3), draw(3)] },
  }),
  v('common', 'discarded-hand', 'Hidden Hand', 'skill', 1, 'none', [draw(2), barrier(3)], {
    retain: true,
    up: { effects: [draw(3), barrier(3)] },
  }),
  v(
    'common',
    'flourish',
    'Flourish',
    'attack',
    1,
    'foe',
    [dmg(7), when('hearts', { atLeast: 1 }, [barrier(4)])],
    { up: { effects: [dmg(10), when('hearts', { atLeast: 1 }, [barrier(4)])] } },
  ),
  v('uncommon', 'shadow-step', 'Fade Back', 'skill', 1, 'none', [barrier(6), barrierNext(4)], {
    retain: true,
  }),
  v(
    'uncommon',
    'long-con',
    'Long Con',
    'attack',
    2,
    'foe',
    // (16 since #694: C 89%; upgraded 21)
    [dmg(16), status('exposed', 1, 'target')],
    {
      retain: true,
      up: { effects: [dmg(21), status('exposed', 1, 'target')] },
    },
  ),
  v('uncommon', 'card-fan', 'Card Fan', 'attack', 1, 'foe', [scaled(dmg(4), per('suits', 3))]),
  v('uncommon', 'card-sharp', 'Card Sharp', 'attack', 1, 'foe', [
    dmg(8),
    when('suits', { atLeast: 4 }, [dmg(8)]),
  ]),
  v('uncommon', 'cut-the-deck', 'Cut the Deck', 'skill', 1, 'none', [
    draw(2),
    when('suits', { atLeast: 3 }, [
      { op: 'oncePerTurn', key: 'suit-mana-refund', ownTurn: true, ops: [mana(1)] },
    ]),
  ]),
  v('uncommon', 'queen-of-hearts', 'Queen of Hearts', 'skill', 1, 'none', [
    scaled(barrier(5), per('suits', 2)),
  ]),
  v(
    'uncommon',
    'ace-of-clubs',
    'Ace of Clubs',
    'skill',
    1,
    'foe',
    [
      status('exposed', 2, 'target'),
      status('faltering', 1, 'target'),
      when('suits', { atLeast: 3 }, [draw(1)]),
    ],
    {
      up: {
        effects: [
          status('exposed', 3, 'target'),
          status('faltering', 1, 'target'),
          when('suits', { atLeast: 3 }, [draw(1)]),
        ],
      },
    },
  ),
  // (draw 2 since #694: C 83%)
  v('uncommon', 'wild-card', 'Wild Card', 'skill', 0, 'none', [draw(2)], {
    suit: 'wild',
    // (a free card that draws must Consume: balance.test.ts)
    exhaust: true,
    up: { retain: true },
  }),
  // (and draw 1 since #694: B 104%; ~128%; upgraded draw 2, in place of costing 0 (+70%))
  v('rare', 'second-act', 'Second Act', 'skill', 1, 'none', [status('twinned', 1), draw(1)], {
    retain: true,
    up: { effects: [status('twinned', 1), draw(2)] },
  }),
  v(
    'rare',
    'pickpocket-master',
    'Pickpocket Master',
    'skill',
    // (still 2 Mana, the price of the Monk's All-Seeing; 3 upgraded free cards since #694: D 67%; ~121%; upgraded 4)
    2,
    'none',
    [{ op: 'discover', count: 3, free: true, upgraded: true }],
    { exhaust: true, up: { effects: [{ op: 'discover', count: 4, free: true, upgraded: true }] } },
  ),
  v(
    'rare',
    'royal-flourish',
    'Royal Flourish',
    'attack',
    // (1 Mana since #694: C 81%; ~140%)
    1,
    'foe',
    [scaled(dmg(0), per('suits', 7))],
    { up: { effects: [scaled(dmg(0), per('suits', 9))] } },
  ),
  // (20, and never below 1 Mana, since #694: 30 for 0 after three suits was ~240%; ~160%; upgraded 26)
  v('rare', 'showstopper', 'Showstopper', 'attack', 3, 'foe', [dmg(20)], {
    cheaperPer: { by: 'suits', mult: 1, min: 1 },
    up: { effects: [dmg(26)] },
  }),
  // (an upgraded card since #694: B 104%; ~128%; upgraded also draw 1 and 2 Barrier)
  v(
    'rare',
    'the-joker',
    'The Joker',
    'skill',
    1,
    'none',
    [{ op: 'discover', count: 1, free: true, upgraded: true }],
    {
      suit: 'wild',
      up: { effects: [{ op: 'discover', count: 1, free: true, upgraded: true }, draw(1), barrier(2)] },
    },
  ),
  v(
    'rare',
    'the-whole-deck',
    'The Whole Deck',
    'power',
    1,
    'none',
    // (+1 Mana now since #694: B 110%; ~140%; upgraded draw 3)
    [on('allSuits', [draw(2), mana(1)])],
    { up: { effects: [on('allSuits', [draw(3), mana(1)])] } },
  ),
  // (was the Patience Legendary, DECISIONS #338: now every suit you showed strikes every enemy as the turn ends)
  v(
    'rare',
    'masquerade',
    'Masquerade',
    'power',
    2,
    'none',
    [
      on('turnEnd', [
        when('fullTrickTurn', { atLeast: 1 }, [scaled(dmg(12, 'allFoes'), per('fullTricks', 2))]),
        when('fullTrickTurn', { atMost: 0 }, [scaled(dmg(0, 'allFoes'), per('suits', 3))]),
      ]),
    ],
    {
      up: {
        effects: [
          on('turnEnd', [
            when('fullTrickTurn', { atLeast: 1 }, [
              scaled(dmg(16, 'allFoes'), per('fullTricks', 2)),
            ]),
            when('fullTrickTurn', { atMost: 0 }, [scaled(dmg(0, 'allFoes'), per('suits', 4))]),
          ]),
        ],
      },
    },
  ),

  // --- glue: Mana and time, for any deck ---
  v('uncommon', 'saved-breath', 'Saved Breath', 'skill', 0, 'none', [manaNext(2), scry(2)], {
    exhaust: true,
  }),
  v('uncommon', 'long-game', 'The Long Game', 'power', 1, 'none', [on('turnStart', [draw(1)])], {
    up: { innate: true },
  }),
  // (draw 1 first since #694: D 54%; ~96%; upgraded draw 2)
  v('uncommon', 'frozen-moment', 'Frozen Moment', 'skill', 1, 'none', [draw(1), cheapen(1, 'hand')], {
    exhaust: true,
    up: { effects: [draw(2), cheapen(1, 'hand')] },
  }),
  // (one more Mana every turn is huge: it starts next turn, and the upgrade only makes it easier to find; DECISIONS #302)
  // (2 Mana, the cost of the Knight's Inner Furnace, which does the same: Robert, 2026-10-28)
  // (still 2 Mana, the shared price of a +1 Mana Aura (#410), so Opening hand in the base card since #694: ~92%, B, the one Rare kept
  // under A by that rule; upgraded it also draws 2 when played)
  v('rare', 'deep-pockets', 'Deep Pockets', 'power', 2, 'none', [maxMana(1)], {
    innate: true,
    up: { effects: [maxMana(1), draw(2)] },
  }),

  // --- Traps (more traps) ---
  v(
    'rare',
    'the-perfect-trap',
    'The Perfect Trap',
    'snare',
    3,
    'none',
    // (26 since #694: B 117%; ~126%; upgraded it costs 2)
    [PREVENT, dmg(26, 'attacker'), status('stunned', 2, 'attacker')],
    { trigger: { on: 'attacked' }, up: { cost: 2 } },
  ),
  v(
    'uncommon',
    'gleeful-trapsmith',
    'Gleeful Trapsmith',
    'power',
    1,
    'none',
    // (3 since #694: A 147% for an uncommon; ~110%; upgraded 4)
    [on('play', [scaled(dmg(3, 'allFoes'), { by: 'snaresSprung', step: 4 })], { filter: 'snare' })],
    {
      suit: 'clubs',
      up: {
        effects: [
          on('play', [scaled(dmg(4, 'allFoes'), { by: 'snaresSprung', step: 4 })], {
            filter: 'snare',
          }),
        ],
      },
    },
  ),
  v(
    'common',
    'fang-pit',
    'Fang Pit',
    'snare',
    1,
    'none',
    [dmg(6, 'allFoes'), status('exposed', 1, 'allFoes')],
    {
      trigger: { on: 'hpLost', min: 3 },
      up: { effects: [dmg(9, 'allFoes'), status('exposed', 1, 'allFoes')] },
    },
  ),
  v(
    'common',
    'false-floor',
    'False Floor',
    'snare',
    0,
    'none',
    [dmg(12, 'attacker'), status('exposed', 2, 'attacker')],
    { trigger: { on: 'foeSummons' } },
  ),
  v(
    'uncommon',
    'metronome-trap',
    'Metronome Trap',
    'snare',
    0,
    'none',
    [dmg(3, 'allFoes'), barrier(3)],
    {
      trigger: { on: 'foeTurn' },
      up: { effects: [dmg(5, 'allFoes'), barrier(3)] },
    },
  ),
  // (5 + 4 a Trap since #694: C 89%; upgraded 7 + 5)
  v('uncommon', 'trapline-rider', 'Trapline Rider', 'attack', 1, 'foe', [scaled(dmg(5), per('snares', 4, 'self'))], {
    up: { effects: [scaled(dmg(7), per('snares', 5, 'self'))] },
  }),
  v('uncommon', 'grim-collection', 'Grim Collection', 'attack', 2, 'foe', [
    dmg(12),
    scaled(barrier(0), per('snares', 4)),
  ]),
  v(
    'uncommon',
    'trap-door',
    'Trap Door',
    'power',
    2,
    'none',
    [on('turnStart', [addTo('trip-line')])],
    { suit: 'clubs', up: { effects: [on('turnStart', [addTo('trip-line+')])] } },
  ),

  // --- Exposed (more marks) ---
  v('uncommon', 'dread-gaze', 'Dread Gaze', 'skill', 0, 'foe', [status('exposed', 3, 'target')], {
    exhaust: true,
  }),
  v(
    'common',
    'slit-and-run',
    'Slit and Run',
    'attack',
    1,
    'foe',
    [dmg(5), barrier(3), status('exposed', 1, 'target')],
    { up: { effects: [dmg(8), barrier(3), status('exposed', 1, 'target')] } },
  ),
  // (14 + 5 an Exposed since #694: C 77%; ~131%; upgraded 18 + 6)
  v('rare', 'culling', 'Culling', 'attack', 2, 'none', [scaled(dmg(14, 'allFoes'), per('exposed', 5, 'each'))], {
    up: { effects: [scaled(dmg(18, 'allFoes'), per('exposed', 6, 'each'))] },
  }),
  v(
    'uncommon',
    'cripple',
    'Cripple',
    'skill',
    1,
    'foe',
    [status('faltering', 1, 'target'), status('exposed', 1, 'target'), barrier(5)],
    {
      up: {
        effects: [status('faltering', 1, 'target'), status('exposed', 2, 'target'), barrier(5)],
      },
    },
  ),

  // --- brought back (DECISIONS #337) ---
  v('uncommon', 'spotlight', 'Spotlight', 'skill', 1, 'foe', [
    status('exposed', 3, 'target'),
    status('faltering', 1, 'target'),
  ]),

  // --- glue: cards for any deck (DECISIONS #337) ---
  v(
    'common',
    'low-blow',
    'Low Blow',
    'attack',
    0,
    'foe',
    [dmg(3), status('faltering', 1, 'target')],
    { up: { effects: [dmg(5), status('faltering', 1, 'target')] } },
  ),
  v(
    'common',
    'tear-the-veil',
    'Tear the Veil',
    'skill',
    1,
    'none',
    // (upgraded draw 3 since #694: 2 Exposed to all was +39%)
    [status('exposed', 1, 'allFoes'), draw(2)],
    { up: { effects: [status('exposed', 1, 'allFoes'), draw(3)] } },
  ),
  v('uncommon', 'step-aside', 'Step Aside', 'skill', 1, 'none', [barrier(6), drawNext(1)], {
    up: { effects: [barrier(9), drawNext(1)] },
  }),

  // --- more glue: uncommons and rares for any deck (DECISIONS #339) ---
  // (Ghostly 3 since #694: C 88%; ~131%; upgraded it costs 1)
  v('rare', 'between-worlds', 'Between Worlds', 'skill', 2, 'none', [status('ghostly', 3)], {
    exhaust: true,
    up: { cost: 1 },
  }),
  // (16 since #694: B 109%; ~138%; upgraded 20)
  v('rare', 'perfect-alibi', 'Perfect Alibi', 'skill', 1, 'none', [barrier(16), discard(1)], {
    up: { effects: [barrier(20), discard(1)] },
  }),
  v('uncommon', 'sleight-of-hand', 'Sleight of Hand', 'skill', 1, 'none', [draw(2), manaNext(1)], {
    up: { effects: [draw(3), manaNext(1)] },
  }),
  v(
    'uncommon',
    'mask-of-faces',
    'Mask of Faces',
    'skill',
    1,
    'none',
    [status('steadfast', 2), barrier(6)],
    {
      up: { effects: [status('steadfast', 2), barrier(9)] },
    },
  ),

  // --- brought back for the 20/30/25 rarity target (DECISIONS #341) ---
  v(
    'uncommon',
    'poison-pantry',
    'Poison Pantry',
    'snare',
    0,
    'none',
    [dmg(10, 'attacker'), status('brittle', 2, 'attacker')],
    { trigger: { on: 'foeDefends' } },
  ),
  v(
    'rare',
    'compound-fear',
    'Compound Fear',
    'skill',
    // (0 Mana since #694: C 77%; ~128%)
    0,
    'foe',
    // (a doubler always Consumes: balance.test.ts)
    [status('exposed', 2, 'target'), doubleSt('exposed', 'target', 2, 4)],
    {
      exhaust: true,
      up: { effects: [status('exposed', 2, 'target'), doubleSt('exposed', 'target', 2, 6)] },
    },
  ),
  v('uncommon', 'hamstring', 'Hamstring', 'attack', 1, 'foe', [
    dmg(6),
    status('exposed', 2, 'target'),
  ]),
  v(
    'uncommon',
    'trick-of-the-light',
    'Trick of the Light',
    'skill',
    0,
    'none',
    // (Foresee 3 and 3 Barrier since #694: D 66%, and its upgrade was +111%; upgraded 5 Barrier)
    [scry(3), barrier(3)],
    {
      up: { effects: [scry(3), barrier(5)] },
    },
  ),
  v('uncommon', 'stolen-moment', 'Stolen Moment', 'skill', 0, 'none', [mana(1), scry(2)], {
    exhaust: true,
  }),
  v(
    'uncommon',
    'curtain-call',
    'Curtain Call',
    'skill',
    1,
    'none',
    [draw(1), fetchCards(2, 'hand', 'snare')],
    { suit: 'clubs', up: { effects: [draw(1), fetchCards(3, 'hand', 'snare')] } },
  ),
  v(
    'rare',
    'misdirection',
    'Patient Guard',
    'power',
    1,
    'none',
    // (4 a card held, at most 24, since #694: C 72%; ~144%; upgraded 5, at most 30. The cap: Hold cards can keep 8-10 in hand)
    [on('turnEnd', [scaled(barrier(0), { by: 'hand', mult: 4, max: 24 })])],
    { up: { effects: [on('turnEnd', [scaled(barrier(0), { by: 'hand', mult: 5, max: 30 })])] } },
  ),
];
