import { describe, expect, it } from 'vitest';
import type { CharacterId } from '@sr/content';
import { chooseBotAction } from './bot';
import { DuelSession, HUMAN } from './session';
import { KEYWORD_HELP } from './keywordHelp';

/** Plays one whole duel with the scripted bot as the human. */
async function duel(seed: string, character: CharacterId, enemyId: string, maxSteps = 900) {
  let error: unknown = null;
  const session = new DuelSession(
    { seed, character, enemyId },
    {
      onBatch: () => Promise.resolve(),
      onIdle: () => undefined,
      onError: (e) => {
        error = e;
      },
    },
  );
  await session.start();
  let steps = 0;
  while (!session.over && steps++ < maxSteps && !error) {
    const legal = session.legal();
    if (legal.length === 0) break;
    await session.submit(chooseBotAction(legal, session.view()));
  }
  return { session, error, steps };
}

describe('a duel runs end to end', () => {
  for (const [seed, character, enemyId] of [
    ['e2e-1', 'maren', 'aur-squire-recruit'],
    ['e2e-2', 'rivet', 'aur-bell-cleric'],
    ['e2e-3', 'kesh', 'aur-squire-recruit'],
    ['e2e-4', 'vesper', 'aur-bell-cleric'],
  ] as const) {
    it(`${character} vs ${enemyId} (${seed}) reaches Victory or Defeat`, async () => {
      const { session, error, steps } = await duel(seed, character, enemyId);
      expect(error).toBeNull();
      expect(steps).toBeLessThan(900);
      expect(session.over).toBe(true);
      const v = session.view();
      expect(v.winner === HUMAN || v.winner === 1 || v.winner === 'draw').toBe(true);
    }, 180_000);
  }

  it('never leaves the human with nothing to do while the game is still going', async () => {
    const { session } = await duel('e2e-5', 'maren', 'aur-squire-recruit', 60);
    if (!session.over) expect(session.legal().length).toBeGreaterThan(0);
  }, 120_000);
});

describe('keyword help', () => {
  it('explains every keyword', () => {
    for (const k of Object.keys(KEYWORD_HELP)) {
      expect(KEYWORD_HELP[k as keyof typeof KEYWORD_HELP].text.length).toBeGreaterThan(10);
    }
  });
});
