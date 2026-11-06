import { expect, it } from 'vitest';
import { fightTitle, type FightReplay } from './recap';
it('shows Drago on an archived final-boss title without rewriting the recording', () => {
  const replay: FightReplay = {
    setup: {
      seed: 'old-name',
      a: { hero: 'knight', deck: [] },
      b: { enemies: ['rift-ward', 'vorthax'] },
    },
    moves: [],
    title: 'Valerion, Heart of the Rift · Tier 12',
    me: 'a',
  };
  expect(fightTitle(replay)).toBe('Drago, Heart of the Rift · Tier 12');
  expect(replay.title).toContain('Valerion');
  expect(replay.setup.b).toEqual({ enemies: ['rift-ward', 'vorthax'] });
});
it('does not rename a player whose name happens to be Valerion', () => {
  const replay: FightReplay = {
    setup: { seed: 'players', a: { hero: 'knight', deck: [] }, b: { hero: 'assassin', deck: [] } },
    moves: [],
    title: 'Valerion versus Rowan',
    names: { a: 'Valerion', b: 'Rowan' },
    me: 'a',
  };
  expect(fightTitle(replay)).toBe(replay.title);
});
