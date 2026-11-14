import { expect, it } from 'vitest';
import { fight, type Deck } from './fight';
import { COMBAT_DB } from '@sr/content/v2';
import { fileURLToPath } from 'node:url';
const deck: Deck = {
  id: 'engineer:golemancer',
  name: 'fixture',
  hero: 'engineer',
  quality: 'test',
  deck: [
    'war-engine+',
    'heavy-hitter+',
    'resonant-pulse+',
    'sync-pulse+',
    'reinforced-frame+',
    'patch-job+',
    'plating+',
    'overcharge+',
  ],
};
it('uses Arena HP (1200, #767; 1000 before) and distinguishes censored results from real outcomes reproducibly', () => {
  const j = { id: 0, mode: 'arena' as const, a: deck, b: deck, seed: 'harness-repeat', budget: 30 };
  const a = fight(j),
    b = fight(j);
  expect(a.maxHp).toEqual({ a: 1200, b: 1200 });
  expect(a.censored).toBe(a.winner === null);
  expect({ ...a, ms: 0 }).toEqual({ ...b, ms: 0 });
  expect(a.turns.a).toBeGreaterThan(0);
});
it('uses the actual Tier XX Normal Valerion plan and campaign Boon HP', () => {
  const r = fight({ id: 1, mode: 'boss', a: deck, seed: 'harness-boss', budget: 30 });
  expect(r.maxHp).toEqual({ a: 88, b: 4602 }); // 300 base HP × current 1136% Tier XX × a Warden’s 1.35, rounded to 1534% (rules 114).
  expect(r.tier).toBe(20);
  expect(r.bossFraction).toBeGreaterThanOrEqual(0);
  expect(r.bossFraction).toBeLessThanOrEqual(1);
});
it('keeps experimental card overrides isolated from the released database', () => {
  const base = COMBAT_DB.cards['blood-oath'],
    upgraded = COMBAT_DB.cards['blood-oath+'];
  const originals = JSON.stringify([base, upgraded]);
  const j = { id: 2, mode: 'boss' as const, a: deck, seed: 'override-isolation', budget: 30 };
  const before = fight(j);
  fight({ ...j, bloodOathConsume: true });
  expect(COMBAT_DB.cards['blood-oath']).toBe(base);
  expect(COMBAT_DB.cards['blood-oath+']).toBe(upgraded);
  expect(JSON.stringify([base, upgraded])).toBe(originals);
  expect({ ...fight(j), ms: 0 }).toEqual({ ...before, ms: 0 });
});
it('loads historical boss definitions with the current Campaign scaling', () => {
  const r = fight({
    id: 3,
    mode: 'boss',
    a: deck,
    seed: 'baseline-snapshot',
    budget: 30,
    databaseFile: fileURLToPath(
      new URL(
        '../../../docs/balance-history/simulations/0.199.0/baseline-db.json.gz',
        import.meta.url,
      ),
    ),
  });
  expect(r.maxHp).toEqual({ a: 88, b: 5522 }); // Archived 360 base HP × current 1136% × a Warden’s 1.35, rounded to 1534% (rules 114).
  expect(COMBAT_DB.units.vorthax!.maxHp).toBe(300);
});
