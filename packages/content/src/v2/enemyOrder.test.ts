// A main enemy with minions starts at the back, behind them (rules 91).

import { describe, expect, it } from 'vitest';
import { createCombat } from '@sr/combat';
import { COMBAT_DB as db, ENCOUNTERS, RIFTWALKERS } from './index';

const start = (enemies: string[]) =>
  createCombat(db, {
    seed: 'enemy-order',
    a: { hero: 'knight', deck: RIFTWALKERS.knight.starter },
    b: { enemies },
  }).state.sides.b.units.map((u) => u.def);

describe('a main enemy stands behind its minions', () => {
  it('an Elite listed in front moves to the back', () => {
    expect(start(['templar-aldric', 'squire'])).toEqual(['squire', 'templar-aldric']);
    expect(start(['packmother-ruhn', 'raptor'])).toEqual(['raptor', 'packmother-ruhn']);
  });

  it('the others keep their order, and an enemy already at the back stays', () => {
    expect(start(['squire', 'templar-aldric'])).toEqual(['squire', 'templar-aldric']);
    expect(start(['templar-aldric', 'squire', 'raptor'])).toEqual([
      'squire',
      'raptor',
      'templar-aldric',
    ]);
  });

  it('enemies of similar strength keep the order they were listed in', () => {
    // (49 and 42 Max HP: no main enemy)
    expect(start(['bellows-pilgrim', 'banner-leech'])).toEqual(['bellows-pilgrim', 'banner-leech']);
    expect(start(['templar-aldric'])).toEqual(['templar-aldric']);
  });

  it('an Omen aimed at a listed enemy still reaches it after the move', () => {
    const state = createCombat(db, {
      seed: 'enemy-order',
      a: { hero: 'knight', deck: RIFTWALKERS.knight.starter },
      b: { enemies: ['templar-aldric', 'squire'], mods: [{ units: [0], statuses: { might: 3 } }] },
    }).state;
    const templar = state.sides.b.units.find((u) => u.def === 'templar-aldric')!;
    const squire = state.sides.b.units.find((u) => u.def === 'squire')!;
    expect(templar.statuses.might).toBeGreaterThanOrEqual(3);
    expect(squire.statuses.might ?? 0).toBeLessThan(templar.statuses.might!);
  });

  it('every encounter with a main enemy starts with it at the back', () => {
    for (const e of ENCOUNTERS.filter((x) => x.units.length > 1)) {
      const hp = e.units.map((u) => db.units[u]!.maxHp);
      const top = Math.max(...hp);
      const i = hp.indexOf(top);
      if (!hp.every((h, j) => j === i || top >= h * 1.5)) continue;
      expect(start(e.units).at(-1), e.id).toBe(e.units[i]);
    }
  });
});
