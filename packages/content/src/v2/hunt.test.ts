// The Hunter's hunt (DECISIONS #377): Traps that slow the prey, a mark, and the pack that finishes it.

import { describe, expect, it } from 'vitest';
import { applyAction, clone, createCombat, legalActions, type CombatState } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

/** One Gilded Squire (it slashes on its first turn) at 200 HP, and the Hunter's starting Hound. */
function fight(hand: string[]): CombatState {
  const { state } = createCombat(db, {
    seed: 'hunt-test',
    a: { hero: 'hunter', deck: [...RIFTWALKERS.hunter.starter, ...RIFTWALKERS.hunter.starter] },
    b: { enemies: ['squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 200;
    u.statuses = {};
  }
  return s;
}
const play = (s: CombatState, id: string): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === inst?.id);
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
/** end the turn and let the enemy act; the events of that step too */
const endTurn = (s: CombatState) => applyAction(db, s, { type: 'endTurn' });
const foe = (s: CombatState) => s.sides.b.units[0]!;
const hero = (s: CombatState) => s.sides.a.units.find((u) => u.kind === 'hero')!;
const hound = (s: CombatState) => s.sides.a.units.find((u) => u.kind === 'ally')!;
/** what an enemy turn took off the Squire with these cards played first, beyond what it takes with nothing played */
const extraDamage = (cards: string[]): number => {
  const run = (hand: string[]): number => {
    let s = fight(hand);
    for (const c of hand) s = play(s, c);
    return 200 - foe(endTurn(s).state).hp;
  };
  return run(cards) - run([]);
};

describe('the hunt', () => {
  it('Bear Trap: an attack sets it off for 6 damage and 2 Faltering on the attacker', () => {
    expect(extraDamage(['bear-trap'])).toBe(6);
    const s = endTurn(play(fight(['bear-trap']), 'bear-trap')).state;
    // (2 Faltering, one worn off at the end of its turn)
    expect(foe(s).statuses.faltering).toBe(1);
    expect(s.sides.a.snares).toHaveLength(0);
  });

  it('Snare Line: as the enemy turn begins, 5 Barrier and 1 Faltering on every enemy', () => {
    const s0 = play(fight(['snare-line']), 'snare-line');
    const me = hero(s0).id;
    const them = foe(s0).id;
    const { events } = endTurn(s0);
    expect(events.some((e) => e.type === 'snareSprung' && e.card === 'snare-line')).toBe(true);
    expect(events.some((e) => e.type === 'barrier' && e.target === me && e.amount === 5)).toBe(true);
    const falter = events.filter((e) => e.type === 'status' && e.status === 'faltering');
    expect(falter.length).toBeGreaterThan(0);
    expect(falter.every((e) => e.type === 'status' && e.target === them)).toBe(true);
  });

  it('Deadfall: 18 damage to the attacker', () => {
    expect(extraDamage(['deadfall'])).toBe(18);
  });

  it('Baited Snare: each companion strikes the attacker for 5', () => {
    expect(extraDamage(['baited-snare'])).toBe(5);
  });

  it('Hunting Grounds: a Trap springing gives 1 Might', () => {
    let s = fight(['hunting-grounds', 'bear-trap']);
    s = play(play(s, 'hunting-grounds'), 'bear-trap');
    expect(hero(s).statuses.might ?? 0).toBe(0);
    s = endTurn(s).state;
    expect(hero(s).statuses.might).toBe(1);
  });

  it('Single Out: 1 Exposed on the target, 3 Primed on each companion, and a card', () => {
    const s0 = fight(['single-out']);
    s0.sides.a.draw = [{ id: 'D0', card: 'strike' }];
    const s = play(s0, 'single-out');
    expect(foe(s).statuses.exposed).toBe(1);
    expect(hound(s).statuses.vigor).toBe(3);
    expect(s.sides.a.hand.map((c) => c.id)).toEqual(['D0']);
  });

  it('Run It Down: 7, and the pack joins in on a Faltering target', () => {
    const plain = play(fight(['run-it-down']), 'run-it-down');
    expect(200 - foe(plain).hp).toBe(7);
    const s0 = fight(['run-it-down']);
    foe(s0).statuses.faltering = 1;
    const s = play(s0, 'run-it-down');
    // the Hound's 5, its own strike
    expect(200 - foe(s).hp).toBe(7 + 5);
  });
});
