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
  command,
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
  doubleSt,
  discard,
  manaNext,
  drawNext,
  when,
} from '../build';

const k = pool('hunter', 'wyldmaw');

export const HUNTER: CardDef[] = [
  // --- basics ---
  // (DECISIONS #285: her basics no longer only cost HP. Savage Bite heals off what it bites; Blood Frenzy is her early area attack)
  // (a basic: 8, and its upgrade only +2; DECISIONS #308)
  // (7 since the costing pass, DECISIONS #377: 8 with Lifesteal was a common's worth for a basic)
  k('basic', 'savage-bite', 'Savage Bite', 'attack', 1, 'foe', [lifesteal(dmg(7), 50)], {
    up: { effects: [lifesteal(dmg(9), 50)] },
  }),
  k(
    'basic',
    'blood-frenzy',
    'Blood Frenzy',
    'attack',
    1,
    'none',
    [dmg(3, 'allFoes'), lose(1), status('might', 1)],
    { up: { effects: [dmg(5, 'allFoes'), lose(1), status('might', 1)] } },
  ),

  // --- Bloodrage ---
  // (every HP a common pays buys about 3 damage or Barrier, or something lasting: DECISIONS #285)
  // (one of her basics now, in Guard Dog's place: DECISIONS #308)
  k('basic', 'rend', 'Rend', 'attack', 1, 'foe', [dmg(6), lose(2), status('might', 1)], {
    up: { effects: [dmg(9), lose(2), status('might', 1)] },
  }),
  k('common', 'twin-fang', 'Twin Fang', 'attack', 1, 'foe', [dmg(6, 'target', 2), lose(2)]),
  k('common', 'feral-instinct', 'Feral Instinct', 'skill', 0, 'none', [lose(2), draw(2)], {
    exhaust: true,
    up: { effects: [lose(1), draw(2)] },
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
    scaled(dmg(10), per('might', 2)),
  ]),
  k('uncommon', 'run-wild', 'Run Wild', 'attack', 2, 'foe', [
    dmg(7, 'target', 2),
    status('might', 1),
  ]),
  k('uncommon', 'ravage', 'Ravage', 'attack', 2, 'none', [dmg(10, 'allFoes', 2), lose(3)]),
  k('uncommon', 'the-hunger', 'The Hunger', 'power', 1, 'none', [lose(4), status('might', 3)]),

  // (more Bloodrage)
  k('common', 'scavenge', 'Rummage', 'attack', 1, 'foe', [dmg(8), fetchCards(1, 'draw', 'attack')]),
  k('common', 'pound', 'Pound', 'attack', 1, 'foe', [dmg(8), draw(1), lose(1)], {
    up: { effects: [dmg(12), draw(1), lose(1)] },
  }),
  k(
    'rare',
    'scar-tissue',
    'Scar Tissue',
    'power',
    1,
    'none',
    [on('loseHp', [barrier(2), status('might', 1, 'self', true)])],
    { up: { effects: [on('loseHp', [barrier(4), status('might', 1, 'self', true)])] } },
  ),
  k(
    'uncommon',
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
    lose(2),
    dmg(7, 'target', 2),
  ]),
  k('uncommon', 'hamstring-slam', 'Hamstring Slam', 'attack', 2, 'foe', [
    dmg(11),
    status('faltering', 2, 'target'),
    barrier(3, 'allAllies'),
  ]),
  k('rare', 'skullcrusher', 'Skullcrusher', 'attack', 3, 'foe', [dmg(26), ACT]),
  k(
    'rare',
    'scarred-warrior',
    'Scarred Warrior',
    'power',
    1,
    'none',
    [on('turnStart', [lose(2), barrier(8)])],
    { up: { effects: [on('turnStart', [lose(2), barrier(10)])] } },
  ),

  // --- Pack ---
  k(
    'common',
    'pack-tactics',
    'Pack Tactics',
    'skill',
    1,
    'none',
    [status('might', 1), barrier(2, 'allFriends')],
    { up: { effects: [status('might', 1), barrier(4, 'allFriends')] } },
  ),
  // (a companion that grows instead of only being shielded: DECISIONS #285)
  k('common', 'thick-hide', 'Thick Hide', 'skill', 1, 'none', [barrier(5, 'allFriends')]),
  k('uncommon', 'savage-command', 'Savage Command', 'skill', 1, 'none', [ACT, status('might', 1)]),
  k(
    'uncommon',
    'pack-bond',
    'Pack Bond',
    'power',
    2,
    'none',
    [on('turnStart', [barrier(4, 'allFriends')])],
    { up: { effects: [on('turnStart', [barrier(6, 'allFriends')])] } },
  ),
  // (the Alpha alone: with 1 Might for you as well it was ~47% over a 2-cost rare, DECISIONS #377)
  k('rare', 'alpha-call', 'Alpha Call', 'summon', 2, 'none', [summon('pack-alpha')]),
  k('uncommon', 'unchained', 'Unchained', 'power', 2, 'none', [status('might', 4)]),
  // (an Aura now: when a companion of hers falls, she strikes back; its upgrade hits harder. DECISIONS #325)
  k(
    'rare',
    'den-mother',
    'Den Mother',
    'power',
    2,
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

  k(
    'uncommon',
    'feeding-time',
    'Feeding Time',
    'skill',
    1,
    'none',
    [growHp(3, 'allFriends'), status('might', 1)],
    { up: { effects: [growHp(6, 'allFriends'), status('might', 1)] } },
  ),

  // (more Pack)
  // (an uncommon makes allies act only when that is what it is for; here they are shielded instead: DECISIONS #311)
  k('uncommon', 'rally-the-pack', 'Rally the Pack', 'skill', 2, 'none', [
    summon('hound'),
    barrier(3, 'allAllies'),
  ]),
  k(
    'common',
    'trail-of-blood',
    'Trail of Blood',
    'power',
    1,
    'none',
    [on('summon', [status('might', 1)])],
    { up: { innate: true } },
  ),
  k('rare', 'pack-frenzy', 'Pack Frenzy', 'skill', 2, 'none', [status('might', 2), ACT], {
    exhaust: true,
  }),
  k('rare', 'wild-hunt', 'Wild Hunt', 'power', 3, 'none', [on('turnStart', [ACT])]),

  // --- Feast ---
  // (16 now, and Fell the Prey, its twin, is switched off: DECISIONS #319)
  k('uncommon', 'devour', 'Devour', 'attack', 2, 'foe', [lifesteal(dmg(16), 50)]),
  k(
    'uncommon',
    'devour-ally',
    'Devour Ally',
    'skill',
    1,
    'ally',
    [heal(8, 'hero'), status('might', 2, 'hero'), sacrifice],
    { up: { effects: [heal(11, 'hero'), status('might', 2, 'hero'), sacrifice] } },
  ),
  // (switched off for now: too like Devour, DECISIONS #319)
  k('uncommon', 'fell-the-prey', 'Fell the Prey', 'attack', 2, 'foe', [lifesteal(dmg(16), 50)], {
    exhaust: true,
    source: 'disabled',
  }),
  k(
    'uncommon',
    'gnarltooth-trap',
    'Gnarltooth Trap',
    'snare',
    1,
    'none',
    [dmg(6, 'attacker'), status('might', 1)],
    { trigger: { on: 'attacked' }, up: { effects: [dmg(9, 'attacker'), status('might', 1)] } },
  ),
  k(
    'rare',
    'hunger-unleashed',
    'The Hunger Unleashed',
    'power',
    2,
    'none',
    [lose(6), status('might', 2), status('ritual', 1)],
    { up: { effects: [lose(6), status('might', 3), status('ritual', 1)] } },
  ),
  k(
    'rare',
    'apex-maw',
    'Apex Frenzy',
    'attack',
    2,
    'foe',
    // Predator: the more cards played this turn, the more it hits (DECISIONS #340)
    [lifesteal(scaled(dmg(5, 'target', 2), per('played', 1, undefined, 'hits')), 50)],
    // (upgraded, it costs 1: more damage per hit gains a burst card little)
    { exhaust: true, up: { cost: 1 } },
  ),
  // (an Aura: its Mana lasts the rest of the fight, DECISIONS #380)
  k('rare', 'blood-pact', 'Blood Pact', 'power', 1, 'none', [lose(7), maxMana(1)]),
  // (more Feast)
  k(
    'uncommon',
    'bone-offering',
    'Bone Offering',
    'skill',
    1,
    'none',
    [exhaustN(1), draw(2), heal(2)],
    { up: { effects: [exhaustN(1), draw(3), heal(2)] } },
  ),

  // --- Bloodrage (batch 3) ---
  k('common', 'open-a-vein', 'Open a Vein', 'skill', 0, 'none', [lose(4), status('might', 2)], {
    exhaust: true,
    up: { effects: [lose(3), status('might', 2)] },
  }),
  k(
    'uncommon',
    'bloodied-howl',
    'Bloodied Howl',
    'skill',
    1,
    'none',
    [lose(2), status('exposed', 2, 'allFoes'), draw(1)],
    { up: { effects: [lose(2), status('exposed', 3, 'allFoes'), draw(1)] } },
  ),
  k(
    'uncommon',
    'frothing-rage',
    'Frothing Rage',
    'skill',
    1,
    'none',
    [lose(3), status('might', 3, 'self', true), draw(2)],
    { up: { effects: [lose(3), status('might', 3, 'self', true), draw(3)] } },
  ),
  k(
    'common',
    'wounded-wrath',
    'Wounded Wrath',
    'power',
    1,
    'none',
    [on('loseHp', [dmg(4, 'randomFoe')])],
    { up: { effects: [on('loseHp', [dmg(6, 'randomFoe')])] } },
  ),
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
  k(
    'uncommon',
    'blood-bond',
    'Blood Bond',
    'skill',
    1,
    'none',
    [lose(3), status('might', 1), barrier(5, 'allFriends')],
    { up: { effects: [lose(3), status('might', 1), barrier(7, 'allFriends')] } },
  ),
  // (two Pups: two Hounds for 2 Mana was half again a card's worth, DECISIONS #377)
  k('uncommon', 'litter', 'Litter', 'skill', 2, 'none', [summon('pup'), summon('pup')]),
  k(
    'uncommon',
    'bone-collar',
    'Bone Collar',
    'power',
    1,
    'none',
    [on('allyDies', [status('might', 1), heal(2)])],
    { up: { effects: [on('allyDies', [status('might', 1), heal(4)])] } },
  ),
  k(
    'uncommon',
    'hunters-call',
    "Hunter's Call",
    'power',
    1,
    'none',
    [on('turnStart', [status('might', 1)])],
    { up: { innate: true } },
  ),

  // --- Feast (batch 3) ---
  k('common', 'throw-scraps', 'Throw Scraps', 'skill', 0, 'none', [exhaustN(1), mana(1)]),
  k('uncommon', 'gut-trap', 'Gut Trap', 'snare', 1, 'none', [dmg(8, 'allFoes'), heal(4)], {
    trigger: { on: 'hpLost', min: 5 },
  }),

  // --- glue: cards for any build path (DECISIONS #337) ---
  k('common', 'bone-crack', 'Bone Crack', 'attack', 1, 'foe', [
    dmg(7),
    status('exposed', 1, 'target'),
  ]),
  k('uncommon', 'whet-the-fangs', 'Whet the Fangs', 'skill', 0, 'none', [status('vigor', 6)]),
  k(
    'common',
    'primal-feast',
    'Primal Feast',
    'skill',
    1,
    'none',
    [heal(3, 'hero'), growHp(4, 'allAllies')],
    { up: { effects: [heal(3, 'hero'), growHp(7, 'allAllies')] } },
  ),

  // --- more glue: uncommons and rares for any build path (DECISIONS #339) ---
  k('rare', 'bloodsong', 'Bloodsong', 'power', 0, 'none', [lose(3), status('ritual', 1)], {
    up: { effects: [lose(2), status('ritual', 1)] },
  }),
  k(
    'rare',
    'slip-the-leash',
    'Slip the Leash',
    'skill',
    2,
    'none',
    [doubleSt('might', 'self', 2, 4)],
    // (the cap grows by 1, not by half: +6 was the doubler the 2026-10-25 audit flagged)
    { exhaust: true, up: { effects: [doubleSt('might', 'self', 2, 5)] } },
  ),

  // --- Predator: Mana and draw to burn through the deck, then a burst turn (replaces Feast; DECISIONS #340) ---
  k('common', 'rush-in', 'Rush In', 'attack', 1, 'foe', [dmg(7), draw(1)], {
    up: { effects: [dmg(10), draw(1)] },
  }),
  k('common', 'heart-pound', 'Pounding Heart', 'skill', 0, 'none', [mana(1), lose(2)], {
    exhaust: true,
  }),
  k('common', 'wild-swings', 'Wild Swings', 'attack', 1, 'foe', [
    scaled(dmg(3), per('played', 1, undefined, 'hits')),
  ]),
  k('common', 'shake-loose', 'Shake Loose', 'skill', 1, 'none', [draw(2), barrier(3)], {
    up: { effects: [draw(2), barrier(6)] },
  }),
  k('uncommon', 'frenzied-gulp', 'Frenzied Gulp', 'skill', 0, 'none', [draw(3), lose(4)], {
    exhaust: true,
  }),
  k('uncommon', 'adrenal-surge', 'Adrenal Surge', 'skill', 0, 'none', [mana(2), draw(1), lose(3)], {
    exhaust: true,
  }),
  k('uncommon', 'blur-of-claws', 'Blur of Claws', 'attack', 1, 'foe', [
    scaled(dmg(5), per('played', 3)),
  ]),
  k(
    'uncommon',
    'battle-rhythm',
    'Battle Rhythm',
    'power',
    1,
    'none',
    [on('turnStart', [draw(1), lose(1)])],
    { up: { innate: true } },
  ),
  k('uncommon', 'reckless-abandon', 'Reckless Abandon', 'skill', 1, 'none', [draw(3), discard(1)]),
  k(
    'uncommon',
    'burst-of-speed',
    'Burst of Speed',
    'skill',
    1,
    'none',
    [manaNext(1), drawNext(2)],
    {
      up: { effects: [manaNext(1), drawNext(3)] },
    },
  ),
  k('uncommon', 'rip-and-tear', 'Rip and Tear', 'attack', 2, 'foe', [dmg(6, 'target', 3), draw(1)]),
  k(
    'rare',
    'berserk-tempo',
    'Berserk Tempo',
    'power',
    2,
    'none',
    [on('turnStart', [mana(1), draw(1), lose(2)])],
    { up: { effects: [on('turnStart', [mana(1), draw(1), lose(1)])] } },
  ),
  // (only what you draw during your turn: the turn's own five gave five Might, DECISIONS #377)
  k('rare', 'red-frenzy', 'Red Frenzy', 'power', 1, 'none', [
    on('drawMidTurn', [status('might', 1, 'self', true)]),
  ]),
  k(
    'rare',
    'bloodstorm',
    'Bloodstorm',
    'attack',
    0,
    'foe',
    [
      scaled({ op: 'damage', amount: 5, hits: 0, to: 'target' }, per('x', 1, undefined, 'hits')),
      scaled(draw(0), per('x')),
    ],
    { x: true },
  ),
  k('rare', 'rising-howl', 'Rising Howl', 'attack', 2, 'foe', [scaled(dmg(10), per('played', 5))]),
  k('rare', 'killing-spree', 'Killing Spree', 'power', 3, 'none', [
    on('play', [draw(1)], { filter: 'attack' }),
  ]),

  // --- brought back for the 20/30/25 rarity target (DECISIONS #341) ---
  k(
    'uncommon',
    'pack-leader',
    'Pack Leader',
    'power',
    2,
    'none',
    [on('play', [barrier(2, 'allFriends')], { filter: 'attack' })],
    { up: { effects: [on('play', [barrier(3, 'allFriends')], { filter: 'attack' })] } },
  ),
  k('uncommon', 'tear-loose', 'Tear Loose', 'attack', 1, 'foe', [
    dmg(9),
    lose(2),
    status('vigor', 4),
  ]),
  k(
    'rare',
    'ancient-fury',
    'Ancient Fury',
    'power',
    2,
    'none',
    [on('turnStart', [status('might', 2), lose(3)])],
    { up: { effects: [on('turnStart', [status('might', 2), lose(2)])] } },
  ),

  // --- brought back for the 20/30/25 rarity target (DECISIONS #341) ---
  k('rare', 'hunger-unbound', 'Hunger Unbound', 'power', 3, 'none', [
    status('unbound', 1),
    on('turnStart', [lose(2)]),
  ]),

  // --- the hunt: Traps that slow the prey, a mark, and the pack that finishes it (DECISIONS #377) ---
  k(
    'common',
    'bear-trap',
    'Bear Trap',
    'snare',
    1,
    'none',
    [dmg(6, 'attacker'), status('faltering', 2, 'attacker')],
    {
      trigger: { on: 'attacked' },
      up: { effects: [dmg(9, 'attacker'), status('faltering', 2, 'attacker')] },
    },
  ),
  k(
    'common',
    'snare-line',
    'Snare Line',
    'snare',
    1,
    'none',
    [barrier(5), status('faltering', 1, 'allFoes')],
    {
      trigger: { on: 'foeTurn' },
      up: { effects: [barrier(8), status('faltering', 1, 'allFoes')] },
    },
  ),
  k(
    'uncommon',
    'deadfall',
    'Deadfall',
    'snare',
    2,
    'none',
    [dmg(18, 'attacker'), status('exposed', 2, 'attacker')],
    {
      trigger: { on: 'attacked' },
      up: { effects: [dmg(24, 'attacker'), status('exposed', 2, 'attacker')] },
    },
  ),
  // (the pack springs on whatever attacked: each companion strikes it)
  k('uncommon', 'baited-snare', 'Baited Snare', 'snare', 1, 'none', [command(dmg(5)), barrier(3)], {
    trigger: { on: 'attacked' },
    up: { effects: [command(dmg(7)), barrier(3)] },
  }),
  k('uncommon', 'hunting-grounds', 'Hunting Grounds', 'power', 1, 'none', [
    on('snare', [status('might', 1)]),
  ]),
  k(
    'common',
    'single-out',
    'Single Out',
    'skill',
    1,
    'foe',
    [status('exposed', 1, 'target'), status('vigor', 3, 'allAllies'), draw(1)],
    { up: { effects: [status('exposed', 1, 'target'), status('vigor', 5, 'allAllies'), draw(1)] } },
  ),
  k(
    'uncommon',
    'run-it-down',
    'Run It Down',
    'attack',
    1,
    'foe',
    [dmg(7), when('faltering', { atLeast: 1, of: 'target' }, [command(dmg(5))])],
    {
      up: {
        effects: [dmg(10), when('faltering', { atLeast: 1, of: 'target' }, [command(dmg(5))])],
      },
    },
  ),
];
