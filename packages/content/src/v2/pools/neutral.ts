// Neutral cards (every Riftwalker may be offered them), Warden signature cards and junk.
// The shared toolkit lives here: a little draw, Scry, Exhaust, Barrier and an X-cost attack. The signature mechanics
// (Shivs, Totems, Stances, Arcana...) never appear in Neutral (docs/09_ROSTER.md §1).
// A Neutral card is never better than the class card it resembles: equal at most, or a little behind (DECISIONS #500). Ancestral cards may compete.

import type { CardDef } from '@sr/combat';
import {
  barrier,
  card,
  cheapen,
  cleanse,
  dispel,
  copySelf,
  discoverOp,
  dmg,
  draw,
  drawNext,
  exhaustN,
  heal,
  lose,
  mana,
  manaNext,
  maxMana,
  on,
  PREVENT,
  scry,
  status,
  summon,
  upgradeOp,
} from '../build';

const N = 'neutral';
const n = (
  rarity: Parameters<typeof card>[1],
  id: string,
  name: string,
  kind: Parameters<typeof card>[4],
  cost: number,
  target: Parameters<typeof card>[6],
  effects: Parameters<typeof card>[7],
  extra: Parameters<typeof card>[8] = {},
): CardDef => card(N, rarity, id, name, kind, cost, target, effects, { hero: N, ...extra });

export const NEUTRAL: CardDef[] = [
  n('basic', 'strike', 'Strike', 'attack', 1, 'foe', [dmg(6)]),
  n('basic', 'defend', 'Defend', 'skill', 1, 'none', [barrier(5)]),
  n('common', 'rift-bolt', 'Rift Bolt', 'attack', 0, 'foe', [dmg(5)], { exhaust: true }),
  n('common', 'catch-breath', 'Catch Breath', 'skill', 1, 'none', [draw(2)]),
  n('common', 'steady-guard', 'Steady Guard', 'skill', 1, 'none', [barrier(8)], { retain: true }),
  n('common', 'haft-strike', 'Haft Strike', 'attack', 1, 'foe', [dmg(8), draw(1)]),
  n('common', 'shatter-strike', 'Shatter Strike', 'attack', 2, 'foe', [dmg(14)]),
  n('common', 'reckless-swing', 'Reckless Swing', 'attack', 0, 'foe', [dmg(7), lose(3)]),
  // (named "Stagger" until the Drunkard's Stagger keyword, DECISIONS #393; the id stays)
  n('common', 'stagger', 'Off Balance', 'attack', 1, 'foe', [
    dmg(4),
    status('faltering', 2, 'target'),
  ]),
  n('common', 'glimpse-ahead', 'Glimpse Ahead', 'skill', 1, 'none', [scry(4)]),
  n('uncommon', 'rift-storm', 'Rift Storm', 'attack', 2, 'none', [dmg(7, 'allFoes')]),
  n(
    'uncommon',
    'rift-whirl',
    'Rift Whirl',
    'attack',
    0,
    'none',
    [{ op: 'damage', amount: 4, hits: 0, to: 'allFoes', scale: { by: 'x', into: 'hits' } }],
    { x: true },
  ),
  n('uncommon', 'wanderers-draught', "Wanderer's Draught", 'skill', 1, 'none', [heal(6)], {
    exhaust: true,
  }),
  // The cleansing line: lessen every debuff on you (Exposed, Faltering, Seared, Stunned, Brittle, Doom). Only the highest rarity of
  // the line dispels them completely; the rest only soften them.
  // (upgraded, each of the three also Holds, DECISIONS #763: an answer to a curse deck, such as Fate, can wait in the hand for it)
  n(
    'common',
    'shrug-it-off',
    'Shake It Off',
    'skill',
    1,
    'none',
    [cleanse(1, 'self', 25), barrier(4)],
    { up: { retain: true, effects: [cleanse(2, 'self', 25), barrier(7)] } },
  ),
  n(
    'uncommon',
    'steady-nerves',
    'Steady Nerves',
    'skill',
    // (and a card since DECISIONS #796: it was Shake It Off with bigger numbers; the uncommon answer keeps the hand going too)
    1,
    'none',
    [cleanse(2, 'self', 50), barrier(6), draw(1)],
    { up: { retain: true, effects: [cleanse(3, 'self', 50), barrier(9), draw(1)] } },
  ),
  n('rare', 'purging-light', 'Purging Light', 'skill', 2, 'none', [dispel(), barrier(8)], {
    exhaust: true,
    up: { retain: true, effects: [dispel(), barrier(11)] },
  }),
  // (one rarity up each, DECISIONS #765: every deck took every copy it was offered, Mana being worth more than any class card)
  n('uncommon', 'rift-surge', 'Rift Surge', 'skill', 1, 'none', [mana(2)], { exhaust: true }),
  n('rare', 'nerve-surge', 'Nerve Surge', 'skill', 0, 'none', [draw(1), mana(1)], {
    exhaust: true,
    up: { effects: [draw(2), mana(1)] },
  }),
  n('uncommon', 'cull-the-hand', 'Cull the Hand', 'skill', 1, 'none', [exhaustN(1), draw(2)]),
  // (an Aura that keeps working: Might now, and again every time the deck is reshuffled; DECISIONS #299)
  n('rare', 'rift-resonance', 'Rift Resonance', 'power', 2, 'none', [
    status('might', 1),
    on('shuffle', [status('might', 1)]),
  ]),
  n('common', 'pitfall', 'Hidden Pitfall', 'snare', 1, 'none', [dmg(7, 'attacker')], {
    trigger: { on: 'attacked' },
  }),
  n(
    'common',
    'alarm-bell',
    'Alarm Bell',
    'snare',
    1,
    'none',
    [dmg(6, 'attacker'), status('faltering', 2, 'attacker'), barrier(4)],
    { trigger: { on: 'foeSummons' } },
  ),
  n('common', 'heave', 'Heave', 'skill', 0, 'none', [status('might', 2, 'self', true)]),
  n('common', 'needling-blow', 'Needling Blow', 'attack', 0, 'foe', [dmg(6), copySelf('discard')]),
  n(
    'uncommon',
    'rift-windfall',
    'Rift Windfall',
    'skill',
    1,
    'none',
    [discoverOp(undefined, 1, true)],
    {
      exhaust: true,
    },
  ),
  n('common', 'plan-ahead', 'Plan Ahead', 'skill', 1, 'none', [manaNext(1), drawNext(1)], {
    up: { effects: [manaNext(1), drawNext(2)] },
  }),
  n('uncommon', 'fever-dream', 'Fever Dream', 'skill', 0, 'none', [cheapen(2, 'random')], {
    exhaust: true,
    up: { retain: true },
  }),
  n('rare', 'echoing-blow', 'Echoing Blow', 'skill', 1, 'none', [status('twinned', 1)]),
  n('rare', 'rift-smithing', 'Rift Smithing', 'skill', 2, 'none', [upgradeOp('hand')], {
    exhaust: true,
  }),
  // (a step behind The Long Game: DECISIONS #500)
  n(
    'uncommon',
    'heart-of-the-rift',
    'Heart of the Rift',
    'power',
    2,
    'none',
    [on('turnStart', [draw(1)])],
    {
      up: { cost: 1 },
    },
  ),
  n(
    'rare',
    'rift-collapse',
    'Rift Collapse',
    'attack',
    3,
    'none',
    [dmg(30, 'allFoes'), lose(15)],
    // (bigger, not cheaper, since DECISIONS #500: 30 to ALL for 2 Mana would be far over)
    { exhaust: true, up: { effects: [dmg(36, 'allFoes'), lose(15)] } },
  ),
  // (an Aura: its Mana lasts the rest of the fight, like Blood Pact, DECISIONS #381; a Mana dearer than the class versions, #500)
  // (1 more Mana since #710: an Aura that gives Mana every turn, Robert: "cards that give mana ever turn need to probably be a bit costlier")
  n('rare', 'attunement', 'Attunement', 'power', 4, 'none', [maxMana(1)], { up: { cost: 3 } }),
];

// Warden signature cards: one set per Warden, offered as the Warden's Gift. Any Riftwalker can take them.
const sig = (boss: string) => ({ hero: N, source: `boss:${boss}` });
export const SIGNATURES: CardDef[] = [
  card(
    N,
    'rare',
    'bell-of-judgment',
    'Bell of Judgment',
    'snare',
    2,
    'none',
    [dmg(20, 'attacker'), status('exposed', 2, 'attacker')],
    { trigger: { on: 'attacked' }, ...sig('seraphine') },
  ),
  card(
    N,
    'rare',
    'gilded-guard',
    'Gilded Guard',
    'summon',
    2,
    'none',
    [summon('gilded-guard')],
    sig('seraphine'),
  ),
  card(
    N,
    'rare',
    'seraphines-oath',
    "Seraphine's Oath",
    'power',
    2,
    'none',
    [status('thorns', 3), status('shielded', 1)],
    sig('seraphine'),
  ),
  card(N, 'rare', 'orbital-uplink', 'Orbital Uplink', 'snare', 1, 'none', [dmg(14, 'attacker')], {
    trigger: { on: 'foeSummons' },
    ...sig('kron'),
  }),
  card(
    N,
    'rare',
    'override-virus',
    'Override Virus',
    'skill',
    2,
    'foe',
    [status('stunned', 2, 'target')],
    sig('kron'),
  ),
  card(
    N,
    'rare',
    'assembly-arm',
    "Kron's Assembly Arm",
    'power',
    1,
    'none',
    [{ op: 'attackAura', amount: 1, scope: 'friends' }, draw(1)],
    {
      ...sig('kron'),
      up: { effects: [{ op: 'attackAura', amount: 2, scope: 'friends' }, draw(2)] },
    },
  ),
  card(
    N,
    'rare',
    'the-hunger-below',
    'The Hunger Below',
    'attack',
    3,
    'foe',
    [dmg(22), heal(8)],
    sig('gorrmaw'),
  ),
  card(
    N,
    'rare',
    'maw-spawn-egg',
    'Maw Spawn Egg',
    'summon',
    2,
    'none',
    [summon('maw-hatchling')],
    sig('gorrmaw'),
  ),
  card(
    N,
    'rare',
    'gorrmaws-tooth',
    "Gorrmaw's Tooth",
    'power',
    1,
    'none',
    [status('might', 2), lose(3)],
    sig('gorrmaw'),
  ),
  card(
    N,
    'rare',
    'nyxaras-web',
    "Nyxara's Web",
    'snare',
    1,
    'none',
    [PREVENT, status('exposed', 2, 'attacker'), barrier(6)],
    { trigger: { on: 'attacked' }, ...sig('nyxara') },
  ),
  card(
    N,
    'rare',
    'faceless-courtier',
    'Faceless Courtier',
    'skill',
    1,
    'none',
    [status('exposed', 2, 'allFoes'), status('faltering', 1, 'allFoes')],
    sig('nyxara'),
  ),
  card(
    N,
    'rare',
    'unmasking',
    'Unmasking',
    'attack',
    2,
    'foe',
    [dmg(12), status('seared', 4, 'target')],
    sig('nyxara'),
  ),
];

export const JUNK: CardDef[] = [
  card('junk', 'basic', 'nightmare', 'Recurring Nightmare', 'skill', 1, 'none', [draw(1)], {
    exhaust: true,
    hero: 'junk',
    source: 'token',
    tags: ['status'],
    onDiscard: [{ op: 'addCard', card: 'nightmare', to: 'discard', side: 'self' }],
    inHandAtEnd: [{ op: 'addCard', card: 'nightmare', to: 'discard', side: 'self' }],
  }),
  // (status cards: the shaman's Smokestack-like cards count them, DECISIONS #371)
  card('junk', 'basic', 'wound', 'Wound', 'skill', 0, 'none', [], {
    unplayable: true,
    hero: 'junk',
    tags: ['status'],
  }),
  card('junk', 'basic', 'static', 'Static', 'skill', 0, 'none', [], {
    unplayable: true,
    hero: 'junk',
    tags: ['status'],
  }),
  // (The Mourning Tide's rule, DECISIONS #528: pay a Mana to be rid of it, or it hurts)
  card('junk', 'basic', 'beckoning', 'Beckoning', 'skill', 1, 'none', [], {
    exhaust: true,
    inHandAtEnd: [{ op: 'loseHp', amount: 4, to: 'self' }],
    hero: 'junk',
    source: 'token',
    tags: ['status'],
  }),
];

// Ancestral cards: powerful, no class, one copy per deck. They are never in the ordinary card rewards: they turn up only in the
// Ancestors' Offering event, the Warden's Gift, the merchant (rarely, and dear) and the "Call on the Ancestors" bargain.
const anc = (
  id: string,
  name: string,
  kind: Parameters<typeof card>[4],
  cost: number,
  target: Parameters<typeof card>[6],
  effects: Parameters<typeof card>[7],
  extra: Parameters<typeof card>[8] = {},
): CardDef =>
  n('ancestral', id, name, kind, cost, target, effects, { source: 'ancestral', ...extra });

export const ANCESTRAL: CardDef[] = [
  anc('ancestral-blade', 'Ancestral Blade', 'attack', 2, 'foe', [dmg(30)], {
    exhaust: true,
    up: { effects: [dmg(34)] },
  }),
  anc('elders-bulwark', "Elder's Bulwark", 'skill', 2, 'none', [barrier(28)], {
    exhaust: true,
    retain: true,
    up: { effects: [barrier(32)] },
  }),
  anc('forebears-gift', "Forebear's Gift", 'skill', 0, 'none', [mana(2), draw(2)], {
    exhaust: true,
  }),
  anc(
    'echo-of-ages',
    'Echo of Ages',
    'skill',
    1,
    'none',
    [status('might', 2), status('thorns', 2)],
    { exhaust: true, up: { effects: [status('might', 3), status('thorns', 2)] } },
  ),
  anc('rite-of-renewal', 'Rite of Renewal', 'skill', 2, 'none', [heal(14), barrier(10)], {
    exhaust: true,
  }),
  // (1 more Mana since #710: an Aura that gives Mana every turn, Robert: "cards that give mana ever turn need to probably be a bit costlier")
  anc('ancient-pact', 'Ancient Pact', 'power', 2, 'none', [on('turnStart', [mana(1), lose(2)])], {
    up: { effects: [on('turnStart', [mana(1), lose(1)])] },
  }),
  anc('ancestral-memory', 'Ancestral Memory', 'skill', 1, 'none', [draw(2), upgradeOp('hand')], {
    exhaust: true,
  }),
  anc('spirit-hunt', 'Spirit Hunt', 'attack', 1, 'none', [dmg(12, 'allFoes')], { exhaust: true }),
  anc('lineage', 'Lineage', 'power', 1, 'none', [on('play', [draw(1)], { filter: 'power' })], {
    up: { innate: true },
  }),
  anc(
    'wrath-of-ages',
    'Wrath of Ages',
    'attack',
    3,
    'foe',
    [dmg(40), status('exposed', 2, 'target')],
    { exhaust: true },
  ),
  // (an Aura, DECISIONS #410: +1 Mana a turn for 1 with no price was ~40% over; at 2 like the other Mana Auras, with Opening hand as
  // an ancestral card's edge over Attunement)
  // (1 more Mana since #710: an Aura that gives Mana every turn, Robert: "cards that give mana ever turn need to probably be a bit costlier")
  anc('the-long-memory', 'The Long Memory', 'power', 3, 'none', [on('turnStart', [mana(1)])], {
    innate: true,
    // (not cheaper, DECISIONS #500: +1 Mana a turn for 1, in the opening hand, with no price, beat every class version)
    up: { effects: [draw(1), on('turnStart', [mana(1)])] },
  }),
  anc(
    'unbroken-line',
    'Unbroken Line',
    'power',
    3,
    'none',
    [on('turnStart', [barrier(6), heal(2)])],
    { up: { effects: [on('turnStart', [barrier(9), heal(2)])] } },
  ),
];
