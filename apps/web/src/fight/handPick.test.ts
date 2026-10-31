import { describe, expect, it } from 'vitest';
import type { PendingView } from '@sr/combat';
import { COMBAT_DB as db } from '@sr/content/v2';
import { isHandPick, pickStep, premeditateIn } from './handPick';

const card = (id: string) => ({ id, card: 'strike' });
const pending = (over: Partial<PendingView>): PendingView => ({
  kind: 'discard',
  pool: [card('a'), card('b')],
  min: 1,
  max: 1,
  ...over,
});

describe('picking from the hand', () => {
  it('a discard or Defer among cards in hand is made on the hand', () => {
    expect(isHandPick(pending({}), ['a', 'b', 'c'])).toBe(true);
    expect(isHandPick(pending({ kind: 'defer' }), ['a', 'b'])).toBe(true);
  });
  it('anything else keeps the window', () => {
    expect(isHandPick(pending({ kind: 'scry' }), ['a', 'b'])).toBe(false);
    expect(isHandPick(pending({ kind: 'topdeck', from: 'draw' }), ['a', 'b'])).toBe(false);
    expect(isHandPick(pending({ spirits: [] }), ['a', 'b'])).toBe(false);
    // (a card the hand is not showing cannot be clicked there)
    expect(isHandPick(pending({}), ['a'])).toBe(false);
    expect(isHandPick(pending({ pool: [] }), [])).toBe(false);
  });
  it('a discard picks out the cards with Premeditate, printed or given in the fight', () => {
    const printed = Object.values(db.cards).find((c) => c.sly)!;
    const pool = [
      { id: 'p', card: printed.id },
      { id: 'g', card: 'strike', sly: 'turn' as const },
      { id: 'n', card: 'strike' },
    ];
    expect(premeditateIn(pending({ pool }), db)).toEqual(['p', 'g']);
    expect(premeditateIn(pending({ kind: 'defer', pool }), db)).toEqual([]);
  });
  it('one click is the whole choice of one card', () => {
    expect(pickStep([], 'a', { pool: ['a', 'b'], max: 1 })).toEqual({ chosen: ['a'], submit: true });
  });
  it('a bigger choice is sent with its last card, and a marked card can be unmarked', () => {
    const p = { pool: ['a', 'b', 'c'], max: 2 };
    expect(pickStep([], 'a', p)).toEqual({ chosen: ['a'], submit: false });
    expect(pickStep(['a'], 'a', p)).toEqual({ chosen: [], submit: false });
    expect(pickStep(['a'], 'b', p)).toEqual({ chosen: ['a', 'b'], submit: true });
  });
  it('a card outside the choice does nothing', () => {
    expect(pickStep(['a'], 'z', { pool: ['a', 'b'], max: 2 })).toEqual({ chosen: ['a'], submit: false });
  });
});
