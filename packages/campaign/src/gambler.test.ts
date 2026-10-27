// The Gambler's Shrine (DECISIONS #234): Tier VI and up, two different blessings of seven, the Brass Reel beside them, and you
// can walk away at any time.

import { describe, expect, it } from 'vitest';
import { COMBAT_DB, markOf, rolledId, rollOf } from '@sr/content/v2';
import {
  GAMBLER_TIER,
  availableNodes,
  claimTrialPrize,
  diceable,
  engravable,
  diceOdds,
  enterNode,
  leaveShrine,
  ledgerGain,
  newRun,
  parseRun,
  rollTrial,
  serializeRun,
  takeShrine,
  type RunState,
} from './index';
import { chooseable } from './deals';

/** A run standing at a shrine (the first map node, made a shrine) at this tier. */
function shrineAt(tier: number, seed = 'gambler'): RunState {
  const base: RunState = { ...newRun('knight', seed), phase: 'map', context: null };
  const node = availableNodes(base)[0]!;
  const r: RunState = {
    ...base,
    tier,
    hp: 40,
    shards: 300,
    map: {
      ...base.map,
      nodes: base.map.nodes.map((n) => (n.id === node.id ? { ...n, kind: 'shrine' } : n)),
    },
  };
  return enterNode(r, node.id);
}

describe('a quiet shrine (below Tier VI)', () => {
  it('is one blessing, no wagers and no reel, and can be walked away from', () => {
    const r = shrineAt(GAMBLER_TIER - 1);
    expect(r.phase).toBe('shrine');
    expect(r.context?.gambler).toBeUndefined();
    expect(r.context?.event).toBeUndefined();
    expect(takeShrine(r, { kind: 'rest' }).phase).toBe('map');
    expect(() => takeShrine(r, { kind: 'ledger' })).toThrow(/Gambler/);
    const left = leaveShrine(r);
    expect(left.phase).toBe('map');
    expect(left.hp).toBe(r.hp);
  });
});

describe("the Gambler's Shrine", () => {
  it('gives two different blessings, then closes', () => {
    const r = shrineAt(GAMBLER_TIER);
    const g = r.context!.gambler!;
    expect(g.altar).toHaveLength(3);
    expect(parseRun(serializeRun(r))?.context?.gambler?.altar).toEqual(g.altar);
    const one = takeShrine(r, { kind: 'rest' });
    expect(one.phase).toBe('shrine');
    expect(() => takeShrine(one, { kind: 'rest' })).toThrow(/already/);
    const two = takeShrine(one, { kind: 'upgrade', card: 'strike' });
    expect(two.phase).toBe('map');
    expect(two.hp).toBeGreaterThan(r.hp);
  });

  it('the last blessing waits while a prize is on the reel, so the prize is never lost', () => {
    const one = takeShrine(shrineAt(GAMBLER_TIER), { kind: 'rest' });
    const spun = rollTrial(one);
    expect(spun.context?.event?.trial?.state).toBe('won');
    expect(() => takeShrine(spun, { kind: 'ledger' })).toThrow(/prize/);
    // the first blessing does not close the shrine, so it may be taken with a prize waiting
    const fresh = rollTrial(shrineAt(GAMBLER_TIER));
    expect(takeShrine(fresh, { kind: 'ledger' }).phase).toBe('shrine');
  });

  it('can be walked away from after one blessing, or none', () => {
    const r = shrineAt(GAMBLER_TIER);
    expect(leaveShrine(r).phase).toBe('map');
    expect(leaveShrine(takeShrine(r, { kind: 'rest' })).phase).toBe('map');
  });

  it('a sacrifice swaps a card of yours for one on the altar', () => {
    const r = shrineAt(GAMBLER_TIER);
    const take = r.context!.gambler!.altar[0]!;
    const done = takeShrine(r, { kind: 'sacrifice', card: 'defend', take });
    expect(done.deck).toContain(take);
    expect(done.deck).toHaveLength(r.deck.length);
    expect(done.deck.filter((c) => c === 'defend').length).toBe(
      r.deck.filter((c) => c === 'defend').length - 1,
    );
    expect(() => takeShrine(r, { kind: 'sacrifice', card: 'defend', take: 'strike' })).toThrow(
      /altar/,
    );
  });

  it('the altar holds rares from Tier X', () => {
    const g = shrineAt(10).context!.gambler!;
    for (const id of g.altar) expect(COMBAT_DB.cards[id]?.rarity).toBe('rare');
  });

  it('the Loaded Dice sanctify the card chosen, up or down, better odds deeper in', () => {
    expect(diceOdds(6)).toBe(60);
    expect(diceOdds(16)).toBe(80);
    expect(diceOdds(20)).toBe(80);
    const r = shrineAt(GAMBLER_TIER);
    const done = takeShrine(r, { kind: 'dice', card: 'strike' });
    const rolled = done.deck.filter((c) => rollOf(c) !== 0);
    expect(rolled).toHaveLength(1);
    expect(rolled[0]).toMatch(/^(hi|lo)~strike$/);
    expect(done.context?.gambler?.note).toMatch(/dice come up/);
    // a card already rolled cannot be rolled again
    const again = {
      ...done,
      context: { ...r.context!, gambler: { ...r.context!.gambler!, taken: [] } },
    };
    expect(() => takeShrine(again, { kind: 'dice', card: rolled[0]! })).toThrow();
  });

  it('the Chisel engraves its keyword', () => {
    const r = shrineAt(GAMBLER_TIER);
    const mark = r.context!.gambler!.chisel;
    const done = takeShrine(r, { kind: 'engrave', card: 'strike' });
    expect(done.deck.some((c) => markOf(c) === mark)).toBe(true);
    expect(parseRun(serializeRun(done))).not.toBeNull();
  });

  it('the Ledger gives Max HP, more each time it is signed this run', () => {
    const r = shrineAt(GAMBLER_TIER);
    expect(ledgerGain(r)).toBe(4);
    const once = takeShrine(r, { kind: 'ledger' });
    expect(once.maxHp).toBe(r.maxHp + 4);
    expect(once.hp).toBe(r.hp + 4);
    expect(once.ledger).toBe(1);
    expect(ledgerGain(once)).toBe(6);
    expect(parseRun(serializeRun(once))?.ledger).toBe(1);
  });

  it('the Brass Reel spins here, gives one prize, and the shrine stays open', () => {
    let claimed = 0;
    for (let i = 0; i < 12; i++) {
      const r = shrineAt(GAMBLER_TIER, `reel-${i}`);
      expect(r.context?.event?.trial).toBeDefined();
      const spun = rollTrial(r);
      expect(spun.phase).toBe('shrine');
      expect(parseRun(serializeRun(spun))?.phase).toBe('shrine');
      const t = spun.context!.event!.trial!;
      const lane = t.earned![0]!;
      const prize = t.prizes[lane]!;
      // (a choice of cards or of cards to give up: covered by trials.test.ts)
      if (prize.choices || prize.deal.some((d) => d.k === 'remove')) continue;
      const after = claimTrialPrize(spun, 'p' + lane);
      expect(after.phase).toBe('shrine');
      expect(after.context?.event).toBeUndefined();
      expect(after.context?.gambler?.taken).toEqual([]);
      claimed++;
    }
    expect(claimed).toBeGreaterThan(0);
  });
});

describe('a sanctified card is final (DECISIONS #327)', () => {
  const strike = 'strike';
  it('the dice never roll it again, and neither the chisel nor an engraver event gives it a tag', () => {
    const rolled = rolledId(strike, 1);
    expect(rollOf(rolled)).toBe(1);
    const deck = [rolled, strike, 'defend'];
    expect(diceable(deck)).not.toContain(rolled);
    expect(diceable(deck)).toContain(strike);
    for (const mark of ['hold', 'opening', 'flare'] as const) {
      expect(engravable(deck, mark)).not.toContain(rolled);
      expect(chooseable(deck, 'mark', mark)).not.toContain(rolled);
    }
    // a card engraved first can still be sanctified, but not the other way round
    expect(engravable([strike], 'hold')).toContain(strike);
    expect(chooseable([strike], 'mark', 'hold')).toContain(strike);
  });
});
