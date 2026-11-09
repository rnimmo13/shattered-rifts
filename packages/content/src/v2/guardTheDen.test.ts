// Guard the Den (DECISIONS #699): the Hunter's fourth basic, in one Strike's place. Barrier, and a Pup when she has no companion.
import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(card: string, keepHound: boolean): CombatState {
  const { state } = createCombat(db, {
    seed: 'guard-the-den',
    a: { hero: 'hunter', deck: [...RIFTWALKERS.hunter.starter] },
    b: { enemies: ['squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = [{ id: 'T0', card }];
  s.sides.a.mana = 3;
  if (!keepHound) s.sides.a.units = s.sides.a.units.filter((u) => u.kind !== 'ally');
  return s;
}
const play = (s: CombatState): CombatState => {
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === 'T0');
  expect(act).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const hero = (s: CombatState) => s.sides.a.units.find((u) => u.kind === 'hero')!;
const allies = (s: CombatState) => s.sides.a.units.filter((u) => u.kind === 'ally');

describe('Guard the Den', () => {
  it('is in the Hunter’s starting deck in one Strike’s place', () => {
    const deck = RIFTWALKERS.hunter.starter;
    expect(deck).toHaveLength(10);
    expect(deck.filter((c) => c === 'strike')).toHaveLength(3);
    expect(deck).toContain('guard-the-den');
    expect(db.cards['guard-the-den']!.rarity).toBe('basic');
  });

  it('with the Hound standing it is 5 Barrier and no Pup', () => {
    const s = play(fight('guard-the-den', true));
    expect(hero(s).barrier).toBe(5);
    expect(allies(s).map((u) => u.def)).toEqual(['hound']);
  });

  it('with no companion it calls a Pup', () => {
    const s = play(fight('guard-the-den', false));
    expect(hero(s).barrier).toBe(5);
    expect(allies(s).map((u) => u.def)).toEqual(['pup']);
  });

  it('upgraded: 7 Barrier and a Pup+', () => {
    const s = play(fight('guard-the-den+', false));
    expect(hero(s).barrier).toBe(7);
    expect(allies(s).map((u) => u.def)).toEqual(['pup+']);
  });

  it('says what it does', () => {
    const text = cardText(db, db.cards['guard-the-den']!);
    expect(text).toMatch(/5 Barrier/);
    expect(text).toMatch(/If you have no companion/i);
    expect(text).toMatch(/Pup/);
  });
});
