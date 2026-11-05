import { expect, it } from 'vitest';
import { campaignDeckFacts } from './campaignBalance';
it('extracts exact deck/progression facts without raw saves, seeds, maps or account fields', () => {
  const run = {
    v: 2,
    character: 'knight',
    seed: 'private-seed',
    deck: ['strike', 'strike+'],
    boons: [],
    tier: 1,
    difficulty: 'normal',
    phase: 'map',
    hp: 80,
    maxHp: 80,
  };
  const facts = campaignDeckFacts({
    ...run,
    email: 'private@example.test',
    token: 'private-token',
  });
  expect(facts?.cards).toEqual([...run.deck].sort());
  expect(facts?.boons).toEqual([...run.boons].sort());
  expect(facts?.tier).toBe(1);
  for (const text of [
    'private-seed',
    'private@example.test',
    'private-token',
    'rng',
    'stageRealms',
  ])
    expect(JSON.stringify(facts)).not.toContain(text);
  expect(campaignDeckFacts({ ...run, deck: ['does-not-exist'] })).toBeNull();
  expect(campaignDeckFacts({ ...run, tier: 21 })).toBeNull();
});
