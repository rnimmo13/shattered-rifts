// The smarter merchant (DECISIONS #243): removals grow dearer over a run, one card is on sale, and a deck that leans on a lane finds
// a card of it on the table. And the synergy hints that say which offered cards fit the deck.

import { describe, expect, it } from 'vitest';
import { COMBAT_DB, RIFTWALKERS, laneOf, rewardPool } from '@sr/content/v2';
import {
  REMOVE_MAX,
  REMOVE_PRICE,
  REMOVE_STEP,
  SALE_OFF,
  availableNodes,
  buyRemoval,
  enterNode,
  holdCard,
  fitOf,
  leaveMerchant,
  mainLane,
  newRun,
  parseRun,
  priceOf,
  removePrice,
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

/** Cards of one of the knight's lanes. */
const laneCards = (lane: number): string[] =>
  rewardPool('knight').filter(
    (id) => laneOf(id) === lane && COMBAT_DB.cards[id]?.hero === 'knight',
  );

describe('card removal at the merchant', () => {
  it('costs more for each removal already bought this run, up to a cap', () => {
    expect(removePrice(0)).toBe(REMOVE_PRICE);
    expect(removePrice(1)).toBe(REMOVE_PRICE + REMOVE_STEP);
    expect(removePrice(99)).toBe(REMOVE_MAX);
    let m = atMerchant('remove-1');
    expect(m.context!.merchant!.removePrice).toBe(REMOVE_PRICE);
    m = buyRemoval(m, m.deck[0]!);
    expect(m.removals).toBe(1);
    const next = atMerchant('remove-2', leaveMerchant(m));
    expect(next.context!.merchant!.removePrice).toBe(REMOVE_PRICE + REMOVE_STEP);
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

describe('a merchant who knows your deck', () => {
  it('has a card of the lane your deck leans on most', () => {
    const lane = 0;
    const deck = [...RIFTWALKERS.knight.starter, ...laneCards(lane).slice(0, 4)];
    expect(mainLane('knight', deck)).toBe(lane);
    for (const seed of ['l1', 'l2', 'l3', 'l4', 'l5']) {
      const items = atMerchant(seed, undefined, deck).context!.merchant!.items;
      expect(items.some((i) => laneOf(i.cardId) === lane)).toBe(true);
    }
  });
});

describe('synergy hints', () => {
  it('say a card fits a lane the deck already builds', () => {
    const cards = laneCards(1);
    const deck = [...RIFTWALKERS.knight.starter, cards[0]!, cards[1]!];
    expect(fitOf(deck, cards[2]!)).toMatchObject({ kind: 'fits', n: 2 });
  });

  it('say nothing for a card with no lane, or for a starting deck', () => {
    const starter = [...RIFTWALKERS.knight.starter];
    expect(fitOf(starter, starter[0]!)).toBeNull();
    expect(fitOf(starter, laneCards(2)[0]!)).toBeNull();
  });

  it('call a card a new lane only once the deck builds another', () => {
    const deck = [...RIFTWALKERS.knight.starter, ...laneCards(0).slice(0, 3)];
    expect(fitOf(deck, laneCards(2)[0]!)?.kind).toBe('new');
  });
});
