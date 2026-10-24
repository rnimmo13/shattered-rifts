import { describe, expect, it } from 'vitest';
import { RIFTWALKERS } from '@sr/content/v2';
import { dateLabel, rarityCounts, reportCards, tierLabel } from './deckLayout';

describe('the deck report', () => {
  it('stacks repeats and puts the rarest cards first', () => {
    const ids = [...RIFTWALKERS.maren.starter, 'strike'];
    const cards = reportCards(ids);
    const strike = cards.find((c) => c.def.id === 'strike');
    expect(strike?.n).toBe(RIFTWALKERS.maren.starter.filter((i) => i === 'strike').length + 1);
    expect(cards.reduce((n, c) => n + c.n, 0)).toBe(ids.length);
    const rank = ['ancestral', 'legendary', 'rare', 'uncommon', 'common', 'basic'];
    const seen = cards.map((c) => rank.indexOf(c.def.rarity ?? 'common'));
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
  });

  it('ignores ids that are not cards, including prototype keys', () => {
    expect(reportCards(['nope', '__proto__', 'constructor'])).toEqual([]);
    expect(rarityCounts(['nope', '__proto__'])).toEqual([]);
  });

  it('counts each rarity once, best first', () => {
    const counts = rarityCounts(RIFTWALKERS.maren.starter);
    expect(counts.reduce((n, c) => n + c.n, 0)).toBe(RIFTWALKERS.maren.starter.length);
  });

  it('dates and tiers read plainly', () => {
    expect(dateLabel(0)).toBe('Date unknown');
    expect(dateLabel(Date.UTC(2026, 9, 24, 12))).toMatch(/2026/);
    expect(tierLabel({ id: 'a:t2', tier: 2 })).toBe('Rift Tier 2');
    expect(tierLabel({ id: 'a:t1:s1', tier: 1 })).toBe('Rift Tier 1, after stage 1');
    expect(tierLabel({ id: 'a:t3:s0', tier: 3 })).toBe('Rift Tier 3, at the start');
  });
});
