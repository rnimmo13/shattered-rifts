// A campaign ghost is only ever another player's deck (DECISIONS #460).

import { describe, expect, it } from 'vitest';
import { isOwnGhost } from './boardApi';

describe('a ghost of your own', () => {
  it('is recognised by your name, whatever the case and the spaces', () => {
    expect(isOwnGhost({ name: 'Robert', hero: 'knight' }, 'robert')).toBe(true);
    expect(isOwnGhost({ name: '  ROBERT ' }, 'Robert')).toBe(true);
  });
  it('is not another player\'s, nor anyone\'s when you have no name', () => {
    expect(isOwnGhost({ name: 'Ann' }, 'Robert')).toBe(false);
    expect(isOwnGhost({ name: 'Ann' }, '')).toBe(false);
    expect(isOwnGhost(null, 'Robert')).toBe(false);
    expect(isOwnGhost('Robert', 'Robert')).toBe(false);
  });
});
