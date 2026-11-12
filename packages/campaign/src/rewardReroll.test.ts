import { describe, expect, it } from 'vitest';
import {
  newRun,
  canRerollReward,
  rerollReward,
  parseRun,
  serializeRun,
  offerCards,
  giftOffers,
} from './index';
import { clone } from '@sr/combat';
import { crossedPool } from './rewards';
function reward(gift = false) {
  const r = newRun('engineer', 'reroll-fixture');
  const node = r.map.nodes[0]!;
  node.kind = gift ? 'warden' : 'duel';
  r.phase = gift ? 'gift' : 'reward';
  r.at = node.id;
  r.context = { nodeId: node.id, offers: ['deploy-drone', 'recycle', 'reactor'] };
  return r;
}
describe('one optional card reward reroll per Rift Tier', () => {
  it('uses the original reward profile, advances RNG once and is immutable', () => {
    for (const gift of [false, true]) {
      const r = reward(gift);
      const before = serializeRun(r);
      const copy = clone(r);
      const expected = gift
        ? giftOffers(copy.rng, copy.character, copy.deck, 3)
        : offerCards(copy.rng, copy.character, copy.deck, 'duel', 3);
      const next = rerollReward(r);
      expect(next.context?.offers).toEqual(expected);
      expect(next.rng).toEqual(copy.rng);
      expect(serializeRun(r)).toBe(before);
      expect(next.rewardRerollTier).toBe(1);
      expect(() => rerollReward(next)).toThrow();
    }
  });
  it('persists use through saves and becomes available on a later tier', () => {
    const next = rerollReward(reward());
    const restored = parseRun(serializeRun(next));
    expect(restored).not.toBeNull();
    expect(canRerollReward(restored!)).toBe(false);
    next.tier = 2;
    expect(canRerollReward(next)).toBe(true);
    expect(parseRun(serializeRun({ ...next, rewardRerollTier: 3 }))).toBeNull();
    expect(canRerollReward(reward())).toBe(true); // old saves have no field
  });
  it('rejects events, spoils, Ascendancies and empty rewards', () => {
    const r = reward();
    r.context!.spoils = { shards: 5 };
    expect(canRerollReward(r)).toBe(false);
    delete r.context!.spoils;
    r.map.nodes[0]!.kind = 'event';
    expect(canRerollReward(r)).toBe(false);
    r.map.nodes[0]!.kind = 'duel';
    r.phase = 'ascend';
    expect(canRerollReward(r)).toBe(false);
    r.phase = 'reward';
    r.context!.offers = [];
    expect(canRerollReward(r)).toBe(false);
  });
});

describe('a Rift-crossed card keeps its slot through the reroll (Robert, 2026-11-12)', () => {
  it('rerolls a Rift-crossed slot into another Rift-crossed card, the other slots as usual', () => {
    const crossed = new Set(crossedPool('engineer'));
    const pool = [...crossed];
    for (let seed = 0; seed < 25; seed++) {
      const r = newRun('engineer', `reroll-crossed-${seed}`);
      const node = r.map.nodes[0]!;
      node.kind = 'duel';
      r.phase = 'reward';
      r.at = node.id;
      const was = pool[seed % pool.length]!;
      r.context = { nodeId: node.id, offers: ['deploy-drone', was, 'reactor'] };
      const offers = rerollReward(r).context!.offers!;
      expect(offers).toHaveLength(3);
      expect(crossed.has(offers[1]!), `seed ${seed}: ${offers[1]}`).toBe(true);
      expect(new Set(offers).size).toBe(3);
    }
  });
});
