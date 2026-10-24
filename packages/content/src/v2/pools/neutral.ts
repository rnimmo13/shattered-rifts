// Neutral cards (every Riftwalker may be offered them), Warden signature cards and junk.
// The shared toolkit lives here: a little draw, Scry, Exhaust, Barrier and an X-cost attack. The signature mechanics
// (Shivs, Totems, Stances, Arcana...) never appear in Neutral (docs/09_ROSTER.md §1).

import type { CardDef } from '@sr/combat';
import {
  barrier,
  card,
  cheapen,
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
  n('basic', 'strike', 'Slash', 'attack', 1, 'foe', [dmg(6)]),
  n('basic', 'defend', 'Guard', 'skill', 1, 'none', [barrier(5)]),
  n('common', 'rift-bolt', 'Rift Bolt', 'attack', 0, 'foe', [dmg(5)], { exhaust: true }),
  n('common', 'catch-breath', 'Catch Breath', 'skill', 1, 'none', [draw(2)]),
  n('common', 'steady-guard', 'Steady Guard', 'skill', 1, 'none', [barrier(8)], { retain: true }),
  n('common', 'haft-strike', 'Haft Strike', 'attack', 1, 'foe', [dmg(8), draw(1)]),
  n('common', 'shatter-strike', 'Shatter Strike', 'attack', 2, 'foe', [dmg(14)]),
  n('common', 'reckless-swing', 'Reckless Swing', 'attack', 0, 'foe', [dmg(9), lose(3)]),
  n('common', 'stagger', 'Stagger', 'attack', 1, 'foe', [dmg(4), status('faltering', 2, 'target')]),
  n('common', 'glimpse-ahead', 'Glimpse Ahead', 'skill', 1, 'none', [scry(4), draw(1)]),
  n('uncommon', 'rift-storm', 'Rift Storm', 'attack', 2, 'none', [dmg(7, 'allFoes')]),
  n(
    'uncommon',
    'rift-whirl',
    'Rift Whirl',
    'attack',
    0,
    'none',
    [
      {
        op: 'damage',
        amount: 4,
        hits: 0,
        to: 'allFoes',
        scale: { by: 'x', into: 'hits' },
      },
    ],
    { x: true },
  ),
  n('uncommon', 'wanderers-draught', "Wanderer's Draught", 'skill', 1, 'none', [heal(6)], {
    exhaust: true,
  }),
  n('uncommon', 'rift-surge', 'Rift Surge', 'skill', 0, 'none', [mana(2)], { exhaust: true }),
  n('uncommon', 'nerve-surge', 'Nerve Surge', 'skill', 0, 'none', [draw(2), mana(1)], {
    exhaust: true,
  }),
  n('uncommon', 'cull-the-hand', 'Cull the Hand', 'skill', 1, 'none', [exhaustN(1), draw(2)]),
  n('rare', 'rift-resonance', 'Rift Resonance', 'power', 2, 'none', [status('might', 2)]),
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
  n('common', 'heave', 'Heave', 'skill', 0, 'none', [status('might', 3, 'self', true)]),
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
  n('uncommon', 'plan-ahead', 'Plan Ahead', 'skill', 1, 'none', [manaNext(2), drawNext(1)]),
  n('uncommon', 'fever-dream', 'Fever Dream', 'skill', 0, 'none', [cheapen(2, 'random')], {
    exhaust: true,
    up: { effects: [cheapen(3, 'random')] },
  }),
  n('rare', 'echoing-blow', 'Echoing Blow', 'skill', 1, 'none', [status('twinned', 1)]),
  n('rare', 'rift-smithing', 'Rift Smithing', 'skill', 2, 'none', [upgradeOp('hand')], {
    exhaust: true,
  }),
  n('legendary', 'heart-of-the-rift', 'Heart of the Rift', 'power', 3, 'none', [
    on('turnStart', [mana(1), draw(1)]),
  ]),
  n(
    'legendary',
    'rift-collapse',
    'Rift Collapse',
    'attack',
    3,
    'none',
    [dmg(40, 'allFoes'), lose(15)],
    {
      exhaust: true,
    },
  ),
  n('uncommon', 'borrowed-time', 'Borrowed Time', 'skill', 0, 'none', [mana(3), manaNext(-2)], {
    exhaust: true,
  }),
  n('rare', 'attunement', 'Attunement', 'skill', 2, 'none', [maxMana(1)], { exhaust: true }),
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
    [status('stunned', 1, 'target'), status('exposed', 2, 'target')],
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
    [status('might', 1, 'allFriends'), draw(1)],
    sig('kron'),
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
  card('junk', 'basic', 'wound', 'Wound', 'skill', 0, 'none', [], {
    unplayable: true,
    hero: 'junk',
  }),
  card('junk', 'basic', 'static', 'Static', 'skill', 0, 'none', [], {
    unplayable: true,
    hero: 'junk',
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
  anc('ancestral-blade', 'Ancestral Blade', 'attack', 2, 'foe', [dmg(22)], { exhaust: true }),
  anc('elders-bulwark', "Elder's Bulwark", 'skill', 2, 'none', [barrier(22)], {
    exhaust: true,
    retain: true,
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
    [status('might', 3), status('thorns', 2)],
    { exhaust: true },
  ),
  anc('rite-of-renewal', 'Rite of Renewal', 'skill', 2, 'none', [heal(14), barrier(10)], {
    exhaust: true,
  }),
  anc('ancient-pact', 'Ancient Pact', 'power', 1, 'none', [on('turnStart', [mana(1), lose(2)])]),
  anc('ancestral-memory', 'Ancestral Memory', 'skill', 1, 'none', [draw(2), upgradeOp('hand')], {
    exhaust: true,
  }),
  anc('spirit-hunt', 'Spirit Hunt', 'attack', 1, 'none', [dmg(12, 'allFoes')], { exhaust: true }),
  anc('lineage', 'Lineage', 'power', 2, 'none', [on('play', [draw(1)], { filter: 'power' })]),
  anc(
    'wrath-of-ages',
    'Wrath of Ages',
    'attack',
    3,
    'foe',
    [dmg(40), status('exposed', 2, 'target')],
    { exhaust: true },
  ),
  anc('the-long-memory', 'The Long Memory', 'skill', 1, 'none', [maxMana(1)], {
    exhaust: true,
    retain: true,
  }),
  anc('unbroken-line', 'Unbroken Line', 'power', 3, 'none', [
    on('turnStart', [barrier(6), heal(2)]),
  ]),
];
