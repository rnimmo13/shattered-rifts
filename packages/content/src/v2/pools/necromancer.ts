// Mire, the Gravewarden (Gloomfen). Starts with a Bone Thrall. Doom is Mire's alone: it kills anything at or below its Doom at
// the end of its turn. Three lanes:
//   Doom     - stack Doom on enemies, double it, and cash it in
//   Thralls  - the Bone Thrall and its kin: buff them, heal them, spend them
//   Ashes    - consumed cards fuel Mire: Souls, Consume payoffs, and a heavy finisher

import type { CardDef } from '@sr/combat';
import {
  ACT,
  addTo,
  barrier,
  dmg,
  doubleSt,
  draw,
  exhaustN,
  fetchCards,
  heal,
  lose,
  mana,
  on,
  per,
  pool,
  reclaim,
  revive,
  sacrifice,
  scaled,
  scry,
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
  g('common', 'gravesoul', 'Gravesoul', 'skill', 0, 'none', [draw(2)], {
    exhaust: true,
    source: 'token',
  }),

  // --- Doom ---
  g('common', 'tolling-bell', 'Tolling Bell', 'attack', 1, 'foe', [
    dmg(3),
    status('doom', 7, 'target'),
  ]),
  g('common', 'withering-word', 'Withering Word', 'skill', 1, 'foe', [
    status('doom', 5, 'target'),
    status('faltering', 1, 'target'),
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
  g('uncommon', 'harvest', 'Harvest', 'attack', 1, 'foe', [
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

  g('common', 'grave-whisper', 'Grave Whisper', 'attack', 1, 'foe', [
    dmg(5),
    status('doom', 5, 'target'),
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
  g('common', 'creeping-dread', 'Creeping Dread', 'attack', 1, 'none', [
    dmg(3, 'allFoes'),
    status('doom', 3, 'allFoes'),
  ]),
  g('uncommon', 'countdown', 'Countdown', 'power', 1, 'none', [
    on('turnStart', [status('doom', 2, 'randomFoe')]),
  ]),
  g('uncommon', 'veilpiercer', 'Veilpiercer', 'attack', 1, 'foe', [
    dmg(7),
    status('exposed', 2, 'target'),
    status('doom', 2, 'target'),
  ]),
  g('rare', 'oblivion', 'Oblivion', 'skill', 2, 'foe', [status('doom', 25, 'target')], {
    exhaust: true,
  }),
  g(
    'rare',
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
  g('common', 'bone-chorus', 'Bone Chorus', 'skill', 1, 'ally', [
    status('might', 2, 'target'),
    heal(4, 'target'),
  ]),
  g('common', 'shared-marrow', 'Shared Marrow', 'skill', 1, 'none', [
    heal(4, 'allFriends'),
    barrier(3, 'allFriends'),
  ]),
  g('common', 'thralls-cue', "Thrall's Cue", 'skill', 1, 'none', [ACT, barrier(4)]),
  g('uncommon', 'grave-colossus', 'Grave Colossus', 'summon', 2, 'none', [
    summon('grave-colossus'),
  ]),
  g('uncommon', 'unquiet-rest', 'Unquiet Rest', 'power', 2, 'none', [
    on('turnStart', [heal(3, 'allFriends')]),
  ]),
  g('uncommon', 'fen-offering', 'Fen Offering', 'skill', 0, 'ally', [
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
  g('rare', 'deathless', 'Deathless', 'power', 2, 'none', [
    on('summon', [barrier(6, 'allFriends')]),
  ]),

  g('uncommon', 'bone-bulwark', 'Bone Bulwark', 'skill', 1, 'ally', [
    barrier(10, 'target'),
    status('might', 1, 'target'),
  ]),

  // (more Thralls)
  g('common', 'bone-guard', 'Bone Guard', 'skill', 1, 'ally', [
    barrier(9, 'target'),
    barrier(4, 'hero'),
  ]),
  g('common', 'unleash-the-dead', 'Unleash the Dead', 'attack', 1, 'foe', [
    scaled(dmg(4), per('allies', 3)),
  ]),
  g('uncommon', 'calcify', 'Calcify', 'power', 1, 'none', [
    on('turnEnd', [barrier(3, 'allFriends')]),
  ]),
  g('uncommon', 'legion-of-bone', 'Legion of Bone', 'summon', 2, 'none', [
    summon('bone-thrall'),
    summon('bone-thrall'),
  ]),
  g(
    'rare',
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
  g('common', 'bone-cairn', 'Bone Cairn', 'skill', 1, 'none', [
    exhaustN(1),
    barrier(9),
    addTo('gravesoul'),
  ]),
  g('common', 'ghost-light', 'Ghost Light', 'skill', 0, 'none', [heal(3), draw(1)], {
    exhaust: true,
  }),
  g('uncommon', 'spectral-ledger', 'Spectral Ledger', 'skill', 1, 'none', [
    scaled(draw(0), per('exhausted', 0.5)),
  ]),
  g('uncommon', 'soulbind', 'Soulbind', 'power', 1, 'none', [on('exhaust', [barrier(3)])]),
  g('uncommon', 'ashen-bargain', 'Ashen Bargain', 'skill', 1, 'none', [
    exhaustN(9, 'any'),
    scaled(status('doom', 0, 'allFoes'), per('exhausted')),
  ]),
  g('rare', 'requiem', 'Requiem', 'attack', 2, 'foe', [scaled(dmg(0), per('exhausted', 1))]),

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
  g('rare', 'necrotic-return', 'Necrotic Return', 'skill', 1, 'none', [reclaim(3)], {
    exhaust: true,
  }),
  g('rare', 'soul-harvest', 'Soul Harvest', 'power', 2, 'none', [
    on('exhaust', [heal(2), status('doom', 1, 'allFoes')]),
  ]),
  g('rare', 'ghostform', 'Ghostform', 'skill', 1, 'none', [status('ghostly', 1)], {
    exhaust: true,
  }),

  // --- shared tools and glue ---
  g('common', 'bone-shard', 'Bone Shard', 'attack', 1, 'foe', [dmg(8)]),
  g('common', 'burial-rites', 'Burial Rites', 'skill', 1, 'none', [barrier(8)]),
  g('common', 'sepulchral-gaze', 'Sepulchral Gaze', 'attack', 2, 'none', [
    dmg(6, 'allFoes'),
    status('doom', 2, 'allFoes'),
  ]),
  g('uncommon', 'dredge', 'Dredge', 'skill', 1, 'none', [draw(2), barrier(3)]),
  g('uncommon', 'rattling-charge', 'Rattling Charge', 'attack', 2, 'foe', [
    dmg(7, 'target', 2),
    status('doom', 3, 'target'),
  ]),
  g(
    'uncommon',
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
  g('uncommon', 'soul-tithe', 'Soul Tithe', 'skill', 0, 'none', [lose(4), mana(2)], {
    exhaust: true,
  }),

  // --- the dead come back: the pieces the lanes were missing ---
  g('uncommon', 'grave-robbery', 'Grave Robbery', 'skill', 1, 'none', [reclaim(1), barrier(4)], {
    exhaust: true,
  }),
  g('uncommon', 'reanimate', 'Reanimate', 'skill', 2, 'none', [revive, barrier(5)]),
  g('rare', 'death-feeds', 'Death Feeds', 'power', 1, 'none', [
    on('allyDies', [barrier(8), draw(1)]),
  ]),
  g(
    'common',
    'bone-pile',
    'Bone Pile',
    'skill',
    1,
    'foe',
    [status('doom', 4, 'target'), reclaim(1)],
    {
      exhaust: true,
    },
  ),

  // --- Doom: more ---
  g('common', 'tomb-chill', 'Tomb Chill', 'attack', 1, 'foe', [
    dmg(4),
    status('doom', 3, 'target'),
    draw(1),
  ]),
  g('common', 'dirge', 'Dirge', 'skill', 1, 'foe', [
    scaled(status('doom', 4, 'target'), per('foes', 2)),
  ]),
  g(
    'common',
    'fatal-omen',
    'Fatal Omen',
    'skill',
    0,
    'foe',
    [status('doom', 3, 'target'), status('exposed', 1, 'target')],
    { exhaust: true },
  ),
  g('common', 'gravesight', 'Gravesight', 'skill', 1, 'none', [
    scry(2),
    status('doom', 3, 'randomFoe'),
  ]),
  g('uncommon', 'reaping-scythe', 'Reaping Scythe', 'attack', 2, 'none', [
    scaled(dmg(5, 'allFoes'), per('doom', 0.25, 'each')),
  ]),
  g('uncommon', 'grim-tally', 'Grim Tally', 'attack', 1, 'foe', [
    scaled(dmg(3), per('played', 2)),
    status('doom', 3, 'target'),
  ]),
  g('uncommon', 'toll-in-advance', 'Toll in Advance', 'skill', 1, 'foe', [
    status('doom', 9, 'target'),
    lose(4),
  ]),
  g('rare', 'ominous-chimes', 'Ominous Chimes', 'power', 2, 'none', [
    on('draw', [status('doom', 1, 'randomFoe')]),
  ]),
  g(
    'rare',
    'final-reckoning',
    'Final Reckoning',
    'attack',
    3,
    'foe',
    [scaled(dmg(0), per('doom', 1, 'target'))],
    { exhaust: true },
  ),

  // --- Thralls: more ---
  g('common', 'crypt-recruit', 'Crypt Recruit', 'summon', 1, 'none', [
    summon('bone-thrall'),
    barrier(4),
  ]),
  g('common', 'rally-the-dead', 'Rally the Dead', 'skill', 1, 'none', [
    ACT,
    status('might', 1, 'allFriends', true),
  ]),
  g('common', 'tithe-of-bone', 'Tithe of Bone', 'attack', 1, 'foe', [
    scaled(dmg(4), per('allies', 4)),
  ]),
  g('common', 'grim-mending', 'Grim Mending', 'skill', 1, 'ally', [
    heal(12, 'target'),
    barrier(6, 'target'),
  ]),
  g('uncommon', 'bone-rain', 'Bone Rain', 'skill', 1, 'ally', [
    dmg(13, 'allFoes'),
    status('doom', 3, 'allFoes'),
    sacrifice,
  ]),
  g('uncommon', 'pallbearer', 'Pallbearer', 'power', 1, 'none', [
    on('summon', [dmg(5, 'randomFoe')]),
  ]),
  g('uncommon', 'second-death', 'Second Death', 'skill', 2, 'none', [revive, ACT]),
  g('rare', 'bonded-dead', 'Bonded Dead', 'power', 2, 'none', [
    on('allyDies', [status('doom', 4, 'allFoes')]),
  ]),

  // --- Ashes: more ---
  g('common', 'bone-sift', 'Bone Sift', 'skill', 0, 'none', [exhaustN(1), draw(2)]),
  g('common', 'ember-grasp', 'Ember Grasp', 'attack', 0, 'foe', [
    scaled(dmg(3), per('exhausted', 1)),
  ]),
  g('common', 'tomb-feast', 'Tomb Feast', 'attack', 1, 'foe', [dmg(8), exhaustN(1), heal(4)]),
  g('uncommon', 'wake-the-ashes', 'Wake the Ashes', 'skill', 1, 'none', [reclaim(2)], {
    exhaust: true,
  }),
  g('uncommon', 'exhume', 'Exhume', 'skill', 2, 'none', [fetchCards(2), addTo('gravesoul')]),
  g('uncommon', 'ashfall', 'Ashfall', 'power', 1, 'none', [on('exhaust', [dmg(3, 'randomFoe')])]),
  g('rare', 'last-embers', 'Last Embers', 'skill', 1, 'none', [
    exhaustN(9, 'any'),
    scaled(mana(0), per('exhausted', 0.5)),
  ]),
  g('rare', 'soul-furnace', 'Soul Furnace', 'power', 2, 'none', [
    on('turnStart', [addTo('gravesoul')]),
  ]),
];
