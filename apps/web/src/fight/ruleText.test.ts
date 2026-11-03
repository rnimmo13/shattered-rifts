import { describe, expect, it } from 'vitest';
import { ENCOUNTERS } from '@sr/content/v2';
import { splitRule } from './ruleText';

describe("a Warden's rule on the fight screen (DECISIONS #562)", () => {
  it('folds to its name, and keeps the rest to open again', () => {
    expect(splitRule('The Veil: every move leaves her Veiled.')).toEqual({
      name: 'The Veil',
      text: 'every move leaves her Veiled.',
    });
    // (no short name before a colon: it is just a Warden rule)
    expect(splitRule('Something with no name at all.').name).toBe('Warden rule');
  });

  it('every Warden rule has a short name for the folded line', () => {
    const rules = Object.values(ENCOUNTERS).flatMap((e) => (e.rule ? [e.rule] : []));
    expect(rules.length).toBeGreaterThan(5);
    for (const r of rules) {
      const { name, text } = splitRule(r);
      expect(name.length, r).toBeLessThanOrEqual(40);
      expect(text.length, r).toBeGreaterThan(0);
    }
  });
});
