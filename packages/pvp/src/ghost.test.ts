import { describe, expect, it } from 'vitest';
import { chooseAction, chooseSmartAction, hashState } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { Match } from './match';

const entry = (h: HeroId) => ({
  name: h,
  hero: h,
  deck: [...RIFTWALKERS[h].starter],
  boons: [],
  tier: 1,
});

describe('the smart bot that pilots a ghost', () => {
  it('always makes a legal move, the same one from the same position, and finishes matches', () => {
    for (const [x, y] of [
      ['knight', 'hunter'],
      ['engineer', 'trickster'],
      ['spellblade', 'necromancer'],
    ] as const) {
      const m = new Match(`ghost-test-${x}-${y}`, entry(x), entry(y), 0);
      let guard = 0;
      while (!m.over && guard++ < 4000) {
        const a = chooseSmartAction(COMBAT_DB, m.state);
        // the same position asked twice gives the same answer, and asking changes nothing
        const before = hashState(m.state);
        expect(chooseSmartAction(COMBAT_DB, m.state)).toEqual(a);
        expect(hashState(m.state)).toBe(before);
        const r = m.submit(m.active, m.log.length + 1, a, 0);
        expect(r.ok, `${x} v ${y}: ${JSON.stringify(a)}`).toBe(true);
      }
      expect(m.over, `${x} v ${y} should end`).not.toBeNull();
    }
  });

  it('beats the greedy bot more often than not (a sample, not a proof: pnpm ghostsim measures it)', () => {
    let smart = 0;
    let n = 0;
    for (const [x, y] of [
      ['trickster', 'knight'],
      ['assassin', 'engineer'],
      ['spellblade', 'hunter'],
      ['monk', 'necromancer'],
    ] as const)
      for (const seat of ['a', 'b'] as const) {
        const m = new Match(`ghost-vs-${x}-${y}-${seat}`, entry(x), entry(y), 0);
        let guard = 0;
        while (!m.over && guard++ < 4000) {
          const a =
            m.active === seat
              ? chooseSmartAction(COMBAT_DB, m.state)
              : chooseAction(COMBAT_DB, m.state);
          const r = m.submit(m.active, m.log.length + 1, a, 0);
          if (!r.ok) throw new Error(r.message);
        }
        n++;
        if (m.over?.winner === seat) smart++;
      }
    expect(smart).toBeGreaterThanOrEqual(Math.ceil(n / 2));
  });
});
