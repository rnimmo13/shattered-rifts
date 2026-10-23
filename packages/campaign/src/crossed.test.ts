import { describe, expect, it } from 'vitest';
import { COMBAT_DB, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { availableNodes, enterNode, newRun, type RunState } from './index';

const open = (r: RunState): RunState => ({ ...r, phase: 'map', context: null });

describe('the visiting merchant', () => {
  it("is decided on the map (about 7.5% of merchants), and sells only that Riftwalker's cards", async () => {
    const { generateStageMap } = await import('./index');
    const { seedRng } = await import('@sr/combat');
    let crossed = 0;
    let merchants = 0;
    for (let i = 0; i < 600; i++) {
      const map = generateStageMap(seedRng(`cm-${i}`), 2, 'nexus', 'maren');
      for (const n of map.nodes) {
        if (n.kind !== 'merchant') continue;
        merchants++;
        if (!n.crossed) continue;
        crossed++;
        expect(n.crossed).not.toBe('maren');
        expect(Object.keys(RIFTWALKERS)).toContain(n.crossed as HeroId);
        // walking in gives that stranger's table: all of that Riftwalker's own cards
        const base = open(newRun('maren', `cross-${i}`));
        const first = availableNodes(base)[0]!;
        const m = enterNode(
          {
            ...base,
            map: {
              ...base.map,
              nodes: base.map.nodes.map((x) =>
                x.id === first.id ? { ...x, kind: 'merchant', crossed: n.crossed as string } : x,
              ),
            },
          },
          first.id,
        ).context!.merchant!;
        expect(m.crossed).toBe(n.crossed);
        expect(m.items.length).toBeGreaterThanOrEqual(3);
        for (const x of m.items) expect(COMBAT_DB.cards[x.cardId]?.hero, x.cardId).toBe(m.crossed);
      }
    }
    expect(crossed / merchants).toBeGreaterThan(0.04);
    expect(crossed / merchants).toBeLessThan(0.12);
  });
});

describe('Rift-crossed cards are the exception', () => {
  it('turn up in about 3% of ordinary card offers, so rewards are nearly always for your own deck', async () => {
    const { offerCards } = await import('./index');
    const { seedRng } = await import('@sr/combat');
    let crossed = 0;
    let total = 0;
    for (let i = 0; i < 1500; i++)
      for (const id of offerCards(seedRng(`x${i}`), 'maren', [], 'duel', 3)) {
        total++;
        const h = COMBAT_DB.cards[id]?.hero;
        if (h && h !== 'maren' && h !== 'neutral') crossed++;
      }
    expect(crossed / total).toBeLessThan(0.06);
    expect(crossed).toBeGreaterThan(0);
  });
});
