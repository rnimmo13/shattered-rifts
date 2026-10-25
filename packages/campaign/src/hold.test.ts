import { describe, expect, it } from 'vitest';
import {
  HOLD_DEPOSIT,
  HOLD_LATER,
  availableNodes,
  buyCard,
  enterNode,
  holdCard,
  leaveMerchant,
  parseRun,
  serializeRun,
  MAX_HELD,
  newRun,
  releaseHold,
  type RunState,
} from './index';

const open = (r: RunState): RunState => ({ ...r, phase: 'map', context: null });

/** A run standing in a merchant (the first reachable node turned into one). */
function atMerchant(seed: string, shards: number, prev?: RunState): RunState {
  const base = prev
    ? { ...prev, phase: 'map' as const, context: null }
    : open(newRun('knight', seed));
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

describe('letting a hold go', () => {
  it('holds several cards at once, up to the limit', () => {
    let m = atMerchant('hold-many', 5000);
    const n = m.context!.merchant!.items.length;
    expect(n).toBeGreaterThanOrEqual(MAX_HELD + 1);
    for (let i = 0; i < MAX_HELD; i++) m = holdCard(m, i);
    expect(m.held).toHaveLength(MAX_HELD);
    expect(() => holdCard(m, MAX_HELD)).toThrow();
    // all of them wait at the next merchant, and buying one leaves the others held
    const next = atMerchant('hold-many-next', 5000, leaveMerchant(m));
    expect(next.context!.merchant!.items.filter((i) => i.held)).toHaveLength(MAX_HELD);
    const bought = buyCard(next, 0);
    expect(bought.held).toHaveLength(MAX_HELD - 1);
  });

  it('puts a card held at this visit back on sale, and keeps the deposit', () => {
    const m = atMerchant('hold-release-1', 500);
    const held = holdCard(m, 0);
    const back = releaseHold(held, 0);
    expect(back.held).toBeUndefined();
    expect(back.shards).toBe(held.shards);
    expect(back.context!.merchant!.items[0]!.onHold).toBeUndefined();
    expect(buyCard(back, 0).deck.length).toBe(back.deck.length + 1);
    // and another card can be held now
    expect(() => holdCard(back, 1)).not.toThrow();
  });

  it('takes a card that was waiting from an earlier visit off the table', () => {
    const held = holdCard(atMerchant('hold-release-2', 500), 0);
    const next = atMerchant('hold-release-2-next', 500, leaveMerchant(held));
    const n = next.context!.merchant!.items.length;
    const gone = releaseHold(next, 0);
    expect(gone.held).toBeUndefined();
    expect(gone.context!.merchant!.items).toHaveLength(n - 1);
  });

  it('only works on a card that is on hold', () => {
    const m = atMerchant('hold-release-3', 500);
    expect(() => releaseHold(m, 0)).toThrow();
  });
});

describe('saves from when only one card could be held', () => {
  it('still load, with that card on hold', () => {
    const r = newRun('knight', 'old-hold');
    const old = serializeRun(r).replace(/^\{/, '{"held":{"cardId":"strike","price":40},');
    expect(parseRun(old)?.held).toEqual([{ cardId: 'strike', price: 40 }]);
    const junk = serializeRun(r).replace(/^\{/, '{"held":[{"cardId":"nope","price":1}],');
    expect(parseRun(junk)?.held).toBeUndefined();
  });
});

describe('holding a merchant card for later', () => {
  it('costs a deposit now and sells the card cheaper at the next merchant', () => {
    const m = atMerchant('hold-1', 500);
    const item = m.context!.merchant!.items[0]!;
    const held = holdCard(m, 0);
    const deposit = Math.ceil(item.price * HOLD_DEPOSIT);
    expect(held.shards).toBe(500 - deposit);
    expect(held.held).toEqual([{ cardId: item.cardId, price: Math.ceil(item.price * HOLD_LATER) }]);
    expect(held.context!.merchant!.items[0]!.onHold).toBe(true);
    expect(() => buyCard(held, 0)).toThrow(); // it is on hold, not for sale now
    expect(() => holdCard(held, 0)).toThrow(); // already on hold
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
