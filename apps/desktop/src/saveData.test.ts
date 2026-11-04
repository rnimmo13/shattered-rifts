import { describe, expect, it } from 'vitest';
import { achievementsFor, cleanEntries, HEROES, makeSave, parseSave } from './saveData';

const slots = (runs: unknown[]) => ({
  'sr.runs.v3': JSON.stringify(runs.map((r) => ({ text: JSON.stringify(r) }))),
});
const run = (tier: number, phase = 'map', character = 'knight') => ({
  v: 2,
  tier,
  phase,
  character,
  stats: { duelsWon: 3 },
});
describe('Steam save format and progress', () => {
  it('keeps campaign replay state and personal data, excluding credentials and machine graphics', () => {
    expect(
      cleanEntries({
        'sr.runs.v3': '[]',
        'sr.fightlog:abc': '{}',
        'sr.duel.started:abc': 'yes',
        'sr.graphics': 'low',
        'sr-pvp-name-claimed': 'Alice',
        'sr-player-id': 'id',
        'sr-vault-code': 'code',
        unrelated: 'secret',
      }),
    ).toEqual({
      'sr.runs.v3': '[]',
      'sr.fightlog:abc': '{}',
      'sr.duel.started:abc': 'yes',
      'sr-vault-code': 'code',
    });
  });
  it('round trips with an account boundary and integrity check', () => {
    const data = makeSave('76561198000000001', slots([run(5)]), [], 100);
    expect(parseSave(JSON.stringify(data), data.owner)).toEqual(data);
    expect(() => parseSave(JSON.stringify(data), 'another-owner')).toThrow();
    expect(() =>
      parseSave(JSON.stringify({ ...data, entries: { 'sr.runs.v3': '[]' } }), data.owner),
    ).toThrow();
    expect(() => parseSave(JSON.stringify({ ...data, version: 2 }), data.owner)).toThrow();
  });
  it('does not unlock a tier just for entering it or losing there', () => {
    expect(achievementsFor(slots([run(5)]))).not.toContain('TIER_5');
    expect(achievementsFor(slots([run(5, 'loopCleared')]))).toContain('TIER_5');
    expect(
      achievementsFor({
        'sr.runHistory': JSON.stringify([
          { hero: 'knight', tier: 20, end: 'collapsed', duelsWon: 5 },
        ]),
      }),
    ).not.toContain('TIER_20');
    expect(achievementsFor(slots([run(20, 'banked')]))).toContain('TIER_20');
  });
  it('keeps unlocks after a run is deleted and combines class clears over time', () => {
    let earned: string[] = [];
    for (const hero of HEROES)
      earned = achievementsFor(slots([run(1, 'loopCleared', hero)]), earned);
    expect(earned).toContain('ALL_CLASSES');
    expect(achievementsFor({}, earned)).toEqual(earned);
    expect(
      achievementsFor(slots([{ ...run(3, 'loopCleared'), ascendancy: 'knight:paladin' }])),
    ).toContain('ASCENDANT');
    expect(achievementsFor(slots([{ ...run(20, 'loopCleared'), stats: { duelsWon: 0 } }]))).toEqual(
      [],
    );
  });
  it('preserves malformed legacy records without inventing unlocks', () => {
    expect(achievementsFor({ 'sr.runs.v3': '[{"text":"bad"}]' })).toEqual([]);
    expect(() => cleanEntries({ 'sr.runs.v3': 12 })).toThrow();
  });
});
