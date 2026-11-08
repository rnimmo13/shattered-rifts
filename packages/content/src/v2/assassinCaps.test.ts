import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  createCombat,
  legalActions,
  previewCardDamage,
  type CombatDb,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as original, RIFTWALKERS } from './index';

const db: CombatDb = {
  ...original,
  cards: {
    ...original.cards,
    'cap-probe': {
      id: 'cap-probe',
      name: 'Probe',
      kind: 'skill',
      rarity: 'common',
      cost: 0,
      target: 'none',
      effects: [],
    },
    // (#692: Shadow Echo answers only cards that cost 1 or more)
    'cap-probe1': {
      id: 'cap-probe1',
      name: 'Paid probe',
      kind: 'skill',
      rarity: 'common',
      cost: 1,
      target: 'none',
      effects: [],
    },
    'cap-trap': {
      id: 'cap-trap',
      name: 'Off-turn replay',
      kind: 'snare',
      rarity: 'common',
      cost: 0,
      target: 'none',
      trigger: { on: 'foeTurn' },
      effects: [{ op: 'playPile', from: 'exhaust', amount: 1, tag: 'knife' }],
    },
  },
};
const hero = (s: CombatState) => s.sides.a.units.find((u) => u.kind === 'hero')!;
function fight(mode: 'pve' | 'pvp' = 'pve'): CombatState {
  const s = createCombat(db, {
    seed: 'knife-caps',
    a: { hero: 'assassin', deck: RIFTWALKERS.assassin.starter },
    b:
      mode === 'pvp'
        ? { hero: 'knight', deck: RIFTWALKERS.knight.starter }
        : { enemies: ['squire', 'squire'] },
  }).state;
  s.sides.a.hand = [];
  s.sides.a.mana = 99;
  for (const side of ['a', 'b'] as const)
    for (const u of s.sides[side].units) {
      u.hp = u.maxHp = 100000;
      u.statuses = {};
      u.barrier = 0;
      u.intent = null;
    }
  return s;
}
function play(s: CombatState, card: string): CombatState {
  const id = `probe-${s.nextId++}`;
  s.sides.a.hand.push({ id, card });
  const action = legalActions(db, s).find((a) => a.type === 'play' && a.card === id);
  expect(action).toBeTruthy();
  return applyAction(db, s, action!).state;
}
describe('Assassin Recall commitment and Shadow Echo cap', () => {
  it.each(['pve', 'pvp'] as const)(
    'Recall base/upgraded replays the entire pile, consumes itself and has an immutable preview in %s',
    (mode) => {
      for (const card of ['recall-the-blades', 'recall-the-blades+'])
        for (const count of [0, 14, 15, 28]) {
          const s = fight(mode);
          s.sides.a.hand = [{ id: 'recall', card }];
          s.sides.a.exhausted = Array.from({ length: count }, (_, i) => ({
            id: `knife-${i}`,
            card: 'sleeve-knife',
          }));
          s.sides.a.exhausted.splice(1, 0, { id: 'other', card: 'strike' });
          const before = JSON.stringify(s);
          const shown = previewCardDamage(db, s, 'recall', s.sides.b.units[0]!.id).get(0)!;
          expect(JSON.stringify(s)).toBe(before);
          const result = applyAction(db, s, {
            type: 'play',
            card: 'recall',
            target: s.sides.b.units[0]!.id,
          });
          const played = result.events.filter(
            (e) => e.type === 'play' && e.card.startsWith('knife-'),
          );
          expect(played).toHaveLength(count);
          const actual = 100000 - result.state.sides.b.units[0]!.hp;
          expect(shown.lo).toBe(actual);
          expect(shown.played).toBe(count);
          expect(actual).toBe(count * (card.includes('+') ? 6 : 4));
          expect(result.state.sides.a.mana).toBe(96);
          expect(
            result.state.sides.a.exhausted.some((c) => c.id === 'recall' && c.card === card),
          ).toBe(true);
          expect(result.state.sides.a.discard.some((c) => c.id === 'recall')).toBe(false);
          expect(
            result.state.sides.a.exhausted.filter((c) => c.id.startsWith('knife-')),
          ).toHaveLength(count);
          expect(result.state.sides.a.exhausted.find((c) => c.id === 'knife-15')?.card).toBe(
            count > 15 ? (card.includes('+') ? 'sleeve-knife+' : 'sleeve-knife') : undefined,
          );
          expect(result.state.sides.a.exhausted.find((c) => c.id === 'other')?.card).toBe('strike');
        }
    },
  );
  it.each(['recall-the-blades', 'recall-the-blades+'])(
    '%s requires 3 Mana and another copy can recall the retained Daggers',
    (card) => {
      let s = fight();
      s.sides.a.hand = [{ id: 'pay', card }];
      s.sides.a.mana = 2;
      expect(legalActions(db, s).some((a) => a.type === 'play' && a.card === 'pay')).toBe(false);
      s.sides.a.mana = 3;
      s.sides.a.exhausted = [{ id: 'retained', card: 'sleeve-knife' }];
      s = applyAction(db, s, { type: 'play', card: 'pay', target: s.sides.b.units[0]!.id }).state;
      expect(s.sides.a.mana).toBe(0);
      expect(s.sides.a.exhausted.find((c) => c.id === 'pay')?.card).toBe(card);
      s.sides.a.mana = 3;
      const result = play(s, card);
      expect(100000 - result.sides.b.units[0]!.hp).toBe(2 * (card.endsWith('+') ? 6 : 4));
      expect(result.sides.a.exhausted.filter((c) => c.card === card)).toHaveLength(2);
    },
  );
  it.each(['shadow-echo', 'shadow-echo+'])(
    '%s caps each copy independently and keeps the cap across JSON restore and Barrier loss',
    (card) => {
      let s = play(play(fight(), card), card);
      for (let i = 0; i < 25; i++) s = play(s, 'cap-probe1');
      expect(hero(s).barrier).toBe(30);
      s = JSON.parse(JSON.stringify(s)) as CombatState;
      hero(s).barrier = 0;
      s = play(s, 'cap-probe1');
      expect(hero(s).barrier).toBe(0);
      s = applyAction(db, s, { type: 'endTurn' }).state;
      s = play(s, 'cap-probe1');
      // (2 Barrier from each copy, #692)
      expect(hero(s).barrier).toBe(4);
    },
  );
  it.each([false, true])(
    'Shadow Echo caps actual modified Barrier, including a partial last grant (Brittle: %s)',
    (brittle) => {
      let s = fight();
      s.sides.a.boons = ['warded-heart'];
      hero(s).statuses.bracing = 4;
      if (brittle) hero(s).statuses.brittle = 1;
      s = play(s, 'shadow-echo');
      for (let i = 0; i < 7; i++) s = play(s, 'cap-probe1');
      expect(hero(s).barrier).toBe(15);
      expect(s.sides.a.powers[0]?.barrierUsed).toBe(15);
      s = play(s, 'defend');
      // The capped Aura does not cap Barrier from the played card itself.
      expect(hero(s).barrier).toBeGreaterThan(15);
    },
  );
  it('free cards give nothing and do not spend the Barrier budget (#692)', () => {
    let s = fight();
    // (Shadow Echo costs 1, so it answers its own play: 2)
    s = play(s, 'shadow-echo');
    for (let i = 0; i < 20; i++) s = play(s, 'cap-probe');
    expect(hero(s).barrier).toBe(2);
    for (let i = 0; i < 20; i++) s = play(s, 'cap-probe1');
    expect(hero(s).barrier).toBe(15);
  });
  it('automatic Recall plays are free Daggers: no Echo Barrier, and the preview leaves the state alone (#692)', () => {
    let s = play(play(fight(), 'shadow-echo'), 'shadow-echo+');
    s.sides.a.exhausted = Array.from({ length: 28 }, (_, i) => ({
      id: `auto-${i}`,
      card: 'sleeve-knife',
    }));
    s.sides.a.hand = [{ id: 'recall', card: 'recall-the-blades+' }];
    const before = JSON.stringify(s);
    previewCardDamage(db, s, 'recall', s.sides.b.units[0]!.id);
    expect(JSON.stringify(s)).toBe(before);
    s = applyAction(db, s, { type: 'play', card: 'recall', target: s.sides.b.units[0]!.id }).state;
    // (the two Echoes' own plays, 2 + 4, and Recall itself, 3 Mana, 2 from each copy: 10; nothing from the 28 Daggers)
    expect(hero(s).barrier).toBe(10);
    expect(s.sides.a.attacksPlayed).toBe(28);
  });
  it('a fresh turn allowance also applies to automatic off-turn plays', () => {
    let s = play(fight('pvp'), 'shadow-echo');
    for (let i = 0; i < 20; i++) s = play(s, 'cap-probe1');
    expect(hero(s).barrier).toBe(15);
    s.sides.a.snares.push({ id: 'off-turn-trap', card: 'cap-trap' });
    s.sides.a.exhausted = [{ id: 'off-turn-knife', card: 'sleeve-knife' }];
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.active).toBe('b');
    // (a Dagger played off-turn is free, so it gives nothing since #692)
    expect(hero(s).barrier).toBe(15);
  });
  it('Fanned Recall replays the full pile against every enemy', () => {
    const s = fight();
    hero(s).statuses.fanned = 1;
    s.sides.a.hand = [{ id: 'recall', card: 'recall-the-blades+' }];
    s.sides.a.exhausted = Array.from({ length: 28 }, (_, i) => ({
      id: `fan-${i}`,
      card: 'sleeve-knife',
    }));
    const action = legalActions(db, s).find((a) => a.type === 'play' && a.card === 'recall');
    expect(
      legalActions(db, s).filter((a) => a.type === 'play' && a.card === 'recall'),
    ).toHaveLength(1);
    const result = applyAction(db, s, action!);
    expect(
      result.events.filter((e) => e.type === 'play' && e.card.startsWith('fan-')),
    ).toHaveLength(28);
    expect(result.state.sides.b.units.map((u) => 100000 - u.hp)).toEqual([168, 168]);
  });
  it('card text states unlimited Recall, Consume and the unchanged Echo limit', () => {
    expect(cardText(db, db.cards['recall-the-blades']!)).toContain('Play every Dagger');
    expect(cardText(db, db.cards['recall-the-blades']!)).toContain('Consume.');
    expect(cardText(db, db.cards['recall-the-blades+']!)).toContain(
      'Upgrade and play every Dagger',
    );
    expect(cardText(db, db.cards['shadow-echo']!)).toContain(
      '15 Barrier per copy each turn, after modifiers',
    );
    expect(cardText(db, db.cards['shadow-echo+']!)).toContain('Opening hand.');
  });
});
