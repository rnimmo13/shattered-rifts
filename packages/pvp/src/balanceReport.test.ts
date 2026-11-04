import { describe, expect, it } from 'vitest';
import {
  campaignBand,
  isBalanceSample,
  mergeBalanceExports,
  type BalanceSample,
} from './balanceReport';
const sample: BalanceSample = {
  id: 'arena:fixture:a',
  at: 1,
  version: '0.195.0',
  rules: 79,
  mode: 'arena',
  kind: 'fight',
  source: 'human',
  seat: 'a',
  outcome: 'win',
  player: {
    hero: 'engineer',
    ascendancy: 'engineer:golemancer',
    deckSize: 15,
    upgraded: 4,
    rares: 2,
  },
};
describe('real playtest exports', () => {
  it('deduplicates repeat exports and retains separate seat observations', () => {
    expect(
      mergeBalanceExports([
        { schema: 1, samples: [sample] },
        {
          schema: 1,
          samples: [
            { ...sample, at: 2 },
            { ...sample, id: 'arena:fixture:b', seat: 'b', outcome: 'loss' },
          ],
        },
      ]),
    ).toHaveLength(2);
  });
  it('rejects conflicting results and invalid quality/versions', () => {
    expect(() =>
      mergeBalanceExports([{ schema: 1, samples: [sample, { ...sample, outcome: 'loss' }] }]),
    ).toThrow('Conflicting');
    expect(isBalanceSample({ ...sample, rules: -1 })).toBe(false);
    expect(isBalanceSample({ ...sample, player: { ...sample.player, upgraded: 16 } })).toBe(false);
    expect(() => mergeBalanceExports([{ samples: [] }])).toThrow();
  });
  it('keeps ghost/source, versions, unascended and censored runs intact', () => {
    const other = {
      ...sample,
      id: 'other',
      version: '0.194.0',
      rules: 78,
      source: 'ghost',
      kind: 'runEnd',
      outcome: 'abandoned',
      player: { ...sample.player, ascendancy: null },
    };
    const list = mergeBalanceExports([{ schema: 1, samples: [sample, other] }]);
    expect(list).toContainEqual(other);
    expect([1, 3, 4, 10, 11, 16, 17, 20].map(campaignBand)).toEqual([
      'I–III',
      'I–III',
      'IV–X',
      'IV–X',
      'XI–XVI',
      'XI–XVI',
      'XVII–XX',
      'XVII–XX',
    ]);
  });
});
