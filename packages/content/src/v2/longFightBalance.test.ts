import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  createCombat,
  legalActions,
  previewCardDamage,
  type CardDef,
  type CombatDb,
  type CombatState,
  type Op,
  type Side,
} from '@sr/combat';
import { COMBAT_DB as base } from './index';
const card = (id: string, effects: Op[], extra: Partial<CardDef> = {}): CardDef => ({
  id,
  name: id,
  effects,
  cost: 0,
  kind: 'skill',
  target: 'none',
  ...extra,
});
const db: CombatDb = {
  ...base,
  cards: {
    ...base.cards,
    blank: card('blank', []),
    consume: card('consume', [], { exhaust: true }),
    hit: card('hit', [{ op: 'damage', amount: 1, to: 'target' }], {
      kind: 'attack',
      target: 'foe',
    }),
    shieldHit: card(
      'shieldHit',
      [{ op: 'damage', amount: 0, to: 'target', scale: { by: 'barrier' } }],
      { kind: 'attack', target: 'foe' },
    ),
    expose: card('expose', [{ op: 'status', status: 'exposed', amount: 1, to: 'target' }], {
      target: 'foe',
    }),
    reactiveConsume: card('reactiveConsume', [
      { op: 'power', when: 'hurt', ops: [{ op: 'exhaustTop', amount: 1 }] },
    ]),
    reactiveExpose: card('reactiveExpose', [
      {
        op: 'power',
        when: 'hurt',
        ops: [{ op: 'status', status: 'exposed', amount: 1, to: 'attacker' }],
      },
    ]),
    swordSpell: card('swordSpell', [], { tags: ['sword', 'spell'] }),
    raise: card('raise', [{ op: 'raise', unit: 'bone-thrall', amount: 2 }]),
    choiceCommand: card('choiceCommand', [{ op: 'scry', amount: 1 }], { tags: ['command'] }),
    innerCommand: card('innerCommand', [], { tags: ['command'] }),
    outerCommand: card(
      'outerCommand',
      [
        { op: 'playPile', from: 'draw', amount: 1 },
        { op: 'damage', amount: 10000, to: 'allAllies' },
      ],
      { tags: ['command'] },
    ),
    replayAttack: card('replayAttack', [{ op: 'playPile', from: 'draw', amount: 1 }]),
    sharedA: card('sharedA', [
      { op: 'oncePerTurn', key: 'test-allowance', ownTurn: true, ops: [{ op: 'mana', amount: 1 }] },
    ]),
    sharedB: card('sharedB', [
      { op: 'oncePerTurn', key: 'test-allowance', ownTurn: true, ops: [{ op: 'mana', amount: 1 }] },
    ]),
    nestedAllowance: card('nestedAllowance', [
      {
        op: 'oncePerTurn',
        key: 'test-allowance',
        ownTurn: true,
        ops: [
          { op: 'oncePerTurn', key: 'test-allowance', ops: [{ op: 'mana', amount: 10 }] },
          { op: 'mana', amount: 1 },
        ],
      },
    ]),
    reactiveAllowance: card('reactiveAllowance', [
      {
        op: 'power',
        when: 'hurt',
        ops: [
          {
            op: 'oncePerTurn',
            key: 'test-allowance',
            ownTurn: true,
            ops: [{ op: 'mana', amount: 1 }],
          },
        ],
      },
    ]),
  },
};
const hero = (s: CombatState, side: Side = 'a') =>
  s.sides[side].units.find((u) => u.kind === 'hero')!;
const allies = (s: CombatState) => s.sides.a.units.filter((u) => u.kind === 'ally' && u.hp > 0);
let serial = 0;
function fight(h = 'engineer', asc?: string, hp?: number) {
  const s = createCombat(db, {
    seed: 'long-fight-rules',
    a: {
      hero: h,
      deck: ['blank'],
      ...(asc ? { ascendancy: `${h}:${asc}` } : {}),
      ...(hp ? { maxHp: hp, hp } : {}),
    },
    b: { hero: 'knight', deck: ['blank'] },
  }).state;
  for (const side of ['a', 'b'] as const) {
    s.sides[side].draw = Array.from({ length: 100 }, () => ({
      id: `draw-${serial++}`,
      card: 'blank',
    }));
    s.sides[side].mana = 20;
  }
  hero(s, 'b').hp = hero(s, 'b').maxHp = 100000;
  return s;
}
function play(s: CombatState, id: string, target?: string) {
  const inst = `play-${serial++}`;
  s.sides[s.active].hand = [{ id: inst, card: id }];
  s.sides[s.active].mana = 20;
  const action = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === inst && (!target || a.target === target),
  );
  expect(action, id).toBeDefined();
  return applyAction(db, s, action!).state;
}
const end = (s: CombatState) => applyAction(db, s, { type: 'endTurn' }).state;
const round = (s: CombatState) => end(end(s));
const restored = (s: CombatState): CombatState => JSON.parse(JSON.stringify(s)) as CombatState;

describe('long-fight balance rules81', () => {
  it('separates three Harvest, six Barrier rewards and diminishing Fate across an owner-round', () => {
    let s = play(fight('necromancer', 'soulreaper'), 'reactiveConsume');
    for (let i = 0; i < 8; i++) s = play(s, 'consume');
    expect(s.sides.a.discipline?.progress).toBe(3);
    expect(hero(s).barrier).toBe(18);
    expect(hero(s, 'b').statuses.doom).toBe(20);
    const before = hero(s, 'b').hp;
    s = end(s);
    expect(before - hero(s, 'b').hp).toBe(10); // Reap4 + 2*3
    hero(s).barrier = 0;
    s = play(restored(s), 'hit', hero(s).id);
    expect(s.sides.a.discipline?.progress).toBe(3);
    expect(hero(s).barrier).toBe(0);
    expect(hero(s, 'b').statuses.doom).toBe(21);
    s = play(end(s), 'consume');
    expect(s.sides.a.discipline?.progress).toBe(4);
    expect(hero(s).barrier).toBe(3);
    expect(hero(s, 'b').statuses.doom).toBe(24);
  });
  it.each(['', '+'])(
    'Fault Lines%s counts dual tags once, stops at six per copy and resets',
    (suffix) => {
      let s = play(play(fight('spellblade'), `fault-lines${suffix}`), `fault-lines${suffix}`);
      for (let i = 0; i < 8; i++) s = play(s, 'swordSpell');
      expect(hero(s, 'b').statuses.fracture).toBe(12);
      s = play(restored(s), 'swordSpell');
      expect(hero(s, 'b').statuses.fracture).toBe(12);
      s = play(round(s), 'swordSpell');
      expect(hero(s, 'b').statuses.fracture).toBe(14);
    },
  );
  it.each([
    [88, 3],
    [528, 16],
    [588, 18],
    [100, 3],
  ])('Fermentation at %i max HP heals %i at five stacks, rounding the sum once', (hp, heal) => {
    let s = fight('drunkard', 'brewmaster', hp);
    s.sides.a.discipline!.progress = 5;
    hero(s).hp = hp - 40;
    hero(s).statuses = {};
    s = end(s);
    expect(hero(s).hp).toBe(hp - 40 + heal);
    expect(hero(s).barrier).toBe(10);
    expect(s.sides.a.discipline?.progress).toBe(5);
  });
  it.each(['', '+'])(
    'Measured Ruin%s keeps the Spell restriction, spending and per-turn use',
    (suffix) => {
      let s = play(
        play(fight('spellblade', 'archmage'), `measured-ruin${suffix}`),
        `measured-ruin${suffix}`,
      );
      s.sides.a.stars = 20;
      const before = hero(s, 'b').hp;
      s = play(s, 'devastate');
      expect(before - hero(s, 'b').hp).toBe(suffix ? 232 : 192);
      expect(s.sides.a.nextStars).toBe(10);
      s.sides.a.stars = 20;
      const second = hero(s, 'b').hp;
      s = play(s, 'devastate');
      expect(second - hero(s, 'b').hp).toBe(132);
      s = round(s);
      s.sides.a.stars = 40;
      hero(s, 'b').barrier = 0;
      const third = hero(s, 'b').hp;
      s = play(s, 'obsidian-drill');
      expect(third - hero(s, 'b').hp).toBe(141); // Sword:3*(7+2*20), no Spell-only bonuses
    },
  );
  it('Cut the Deck shares its successful refund across base/upgraded copies and resets next own turn', () => {
    let s = fight('trickster');
    s.sides.a.suitsTurn = [];
    s = play(s, 'cut-the-deck');
    expect(s.sides.a.mana).toBe(19); // condition failed: allowance remains available
    s.sides.a.suitsTurn = ['spades', 'hearts', 'diamonds'];
    const drawn = s.sides.a.draw.length;
    s = play(s, 'cut-the-deck');
    expect(s.sides.a.mana).toBe(20);
    expect(s.sides.a.draw.length).toBe(drawn - 2);
    s = play(restored(s), 'cut-the-deck+');
    expect(s.sides.a.mana).toBe(19);
    expect(s.sides.a.draw.length).toBe(drawn - 5);
    s = round(s);
    s.sides.a.suitsTurn = ['spades', 'hearts', 'diamonds'];
    s = play(s, 'cut-the-deck+');
    expect(s.sides.a.mana).toBe(20);
    expect(cardText(db, db.cards['cut-the-deck']!)).toContain('across all copies');
  });
  it('generic effect groups share allowances across different card IDs without leaking between sides', () => {
    let s = play(fight(), 'sharedA');
    expect(s.sides.a.mana).toBe(21);
    s = play(restored(s), 'sharedB');
    expect(s.sides.a.mana).toBe(20);
    s = play(end(s), 'sharedB');
    expect(s.sides.b.mana).toBe(21);
    s = play(end(s), 'sharedA');
    expect(s.sides.a.mana).toBe(21);
  });
  it('Scent copies cap at three hostile applications each, including reactive opponent-turn triggers', () => {
    let s = play(
      play(play(fight('knight'), 'scent-of-weakness'), 'scent-of-weakness+'),
      'reactiveExpose',
    );
    const before = s.sides.a.draw.length;
    s = play(s, 'expose', hero(s, 'b').id);
    s = end(s);
    hero(s).barrier = 0;
    for (let i = 0; i < 4; i++) s = play(s, 'hit', hero(s).id);
    expect(s.sides.a.draw.length).toBe(before - 6);
    s = end(restored(s));
    const next = s.sides.a.draw.length;
    s = play(s, 'expose', hero(s, 'b').id);
    expect(s.sides.a.draw.length).toBe(next - 2);
  });
  it('shared allowances are claimed before nested effects and reject off-turn triggers', () => {
    let s = play(fight(), 'nestedAllowance');
    expect(s.sides.a.mana).toBe(21);
    s = end(play(fight(), 'reactiveAllowance'));
    hero(s).barrier = 0;
    const before = s.sides.a.mana;
    s = play(s, 'hit', hero(s).id);
    expect(s.sides.a.mana).toBe(before);
    expect(s.sides.a.effectTurns?.['test-allowance']).toBeUndefined();
    s = play(end(s), 'sharedA');
    expect(s.sides.a.mana).toBe(21);
  });
  it('Bonelord excludes other companions and caps protection even with four living Thralls', () => {
    let s = play(fight('necromancer', 'bonelord'), 'raise');
    allies(s)[0]!.def = 'drone';
    s = play(s, 'innerCommand');
    expect(hero(s).barrier).toBe(6);
    s = round(s);
    allies(s)[0]!.def = 'bone-thrall';
    s.sides.a.units.push({ ...allies(s)[0]!, id: 'fourth-thrall', statuses: {} });
    s = play(s, 'innerCommand');
    expect(hero(s).barrier).toBe(9);
  });
  it('Bonelord counts surviving Thralls after a Command and limits the reward to the first card', () => {
    let s = play(fight('necromancer', 'bonelord'), 'raise');
    expect(allies(s)).toHaveLength(3);
    s = play(s, 'off-the-leash');
    expect(hero(s).barrier).toBe(9);
    s = play(s, 'off-the-leash');
    expect(hero(s).barrier).toBe(9);
    s = round(s);
    s = play(s, 'outerCommand'); // free inner Command finishes first; outer kills Thralls
    expect(allies(s)).toHaveLength(0);
    expect(hero(s).barrier).toBe(0);
  });
  it('Bonelord reserves the first played Command through a nested Command and save-restored choice', () => {
    let s = fight('necromancer', 'bonelord');
    s.sides.a.draw.unshift({ id: 'nested', card: 'innerCommand' });
    s = play(s, 'outerCommand');
    expect(hero(s).barrier).toBe(0);
    s = round(s);
    s = play(s, 'choiceCommand');
    expect(s.pending).toBeTruthy();
    expect(hero(s).barrier).toBe(0);
    s = restored(s);
    const pick = legalActions(db, s).find((a) => a.type === 'pick');
    expect(pick).toBeDefined();
    s = applyAction(db, s, pick!).state;
    expect(hero(s).barrier).toBe(3 * allies(s).length);
  });
  it.each([
    [88, 35, 5],
    [528, 211, 27],
    [588, 235, 30],
  ])('Deathwish at %i max/%i current HP grants %i before its Attack', (maxHp, hp, shield) => {
    let s = fight('drunkard', 'deathwish', maxHp);
    hero(s).hp = hp;
    hero(s).barrier = 0;
    s.sides.a.hand = [{ id: 'preview', card: 'shieldHit' }];
    const snapshot = JSON.stringify(s);
    const preview = previewCardDamage(db, s, 'preview', hero(s, 'b').id).get(0)?.lo;
    expect(JSON.stringify(s)).toBe(snapshot);
    const before = hero(s, 'b').hp;
    s = play(s, 'shieldHit');
    expect(hero(s).barrier).toBe(shield);
    expect(before - hero(s, 'b').hp).toBe(preview);
    expect(preview).toBeGreaterThan(0);
    s = play(restored(s), 'hit');
    expect(hero(s).barrier).toBe(shield);
    s = round(s);
    s.sides.a.draw.unshift({ id: 'free-attack', card: 'hit' });
    s = play(s, 'replayAttack');
    expect(hero(s).barrier).toBe(shield);
  });
  it('Deathwish does not defer a healthy first Attack until a later low-HP Attack', () => {
    let s = fight('drunkard', 'deathwish', 100);
    hero(s).hp = 41;
    s = play(s, 'hit');
    expect(hero(s).barrier).toBe(0);
    hero(s).hp = 40;
    s = play(s, 'hit');
    expect(hero(s).barrier).toBe(0);
    s = play(round(s), 'hit');
    expect(hero(s).barrier).toBe(5);
  });
});

const resources: [string, number, number, number, number][] = [
  ['crimson-offering', 1, 1, 1, 1],
  ['blood-tithe', 1, 1, 1, 1],
  ['adrenal-surge', 1, 1, 1, 1],
  ['rush-of-blood', 1, 0, 1, 1],
  ['wellspring', 2, 2, 2, 3],
  ['soul-tithe', 1, 2, 1, 3],
  ['spirit-offering', 1, 1, 1, 2],
];
it.each(resources)(
  '%s gives the exact immediate/deferred Mana and pays the deferred part only once',
  (id, now, later, upNow, upLater) => {
    for (const [suffix, immediate, delayed] of [
      ['', now, later],
      ['+', upNow, upLater],
    ] as const) {
      let s = play(fight(), id + suffix);
      expect(s.sides.a.mana).toBe(20 + immediate);
      s = round(restored(s));
      expect(s.sides.a.mana).toBe(3 + delayed);
      s = round(s);
      expect(s.sides.a.mana).toBe(3);
    }
  },
);
