// Solen, the Still Flame (Aurelion). A monk of the Gilded Order's silent branch (the Barbarian until DECISIONS #391). No companions.
// Starts the fight Serene.
// Stances (ids calm/wrath/radiant): Serene (leaving it gives 2 Mana, once a turn), Fury (deal double, take 50% more), Radiant (deal
// triple, ends with your turn). Fervor (id mantra) builds to 10, then you enter Radiant.
// Three themes (DECISIONS #255):
//   Fury     - burst: enter Fury, hit as hard as you can, and live through the damage it lets in
//   Flow     - stance dancing: change stance again and again; every change pays (Barrier, damage, cards, the Mana of leaving Serene)
//   Radiant  - build Fervor to 10 and cash it in on a Radiant turn
// (Card ids are older than some names: an id keeps a card's art and every saved deck.)

import type { CardDef } from '@sr/combat';
import {
  barrier,
  statusTheirs,
  dmg,
  draw,
  mana,
  manaNext,
  on,
  per,
  pool,
  scaled,
  scry,
  stance,
  status,
  fetchCards,
  discoverOp,
  heal,
  lose,
} from '../build';

const s = pool('monk', 'aurelion');

export const MONK: CardDef[] = [
  // --- basics ---
  // (11, was 9, DECISIONS #787: the 2-Mana card of his opening hands was his weakest)
  s('basic', 'kindle-fury', 'Kindle Fury', 'attack', 2, 'foe', [dmg(11), stance('wrath')]),
  // (7 Barrier and Serene for 1 Mana was the Watcher's 2-cost Vigilance at half price: DECISIONS #390)
  // (5 Barrier, DECISIONS #677: a class basic does more than a Defend)
  s('basic', 'still-guard', 'Still Guard', 'skill', 1, 'none', [barrier(5), stance('calm')]),
  // (a third basic: a hit that builds Fervor, Robert 2026-10-30)
  s('basic', 'mindful-palm', 'Mindful Palm', 'attack', 1, 'foe', [dmg(5), status('mantra', 2)]),

  // Stance bonuses below are binary; explicit text avoids suggesting stackable Serene/Fury.
  // --- Fury ---
  s('common', 'angry-palm', 'Angry Palm', 'attack', 1, 'foe', [scaled(dmg(7), per('wrath', 6))], {
    text: 'Deal 7 damage, or 13 if you are in Fury.',
    up: {
      effects: [scaled(dmg(10), per('wrath', 6))],
      text: 'Deal 10 damage, or 16 if you are in Fury.',
    },
  }),
  // (and 2 Fervor since DECISIONS #796: it was Kindle Fury with 3 more damage; the Fury that also builds to Radiant. To ALL enemies was
  // tried and dropped: it made it Burning Breath at 2 Mana)
  s(
    'common',
    'ashen-fist',
    'Ashen Fist',
    'attack',
    2,
    'foe',
    [dmg(12), stance('wrath'), status('mantra', 2)],
    {
      up: { effects: [dmg(15), stance('wrath'), status('mantra', 2)] },
    },
  ),
  s('uncommon', 'temper-flare', 'Temper Flare', 'attack', 1, 'foe', [
    dmg(2, 'target', 3),
    stance('wrath'),
  ]),
  s('common', 'rising-ire', 'Rising Ire', 'skill', 0, 'none', [stance('wrath'), draw(1)], {
    exhaust: true,
  }),
  s('uncommon', 'swift-step', 'Swift Step', 'skill', 1, 'none', [
    stance('wrath'),
    status('vigor', 4),
  ]),
  s(
    'rare',
    'final-account',
    'Final Account',
    'attack',
    2,
    'foe',
    [scaled(dmg(14), per('wrath', 10))],
    {
      text: 'Deal 14 damage, or 24 if you are in Fury.',
      up: {
        effects: [scaled(dmg(17), per('wrath', 10))],
        text: 'Deal 17 damage, or 27 if you are in Fury.',
      },
    },
  ),
  // (Fury lets damage in: entering it is when to put a guard up)
  s(
    'rare',
    'surge-of-ire',
    'Surge of Ire',
    'power',
    2,
    'none',
    [on('stance', [barrier(6), draw(1)], { stance: 'wrath', once: true })],
    { up: { effects: [on('stance', [barrier(9), draw(1)], { stance: 'wrath', once: true })] } },
  ),
  s('rare', 'rage-of-ages', 'Rage of Ages', 'attack', 3, 'none', [dmg(8, 'allFoes', 3)]),
  s('rare', 'wrath-incarnate', 'Wrath Incarnate', 'power', 2, 'none', [
    on('turnStart', [stance('wrath')]),
  ]),
  s('common', 'red-mist', 'Burning Breath', 'attack', 1, 'none', [
    dmg(4, 'allFoes'),
    stance('wrath'),
  ]),
  s('common', 'flurry-of-palms', 'Flurry of Palms', 'attack', 0, 'foe', [dmg(3, 'target', 2)]),
  s('uncommon', 'wheel-kick', 'Spinning Heel', 'attack', 2, 'foe', [
    dmg(12),
    status('exposed', 2, 'target'),
    draw(1),
  ]),
  s('uncommon', 'wrathful-guard', 'Wrathful Guard', 'skill', 1, 'none', [
    barrier(6),
    stance('wrath'),
  ]),
  s(
    'rare',
    'rampage-of-ire',
    'Rampage of Ire',
    'power',
    2,
    'none',
    [on('stance', [dmg(6, 'allFoes')], { stance: 'wrath' })],
    { up: { effects: [on('stance', [dmg(9, 'allFoes')], { stance: 'wrath' })] } },
  ),
  s(
    'rare',
    'rage-unbound',
    'Rage Unbound',
    'skill',
    0,
    'none',
    [stance('wrath'), mana(1), lose(3)],
    {
      exhaust: true,
    },
  ),
  s('uncommon', 'hot-blooded', 'Hot-Blooded', 'attack', 1, 'foe', [
    scaled(dmg(4), per('missingPct', 1 / 6)),
    stance('wrath'),
  ]),
  s(
    'uncommon',
    'berserk-tide',
    'Storm of Fists',
    'attack',
    0,
    'foe',
    [
      scaled({ op: 'damage', amount: 4, hits: 0, to: 'target' }, per('x', 1, undefined, 'hits')),
      stance('wrath'),
    ],
    { x: true },
  ),
  s('common', 'unleashed-roar', 'Unleashed Roar', 'skill', 1, 'none', [
    status('exposed', 1, 'allFoes'),
    stance('wrath'),
  ]),
  s(
    'uncommon',
    'cornered-beast',
    'Coiled Serpent',
    'snare',
    1,
    'none',
    [dmg(8, 'attacker'), status('vigor', 4), stance('wrath')],
    { trigger: { on: 'hpLost', min: 5 } },
  ),
  s('rare', 'ashes-of-restraint', 'Ashes of Restraint', 'attack', 2, 'foe', [
    scaled(dmg(9), per('exhausted', 2)),
    stance('wrath'),
  ]),

  // --- Flow ---
  s('common', 'centre-yourself', 'Centre Yourself', 'skill', 1, 'none', [draw(1), stance('calm')]),
  // (into Fury and straight back to Serene: two stance changes, and leaving Serene pays its Mana once a turn)
  s(
    'common',
    'unburdened-guard',
    'Shifting Guard',
    'skill',
    1,
    'none',
    [barrier(2), stance('wrath'), stance('calm')],
    { up: { effects: [barrier(4), stance('wrath'), stance('calm')] } },
  ),
  s('common', 'thread-cutter', 'Thread-Cutter', 'attack', 1, 'foe', [
    dmg(3),
    stance('wrath'),
    stance('calm'),
  ]),
  s(
    'uncommon',
    'settled-mind',
    'Settled Mind',
    'skill',
    1,
    'none',
    [scaled(draw(0), per('calm', 3)), stance('calm')],
    {
      text: 'If you are already Serene, draw 3 cards. Then enter Serene.',
      up: {
        effects: [scaled(draw(1), per('calm', 3)), stance('calm')],
        text: 'Draw 1 card, or 4 if you are already Serene. Then enter Serene.',
      },
    },
  ),
  s(
    'common',
    'hushed-stillness',
    'Hushed Stillness',
    'skill',
    0,
    'none',
    // (held, with Barrier, not drawn and consumed, since DECISIONS #796: it was Centre Yourself for 0 with Consume; now a Serene kept
    // for the turn it is wanted)
    [stance('calm'), barrier(3)],
    {
      // (still Consume: leaving Serene pays Mana, so a free Serene that came back every shuffle made Mana every shuffle)
      exhaust: true,
      retain: true,
      up: { effects: [stance('calm'), barrier(5)] },
    },
  ),
  s(
    'uncommon',
    'unmoved-mind',
    'Unmoved Mind',
    'power',
    2,
    'none',
    // (Sapped in place of the Barrier: Sapped is the Monk's, DECISIONS #788)
    [on('stance', [statusTheirs('sapped', 2, 'randomFoe'), dmg(2, 'randomFoe')])],
    {
      up: {
        effects: [on('stance', [statusTheirs('sapped', 3, 'randomFoe'), dmg(3, 'randomFoe')])],
      },
    },
  ),
  // (1 more Mana since #710: an Aura that gives Mana every turn, Robert: "cards that give mana ever turn need to probably be a bit costlier")
  s('rare', 'ascendant-form', 'Ascendant Form', 'power', 3, 'none', [on('turnStart', [mana(1)])]),
  s('rare', 'perfect-calm', 'Perfect Calm', 'skill', 2, 'none', [
    barrier(12),
    stance('calm'),
    draw(1),
  ]),
  s(
    'common',
    'vigilance',
    'Watchful Calm',
    'skill',
    1,
    'foe',
    // (4 Sapped on the enemy you choose in place of 2 Barrier, DECISIONS #788)
    [statusTheirs('sapped', 4, 'target'), stance('calm'), scry(2)],
    { up: { effects: [statusTheirs('sapped', 6, 'target'), stance('calm'), scry(2)] } },
  ),
  s('common', 'empty-fist', 'Settling Fist', 'attack', 1, 'foe', [dmg(7), stance('none')]),
  s(
    'uncommon',
    'inner-calm',
    'Wheel of Motion',
    'power',
    2,
    'none',
    [on('stance', [dmg(3, 'allFoes')])],
    { up: { effects: [on('stance', [dmg(4, 'allFoes')])] } },
  ),
  s('uncommon', 'fearless', 'Unafraid', 'attack', 1, 'foe', [dmg(6), stance('calm')]),
  s('rare', 'meditate', 'Recollect', 'skill', 1, 'none', [fetchCards(1), stance('calm')], {
    retain: true,
  }),
  s('uncommon', 'sanctity', 'Let Go', 'skill', 1, 'none', [draw(2), stance('none')]),
  // (the Trickster's Pickpocket Master word for word, so the same cost: 2)
  s('rare', 'all-seeing', 'All-Seeing', 'skill', 2, 'none', [discoverOp(undefined, 2, true)], {
    exhaust: true,
  }),
  s(
    'rare',
    'serenity-incarnate',
    'Serenity Incarnate',
    'power',
    3,
    'none',
    [on('turnEnd', [heal(3), barrier(6)])],
    { up: { effects: [on('turnEnd', [heal(3), barrier(9)])] } },
  ),
  s(
    'uncommon',
    'still-water',
    'Still Water',
    'skill',
    1,
    'foe',
    // (Sapped in place of Barrier, DECISIONS #788)
    [scaled(statusTheirs('sapped', 5, 'target'), per('calm', 4)), draw(1)],
    {
      text: 'Apply 5 Sapped, or 9 if you are Serene, until the end of its next turn. Draw 1 card.',
      up: {
        effects: [scaled(statusTheirs('sapped', 7, 'target'), per('calm', 5)), draw(1)],
        text: 'Apply 7 Sapped, or 12 if you are Serene, until the end of its next turn. Draw 1 card.',
      },
    },
  ),
  s('uncommon', 'exhale', 'Exhale', 'skill', 0, 'none', [stance('none'), mana(1)], {
    exhaust: true,
  }),
  s(
    'uncommon',
    'mirror-pool',
    'Mirror Pool',
    'skill',
    1,
    'none',
    [scaled(barrier(0), per('mana', 3)), stance('calm')],
    { retain: true },
  ),
  s(
    'rare',
    'gentle-return',
    'Gentle Return',
    'power',
    1,
    'none',
    [on('stance', [heal(1), barrier(3)], { stance: 'calm' })],
    { up: { effects: [on('stance', [heal(1), barrier(5)], { stance: 'calm' })] } },
  ),
  s(
    'rare',
    'tide-of-peace',
    'Tide of Peace',
    'skill',
    0,
    'none',
    // (heals 3 per Mana spent since #720, Robert: "its just such a low chance anyone would take it as barrier"; was Barrier 4 per Mana.
    // Heal is 1.5 a point to Barrier's 1, so 3 HP a Mana is a little over the old 4 Barrier, and a heal a deck could loop Consumes)
    [scaled(heal(0), per('x', 3)), draw(2), stance('calm')],
    { x: true, exhaust: true },
  ),

  // --- Radiant ---
  s('common', 'whispered-vow', 'Whispered Vow', 'skill', 1, 'none', [status('mantra', 3), scry(2)]),
  s('common', 'bowing-low', 'Bowing Low', 'skill', 0, 'none', [status('mantra', 2), barrier(2)], {
    up: { effects: [status('mantra', 3), barrier(2)] },
  }),
  s('common', 'sunlit-blade', 'Sunlit Blade', 'attack', 1, 'foe', [dmg(9), status('mantra', 1)]),
  s('uncommon', 'the-offering', 'The Offering', 'skill', 1, 'none', [status('mantra', 5)], {
    retain: true,
  }),
  s('rare', 'litany', 'Litany', 'power', 1, 'none', [
    on('play', [status('mantra', 1)], { filter: 'skill' }),
  ]),
  s(
    'uncommon',
    'daily-rite',
    'Daily Rite',
    'power',
    1,
    'none',
    [on('turnStart', [status('mantra', 2)])],
    { up: { effects: [on('turnStart', [status('mantra', 3)])] } },
  ),
  s('rare', 'rise-radiant', 'Rise Radiant', 'skill', 2, 'none', [stance('radiant')], {
    exhaust: true,
  }),
  s(
    'common',
    'reading-the-signs',
    'Reading the Signs',
    'power',
    1,
    'none',
    [on('discard', [status('mantra', 1)])],
    { up: { innate: true } },
  ),
  s(
    'rare',
    'perfect-balance',
    'Perfect Balance',
    'power',
    2,
    'none',
    [on('stance', [draw(1), barrier(2)])],
    { up: { effects: [on('stance', [draw(1), barrier(4)])] } },
  ),
  s(
    'rare',
    'still-flame-ascendant',
    'Still Flame Ascendant',
    'skill',
    3,
    'none',
    [stance('radiant'), status('vigor', 4), draw(2)],
    { exhaust: true },
  ),
  // (it makes more Mana than it costs, so it Consumes: the costing guide's rule for Mana cards)
  s('uncommon', 'deep-breath', 'Gather Breath', 'skill', 1, 'none', [manaNext(2), draw(2)], {
    exhaust: true,
    // (the "+" draws one more, not more Mana as well)
    up: { effects: [manaNext(2), draw(3)] },
  }),
  s('common', 'prostrate', 'Kneel', 'skill', 0, 'none', [status('mantra', 2), draw(1)], {
    exhaust: true,
    up: { effects: [status('mantra', 3), draw(1)] },
  }),
  s('uncommon', 'worship', 'Hymn of Embers', 'skill', 2, 'none', [status('mantra', 5), barrier(8)]),
  s(
    'uncommon',
    'devotion',
    'Morning Prayer',
    'power',
    1,
    'none',
    [on('turnStart', [status('mantra', 1), barrier(2)])],
    { up: { effects: [on('turnStart', [status('mantra', 1), barrier(4)])] } },
  ),
  s('rare', 'scrawl', 'Flood of Visions', 'skill', 1, 'none', [draw(5), status('mantra', 2)], {
    exhaust: true,
  }),
  s('rare', 'last-rites-of-flame', 'Last Rites of the Flame', 'attack', 3, 'none', [
    dmg(16, 'allFoes'),
    status('mantra', 5),
  ]),
  s(
    'rare',
    'radiant-heart',
    'Radiant Heart',
    'power',
    1,
    'none',
    [on('stance', [draw(3)], { stance: 'radiant' })],
    { up: { effects: [on('stance', [draw(4)], { stance: 'radiant' })] } },
  ),
  s(
    'uncommon',
    'foretold-flame',
    'Foretold Flame',
    'attack',
    1,
    'foe',
    [scaled(dmg(5), { by: 'fervorGained', step: 3 }), scry(2)],
    { up: { effects: [scaled(dmg(8), { by: 'fervorGained', step: 3 }), scry(2)] } },
  ),
  s('common', 'faith-kept', 'Faith Kept', 'skill', 1, 'none', [status('mantra', 3)], {
    retain: true,
    onExhaust: [status('mantra', 3)],
  }),
  // (the Fervor gained this turn since #721, Robert: it read your Fervor, always 0-9 and 0 on the turn it reached 10 and was spent)
  s('uncommon', 'mantra-engine', 'Mantra Engine', 'power', 1, 'none', [
    on('turnEnd', [scaled(barrier(0), per('fervorGainedTurn', 1))]),
  ]),
  s(
    'rare',
    'burning-litany',
    'Burning Litany',
    'skill',
    3,
    'none',
    // (half the Fervor gained this fight since #721: it read your Fervor, never more than 9, as reaching 10 spends it on Radiant;
    // it is Rise Radiant plus 1 Mana, so half keeps that Mana near a rare's rate: about 12 AoE by turn 6; a Skill, so Radiant never triples it)
    [scaled(dmg(0, 'allFoes'), { by: 'fervorGained', step: 2 }), stance('radiant')],
    {
      exhaust: true,
      up: {
        effects: [scaled(dmg(4, 'allFoes'), { by: 'fervorGained', step: 2 }), stance('radiant')],
      },
    },
  ),
  s(
    'rare',
    'unwavering',
    'Unwavering',
    'power',
    2,
    'none',
    [
      on('discard', [barrier(4), status('mantra', 1)]),
      on('exhaust', [barrier(4), status('mantra', 1)]),
    ],
    {
      up: {
        effects: [
          on('discard', [barrier(6), status('mantra', 1)]),
          on('exhaust', [barrier(6), status('mantra', 1)]),
        ],
      },
    },
  ),

  // --- glue: cards for any deck (DECISIONS #337) ---
  s(
    'common',
    'crushing-palm',
    'Crushing Palm',
    'attack',
    1,
    'foe',
    [dmg(8), status('exposed', 1, 'target')],
    { up: { effects: [dmg(11), status('exposed', 1, 'target')] } },
  ),
  s('uncommon', 'inner-sight', 'Inner Sight', 'skill', 1, 'none', [barrier(5), scry(4)]),
  s('common', 'quick-palms', 'Quick Palms', 'attack', 0, 'foe', [dmg(4), status('mantra', 1)], {
    up: { effects: [dmg(7), status('mantra', 1)] },
  }),

  // --- more glue: uncommons and rares for any deck (DECISIONS #339) ---
  s('rare', 'spirit-shield', "Mountain's Stillness", 'skill', 2, 'none', [
    scaled(barrier(6), per('hand', 3)),
  ]),
  s(
    'rare',
    'breath-between-blows',
    'Breath Between Blows',
    'power',
    1,
    'none',
    [on('play', [barrier(2)], { filter: 'skill' })],
    { up: { effects: [on('play', [barrier(3)], { filter: 'skill' })] } },
  ),
  s('uncommon', 'held-breath', 'Held Breath', 'skill', 1, 'none', [status('holdfast', 1)]),

  // --- brought back for the 20/30/25 rarity target (DECISIONS #341) ---
  s('uncommon', 'rending-hands', 'Rending Hands', 'attack', 1, 'foe', [
    dmg(6, 'target', 2),
    lose(1),
  ]),
  s(
    'uncommon',
    'blood-on-the-sand',
    'Iron Body',
    'power',
    1,
    'none',
    // (once a turn, and more for it: Fury loops built Primed without end, DECISIONS #534)
    [on('stance', [lose(1), status('vigor', 4)], { stance: 'wrath', once: true })],
    {
      up: {
        effects: [on('stance', [lose(1), status('vigor', 5)], { stance: 'wrath', once: true })],
      },
    },
  ),
  s('uncommon', 'open-palm', 'Open Palm', 'attack', 1, 'foe', [
    dmg(5, 'target', 2),
    stance('none'),
  ]),
  s(
    'uncommon',
    'shield-of-faith',
    'Shield of Faith',
    'skill',
    1,
    'none',
    [barrier(7), status('mantra', 1)],
    {
      up: { effects: [barrier(10), status('mantra', 1)] },
    },
  ),
  s('uncommon', 'poise', 'Poise', 'power', 1, 'none', [status('bracing', 3)]),

  // --- new for the 20/30/25 rarity target (DECISIONS #341) ---
  // (4 hits of 5, was 7 of 3: Primed goes on every hit, and Radiant triples it, DECISIONS #533)
  s('rare', 'thousand-palms', 'Thousand Palms', 'attack', 2, 'foe', [dmg(5, 'target', 4)]),
  s(
    'rare',
    'unbroken-calm',
    'Unbroken Calm',
    'power',
    2,
    'none',
    [on('turnStart', [barrier(4), draw(1)])],
    { up: { effects: [on('turnStart', [barrier(6), draw(1)])] } },
  ),

  // --- brought back for the 20/30/25 rarity target (DECISIONS #341) ---
  s('uncommon', 'wreath-of-flame', 'Crown of Embers', 'skill', 1, 'none', [
    status('vigor', 6),
    status('mantra', 2),
  ]),
];
