// Ilvane (display name; the id stays 'shaman', DECISIONS #141), an elder shaman of the old spirits. Rebuilt 2026-10-29
// (docs/BASE_CLASS_REWORKS.md §5, DECISIONS #418): he plants enduring totems in three fixed positions and, once each turn, commands
// one of them; its spirit manifests, acts and returns. His Defect copy (orbs in a queue that pushes the oldest out, Focus, Owl Mana,
// the 0-cost recursion package; DECISIONS #371) is archived in reviews/balance-baselines/2026-10-29-pre-identity-reworks/.
//
// Spirits (TOTEMS below; a totem does nothing on its own: no passive, no awakening):
//   Hawk  - command: 4 damage to an enemy you choose (not an attack: no Might, no Exposed)
//   Bear  - command: 4 Barrier to a friendly you choose
//   Elder - command: gain 1 Spirit and draw a card (Spirit can never empower the Elder)
// `plant(spirit)`: into the first free position; with all three taken the player chooses one to replace, or keeps them all.
// `plant(spirit, true)`: a position the player chooses. Spirit (at most 3, kept between turns): one may be spent on a Hawk or Bear
// command for +2. Rousing: the next Hawk or Bear command this turn deals or gives N more. One command a turn, however many totems.
//
// Three strategies, plus glue (build paths stay hidden, DECISIONS #365):
//   Storm   - the Hawk on the attack: Rousing, Hawk payoffs, direct damage
//   Shelter - the Bear and Barrier: guard cards, Bear payoffs
//   Rites   - Spirit, the Elder, and deliberate replacement and uprooting
// Costs and points: docs/reworks/SHAMAN.md and shaman-ledger.md (docs/14_CARD_COSTING.md §15). Card ids that came through from the
// old pool keep their art and every saved deck.

import type { CardDef, Op, TotemDef } from '@sr/combat';
import {
  addTo,
  barrier,
  barrierNext,
  card,
  dmg,
  draw,
  drawNext,
  fetchCards,
  gainSpirit,
  ifTotem,
  lose,
  mana,
  manaNext,
  on,
  onKill,
  per,
  plant,
  pool,
  recost,
  rouse,
  scaled,
  shelter,
  spendSpirit,
  status,
  STATUS_TAG,
  uproot,
  when,
} from '../build';

export const TOTEMS: TotemDef[] = [
  {
    id: 'hawk',
    name: 'Hawk',
    text: 'Command: 4 damage to an enemy you choose (not an attack).',
    aim: 'foe',
    command: [dmg(4, 'target')],
    empower: true,
  },
  {
    id: 'bear',
    name: 'Bear',
    text: 'Command: 4 Barrier to a friendly you choose.',
    aim: 'friend',
    command: [barrier(4, 'target')],
    empower: true,
  },
  {
    id: 'elder',
    name: 'Elder',
    text: 'Command: gain 1 Spirit and draw a card. (Spirit cannot empower the Elder.)',
    aim: 'none',
    command: [gainSpirit(1), draw(1)],
    empower: false,
  },
];

const i = pool('shaman', 'nexus');
const ifHawk = (ops: Op[]): Op => ifTotem('hawk', ops);
const ifBear = (ops: Op[]): Op => ifTotem('bear', ops);
const ifElder = (ops: Op[]): Op => ifTotem('elder', ops);
/** "Deal N damage once for every totem you have" (Totem Volley) */
const perTotem = (n: number): Op => ({
  op: 'damage',
  amount: n,
  hits: 0,
  to: 'target',
  scale: { by: 'totems', into: 'hits' },
});
/** "Deal N damage once for every kind of totem you have" (Chorus of Spirits) */
const perKind = (n: number): Op => ({
  op: 'damage',
  amount: n,
  hits: 0,
  to: 'target',
  scale: { by: 'totemKinds', into: 'hits' },
});

export const SHAMAN: CardDef[] = [
  // --- basics ---
  i(
    'basic',
    'wardkeepers-pact',
    "Wardkeeper's Pact",
    'skill',
    1,
    'none',
    [barrier(5), plant('bear')],
    {
      up: { effects: [barrier(7), plant('bear')] },
    },
  ),
  i('basic', 'guided-talon', 'Guided Talon', 'attack', 1, 'foe', [dmg(6), ifHawk([rouse(3)])], {
    up: { effects: [dmg(9), ifHawk([rouse(3)])] },
  }),

  // --- glue: general attacks, Barrier and cards ---
  i('common', 'stone-skin', 'Stone Skin', 'skill', 1, 'none', [barrier(9)]),
  i('common', 'gale-strike', 'Gale Strike', 'attack', 1, 'foe', [dmg(8), recost(-1)], {
    up: { effects: [dmg(11), recost(-1)] },
  }),
  i('common', 'ember-toss', 'Ember Toss', 'attack', 1, 'none', [dmg(6, 'allFoes'), draw(1)], {
    up: { effects: [dmg(9, 'allFoes'), draw(1)] },
  }),
  i('common', 'mudslide', 'Mudslide', 'attack', 1, 'foe', [
    dmg(4, 'target', 3),
    addTo('muck', 1, 'discard'),
  ]),
  i('common', 'tidecaller', 'Tidecaller', 'skill', 1, 'none', [barrier(7), manaNext(1)], {
    up: { effects: [barrier(10), manaNext(1)] },
  }),
  i(
    'common',
    'arc-flash',
    'Arc Flash',
    'attack',
    0,
    'foe',
    [dmg(3), status('exposed', 1, 'target')],
    {
      up: { effects: [dmg(5), status('exposed', 1, 'target')] },
    },
  ),
  i(
    'common',
    'frost-needle',
    'Frost Needle',
    'attack',
    0,
    'foe',
    [
      dmg(4),
      {
        op: 'when',
        by: 'attacking',
        of: 'target',
        atLeast: 1,
        ops: [status('faltering', 1, 'target')],
      },
    ],
    {
      up: {
        effects: [
          dmg(6),
          {
            op: 'when',
            by: 'attacking',
            of: 'target',
            atLeast: 1,
            ops: [status('faltering', 1, 'target')],
          },
        ],
      },
    },
  ),
  i('common', 'spirit-memory', 'Spirit Memory', 'skill', 1, 'none', [barrier(6), fetchCards(1)], {
    up: { effects: [barrier(9), fetchCards(1)] },
  }),
  i('uncommon', 'clear-spring', 'Clear Spring', 'skill', 1, 'none', [draw(3)]),
  i('uncommon', 'crystal-ward', 'Crystal Ward', 'skill', 0, 'none', [barrier(10)], {
    innate: true,
    exhaust: true,
  }),
  i(
    'uncommon',
    'ironbark',
    'Ironbark',
    'skill',
    1,
    'none',
    [barrier(13), addTo('wound', 2, 'discard')],
    {
      up: { effects: [barrier(17), addTo('wound', 2, 'discard')] },
    },
  ),
  i('uncommon', 'skybreaker', 'Skybreaker', 'attack', 3, 'foe', [onKill(dmg(26), [mana(1)])], {
    up: { effects: [onKill(dmg(34), [mana(1)])] },
  }),

  // --- Storm: the Hawk on the attack ---
  i(
    'common',
    'spark-cast',
    'Hawk Call',
    'skill',
    1,
    'none',
    [plant('hawk'), rouse(4), barrier(4)],
    {
      up: { effects: [plant('hawk'), rouse(6), barrier(4)] },
    },
  ),
  i('common', 'spark-lash', 'Spark Lash', 'attack', 1, 'foe', [dmg(7), plant('hawk'), rouse(2)], {
    up: { effects: [dmg(10), plant('hawk'), rouse(2)] },
  }),
  i('common', 'charged-blow', 'Totem Volley', 'attack', 1, 'foe', [perTotem(4)], {
    up: { effects: [perTotem(5)] },
  }),
  i(
    'common',
    'hawkeye-strike',
    "Hawk's Eye",
    'attack',
    1,
    'foe',
    [dmg(8), ifHawk([status('exposed', 1, 'target')])],
    { up: { effects: [dmg(11), ifHawk([status('exposed', 1, 'target')])] } },
  ),
  i('common', 'diving-talon', 'Diving Talon', 'attack', 2, 'foe', [dmg(14), rouse(4)], {
    up: { effects: [dmg(18), rouse(4)] },
  }),
  i(
    'uncommon',
    'hawks-counsel',
    "Hawk's Counsel",
    'skill',
    1,
    'none',
    [plant('hawk', true), gainSpirit(1), draw(2)],
    { up: { effects: [plant('hawk', true), gainSpirit(2), draw(2)] } },
  ),
  i(
    'uncommon',
    'stormcrown',
    'Stormcrown',
    'power',
    1,
    'none',
    [on('command', [dmg(4, 'allFoes')], { rune: 'hawk' })],
    { up: { effects: [on('command', [dmg(5, 'allFoes')], { rune: 'hawk' })] } },
  ),
  i('uncommon', 'arc-lightning', 'Arc Lightning', 'attack', 0, 'foe', [dmg(4), ifHawk([dmg(3)])], {
    up: { effects: [dmg(6), ifHawk([dmg(3)])] },
  }),
  i(
    'uncommon',
    'thunderhead',
    'Thunderhead',
    'attack',
    2,
    'none',
    [dmg(12, 'allFoes'), ifHawk([rouse(4)])],
    { up: { effects: [dmg(15, 'allFoes'), ifHawk([rouse(4)])] } },
  ),
  i(
    'rare',
    'eye-of-the-tempest',
    'Eye of the Tempest',
    'attack',
    2,
    'foe',
    [dmg(7, 'target', 3), ifHawk([rouse(4)])],
    { up: { effects: [dmg(9, 'target', 3), ifHawk([rouse(4)])] } },
  ),
  i(
    'rare',
    'stormcallers-rite',
    "Stormcaller's Rite",
    'skill',
    1,
    'none',
    [rouse(8), gainSpirit(1), draw(1)],
    { up: { effects: [rouse(11), gainSpirit(1), draw(1)] } },
  ),
  i(
    'rare',
    'falling-star',
    'Verdict of the Sky',
    'attack',
    3,
    'foe',
    [dmg(24), status('exposed', 2, 'target'), ifHawk([rouse(5)])],
    { up: { effects: [dmg(30), status('exposed', 2, 'target'), ifHawk([rouse(5)])] } },
  ),

  // --- Shelter: the Bear and Barrier ---
  i(
    'common',
    'rime-strike',
    'Rime Strike',
    'attack',
    1,
    'foe',
    [dmg(6), barrier(3), plant('bear')],
    { up: { effects: [dmg(9), barrier(3), plant('bear')] } },
  ),
  i('common', 'chilled-focus', 'Still Water', 'skill', 1, 'none', [barrier(6), ifBear([draw(1)])], {
    up: { effects: [barrier(9), ifBear([draw(1)])] },
  }),
  i('common', 'frostbark', 'Frostbark', 'skill', 1, 'none', [barrier(7), rouse(2)], {
    up: { effects: [barrier(10), rouse(2)] },
  }),
  i('common', 'bear-hug', 'Bear Hug', 'attack', 1, 'foe', [dmg(7), ifBear([barrier(4)])], {
    up: { effects: [dmg(10), ifBear([barrier(4)])] },
  }),
  i(
    'uncommon',
    'shared-shelter',
    'Shared Shelter',
    'skill',
    1,
    'none',
    [barrier(6), shelter, draw(1)],
    { up: { effects: [barrier(9), shelter, draw(1)] } },
  ),
  i(
    'uncommon',
    'frostglass',
    'Frostglass',
    'skill',
    2,
    'none',
    [barrier(12), plant('bear'), rouse(3)],
    { up: { effects: [barrier(15), plant('bear'), rouse(3)] } },
  ),
  i('uncommon', 'void-pulse', 'Deep Den', 'skill', 2, 'none', [barrier(11), barrierNext(6)], {
    up: { effects: [barrier(14), barrierNext(8)] },
  }),
  i(
    'uncommon',
    'permafrost',
    'Hail Rite',
    'power',
    1,
    'none',
    [on('turnEnd', [ifBear([dmg(4, 'allFoes')])])],
    { up: { effects: [on('turnEnd', [ifBear([dmg(5, 'allFoes')])])] } },
  ),
  i(
    'rare',
    'rune-carapace',
    'Bark Carapace',
    'power',
    1,
    'none',
    [on('turnStart', [scaled(barrier(0), per('totems', 2))])],
    { up: { innate: true } },
  ),
  i(
    'rare',
    'ancestral-bulwark',
    'Ancestral Bulwark',
    'skill',
    2,
    'none',
    [barrier(14), ifBear([rouse(6)])],
    { up: { effects: [barrier(18), ifBear([rouse(6)])] } },
  ),
  i(
    'rare',
    'deep-freeze',
    'Deep Freeze',
    'attack',
    3,
    'foe',
    [dmg(18), barrier(10), plant('bear')],
    { up: { effects: [dmg(23), barrier(10), plant('bear')] } },
  ),
  i(
    'rare',
    'roar-of-the-den',
    'Roar of the Den',
    'power',
    1,
    'none',
    [on('command', [barrier(2), dmg(5, 'allFoes')], { rune: 'bear' })],
    { up: { effects: [on('command', [barrier(2), dmg(7, 'allFoes')], { rune: 'bear' })] } },
  ),

  // --- Rites: Spirit, the Elder, replacement and uprooting ---
  i(
    'common',
    'gathering-dusk',
    'Call the Elder',
    'skill',
    1,
    'none',
    [plant('elder'), gainSpirit(1), barrier(4)],
    { up: { effects: [plant('elder'), gainSpirit(2), barrier(4)] } },
  ),
  i('common', 'resonant-strike', 'Resonant Strike', 'attack', 1, 'foe', [dmg(8), gainSpirit(1)], {
    up: { effects: [dmg(11), gainSpirit(1)] },
  }),
  i(
    'common',
    'tune-the-spirits',
    'Tune the Spirits',
    'skill',
    1,
    'none',
    [gainSpirit(2), barrier(5)],
    {
      up: { effects: [gainSpirit(2), barrier(8)] },
    },
  ),
  i('common', 'driver-of-runes', 'Spirit Guide', 'attack', 1, 'foe', [dmg(7), ifElder([draw(1)])], {
    up: { effects: [dmg(10), ifElder([draw(1)])] },
  }),
  i(
    'uncommon',
    'ancestral-exchange',
    'Ancestral Exchange',
    'skill',
    1,
    'none',
    [barrier(4), plant('*', true), when('replacedNow', { atLeast: 1 }, [gainSpirit(1), draw(1)])],
    {
      up: {
        effects: [
          barrier(7),
          plant('*', true),
          when('replacedNow', { atLeast: 1 }, [gainSpirit(1), draw(1)]),
        ],
      },
    },
  ),
  i(
    'uncommon',
    'rite-of-returning',
    'Rite of Returning',
    'power',
    1,
    'none',
    [on('command', [drawNext(1)], { once: true })],
    { up: { innate: true } },
  ),
  i(
    'uncommon',
    'resounding-call',
    'Resounding Call',
    'skill',
    2,
    'none',
    [rouse(6), gainSpirit(2), barrier(10)],
    { up: { effects: [rouse(6), gainSpirit(2), barrier(13)] } },
  ),
  i(
    'uncommon',
    'elders-wisdom',
    "Elder's Wisdom",
    'skill',
    1,
    'none',
    [barrier(6), spendSpirit(99), scaled(draw(0), per('spiritSpent'))],
    { up: { effects: [barrier(9), spendSpirit(99), scaled(draw(0), per('spiritSpent'))] } },
  ),
  i(
    'uncommon',
    'chorus-of-glyphs',
    'Chorus of Spirits',
    'attack',
    1,
    'foe',
    [perKind(4), gainSpirit(1)],
    { up: { effects: [perKind(5), gainSpirit(1)] } },
  ),
  i(
    'uncommon',
    'spirit-drum',
    'Spirit Drum',
    'power',
    1,
    'none',
    [on('command', [gainSpirit(1), barrier(2)])],
    { up: { effects: [on('command', [gainSpirit(1), barrier(3)])] } },
  ),
  i(
    'rare',
    'circle-of-ancestors',
    'Circle of Ancestors',
    'power',
    1,
    'none',
    [on('replace', [gainSpirit(1), draw(1), dmg(5, 'allFoes')], { once: true })],
    { up: { innate: true } },
  ),
  i('rare', 'tune-the-lattice', 'Elder Communion', 'skill', 1, 'none', [gainSpirit(3), draw(2)], {
    up: { effects: [gainSpirit(3), draw(3)] },
  }),
  i(
    'rare',
    'world-tree',
    'Heart of the World Tree',
    'power',
    1,
    'none',
    [on('turnStart', [gainSpirit(1), barrier(3)])],
    { up: { effects: [on('turnStart', [gainSpirit(1), barrier(4)])] } },
  ),
  i(
    'rare',
    'spiritstorm',
    'Spiritstorm',
    'attack',
    1,
    'none',
    [spendSpirit(99), scaled(dmg(4, 'allFoes'), per('spiritSpent', 4))],
    { up: { effects: [spendSpirit(99), scaled(dmg(7, 'allFoes'), per('spiritSpent', 4))] } },
  ),
  i(
    'rare',
    'shatter-the-row',
    'Release the Spirits',
    'skill',
    1,
    'none',
    [uproot, scaled(dmg(0, 'allFoes'), per('uprooted', 6))],
    {
      exhaust: true,
      up: { effects: [uproot, scaled(dmg(0, 'allFoes'), per('uprooted', 7))] },
    },
  ),
];

// The status cards his old pool made (Dazed, Burn, Slimed, Void; Wound is shared and lives in neutral.ts). Junk, like Wound: never a
// reward. Mudslide still makes a Muck; the others stay for the enemies and events that use them.
const junk = (
  id: string,
  name: string,
  cost: number,
  effects: Op[],
  extra: Partial<CardDef>,
): CardDef => ({
  ...card('junk', 'basic', id, name, 'skill', cost, 'none', effects),
  hero: 'junk',
  source: 'token',
  tags: [STATUS_TAG],
  ...extra,
});

export const SHAMAN_STATUSES: CardDef[] = [
  // (Dazed)
  junk('haze', 'Haze', 0, [], { unplayable: true, ethereal: true }),
  // (Burn: 2 damage in their game, which Block stops; here HP lost)
  junk('scorch', 'Scorch', 0, [], { unplayable: true, inHandAtEnd: [lose(2)] }),
  // (Slimed)
  junk('muck', 'Muck', 1, [draw(1)], { exhaust: true }),
  // (Void)
  junk('void-drain', 'Drain', 0, [], { unplayable: true, ethereal: true, onDraw: [mana(-1)] }),
];
