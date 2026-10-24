import { describe, expect, it } from 'vitest';
import type { RunState } from '@sr/campaign';
import { savePoint } from './MidRunSave';

const at = (phase: string, stage: number, tier: number): RunState =>
  ({ phase, stage, tier }) as unknown as RunState;

describe('where a deck can be saved (test build)', () => {
  it('just before a new stage beyond stage 1: after stage 1 or 2 is cleared', () => {
    expect(savePoint(at('stageClear', 1, 1))).toBe(1);
    expect(savePoint(at('stageClear', 2, 1))).toBe(2);
    expect(savePoint(at('stageClear', 1, 3))).toBe(1);
  });

  it('just before stage 1 of a Rift Tier beyond the first', () => {
    expect(savePoint(at('prelude', 1, 2))).toBe(0);
    expect(savePoint(at('prelude', 1, 5))).toBe(0);
  });

  it('never at the start of the first tier, at the start of later stages, or in the middle of a stage', () => {
    expect(savePoint(at('prelude', 1, 1))).toBeNull();
    expect(savePoint(at('prelude', 2, 1))).toBeNull();
    expect(savePoint(at('prelude', 2, 3))).toBeNull();
    for (const phase of [
      'map',
      'reward',
      'duel',
      'shrine',
      'merchant',
      'event',
      'kit',
      'loopCleared',
    ])
      expect(savePoint(at(phase, 1, 2)), phase).toBeNull();
  });
});
