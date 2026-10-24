import { describe, expect, it } from 'vitest';
import type { RunState } from '@sr/campaign';
import { MID_RUN_SAVES, savePoint } from './deckSave';

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

  it('never at the start of the first tier, at the start of later stages, or in the middle of a stage', () => {
    expect(savePoint(at('prelude', 1, 1))).toBeNull();
    expect(savePoint(at('prelude', 2, 1))).toBeNull();
    expect(savePoint(at('prelude', 2, 3))).toBeNull();
    for (const phase of ['map', 'reward', 'duel', 'shrine', 'merchant', 'event', 'kit', 'banked'])
      expect(savePoint(at(phase, 1, 2)), phase).toBeNull();
  });
});
