// Player names (DECISIONS #804): no invisible characters to pass for another name, and no official-sounding names.

import { describe, expect, it } from 'vitest';
import { cleanName, isReservedName } from './deck';

describe('player names', () => {
  it('keep ordinary names as they are', () => {
    expect(cleanName('Kestrel 77')).toBe('Kestrel 77');
    expect(cleanName('Devin')).toBe('Devin');
    expect(cleanName('Modest Mouse')).toBe('Modest Mouse');
  });

  it('lose zero-width characters and text-direction overrides', () => {
    expect(cleanName('Kes​trel')).toBe('Kestrel');
    expect(cleanName('‮Kestrel')).toBe('Kestrel');
    expect(cleanName('Kes﻿trel')).toBe('Kestrel');
  });

  it('may not pass for the team or the game maker', () => {
    for (const n of [
      'Admin',
      'Shattered Rifts Team',
      'Mod: DM me',
      'official',
      'Chief Sharkbait',
      'chief_shark.bait',
      'Dev',
    ])
      expect(cleanName(n), n).toBe('Riftwalker');
    expect(isReservedName('Staff of Ruin')).toBe(true);
    expect(isReservedName('Staffordshire')).toBe(false);
  });
});
