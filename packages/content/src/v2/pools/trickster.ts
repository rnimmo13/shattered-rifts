// Vesper Nightlace (Umbral). No companions. Three build paths (DECISIONS #255):
//   Traps    - set traps with different triggers; payoffs for having them out
//   Exposed  - mark the enemy, then spend the mark
//   Patience - Hold cards and leave Mana unspent: payoffs for a full hand and for the Mana you kept
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
  discoverOp,
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
  v('common', 'snare-kit', 'Trap Kit', 'skill', 1, 'none', [addTo('trip-line', 2)], {
    exhaust: true,
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
  v('rare', 'time-bomb', 'Time Bomb', 'snare', 1, 'none', [dmg(12, 'allFoes')], {
    trigger: { on: 'foeTurn' },
  }),
  v('common', 'spring-loaded', 'Spring-Loaded', 'skill', 1, 'none', [
    scaled(barrier(0), per('snares', 5)),
  ]),
  v('rare', 'master-trapper', 'Master Trapper', 'power', 1, 'none', [
    on('play', [draw(1), barrier(3)], { filter: 'snare' }),
  ]),
  v(
    'rare',
    'bait-and-switch',
    'Bait and Switch',
    'snare',
    2,
    'none',
    [PREVENT, dmg(12, 'attacker')],
    {
      trigger: { on: 'attacked' },
    },
  ),
  v(
    'rare',
    'silencing-snare',
    'Silencing Trap',
    'snare',
    2,
    'none',
    [status('stunned', 2, 'attacker'), status('shielded', 1)],
    {
      trigger: { on: 'attacked' },
      up: { effects: [status('stunned', 3, 'attacker'), status('shielded', 1)] },
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
  v('rare', 'trappers-dividend', "Trapper's Dividend", 'power', 1, 'none', [
    on('snare', [draw(1), barrier(5)]),
  ]),
  v('rare', 'spring-the-trap', 'Spring the Trap', 'attack', 1, 'foe', [
    scaled(dmg(6), per('snares', 5)),
  ]),

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
    3,
    'foe',
    [scaled(dmg(18), per('exposed', 4, 'target'))],
    { up: { effects: [scaled(dmg(22), per('exposed', 5, 'target'))] } },
  ),

  v('rare', 'patient-hunter', 'Patient Hunter', 'power', 1, 'none', [
    on('turnStart', [status('exposed', 1, 'allFoes')]),
  ]),

  // (more Exposed)
  // (Cheap Shot and Stalk were the Assassin's Dirty Hit and Stalker's Lunge word for word: each now leans on a Trickster build path)
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
  v('rare', 'hunters-eye', "Hunter's Eye", 'power', 2, 'none', [
    on('play', [status('exposed', 1, 'target')], { filter: 'attack' }),
  ]),
  v(
    'rare',
    'blindside',
    'Blindside',
    'attack',
    2,
    'foe',
    [dmg(22), status('exposed', 3, 'target')],
    { exhaust: true },
  ),

  // --- Patience ---
  v('common', 'cold-read', 'Cold Read', 'skill', 0, 'none', [scry(4)]),
  v('common', 'patient-blade', 'Patient Blade', 'attack', 1, 'foe', [dmg(9)], { retain: true }),
  v('common', 'shadow-cloak', 'Shadow Cloak', 'skill', 1, 'none', [barrier(6), draw(1)], {
    up: { effects: [barrier(9), draw(1)] },
  }),
  v('uncommon', 'banked-breath', 'Banked Breath', 'power', 1, 'none', [
    on('turnEnd', [scaled(barrier(0), per('mana', 2))]),
  ]),
  v('uncommon', 'shadow-step', 'Fade Back', 'skill', 1, 'none', [barrier(6), barrierNext(4)], {
    retain: true,
  }),
  v('rare', 'long-game', 'The Long Game', 'power', 1, 'none', [on('turnStart', [draw(1)])]),
  v('uncommon', 'gleeful-trapsmith', 'Gleeful Trapsmith', 'power', 1, 'none', [
    on('play', [dmg(4, 'allFoes')], { filter: 'snare' }),
  ]),
  v('uncommon', 'marked-cards', 'Coiled Patience', 'power', 1, 'none', [
    on('turnEnd', [scaled(dmg(0, 'randomFoe'), per('mana', 2))]),
  ]),
  v(
    'rare',
    'the-perfect-trap',
    'The Perfect Trap',
    'snare',
    3,
    'none',
    [PREVENT, dmg(22, 'attacker'), status('stunned', 2, 'attacker')],
    { trigger: { on: 'attacked' }, up: { cost: 2 } },
  ),
  // Patience: the Mana you keep strikes every enemy and comes back as more Mana next turn (DECISIONS #338)
  v('rare', 'masquerade', 'Masquerade', 'power', 2, 'none', [
    on('turnEnd', [scaled(dmg(0, 'allFoes'), per('mana', 3)), manaNext(1)]),
  ]),
  v('uncommon', 'saved-breath', 'Saved Breath', 'skill', 0, 'none', [manaNext(2), scry(2)], {
    exhaust: true,
  }),
  // (more Patience)
  v('common', 'roll-with-it', 'Weigh the Odds', 'skill', 1, 'none', [scry(3), draw(1)], {
    retain: true,
  }),
  // (it makes more Mana than it costs, so it Consumes: the costing guide's rule for Mana cards)
  v(
    'uncommon',
    'calculated-move',
    'Measured Breath',
    'skill',
    1,
    'none',
    [manaNext(2), barrier(5)],
    {
      exhaust: true,
      // (the "+" raises the Barrier only: more Mana is what made it Consume)
      up: { effects: [manaNext(2), barrier(8)] },
    },
  ),
  v('common', 'gambit', 'Waiting Game', 'attack', 1, 'foe', [scaled(dmg(4), per('hand', 2))]),
  v('rare', 'second-act', 'Second Act', 'skill', 1, 'none', [status('twinned', 1)], {
    retain: true,
    up: { cost: 0 },
  }),
  v('rare', 'frozen-moment', 'Frozen Moment', 'skill', 1, 'none', [cheapen(1, 'hand')], {
    exhaust: true,
  }),
  v('rare', 'fade-away', 'Fade Away', 'skill', 1, 'none', [status('ghostly', 1)], {
    exhaust: true,
    retain: true,
    up: { cost: 0 },
  }),
  v(
    'rare',
    'pickpocket-master',
    'Pickpocket Master',
    'skill',
    2,
    'none',
    [discoverOp(undefined, 2, true)],
    { exhaust: true },
  ),

  // --- Traps (more traps) ---
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
  v('uncommon', 'trapline-rider', 'Trapline Rider', 'attack', 1, 'foe', [
    scaled(dmg(4), per('snares', 1, 'self', 'hits')),
  ]),
  v('uncommon', 'grim-collection', 'Grim Collection', 'attack', 2, 'foe', [
    dmg(12),
    scaled(barrier(0), per('snares', 4)),
  ]),
  v('uncommon', 'trap-door', 'Trap Door', 'power', 2, 'none', [
    on('turnStart', [addTo('trip-line')]),
  ]),

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
  v('rare', 'culling', 'Culling', 'attack', 2, 'none', [
    scaled(dmg(8, 'allFoes'), per('exposed', 3, 'each')),
  ]),
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

  // --- Patience (more) ---
  // (one more Mana every turn is huge: it starts next turn, and the upgrade only makes it easier to find; DECISIONS #302)
  // (2 Mana, the cost of the Knight's Inner Furnace, which does the same: Robert, 2026-10-28)
  v('rare', 'deep-pockets', 'Deep Pockets', 'power', 2, 'none', [maxMana(1)], {
    up: { retain: true, innate: true },
  }),
  v(
    'uncommon',
    'long-con',
    'Long Con',
    'attack',
    2,
    'foe',
    [dmg(14), status('exposed', 1, 'target')],
    {
      retain: true,
    },
  ),
  v('common', 'discarded-hand', 'Hidden Hand', 'skill', 1, 'none', [draw(2), barrier(3)], {
    retain: true,
    up: { effects: [draw(3), barrier(3)] },
  }),
  v('uncommon', 'sandbag', 'Sandbag', 'attack', 1, 'foe', [scaled(dmg(5), per('mana', 3))]),

  // --- brought back (DECISIONS #337) ---
  v('uncommon', 'spotlight', 'Spotlight', 'skill', 1, 'foe', [
    status('exposed', 3, 'target'),
    status('faltering', 1, 'target'),
  ]),

  // --- glue: cards for any build path (DECISIONS #337) ---
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
    [status('exposed', 1, 'allFoes'), draw(2)],
    { up: { effects: [status('exposed', 2, 'allFoes'), draw(2)] } },
  ),
  v('uncommon', 'step-aside', 'Step Aside', 'skill', 1, 'none', [barrier(6), drawNext(1)], {
    up: { effects: [barrier(9), drawNext(1)] },
  }),

  // --- more glue: uncommons and rares for any build path (DECISIONS #339) ---
  v('rare', 'between-worlds', 'Between Worlds', 'skill', 2, 'none', [status('ghostly', 2)], {
    exhaust: true,
  }),
  v('rare', 'perfect-alibi', 'Perfect Alibi', 'skill', 1, 'none', [barrier(13), discard(1)]),
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
    1,
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
    [scry(2), barrier(2)],
    {
      up: { effects: [scry(3), barrier(4)] },
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
    { up: { effects: [draw(1), fetchCards(3, 'hand', 'snare')] } },
  ),
  v('rare', 'misdirection', 'Patient Guard', 'power', 1, 'none', [
    on('turnEnd', [scaled(barrier(2), per('hand', 1))]),
  ]),
];
