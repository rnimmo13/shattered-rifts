// More potion places (DECISIONS #799): a run's belt holds 3, one more for every pouch (merchant, the pouchmaker), at most 5.

import { describe, expect, it } from 'vitest';
import {
  MAX_BELT,
  MAX_POTIONS,
  beltSize,
  buyPouch,
  newRun,
  parseRun,
  pouchPrice,
  serializeRun,
  type RunState,
} from './index';
import { clone } from '@sr/combat';
import { applyDeal } from './deals';
import type { EventOption } from './types';

const atMerchant = (r: RunState): RunState => ({
  ...r,
  phase: 'merchant',
  shards: 1000,
  context: { nodeId: r.map.nodes[0]!.id, merchant: { items: [], removePrice: 50, removed: false } },
});

describe('the potion belt', () => {
  it('holds 3, one more a pouch, at most 5', () => {
    expect(beltSize({})).toBe(MAX_POTIONS);
    expect(beltSize({ beltSlots: 1 })).toBe(4);
    expect(beltSize({ beltSlots: 9 })).toBe(MAX_BELT);
  });

  it('a merchant sells one pouch a visit, dearer the more you have, none once the belt is full', () => {
    const r = atMerchant(newRun('knight', 'belt'));
    const price = pouchPrice(r)!;
    expect(price).toBeGreaterThan(0);
    const one = buyPouch(r);
    expect(one.beltSlots).toBe(1);
    expect(one.shards).toBe(r.shards - price);
    expect(pouchPrice(one)).toBeNull();
    expect(() => buyPouch(one)).toThrow(/pouch/);
    const next = atMerchant({ ...one, beltSlots: 1 });
    expect(pouchPrice(next)!).toBeGreaterThan(price);
    expect(pouchPrice(atMerchant({ ...one, beltSlots: MAX_BELT - MAX_POTIONS }))).toBeNull();
  });

  it("the pouchmaker's pouch adds a place, and is refused on a full belt", () => {
    const r = newRun('knight', 'belt');
    const ev = { title: '', text: '', cardOffer: '', options: [] };
    const helpers = {
      gainBoon: () => undefined,
      fail: (msg: string): never => {
        throw new Error(msg);
      },
    };
    const deal: EventOption = { id: 'leave', label: '', deal: [{ k: 'belt' }] };
    const once = clone(r);
    applyDeal(once, deal, ev, helpers);
    expect(beltSize(once)).toBe(4);
    const full = { ...clone(r), beltSlots: MAX_BELT - MAX_POTIONS };
    expect(() => applyDeal(full, deal, ev, helpers)).toThrow(/room/);
  });

  it('a run carrying five potions on a five-place belt saves and loads', () => {
    const r: RunState = {
      ...newRun('knight', 'belt'),
      beltSlots: 2,
      potions: ['fire-flask', 'fire-flask', 'fire-flask', 'fire-flask', 'fire-flask'],
    };
    const back = parseRun(serializeRun(r));
    expect(back?.beltSlots).toBe(2);
    expect(back?.potions).toHaveLength(5);
    // (more potions than the belt holds is not a run the game made)
    expect(parseRun(serializeRun({ ...r, beltSlots: 1 }))).toBeNull();
  });
});
