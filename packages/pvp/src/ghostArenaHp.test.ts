import { expect, it } from 'vitest';
import { ghostBossHp } from '@sr/campaign';
import { ARENA_START_HP } from './protocol';

it('campaign ghosts have a separate curve, without changing the Arena HP multiplier', () => {
  expect(ARENA_START_HP).toBe(1000);
  expect(ghostBossHp('knight', 20, 1, 10000)).toBe(472);
  expect(ghostBossHp('knight', 20, 1, 10000)).toBeLessThan(ARENA_START_HP);
});
