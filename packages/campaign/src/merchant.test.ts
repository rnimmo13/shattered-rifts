// The smarter merchant (DECISIONS #243): removals grow dearer over a run, and one card is on sale.

import { describe, expect, it } from 'vitest';
import {
  REMOVE_PRICE,
  SALE_OFF,
  availableNodes,
  buyRemoval,
  enterNode,
  holdCard,
  leaveMerchant,
  newRun,
  parseRun,
  priceOf,
  serializeRun,
  type RunState,
} from './index';

const open = (r: RunState): RunState => ({ ...r, phase: 'map', context: null });

function atMerchant(seed: string, prev?: RunState, deck?: string[]): RunState {
  const base = prev ? open(prev) : open(newRun('knight', seed));
  const node = availableNodes(base)[0]!;
  return enterNode(
    {
      ...base,
      shards: 5000,
      ...(deck ? { deck } : {}),
      map: {
        ...base.map,
        nodes: base.map.nodes.map((n) => (n.id === node.id ? { ...n, kind: 'merchant' } : n)),
      },
    },
    node.id,
  );
}

describe('card removal at the merchant', () => {
  it('sells as many as you can pay for in one visit, each double the last (DECISIONS #491, #493)', () => {
    const deck = Array<string>(12).fill('strike');
    let m = { ...atMerchant('remove-many', undefined, deck), shards: 350 };
    for (const [price, left] of [
      [50, 300],
      [100, 200],
      [200, 0],
    ] as const) {
      expect(m.context!.merchant!.removePrice).toBe(price);
      m = buyRemoval(m, m.deck[0]!);
      expect(m.shards).toBe(left);
    }
    expect(m.removals).toBe(3);
    expect(m.context!.merchant!.removePrice).toBe(400);
    expect(() => buyRemoval(m, m.deck[0]!)).toThrow();
    // (and it still survives a save)
    expect(parseRun(serializeRun(m))?.context?.merchant?.removePrice).toBe(400);
  });

  it('still stops at the deck minimum', () => {
    const m = atMerchant('remove-floor', undefined, Array<string>(8).fill('strike'));
    expect(() => buyRemoval(m, 'strike')).toThrow(/cannot go below 8/);
  });

  it('starts over at the next merchant (DECISIONS #493)', () => {
    let m = atMerchant('remove-1');
    expect(m.context!.merchant!.removePrice).toBe(REMOVE_PRICE);
    m = buyRemoval(m, m.deck[0]!);
    m = buyRemoval(m, m.deck[0]!);
    expect(m.context!.merchant!.removePrice).toBe(REMOVE_PRICE * 4);
    const next = atMerchant('remove-2', leaveMerchant(m));
    expect(next.context!.merchant!.removePrice).toBe(REMOVE_PRICE);
  });

  it('remembers the count through a save', () => {
    let m = atMerchant('remove-save');
    m = buyRemoval(m, m.deck[0]!);
    expect(parseRun(serializeRun(m))?.removals).toBe(1);
  });
});

describe('the sale', () => {
  it('puts exactly one card on the table at a lower price', () => {
    for (const seed of ['s1', 's2', 's3', 's4']) {
      const items = atMerchant(seed).context!.merchant!.items;
      const sale = items.filter((i) => i.sale);
      expect(sale).toHaveLength(1);
      expect(sale[0]!.price).toBe(Math.round(priceOf(sale[0]!.cardId) * (1 - SALE_OFF)));
    }
  });

  it('cannot be put on hold (the discounts do not stack)', () => {
    const m = atMerchant('sale-hold');
    const i = m.context!.merchant!.items.findIndex((x) => x.sale);
    expect(() => holdCard(m, i)).toThrow();
  });
});
