// KP's Old Twelve Gauge (a weapon you Sharpen that hits every enemy) and the Mana tools everyone can reach.

import { describe, expect, it } from 'vitest';
import { applyAction, clone, createCombat, legalActions, type CombatState } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, type HeroId } from './index';

function fight(hero: HeroId, hand: string[]): CombatState {
  const { state } = createCombat(db, {
    seed: 'kp-test',
    a: { hero, deck: [...RIFTWALKERS[hero].starter, ...RIFTWALKERS[hero].starter] },
    b: { enemies: ['squire', 'squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) u.hp = u.maxHp = 100;
  return s;
}
const playCard = (s: CombatState, id: string): CombatState => {
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === id);
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};

describe('KP and the Old Twelve Gauge', () => {
  it('starts every fight with the gun in hand', () => {
    const { state } = createCombat(db, {
      seed: 'g',
      a: { hero: 'kp', deck: RIFTWALKERS.kp.starter },
      b: { enemies: ['squire'] },
    });
    const cards = [...state.sides.a.hand, ...state.sides.a.draw].map((c) => c.card);
    expect(cards).toContain('old-twelve-gauge');
  });

  it('cleaves: it hits every enemy, and Sharpen makes it hit harder for the fight', () => {
    let s = fight('kp', ['old-twelve-gauge', 'rack-the-slide']);
    s = playCard(s, 'T0');
    for (const u of s.sides.b.units) expect(u.hp).toBe(95);
    s = playCard(s, 'T1'); // forge +3
    const gun = [...s.sides.a.hand, ...s.sides.a.discard, ...s.sides.a.draw].find(
      (c) => c.card === 'old-twelve-gauge',
    );
    expect(gun?.bonus).toBe(3);
    // it retains, so it is still there to fire again for 5 + 3
    s.sides.a.hand = s.sides.a.hand.filter((c) => c.card !== 'old-twelve-gauge');
    if (gun) s.sides.a.hand.push(gun);
    s = playCard(s, gun!.id);
    for (const u of s.sides.b.units) expect(u.hp).toBe(95 - 8);
  });

  it('playing a shell sharpens the gun with Hair Trigger', () => {
    let s = fight('kp', ['hair-trigger', 'buckshot-shell', 'old-twelve-gauge']);
    s = playCard(s, 'T0');
    s = playCard(s, 'T1');
    const gun = [...s.sides.a.hand, ...s.sides.a.discard].find((c) => c.card === 'old-twelve-gauge');
    expect(gun?.bonus).toBe(1);
  });
});

describe('Mana tools', () => {
  it('Attunement raises maximum Mana for the rest of the fight', () => {
    let s = fight('maren', ['attunement']);
    const before = s.sides.a.maxMana;
    s = playCard(s, 'T0');
    expect(s.sides.a.maxMana).toBe(before + 1);
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.sides.a.mana).toBeGreaterThanOrEqual(before + 1);
  });

  it('Borrowed Time gives Mana now and takes it back next turn (never below 0)', () => {
    let s = fight('maren', ['borrowed-time']);
    s.sides.a.mana = 0;
    s = playCard(s, 'T0');
    expect(s.sides.a.mana).toBe(3);
    expect(s.sides.a.nextMana).toBe(-2);
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.sides.a.mana).toBe(s.sides.a.maxMana - 2);
  });

  it('every Riftwalker can reach some Mana trick', () => {
    const tricks = new Set(['mana', 'manaNext', 'maxMana']);
    for (const h of Object.keys(RIFTWALKERS)) {
      const has = Object.values(db.cards).some(
        (c) =>
          c.hero === h &&
          [...c.effects, ...c.effects.flatMap((o) => (o.op === 'power' ? o.ops : []))].some((o) =>
            tricks.has(o.op),
          ),
      );
      expect(has, h).toBe(true);
    }
  });
});
