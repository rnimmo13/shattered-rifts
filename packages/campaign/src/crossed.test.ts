import { describe, expect, it } from 'vitest';
import { COMBAT_DB, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { availableNodes, enterNode, newRun, type RunState } from './index';

const open = (r: RunState): RunState => ({ ...r, phase: 'map', context: null });

describe('the visiting merchant', () => {
  it("sometimes sells only another Riftwalker's cards, and says so", () => {
    let crossed = 0;
    let own = 0;
    for (let i = 0; i < 400; i++) {
      const base = open(newRun('maren', `cross-${i}`));
      const node = availableNodes(base)[0]!;
      const asMerchant: RunState = {
        ...base,
        map: {
          ...base.map,
          nodes: base.map.nodes.map((n) => (n.id === node.id ? { ...n, kind: 'merchant' } : n)),
        },
      };
      const m = enterNode(asMerchant, node.id).context!.merchant!;
      if (m.crossed) {
        crossed++;
        expect(m.crossed).not.toBe('maren');
        expect(Object.keys(RIFTWALKERS)).toContain(m.crossed as HeroId);
        // the whole table is that Riftwalker's own cards
        expect(m.items.length).toBeGreaterThanOrEqual(3);
        for (const x of m.items) expect(COMBAT_DB.cards[x.cardId]?.hero, x.cardId).toBe(m.crossed);
      } else own++;
    }
    expect(crossed).toBeGreaterThan(10);
    expect(own).toBeGreaterThan(crossed * 4);
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
