// Kesh the Unfed (Wyldmaw). Starts with a Hound. Three build paths:
//   Bloodrage  - pay HP for Might and tempo, then hit with it
//   Pack       - buff and feed the companions
//   Feast      - Exhaust engine: eat your own cards, heal, hit for what you have consumed (and devour allies)

import type { CardDef } from '@sr/combat';
import {
  ACT,
  growHp,
  lifesteal,
  barrier,
  dmg,
  draw,
  fetchCards,
  exhaustN,
  heal,
  lose,
  mana,
  maxMana,
  on,
  per,
  pool,
  sacrifice,
  scaled,
  status,
  summon,
} from '../build';

const k = pool('hunter', 'wyldmaw');

export const HUNTER: CardDef[] = [
  // --- basics ---
  // (DECISIONS #285: her basics no longer only cost HP. Savage Bite heals off what it bites; Blood Frenzy is her early area attack)
  // (a basic: 8, and its upgrade only +2; DECISIONS #308)
  k('basic', 'savage-bite', 'Savage Bite', 'attack', 1, 'foe', [lifesteal(dmg(8), 50)], {
    up: { effects: [lifesteal(dmg(10), 50)] },
  }),
  k('basic', 'blood-frenzy', 'Blood Frenzy', 'attack', 1, 'none', [
    dmg(4, 'allFoes'),
    lose(1),
    status('might', 1),
  ]),

  // --- Bloodrage ---
  // (every HP a common pays buys about 3 damage or Barrier, or something lasting: DECISIONS #285)
  // (one of her basics now, in Guard Dog's place: DECISIONS #308)
  k('basic', 'rend', 'Rend', 'attack', 1, 'foe', [dmg(9), lose(2), status('might', 1)], {
    up: { effects: [dmg(12), lose(2), status('might', 1)] },
  }),
  k('common', 'twin-fang', 'Twin Fang', 'attack', 1, 'foe', [dmg(5, 'target', 2), lose(2)]),
  k('common', 'feral-instinct', 'Feral Instinct', 'skill', 0, 'none', [lose(3), draw(2)], {
    exhaust: true,
  }),
  k('common', 'pain-ward', 'Pain Ward', 'skill', 1, 'none', [
    scaled(barrier(5), per('missingPct', 1 / 5)),
  ]),
  // (upgraded it loses less HP but draws the same 2: four copies drawing 4 each emptied the deck on the first turn; DECISIONS #237)
  k(
    'rare',
    'blood-tithe',
    'Blood Tithe',
    'skill',
    0,
    'none',
    [lose(7), mana(2), draw(2), status('might', 1)],
    {
      exhaust: true,
      up: { effects: [lose(5), mana(2), draw(2), status('might', 1)] },
    },
  ),
  k('uncommon', 'crushing-blow', 'Crushing Blow', 'attack', 2, 'foe', [
    scaled(dmg(8), per('might', 2)),
  ]),
  k('uncommon', 'run-wild', 'Run Wild', 'attack', 2, 'foe', [
    dmg(6, 'target', 2),
    status('might', 1),
  ]),
  k('uncommon', 'ravage', 'Ravage', 'attack', 2, 'none', [dmg(9, 'allFoes'), lose(3)]),
  k('rare', 'the-hunger', 'The Hunger', 'power', 1, 'none', [lose(5), status('might', 2)]),

  // (more Bloodrage)
  k('common', 'scavenge', 'Rummage', 'attack', 1, 'foe', [dmg(8), fetchCards(1, 'draw', 'attack')]),
  k('common', 'pound', 'Pound', 'attack', 1, 'foe', [dmg(8), draw(1), lose(2)]),
  k('uncommon', 'scar-tissue', 'Scar Tissue', 'power', 1, 'none', [
    on('loseHp', [barrier(3), status('might', 1, 'self', true)]),
  ]),
  k(
    'common',
    'whirling-maul',
    'Whirling Maul',
    'attack',
    0,
    'none',
    [
      scaled({ op: 'damage', amount: 6, hits: 0, to: 'allFoes' }, per('x', 1, undefined, 'hits')),
      lose(3),
    ],
    { x: true },
  ),
  k('uncommon', 'reckless-blow', 'Reckless Blow', 'attack', 1, 'foe', [
    lose(3),
    dmg(7, 'target', 2),
  ]),
  k('uncommon', 'hamstring-slam', 'Hamstring Slam', 'attack', 2, 'foe', [
    dmg(11),
    status('faltering', 2, 'target'),
    barrier(3, 'allAllies'),
  ]),
  k('rare', 'skullcrusher', 'Skullcrusher', 'attack', 3, 'foe', [dmg(26), ACT]),
  k('rare', 'scarred-warrior', 'Scarred Warrior', 'power', 1, 'none', [
    on('turnStart', [lose(2), barrier(8)]),
  ]),

  // --- Pack ---
  k('common', 'pack-tactics', 'Pack Tactics', 'skill', 1, 'none', [
    status('might', 1),
    barrier(4, 'allFriends'),
  ]),
  // (a companion that grows instead of only being shielded: DECISIONS #285)
  k('common', 'thick-hide', 'Thick Hide', 'skill', 1, 'none', [barrier(6, 'allFriends')]),
  k('uncommon', 'savage-command', 'Savage Command', 'skill', 2, 'none', [ACT, status('might', 1)]),
  k('uncommon', 'pack-bond', 'Pack Bond', 'power', 2, 'none', [
    on('turnStart', [barrier(3, 'allFriends')]),
  ]),
  k('rare', 'alpha-call', 'Alpha Call', 'summon', 2, 'none', [
    summon('pack-alpha'),
    status('might', 1),
  ]),
  k('uncommon', 'unchained', 'Unchained', 'power', 2, 'none', [status('might', 3)]),
  // (an Aura now: when a companion of hers falls, she strikes back; its upgrade hits harder. DECISIONS #325)
  k(
    'rare',
    'den-mother',
    'Den Mother',
    'power',
    3,
    'none',
    [on('allyDies', [dmg(15, 'attacker')])],
    {
      up: { effects: [on('allyDies', [dmg(20, 'attacker')])] },
    },
  ),
  // (the big summon: a Dire Wolf for 3, where Alpha Call brings the Alpha for 2)
  k('rare', 'dire-wolf', 'Dire Wolf', 'summon', 3, 'none', [summon('dire-wolf')]),
  // (a cheap pup: DECISIONS #325, #326)
  k('common', 'summon-pup', 'Summon Pup', 'summon', 1, 'none', [summon('pup')]),

  k('uncommon', 'feeding-time', 'Feeding Time', 'skill', 1, 'none', [
    growHp(3, 'allFriends'),
    status('might', 1),
  ]),

  // (more Pack)
  // (an uncommon makes allies act only when that is what it is for; here they are shielded instead: DECISIONS #311)
  k('uncommon', 'rally-the-pack', 'Rally the Pack', 'skill', 2, 'none', [
    summon('hound'),
    barrier(4, 'allAllies'),
  ]),
  k('common', 'trail-of-blood', 'Trail of Blood', 'power', 1, 'none', [
    on('summon', [status('might', 1)]),
  ]),
  k('uncommon', 'pack-frenzy', 'Pack Frenzy', 'skill', 2, 'none', [status('might', 2), ACT], {
    exhaust: true,
  }),
  k('rare', 'wild-hunt', 'Wild Hunt', 'power', 3, 'none', [on('turnStart', [ACT])]),

  // --- Feast ---
  k('common', 'burn-the-weak', 'Burn the Weak', 'skill', 1, 'none', [exhaustN(1), barrier(8)]),
  k('common', 'bonepicker', 'Bonepicker', 'skill', 0, 'none', [barrier(3)], {
    exhaust: true,
    onExhaust: [heal(2)],
  }),
  k('common', 'bloodscent', 'Bloodscent', 'attack', 1, 'foe', [dmg(5), status('might', 1)]),
  k('uncommon', 'crimson-pact', 'Crimson Pact', 'skill', 1, 'none', [
    lose(4),
    exhaustN(1),
    draw(2),
  ]),
  k('uncommon', 'gnaw', 'Gnaw', 'attack', 1, 'foe', [scaled(dmg(5), per('exhausted', 1))]),
  // (16 now, and Fell the Prey, its twin, is switched off: DECISIONS #319)
  k('uncommon', 'devour', 'Devour', 'attack', 2, 'foe', [lifesteal(dmg(16), 50)]),
  k('uncommon', 'devour-ally', 'Devour Ally', 'skill', 1, 'ally', [
    heal(12, 'hero'),
    status('might', 3, 'hero'),
    sacrifice,
  ]),
  // (switched off for now: too like Devour, DECISIONS #319)
  k('uncommon', 'fell-the-prey', 'Fell the Prey', 'attack', 2, 'foe', [lifesteal(dmg(16), 50)], {
    exhaust: true,
    source: 'disabled',
  }),
  k('common', 'ravenous', 'Ravenous', 'power', 1, 'none', [on('exhaust', [draw(1), lose(2)])]),
  k('common', 'thick-skin', 'Thick Skin', 'power', 1, 'none', [
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
    [dmg(6, 'attacker'), status('might', 1)],
    { trigger: { on: 'attacked' } },
  ),
  k('legendary', 'hunger-unleashed', 'The Hunger Unleashed', 'power', 2, 'none', [
    lose(7),
    status('might', 4),
    status('ritual', 2),
  ]),
  k(
    'legendary',
    'apex-maw',
    'Apex Maw',
    'attack',
    3,
    'foe',
    // Feast: it grows with every card you have consumed (DECISIONS #338)
    [lifesteal(scaled(dmg(10), per('exhausted', 3)), 75)],
    // (upgraded, it costs 2: a big one-off card gains little from +3 damage, and +4 per Might is past the guard rail for a card that
    // is consumed; DECISIONS #282)
    { exhaust: true, up: { cost: 2 } },
  ),
  k('rare', 'blood-pact', 'Blood Pact', 'skill', 1, 'none', [lose(7), maxMana(1)], {
    exhaust: true,
  }),
  // (more Feast)
  k('uncommon', 'bone-offering', 'Bone Offering', 'skill', 1, 'none', [
    exhaustN(1),
    draw(2),
    heal(2),
  ]),
  k('common', 'gorge', 'Gorge', 'skill', 1, 'none', [
    barrier(8),
    scaled(barrier(0), per('exhausted', 0.5)),
  ]),
  k('rare', 'carrion-engine', 'Carrion Engine', 'power', 2, 'none', [
    on('exhaust', [dmg(2, 'allFoes')]),
  ]),
  k('rare', 'wolfhide', 'Wolfhide', 'skill', 2, 'none', [barrier(18), barrier(9, 'allFriends')], {
    exhaust: true,
  }),

  // --- Bloodrage (batch 3) ---
  k('common', 'open-a-vein', 'Open a Vein', 'skill', 0, 'none', [lose(3), status('might', 2)], {
    exhaust: true,
  }),
  k('common', 'bloodied-howl', 'Bloodied Howl', 'skill', 1, 'none', [
    lose(2),
    status('exposed', 2, 'allFoes'),
    draw(1),
  ]),
  k('uncommon', 'frothing-rage', 'Frothing Rage', 'skill', 1, 'none', [
    lose(3),
    status('might', 3, 'self', true),
    draw(2),
  ]),
  k('common', 'wounded-wrath', 'Wounded Wrath', 'power', 1, 'none', [
    on('loseHp', [dmg(4, 'randomFoe')]),
  ]),
  k(
    'rare',
    'death-or-glory',
    'Death or Glory',
    'attack',
    2,
    'foe',
    [scaled(dmg(10), per('missingPct', 0.4))],
    { exhaust: true },
  ),

  // --- Pack (batch 3) ---
  k('common', 'bared-teeth', 'Bared Teeth', 'skill', 1, 'none', [
    scaled(barrier(3), per('allies', 3)),
  ]),
  k('common', 'lead-the-charge', 'Lead the Charge', 'attack', 1, 'foe', [
    scaled(dmg(5), per('allies', 3)),
  ]),
  k('common', 'blood-bond', 'Blood Bond', 'skill', 1, 'none', [
    lose(3),
    status('might', 2),
    barrier(6, 'allFriends'),
  ]),
  // (two Hounds and nothing else: DECISIONS #323)
  k('uncommon', 'litter', 'Litter', 'skill', 2, 'none', [summon('hound'), summon('hound')]),
  k('common', 'bone-collar', 'Bone Collar', 'power', 1, 'none', [
    on('allyDies', [status('might', 2), heal(4)]),
  ]),
  k('rare', 'hunters-call', "Hunter's Call", 'power', 2, 'none', [
    on('turnStart', [status('might', 1)]),
  ]),

  // --- Feast (batch 3) ---
  k('common', 'throw-scraps', 'Throw Scraps', 'skill', 0, 'none', [exhaustN(1), mana(1)]),
  k('uncommon', 'feast-on-fear', 'Feast on Fear', 'attack', 2, 'foe', [
    dmg(12),
    scaled(heal(3), per('exposed', 2, 'target')),
  ]),
  k('common', 'gore-and-gulp', 'Gore and Gulp', 'attack', 1, 'foe', [lifesteal(dmg(10), 50)], {
    exhaust: true,
  }),
  k('common', 'gut-trap', 'Gut Trap', 'snare', 1, 'none', [dmg(8, 'allFoes'), heal(4)], {
    trigger: { on: 'hpLost', min: 5 },
  }),
  k('rare', 'grave-hunger', 'Grave Hunger', 'power', 2, 'none', [on('exhaust', [heal(2)])]),

  // --- glue: cards for any build path (DECISIONS #337) ---
  k('common', 'bone-crack', 'Bone Crack', 'attack', 1, 'foe', [
    dmg(7),
    status('exposed', 2, 'target'),
  ]),
  k('common', 'whet-the-fangs', 'Whet the Fangs', 'skill', 0, 'none', [status('vigor', 6)]),
  k('common', 'primal-feast', 'Primal Feast', 'skill', 1, 'none', [heal(7, 'allFriends')]),
];
