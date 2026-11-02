import { expect, it } from 'vitest';
import { GHOST_ARENA_HP_MULT } from '@sr/campaign';
import { ARENA_HP_MULT } from './protocol';

it("a deep ghost Warden starts from the Arena's HP (DECISIONS #527)", () => {
  expect(GHOST_ARENA_HP_MULT).toBe(ARENA_HP_MULT);
});
