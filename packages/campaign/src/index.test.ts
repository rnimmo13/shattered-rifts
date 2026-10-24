import { describe, expect, it } from 'vitest';
import { DECK_RULES } from './index';

describe('@sr/campaign', () => {
  it('has the v2 deck rules', () => {
    expect(DECK_RULES.minSize).toBe(8);
    expect(DECK_RULES.vaultSlots).toBe(10);
  });
});
