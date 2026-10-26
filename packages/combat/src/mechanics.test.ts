// Rules tests for the generic mechanics behind the roster (docs/09_ROSTER.md): choices, scaling, Powers, runes, stances,
// Stars, forging, extra Trap triggers. A tiny self-contained ruleset, so nothing here depends on real card data.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  chooseAction,
  cardText,
  clone,
  createCombat,
  heroOf,
  legalActions,
  validateDb,
  RADIANT_ENTER_MANA,
  viewFor,
  type Action,
  type CardDef,
  type CombatDb,
  type CombatState,
  type Op,
  type TriggerWhen,
  type Unit,
} from './index';

const c = (id: string, extra: Partial<CardDef> & Pick<CardDef, 'effects'>): [string, CardDef] => [
  id,
  {
    id,
    name: id,
    kind: 'skill',
    cost: 1,
    target: 'none',
    ...extra,
  },
];
const foeAtk: Op[] = [{ op: 'damage', amount: 1, to: 'target' }];
const strike = c('strike', {
  kind: 'attack',
  target: 'foe',
  effects: [{ op: 'damage', amount: 6, to: 'target' }],
});
const power = (id: string, when: TriggerWhen, ops: Op[], extra = {}) =>
  c(id, { kind: 'power', effects: [{ op: 'power', when, ops, ...extra }] });

const DB: CombatDb = {
  cards: Object.fromEntries([
    [strike[0], { ...strike[1], upgrade: 'strike+' }],
    c('defend', { effects: [{ op: 'barrier', amount: 5, to: 'self' }] }),
    c('filler', { cost: 0, effects: [{ op: 'barrier', amount: 1, to: 'self' }] }),
    // choices
    c('survivor', {
      effects: [
        { op: 'barrier', amount: 8, to: 'self' },
        { op: 'discard', amount: 1 },
        { op: 'draw', amount: 1 },
      ],
    }),
    c('purge', {
      effects: [
        { op: 'discard', amount: 9, any: true },
        { op: 'draw', amount: 2 },
      ],
    }),
    c('gamble', { effects: [{ op: 'discard', amount: 2, random: true }] }),
    c('reflex', {
      unplayable: true,
      effects: [],
      onDiscard: [{ op: 'draw', amount: 2 }],
    }),
    c('pact', {
      effects: [
        { op: 'exhaustCards', amount: 1 },
        { op: 'draw', amount: 2 },
      ],
    }),
    c('ember', { ethereal: true, effects: [{ op: 'barrier', amount: 1, to: 'self' }] }),
    c('husk', { effects: [], onExhaust: [{ op: 'barrier', amount: 4, to: 'self' }] }),
    c('peek', {
      effects: [
        { op: 'scry', amount: 3 },
        { op: 'draw', amount: 1 },
      ],
    }),
    c('burn-out', { exhaust: true, effects: [{ op: 'barrier', amount: 1, to: 'self' }] }),
    // scaling
    c('slam', {
      kind: 'attack',
      target: 'foe',
      effects: [{ op: 'damage', amount: 0, to: 'target', scale: { by: 'barrier' } }],
    }),
    c('whirl', {
      kind: 'attack',
      cost: 0,
      x: true,
      target: 'foe',
      effects: [{ op: 'damage', amount: 5, to: 'target', scale: { by: 'x', into: 'hits' } }],
    }),
    c('finisher', {
      kind: 'attack',
      target: 'foe',
      effects: [{ op: 'damage', amount: 0, to: 'target', scale: { by: 'attacksPlayed', mult: 6 } }],
    }),
    c('toxin', {
      target: 'foe',
      effects: [{ op: 'status', status: 'seared', amount: 4, to: 'target' }],
    }),
    c('catalyst', {
      target: 'foe',
      effects: [{ op: 'scaleStatus', status: 'seared', mult: 2, to: 'target' }],
    }),
    c('catalyst-capped', {
      target: 'foe',
      effects: [{ op: 'scaleStatus', status: 'seared', mult: 2, to: 'target', max: 5 }],
    }),
    c('reclaimer', { effects: [{ op: 'reclaim', amount: 1 }] }),
    c('cash-out', {
      target: 'foe',
      effects: [{ op: 'loseHp', amount: 0, to: 'target', scale: { by: 'seared', of: 'target' } }],
    }),
    // powers
    power('feel-no-pain', 'exhaust', [{ op: 'barrier', amount: 3, to: 'self' }]),
    power('infinite', 'turnStart', [{ op: 'addCard', card: 'shiv', to: 'hand', side: 'self' }]),
    power('afterimage', 'play', [{ op: 'barrier', amount: 1, to: 'self' }]),
    power('shiv-fan', 'play', [{ op: 'barrier', amount: 2, to: 'self' }], { tag: 'knife' }),
    power('metal', 'turnEnd', [{ op: 'barrier', amount: 4, to: 'self' }]),
    power('tools', 'turnStart', [{ op: 'draw', amount: 1 }]),
    c('shiv', {
      cost: 0,
      kind: 'attack',
      target: 'foe',
      exhaust: true,
      tags: ['knife'],
      effects: [{ op: 'damage', amount: 4, to: 'target' }],
    }),
    c('accuracy', {
      kind: 'power',
      effects: [{ op: 'status', status: 'edge', amount: 3, to: 'self' }],
    }),
    // tag fetch and the Auras metric
    c('gather-knives', { effects: [{ op: 'fetch', amount: 5, to: 'hand', tag: 'knife' }] }),
    c('rite-ward', {
      effects: [{ op: 'barrier', amount: 2, to: 'self', scale: { by: 'powers', mult: 3 } }],
    }),
    // runes
    c('c-spark', { effects: [{ op: 'channel', rune: 'spark' }] }),
    c('c-dark', { effects: [{ op: 'channel', rune: 'dark' }] }),
    c('evoke1', { effects: [{ op: 'evoke' }] }),
    c('multicast', { effects: [{ op: 'evoke', times: 3 }] }),
    c('slots', { effects: [{ op: 'runeSlots', amount: 1 }] }),
    c('resonate', { effects: [{ op: 'status', status: 'resonance', amount: 2, to: 'self' }] }),
    // stances
    c('wrath', { effects: [{ op: 'stance', stance: 'wrath' }] }),
    c('calm', { effects: [{ op: 'stance', stance: 'calm' }] }),
    c('leave', { effects: [{ op: 'stance', stance: 'none' }] }),
    c('chant', { effects: [{ op: 'status', status: 'mantra', amount: 3, to: 'self' }] }),
    // stars & forging
    c('gain-stars', { effects: [{ op: 'stars', amount: 3 }] }),
    c('nova', {
      kind: 'attack',
      target: 'foe',
      starCost: 2,
      effects: [{ op: 'damage', amount: 20, to: 'target' }],
    }),
    c('forge-it', { effects: [{ op: 'forge', card: 'blade', amount: 3 }] }),
    c('blade', {
      kind: 'attack',
      target: 'foe',
      retain: true,
      effects: [{ op: 'damage', amount: 5, to: 'target', scale: { by: 'bonus' } }],
    }),
    c('forge-blade', {
      kind: 'attack',
      target: 'foe',
      effects: [
        { op: 'damage', amount: 2, to: 'target' },
        { op: 'forge', card: 'blade', amount: 1 },
      ],
    }),
    // snares
    c('tripwire', {
      kind: 'snare',
      effects: [{ op: 'damage', amount: 7, to: 'attacker' }],
      trigger: { on: 'foeDefends' },
    }),
    c('timebomb', {
      kind: 'snare',
      effects: [{ op: 'damage', amount: 9, to: 'allFoes' }],
      trigger: { on: 'foeTurn' },
    }),
    c('born-ready', { innate: true, effects: [] }),
    // tier 3: statuses given to yourself, and tricks
    ...(
      [
        'bracing',
        'brittle',
        'ghostly',
        'steadfast',
        'armored',
        'ritual',
        'vigor',
        'twinned',
        'mirrored',
        'unbound',
        'fortified',
        'plating',
        'holdfast',
      ] as const
    ).map((st) =>
      c('give-' + st, { cost: 0, effects: [{ op: 'status', status: st, amount: 2, to: 'self' }] }),
    ),
    c('give-vigor5', {
      cost: 0,
      effects: [{ op: 'status', status: 'vigor', amount: 5, to: 'self' }],
    }),
    c('give-twin1', {
      cost: 0,
      effects: [{ op: 'status', status: 'twinned', amount: 1, to: 'self' }],
    }),
    c('give-mirror1', {
      cost: 0,
      effects: [{ op: 'status', status: 'mirrored', amount: 1, to: 'self' }],
    }),
    c('give-hold1', {
      cost: 0,
      effects: [{ op: 'status', status: 'holdfast', amount: 1, to: 'self' }],
    }),
    c('self-expose', {
      cost: 0,
      effects: [{ op: 'status', status: 'exposed', amount: 2, to: 'self' }],
    }),
    c('doom60', {
      cost: 0,
      target: 'foe',
      effects: [{ op: 'status', status: 'doom', amount: 60, to: 'target' }],
    }),
    c('encore', { effects: [{ op: 'status', status: 'mirrored', amount: 1, to: 'self' }] }),
    c('flex', {
      cost: 0,
      effects: [{ op: 'status', status: 'might', amount: 3, to: 'self', temp: true }],
    }),
    c('plan', {
      cost: 0,
      effects: [
        { op: 'manaNext', amount: 2 },
        { op: 'drawNext', amount: 1 },
      ],
    }),
    c('find', { effects: [{ op: 'discover', count: 1, free: true }] }),
    c('retune', { effects: [{ op: 'upgrade', scope: 'hand' }] }),
    c('cheap', { effects: [{ op: 'cheapen', amount: 1, scope: 'hand' }] }),
    c('anger', {
      kind: 'attack',
      target: 'foe',
      cost: 0,
      effects: [
        { op: 'damage', amount: 6, to: 'target' },
        { op: 'copySelf', to: 'discard' },
      ],
    }),
    c('pool-a', {
      hero: 'tester',
      rarity: 'common',
      upgrade: 'pool-a+',
      effects: [{ op: 'barrier', amount: 1, to: 'self' }],
    }),
    c('pool-a+', { hero: 'tester', effects: [{ op: 'barrier', amount: 2, to: 'self' }] }),
    c('pool-b', {
      hero: 'tester',
      rarity: 'common',
      upgrade: 'pool-b+',
      effects: [{ op: 'barrier', amount: 3, to: 'self' }],
    }),
    c('pool-b+', { hero: 'tester', effects: [{ op: 'barrier', amount: 4, to: 'self' }] }),
    c('strike+', {
      kind: 'attack',
      target: 'foe',
      effects: [{ op: 'damage', amount: 9, to: 'target' }],
    }),
    c('gnaw', {
      kind: 'attack',
      target: 'foe',
      effects: [{ op: 'damage', amount: 0, to: 'target', scale: { by: 'exhausted' } }],
    }),
    // allies and the later hooks
    c('deploy', { effects: [{ op: 'summon', unit: 'bot' }] }),
    c('zap', { target: 'foe', effects: [{ op: 'damage', amount: 4, to: 'target' }] }),
    c('spike-trap', {
      kind: 'snare',
      trigger: { on: 'foeTurn' },
      effects: [{ op: 'damage', amount: 4, to: 'allFoes' }],
    }),
    c('recycle', {
      cost: 0,
      target: 'ally',
      effects: [
        { op: 'barrier', amount: 0, to: 'self', scale: { by: 'hp', of: 'target' } },
        { op: 'sacrifice' },
      ],
    }),
    power('legion', 'summon', [{ op: 'status', status: 'might', amount: 1, to: 'allFriends' }]),
    power('echo', 'snare', [{ op: 'draw', amount: 1 }]),
    power('rushdown', 'stance', [{ op: 'draw', amount: 2 }], { stance: 'wrath' }),
    power('envenom', 'play', [{ op: 'status', status: 'seared', amount: 1, to: 'target' }], {
      filter: 'attack',
    }),
    c('storm-steel', {
      effects: [
        { op: 'discard', amount: 9 },
        {
          op: 'addCard',
          card: 'shiv',
          to: 'hand',
          side: 'self',
          times: 0,
          scale: { by: 'discarded' },
        },
      ],
    }),
    c('tempest', {
      cost: 0,
      x: true,
      effects: [{ op: 'channel', rune: 'spark', times: 0, scale: { by: 'x' } }],
    }),
    c('multi', { cost: 0, x: true, effects: [{ op: 'evoke', times: 0, scale: { by: 'x' } }] }),
    c('wrath-slam', {
      kind: 'attack',
      target: 'foe',
      effects: [{ op: 'damage', amount: 4, to: 'target', scale: { by: 'wrath', mult: 5 } }],
    }),
  ]),
  boons: {},
  potions: {},
  runes: {
    spark: {
      id: 'spark',
      name: 'Spark',
      text: 'test',
      passive: [{ op: 'damage', amount: 2, to: 'randomFoe' }],
      evoke: [{ op: 'damage', amount: 6, to: 'front' }],
    },
    dark: {
      id: 'dark',
      name: 'Hollow',
      text: 'test',
      grow: 2,
      passive: [],
      evoke: [{ op: 'damage', amount: 0, to: 'front', scale: { by: 'charge' } }],
    },
  },
  units: {
    bot: {
      id: 'bot',
      name: 'Bot',
      maxHp: 7,
      brain: { kind: 'ally', act: [{ op: 'damage', amount: 3, to: 'target' }] },
    },
    dummy: {
      id: 'dummy',
      name: 'Dummy',
      maxHp: 300,
      brain: {
        kind: 'enemy',
        moves: {
          hit: { id: 'hit', name: 'Hit', effects: foeAtk },
          guard: {
            id: 'guard',
            name: 'Guard',
            effects: [{ op: 'barrier', amount: 4, to: 'self' }],
          },
        },
        pattern: { kind: 'cycle', order: ['hit'] },
      },
    },
    brute: {
      id: 'brute',
      name: 'Brute',
      maxHp: 300,
      brain: {
        kind: 'enemy',
        moves: {
          smash: {
            id: 'smash',
            name: 'Smash',
            effects: [{ op: 'damage', amount: 9, to: 'target' }],
          },
        },
        pattern: { kind: 'cycle', order: ['smash'] },
      },
    },
    spiky: {
      id: 'spiky',
      name: 'Spiky',
      maxHp: 300,
      statuses: { thorns: 5 },
      brain: {
        kind: 'enemy',
        moves: {
          guard: {
            id: 'guard',
            name: 'Guard',
            effects: [{ op: 'barrier', amount: 0, to: 'self' }],
          },
        },
        pattern: { kind: 'cycle', order: ['guard'] },
      },
    },
    guarder: {
      id: 'guarder',
      name: 'Guarder',
      maxHp: 300,
      brain: {
        kind: 'enemy',
        moves: {
          guard: {
            id: 'guard',
            name: 'Guard',
            effects: [{ op: 'barrier', amount: 4, to: 'self' }],
          },
        },
        pattern: { kind: 'cycle', order: ['guard'] },
      },
    },
  },
  heroes: {
    tester: { id: 'tester', name: 'Tester', maxHp: 100, mana: 3, handSize: 5 },
    triggered: {
      id: 'triggered',
      name: 'Triggered',
      maxHp: 100,
      mana: 3,
      handSize: 5,
      trait: {
        name: 'Inner Fire',
        text: 'Whenever you enter a stance, gain 1 Mantra.',
        triggers: [
          {
            op: 'power',
            when: 'stance',
            ops: [{ op: 'status', status: 'mantra', amount: 1, to: 'self' }],
          },
        ],
      },
    },
    sigiled: {
      id: 'sigiled',
      name: 'Sigiled',
      maxHp: 100,
      mana: 3,
      handSize: 5,
      sigil: [
        { op: 'channel', rune: 'spark' },
        { op: 'stance', stance: 'calm' },
        { op: 'stars', amount: 2 },
      ],
    },
  },
};

// --- helpers --------------------------------------------------------------------------------------------------

function start(
  hand: string[],
  opts: { enemies?: string[]; hero?: string; draw?: string[]; mana?: number } = {},
): CombatState {
  const { state } = createCombat(DB, {
    seed: 'm',
    a: { hero: opts.hero ?? 'tester', deck: Array<string>(12).fill('filler') },
    b: { enemies: opts.enemies ?? ['dummy'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `h${i}`, card }));
  s.sides.a.draw = (opts.draw ?? Array<string>(10).fill('filler')).map((card, i) => ({
    id: `d${i}`,
    card,
  }));
  s.sides.a.discard = [];
  s.sides.a.mana = opts.mana ?? 3;
  return s;
}
const hero = (s: CombatState): Unit => heroOf(s.sides.a) as Unit;
const foe = (s: CombatState, i = 0): Unit => s.sides.b.units[i] as Unit;
const play = (s: CombatState, card: string, target?: string) =>
  applyAction(DB, s, { type: 'play', card, ...(target ? { target } : {}) });
const pick = (s: CombatState, ...cards: string[]) => applyAction(DB, s, { type: 'pick', cards });
const end = (s: CombatState) => applyAction(DB, s, { type: 'endTurn' });
const handIds = (s: CombatState): string[] => s.sides.a.hand.map((x) => x.card);

describe('the test ruleset is sound', () => {
  it('validates', () => expect(validateDb(DB)).toEqual([]));
});

// --- choices ----------------------------------------------------------------------------------------------------

describe('choices (discard, exhaust, scry)', () => {
  it('asks which card to discard, then the card carries on', () => {
    let s = start(['survivor', 'strike', 'defend', 'filler']);
    s = play(s, 'h0').state;
    expect(s.pending?.kind).toBe('discard');
    expect(s.pending?.min).toBe(1);
    expect(hero(s).barrier).toBe(8); // ops before the choice already happened
    expect(s.sides.a.hand).toHaveLength(3);
    expect(s.sides.a.discard).toHaveLength(0); // the card is still being played
    s = pick(s, 'h2').state; // discard Defend
    expect(s.pending).toBeNull();
    expect(handIds(s)).toEqual(['strike', 'filler', 'filler']); // drew 1 after the discard
    expect(s.sides.a.discard.map((x) => x.card).sort()).toEqual(['defend', 'survivor']);
  });

  it('allows nothing else while a choice is owed, and offers only legal answers', () => {
    let s = start(['survivor', 'strike', 'defend']);
    s = play(s, 'h0').state;
    expect(() => end(s)).toThrow();
    expect(() => play(s, 'h1', foe(s).id)).toThrow();
    expect(() => pick(s)).toThrow(); // must pick one
    expect(() => pick(s, 'h1', 'h2')).toThrow(); // too many
    expect(() => pick(s, 'nope')).toThrow();
    const acts = legalActions(DB, s);
    expect(acts.every((a) => a.type === 'pick')).toBe(true);
    expect(acts).toHaveLength(2);
    const v = viewFor(DB, s, 'a');
    expect(v.pending?.pool.map((x) => x.id)).toEqual(['h1', 'h2']);
    expect(viewFor(DB, s, 'b').pending).toBeNull();
  });

  it('discards the whole hand without asking when it has no more cards than the number', () => {
    let s = start(['survivor', 'strike']);
    s = play(s, 'h0').state;
    expect(s.pending).toBeNull();
    expect(s.sides.a.discard.map((x) => x.card).sort()).toEqual(['strike', 'survivor']);
  });

  it('"any number" can be none, some or all', () => {
    const base = start(['purge', 'strike', 'defend', 'filler']);
    let s = play(base, 'h0').state;
    expect(s.pending?.min).toBe(0);
    expect(pick(s).state.sides.a.hand).toHaveLength(5); // kept 3, drew 2
    s = pick(s, 'h1', 'h2', 'h3').state;
    expect(handIds(s)).toEqual(['filler', 'filler']);
  });

  it('random discards need no answer', () => {
    const s = play(start(['gamble', 'strike', 'defend', 'filler']), 'h0').state;
    expect(s.pending).toBeNull();
    expect(s.sides.a.hand).toHaveLength(1);
    expect(s.sides.a.discard).toHaveLength(3);
  });

  it('a discarded card can pay off (onDiscard) and counts for "discarded this turn"', () => {
    let s = start(['survivor', 'reflex', 'strike'], {
      draw: ['filler', 'filler', 'defend', 'strike'],
    });
    s = play(s, 'h0').state;
    s = pick(s, 'h1').state;
    // reflex drew 2, survivor drew 1
    expect(s.sides.a.hand).toHaveLength(4);
    expect(s.sides.a.discarded).toBe(1);
  });

  it('exhaust choices fire "when exhausted" on the card and on Powers', () => {
    let s = start(['feel-no-pain', 'pact', 'husk', 'strike'], { mana: 5 });
    s = play(s, 'h0').state; // the Power
    s = play(s, 'h1').state; // Pact: exhaust 1
    s = pick(s, 'h2').state; // exhaust the husk
    expect(hero(s).barrier).toBe(4 + 3);
    expect(s.sides.a.exhausted.map((x) => x.card)).toContain('husk');
  });

  it('exhausting the card you play (and Ethereal cards left in hand) triggers Powers too', () => {
    let s = start(['feel-no-pain', 'burn-out', 'ember', 'strike'], { mana: 5 });
    s = play(s, 'h0').state;
    s = play(s, 'h1').state;
    expect(hero(s).barrier).toBe(1 + 3);
    const before = hero(s).barrier;
    s = end(s).state; // the Ethereal card exhausts at end of turn (barrier is then wiped by the new turn)
    expect(s.sides.a.exhausted.map((x) => x.card)).toEqual(
      expect.arrayContaining(['burn-out', 'ember']),
    );
    expect(before).toBe(4);
  });

  it('scry draws the chosen card from the top of the draw pile and discards the others', () => {
    let s = start(['peek'], { draw: ['strike', 'defend', 'filler', 'filler'] });
    s = play(s, 'h0').state;
    expect(s.pending?.kind).toBe('scry');
    expect(s.pending?.pool).toEqual(['d0', 'd1', 'd2']);
    expect(s.pending).toMatchObject({ min: 1, max: 1 });
    expect(() => pick(s)).toThrow(); // one has to be chosen
    expect(() => pick(s, 'd0', 'd1')).toThrow(); // and only one
    s = pick(s, 'd1').state;
    // Defend is drawn; Strike and a Filler are thrown away; then Peek's own draw takes the next card
    expect(s.sides.a.discard.map((x) => x.card).sort()).toEqual(['filler', 'peek', 'strike']);
    expect(handIds(s)).toEqual(['defend', 'filler']);
  });

  it('the bot resolves a choice instead of getting stuck', () => {
    let s = start(['survivor', 'strike', 'defend']);
    s = play(s, 'h0').state;
    const a = chooseAction(DB, s);
    expect(a.type).toBe('pick');
    expect(() => applyAction(DB, s, a)).not.toThrow();
  });

  it('a winning card ends the fight even with a choice still owed', () => {
    const base = start(['strike', 'survivor']);
    const s = clone(base);
    foe(s).hp = 1;
    expect(play(s, 'h0', foe(s).id).state.winner).toBe('a');
  });
});

// --- scaling --------------------------------------------------------------------------------------------------------

describe('scaling amounts', () => {
  it('damage equal to Barrier', () => {
    let s = start(['defend', 'slam']);
    s = play(s, 'h0').state;
    const hp = foe(s).hp;
    s = play(s, 'h1', foe(s).id).state;
    expect(hp - foe(s).hp).toBe(5);
  });

  it('an X card spends all remaining Mana and hits that many extra times', () => {
    let s = start(['whirl'], { mana: 3 });
    const hp = foe(s).hp;
    s = play(s, 'h0', foe(s).id).state;
    expect(s.sides.a.mana).toBe(0);
    expect(hp - foe(s).hp).toBe(5 * (1 + 3));
  });

  it('scales per Attack played earlier this turn', () => {
    let s = start(['strike', 'strike', 'finisher'], { mana: 3 });
    s = play(s, 'h0', foe(s).id).state;
    s = play(s, 'h1', foe(s).id).state;
    const hp = foe(s).hp;
    s = play(s, 'h2', foe(s).id).state;
    expect(hp - foe(s).hp).toBe(12);
  });

  it('doubles Seared and cashes it out as unblockable damage', () => {
    let s = start(['toxin', 'catalyst', 'cash-out'], { mana: 5 });
    s = play(s, 'h0', foe(s).id).state;
    s = play(s, 'h1', foe(s).id).state;
    expect(foe(s).statuses.seared).toBe(8);
    const hp = foe(s).hp;
    foe(s).barrier = 50;
    s = play(s, 'h2', foe(s).id).state;
    expect(hp - foe(s).hp).toBe(8);
  });

  it('rules text reads sensibly', () => {
    expect(cardText(DB, DB.cards.slam as CardDef)).toBe('Deal damage equal to your Barrier.');
    expect(cardText(DB, DB.cards.finisher as CardDef)).toContain(
      '6 times the Attacks played this turn',
    );
    expect(cardText(DB, DB.cards.catalyst as CardDef)).toBe('Double the Bleed on the target.');
  });
});

// --- powers --------------------------------------------------------------------------------------------------------

describe('Powers are triggers', () => {
  it('turn start: adds a card to hand every turn', () => {
    let s = start(['infinite']);
    s = play(s, 'h0').state;
    expect(s.sides.a.powers).toHaveLength(1);
    s = end(s).state;
    expect(handIds(s).filter((x) => x === 'shiv')).toHaveLength(1);
    s = end(s).state;
    expect(handIds(s).filter((x) => x === 'shiv')).toHaveLength(1); // the old one was discarded, a new one came
  });

  it('on play: any card, or only cards with a tag', () => {
    let s = start(['afterimage', 'shiv-fan', 'strike', 'shiv'], { mana: 5 });
    s = play(s, 'h0').state;
    expect(hero(s).barrier).toBe(1); // a Power sees its own play
    s = play(s, 'h1').state; // afterimage +1 (shiv-fan is not a shiv)
    expect(hero(s).barrier).toBe(2);
    s = play(s, 'h2', foe(s).id).state; // +1 (no tag)
    expect(hero(s).barrier).toBe(3);
    s = play(s, 'h3', foe(s).id).state; // +1 +2 (shiv)
    expect(hero(s).barrier).toBe(6);
  });

  it('end of turn happens before the hand is discarded and Barrier carries until the next turn', () => {
    let s = start(['metal', 'strike']);
    s = play(s, 'h0').state;
    const out = end(s);
    expect(out.events.some((e) => e.type === 'barrier' && e.amount === 4)).toBe(true);
    // enemy hit for 1 was soaked: no HP lost
    expect(hero(out.state).hp).toBe(100);
  });

  it('a Power that triggers itself is cut off rather than looping forever', () => {
    let s = start(['afterimage', 'filler'], { mana: 3 });
    s = play(s, 'h0').state;
    expect(() => play(s, 'h1')).not.toThrow();
  });

  it('edge adds to shiv damage only', () => {
    let s = start(['accuracy', 'shiv', 'strike'], { mana: 4 });
    s = play(s, 'h0').state;
    let hp = foe(s).hp;
    s = play(s, 'h1', foe(s).id).state;
    expect(hp - foe(s).hp).toBe(7);
    hp = foe(s).hp;
    s = play(s, 'h2', foe(s).id).state;
    expect(hp - foe(s).hp).toBe(6);
  });
});

// --- runes -----------------------------------------------------------------------------------------------------------

describe('runes', () => {
  it('channelled runes fire their passive at the end of your turn', () => {
    let s = start(['c-spark']);
    s = play(s, 'h0').state;
    expect(s.sides.a.runes).toHaveLength(1);
    const hp = foe(s).hp;
    s = end(s).state;
    expect(hp - foe(s).hp).toBe(2);
  });

  it('a full row pushes out (and evokes) the oldest rune', () => {
    let s = start(['c-spark', 'c-spark', 'c-spark', 'c-dark'], { mana: 9 });
    for (const id of ['h0', 'h1', 'h2']) s = play(s, id).state;
    expect(s.sides.a.runes).toHaveLength(3);
    const hp = foe(s).hp;
    s = play(s, 'h3').state;
    expect(hp - foe(s).hp).toBe(6); // the oldest Spark evoked
    expect(s.sides.a.runes.map((r) => r.rune)).toEqual(['spark', 'spark', 'dark']);
  });

  it('evoke removes the first rune; multi-cast fires it several times', () => {
    let s = start(['c-spark', 'evoke1', 'c-spark', 'multicast'], { mana: 9 });
    s = play(s, 'h0').state;
    let hp = foe(s).hp;
    s = play(s, 'h1').state;
    expect(hp - foe(s).hp).toBe(6);
    expect(s.sides.a.runes).toHaveLength(0);
    s = play(s, 'h2').state;
    hp = foe(s).hp;
    s = play(s, 'h3').state;
    expect(hp - foe(s).hp).toBe(18);
  });

  it('Elder (hollow) totems charge each turn and evoke for their charge', () => {
    let s = start(['c-dark', 'evoke1']);
    s = play(s, 'h0').state;
    s = end(s).state;
    s = end(s).state;
    expect(s.sides.a.runes[0]?.charge).toBe(4);
    const c2 = clone(s);
    c2.sides.a.hand = [{ id: 'e1', card: 'evoke1' }];
    c2.sides.a.mana = 3;
    const hp = foe(c2).hp;
    const after = play(c2, 'e1').state;
    expect(hp - foe(after).hp).toBe(4);
  });

  it('Resonance (Spirit) adds to rune damage, and to how fast Hollow charges', () => {
    let s = start(['resonate', 'c-spark', 'c-dark'], { mana: 5 });
    s = play(s, 'h0').state;
    s = play(s, 'h1').state;
    s = play(s, 'h2').state;
    const hp = foe(s).hp;
    s = end(s).state;
    expect(hp - foe(s).hp).toBe(2 + 2);
    expect(s.sides.a.runes[1]?.charge).toBe(2 + 2);
  });

  it('extra slots let more runes stay; fewer slots push the oldest out', () => {
    let s = start(['slots', 'c-spark', 'c-spark', 'c-spark', 'c-spark'], { mana: 9 });
    s = play(s, 'h0').state;
    for (const id of ['h1', 'h2', 'h3', 'h4']) s = play(s, id).state;
    expect(s.sides.a.runes).toHaveLength(4);
  });

  it('a Sigil can start the fight with a rune, a stance and Stars', () => {
    const s = start([], { hero: 'sigiled' });
    expect(s.sides.a.runes).toHaveLength(1);
    expect(hero(s).statuses.calm).toBe(1);
    expect(s.sides.a.stars).toBe(2);
  });
});

// --- stances ---------------------------------------------------------------------------------------------------------

describe('stances', () => {
  it('Wrath doubles the damage you deal and raises the damage you take by half', () => {
    let s = start(['wrath', 'strike']);
    s = play(s, 'h0').state;
    const hp = foe(s).hp;
    s = play(s, 'h1', foe(s).id).state;
    expect(hp - foe(s).hp).toBe(12);
    const out = end(s);
    expect(out.events.some((e) => e.type === 'damage' && e.amount === 1)).toBe(true); // floor(1 * 1.5)
  });

  it('leaving Calm gives Mana; stances are exclusive', () => {
    let s = start(['calm', 'wrath', 'leave'], { mana: 3 });
    s = play(s, 'h0').state;
    expect(s.sides.a.mana).toBe(2);
    s = play(s, 'h1').state;
    expect(s.sides.a.mana).toBe(2 - 1 + 2);
    expect(hero(s).statuses.calm).toBeUndefined();
    expect(hero(s).statuses.wrath).toBe(1);
    s = play(s, 'h2').state;
    expect(hero(s).statuses.wrath).toBeUndefined();
  });

  it('leaving Calm pays its Mana once a turn, so stepping in and out cannot loop', () => {
    let s = start(['calm', 'wrath', 'calm', 'wrath'], { mana: 6 });
    s = play(s, 'h0').state; // Calm: 5
    s = play(s, 'h1').state; // leave it: 5 - 1 + 2
    expect(s.sides.a.mana).toBe(6);
    s = play(s, 'h2').state; // Calm again: 5
    s = play(s, 'h3').state; // and out again: nothing this time
    expect(s.sides.a.mana).toBe(4);
    expect(hero(s).statuses.wrath).toBe(1);
    // the next turn it pays again
    s = end(s).state;
    expect(s.sides.a.calmPaid).toBe(false);
  });

  it('Mantra builds to Radiant: triple damage, Mana on entry, gone at end of turn', () => {
    let s = start(['chant', 'chant', 'chant', 'chant', 'strike'], { mana: 6 });
    s = play(s, 'h0').state;
    expect(hero(s).statuses.mantra).toBe(3);
    s = play(s, 'h1').state;
    s = play(s, 'h2').state;
    expect(hero(s).statuses.mantra).toBe(9);
    expect(hero(s).statuses.radiant).toBeUndefined();
    s = play(s, 'h3').state;
    expect(hero(s).statuses.radiant).toBe(1);
    expect(hero(s).statuses.mantra).toBe(2);
    expect(s.sides.a.mana).toBe(6 - 4 + RADIANT_ENTER_MANA);
    const hp = foe(s).hp;
    s = play(s, 'h4', foe(s).id).state;
    expect(hp - foe(s).hp).toBe(18);
    s = end(s).state;
    expect(hero(s).statuses.radiant).toBeUndefined();
  });

  it('cannot be applied as a plain status (validation)', () => {
    const bad: CombatDb = clone(DB);
    bad.cards.bad = {
      id: 'bad',
      name: 'Bad',
      kind: 'skill',
      cost: 0,
      target: 'none',
      effects: [{ op: 'status', status: 'wrath', amount: 1, to: 'self' }],
    };
    expect(validateDb(bad).join()).toContain('stance op');
  });
});

// --- stars & forging ----------------------------------------------------------------------------------------------------

describe('Stars and forging', () => {
  it('Stars are a second resource that persists between turns', () => {
    let s = start(['gain-stars', 'nova'], { mana: 5 });
    expect(legalActions(DB, s).some((a) => a.type === 'play' && a.card === 'h1')).toBe(false);
    s = play(s, 'h0').state;
    expect(s.sides.a.stars).toBe(3);
    s = end(s).state;
    expect(s.sides.a.stars).toBe(3);
    const c2 = clone(s);
    c2.sides.a.hand = [{ id: 'n', card: 'nova' }];
    c2.sides.a.mana = 3;
    const out = play(c2, 'n', foe(c2).id).state;
    expect(out.sides.a.stars).toBe(1);
    expect(300 - foe(out).hp).toBeGreaterThanOrEqual(20);
  });

  it('forging creates the blade the first time and grows every copy after that', () => {
    let s = start(['forge-it', 'forge-it'], { mana: 5 });
    s = play(s, 'h0').state;
    const blades = s.sides.a.hand.filter((x) => x.card === 'blade');
    expect(blades).toHaveLength(1);
    expect(blades[0]?.bonus).toBe(3);
    s = play(s, 'h1').state;
    expect(s.sides.a.hand.filter((x) => x.card === 'blade')).toHaveLength(1);
    expect(s.sides.a.hand.find((x) => x.card === 'blade')?.bonus).toBe(6);
    const id = s.sides.a.hand.find((x) => x.card === 'blade')?.id as string;
    const hp = foe(s).hp;
    s = play(s, id, foe(s).id).state;
    expect(hp - foe(s).hp).toBe(11);
  });

  it('forging in the blade itself grows the copy that is being played', () => {
    let s = start(['forge-blade'], { mana: 5 });
    s = play(s, 'h0', foe(s).id).state;
    // no blade existed: a fresh one with the bonus
    expect(s.sides.a.hand.find((x) => x.card === 'blade')?.bonus).toBe(1);
  });
});

// --- more Trap triggers -------------------------------------------------------------------------------------------------------

describe('Trap triggers', () => {
  it('springs when an enemy gains Barrier', () => {
    let s = start(['tripwire'], { enemies: ['guarder'] });
    s = play(s, 'h0').state;
    const hp = foe(s).hp;
    const out = end(s);
    expect(out.events.some((e) => e.type === 'snareSprung')).toBe(true);
    expect(hp - foe(out.state).hp).toBe(7);
  });

  it('springs at the start of the enemy turn', () => {
    let s = start(['timebomb']);
    s = play(s, 'h0').state;
    const hp = foe(s).hp;
    const out = end(s);
    expect(hp - foe(out.state).hp).toBe(9);
  });

  it('describes its trigger in words', () => {
    expect(cardText(DB, DB.cards.tripwire as CardDef)).toContain('gains Barrier');
    expect(cardText(DB, DB.cards.timebomb as CardDef)).toContain('start of the enemy turn');
  });
});

// --- misc -------------------------------------------------------------------------------------------------------------------

describe('allies, sacrifice and the later hooks', () => {
  it('an ally-only card cannot be aimed at the hero, and cannot be played with no allies', () => {
    let s = start(['recycle', 'deploy'], { mana: 3 });
    expect(legalActions(DB, s).some((a) => a.type === 'play' && a.card === 'h0')).toBe(false);
    s = play(s, 'h1').state;
    const ally = s.sides.a.units.find((u) => u.kind === 'ally') as Unit;
    const targets = legalActions(DB, s).filter((a) => a.type === 'play' && a.card === 'h0');
    expect(targets).toHaveLength(1);
    expect(() => play(s, 'h0', hero(s).id)).toThrow();
    s = play(s, 'h0', ally.id).state;
    expect(hero(s).barrier).toBe(7); // read the ally's HP before it left
    expect(s.sides.a.units.some((u) => u.kind === 'ally')).toBe(false);
  });

  it('"when you summon" Powers fire for the hero, not for enemy summons', () => {
    let s = start(['legion', 'deploy']);
    s = play(s, 'h0').state;
    s = play(s, 'h1').state;
    const ally = s.sides.a.units.find((u) => u.kind === 'ally') as Unit;
    expect(ally.statuses.might).toBe(1);
  });

  it('"when a Trap springs" and "when you enter a stance" Powers', () => {
    let s = start(['echo', 'timebomb', 'rushdown', 'wrath'], { mana: 5 });
    s = play(s, 'h0').state;
    s = play(s, 'h1').state;
    const handBefore = s.sides.a.hand.length;
    s = end(s).state; // the Trap springs at the start of the enemy turn and draws a card
    expect(s.sides.a.discard.map((x) => x.card)).toContain('timebomb');
    expect(handBefore).toBe(2);
    s = start(['rushdown', 'wrath'], { mana: 5 });
    s = play(s, 'h0').state;
    s = play(s, 'h1').state;
    expect(s.sides.a.hand).toHaveLength(2); // drew 2
  });

  it('a "when you play" Power can use the card\'s target', () => {
    let s = start(['envenom', 'strike'], { mana: 3 });
    s = play(s, 'h0').state;
    s = play(s, 'h1', foe(s).id).state;
    expect(foe(s).statuses.seared).toBe(1);
  });

  it('scaled counts: Shivs per discard, runes and evokes per X, damage per Wrath', () => {
    let s = start(['storm-steel', 'strike', 'defend', 'filler']);
    s = play(s, 'h0').state;
    expect(s.sides.a.hand.filter((x) => x.card === 'shiv')).toHaveLength(3);
    s = start(['tempest'], { mana: 2 });
    s = play(s, 'h0').state;
    expect(s.sides.a.runes).toHaveLength(2);
    s = start(['c-spark', 'multi'], { mana: 3 });
    s = play(s, 'h0').state;
    const hp = foe(s).hp;
    s = play(s, 'h1').state; // 2 Mana left -> evoke twice
    expect(hp - foe(s).hp).toBe(12);
    s = start(['wrath', 'wrath-slam']);
    s = play(s, 'h0').state;
    const hp2 = foe(s).hp;
    s = play(s, 'h1', foe(s).id).state;
    expect(hp2 - foe(s).hp).toBe((4 + 5) * 2);
  });
});

describe('review fixes', () => {
  it('playing a Trap counts as playing a card for "when you play" Powers', () => {
    let s = start(['afterimage', 'tripwire'], { enemies: ['guarder'] });
    s = play(s, 'h0').state; // a Power sees its own play: +1
    s = play(s, 'h1').state; // the Trap is a played card too: +1
    expect(hero(s).barrier).toBe(2);
    expect(s.sides.a.played).toBe(2);
  });

  it('a Power in play is not an "exhausted card" for scaling, though it leaves the deck', () => {
    let s = start(['feel-no-pain', 'burn-out', 'gnaw'], { mana: 4 });
    s = play(s, 'h0').state;
    s = play(s, 'h1').state; // a real exhaust (and Feel No Pain triggers)
    const hp = foe(s).hp;
    s = play(s, 'h2', foe(s).id).state;
    expect(hp - foe(s).hp).toBe(1);
  });

  it('validation catches X cards that never read X, scaling by X on a non-X card, and bad sacrifices', () => {
    const bad: CombatDb = clone(DB);
    bad.cards['x1'] = {
      id: 'x1',
      name: 'x',
      kind: 'skill',
      cost: 0,
      x: true,
      target: 'none',
      effects: [],
    };
    bad.cards['x2'] = {
      id: 'x2',
      name: 'x',
      kind: 'attack',
      cost: 1,
      target: 'foe',
      effects: [{ op: 'damage', amount: 1, to: 'target', scale: { by: 'x' } }],
    };
    bad.cards['x3'] = {
      id: 'x3',
      name: 'x',
      kind: 'skill',
      cost: 0,
      target: 'none',
      effects: [{ op: 'sacrifice' }],
    };
    const errs = validateDb(bad).join('\n');
    expect(errs).toContain('x1: an X card must scale something by x');
    expect(errs).toContain('x2: scales by x but is not an X card');
    expect(errs).toContain('x3: sacrifice needs a card that targets an ally');
  });

  it('a rune that evokes or channels from its own effects is rejected', () => {
    const bad: CombatDb = clone(DB);
    bad.runes = {
      loop: { id: 'loop', name: 'Loop', text: 't', passive: [], evoke: [{ op: 'evoke' }] },
    };
    expect(validateDb(bad).join()).toContain('cannot evoke or channel');
  });

  it('scry with only one card to look at still lets it be drawn', () => {
    let s = start(['peek'], { draw: ['strike'] });
    s = play(s, 'h0').state;
    expect(s.pending?.pool).toEqual(['d0']);
    s = pick(s, 'd0').state;
    expect(handIds(s)).toEqual(['strike']);
  });

  it('scry looks into a reshuffled discard pile when the draw pile is short', () => {
    let s = start(['peek'], { draw: ['strike'] });
    s.sides.a.discard = [
      { id: 'z1', card: 'defend' },
      { id: 'z2', card: 'filler' },
    ];
    s = play(s, 'h0').state;
    expect(s.pending?.kind).toBe('scry');
    expect(s.pending?.pool.length).toBe(3);
  });
});

describe('tier 3: statuses and tricks', () => {
  it('Bracing adds to every Barrier you gain; Brittle shrinks it by a quarter', () => {
    let s = start(['give-bracing', 'defend']);
    s = play(s, 'h0').state;
    s = play(s, 'h1').state;
    expect(hero(s).barrier).toBe(5 + 2);
    let t = start(['give-brittle', 'defend']);
    t = play(t, 'h0').state;
    t = play(t, 'h1').state;
    expect(hero(t).barrier).toBe(3);
  });

  it('Ghostly caps every hit at 1 damage', () => {
    let s = start(['give-ghostly'], { enemies: ['brute'] });
    s = play(s, 'h0').state;
    const out = end(s);
    expect(
      out.events.some((e) => e.type === 'damage' && e.target === hero(s).id && e.amount === 1),
    ).toBe(true);
    expect(hero(out.state).hp).toBe(99);
  });

  it('Steadfast ignores the next debuff, once per stack', () => {
    let s = start(['give-steadfast', 'self-expose', 'self-expose', 'self-expose']);
    s = play(s, 'h0').state; // 2 stacks
    s = play(s, 'h1').state;
    s = play(s, 'h2').state;
    expect(hero(s).statuses.exposed).toBeUndefined();
    expect(hero(s).statuses.steadfast).toBeUndefined();
    s = play(s, 'h3').state;
    expect(hero(s).statuses.exposed).toBe(2);
  });

  it('Armored gives Barrier at the end of the turn and wears thin when hit', () => {
    let s = start(['give-armored'], { enemies: ['brute'] });
    s = play(s, 'h0').state;
    const out = end(s);
    expect(out.events.some((e) => e.type === 'barrier' && e.amount === 2)).toBe(true);
    // the Brute's 9 gets through the 2 Barrier: one stack is lost
    expect(hero(out.state).statuses.armored).toBe(1);
  });

  it('Ritual grows Might at the end of your turn', () => {
    let s = start(['give-ritual']);
    s = play(s, 'h0').state;
    s = end(s).state;
    expect(hero(s).statuses.might).toBe(2);
  });

  it('Vigor makes the next attack stronger, once', () => {
    let s = start(['give-vigor5', 'strike', 'strike']);
    s = play(s, 'h0').state;
    let hp = foe(s).hp;
    s = play(s, 'h1', foe(s).id).state;
    expect(hp - foe(s).hp).toBe(11);
    hp = foe(s).hp;
    s = play(s, 'h2', foe(s).id).state;
    expect(hp - foe(s).hp).toBe(6);
  });

  it('Doom kills a unit at or below its Doom at the end of its own turn', () => {
    let s = start(['doom60']);
    foe(s).hp = 50;
    s = play(s, 'h0', foe(s).id).state;
    expect(s.winner).toBeNull();
    s = end(s).state;
    expect(s.winner).toBe('a');
  });

  it('Reverb plays the next Attack twice; Mirrored plays the next Skill twice', () => {
    let s = start(['give-twin1', 'strike', 'strike']);
    s = play(s, 'h0').state;
    let hp = foe(s).hp;
    s = play(s, 'h1', foe(s).id).state;
    expect(hp - foe(s).hp).toBe(12);
    hp = foe(s).hp;
    s = play(s, 'h2', foe(s).id).state;
    expect(hp - foe(s).hp).toBe(6);
    let t = start(['give-mirror1', 'defend']);
    t = play(t, 'h0').state;
    t = play(t, 'h1').state;
    expect(hero(t).barrier).toBe(10);
  });

  it('Unbound makes Skills free and consumes them', () => {
    let s = start(['give-unbound', 'defend']);
    s = play(s, 'h0').state;
    const mana = s.sides.a.mana;
    s = play(s, 'h1').state;
    expect(s.sides.a.mana).toBe(mana);
    expect(s.sides.a.exhausted.map((x) => x.card)).toContain('defend');
  });

  it('Fortified keeps 75% of your Barrier into the next turn (rounded down)', () => {
    let s = start(['give-fortified', 'defend']);
    s = play(s, 'h0').state;
    s = play(s, 'h1').state;
    const before = hero(s).barrier;
    expect(before).toBeGreaterThan(0);
    s = end(s).state;
    expect(hero(s).barrier).toBe(Math.floor(before * 0.75));
  });

  it('Plating keeps Barrier through the turn change up to its stacks, then shrinks by 1 each turn', () => {
    let s = start(['give-plating', 'defend', 'defend']);
    s = play(s, 'h0').state; // Plating 2
    s = play(s, 'h1').state;
    s = play(s, 'h2').state;
    expect(hero(s).barrier).toBeGreaterThan(2);
    s = end(s).state;
    expect(hero(s).barrier).toBe(2);
    expect(hero(s).statuses.plating).toBe(1);
    s = end(s).state;
    expect(hero(s).barrier).toBe(1);
    expect(hero(s).statuses.plating).toBeUndefined();
  });

  it('Holdfast keeps the whole hand for one turn per stack', () => {
    let s = start(['give-hold1', 'strike', 'defend']);
    s = play(s, 'h0').state;
    s = end(s).state;
    const held = s.sides.a.hand.filter((c) => ['strike', 'defend'].includes(c.card)).length;
    expect(held).toBe(2);
    s = end(s).state;
    // the second turn's end does not hold them any more
    expect(s.sides.a.hand.filter((c) => ['strike', 'defend'].includes(c.card))).toHaveLength(0);
    expect(hero(s).statuses.holdfast).toBeUndefined();
  });

  it('a temporary status wears off at the end of your turn', () => {
    let s = start(['flex', 'strike']);
    s = play(s, 'h0').state;
    const hp = foe(s).hp;
    s = play(s, 'h1', foe(s).id).state;
    expect(hp - foe(s).hp).toBe(9);
    s = end(s).state;
    expect(hero(s).statuses.might).toBeUndefined();
  });

  it('banks Mana and cards for the next turn', () => {
    let s = start(['plan']);
    s = play(s, 'h0').state;
    s = end(s).state;
    expect(s.sides.a.mana).toBe(3 + 2);
    expect(s.sides.a.hand.length).toBe(6);
  });

  it('discover adds a random card from your own pool, free if asked', () => {
    let s = start(['find']);
    s = play(s, 'h0').state;
    const got = s.sides.a.hand.find((c) => c.card.startsWith('pool-'));
    expect(got).toBeDefined();
    expect(got?.costMod).toBe(-1); // pool cards cost 1; 'free' takes all of it off
  });

  it('upgrading and cheapening the hand last for the fight', () => {
    let s = start(['retune', 'strike']);
    s = play(s, 'h0').state;
    expect(s.sides.a.hand.map((c) => c.card)).toEqual(['strike+']);
    let t = start(['cheap', 'strike', 'defend']);
    t = play(t, 'h0').state;
    expect(t.sides.a.hand.every((c) => (c.costMod ?? 0) === -1)).toBe(true);
    const mana = t.sides.a.mana;
    t = play(t, 'h1', foe(t).id).state;
    expect(t.sides.a.mana).toBe(mana); // Strike now costs 0
  });

  it('copySelf adds another copy of the card', () => {
    let s = start(['anger']);
    s = play(s, 'h0', foe(s).id).state;
    expect(s.sides.a.discard.filter((c) => c.card === 'anger')).toHaveLength(2);
  });

  it('cards Foresee throws away count as discards: payoffs fire', () => {
    let s = start(['peek'], {
      draw: ['reflex', 'filler', 'filler', 'filler', 'filler', 'filler', 'filler'],
    });
    s = play(s, 'h0').state;
    s = pick(s, 'd1').state; // keep a Filler, so Reflex is thrown away: "if discarded, draw 2"
    expect(s.sides.a.discarded).toBe(2);
    // the Filler that was kept, the 2 Reflex drew when it was thrown away, and Peek's own draw
    expect(s.sides.a.hand).toHaveLength(4);
  });
});

describe('review fixes, round two', () => {
  it('a card that gives Mirrored does not spend it on itself', () => {
    let s = start(['encore']);
    s = play(s, 'h0').state;
    expect(hero(s).statuses.mirrored).toBe(1);
    let t = start(['give-mirrored']); // gives 2
    t = play(t, 'h0').state;
    expect(hero(t).statuses.mirrored).toBe(2);
  });

  it('Mirrored also doubles a Skill that asks for a choice, once the choice is made', () => {
    let s = start(['give-mirror1', 'survivor', 'strike', 'defend', 'filler']);
    s = play(s, 'h0').state;
    s = play(s, 'h1').state; // Survivor: Barrier 8, discard 1, draw 1
    s = pick(s, 'h2').state;
    expect(hero(s).barrier).toBe(16); // played twice
    expect(hero(s).statuses.mirrored).toBeUndefined();
  });

  it('Ghostly caps attacks but not Doom', () => {
    let s = start(['doom60']);
    foe(s).hp = 28;
    foe(s).statuses.ghostly = 2;
    s = play(s, 'h0', foe(s).id).state;
    s = end(s).state;
    expect(s.winner).toBe('a');
  });

  it('a free discovery is a modest card and never the card that found it', () => {
    for (let i = 0; i < 25; i++) {
      const base = start(['find']);
      base.seed = 'f' + i;
      const s = play(base, 'h0').state;
      const got = s.sides.a.hand.find((c) => c.card.startsWith('pool-'));
      expect(got?.card).toBeDefined();
    }
  });
});

describe('innate and invariants', () => {
  it('innate cards are drawn first', () => {
    const { state } = createCombat(DB, {
      seed: 'z',
      a: { hero: 'tester', deck: [...Array<string>(20).fill('filler'), 'born-ready'] },
      b: { enemies: ['dummy'] },
    });
    expect(state.sides.a.hand.map((x) => x.card)).toContain('born-ready');
  });

  it('random play never throws and never leaves a stuck choice', () => {
    const cards = Object.keys(DB.cards).filter((k) => !DB.cards[k]?.unplayable);
    for (let seed = 0; seed < 25; seed++) {
      const deck = Array.from(
        { length: 24 },
        (_, i) => cards[(i * 7 + seed * 3) % cards.length] as string,
      );
      let { state } = createCombat(DB, {
        seed: `r${seed}`,
        a: { hero: 'tester', deck },
        b: { enemies: ['dummy', 'guarder'] },
      });
      for (let i = 0; i < 300 && !state.winner; i++) {
        const acts = legalActions(DB, state);
        expect(acts.length).toBeGreaterThan(0);
        // alternate between the bot and an arbitrary legal action
        const a: Action =
          i % 2 ? (acts[(i * 31 + seed) % acts.length] as Action) : chooseAction(DB, state);
        state = applyAction(DB, state, a).state;
        expect(hero(state)?.hp ?? 1).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('balance audit rules (DECISIONS #223)', () => {
  it('a discount is spent when the card is played: it costs full price the next time', () => {
    let s = start(['cheap', 'strike']);
    s = play(s, 'h0').state;
    expect(s.sides.a.hand[0]?.costMod).toBe(-1);
    s = play(s, 'h1', foe(s).id).state;
    const played = s.sides.a.discard.find((x) => x.id === 'h1');
    expect(played).toBeDefined();
    expect(played?.costMod).toBeUndefined();
  });

  it('a capped doubler adds at most its cap', () => {
    let s = start(['toxin', 'toxin', 'catalyst-capped'], { mana: 5 });
    s = play(s, 'h0', foe(s).id).state;
    s = play(s, 'h1', foe(s).id).state;
    expect(foe(s).statuses.seared).toBe(8);
    s = play(s, 'h2', foe(s).id).state;
    expect(foe(s).statuses.seared).toBe(13); // doubling would be 16: the cap adds 5
  });

  it('reclaim never returns a card that reclaims', () => {
    const s0 = start(['reclaimer']);
    s0.sides.a.exhausted = [
      { id: 'x1', card: 'reclaimer' },
      { id: 'x2', card: 'strike' },
    ];
    const s = play(s0, 'h0').state;
    expect(s.sides.a.hand.map((x) => x.id)).toEqual(['x2']);
    expect(s.sides.a.exhausted.map((x) => x.id)).toEqual(['x1']);
  });
});

describe('fetch by tag and the Auras metric', () => {
  it('fetch with a tag returns only cards that carry it', () => {
    const s0 = start(['gather-knives']);
    s0.sides.a.discard = [
      { id: 'x1', card: 'shiv' },
      { id: 'x2', card: 'strike' },
      { id: 'x3', card: 'shiv' },
    ];
    const s = play(s0, 'h0').state;
    expect(s.sides.a.hand.map((x) => x.id).sort()).toEqual(['x1', 'x3']);
    expect(s.sides.a.discard.map((x) => x.id)).toContain('x2');
    expect(cardText(DB, DB.cards['gather-knives']!)).toContain('Sleeve Knife');
  });

  it('a card can scale with the number of Auras you have', () => {
    let s = start(['metal', 'tools', 'rite-ward'], { mana: 5 });
    s = play(s, 'h0').state;
    s = play(s, 'h1').state;
    const before = hero(s).barrier;
    s = play(s, 'h2').state;
    expect(hero(s).barrier - before).toBe(2 + 3 * 2);
    expect(cardText(DB, DB.cards['rite-ward']!)).toContain('Aura you have');
  });
});

describe('trait triggers', () => {
  it('work like an Aura all fight, but are never counted or listed as one', () => {
    const { state } = createCombat(DB, {
      seed: 't',
      a: { hero: 'triggered', deck: Array<string>(12).fill('filler') },
      b: { enemies: ['dummy'] },
    });
    let s = clone(state);
    s.sides.a.hand = [
      { id: 'h0', card: 'wrath' },
      { id: 'h1', card: 'calm' },
      { id: 'h2', card: 'rite-ward' },
    ];
    s.sides.a.mana = 3;
    s = play(s, 'h0').state;
    s = play(s, 'h1').state;
    expect(hero(s).statuses.mantra).toBe(2);
    const before = hero(s).barrier;
    s = play(s, 'h2').state;
    expect(hero(s).barrier - before).toBe(2); // no Auras: the trait is not one
    expect(viewFor(DB, s, 'a').sides.a.powers).toEqual([]);
  });
});

describe('Thorns answer attacks only', () => {
  it('an Attack card is hurt back; a Skill or a Trap that deals damage is not', () => {
    let s = start(['strike', 'zap', 'spike-trap'], { enemies: ['spiky'], mana: 5 });
    const hp0 = hero(s).hp;
    s = play(s, 'h0', foe(s).id).state;
    expect(hero(s).hp).toBe(hp0 - 5);
    s = play(s, 'h1', foe(s).id).state; // the Skill
    expect(hero(s).hp).toBe(hp0 - 5);
    s = play(s, 'h2').state; // the Trap
    const foeHp = foe(s).hp;
    s = end(s).state; // the Trap springs on the enemy turn
    expect(foe(s).hp).toBeLessThan(foeHp);
    expect(hero(s).hp).toBe(hp0 - 5);
  });

  it('a companion that attacks takes the Thorns itself, not its hero', () => {
    let s = start(['deploy'], { enemies: ['spiky'] });
    const hp0 = hero(s).hp;
    s = play(s, 'h0').state;
    s = end(s).state; // the companion acts at the end of the turn
    const bot = s.sides.a.units.find((u) => u.def === 'bot');
    expect(bot === undefined || bot.hp < 7).toBe(true);
    expect(hero(s).hp).toBe(hp0);
  });
});

describe('PvP sudden death (DECISIONS #259)', () => {
  const pvp = (): CombatState =>
    clone(
      createCombat(DB, {
        seed: 'sd',
        a: { hero: 'tester', deck: Array<string>(12).fill('filler') },
        b: { hero: 'tester', deck: Array<string>(12).fill('filler') },
      }).state,
    );

  it('nothing happens up to Turn 50', () => {
    let s = pvp();
    expect(s.mode).toBe('pvp');
    s.turn = 98; // the next turn is the 99th: Turn 50 as players count it
    const b = heroOf(s.sides.b)!;
    const hp = b.hp;
    s = end(s).state;
    expect(heroOf(s.sides.b)!.hp).toBe(hp);
  });

  it('from Turn 51 the hero whose turn begins loses 10 HP more each Turn, through Barrier and Shielded', () => {
    let s = pvp();
    s.turn = 100; // the next turn is the 101st: Turn 51
    const b = heroOf(s.sides.b)!;
    b.barrier = 500;
    b.statuses.shielded = 3;
    const hp = b.hp;
    s = end(s).state;
    expect(heroOf(s.sides.b)!.hp).toBe(hp - 10);
    // a's half of Turn 51: 10 too; then b again in Turn 52: 20
    const a = heroOf(s.sides.a)!.hp;
    s = end(s).state;
    expect(heroOf(s.sides.a)!.hp).toBe(a - 10);
    const b2 = heroOf(s.sides.b)!.hp;
    s = end(s).state;
    expect(heroOf(s.sides.b)!.hp).toBe(b2 - 20);
  });

  it('ends a stalled match: a hero it takes to 0 loses', () => {
    let s = pvp();
    s.turn = 120;
    heroOf(s.sides.b)!.hp = 50;
    s = end(s).state;
    expect(s.winner).toBe('a');
  });

  it('never touches a fight against enemies', () => {
    let s = start([], {});
    s.turn = 200;
    const hp = hero(s).hp;
    s = end(s).state;
    expect(hero(s).hp).toBeGreaterThan(hp - 10);
  });
});
