import { describe, expect, it } from 'vitest';
import { skinClass, skinName } from './skins';

describe('skin names (DECISIONS #402)', () => {
  it('reads a name from the file name', () => {
    expect(skinName({ id: 'knight-moonlit-regent', hero: 'knight' })).toBe('Moonlit Regent');
    expect(skinName({ id: 'engineer-aether-forgemaster', hero: 'engineer' })).toBe(
      'Aether Forgemaster',
    );
    expect(skinName({ id: 'engineer-gender-female', hero: 'engineer' })).toBe('Female Engineer');
    expect(skinName({ id: 'hunter-gender-male', hero: 'hunter' })).toBe('Male Hunter');
  });

  it('names the class as players see it', () => {
    expect(skinClass('spellblade')).toBe('Spellblade');
    expect(skinClass('nobody')).toBe('nobody');
  });
});
