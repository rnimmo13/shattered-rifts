import { expect, it } from 'vitest';
import { seedRng } from '@sr/combat';
import { floorsOf, generateStageMap } from './mapgen';

it('five starting lanes meet and split without dead ends or extra stops on any route', () => {
  for (let tier = 1; tier <= 20; tier++) {
    for (let seed = 0; seed < 10; seed++) {
      const map = generateStageMap(seedRng(`lanes-${seed}`), 1, 'nexus', 'knight', undefined, tier);
      const rows = Array.from({ length: map.floors }, (_, f) =>
        map.nodes.filter((n) => n.floor === f + 1),
      );
      expect(rows[0]).toHaveLength(5);
      expect(map.floors).toBe(floorsOf(tier) + 1);
      const reachable = new Set(rows[0]!.map((n) => n.id));
      for (let f = 0; f < rows.length; f++) {
        const row = rows[f]!;
        expect(row.length).toBeLessThanOrEqual(5);
        if (f + 1 < floorsOf(tier) && (f + 1) % 6 === 0) {
          expect(row).toHaveLength(1);
          const exits = f + 2 === floorsOf(tier) ? 2 : 5;
          expect(rows[f + 1]).toHaveLength(exits);
          expect(row[0]!.next).toHaveLength(exits);
        }
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
