import { describe, expect, it } from 'vitest';
import { DECK_RULES } from './index';

describe('@sr/campaign', () => {
  it('matches the documented deck rules', () => {
    expect(DECK_RULES.minSize).toBe(20);
    expect(DECK_RULES.vaultSlots).toBe(5);
  });
});
