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
  status,
  summon,
} from '../build';

const g = pool('mire', 'gloomfen');

export const MIRE: CardDef[] = [
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
    [doubleSt('doom', 'target')],
    {
      exhaust: true,
    },
  ),
  g('uncommon', 'inevitable', 'Inevitable', 'power', 1, 'none', [
    on('turnStart', [status('doom', 3, 'allFoes')]),
  ]),
  g('uncommon', 'harvest', 'Harvest', 'attack', 1, 'foe', [
    scaled(dmg(4), per('doom', 1, 'target')),
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
    status('doom', 6, 'allFoes'),
    barrier(6),
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
  g('rare', 'requiem', 'Requiem', 'attack', 2, 'foe', [scaled(dmg(0), per('exhausted', 3))]),

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
];
