import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { ASCENDANCIES } from '@sr/content/v2';
it('preserves complete versioned estimates for every Ascendancy and all class starts', () => {
  for (const version of ['0.194.0', '0.195.0']) {
    const s = JSON.parse(
      readFileSync(new URL(`../../docs/balance-history/${version}.json`, import.meta.url), 'utf8'),
    ) as {
      version: string;
      measuredMatches: number;
      starters: unknown[];
      ratings: {
        id: string;
        evidence: string[];
        confidence: string;
        arena: { overall: string };
        campaign: { endgame: string };
      }[];
    };
    expect(s.version).toBe(version);
    expect(s.measuredMatches).toBe(0);
    expect(s.starters).toHaveLength(10);
    expect(s.ratings.map((r) => r.id).sort()).toEqual(ASCENDANCIES.map((a) => a.id).sort());
    for (const r of s.ratings) {
      expect(r.confidence).toBeTruthy();
      expect(r.evidence.length).toBeGreaterThan(0);
      expect(r.arena.overall).toBeTruthy();
      expect(r.campaign.endgame).toBeTruthy();
    }
  }
});
