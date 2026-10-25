import { describe, expect, it } from 'vitest';
import type { RunState } from '@sr/campaign';
import { RIFTWALKERS } from '@sr/content/v2';
import { MID_RUN_SAVES, SAVE_ANYTIME, loseSavedDecks, savePoint } from './deckSave';
import { loadVault, saveVault } from '../pvp/vault';

const at = (phase: string, stage: number, tier: number): RunState =>
  ({ phase, stage, tier }) as unknown as RunState;

describe('where a deck can be saved', () => {
  it('when a Rift Tier has just been cleared', () => {
    expect(savePoint(at('loopCleared', 3, 1))).toBe('cleared');
    expect(savePoint(at('loopCleared', 3, 4))).toBe('cleared');
  });

  it('on a Rift Tier beyond the first, just before its stage 1', () => {
    expect(savePoint(at('prelude', 1, 2))).toBe(0);
    expect(savePoint(at('prelude', 1, 5))).toBe(0);
  });

  it('between stages only in a test build', () => {
    const expected = MID_RUN_SAVES ? 1 : null;
    expect(savePoint(at('stageClear', 1, 1))).toBe(expected);
    expect(savePoint(at('stageClear', 2, 3))).toBe(MID_RUN_SAVES ? 2 : null);
  });

  it('never at the start of the first tier, at the start of later stages, or in the middle of a stage (unless any time is allowed)', () => {
    const expected = SAVE_ANYTIME ? 'now' : null;
    expect(savePoint(at('prelude', 1, 1))).toBe(expected);
    expect(savePoint(at('prelude', 2, 1))).toBe(expected);
    expect(savePoint(at('prelude', 2, 3))).toBe(expected);
    for (const phase of ['map', 'reward', 'duel', 'shrine', 'merchant', 'event', 'kit'])
      expect(savePoint(at(phase, 1, 2)), phase).toBe(expected);
    expect(savePoint(at('banked', 1, 2))).toBeNull();
    expect(savePoint(at('collapsed', 1, 2))).toBeNull();
  });
});

describe('a run that collapses takes its saved deck with it', () => {
  it('removes every saved copy of that run and nothing else', async () => {
    const store = new Map<string, string>();
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
    const deck = (id: string, tier: number) => ({
      id,
      hero: 'knight',
      tier,
      deck: [...RIFTWALKERS.knight.starter],
      boons: [],
      bankedAt: 1,
    });
    // the run's save (its id is the seed), an older build's per-tier save of the same run, and another run's deck
    saveVault([deck('r~dead-run', 2), deck('dead-run:t1', 1), deck('r~other-run', 1)]);
    expect(await loseSavedDecks({ seed: 'dead-run' })).toBe(1); // (an older build's copy of the same run is already merged into it when the Vault is read)
    expect(loadVault().map((d) => d.id)).toEqual(['r~other-run']);
    // nothing saved: nothing lost
    expect(await loseSavedDecks({ seed: 'dead-run' })).toBe(0);
    expect(loadVault()).toHaveLength(1);
  });
});
