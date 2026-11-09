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

it('keeps the run’s deck choices in their known shape, only with real cards (#714)', () => {
  const run = {
    v: 2,
    character: 'knight',
    deck: ['strike'],
    boons: [],
    tier: 2,
    difficulty: 'normal',
    phase: 'map',
    draftLog: [
      { t: 1, k: 'reward', took: 'strike', offered: ['strike', 'defend', 'pound'], secret: 'x' },
      { t: 1, k: 'reward', took: null, offered: ['strike'] },
      { t: 2, k: 'remove', took: 'defend' },
      { t: 2, k: 'reward', took: 'not-a-card' },
      { t: 2, k: 'cheat', took: 'strike' },
    ],
  };
  const facts = campaignDeckFacts(run);
  expect(facts?.drafts).toEqual([
    { t: 1, k: 'reward', took: 'strike', offered: ['strike', 'defend', 'pound'] },
    { t: 1, k: 'reward', took: null, offered: ['strike'] },
    { t: 2, k: 'remove', took: 'defend' },
  ]);
  expect(campaignDeckFacts({ ...run, draftLog: undefined })?.drafts).toEqual([]);
});
