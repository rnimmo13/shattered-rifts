// Kesh the Unfed (Wyldmaw). Starts with a Hound. Three build paths:
//   Bloodrage  - pay HP for Might and tempo, then hit with it
//   Pack       - buff and feed the companions
//   Feast      - Exhaust engine: eat your own cards, heal, hit for what you have consumed (and devour allies)

import type { CardDef } from '@sr/combat';
import {
  ACT,
  barrier,
  dmg,
  doubleSt,
  draw,
  exhaustN,
  fetchCards,
  heal,
  lose,
  mana,
  maxMana,
  on,
  per,
  pool,
  reclaim,
  sacrifice,
  scaled,
  status,
  summon,
} from '../build';

const k = pool('hunter', 'wyldmaw');

export const HUNTER: CardDef[] = [
  // --- basics ---
  k('basic', 'savage-bite', 'Savage Bite', 'attack', 1, 'foe', [dmg(8), lose(2)]),
  k('basic', 'blood-frenzy', 'Blood Frenzy', 'skill', 1, 'none', [
    lose(3),
    status('might', 2, 'allFriends'),
  ]),

  // --- Bloodrage ---
  k('common', 'rend', 'Rend', 'attack', 1, 'foe', [dmg(11), lose(3)]),
  k('common', 'twin-fang', 'Twin Fang', 'attack', 1, 'foe', [dmg(6, 'target', 2), lose(2)]),
  k('common', 'feral-instinct', 'Feral Instinct', 'skill', 0, 'none', [lose(2), draw(2)], {
    exhaust: true,
  }),
  k('common', 'pain-ward', 'Pain Ward', 'skill', 1, 'none', [
    barrier(5),
    scaled(barrier(0), per('missingHp', 0.25)),
  ]),
  // (upgraded it loses less HP but still draws 3: four copies drawing 4 each emptied the deck on the first turn; DECISIONS #237)
  k(
    'rare',
    'blood-tithe',
    'Blood Tithe',
    'skill',
    0,
    'none',
    [lose(6), mana(2), draw(2), status('might', 1, 'allFriends')],
    {
      exhaust: true,
      up: { effects: [lose(4), mana(2), draw(2), status('might', 1, 'allFriends')] },
    },
  ),
  k('uncommon', 'crushing-blow', 'Crushing Blow', 'attack', 2, 'foe', [
    scaled(dmg(8), per('might', 2)),
  ]),
  k('uncommon', 'run-wild', 'Run Wild', 'attack', 2, 'foe', [
    dmg(6, 'target', 2),
    status('might', 1),
  ]),
  k('uncommon', 'ravage', 'Ravage', 'attack', 2, 'none', [dmg(7, 'allFoes'), lose(3)]),
  k('rare', 'the-hunger', 'The Hunger', 'power', 1, 'none', [lose(4), status('might', 2)]),
  k(
    'rare',
    'slip-the-leash',
    'Slip the Leash',
    'skill',
    1,
    'none',
    [doubleSt('might', 'self', 2, 6)],
    {
      exhaust: true,
    },
  ),
  k('rare', 'berserker', 'Berserker', 'power', 2, 'none', [on('turnStart', [lose(2), mana(1)])]),

  k('uncommon', 'berserk', 'Red Haze', 'skill', 1, 'none', [lose(4), status('might', 2)], {
    exhaust: true,
  }),

  // (more Bloodrage)
  k('common', 'blood-rush', 'Blood Rush', 'attack', 0, 'foe', [dmg(4), lose(1)]),
  k('common', 'ripping-claws', 'Ripping Claws', 'attack', 1, 'none', [dmg(5, 'allFoes'), lose(1)]),
  k('common', 'scavenge', 'Rummage', 'attack', 1, 'foe', [dmg(8), fetchCards(1, 'draw', 'attack')]),
  k('common', 'pound', 'Pound', 'attack', 1, 'foe', [dmg(8), draw(1), lose(1)]),
  k('common', 'bone-crack', 'Bone Crack', 'attack', 1, 'foe', [
    dmg(7),
    status('exposed', 2, 'target'),
  ]),
  k('common', 'flesh-wound', 'Flesh Wound', 'skill', 1, 'none', [lose(2), barrier(14)]),
  k('uncommon', 'scar-tissue', 'Scar Tissue', 'power', 1, 'none', [
    on('loseHp', [barrier(3), status('might', 1, 'allFriends', true)]),
  ]),
  k(
    'uncommon',
    'whirling-maul',
    'Whirling Maul',
    'attack',
    0,
    'none',
    [
      scaled({ op: 'damage', amount: 6, hits: 0, to: 'allFoes' }, per('x', 1, undefined, 'hits')),
      lose(2),
    ],
    { x: true },
  ),
  k('uncommon', 'reckless-blow', 'Reckless Blow', 'attack', 1, 'foe', [
    lose(2),
    dmg(7, 'target', 2),
  ]),
  k('uncommon', 'frenzied-gulp', 'Frenzied Gulp', 'skill', 0, 'none', [draw(3), lose(3)], {
    exhaust: true,
  }),
  k('uncommon', 'hamstring-slam', 'Hamstring Slam', 'attack', 2, 'foe', [
    dmg(11),
    status('faltering', 2, 'target'),
    ACT,
  ]),
  k('rare', 'ancient-fury', 'Ancient Fury', 'power', 2, 'none', [
    on('turnStart', [status('might', 2), lose(2)]),
  ]),
  k('rare', 'skullcrusher', 'Skullcrusher', 'attack', 3, 'foe', [dmg(26), ACT]),
  k('rare', 'scarred-warrior', 'Scarred Warrior', 'power', 1, 'none', [
    on('turnStart', [lose(1), barrier(8)]),
  ]),
  k('rare', 'unleash', 'Primal Surge', 'skill', 0, 'none', [lose(2), status('might', 2)], {
    exhaust: true,
  }),
  k('rare', 'frenzied-thrash', 'Frenzied Thrash', 'attack', 1, 'foe', [
    dmg(4, 'target', 2),
    exhaustN(1, 'random'),
  ]),

  // --- Pack ---
  k('common', 'heel', 'Heel', 'summon', 1, 'none', [summon('hound')]),
  k('common', 'call-gnashlings', 'Call Gnashlings', 'summon', 1, 'none', [
    summon('gnashling'),
    summon('gnashling'),
  ]),
  k('common', 'pack-tactics', 'Pack Tactics', 'skill', 1, 'none', [
    status('might', 1, 'allFriends'),
    barrier(4, 'allFriends'),
  ]),
  k('common', 'sic-em', 'Loose the Hound', 'skill', 1, 'ally', [
    status('might', 2, 'target'),
    heal(4, 'target'),
  ]),
  k('common', 'howl', 'Howl', 'skill', 1, 'none', [ACT]),
  k('common', 'thick-hide', 'Thick Hide', 'skill', 1, 'none', [barrier(5, 'allFriends')]),
  k('uncommon', 'savage-command', 'Savage Command', 'skill', 2, 'none', [
    ACT,
    status('might', 1, 'allFriends'),
  ]),
  k('uncommon', 'pack-bond', 'Pack Bond', 'power', 2, 'none', [
    on('turnStart', [barrier(3, 'allFriends')]),
  ]),
  k('rare', 'alpha-call', 'Alpha Call', 'summon', 2, 'none', [
    summon('hound'),
    status('might', 1, 'allFriends'),
  ]),
  k('rare', 'unchained', 'Unchained', 'power', 2, 'none', [status('might', 3, 'allFriends')]),
  k('rare', 'den-mother', 'Den Mother', 'summon', 3, 'none', [summon('dire-wolf')]),

  k('uncommon', 'feeding-time', 'Feeding Time', 'skill', 1, 'ally', [
    heal(8, 'target'),
    status('might', 1, 'target'),
  ]),

  // (more Pack)
  k('uncommon', 'rally-the-pack', 'Rally the Pack', 'skill', 2, 'none', [summon('hound'), ACT]),
  k('uncommon', 'trail-of-blood', 'Trail of Blood', 'power', 1, 'none', [
    on('summon', [status('might', 1, 'allFriends')]),
  ]),
  k(
    'rare',
    'pack-frenzy',
    'Pack Frenzy',
    'skill',
    2,
    'none',
    [status('might', 2, 'allFriends'), ACT],
    { exhaust: true },
  ),
  k('rare', 'wild-hunt', 'Wild Hunt', 'power', 3, 'none', [on('turnStart', [ACT])]),

  // --- Feast ---
  k('common', 'burn-the-weak', 'Burn the Weak', 'skill', 1, 'none', [exhaustN(1), barrier(8)]),
  k('common', 'primal-feast', 'Primal Feast', 'skill', 1, 'none', [heal(5, 'allFriends')]),
  k('common', 'bonepicker', 'Bonepicker', 'skill', 0, 'none', [barrier(3)], {
    exhaust: true,
    onExhaust: [heal(2)],
  }),
  k('common', 'bloodscent', 'Bloodscent', 'attack', 1, 'foe', [
    dmg(5),
    status('might', 1, 'allFriends'),
  ]),
  k('uncommon', 'crimson-pact', 'Crimson Pact', 'skill', 1, 'none', [
    lose(3),
    exhaustN(1),
    draw(2),
  ]),
  k('uncommon', 'gnaw', 'Gnaw', 'attack', 1, 'foe', [scaled(dmg(5), per('exhausted', 1))]),
  k('uncommon', 'devour', 'Devour', 'attack', 2, 'foe', [dmg(14), heal(5)]),
  k('uncommon', 'devour-ally', 'Devour Ally', 'skill', 1, 'ally', [
    heal(12, 'hero'),
    status('might', 3, 'hero'),
    sacrifice,
  ]),
  k('uncommon', 'fell-the-prey', 'Fell the Prey', 'attack', 2, 'foe', [dmg(16), heal(6)], {
    exhaust: true,
  }),
  k('uncommon', 'ravenous', 'Ravenous', 'power', 1, 'none', [on('exhaust', [draw(1), lose(1)])]),
  k('uncommon', 'thick-skin', 'Thick Skin', 'power', 1, 'none', [
    on('exhaust', [barrier(2, 'allFriends')]),
  ]),
  k('rare', 'maw-opens', 'The Maw Opens', 'attack', 2, 'foe', [
    exhaustN(9),
    scaled(dmg(0), per('exhausted', 2)),
  ]),
  k(
    'uncommon',
    'gnarltooth-trap',
    'Gnarltooth Trap',
    'snare',
    1,
    'none',
    [dmg(6, 'attacker'), status('might', 1, 'allFriends')],
    { trigger: { on: 'attacked' } },
  ),
  k('common', 'whet-the-fangs', 'Whet the Fangs', 'skill', 0, 'none', [status('vigor', 6)]),
  k('rare', 'bloodsong', 'Bloodsong', 'power', 1, 'none', [lose(2), status('ritual', 1)]),
  k('rare', 'hunger-unbound', 'Hunger Unbound', 'power', 2, 'none', [
    status('unbound', 1),
    on('turnStart', [lose(2)]),
  ]),
  k('legendary', 'hunger-unleashed', 'The Hunger Unleashed', 'power', 2, 'none', [
    lose(6),
    status('might', 4, 'allFriends'),
    status('ritual', 2),
  ]),
  k(
    'legendary',
    'apex-maw',
    'Apex Maw',
    'attack',
    3,
    'foe',
    [scaled(dmg(10), per('might', 3)), heal(10)],
    { exhaust: true },
  ),
  k('rare', 'blood-pact', 'Blood Pact', 'skill', 1, 'none', [lose(6), maxMana(1)], {
    exhaust: true,
  }),
  // (more Feast)
  k('uncommon', 'bone-offering', 'Bone Offering', 'skill', 1, 'none', [
    exhaustN(1),
    draw(2),
    heal(2),
  ]),
  k('uncommon', 'gorge', 'Gorge', 'skill', 1, 'none', [
    barrier(8),
    scaled(barrier(0), per('exhausted', 0.5)),
  ]),
  k('uncommon', 'rotten-meal', 'Rotten Meal', 'skill', 1, 'none', [
    barrier(5, 'allFriends'),
    exhaustN(1, 'random'),
  ]),
  k('rare', 'carrion-engine', 'Carrion Engine', 'power', 2, 'none', [
    on('exhaust', [dmg(2, 'allFoes')]),
  ]),
  k('rare', 'last-gasp', 'Last Gasp', 'attack', 2, 'none', [
    scaled(dmg(0, 'allFoes'), per('exhausted', 1)),
  ]),
  k('rare', 'wolfhide', 'Wolfhide', 'skill', 2, 'none', [barrier(18), barrier(9, 'allFriends')], {
    exhaust: true,
  }),

  // --- Bloodrage (batch 3) ---
  k('common', 'maddened-lunge', 'Maddened Lunge', 'attack', 1, 'foe', [
    scaled(dmg(5), per('missingHp', 0.25)),
  ]),
  k(
    'common',
    'open-a-vein',
    'Open a Vein',
    'skill',
    0,
    'none',
    [lose(3), status('might', 1), draw(1)],
    { exhaust: true },
  ),
  k('common', 'bloodied-howl', 'Bloodied Howl', 'skill', 1, 'none', [
    lose(2),
    status('exposed', 2, 'allFoes'),
  ]),
  k('uncommon', 'blood-haze', 'Blood Haze', 'attack', 2, 'none', [
    scaled(dmg(6, 'allFoes'), per('might', 1)),
    lose(2),
  ]),
  k('uncommon', 'tear-loose', 'Tear Loose', 'attack', 1, 'foe', [
    dmg(7),
    lose(2),
    status('vigor', 4),
  ]),
  k('uncommon', 'frothing-rage', 'Frothing Rage', 'skill', 1, 'none', [
    lose(2),
    status('might', 3, 'self', true),
    draw(2),
  ]),
  k('uncommon', 'wounded-wrath', 'Wounded Wrath', 'power', 1, 'none', [
    on('loseHp', [dmg(4, 'randomFoe')]),
  ]),
  k(
    'rare',
    'death-or-glory',
    'Death or Glory',
    'attack',
    2,
    'foe',
    [scaled(dmg(10), per('missingHp', 0.5))],
    { exhaust: true },
  ),

  // --- Pack (batch 3) ---
  k('common', 'guard-dog', 'Guard Dog', 'skill', 1, 'none', [summon('hound'), barrier(5)]),
  k('common', 'bared-teeth', 'Bared Teeth', 'skill', 1, 'none', [
    scaled(barrier(3), per('allies', 3)),
  ]),
  k('common', 'lead-the-charge', 'Lead the Charge', 'attack', 1, 'foe', [
    scaled(dmg(5), per('allies', 3)),
  ]),
  k('uncommon', 'blood-bond', 'Blood Bond', 'skill', 1, 'ally', [
    lose(2),
    status('might', 2, 'target'),
    barrier(6, 'target'),
  ]),
  k('uncommon', 'litter', 'Litter', 'skill', 2, 'none', [
    summon('gnashling'),
    summon('gnashling'),
    summon('gnashling'),
  ]),
  k('uncommon', 'bone-collar', 'Bone Collar', 'power', 1, 'none', [
    on('allyDies', [status('might', 2), heal(4)]),
  ]),
  k('rare', 'hunters-call', "Hunter's Call", 'power', 2, 'none', [
    on('turnStart', [status('might', 1, 'allFriends')]),
  ]),
  k('rare', 'pack-leader', 'Pack Leader', 'power', 2, 'none', [
    on('play', [barrier(2, 'allFriends')], { filter: 'attack' }),
  ]),

  // --- Feast (batch 3) ---
  k('common', 'marrow-suck', 'Marrow Suck', 'attack', 1, 'foe', [
    dmg(7),
    scaled(heal(2), per('exhausted', 0.5)),
  ]),
  k('common', 'throw-scraps', 'Throw Scraps', 'skill', 0, 'none', [exhaustN(1), mana(1)]),
  k('uncommon', 'feast-on-fear', 'Feast on Fear', 'attack', 2, 'foe', [
    dmg(12),
    scaled(heal(3), per('exposed', 2, 'target')),
  ]),
  k('uncommon', 'gore-and-gulp', 'Gore and Gulp', 'attack', 1, 'foe', [dmg(10), heal(4)], {
    exhaust: true,
  }),
  k('uncommon', 'ossuary', 'Ossuary', 'power', 1, 'none', [on('exhaust', [dmg(3, 'randomFoe')])]),
  k('uncommon', 'famine', 'Famine', 'skill', 2, 'none', [exhaustN(2, 'any'), mana(2), heal(4)]),
  k('uncommon', 'gut-trap', 'Gut Trap', 'snare', 1, 'none', [dmg(8, 'allFoes'), heal(4)], {
    trigger: { on: 'hpLost', min: 5 },
  }),
  k('rare', 'second-helping', 'Second Helping', 'skill', 1, 'none', [lose(2), reclaim(1)], {
    exhaust: true,
  }),
  k('rare', 'grave-hunger', 'Grave Hunger', 'power', 2, 'none', [on('exhaust', [heal(2)])]),
];
