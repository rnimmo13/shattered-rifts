import { expect, it } from 'vitest';
import {
  createCombat,
  chooseSmartAction,
  applyAction,
  legalActions,
  clone,
  heroOf,
  type CombatDb,
} from '@sr/combat';
import { botPlanningState } from '../../../combat/src/smartBot';
import { COMBAT_DB } from './index';
const setup = () =>
  createCombat(COMBAT_DB, {
    seed: 'pilot-regression',
    a: { hero: 'shaman', deck: [] },
    b: { hero: 'knight', deck: ['strike', 'defend', 'blood-oath'] },
  }).state;
it('does not use hidden opponent identities, draw order or live RNG, and leaves input untouched', () => {
  const a = setup();
  a.sides.a.hand = [
    { id: 'test-spirit', card: 'spirit-pact' },
    { id: 'test-strike', card: 'strike' },
  ];
  a.sides.a.draw = [
    { id: 'd1', card: 'defend' },
    { id: 'd2', card: 'strike' },
  ];
  const b = clone(a);
  b.rng = [1, 2, 3, 4];
  b.seed = 'another-secret';
  b.sides.a.draw.reverse();
  b.sides.b.hand = b.sides.b.hand.map((c) => ({ ...c, card: 'the-drowned-king+' }));
  b.sides.b.draw = b.sides.b.draw.map((c) => ({ ...c, card: 'restless-spirits+' }));
  const before = JSON.stringify(a);
  expect(botPlanningState(COMBAT_DB, a)).toEqual(botPlanningState(COMBAT_DB, b));
  expect(chooseSmartAction(COMBAT_DB, a)).toEqual(chooseSmartAction(COMBAT_DB, b));
  expect(JSON.stringify(a)).toBe(before);
});
it('plans a resource card before a lethal finisher', () => {
  const db: CombatDb = {
    ...COMBAT_DB,
    cards: {
      ...COMBAT_DB.cards,
      fuel: {
        id: 'fuel',
        name: 'Fuel',
        kind: 'skill',
        cost: 0,
        target: 'none',
        effects: [{ op: 'mana', amount: 2 }],
      },
      finish: {
        id: 'finish',
        name: 'Finish',
        kind: 'attack',
        cost: 2,
        target: 'foe',
        effects: [{ op: 'damage', amount: 500, to: 'target' }],
      },
    },
  };
  let s = setup();
  s.sides.a.mana = 0;
  s.sides.a.hand = [
    { id: 'f', card: 'fuel' },
    { id: 'k', card: 'finish' },
  ];
  const first = chooseSmartAction(db, s);
  expect(first).toMatchObject({ type: 'play', card: 'f' });
  s = applyAction(db, s, first).state;
  const next = chooseSmartAction(db, s);
  expect(next).toMatchObject({ type: 'play', card: 'k' });
  expect(applyAction(db, s, next).state.winner).toBe('a');
});
it('recognizes Spirit setup rather than ending with useful resources unspent', () => {
  const s = setup();
  s.sides.a.hand = [{ id: 'spirit', card: 'spirit-pact' }];
  const action = chooseSmartAction(COMBAT_DB, s);
  expect(action).toMatchObject({ type: 'play', card: 'spirit' });
  expect(legalActions(COMBAT_DB, s)).toContainEqual(action);
  expect(heroOf(s.sides.a)!.hp).toBeGreaterThan(0);
});
