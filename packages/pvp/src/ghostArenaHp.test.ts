import { expect, it } from 'vitest';
import { ghostBossHp } from '@sr/campaign';
import { ARENA_HP_MULT } from './protocol';

it('campaign ghosts have a separate curve, without changing the Arena HP multiplier', () => {
  expect(ARENA_HP_MULT).toBe(6);
  expect(ghostBossHp('knight', 20, 1, 10000)).toBe(472);
  expect(ghostBossHp('knight', 20, 1, 10000)).toBeLessThan(80 * ARENA_HP_MULT);
});
