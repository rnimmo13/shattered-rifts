// Rules tests for the generic pieces the Necrobinder copy (Dorian) brought: Raise, Command, the Fate cash-in, spreading debuffs,
// card keywords given in a fight (Fleeting, Hold, Replay), the cost rules, one-shot and pinned Auras, the new statuses and triggers.
// A tiny self-contained ruleset, so nothing here depends on real card data.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  clone,
  costOf,
  createCombat,
  heroOf,
  validateDb,
  type CardDef,
  type CombatDb,
  type CombatState,
  type Op,
  type Sel,
  type Unit,
} from './index';

const c = (id: string, extra: Partial<CardDef> & Pick<CardDef, 'effects'>): [string, CardDef] => [
  id,
  { id, name: id, kind: 'skill', cost: 1, target: 'none', ...extra },
];
const hit = (n: number, to: Sel = 'target'): Op => ({
  op: 'damage',
  amount: n,
  to,
});

const DB: CombatDb = {
  cards: Object.fromEntries([
    c('filler', { cost: 0, effects: [{ op: 'barrier', amount: 1, to: 'self' }] }),
    c('strike', { kind: 'attack', target: 'foe', effects: [hit(6)] }),
    c('big', { cost: 2, effects: [{ op: 'barrier', amount: 1, to: 'self' }] }),
    c('raise5', { effects: [{ op: 'raise', unit: 'thrall', amount: 5 }] }),
    c('poke', {
      kind: 'attack',
      cost: 0,
      target: 'foe',
      effects: [{ op: 'command', ops: [hit(6)] }],
    }),
    c('leash', {
      kind: 'attack',
      target: 'foe',
      effects: [
        { op: 'command', ops: [{ op: 'damage', amount: 6, to: 'target', scale: { by: 'hp' } }] },
      ],
    }),
    c('rattle', {
      kind: 'attack',
      target: 'foe',
      effects: [
        {
          op: 'command',
          ops: [
            { op: 'damage', amount: 7, to: 'target', scale: { by: 'allyStrikes', into: 'hits' } },
          ],
        },
      ],
    }),
    c('flatten', {
      kind: 'attack',
      cost: 2,
      target: 'foe',
      freeIf: { by: 'allyStrikes', atLeast: 1 },
      effects: [{ op: 'command', ops: [hit(12)] }],
    }),
    c('doom29', {
      effects: [
        { op: 'status', status: 'doom', amount: 29, to: 'allFoes' },
        { op: 'doomNow', to: 'allFoes' },
      ],
    }),
    c('noescape', {
      target: 'foe',
      effects: [
        {
          op: 'status',
          status: 'doom',
          amount: 10,
          to: 'target',
          scale: { by: 'doom', of: 'target', mult: 5, step: 10 },
        },
      ],
    }),
    c('misery', {
      kind: 'attack',
      target: 'foe',
      cost: 0,
      effects: [hit(1), { op: 'spreadDebuffs' }],
    }),
    c('sculpt', { effects: [{ op: 'mark', flag: 'ethereal' }] }),
    c('transfigure', { effects: [{ op: 'mark', flag: 'replay', costUp: 1 }] }),
    c('borrowed', {
      effects: [
        { op: 'mana', amount: 4 },
        { op: 'costTax', amount: 1 },
      ],
    }),
    c('invoke', {
      effects: [{ op: 'power', when: 'turnStart', once: true, ops: [{ op: 'mana', amount: 2 }] }],
    }),
    c('oblivion', {
      target: 'foe',
      cost: 0,
      effects: [
        {
          op: 'power',
          when: 'play',
          temp: true,
          pin: true,
          ops: [{ op: 'status', status: 'doom', amount: 3, to: 'target' }],
        },
      ],
    }),
    c('melancholy', {
      cost: 3,
      cheaperPer: { by: 'deaths', mult: 1 },
      effects: [{ op: 'barrier', amount: 13, to: 'self' }],
    }),
    c('righthand', {
      kind: 'attack',
      cost: 0,
      target: 'foe',
      recallOnCost: 2,
      effects: [{ op: 'command', ops: [hit(4)] }],
    }),
    c('fleeting', { ethereal: true, effects: [{ op: 'barrier', amount: 1, to: 'self' }] }),
    c('ashpower', {
      kind: 'power',
      effects: [
        {
          op: 'power',
          when: 'play',
          ethereal: true,
          ops: [{ op: 'barrier', amount: 4, to: 'self' }],
        },
      ],
    }),
    c('shroud', {
      kind: 'power',
      effects: [{ op: 'power', when: 'doomFoe', ops: [{ op: 'barrier', amount: 2, to: 'self' }] }],
    }),
    c('sleight', { kind: 'power', effects: [{ op: 'power', when: 'debuffFoe', ops: [hit(9)] }] }),
    c('mastery', {
      kind: 'power',
      effects: [
        {
          op: 'power',
          when: 'allyHurt',
          ops: [{ op: 'loseHp', amount: 0, to: 'allFoes', scale: { by: 'lost' } }],
        },
      ],
    }),
    c('reaper', {
      kind: 'power',
      effects: [{ op: 'status', status: 'reaping', amount: 1, to: 'self' }],
    }),
    c('blight', {
      kind: 'attack',
      target: 'foe',
      effects: [
        hit(8),
        { op: 'status', status: 'doom', amount: 0, to: 'target', scale: { by: 'dealt' } },
      ],
    }),
    c('hang', {
      kind: 'attack',
      target: 'foe',
      tags: ['noose'],
      effects: [hit(10), { op: 'status', status: 'noose', amount: 1, to: 'target' }],
    }),
    c('debilitate', {
      target: 'foe',
      effects: [{ op: 'status', status: 'debilitated', amount: 2, to: 'target' }],
    }),
    c('calcify', {
      kind: 'power',
      effects: [{ op: 'status', status: 'marrow', amount: 4, to: 'self' }],
    }),
    c('sicem', {
      kind: 'attack',
      target: 'foe',
      effects: [{ op: 'status', status: 'quarry', amount: 3, to: 'target', temp: true }],
    }),
    c('bones', {
      kind: 'attack',
      effects: [{ op: 'command', ops: [hit(9, 'allFoes'), { op: 'sacrifice', self: true }] }],
    }),
  ]),
  potions: {},
  boons: {},
  units: {
    thrall: { id: 'thrall', name: 'Thrall', maxHp: 5, brain: { kind: 'ally', act: [] } },
    dummy: {
      id: 'dummy',
      name: 'Dummy',
      maxHp: 300,
      brain: {
        kind: 'enemy',
        moves: { hit: { id: 'hit', name: 'Hit', effects: [hit(4)] } },
        pattern: { kind: 'cycle', order: ['hit'] },
      },
    },
  },
  heroes: {
    tester: {
      id: 'tester',
      name: 'Tester',
      maxHp: 100,
      mana: 3,
      handSize: 5,
      startUnits: ['thrall'],
    },
  },
};

function start(hand: string[], enemies = ['dummy']): CombatState {
  const { state } = createCombat(DB, {
    seed: 'r',
    a: { hero: 'tester', deck: Array<string>(12).fill('filler') },
    b: { enemies },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `h${i}`, card }));
  s.sides.a.mana = 9;
  return s;
}
const hero = (s: CombatState): Unit => heroOf(s.sides.a) as Unit;
const foe = (s: CombatState, i = 0): Unit => s.sides.b.units[i] as Unit;
const crew = (s: CombatState): Unit[] => s.sides.a.units.filter((u) => u.kind === 'ally');
const play = (s: CombatState, card: string, target?: string) =>
  applyAction(DB, s, { type: 'play', card, ...(target ? { target } : {}) }).state;
const end = (s: CombatState) => applyAction(DB, s, { type: 'endTurn' }).state;

describe('the Raise / Command ruleset is sound', () => {
  it('validates', () => expect(validateDb(DB)).toEqual([]));
});

describe('Raise and Command', () => {
  it('Raise brings a companion with the HP it says; with every slot taken the weakest grows instead', () => {
    let s = start(['raise5', 'raise5', 'raise5']);
    s = play(s, 'h0');
    s = play(s, 'h1');
    expect(crew(s).map((u) => u.maxHp)).toEqual([5, 5, 5]);
    crew(s)[0]!.maxHp = crew(s)[0]!.hp = 8;
    s = play(s, 'h2');
    expect(crew(s)).toHaveLength(3);
    expect(
      crew(s)
        .map((u) => u.maxHp)
        .sort((a, b) => a - b),
    ).toEqual([5, 8, 10]);
  });

  it('a companion with nothing to do does not act; a Command makes each one strike, reading its own HP', () => {
    let s = start(['raise5', 'leash']);
    s = play(s, 'h0');
    crew(s)[0]!.hp = 2;
    s = play(s, 'h1', foe(s).id);
    expect(foe(s).hp).toBe(300 - (6 + 2) - (6 + 5));
    expect(s.sides.a.allyStrikes).toBe(1);
    const out = applyAction(DB, s, { type: 'endTurn' });
    expect(out.events.some((e) => e.type === 'act' && crew(s).some((u) => u.id === e.unit))).toBe(
      false,
    );
  });

  it('Rattle hits once more per earlier command; Flatten is free once the companions have struck', () => {
    let s = start(['poke', 'rattle', 'flatten']);
    expect(costOf(DB, s.sides.a, s.sides.a.hand[2]!)).toBe(2);
    s = play(s, 'h0', foe(s).id);
    expect(
      costOf(
        DB,
        s.sides.a,
        s.sides.a.hand.find((c) => c.id === 'h2')!,
      ),
    ).toBe(0);
    s = play(s, 'h1', foe(s).id);
    expect(foe(s).hp).toBe(300 - 6 - 14);
  });

  it('Marrow adds to companion attacks only; a companion sacrificing itself under a Command dies', () => {
    let s = start(['calcify', 'poke', 'strike', 'bones']);
    s = play(s, 'h0');
    s = play(s, 'h1', foe(s).id);
    expect(foe(s).hp).toBe(300 - 10);
    s = play(s, 'h2', foe(s).id);
    expect(foe(s).hp).toBe(300 - 10 - 6);
    s = play(s, 'h3');
    expect(crew(s)).toHaveLength(0);
    expect(foe(s).hp).toBe(300 - 16 - 13);
  });

  it('Quarry: a companion that hits it raises another like itself', () => {
    let s = start(['sicem', 'poke']);
    s = play(s, 'h0', foe(s).id);
    s = play(s, 'h1', foe(s).id);
    expect(crew(s)).toHaveLength(2);
    expect(crew(s)[1]!.maxHp).toBe(3);
    s = end(s);
    expect(foe(s).statuses.quarry).toBeUndefined();
  });

  it('allyHurt: whatever a companion loses, every enemy loses too', () => {
    let s = start(['mastery']);
    s = play(s, 'h0');
    s = end(s);
    // the dummy hit the thrall for 4
    expect(foe(s).hp).toBe(300 - 4);
  });
});

describe('Fate and debuffs', () => {
  it('doomNow kills at once whoever is at or below its Fate', () => {
    const s = start(['doom29'], ['dummy', 'dummy']);
    foe(s, 0).hp = 20;
    const after = play(s, 'h0');
    expect(after.sides.b.units).toHaveLength(1);
  });

  it('a scale with a step counts whole steps', () => {
    const s = start(['noescape']);
    foe(s).statuses.doom = 29;
    expect(foe(play(s, 'h0', foe(s).id)).statuses.doom).toBe(29 + 10 + 10);
  });

  it('spreadDebuffs puts the target’s debuffs on every other enemy', () => {
    const s = start(['misery'], ['dummy', 'dummy']);
    foe(s, 0).statuses = { doom: 7, faltering: 1 };
    const after = play(s, 'h0', foe(s, 0).id);
    expect(foe(after, 1).statuses).toMatchObject({ doom: 7, faltering: 1 });
  });

  it('doomFoe and debuffFoe answer a curse on an enemy, aimed at it', () => {
    let s = start(['shroud', 'sleight', 'noescape']);
    s = play(s, 'h0');
    s = play(s, 'h1');
    const b = hero(s).barrier;
    s = play(s, 'h2', foe(s).id);
    expect(hero(s).barrier).toBe(b + 2);
    expect(foe(s).hp).toBe(300 - 9);
    expect(s.sides.a.doomedTurn).toBe(1);
  });

  it('dealt is what the damage took off; Reaping curses with what Attacks take off', () => {
    let s = start(['blight', 'reaper', 'strike']);
    foe(s).barrier = 3;
    s = play(s, 'h0', foe(s).id);
    expect(foe(s).statuses.doom).toBe(5);
    s = play(s, 'h1');
    s = play(s, 'h2', foe(s).id);
    expect(foe(s).statuses.doom).toBe(5 + 6);
  });

  it('noose doubles the damage of noose cards per stack; debilitated doubles Exposed and Faltering', () => {
    let s = start(['hang', 'hang', 'debilitate', 'strike']);
    s = play(s, 'h0', foe(s).id);
    s = play(s, 'h1', foe(s).id);
    expect(foe(s).hp).toBe(300 - 10 - 20);
    foe(s).statuses.exposed = 2;
    s = play(s, 'h2', foe(s).id);
    s = play(s, 'h3', foe(s).id);
    expect(foe(s).hp).toBe(300 - 30 - 12);
  });
});

describe('keywords and costs given in a fight', () => {
  it('mark: a card made Fleeting is consumed at the end of the turn', () => {
    let s = start(['sculpt', 'filler']);
    s = play(s, 'h0');
    expect(s.sides.a.hand[0]!.ethereal).toBe(true);
    s = end(s);
    expect(s.sides.a.exhausted.some((x) => x.id === 'h1')).toBe(true);
  });

  it('mark: Replay plays the card once more, and its lasting cost rise stays after it is played', () => {
    let s = start(['transfigure', 'strike']);
    s = play(s, 'h0');
    const inst = s.sides.a.hand.find((x) => x.id === 'h1')!;
    expect(costOf(DB, s.sides.a, inst)).toBe(2);
    s = play(s, 'h1', foe(s).id);
    expect(foe(s).hp).toBe(300 - 12);
    expect(s.sides.a.discard.find((x) => x.id === 'h1')?.costUp).toBe(1);
  });

  it('costTax makes every card cost more for the rest of the turn only', () => {
    let s = start(['borrowed', 'filler']);
    s.sides.a.mana = 1;
    s = play(s, 'h0');
    expect(s.sides.a.mana).toBe(4);
    expect(costOf(DB, s.sides.a, s.sides.a.hand[0]!)).toBe(1);
    s = end(s);
    expect(costOf(DB, s.sides.a, { id: 'x', card: 'filler' })).toBe(0);
  });

  it('cheaperPer: a card costs less for every death this fight', () => {
    const s = start(['melancholy']);
    s.sides.a.deaths = 2;
    expect(costOf(DB, s.sides.a, s.sides.a.hand[0]!)).toBe(1);
  });

  it('recallOnCost: the card comes back from the discard pile when a card of at least that cost is played', () => {
    let s = start(['righthand', 'big']);
    s = play(s, 'h0', foe(s).id);
    expect(s.sides.a.discard.some((x) => x.id === 'h0')).toBe(true);
    s = play(s, 'h1');
    expect(s.sides.a.hand.some((x) => x.id === 'h0')).toBe(true);
  });

  it('an Aura narrowed to Fleeting cards fires only for them, and they are counted', () => {
    let s = start(['ashpower', 'fleeting', 'filler']);
    s = play(s, 'h0');
    const b = hero(s).barrier;
    s = play(s, 'h1');
    expect(hero(s).barrier).toBe(b + 1 + 4);
    s = play(s, 'h2');
    expect(hero(s).barrier).toBe(b + 5 + 1);
    expect(s.sides.a.etherealPlayed).toBe(1);
  });
});

describe('one-shot and pinned Auras', () => {
  it('a once Aura fires at the next turn start and is gone', () => {
    let s = start(['invoke']);
    s = play(s, 'h0');
    s = end(s);
    expect(s.sides.a.mana).toBe(5);
    expect(s.sides.a.powers).toHaveLength(0);
  });

  it('a pinned Aura aims at the enemy it was played on, and not on the card that made it', () => {
    let s = start(['oblivion', 'filler', 'filler'], ['dummy', 'dummy']);
    s = play(s, 'h0', foe(s, 1).id);
    expect(foe(s, 1).statuses.doom).toBeUndefined();
    s = play(s, 'h1');
    s = play(s, 'h2');
    expect(foe(s, 1).statuses.doom).toBe(6);
    expect(foe(s, 0).statuses.doom).toBeUndefined();
  });
});
