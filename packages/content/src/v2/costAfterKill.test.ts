// A card that hits every enemy and then costs the player HP still costs the HP when the hit ends the fight (Robert, 2026-10-30).

import { describe, expect, it } from 'vitest';
import { applyAction, clone, createCombat, legalActions } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

describe('costs paid after the killing blow', () => {
  it('still takes the HP when the last enemy dies first', () => {
    const deck = RIFTWALKERS.knight.starter;
    const { state } = createCombat(db, {
      seed: 'cost-after-kill',
      a: { hero: 'knight', deck: [...deck, ...deck] },
      b: { enemies: ['squire'] },
    });
    const s = clone(state);
    const card = {
      id: 'test-recoil',
      name: 'Recoil',
      kind: 'attack',
      rarity: 'common',
      cost: 0,
      target: 'none',
      effects: [
        { op: 'damage', amount: 999, to: 'allFoes' },
        { op: 'loseHp', amount: 5, to: 'self' },
      ],
    };
    const d = { ...db, cards: { ...db.cards, 'test-recoil': card } } as unknown as typeof db;
    s.sides.a.hand = [{ id: 'R', card: 'test-recoil' }];
    s.sides.a.mana = 3;
    const hero = () => s.sides.a.units.find((u) => u.kind === 'hero')!;
    const before = hero().hp;
    const act = legalActions(d, s).find((x) => x.type === 'play' && x.card === 'R');
    expect(act).toBeTruthy();
    const r = applyAction(d, s, act!);
    expect(r.state.winner).toBe('a');
    expect(r.state.sides.a.units.find((u) => u.kind === 'hero')!.hp).toBe(before - 5);
  });
});
