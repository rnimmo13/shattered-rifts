// Rules tests for the engine pieces the Defect copy (the totemist) added: totems that start charged, fade, or pulse at the start of
// the turn; pulses and newest-first awakenings; "evoke" Auras; once-a-turn and limited Auras; status-card triggers; lasting cost
// changes; Echo, Resound, Free Aura and Deftness. A tiny self-contained ruleset, so nothing here depends on real card data.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
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
const dmg = (amount: number, to: Sel = 'target'): Op => ({ op: 'damage', amount, to });
const power = (id: string, ops: Op[], extra: Partial<CardDef> = {}): [string, CardDef] =>
  c(id, { kind: 'power', effects: ops, ...extra });

const DB: CombatDb = {
  cards: Object.fromEntries([
    c('strike', { kind: 'attack', target: 'foe', effects: [dmg(6)] }),
    c('zero', { kind: 'attack', target: 'foe', cost: 0, effects: [dmg(2)] }),
    c('plant-dark', { effects: [{ op: 'channel', rune: 'dark' }] }),
    c('plant-glass', { effects: [{ op: 'channel', rune: 'glass' }] }),
    c('plant-plasma', { effects: [{ op: 'channel', rune: 'plasma' }] }),
    c('plant-spark', { effects: [{ op: 'channel', rune: 'spark' }] }),
    c('plant-any', { effects: [{ op: 'channel', rune: '*', times: 6 }] }),
    c('evoke-new', { effects: [{ op: 'evoke', last: true }] }),
    c('evoke-old', { effects: [{ op: 'evoke' }] }),
    c('evoke-twice', { effects: [{ op: 'evoke', times: 2 }] }),
    c('pulse-first', { effects: [{ op: 'pulse', first: true }] }),
    c('pulse-aim', {
      kind: 'attack',
      target: 'foe',
      effects: [dmg(1), { op: 'pulse', rune: 'spark', aim: true }],
    }),
    c('kinds', { effects: [{ op: 'draw', amount: 0, scale: { by: 'runeKinds' } }] }),
    c('if-spark', {
      effects: [
        {
          op: 'when',
          by: 'runesOf',
          rune: 'spark',
          atLeast: 1,
          ops: [{ op: 'barrier', amount: 5, to: 'self' }],
        },
      ],
    }),
    c('voltaic', {
      effects: [
        { op: 'channel', rune: 'spark', times: 0, scale: { by: 'channeledOf', rune: 'spark' } },
      ],
    }),
    power('thunder', [{ op: 'power', when: 'evoke', rune: 'spark', ops: [dmg(10)] }]),
    power('feral', [
      {
        op: 'power',
        when: 'play',
        filter: 'attack',
        maxCost: 0,
        once: true,
        ops: [{ op: 'returnPlayed' }],
      },
    ]),
    c('rod', {
      effects: [
        { op: 'power', when: 'turnStart', times: 2, ops: [{ op: 'channel', rune: 'spark' }] },
      ],
    }),
    power('smoke', [{ op: 'power', when: 'created', tag: 'status', ops: [dmg(5, 'allFoes')] }]),
    power('iterate', [
      { op: 'power', when: 'draw', tag: 'status', once: true, ops: [{ op: 'draw', amount: 2 }] },
    ]),
    c('make-junk', {
      effects: [{ op: 'addCard', card: 'junk', to: 'discard', side: 'self', times: 2 }],
    }),
    c('junk', { unplayable: true, cost: 0, tags: ['status'], effects: [] }),
    c('burn', {
      unplayable: true,
      tags: ['status'],
      effects: [],
      inHandAtEnd: [{ op: 'loseHp', amount: 2, to: 'self' }],
    }),
    c('void', { unplayable: true, effects: [], onDraw: [{ op: 'mana', amount: -1 }] }),
    c('rocket', {
      kind: 'attack',
      target: 'foe',
      cost: 2,
      cheaperOnCreate: 'status',
      effects: [dmg(1)],
    }),
    c('momentum', {
      kind: 'attack',
      target: 'foe',
      effects: [dmg(1), { op: 'recost', amount: -1 }],
    }),
    c('modded', { cost: 0, effects: [{ op: 'recost', amount: 1 }] }),
    c('adaptive', {
      kind: 'attack',
      target: 'foe',
      cost: 2,
      effects: [dmg(1), { op: 'copySelf', to: 'discard', free: true }],
    }),
    c('all-for-one', { effects: [{ op: 'fetch', amount: 99, to: 'hand', maxCost: 0 }] }),
    c('flak', {
      kind: 'attack',
      effects: [
        { op: 'exhaustCards', amount: 99, tag: 'status', everywhere: true },
        {
          op: 'damage',
          amount: 3,
          hits: 0,
          to: 'randomFoe',
          scale: { by: 'exhaustedNow', into: 'hits' },
        },
      ],
    }),
    c('compact', { effects: [{ op: 'transform', tag: 'status', into: 'strike' }] }),
    c('scrape', { effects: [{ op: 'draw', amount: 3, keepCost: 0 }] }),
    c('reboot', { effects: [{ op: 'reshuffle' }] }),
    c('synthesis', { effects: [{ op: 'status', status: 'freepower', amount: 1, to: 'self' }] }),
    c('signal', { effects: [{ op: 'status', status: 'boosted', amount: 1, to: 'self' }] }),
    c('echo', { effects: [{ op: 'status', status: 'echoing', amount: 1, to: 'self' }] }),
    c('deft', { effects: [{ op: 'status', status: 'deftness', amount: 3, to: 'self' }] }),
    c('temp-focus', {
      effects: [{ op: 'status', status: 'resonance', amount: 2, to: 'self', temp: true }],
    }),
    c('focus', { effects: [{ op: 'status', status: 'resonance', amount: 1, to: 'self' }] }),
    c('hyper', {
      effects: [{ op: 'status', status: 'resonance', amount: -3, to: 'self', temp: true }],
    }),
    c('helix', {
      kind: 'attack',
      target: 'foe',
      cost: 0,
      effects: [{ op: 'damage', amount: 0, to: 'target', scale: { by: 'manaSpent', mult: 3 } }],
    }),
    c('eyes', {
      kind: 'attack',
      target: 'foe',
      cost: 0,
      effects: [
        dmg(1),
        {
          op: 'when',
          by: 'attacking',
          of: 'target',
          atLeast: 1,
          ops: [{ op: 'status', status: 'faltering', amount: 1, to: 'target' }],
        },
      ],
    }),
    c('uproar', { effects: [{ op: 'playPile', from: 'draw', kind: 'attack' }] }),
    power('aura', [{ op: 'status', status: 'might', amount: 1, to: 'self' }], { cost: 2 }),
  ]),
  boons: {},
  potions: {},
  runes: {
    spark: {
      id: 'spark',
      name: 'Spark',
      text: 'test',
      passive: [dmg(3, 'randomFoe')],
      evoke: [dmg(8, 'randomFoe')],
    },
    dark: {
      id: 'dark',
      name: 'Dark',
      text: 'test',
      start: 6,
      grow: 6,
      plainEvoke: true,
      passive: [],
      evoke: [{ op: 'damage', amount: 0, to: 'weakestFoe', scale: { by: 'charge' } }],
    },
    glass: {
      id: 'glass',
      name: 'Glass',
      text: 'test',
      start: 4,
      decay: 1,
      passive: [
        {
          op: 'when',
          by: 'charge',
          atLeast: 1,
          ops: [{ op: 'damage', amount: 0, to: 'allFoes', scale: { by: 'charge' } }],
        },
      ],
      evoke: [{ op: 'damage', amount: 0, to: 'allFoes', scale: { by: 'charge', mult: 2 } }],
    },
    plasma: {
      id: 'plasma',
      name: 'Plasma',
      text: 'test',
      atStart: true,
      passive: [{ op: 'mana', amount: 1 }],
      evoke: [{ op: 'mana', amount: 2 }],
    },
  },
  units: {
    dummy: {
      id: 'dummy',
      name: 'Dummy',
      maxHp: 300,
      brain: {
        kind: 'enemy',
        moves: {
          wait: { id: 'wait', name: 'Wait', effects: [{ op: 'barrier', amount: 0, to: 'self' }] },
        },
        pattern: { kind: 'cycle', order: ['wait'] },
      },
    },
    hitter: {
      id: 'hitter',
      name: 'Hitter',
      maxHp: 300,
      brain: {
        kind: 'enemy',
        moves: { hit: { id: 'hit', name: 'Hit', effects: [dmg(1)] } },
        pattern: { kind: 'cycle', order: ['hit'] },
      },
    },
  },
  heroes: { tester: { id: 'tester', name: 'Tester', maxHp: 100, mana: 3, handSize: 5 } },
};

/** A fight against `enemies` with exactly `hand` in hand (ids h0, h1...) and `draw` as the draw pile (d0, d1...). */
function start(
  hand: string[],
  opts: { enemies?: string[]; draw?: string[]; mana?: number } = {},
): CombatState {
  const { state } = createCombat(DB, {
    seed: 'totems',
    a: { hero: 'tester', deck: ['strike'] },
    b: { enemies: opts.enemies ?? ['dummy'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `h${i}`, card }));
  s.sides.a.draw = (opts.draw ?? []).map((card, i) => ({ id: `d${i}`, card }));
  s.sides.a.discard = [];
  s.sides.a.mana = opts.mana ?? 3;
  return s;
}
const hero = (s: CombatState): Unit => heroOf(s.sides.a) as Unit;
const foe = (s: CombatState, i = 0): Unit => s.sides.b.units[i] as Unit;
const play = (s: CombatState, card: string): CombatState => {
  const aimed = DB.cards[s.sides.a.hand.find((x) => x.id === card)!.card]!.target === 'foe';
  return applyAction(
    DB,
    s,
    aimed ? { type: 'play', card, target: foe(s).id } : { type: 'play', card },
  ).state;
};
const end = (s: CombatState): CombatState => applyAction(DB, s, { type: 'endTurn' }).state;

describe('the Defect copy: the ruleset is sound', () => {
  it('validates', () => expect(validateDb(DB)).toEqual([]));
});

describe('totems that start charged, fade, or fire at the start of the turn', () => {
  it('a Dark totem starts at 6, grows by 6 (Spirit adds), and awakens on the weakest enemy without Spirit', () => {
    let s = start(['focus', 'plant-dark', 'evoke-old'], { enemies: ['dummy', 'dummy'], mana: 9 });
    foe(s, 1).hp = 50;
    s = play(s, 'h0');
    s = play(s, 'h1');
    expect(s.sides.a.runes[0]?.charge).toBe(6);
    s = end(s);
    expect(s.sides.a.runes[0]?.charge).toBe(6 + 6 + 1);
    s.sides.a.hand = [{ id: 'e', card: 'evoke-old' }];
    s.sides.a.mana = 3;
    s = play(s, 'e');
    // 13 to the one at 50 HP, not 14: the Spirit went into the charge
    expect(foe(s, 1).hp).toBe(50 - 13);
    expect(foe(s, 0).hp).toBe(300);
  });

  it('awakening a charged totem twice deals its charge twice', () => {
    let s = start(['plant-dark', 'evoke-twice']);
    s = play(s, 'h0');
    s = play(s, 'h1');
    expect(foe(s).hp).toBe(300 - 12);
  });

  it('a Glass totem hits every enemy for its charge, then fades by 1, and stops at 0', () => {
    let s = start(['plant-glass'], { enemies: ['dummy', 'dummy'] });
    s = play(s, 'h0');
    s = end(s);
    expect(foe(s, 0).hp).toBe(296);
    expect(foe(s, 1).hp).toBe(296);
    expect(s.sides.a.runes[0]?.charge).toBe(3);
    for (let i = 0; i < 4; i++) s = end(s);
    expect(foe(s, 0).hp).toBe(300 - 4 - 3 - 2 - 1);
    expect(s.sides.a.runes[0]?.charge).toBe(0);
  });

  it('a Plasma totem gives its Mana at the start of your turn, not the end', () => {
    let s = start(['plant-plasma']);
    s = play(s, 'h0');
    s = end(s);
    expect(s.sides.a.mana).toBe(3 + 1);
  });
});

describe('awakenings and pulses', () => {
  it('evoke `last` takes the newest totem; a pulse fires the oldest one, or one kind against the target', () => {
    let s = start(['plant-spark', 'plant-glass', 'evoke-new'], { mana: 9 });
    s = play(s, 'h0');
    s = play(s, 'h1');
    s = play(s, 'h2');
    expect(s.sides.a.runes.map((x) => x.rune)).toEqual(['spark']);
    expect(foe(s).hp).toBe(300 - 8);
    s.sides.a.hand = [
      { id: 'p', card: 'pulse-first' },
      { id: 'a', card: 'pulse-aim' },
    ];
    s = play(s, 'p');
    expect(foe(s).hp).toBe(300 - 8 - 3);
    s = play(s, 'a');
    expect(foe(s).hp).toBe(300 - 8 - 3 - 1 - 3);
  });

  it("an 'evoke' Aura strikes each enemy the totem's awakening struck, and only for its own kind", () => {
    let s = start(['thunder', 'plant-spark', 'evoke-old', 'plant-glass', 'evoke-old'], { mana: 9 });
    for (const id of ['h0', 'h1', 'h2']) s = play(s, id);
    expect(foe(s).hp).toBe(300 - 8 - 10);
    s = play(s, 'h3');
    s = play(s, 'h4');
    expect(foe(s).hp).toBe(300 - 8 - 10 - 8);
  });

  it("'*' plants random totems of every kind there is; runeKinds, runesOf and channeledOf count them", () => {
    let s = start(['plant-any'], { mana: 9 });
    s.sides.a.runeSlots = 10;
    s = play(s, 'h0');
    expect(s.sides.a.runes).toHaveLength(6);
    for (const r of s.sides.a.runes) expect(Object.keys(DB.runes ?? {})).toContain(r.rune);
    const kinds = new Set(s.sides.a.runes.map((x) => x.rune)).size;
    const sparks = s.sides.a.runes.filter((x) => x.rune === 'spark').length;
    s.sides.a.hand = [
      { id: 'k', card: 'kinds' },
      { id: 'v', card: 'voltaic' },
    ];
    s.sides.a.draw = Array.from({ length: 8 }, (_, i) => ({ id: `x${i}`, card: 'strike' }));
    s = play(s, 'k');
    expect(s.sides.a.hand).toHaveLength(1 + kinds);
    s = play(s, 'v');
    expect(s.sides.a.channeledBy?.spark ?? 0).toBe(sparks * 2);
  });

  it('a condition can ask for a kind of totem', () => {
    let s = start(['if-spark', 'plant-spark', 'if-spark'], { mana: 9 });
    s = play(s, 'h0');
    expect(hero(s).barrier).toBe(0);
    s = play(s, 'h1');
    s = play(s, 'h2');
    expect(hero(s).barrier).toBe(5);
  });
});

describe('Auras that answer once a turn, a few times, or for status cards', () => {
  it('Feral: the first 0-cost Attack each turn returns to your hand, and only the first', () => {
    let s = start(['feral', 'zero', 'zero', 'strike'], { mana: 9 });
    s = play(s, 'h0');
    s = play(s, 'h3');
    expect(s.sides.a.hand.map((x) => x.id)).toContain('h1');
    s = play(s, 'h1');
    expect(s.sides.a.hand.map((x) => x.id)).toContain('h1');
    s = play(s, 'h2');
    expect(s.sides.a.hand.map((x) => x.id)).not.toContain('h2');
  });

  it('an Aura with `times` goes after answering that many times (Lightning Rod)', () => {
    let s = start(['rod']);
    s = play(s, 'h0');
    s = end(s);
    s = end(s);
    s = end(s);
    expect(s.sides.a.channeledBy?.spark).toBe(2);
    expect(s.sides.a.powers).toHaveLength(0);
  });

  it('a created status card sets off Smokestack, and a drawn one Iteration (once a turn)', () => {
    let s = start(['smoke', 'make-junk'], { enemies: ['dummy', 'dummy'] });
    s = play(s, 'h0');
    s = play(s, 'h1');
    expect(foe(s, 0).hp).toBe(290);
    expect(foe(s, 1).hp).toBe(290);
    let t = start(['iterate', 'scrape'], {
      draw: ['junk', 'junk', 'strike', 'strike', 'strike', 'strike'],
    });
    t = play(t, 'h0');
    t = play(t, 'h1');
    // Scrape drew junk (whose Iteration drew junk and a strike: not Scrape's own, so kept), then two strikes it discards
    expect(t.sides.a.hand.map((x) => x.card)).toEqual(['junk', 'junk', 'strike']);
    expect(t.sides.a.discard.filter((x) => x.card === 'strike')).toHaveLength(2);
  });
});

describe('turn-long statuses undo in reverse', () => {
  it('a gain and then a loss of Spirit this turn leave no Spirit behind', () => {
    let s = start(['temp-focus', 'hyper']);
    s = play(s, 'h0');
    s = play(s, 'h1');
    s = end(s);
    expect(hero(s).statuses.resonance ?? 0).toBe(0);
  });
});

describe('status cards', () => {
  it('Burn hurts if held at the end of the turn; Void costs Mana when drawn; Rocket Punch gets cheaper', () => {
    let s = start(['burn', 'rocket', 'make-junk']);
    s = play(s, 'h2');
    const rocket = s.sides.a.hand.find((x) => x.id === 'h1')!;
    expect(rocket.costMod).toBe(-2);
    const hp = hero(s).hp;
    s.sides.a.draw = [{ id: 'v', card: 'void' }];
    s = end(s);
    expect(hero(s).hp).toBe(hp - 2);
    expect(s.sides.a.mana).toBe(3 - 1);
  });

  it('Flak Cannon consumes every status card, hand and piles, and hits once for each', () => {
    let s = start(['flak', 'junk'], { draw: ['junk', 'strike'] });
    s.sides.a.discard = [{ id: 'j', card: 'junk' }];
    s = play(s, 'h0');
    expect(s.sides.a.exhausted.filter((x) => x.card === 'junk')).toHaveLength(3);
    expect(foe(s).hp).toBe(300 - 9);
  });

  it('Compact turns status cards in hand into another card', () => {
    let s = start(['compact', 'junk', 'zero']);
    s = play(s, 'h0');
    expect(s.sides.a.hand.map((x) => x.card)).toEqual(['strike', 'zero']);
  });
});

describe('lasting cost changes, copies and fetches', () => {
  it('recost adds up and a play does not spend it (Modded); Momentum Strike becomes free', () => {
    let s = start(['modded', 'momentum'], { mana: 9 });
    s = play(s, 'h0');
    expect(s.sides.a.discard[0]?.costUp).toBe(1);
    s.sides.a.hand.push(s.sides.a.discard.pop()!);
    s = play(s, 'h0');
    expect(s.sides.a.discard.find((x) => x.id === 'h0')?.costUp).toBe(2);
    s = play(s, 'h1');
    expect(s.sides.a.discard.find((x) => x.id === 'h1')?.costUp).toBe(-1);
  });

  it('a free copy costs 0 for good, and All for One fetches every 0-cost card', () => {
    let s = start(['adaptive', 'all-for-one']);
    s.sides.a.discard = [
      { id: 'z1', card: 'zero' },
      { id: 's1', card: 'strike' },
    ];
    s = play(s, 'h0');
    s.sides.a.mana = 3;
    s = play(s, 'h1');
    expect(s.sides.a.hand.map((x) => x.card).sort()).toEqual(['adaptive', 'zero']);
  });

  it('Reboot shuffles hand and discard pile into the draw pile', () => {
    let s = start(['reboot', 'strike', 'zero']);
    s.sides.a.discard = [{ id: 'q', card: 'strike' }];
    s = play(s, 'h0');
    expect(s.sides.a.hand).toHaveLength(0);
    expect(s.sides.a.draw).toHaveLength(3);
  });

  it('Uproar plays a random Attack from the draw pile, not its top card', () => {
    let s = start(['uproar'], { draw: ['modded', 'strike'] });
    s = play(s, 'h0');
    expect(foe(s).hp).toBe(294);
    expect(s.sides.a.draw.map((x) => x.card)).toEqual(['modded']);
  });
});

describe('statuses: Free Aura, Resound, Echo, Deftness, and Spirit lost for a turn', () => {
  it('Synthesis makes the next Aura free; Signal Boost plays it twice', () => {
    let s = start(['synthesis', 'signal', 'aura'], { mana: 2 });
    s = play(s, 'h0');
    s = play(s, 'h1');
    s = play(s, 'h2');
    expect(s.sides.a.mana).toBe(0);
    expect(hero(s).statuses.might).toBe(2);
  });

  it('Echo Form plays the first card of each turn twice', () => {
    let s = start(['echo', 'strike'], { mana: 9 });
    s = play(s, 'h0');
    s = play(s, 'h1');
    expect(foe(s).hp).toBe(294);
    s = end(s);
    s.sides.a.hand = [
      { id: 'a', card: 'strike' },
      { id: 'b', card: 'strike' },
    ];
    s = play(s, 'a');
    s = play(s, 'b');
    expect(foe(s).hp).toBe(294 - 12 - 6);
  });

  it('Deftness adds to 0-cost Attacks only (Momentum Strike once free counts)', () => {
    let s = start(['deft', 'zero', 'strike'], { mana: 9 });
    s = play(s, 'h0');
    s = play(s, 'h1');
    expect(foe(s).hp).toBe(300 - 5);
    s = play(s, 'h2');
    expect(foe(s).hp).toBe(300 - 5 - 6);
  });

  it('Spirit lost for a turn comes back, but only what there was to lose', () => {
    let s = start(['focus', 'hyper']);
    s = play(s, 'h0');
    s = play(s, 'h1');
    expect(hero(s).statuses.resonance ?? 0).toBe(0);
    s = end(s);
    expect(hero(s).statuses.resonance).toBe(1);
  });

  it('Helix Drill counts the Mana spent this turn; Go for the Eyes reads the intent', () => {
    let s = start(['strike', 'strike', 'helix']);
    s = play(s, 'h0');
    s = play(s, 'h1');
    s = play(s, 'h2');
    expect(foe(s).hp).toBe(300 - 12 - 6);
    let t = start(['eyes'], { enemies: ['hitter'] });
    t = play(t, 'h0');
    expect(foe(t).statuses.faltering).toBe(1);
    expect(foe(t).hp).toBe(299);
    let u = start(['eyes']);
    u = play(u, 'h0');
    expect(foe(u).statuses.faltering).toBeUndefined();
  });

  it('every new piece has card text', () => {
    for (const card of Object.values(DB.cards))
      expect(cardText(DB, card).length, card.id).toBeGreaterThan(3);
  });
});
