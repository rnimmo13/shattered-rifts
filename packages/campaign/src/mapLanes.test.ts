import { expect, it } from 'vitest';
import { seedRng } from '@sr/combat';
import { floorsOf, generateStageMap, MAP_LANES } from './mapgen';

const rowsOf = (tier: number, seed: string) => {
  const map = generateStageMap(seedRng(seed), 1, 'nexus', 'knight', undefined, tier);
  return {
    map,
    rows: Array.from({ length: map.floors }, (_, f) => map.nodes.filter((n) => n.floor === f + 1)),
  };
};

it('five starting lanes meet and split without dead ends or extra stops on any route', () => {
  for (let tier = 1; tier <= 20; tier++) {
    for (let seed = 0; seed < 10; seed++) {
      const { map, rows } = rowsOf(tier, `lanes-${seed}`);
      expect(rows[0]).toHaveLength(MAP_LANES);
      expect(map.floors).toBe(floorsOf(tier) + 1);
      const reachable = new Set(rows[0]!.map((n) => n.id));
      for (let f = 0; f < rows.length; f++) {
        const row = rows[f]!;
        expect(row.length).toBeLessThanOrEqual(MAP_LANES);
        // A meeting point leads on to every stop of the next floor.
        if (row.length === 1 && row[0]!.kind !== 'warden')
          expect(row[0]!.next).toHaveLength(rows[f + 1]!.length);
        for (const n of row) {
          expect(reachable.has(n.id)).toBe(true);
          expect(new Set(n.next).size).toBe(n.next.length);
          if (n.kind !== 'warden') expect(n.next.length).toBeGreaterThan(0);
          for (const id of n.next) {
            expect(map.nodes.find((m) => m.id === id)!.floor).toBe(n.floor + 1);
            reachable.add(id);
          }
          const next = rows[f + 1];
          if (next)
            for (const other of row)
              for (const a of n.next)
                for (const b of other.next) {
                  expect(
                    (row.indexOf(n) - row.indexOf(other)) *
                      (next.findIndex((m) => m.id === a) - next.findIndex((m) => m.id === b)),
                  ).toBeGreaterThanOrEqual(0);
                }
        }
      }
      expect(rows.at(-1)).toHaveLength(1);
      expect(rows.at(-1)![0]!.kind).toBe('warden');
      expect(rows.at(-2)!.every((n) => n.kind === 'shrine')).toBe(true);
    }
  }
});

it('routes meet at irregular floors, and some maps never fully meet', () => {
  const meetFloors = new Set<number>();
  let withoutMeet = 0;
  for (let seed = 0; seed < 60; seed++) {
    const { rows } = rowsOf(15, `irregular-${seed}`);
    const meets = rows.slice(0, -2).flatMap((r, f) => (r.length === 1 ? [f + 1] : []));
    if (meets.length === 0) withoutMeet++;
    for (const f of meets) meetFloors.add(f);
  }
  expect(withoutMeet).toBeGreaterThan(0);
  expect(withoutMeet).toBeLessThan(60);
  expect(meetFloors.size).toBeGreaterThan(4);
  expect([...meetFloors].some((f) => f % 6 !== 0)).toBe(true);
});
