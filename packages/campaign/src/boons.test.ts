import { describe, expect, it } from 'vitest';
import { BOONS, COMBAT_DB, RIFTWALKERS } from '@sr/content/v2';
import {
  RunError,
  buyBoon,
  buyPotion,
  sellPotion,
  chooseEvent,
  enterNode,
  finishDuel,
  newRun,
  parseRun,
  type RunState,
} from './index';

/** Most tests are about the map and what is on it: step past the opening choice without taking anything from it. */
const open = (r: RunState): RunState => ({ ...r, phase: 'map', context: null });
const fresh = (hero: 'maren' | 'kesh' | 'vesper', seed: string): RunState =>
  open(newRun(hero, seed, 'normal'));

const inFight = (base: RunState, kind: 'elite' | 'warden' | 'duel'): RunState => {
  const n = base.map.nodes.find((x) => x.kind === kind);
  if (!n) throw new Error(`no ${kind} node on this map`);
  return { ...base, phase: 'duel', at: n.id, context: { nodeId: n.id } };
};

describe('boons in a run', () => {
  it('a Warden win drops a boon you did not own; max HP applies', () => {
    for (let i = 0; i < 20; i++) {
      const run = { ...inFight(fresh('maren', `boon${i}`), 'warden'), hp: 30 };
      const won = finishDuel(run, true, 30);
      const id = won.context?.boonGained as string;
      expect(won.boons).toEqual([id]);
      const b = BOONS.find((x) => x.id === id);
      expect(b).toBeDefined();
      expect(won.maxHp).toBe(RIFTWALKERS.maren.hero.maxHp + (b?.maxHp ?? 0));
    }
  });

  it('never drops a boon you already have', () => {
    const owned = BOONS.slice(0, BOONS.length - 1).map((b) => b.id);
    const run = { ...inFight(fresh('maren', 'owned'), 'warden'), boons: owned, hp: 30 };
    const won = finishDuel(run, true, 30);
    expect(won.boons).toHaveLength(BOONS.length);
    expect(new Set(won.boons).size).toBe(BOONS.length);
  });

  it('a Healing Vial heals after every fight and a Shard Purse pays extra', () => {
    const base = { ...fresh('maren', 'vial'), boons: ['healing-vial', 'coin-purse'] };
    const won = finishDuel({ ...inFight(base, 'duel'), hp: 30 }, true, 30);
    expect(won.hp).toBe(36);
    expect(won.shards).toBe(12 + 10);
  });

  it('the merchant sells one boon, once', () => {
    const base = { ...fresh('kesh', 'mb'), shards: 500 };
    const first = base.map.nodes[0] as RunState['map']['nodes'][number];
    const shop: RunState = {
      ...base,
      phase: 'merchant',
      at: first.id,
      context: {
        nodeId: first.id,
        merchant: {
          items: [],
          removePrice: 40,
          removed: false,
          boon: { id: 'crystal-heart', price: 120, sold: false },
        },
      },
    };
    const bought = buyBoon(shop);
    expect(bought.boons).toEqual(['crystal-heart']);
    expect(bought.maxHp).toBe(RIFTWALKERS.kesh.hero.maxHp + 12);
    expect(bought.shards).toBe(380);
    expect(() => buyBoon(bought)).toThrow(RunError);
    expect(() => buyBoon({ ...shop, shards: 10 })).toThrow(RunError);
  });

  it('saves refuse unknown or repeated boons', () => {
    const r = fresh('vesper', 'sv');
    expect(parseRun(JSON.stringify({ ...r, boons: ['nope'] }))).toBeNull();
    expect(parseRun(JSON.stringify({ ...r, boons: ['iron-sigil', 'iron-sigil'] }))).toBeNull();
    expect(parseRun(JSON.stringify({ ...r, boons: ['iron-sigil'] }))).not.toBeNull();
  });
});

describe("the Warden's Gift", () => {
  it('offers only rare (or legendary) cards of your own class, whichever Warden fell', () => {
    for (const boss of ['seraphine', 'kron', 'gorrmaw', 'nyxara']) {
      const base = fresh('maren', `gift-${boss}`);
      const nodes = base.map.nodes.map((n) => (n.kind === 'warden' ? { ...n, enemyId: boss } : n));
      const run = { ...inFight({ ...base, map: { ...base.map, nodes } }, 'warden'), hp: 30 };
      const offers = finishDuel(run, true, 30).context?.offers ?? [];
      expect(offers.length).toBeGreaterThanOrEqual(3);
      for (const id of offers) {
        expect(COMBAT_DB.cards[id]?.hero, id).toBe('maren');
        expect(['rare', 'legendary']).toContain(COMBAT_DB.cards[id]?.rarity);
      }
    }
  });
});

describe('events', () => {
  it('a seed variety of events all resolve, and the altar and smith do what they say', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) {
      let r = open(newRun('maren', `event-${i}`, 'normal'));
      // walk to the first event node by forcing one
      const ev = r.map.nodes.find((n) => n.kind === 'event');
      if (!ev) continue;
      r = {
        ...r,
        at: null,
        cleared: [],
        map: { ...r.map, nodes: r.map.nodes.map((n) => (n.id === ev.id ? { ...n, floor: 1 } : n)) },
      };
      const entered = enterNode(r, ev.id);
      const e = entered.context?.event;
      if (!e) continue;
      seen.add(e.title);
      for (const o of e.options) {
        const done = chooseEvent(entered, o.id);
        expect(done.phase).toBe('map');
        if (o.id === 'bleed') expect(done.hp).toBe(entered.hp - 10);
        if (o.id === 'boon') expect(done.boons).toHaveLength(1);
        if (o.id === 'upgrade') expect(done.deck.some((c) => c.endsWith('+'))).toBe(true);
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(2);
  });
});

describe('potions in a run', () => {
  it('unused potions come with you, used ones are gone, and a lost fight keeps them all', () => {
    const base = {
      ...fresh('maren', 'pots'),
      potions: ['fire-flask', 'guard-draught', 'mana-vial'],
    };
    const fight = inFight(base, 'duel');
    const won = finishDuel(fight, true, 40, ['guard-draught']);
    // 'fire-flask' and 'mana-vial' were drunk; a new one may have dropped into a free slot
    expect(won.potions[0]).toBe('guard-draught');
    expect(won.potions.length).toBeLessThanOrEqual(3);
    const lost = finishDuel(fight, false);
    expect(lost.potions).toEqual(['fire-flask', 'guard-draught', 'mana-vial']);
  });

  it('never carries more than three, and cannot invent potions', () => {
    const base = {
      ...fresh('maren', 'full'),
      potions: ['fire-flask', 'guard-draught', 'mana-vial'],
    };
    for (let i = 0; i < 10; i++) {
      const won = finishDuel(inFight({ ...base, seed: `s${i}` }, 'duel'), true, 40, base.potions);
      expect(won.potions).toHaveLength(3);
    }
    const won = finishDuel(inFight(base, 'duel'), true, 40, ['stun-tonic', 'fire-flask']);
    expect(won.potions.includes('stun-tonic')).toBe(false);
  });

  it('the merchant sells potions while there is room', () => {
    const base = { ...fresh('kesh', 'shop'), shards: 200 };
    const first = base.map.nodes[0] as RunState['map']['nodes'][number];
    const shop: RunState = {
      ...base,
      phase: 'merchant',
      at: first.id,
      context: {
        nodeId: first.id,
        merchant: {
          items: [],
          removePrice: 40,
          removed: false,
          potions: [{ id: 'fire-flask', price: 30, sold: false }],
        },
      },
    };
    const bought = buyPotion(shop, 0);
    expect(bought.potions).toEqual(['fire-flask']);
    expect(bought.shards).toBe(170);
    expect(() => buyPotion(bought, 0)).toThrow(RunError);
    // and a potion from the belt can be sold back for half its price
    const sold = sellPotion(bought, 0);
    expect(sold.potions).toEqual([]);
    expect(sold.shards).toBe(170 + 15);
    expect(() => sellPotion(sold, 0)).toThrow(RunError);
    expect(() =>
      buyPotion({ ...shop, potions: ['a', 'b', 'c'].map(() => 'fire-flask') }, 0),
    ).toThrow(RunError);
  });

  it('saves refuse unknown potions or more than three', () => {
    const r = fresh('vesper', 'sp');
    expect(parseRun(JSON.stringify({ ...r, potions: ['nope'] }))).toBeNull();
    expect(parseRun(JSON.stringify({ ...r, potions: Array(4).fill('fire-flask') }))).toBeNull();
    expect(parseRun(JSON.stringify({ ...r, potions: ['fire-flask'] }))).not.toBeNull();
  });
});
