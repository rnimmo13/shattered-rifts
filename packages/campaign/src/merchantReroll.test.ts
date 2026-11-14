import { describe, expect, it } from 'vitest';
import { COMBAT_DB } from '@sr/content/v2';
import {
  availableNodes,
  enterNode,
  newRun,
  rerollMerchant,
  merchantRerollPrice,
  serializeRun,
  parseRun,
  type RunState,
} from './index';
function shop(crossed?: string): RunState {
  const r = newRun('knight', 'paid-reroll');
  r.phase = 'map';
  r.context = null;
  r.shards = 1000;
  const n = availableNodes(r)[0]!;
  n.kind = 'merchant';
  if (crossed) n.crossed = crossed;
  return enterNode(r, n.id);
}
describe('paid merchant rerolls', () => {
  it('charges 50, 100, 150 and persists the next fee without mutating the input', () => {
    const original = shop();
    let r = original;
    for (const fee of [50, 100, 150]) {
      expect(merchantRerollPrice(r)).toBe(fee);
      const before = r.shards;
      const same = rerollMerchant(r);
      r = rerollMerchant(r);
      expect(r).toEqual(same);
      expect(r.shards).toBe(before - fee);
    }
    expect(original.shards).toBe(1000);
    expect(merchantRerollPrice(parseRun(serializeRun(r))!)).toBe(200);
    expect(merchantRerollPrice(shop())).toBe(50);
  });
  it('rejects unavailable funds and wrong phases', () => {
    const r = shop();
    expect(() => rerollMerchant({ ...r, shards: 49 })).toThrow('Not enough shards');
    expect(() => rerollMerchant({ ...r, phase: 'map' })).toThrow('You are not at a merchant');
    expect(r.context!.merchant!.rerolls).toBeUndefined();
  });
  it('preserves holds, non-card stock and service prices while refreshing sold cards', () => {
    const r = shop();
    const m = r.context!.merchant!;
    const held = { cardId: 'strike', price: 30, sold: false, held: true };
    const onHold = { cardId: 'defend', price: 40, sold: false, onHold: true };
    m.items = [held, onHold, { cardId: 'strike', price: 40, sold: true }];
    m.upgrades = 2;
    const next = rerollMerchant(r).context!.merchant!;
    expect(next.items.slice(0, 2)).toEqual([held, onHold]);
    expect(next.items.slice(2).every((x) => !x.sold)).toBe(true);
    expect(next.items.filter((x) => x.sale)).toHaveLength(1);
    expect(next.potions).toEqual(m.potions);
    expect(next.boon).toEqual(m.boon);
    expect(next.removePrice).toBe(m.removePrice);
    expect(next.upgrades).toBe(2);
  });
  it('keeps a visiting merchant in their own class pool', () => {
    const r = rerollMerchant(shop('hunter'));
    expect(r.context!.merchant!.crossed).toBe('hunter');
    expect(
      r.context!.merchant!.items.every((x) => COMBAT_DB.cards[x.cardId]?.hero === 'hunter'),
    ).toBe(true);
  });
});
