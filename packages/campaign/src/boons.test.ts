import { describe, expect, it } from 'vitest';
import { BOONS, signatureCards } from '@sr/content/v2';
import {
  RunError,
  buyBoon,
  chooseEvent,
  enterNode,
  finishDuel,
  newRun,
  parseRun,
  type RunState,
} from './index';

const fresh = (hero: 'maren' | 'kesh' | 'vesper', seed: string): RunState =>
  newRun(hero, seed, 'normal');

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
      expect(won.maxHp).toBe(80 + (b?.maxHp ?? 0));
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
    expect(bought.maxHp).toBe(76 + 12);
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
  it("offers that Warden's own signature cards", () => {
    for (const boss of ['seraphine', 'kron', 'gorrmaw', 'nyxara']) {
      const base = fresh('maren', `gift-${boss}`);
      const nodes = base.map.nodes.map((n) => (n.kind === 'warden' ? { ...n, enemyId: boss } : n));
      const run = { ...inFight({ ...base, map: { ...base.map, nodes } }, 'warden'), hp: 30 };
      const offers = finishDuel(run, true, 30).context?.offers ?? [];
      expect([...offers].sort()).toEqual([...signatureCards(boss)].sort());
    }
  });
});

describe('events', () => {
  it('a seed variety of events all resolve, and the altar and smith do what they say', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) {
      let r = newRun('maren', `event-${i}`, 'normal');
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
