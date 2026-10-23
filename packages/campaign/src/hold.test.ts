import { describe, expect, it } from 'vitest';
import {
  HOLD_DEPOSIT,
  HOLD_LATER,
  availableNodes,
  buyCard,
  enterNode,
  holdCard,
  leaveMerchant,
  newRun,
  type RunState,
} from './index';

const open = (r: RunState): RunState => ({ ...r, phase: 'map', context: null });

/** A run standing in a merchant (the first reachable node turned into one). */
function atMerchant(seed: string, shards: number, prev?: RunState): RunState {
  const base = prev
    ? { ...prev, phase: 'map' as const, context: null }
    : open(newRun('maren', seed));
  const node = availableNodes(base)[0]!;
  const asMerchant: RunState = {
    ...base,
    shards,
    map: {
      ...base.map,
      nodes: base.map.nodes.map((n) => (n.id === node.id ? { ...n, kind: 'merchant' } : n)),
    },
  };
  return enterNode(asMerchant, node.id);
}

describe('holding a merchant card for later', () => {
  it('costs a deposit now and sells the card cheaper at the next merchant', () => {
    const m = atMerchant('hold-1', 500);
    const item = m.context!.merchant!.items[0]!;
    const held = holdCard(m, 0);
    const deposit = Math.ceil(item.price * HOLD_DEPOSIT);
    expect(held.shards).toBe(500 - deposit);
    expect(held.held).toEqual({ cardId: item.cardId, price: Math.ceil(item.price * HOLD_LATER) });
    expect(held.context!.merchant!.items[0]!.onHold).toBe(true);
    expect(() => buyCard(held, 0)).toThrow(); // it is on hold, not for sale now
    expect(() => holdCard(held, 1)).toThrow(); // one at a time
    // the next merchant has it waiting, at the promised price, first in the row
    const next = atMerchant('hold-1-next', 500, leaveMerchant(held));
    const again = next.context!.merchant!.items[0]!;
    expect(again).toMatchObject({
      cardId: item.cardId,
      held: true,
      price: Math.ceil(item.price * HOLD_LATER),
    });
    const bought = buyCard(next, 0);
    expect(bought.deck).toContain(item.cardId);
    expect(bought.shards).toBe(500 - again.price);
    expect(bought.held).toBeUndefined();
  });

  it('is refused when you cannot pay the deposit', () => {
    const m = atMerchant('hold-2', 3);
    expect(() => holdCard(m, 0)).toThrow();
  });

  it('stays on hold across merchants until you buy it', () => {
    const m = holdCard(atMerchant('hold-3', 500), 0);
    const second = atMerchant('hold-3b', 500, leaveMerchant(m));
    const third = atMerchant('hold-3c', 500, leaveMerchant(second));
    expect(third.context!.merchant!.items[0]!.held).toBe(true);
  });
});
