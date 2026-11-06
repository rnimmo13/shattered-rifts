import { describe, expect, it } from 'vitest';
import { applyAction, createCombat, validateDb } from '@sr/combat';
import {
  CAMPAIGN_REALMS,
  COMBAT_DB,
  DRAGON_WARDENS,
  ENCOUNTERS,
  RIFTWALKERS,
  encounter,
} from './index';

describe('new realm rosters and native dragon Wardens', () => {
  it('defines eleven populated worlds, whose possible Wardens all belong to that world', () => {
    expect(CAMPAIGN_REALMS).toHaveLength(11);
    expect(new Set(CAMPAIGN_REALMS.map((r) => r.id)).size).toBe(11);
    for (const realm of CAMPAIGN_REALMS) {
      expect(
        ENCOUNTERS.filter((e) => e.realm === realm.id && e.kind === 'regular').length,
      ).toBeGreaterThanOrEqual(2);
      expect(
        ENCOUNTERS.filter((e) => e.realm === realm.id && e.kind === 'elite').length,
      ).toBeGreaterThanOrEqual(2);
      for (const boss of realm.wardens) {
        expect(encounter(boss).realm).toBe(realm.id);
        expect(encounter(boss).kind).toBe('warden');
      }
    }
    expect(validateDb(COMBAT_DB)).toEqual([]);
    expect(COMBAT_DB.units.vorthax!.name).toBe('Drago, Heart of the Rift');
  });
  it.each([
    'ashbound-colossus',
    'pearlbound-sovereign',
    'dreaming-monarch',
    'sandbound-chronicler',
    ...DRAGON_WARDENS,
  ])('%s executes its complete authored move cycle deterministically', (id) => {
    const setup = {
      seed: `moves-${id}`,
      a: { hero: 'knight', deck: RIFTWALKERS.knight.starter, hp: 100000, maxHp: 100000 },
      b: { enemies: [id], tier: 1, hpPct: 100, dmgPct: 100 },
    };
    let state = createCombat(COMBAT_DB, setup).state;
    const def = COMBAT_DB.units[id]!;
    if (def.brain.kind !== 'enemy') throw new Error('Expected enemy');
    expect(state.sides.b.units.find((u) => u.def === id)?.maxHp).toBe(def.maxHp);
    const moves: string[] = [];
    for (let i = 0; i < 4; i++) {
      const result = applyAction(COMBAT_DB, state, { type: 'endTurn' });
      moves.push(
        ...result.events.flatMap((e) =>
          e.type === 'act' && e.unit === state.sides.b.units.find((u) => u.def === id)?.id && e.move
            ? [e.move]
            : [],
        ),
      );
      state = result.state;
    }
    expect(new Set(moves)).toEqual(new Set(Object.keys(def.brain.moves)));
    expect(state.winner).toBeNull();
  });
});
