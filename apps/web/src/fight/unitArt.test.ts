import { describe, expect, it } from 'vitest';
import { COMBAT_DB } from '@sr/content/v2';
import { figureId, isWardenFigure, unitHeight } from './art';

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
    for (const hp of [8, 17, 18, 29, 30, 100])
      expect(unitHeight(COMBAT_DB.units.drone, 'ally', hp)).toBe(
        unitHeight(COMBAT_DB.units.drone, 'ally', 8),
      );
  });
  it('Drago always has a towering boss height, independent of current health or a summoned court', () => {
    expect(figureId('vorthax', 1)).toBe('vorthax');
    expect(unitHeight(COMBAT_DB.units.vorthax, 'enemy', 1)).toBe(720);
    expect(unitHeight(COMBAT_DB.units.vorthax, 'enemy', 1590)).toBe(720);
    expect(isWardenFigure('vorthax')).toBe(true);
    expect(isWardenFigure('morvane-incarnation')).toBe(false);
  });
  it('a grown Thrall stands taller, by its HP now, not its def', () => {
    const d = COMBAT_DB.units['bone-thrall'];
    expect(unitHeight(d, 'ally', 5)).toBe(280);
    expect(unitHeight(d, 'ally', 20)).toBe(340);
    expect(unitHeight(d, 'ally', 32)).toBe(400);
  });
});
