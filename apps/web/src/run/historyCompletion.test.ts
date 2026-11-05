import { expect, it } from 'vitest';
import { completedRecord } from './history';
import { stagesCleared } from '../pvp/vault';
it('recognizes explicit victories and retained winning finale replays, never progress alone', () => {
  expect(completedRecord({ won: true })).toBe(true);
  const lastFight = {
    won: true,
    setup: { seed: 'test', a: { hero: 'knight', deck: [] }, b: { enemies: ['vorthax'] } },
    moves: [],
    title: 'Finale',
    me: 'a' as const,
  };
  expect(completedRecord({ lastFight })).toBe(true);
  expect(completedRecord({ lastFight: { ...lastFight, won: false } })).toBe(false);
  expect(
    completedRecord({
      lastFight: { ...lastFight, setup: { ...lastFight.setup, b: { enemies: ['squire'] } } },
    }),
  ).toBe(false);
  expect(completedRecord({})).toBe(false);
  expect(stagesCleared({ phase: 'banked', won: true })).toBe(3);
  expect(stagesCleared({ phase: 'banked' })).toBe(0);
});
