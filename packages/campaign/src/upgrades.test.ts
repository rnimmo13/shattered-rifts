import { describe, expect, it } from 'vitest';
import { COMBAT_DB } from '@sr/content/v2';
import { upgradedCards } from './upgrades';

const base = Object.values(COMBAT_DB.cards).find((c) => c.upgrade && COMBAT_DB.cards[c.upgrade])!;
const up = base.upgrade as string;
const other = Object.values(COMBAT_DB.cards).find((c) => c.id !== base.id && c.id !== up)!.id;

describe('upgradedCards', () => {
  it('names the card that was swapped for its upgrade', () => {
    expect(upgradedCards([base.id, other], [other, up])).toEqual([[base.id, up]]);
  });
  it('finds each of several upgrades, and only the upgraded copy of a pair', () => {
    expect(upgradedCards([base.id, base.id, other], [up, base.id, other])).toEqual([[base.id, up]]);
    expect(upgradedCards([base.id, base.id], [up, up])).toEqual([
      [base.id, up],
      [base.id, up],
    ]);
  });
  it('says nothing for a card that was bought, removed or left alone', () => {
    expect(upgradedCards([base.id], [base.id, other])).toEqual([]);
    expect(upgradedCards([base.id, other], [base.id])).toEqual([]);
    expect(upgradedCards([base.id], [base.id])).toEqual([]);
  });
  it('does not count a removal plus an unrelated purchase as an upgrade', () => {
    expect(upgradedCards([base.id], [other])).toEqual([]);
  });
});
