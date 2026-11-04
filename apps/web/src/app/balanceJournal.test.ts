import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createCombat } from '@sr/combat';
import { COMBAT_DB } from '@sr/content/v2';
import { newRun } from '@sr/campaign';
import {
  balanceFighter,
  balanceSamples,
  recordBalance,
  recordCampaignFight,
  recordBalanceAscendancy,
} from './balanceJournal';
beforeEach(() => {
  const data = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => data.set(k, v),
  });
});
afterEach(() => vi.unstubAllGlobals());
it('records actual campaign attempt outcomes once, preserves retries and excludes identifying game data', () => {
  const r = newRun('engineer', 'private-seed');
  recordCampaignFight(r, false, 7);
  recordCampaignFight(r, false, 7);
  r.stats.duelsLost++;
  recordCampaignFight(r, true, 5);
  recordBalanceAscendancy(r, 'engineer:golemancer');
  expect(balanceSamples()).toHaveLength(3);
  expect(balanceSamples().map((s) => s.outcome)).toEqual(['loss', 'win', undefined]);
  expect(JSON.stringify(balanceSamples())).not.toContain('private-seed');
  expect(balanceSamples()[0]!.player.ascendancy).toBeNull();
  expect(balanceSamples()[2]!.player.ascendancy).toBe('engineer:golemancer');
});
it('stores only coarse deck quality and never blocks play when storage fails', () => {
  expect(balanceFighter('engineer', undefined, ['reactor', 'strike+', 'backup-core'])).toEqual({
    hero: 'engineer',
    ascendancy: null,
    deckSize: 3,
    upgraded: 1,
    rares: 2,
  });
  vi.stubGlobal('localStorage', {
    getItem: () => {
      throw Error('blocked');
    },
  });
  expect(() =>
    recordBalance({
      id: 'test',
      mode: 'arena',
      source: 'ghost',
      kind: 'fight',
      player: balanceFighter('knight', undefined, []),
    }),
  ).not.toThrow();
  // A failed reporter does not touch any game state.
  const state = createCombat(COMBAT_DB, {
    seed: 'unchanged',
    a: { hero: 'knight', deck: [] },
    b: { enemies: ['squire'] },
  }).state;
  const before = JSON.stringify(state);
  recordCampaignFight(newRun('knight', 'blocked'), true);
  expect(JSON.stringify(state)).toBe(before);
});
