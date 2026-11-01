// Warden's Hearts in a real fight (DECISIONS #516).

import { describe, expect, it } from 'vitest';
import { createCombat, type CombatState, type Unit } from '@sr/combat';
import { COMBAT_DB as db, HEARTS } from './index';

const start = (heart: string): CombatState =>
  createCombat(db, {
    seed: 'heart-' + heart,
    a: {
      hero: 'knight',
      deck: ['strike', 'strike', 'strike', 'strike', 'strike', 'strike'],
      boons: [heart],
    },
    b: { enemies: ['squire', 'squire'] },
  }).state;
const hero = (s: CombatState): Unit => s.sides.a.units.find((u) => u.kind === 'hero')!;

describe("Warden's Hearts", () => {
  it('none gives Mana', () => {
    for (const h of HEARTS) expect(h.mana ?? 0, h.id).toBe(0);
  });

  it('Ember Heart: a random enemy gains 3 Burn on your turn, and you start with 2', () => {
    const s = start('ember-heart');
    expect(hero(s).statuses.burn).toBe(2);
    expect(s.sides.b.units.reduce((n, foe) => n + (foe.statuses.burn ?? 0), 0)).toBe(3);
  });

  it('Blood Heart: 3 Might at the start, and a mana-less hero', () => {
    const s = start('blood-heart');
    expect(hero(s).statuses.might).toBe(3);
    expect(s.sides.a.mana).toBe(3);
  });

  it('Warded Heart: Shielded and 7 Plating, no Barrier up front', () => {
    const s = start('warded-heart');
    expect(hero(s).statuses.shielded).toBe(1);
    expect(hero(s).statuses.plating).toBe(7);
    expect(hero(s).barrier).toBe(0);
  });
});
