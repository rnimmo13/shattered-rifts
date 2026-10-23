// Vesper Nightlace (Umbral). No companions. Three lanes:
//   Snares  - set traps with different triggers; payoffs for having them out
//   Exposed - mark the enemy, then spend the mark
//   Bluff   - hold Mana and cards back: Retain, Scry, patience

import type { CardDef } from '@sr/combat';
import {
  addTo,
  barrier,
  dmg,
  draw,
  lose,
  mana,
  manaNext,
  on,
  per,
  pool,
  PREVENT,
  scaled,
  scry,
  status,
  drawNext,
  discard,
  cheapen,
  discoverOp,
  doubleSt,
  fetchCards,
  maxMana,
} from '../build';

const v = pool('vesper', 'umbral');

export const VESPER: CardDef[] = [
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

  // --- Snares ---
  v('common', 'trip-line', 'Trip Line', 'snare', 0, 'none', [dmg(6, 'attacker')], {
    trigger: { on: 'attacked' },
  }),
  v(
    'common',
    'hollow-snare',
    'Hollow Snare',
    'snare',
    1,
    'none',
    [dmg(8, 'attacker'), status('faltering', 1, 'attacker')],
    { trigger: { on: 'attacked' } },
  ),
  v(
    'common',
    'whisper-net',
    'Whisper Net',
    'snare',
    1,
    'none',
    [dmg(8, 'attacker'), status('stunned', 1, 'attacker')],
    { trigger: { on: 'foeSummons' } },
  ),
  v(
    'common',
    'cage',
    'Cage',
    'snare',
    1,
    'none',
    [dmg(10, 'attacker'), status('faltering', 1, 'attacker')],
    { trigger: { on: 'foeDefends' } },
  ),
  v('common', 'snare-kit', 'Snare Kit', 'skill', 1, 'none', [addTo('trip-line', 2)], {
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
  v('uncommon', 'pain-link', 'Pain Link', 'snare', 0, 'none', [dmg(6, 'allFoes')], {
    trigger: { on: 'hpLost', min: 5 },
  }),
  v('uncommon', 'time-bomb', 'Time Bomb', 'snare', 1, 'none', [dmg(9, 'allFoes')], {
    trigger: { on: 'foeTurn' },
  }),
  v('uncommon', 'spring-loaded', 'Spring-Loaded', 'skill', 1, 'none', [
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
    'Silencing Snare',
    'snare',
    2,
    'none',
    [status('stunned', 1, 'attacker'), status('shielded', 1)],
    { trigger: { on: 'attacked' } },
  ),
  v('rare', 'echo-trap', 'Echo Trap', 'power', 2, 'none', [on('snare', [barrier(5), draw(1)])]),

  // (more Snares)
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
    'Snare Net',
    'snare',
    2,
    'none',
    [dmg(4, 'allFoes'), status('faltering', 1, 'allFoes')],
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
    scaled(dmg(5), per('exposed', 3, 'target')),
  ]),
  v('common', 'tear-the-veil', 'Tear the Veil', 'skill', 1, 'none', [
    status('exposed', 1, 'allFoes'),
    draw(1),
  ]),
  v('common', 'ambush', 'Ambush', 'attack', 2, 'foe', [dmg(14), status('exposed', 1, 'target')]),
  v('common', 'veil-dance', 'Veil Dance', 'skill', 1, 'none', [
    status('faltering', 1, 'allFoes'),
    barrier(5),
  ]),
  v('uncommon', 'death-mark', 'Death Mark', 'attack', 2, 'foe', [
    dmg(12),
    status('exposed', 3, 'target'),
  ]),
  v('uncommon', 'shadow-volley', 'Shadow Volley', 'attack', 1, 'none', [dmg(4, 'randomFoe', 3)]),
  v('uncommon', 'spotlight', 'Spotlight', 'skill', 1, 'foe', [
    status('exposed', 3, 'target'),
    status('faltering', 1, 'target'),
  ]),
  v('rare', 'coup-de-grace', 'Coup de Grace', 'attack', 3, 'foe', [
    scaled(dmg(16), per('exposed', 6, 'target')),
  ]),

  v('common', 'hamstring', 'Hamstring', 'attack', 1, 'foe', [
    dmg(6),
    status('exposed', 2, 'target'),
  ]),
  v('uncommon', 'patient-hunter', 'Patient Hunter', 'power', 1, 'none', [
    on('turnStart', [status('exposed', 1, 'allFoes')]),
  ]),

  // (more Exposed)
  v('common', 'low-blow', 'Low Blow', 'attack', 0, 'foe', [
    dmg(3),
    status('faltering', 1, 'target'),
  ]),
  v('common', 'cheap-shot', 'Cheap Shot', 'attack', 1, 'foe', [
    dmg(8),
    status('faltering', 1, 'target'),
  ]),
  v('common', 'stalk', 'Stalk', 'attack', 2, 'foe', [dmg(15), drawNext(2)]),
  v('uncommon', 'sweep-the-legs', 'Sweep the Legs', 'skill', 2, 'foe', [
    status('faltering', 2, 'target'),
    barrier(12),
  ]),
  v('uncommon', 'strip-the-guard', 'Strip the Guard', 'skill', 1, 'foe', [
    status('exposed', 3, 'target'),
    status('brittle', 2, 'target'),
  ]),
  v('uncommon', 'smoke-bomb', 'Smoke Bomb', 'skill', 1, 'none', [
    status('faltering', 1, 'allFoes'),
    status('exposed', 1, 'allFoes'),
    barrier(4),
  ]),
  v('uncommon', 'pin-cushion', 'Pin Cushion', 'attack', 1, 'foe', [scaled(dmg(4), per('hand', 1))]),
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

  // --- Bluff ---
  v('common', 'cold-read', 'Cold Read', 'skill', 0, 'none', [scry(4)]),
  v('common', 'patient-blade', 'Patient Blade', 'attack', 1, 'foe', [dmg(9)], { retain: true }),
  v('common', 'shadow-cloak', 'Shadow Cloak', 'skill', 1, 'none', [barrier(6), draw(1)]),
  v('common', 'dark-study', 'Dark Study', 'skill', 1, 'none', [draw(2)]),
  v('uncommon', 'banked-breath', 'Banked Breath', 'power', 1, 'none', [
    on('turnEnd', [scaled(barrier(0), per('mana', 2))]),
  ]),
  v('uncommon', 'stolen-moment', 'Stolen Moment', 'skill', 0, 'none', [mana(1), draw(1), scry(2)], {
    exhaust: true,
  }),
  v('uncommon', 'shadow-step', 'Shadow Step', 'skill', 1, 'none', [barrier(7)], { retain: true }),
  v('uncommon', 'cold-bargain', 'Cold Bargain', 'skill', 0, 'none', [lose(3), mana(1), draw(1)], {
    exhaust: true,
  }),
  v('rare', 'long-game', 'The Long Game', 'power', 2, 'none', [on('turnStart', [draw(1)])]),
  v('uncommon', 'spare-traps', 'Spare Traps', 'skill', 0, 'none', [addTo('trip-line'), draw(1)], {
    exhaust: true,
  }),
  v('rare', 'gleeful-trapsmith', 'Gleeful Trapsmith', 'power', 1, 'none', [
    on('play', [dmg(4, 'allFoes')], { filter: 'snare' }),
  ]),
  v('common', 'break-the-guard', 'Break the Guard', 'skill', 1, 'foe', [
    status('brittle', 3, 'target'),
    status('exposed', 1, 'target'),
  ]),
  v('uncommon', 'mask-of-faces', 'Mask of Faces', 'skill', 1, 'none', [status('steadfast', 2)]),
  v('uncommon', 'marked-cards', 'Marked Cards', 'power', 1, 'none', [
    on('discard', [dmg(3, 'randomFoe')]),
  ]),
  v('rare', 'between-worlds', 'Between Worlds', 'skill', 2, 'none', [status('ghostly', 2)], {
    exhaust: true,
  }),
  v(
    'legendary',
    'the-perfect-trap',
    'The Perfect Trap',
    'snare',
    3,
    'none',
    [PREVENT, dmg(22, 'attacker'), status('stunned', 1, 'attacker'), status('shielded', 2)],
    { trigger: { on: 'attacked' } },
  ),
  v('legendary', 'masquerade', 'Masquerade', 'power', 2, 'none', [
    on('snare', [draw(2), mana(1), dmg(4, 'allFoes')]),
  ]),
  v('uncommon', 'saved-breath', 'Saved Breath', 'skill', 0, 'none', [manaNext(2), scry(2)], {
    exhaust: true,
  }),
  // (more Bluff)
  v('common', 'step-aside', 'Step Aside', 'skill', 1, 'none', [barrier(5), drawNext(1)]),
  v('common', 'quick-study', 'Quick Study', 'skill', 0, 'none', [draw(1), discard(1)]),
  v('uncommon', 'roll-with-it', 'Roll with It', 'skill', 1, 'none', [draw(3), discard(1)]),
  v('uncommon', 'sleight-of-hand', 'Sleight of Hand', 'skill', 1, 'none', [draw(2)], {
    onDiscard: [draw(2)],
  }),
  v('uncommon', 'calculated-move', 'Calculated Move', 'skill', 0, 'none', [mana(1)], {
    onDiscard: [mana(2)],
  }),
  v(
    'uncommon',
    'gambit',
    'Gambit',
    'skill',
    0,
    'none',
    [discard(9, 'any'), scaled(draw(0), per('discarded'))],
    { exhaust: true },
  ),
  v('rare', 'second-act', 'Second Act', 'skill', 1, 'none', [status('twinned', 1)]),
  v('rare', 'frozen-moment', 'Frozen Moment', 'skill', 2, 'none', [cheapen(9, 'hand')], {
    exhaust: true,
  }),
  v('rare', 'fade-away', 'Fade Away', 'skill', 1, 'none', [status('ghostly', 1)], {
    exhaust: true,
  }),
  v('rare', 'misdirection', 'Misdirection', 'power', 1, 'none', [on('discard', [barrier(4)])]),
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
  v('rare', 'shadow-pace', 'Shadow Pace', 'power', 2, 'none', [
    on('turnStart', [draw(1), barrier(4)]),
  ]),
  v('rare', 'perfect-alibi', 'Perfect Alibi', 'skill', 1, 'none', [barrier(20), discard(1)]),

  // --- Snares (more traps) ---
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
    'uncommon',
    'poison-pantry',
    'Poison Pantry',
    'snare',
    1,
    'none',
    [dmg(8, 'attacker'), status('brittle', 2, 'attacker')],
    { trigger: { on: 'foeDefends' } },
  ),
  v(
    'uncommon',
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
  v(
    'uncommon',
    'patchwork-traps',
    'Patchwork Traps',
    'skill',
    1,
    'none',
    [addTo('hollow-snare'), barrier(5)],
    { exhaust: true },
  ),
  v('uncommon', 'grim-collection', 'Grim Collection', 'attack', 2, 'foe', [
    dmg(10),
    scaled(barrier(0), per('snares', 4)),
  ]),
  v('rare', 'trap-door', 'Trap Door', 'power', 1, 'none', [on('turnStart', [addTo('trip-line')])]),

  // --- Exposed (more marks) ---
  v('common', 'pressure-point', 'Pressure Point', 'attack', 1, 'foe', [
    scaled(dmg(4), per('exposed', 2, 'target')),
    status('exposed', 1, 'target'),
  ]),
  v('common', 'twin-fangs', 'Twin Fangs', 'attack', 1, 'foe', [
    dmg(4, 'target', 2),
    status('exposed', 1, 'target'),
  ]),
  v('uncommon', 'dread-gaze', 'Dread Gaze', 'skill', 0, 'foe', [status('exposed', 4, 'target')], {
    exhaust: true,
  }),
  v('uncommon', 'compound-fear', 'Compound Fear', 'skill', 1, 'foe', [doubleSt('exposed')], {
    exhaust: true,
  }),
  v('uncommon', 'opportunist', 'Opportunist', 'power', 1, 'none', [
    on('exhaust', [dmg(5, 'randomFoe'), status('exposed', 1, 'randomFoe')]),
  ]),
  v('common', 'slit-and-run', 'Slit and Run', 'attack', 1, 'foe', [
    dmg(7),
    barrier(4),
    status('exposed', 1, 'target'),
  ]),
  v('rare', 'culling', 'Culling', 'attack', 2, 'none', [
    scaled(dmg(6, 'allFoes'), per('exposed', 3, 'each')),
  ]),
  v('common', 'cripple', 'Cripple', 'skill', 1, 'foe', [
    status('faltering', 2, 'target'),
    status('exposed', 2, 'target'),
    barrier(5),
  ]),

  // --- Bluff (more patience) ---
  v('common', 'bated-breath', 'Bated Breath', 'skill', 1, 'none', [barrier(8)], { retain: true }),
  v('rare', 'deep-pockets', 'Deep Pockets', 'power', 3, 'none', [maxMana(1)]),
  v('common', 'read-the-room', 'Read the Room', 'skill', 1, 'none', [scry(3), draw(1), barrier(4)]),
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
  v('common', 'discarded-hand', 'Discarded Hand', 'skill', 0, 'none', [discard(2), draw(2)]),
  v('uncommon', 'sandbag', 'Sandbag', 'attack', 1, 'foe', [scaled(dmg(5), per('mana', 3))]),
  v(
    'rare',
    'curtain-call',
    'Curtain Call',
    'skill',
    1,
    'none',
    [draw(1), fetchCards(2, 'hand', 'snare')],
    {
      exhaust: true,
    },
  ),
  v(
    'uncommon',
    'trick-of-the-light',
    'Trick of the Light',
    'skill',
    0,
    'none',
    [scry(2), draw(1)],
    {
      onDiscard: [barrier(6)],
    },
  ),
  v('uncommon', 'house-edge', 'House Edge', 'power', 1, 'none', [on('draw', [barrier(1)])]),
];
