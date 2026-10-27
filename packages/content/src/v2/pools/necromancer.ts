// Dorian (id necromancer, Gloomfen). Starts with a Bone Thrall. Fate (id doom) is his alone: it kills anything at or below its Fate at
// the end of its turn. Three build paths:
//   Doom     - stack Doom on enemies, double it, and cash it in
//   Thralls  - the Bone Thrall and its kin: buff them, heal them, spend them
//   Ashes    - consumed cards fuel Mire: Souls, Consume payoffs, and a heavy finisher

import type { CardDef } from '@sr/combat';
import {
  growHp,
  ACT,
  addTo,
  barrier,
  dmg,
  doubleSt,
  draw,
  exhaustN,
  fetchCards,
  heal,
  loseHpScaled,
  mana,
  on,
  per,
  pool,
  reclaim,
  revive,
  sacrifice,
  scaled,
  status,
  summon,
} from '../build';

const g = pool('necromancer', 'gloomfen');

export const NECROMANCER: CardDef[] = [
  // --- basics and the token ---
  g('basic', 'grave-touch', 'Grave Touch', 'attack', 1, 'foe', [
    dmg(5),
    status('doom', 4, 'target'),
  ]),
  g('basic', 'bone-ward', 'Bone Ward', 'skill', 1, 'none', [barrier(5, 'allFriends')]),
  g(
    'common',
    'gravesoul',
    'Gravesoul',
    'skill',
    0,
    'none',
    [draw(1), status('doom', 2, 'randomFoe')],
    {
      exhaust: true,
      source: 'token',
    },
  ),

  // --- Doom ---
  g('common', 'tolling-bell', 'Tolling Bell', 'attack', 1, 'foe', [
    dmg(3),
    status('doom', 7, 'target'),
  ]),
  g('common', 'creeping-end', 'Creeping End', 'skill', 1, 'none', [status('doom', 4, 'allFoes')]),
  g('common', 'last-rites', 'Last Rites', 'attack', 2, 'foe', [
    dmg(8),
    status('doom', 10, 'target'),
  ]),
  g(
    'uncommon',
    'hasten-the-end',
    'Hasten the End',
    'skill',
    1,
    'foe',
    [doubleSt('doom', 'target', 2, 20)],
    {
      exhaust: true,
    },
  ),
  g('uncommon', 'inevitable', 'Inevitable', 'power', 1, 'none', [
    on('turnStart', [status('doom', 3, 'allFoes')]),
  ]),
  g('common', 'harvest', 'Harvest', 'attack', 1, 'foe', [
    scaled(dmg(4), per('doom', 0.25, 'target')),
  ]),
  g('uncommon', 'deathknell', 'Deathknell', 'skill', 2, 'foe', [status('doom', 14, 'target')]),
  g(
    'rare',
    'the-final-hour',
    'The Final Hour',
    'skill',
    3,
    'none',
    [status('doom', 14, 'allFoes')],
    {
      exhaust: true,
    },
  ),
  g('rare', 'the-long-night', 'The Long Night', 'power', 2, 'none', [
    on('play', [status('doom', 2, 'target')], { filter: 'attack' }),
  ]),

  g('uncommon', 'omen', 'Omen', 'skill', 1, 'none', [status('doom', 3, 'allFoes'), draw(1)]),

  // (more Doom)
  g(
    'common',
    'mark-of-ending',
    'Mark of Ending',
    'skill',
    0,
    'foe',
    [status('doom', 4, 'target')],
    { exhaust: true },
  ),
  g('uncommon', 'veilpiercer', 'Soul Lance', 'attack', 1, 'foe', [
    dmg(7),
    status('exposed', 2, 'target'),
    status('doom', 2, 'target'),
  ]),
  g('rare', 'oblivion', 'Unmaking', 'skill', 2, 'foe', [status('doom', 25, 'target')], {
    exhaust: true,
  }),
  g(
    'uncommon',
    'wailing-cry',
    'Wailing Cry',
    'attack',
    2,
    'none',
    [dmg(12, 'allFoes'), status('doom', 8, 'allFoes')],
    { exhaust: true },
  ),
  g(
    'rare',
    'thin-the-veil',
    'Thin the Veil',
    'skill',
    2,
    'none',
    [doubleSt('doom', 'allFoes', 1.5, 15)],
    { exhaust: true },
  ),

  // --- Thralls ---
  g('common', 'raise-thrall', 'Raise Thrall', 'summon', 1, 'none', [summon('bone-thrall')]),
  // (the dead that grow instead of only being shielded: DECISIONS #285)
  g('common', 'shared-marrow', 'Shared Marrow', 'skill', 1, 'none', [
    growHp(4),
    barrier(3, 'allFriends'),
  ]),
  g('uncommon', 'grave-colossus', 'Grave Colossus', 'summon', 2, 'none', [
    summon('grave-colossus'),
  ]),
  g('common', 'fen-offering', 'Fen Offering', 'skill', 0, 'ally', [
    status('doom', 8, 'allFoes'),
    barrier(8),
    sacrifice,
  ]),
  g(
    'rare',
    'army-of-the-drowned',
    'Army of the Drowned',
    'summon',
    3,
    'none',
    [summon('bone-thrall'), summon('bone-thrall'), summon('bone-thrall')],
    { exhaust: true },
  ),

  g('uncommon', 'bone-bulwark', 'Bone Bulwark', 'skill', 1, 'ally', [
    barrier(10, 'target'),
    status('might', 1, 'target'),
  ]),

  // (more Thralls)
  g('uncommon', 'calcify', 'Ossify', 'power', 1, 'none', [
    on('turnEnd', [barrier(3, 'allFriends')]),
  ]),
  g('uncommon', 'legion-of-bone', 'Twin Thralls', 'summon', 2, 'none', [
    summon('bone-thrall'),
    summon('bone-thrall'),
  ]),
  g(
    'uncommon',
    'blood-sacrifice',
    'Blood Sacrifice',
    'skill',
    0,
    'ally',
    [mana(2), draw(2), sacrifice],
    {
      exhaust: true,
    },
  ),
  g('rare', 'phylactery', 'Phylactery', 'power', 3, 'none', [
    on('turnStart', [summon('bone-thrall')]),
  ]),
  g('rare', 'bone-choir', 'Bone Choir', 'power', 2, 'none', [on('allyDies', [dmg(8, 'allFoes')])]),
  g(
    'rare',
    'marrow-tide',
    'Marrow Tide',
    'skill',
    2,
    'none',
    [heal(10, 'allFriends'), status('might', 2, 'allFriends')],
    { exhaust: true },
  ),

  // --- Ashes ---
  g('common', 'gather-souls', 'Gather Souls', 'skill', 1, 'none', [addTo('gravesoul', 2)]),
  g('common', 'spectral-ledger', 'Spectral Ledger', 'skill', 1, 'none', [
    scaled(draw(0), per('exhausted', 0.5)),
  ]),
  g('common', 'soulbind', 'Soulbind', 'power', 1, 'none', [
    on('exhaust', [barrier(2), status('doom', 1, 'randomFoe')]),
  ]),
  g('uncommon', 'ashen-bargain', 'Ashen Bargain', 'skill', 1, 'none', [
    exhaustN(9, 'any'),
    scaled(status('doom', 0, 'allFoes'), per('exhausted')),
  ]),

  g('common', 'burial-shroud', 'Burial Shroud', 'skill', 1, 'none', [
    exhaustN(1),
    barrier(8),
    draw(1),
  ]),
  g('uncommon', 'funeral-pyre', 'Funeral Pyre', 'attack', 1, 'none', [
    scaled(dmg(3, 'allFoes'), per('exhausted', 1)),
  ]),
  g('rare', 'ash-ritual', 'Ash Ritual', 'power', 2, 'none', [
    on('exhaust', [status('doom', 2, 'allFoes')]),
  ]),

  // (more Ashes)
  g('common', 'rattle-the-bones', 'Rattle the Bones', 'attack', 1, 'foe', [
    dmg(6),
    addTo('gravesoul'),
  ]),
  g('uncommon', 'cremation', 'Cremation', 'skill', 0, 'none', [exhaustN(1), mana(1)]),
  g('uncommon', 'soul-siphon', 'Soul Siphon', 'attack', 1, 'foe', [
    dmg(7),
    scaled(heal(0), per('exhausted', 0.5)),
  ]),
  g('uncommon', 'ashen-visage', 'Ashen Visage', 'skill', 1, 'none', [
    scaled(barrier(0), per('exhausted', 1)),
    draw(1),
  ]),
  g('rare', 'pyre-of-the-dead', 'Pyre of the Dead', 'attack', 2, 'none', [
    exhaustN(9, 'any'),
    scaled(dmg(0, 'allFoes'), per('exhausted', 1)),
  ]),

  // --- shared tools and glue ---
  g('common', 'sepulchral-gaze', 'Sepulchral Gaze', 'attack', 2, 'none', [
    dmg(6, 'allFoes'),
    status('doom', 2, 'allFoes'),
  ]),
  g('uncommon', 'dredge', 'Grave Digging', 'skill', 1, 'none', [draw(2), barrier(3)]),
  g('uncommon', 'rattling-charge', 'Rattling Charge', 'attack', 2, 'foe', [
    dmg(7, 'target', 2),
    status('doom', 3, 'target'),
  ]),
  g(
    'common',
    'grave-trap',
    'Grave Trap',
    'snare',
    1,
    'none',
    [dmg(5, 'attacker'), status('doom', 4, 'attacker')],
    { trigger: { on: 'attacked' } },
  ),
  g(
    'legendary',
    'the-last-toll',
    'The Last Toll',
    'skill',
    3,
    'none',
    [status('doom', 25, 'allFoes')],
    {
      exhaust: true,
      // a toll that rings sooner and louder
      up: { cost: 2, effects: [status('doom', 30, 'allFoes')] },
    },
  ),
  g('legendary', 'the-drowned-king', 'The Drowned King', 'summon', 3, 'none', [
    summon('drowned-king'),
    status('might', 1, 'allFriends'),
  ]),

  // --- the dead come back: the pieces the build paths were missing ---
  g('common', 'grave-robbery', 'Grave Robbery', 'skill', 1, 'none', [reclaim(1), barrier(4)], {
    exhaust: true,
  }),
  g('uncommon', 'reanimate', 'Rise Again', 'skill', 2, 'none', [revive, barrier(5)]),
  g('uncommon', 'death-feeds', 'Death Feeds', 'power', 1, 'none', [
    on('allyDies', [barrier(8), draw(1)]),
  ]),

  // --- Doom: more ---
  g('common', 'dirge', 'Lament', 'skill', 1, 'foe', [
    scaled(status('doom', 4, 'target'), per('foes', 2)),
  ]),
  g('uncommon', 'reaping-scythe', 'Reaping Scythe', 'attack', 2, 'none', [
    scaled(dmg(5, 'allFoes'), per('doom', 0.25, 'each')),
  ]),
  g('common', 'grim-tally', 'Grim Tally', 'attack', 1, 'foe', [
    scaled(dmg(3), per('played', 2)),
    status('doom', 3, 'target'),
  ]),
  g(
    'rare',
    'final-reckoning',
    'Final Reckoning',
    'skill',
    2,
    'foe',
    [loseHpScaled(per('doom', 0.5, 'target'))],
    { exhaust: true },
  ),

  // --- Thralls: more ---
  g('common', 'rally-the-dead', 'Rally the Dead', 'skill', 1, 'none', [
    ACT,
    status('might', 1, 'allFriends', true),
  ]),
  g('common', 'tithe-of-bone', 'Tithe of Bone', 'attack', 1, 'foe', [
    scaled(dmg(4), per('allies', 4)),
  ]),
  g('common', 'bone-rain', 'Bone Rain', 'skill', 1, 'ally', [
    dmg(13, 'allFoes'),
    status('doom', 3, 'allFoes'),
    sacrifice,
  ]),
  g('common', 'pallbearer', 'Pallbearer', 'power', 1, 'none', [
    on('summon', [dmg(5, 'randomFoe')]),
  ]),
  // (allies are shielded, not made to act: DECISIONS #311)
  g('rare', 'bonded-dead', 'Bonded Dead', 'power', 2, 'none', [
    on('allyDies', [status('doom', 4, 'allFoes')]),
  ]),

  // --- Ashes: more ---
  g('common', 'bone-sift', 'Bone Sift', 'skill', 0, 'none', [exhaustN(1), draw(2)]),
  g('common', 'tomb-feast', 'Tomb Feast', 'attack', 1, 'foe', [dmg(8), exhaustN(1), heal(4)]),
  g('common', 'wake-the-ashes', 'Wake the Ashes', 'skill', 1, 'none', [reclaim(2)], {
    exhaust: true,
  }),
  g('rare', 'exhume', 'Disinter', 'skill', 2, 'none', [fetchCards(2), addTo('gravesoul')]),
  g('uncommon', 'ashfall', 'Ashfall', 'power', 1, 'none', [on('exhaust', [dmg(3, 'randomFoe')])]),
  g('rare', 'last-embers', 'Last Embers', 'skill', 1, 'none', [
    exhaustN(9, 'any'),
    scaled(mana(0), per('exhausted', 0.5)),
  ]),
  g('rare', 'soul-furnace', 'Soul Furnace', 'power', 2, 'none', [
    on('turnStart', [addTo('gravesoul')]),
  ]),

  // --- brought back (DECISIONS #337) ---
  g('common', 'creeping-dread', 'Creeping Dread', 'attack', 1, 'none', [
    dmg(3, 'allFoes'),
    status('doom', 3, 'allFoes'),
  ]),
  g('common', 'thralls-cue', "Thrall's Cue", 'skill', 1, 'none', [ACT, barrier(4)]),
  g('uncommon', 'ghostform', 'Spirit Walk', 'skill', 1, 'none', [status('ghostly', 1), draw(1)], {
    exhaust: true,
  }),
];
