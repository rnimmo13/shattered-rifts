// Three baseline cards that had lost part of their original in the copy (2026-10-28): Fated Hand chooses its 2 cards from the draw
// pile (Foregone Conclusion), Army of the Drowned raises two Thralls (Legion of Bone), Marked for Death earns an extra card reward when
// it kills (The Hunt).

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  chooseAction,
  clone,
  createCombat,
  legalActions,
  viewFor,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(
  hero: 'spellblade' | 'necromancer' | 'assassin' | 'knight',
  hand: string[],
  draw: string[] = [],
): CombatState {
  const deck = RIFTWALKERS[hero].starter;
  const { state } = createCombat(db, {
    seed: `copy-fix-${hero}`,
    a: { hero, deck: [...deck, ...deck] },
    b: { enemies: ['squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.draw = draw.map((card, i) => ({ id: `D${i}`, card }));
  s.sides.a.discard = [];
  s.sides.a.exhausted = [];
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 300;
    u.barrier = 0;
    u.statuses = {};
  }
  return s;
}
const playAct = (s: CombatState, id: string) => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === inst?.id);
  expect(act, `${id} playable`).toBeTruthy();
  return act!;
};
const thralls = (s: CombatState) => s.sides.a.units.filter((u) => u.kind === 'ally');

describe('Fated Hand (Foregone Conclusion): a test card now, the engine piece stays (it went with the Regent copy, DECISIONS #417)', () => {
  const tdb = {
    ...db,
    cards: {
      ...db.cards,
      'fated-hand': {
        id: 'fated-hand',
        name: 'Fated Hand',
        kind: 'skill' as const,
        cost: 1,
        target: 'none' as const,
        upgrade: 'fated-hand+',
        effects: [
          { op: 'topdeck' as const, amount: 2, from: 'draw' as const },
          { op: 'drawNext' as const, amount: 2 },
        ],
      },
      'fated-hand+': {
        id: 'fated-hand+',
        name: 'Fated Hand+',
        kind: 'skill' as const,
        cost: 1,
        target: 'none' as const,
        effects: [
          { op: 'topdeck' as const, amount: 3, from: 'draw' as const },
          { op: 'drawNext' as const, amount: 3 },
        ],
      },
    },
  };
  const playFated = (s: CombatState) =>
    applyAction(tdb, s, {
      type: 'play',
      card: s.sides.a.hand.find((c) => c.card === 'fated-hand')!.id,
    });
  const draw = ['strike', 'defend', 'strike', 'defend', 'strike', 'defend', 'strike', 'defend'];

  it('chooses 2 cards anywhere in the draw pile, puts them on top, and they are in next turn’s hand with 2 extra', () => {
    let s = playFated(fight('spellblade', ['fated-hand'], draw)).state;
    expect(s.pending?.kind).toBe('topdeck');
    expect(s.pending?.from).toBe('draw');
    expect(s.pending?.pool).toHaveLength(draw.length);
    expect(s.pending?.min).toBe(2);
    // the two deepest cards
    s = applyAction(tdb, s, { type: 'pick', cards: ['D6', 'D7'] }).state;
    expect(s.pending).toBeNull();
    expect(
      s.sides.a.draw
        .slice(0, 2)
        .map((c) => c.id)
        .sort(),
    ).toEqual(['D6', 'D7']);
    expect(s.sides.a.draw).toHaveLength(draw.length);
    expect(s.sides.a.nextDraw).toBe(2);
    // the enemy's turn, then ours: both chosen cards are in the hand
    s = applyAction(tdb, s, { type: 'endTurn' }).state;
    for (let i = 0; i < 10 && s.active !== 'a'; i++)
      s = applyAction(tdb, s, chooseAction(tdb, s)).state;
    const ids = s.sides.a.hand.map((c) => c.id);
    expect(ids).toContain('D6');
    expect(ids).toContain('D7');
  });

  it('the choice is shown sorted, not in draw order', () => {
    const s = playFated(fight('spellblade', ['fated-hand'], draw)).state;
    const cards = (s.pending?.pool ?? []).map(
      (id) => s.sides.a.draw.find((c) => c.id === id)!.card,
    );
    expect(cards).toEqual([...cards].sort());
    // the player's view resolves the choice from the draw pile (the pick dialog shows these)
    const v = viewFor(tdb, s, 'a').pending;
    expect(v?.from).toBe('draw');
    expect(v?.pool.map((c) => c.id)).toEqual(s.pending?.pool);
  });

  it('asks nothing when the draw pile has 2 cards or fewer; the upgrade chooses 3 and draws 3', () => {
    const s = playFated(fight('spellblade', ['fated-hand'], ['strike', 'defend'])).state;
    expect(s.pending).toBeNull();
    expect(s.sides.a.nextDraw).toBe(2);
    expect(cardText(tdb, tdb.cards['fated-hand'])).toBe(
      'Choose 2 cards in your draw pile and put them on top. Next turn, draw 2 extra cards.',
    );
    expect(cardText(tdb, tdb.cards['fated-hand+'])).toContain('Choose 3 cards');
  });
});

describe('Army of the Drowned (Legion of Bone)', () => {
  it('raises two Thralls of 6 HP, and is Consumed', () => {
    const before = fight('necromancer', ['army-of-the-drowned']);
    const n = thralls(before).length;
    const s = applyAction(db, before, playAct(before, 'army-of-the-drowned')).state;
    const after = thralls(s);
    expect(after).toHaveLength(Math.min(3, n + 2));
    expect(after.slice(n).every((u) => u.maxHp === 6)).toBe(true);
    expect(s.sides.a.exhausted.map((c) => c.card)).toContain('army-of-the-drowned');
    expect(cardText(db, db.cards['army-of-the-drowned']!)).toBe('Raise 6 twice. Consume.');
  });
});

describe('Marked for Death (The Hunt)', () => {
  it('a killing blow earns an extra card reward; one that does not kill earns nothing', () => {
    const miss = fight('assassin', ['marked-for-death']);
    const s1 = applyAction(db, miss, playAct(miss, 'marked-for-death')).state;
    expect(s1.sides.a.extraRewards ?? 0).toBe(0);
    expect(s1.sides.b.units[0]!.hp).toBe(290);

    const kill = fight('assassin', ['marked-for-death']);
    kill.sides.b.units[0]!.hp = 8;
    const s2 = applyAction(db, kill, playAct(kill, 'marked-for-death')).state;
    expect(s2.sides.a.extraRewards).toBe(1);
    // (that blow won the fight: what outlasts a fight is still paid)
    expect(s2.winner).toBe('a');
    expect(cardText(db, db.cards['marked-for-death']!)).toContain(
      'Gain an extra card reward after this fight.',
    );
  });

  it('a blow that wins the fight still pays what outlasts it (a test card with Feed’s max HP, now Bloodfeast is gone)', () => {
    const tdb = {
      ...db,
      cards: {
        ...db.cards,
        'test-feed': {
          id: 'test-feed',
          name: 'Test Feed',
          kind: 'attack' as const,
          cost: 1,
          target: 'foe' as const,
          effects: [
            {
              op: 'damage' as const,
              amount: 10,
              to: 'target' as const,
              onKill: [{ op: 'maxHp' as const, amount: 3, to: 'self' as const }],
            },
          ],
        },
      },
    };
    const { state } = createCombat(tdb, {
      seed: 'feed-test',
      a: { hero: 'knight', deck: RIFTWALKERS.knight.starter },
      b: { enemies: ['squire'] },
    });
    const s0 = clone(state);
    s0.sides.a.hand = [{ id: 'F', card: 'test-feed' }];
    s0.sides.b.units[0]!.hp = 5;
    const s = applyAction(tdb, s0, {
      type: 'play',
      card: 'F',
      target: s0.sides.b.units[0]!.id,
    }).state;
    expect(s.winner).toBe('a');
    expect(s.sides.a.maxHpGained).toBe(3);
  });
});
