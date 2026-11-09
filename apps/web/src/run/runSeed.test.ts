import { describe, expect, it } from 'vitest';
import { newSeedCode, readSeed, showSeed } from './runSeed';

describe('seed codes (DECISIONS #698)', () => {
  it('a fresh code reads back as itself', () => {
    for (let i = 0; i < 50; i++) {
      const code = newSeedCode();
      expect(code).toHaveLength(8);
      expect(readSeed(showSeed(code))).toBe(code);
    }
  });

  it('reads what a player types or pastes', () => {
    expect(readSeed('k7qm-2xrp')).toBe('K7QM2XRP');
    expect(readSeed(' K7QM 2XRP ')).toBe('K7QM2XRP');
    expect(readSeed('Seed K7QM-2XRP')).toBe('K7QM2XRP');
    expect(readSeed('K7QM-2XR')).toBeNull();
    expect(readSeed('K0QM-2XRP')).toBeNull();
  });
});
