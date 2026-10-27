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
} from '../build';

const v = pool('trapper', 'umbral');

export const TRAPPER: CardDef[] = [
  // --- basics ---
  v('basic', 'veil-strike', 'Veil Strike', 'attack', 1, 'foe', [
    dmg(6),
    status('exposed', 1, 'target'),
  ]),
  v(
    'basic',
    'set-the-web',
    'Set the Web',
    'snare',
    1,
    'none',
    [dmg(8, 'attacker'), status('exposed', 2, 'attacker')],
    { trigger: { on: 'attacked' } },
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
    2,
    'none',
    [PREVENT, status('faltering', 2, 'attacker')],
    { trigger: { on: 'attacked' } },
  ),
  v('uncommon', 'time-bomb', 'Time Bomb', 'snare', 1, 'none', [dmg(12, 'allFoes')], {
    trigger: { on: 'foeTurn' },
  }),
  v('common', 'spring-loaded', 'Spring-Loaded', 'skill', 1, 'none', [
    scaled(barrier(0), per('snares', 5)),
  ]),
  v('uncommon', 'master-trapper', 'Master Trapper', 'power', 1, 'none', [
    on('play', [draw(1)], { filter: 'snare' }),
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
    { trigger: { on: 'attacked' } },
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
    2,
    'none',
    [dmg(6, 'allFoes'), status('faltering', 1, 'allFoes')],
    {
      trigger: { on: 'foeTurn' },
    },
  ),
  v(
    'rare',
    'death-trap',
    'Death Trap',
    'snare',
    2,
    'none',
    [PREVENT, dmg(18, 'attacker'), status('exposed', 2, 'attacker')],
    {
      trigger: { on: 'attacked' },
    },
  ),
  v('rare', 'trappers-dividend', "Trapper's Dividend", 'power', 2, 'none', [
    on('snare', [draw(1), barrier(5)]),
  ]),
  v('rare', 'spring-the-trap', 'Spring the Trap', 'attack', 1, 'foe', [
    scaled(dmg(6), per('snares', 8)),
  ]),

  // --- Exposed ---
  v('common', 'mark-prey', 'Mark Prey', 'skill', 0, 'foe', [status('exposed', 2, 'target')]),
  v('common', 'unmask', 'Unmask', 'skill', 1, 'none', [status('exposed', 2, 'allFoes')]),
  v('common', 'exploit-weakness', 'Exploit Weakness', 'attack', 1, 'foe', [
    scaled(dmg(5), per('exposed', 2, 'target')),
  ]),
  v('common', 'veil-dance', 'Veil Dance', 'skill', 1, 'none', [
    status('faltering', 1, 'allFoes'),
    barrier(5),
  ]),
  v('uncommon', 'death-mark', 'Death Mark', 'attack', 2, 'foe', [
    dmg(12),
    status('exposed', 3, 'target'),
  ]),
  v('uncommon', 'shadow-volley', 'Shadow Volley', 'attack', 1, 'none', [dmg(4, 'randomFoe', 3)]),
  v('rare', 'coup-de-grace', 'Coup de Grace', 'attack', 3, 'foe', [
    scaled(dmg(16), per('exposed', 3, 'target')),
  ]),

  v('uncommon', 'patient-hunter', 'Patient Hunter', 'power', 1, 'none', [
    on('turnStart', [status('exposed', 1, 'allFoes')]),
  ]),

  // (more Exposed)
  v('common', 'cheap-shot', 'Cheap Shot', 'attack', 1, 'foe', [
    dmg(8),
    status('faltering', 1, 'target'),
  ]),
  v('common', 'stalk', 'Stalk', 'attack', 2, 'foe', [dmg(15), drawNext(2)]),
  v('uncommon', 'strip-the-guard', 'Strip the Guard', 'skill', 1, 'foe', [
    status('exposed', 3, 'target'),
    status('brittle', 2, 'target'),
  ]),
  v('uncommon', 'smoke-bomb', 'Smoke Bomb', 'skill', 1, 'none', [
    status('faltering', 1, 'allFoes'),
    status('exposed', 1, 'allFoes'),
    barrier(4),
  ]),
  v(
    'rare',
    'opening-strike',
    'Opening Strike',
    'attack',
    0,
    'foe',
    [dmg(12), status('exposed', 2, 'target')],
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
  v('common', 'shadow-cloak', 'Shadow Cloak', 'skill', 1, 'none', [barrier(6), draw(1)]),
  v('uncommon', 'banked-breath', 'Banked Breath', 'power', 1, 'none', [
    on('turnEnd', [scaled(barrier(0), per('mana', 2))]),
  ]),
  v('uncommon', 'shadow-step', 'Fade Back', 'skill', 1, 'none', [barrier(7)], { retain: true }),
  v('rare', 'long-game', 'The Long Game', 'power', 2, 'none', [on('turnStart', [draw(1)])]),
  v('uncommon', 'gleeful-trapsmith', 'Gleeful Trapsmith', 'power', 1, 'none', [
    on('play', [dmg(4, 'allFoes')], { filter: 'snare' }),
  ]),
  v('common', 'marked-cards', 'Coiled Patience', 'power', 1, 'none', [
    on('turnEnd', [scaled(dmg(0, 'randomFoe'), per('mana', 2))]),
  ]),
  v(
    'legendary',
    'the-perfect-trap',
    'The Perfect Trap',
    'snare',
    3,
    'none',
    [PREVENT, dmg(22, 'attacker'), status('stunned', 2, 'attacker'), status('shielded', 2)],
    { trigger: { on: 'attacked' }, up: { cost: 2 } },
  ),
  // Patience: the Mana you keep strikes every enemy, and your whole hand is held (DECISIONS #338)
  v('legendary', 'masquerade', 'Masquerade', 'power', 2, 'none', [
    on('turnEnd', [scaled(dmg(0, 'allFoes'), per('mana', 3)), status('holdfast', 1)]),
  ]),
  v('common', 'saved-breath', 'Saved Breath', 'skill', 0, 'none', [manaNext(2), scry(2)], {
    exhaust: true,
  }),
  // (more Patience)
  v('common', 'roll-with-it', 'Weigh the Odds', 'skill', 1, 'none', [scry(3), draw(1)], {
    retain: true,
  }),
  v('uncommon', 'calculated-move', 'Measured Breath', 'skill', 1, 'none', [
    manaNext(2),
    barrier(3),
  ]),
  v('common', 'gambit', 'Waiting Game', 'attack', 1, 'foe', [scaled(dmg(4), per('hand', 2))]),
  v('uncommon', 'second-act', 'Second Act', 'skill', 1, 'none', [status('twinned', 1)], {
    retain: true,
  }),
  v('rare', 'frozen-moment', 'Frozen Moment', 'skill', 1, 'none', [cheapen(1, 'hand')], {
    exhaust: true,
  }),
  v('rare', 'fade-away', 'Fade Away', 'skill', 1, 'none', [status('ghostly', 1)], {
    exhaust: true,
    retain: true,
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
    [dmg(5, 'allFoes'), status('exposed', 1, 'allFoes')],
    { trigger: { on: 'hpLost', min: 3 } },
  ),
  v(
    'common',
    'false-floor',
    'False Floor',
    'snare',
    1,
    'none',
    [dmg(12, 'attacker'), status('exposed', 2, 'attacker')],
    { trigger: { on: 'foeSummons' } },
  ),
  v(
    'common',
    'metronome-trap',
    'Metronome Trap',
    'snare',
    0,
    'none',
    [dmg(4, 'allFoes'), barrier(4)],
    {
      trigger: { on: 'foeTurn' },
    },
  ),
  v('common', 'trapline-rider', 'Trapline Rider', 'attack', 1, 'foe', [
    scaled(dmg(4), per('snares', 1, 'self', 'hits')),
  ]),
  v('uncommon', 'grim-collection', 'Grim Collection', 'attack', 2, 'foe', [
    dmg(10),
    scaled(barrier(0), per('snares', 4)),
  ]),
  v('uncommon', 'trap-door', 'Trap Door', 'power', 1, 'none', [
    on('turnStart', [addTo('trip-line')]),
  ]),

  // --- Exposed (more marks) ---
  v('uncommon', 'dread-gaze', 'Dread Gaze', 'skill', 0, 'foe', [status('exposed', 4, 'target')], {
    exhaust: true,
  }),
  v('common', 'slit-and-run', 'Slit and Run', 'attack', 1, 'foe', [
    dmg(7),
    barrier(4),
    status('exposed', 1, 'target'),
  ]),
  v('rare', 'culling', 'Culling', 'attack', 2, 'none', [
    scaled(dmg(6, 'allFoes'), per('exposed', 2, 'each')),
  ]),
  v('common', 'cripple', 'Cripple', 'skill', 1, 'foe', [
    status('faltering', 2, 'target'),
    status('exposed', 2, 'target'),
    barrier(5),
  ]),

  // --- Patience (more) ---
  // (one more Mana every turn is huge: it starts next turn, and the upgrade only makes it easier to find; DECISIONS #302)
  v('rare', 'deep-pockets', 'Deep Pockets', 'power', 3, 'none', [maxMana(1)], {
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
  v('common', 'discarded-hand', 'Hidden Hand', 'skill', 1, 'none', [draw(2)], { retain: true }),
  v('uncommon', 'sandbag', 'Sandbag', 'attack', 1, 'foe', [scaled(dmg(5), per('mana', 3))]),

  // --- brought back (DECISIONS #337) ---
  v('uncommon', 'spotlight', 'Spotlight', 'skill', 1, 'foe', [
    status('exposed', 3, 'target'),
    status('faltering', 1, 'target'),
  ]),

  // --- glue: cards for any build path (DECISIONS #337) ---
  v('common', 'low-blow', 'Low Blow', 'attack', 0, 'foe', [
    dmg(3),
    status('faltering', 1, 'target'),
  ]),
  v('common', 'tear-the-veil', 'Tear the Veil', 'skill', 1, 'none', [
    status('exposed', 1, 'allFoes'),
    draw(1),
  ]),
  v('common', 'step-aside', 'Step Aside', 'skill', 1, 'none', [barrier(5), drawNext(1)]),
];
