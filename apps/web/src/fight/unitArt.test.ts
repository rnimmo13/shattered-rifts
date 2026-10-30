import { describe, expect, it } from 'vitest';
import { COMBAT_DB } from '@sr/content/v2';
import { figureId, unitHeight } from './art';

describe('a Thrall grown big stands as the Grave Colossus (DECISIONS #445)', () => {
  it('small Thralls are the skeleton, 18 HP and up the Colossus (its upgrade too)', () => {
    expect(figureId('bone-thrall', 5)).toBe('bone-thrall');
    expect(figureId('bone-thrall', 17)).toBe('bone-thrall');
    expect(figureId('bone-thrall', 20)).toBe('grave-colossus');
    expect(figureId('bone-thrall+', 25)).toBe('grave-colossus');
    expect(figureId('bone-thrall')).toBe('bone-thrall');
  });
  it('other units keep their own figure at any size', () => {
    expect(figureId('hound', 40)).toBe('hound');
  });
  it('a grown Thrall stands taller, by its HP now, not its def', () => {
    const d = COMBAT_DB.units['bone-thrall'];
    expect(unitHeight(d, 'ally', 5)).toBe(280);
    expect(unitHeight(d, 'ally', 20)).toBe(340);
    expect(unitHeight(d, 'ally', 32)).toBe(400);
  });
});
