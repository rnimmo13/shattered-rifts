import { describe, expect, it } from 'vitest';
import { seedRng } from '@sr/combat';
import { BOONS, COMBAT_DB, RIFTWALKERS } from '@sr/content/v2';
import {
  RunError,
  buyBoon,
  boonOfRarity,
  holdsLegendBoon,
  offerBoon,
  buyPotion,
  sellPotion,
  chooseCard,
  chooseEvent,
  pickEventCard,
  pickDeckCard,
  enterNode,
  finishDuel,
  resolveCost,
  newRun,
  parseRun,
  type RunState,
} from './index';

/** Most tests are about the map and what is on it: step past the opening choice without taking anything from it. */
const open = (r: RunState): RunState => ({ ...r, phase: 'map', context: null });
const fresh = (hero: 'knight' | 'hunter' | 'trickster', seed: string): RunState =>
  open(newRun(hero, seed, 'normal'));

const inFight = (base: RunState, kind: 'elite' | 'warden' | 'duel'): RunState => {
  const n = base.map.nodes.find((x) => x.kind === kind);
  if (n) return { ...base, phase: 'duel', at: n.id, context: { nodeId: n.id } };
  // (not every map has an Elite: make a fight node one)
  const d = base.map.nodes.find((x) => x.kind === 'duel');
  if (!d || kind !== 'elite') throw new Error(`no ${kind} node on this map`);
  const map = {
    ...base.map,
    nodes: base.map.nodes.map((x) =>
      x.id === d.id ? { ...x, kind: 'elite' as const, enemyId: 'aldric' } : x,
    ),
  };
  return { ...base, map, phase: 'duel', at: d.id, context: { nodeId: d.id } };
};

describe('boons in a run', () => {
  it('an Elite win drops a boon you did not own (a Warden gives its Gift instead); max HP applies', () => {
    const warden = finishDuel(
      { ...inFight(fresh('knight', 'boon-w'), 'warden'), hp: 30 },
      true,
      30,
    );
    expect(warden.boons).toEqual([]);
    for (let i = 0; i < 20; i++) {
      const run = { ...inFight(fresh('knight', `boon${i}`), 'elite'), hp: 30 };
      const won = finishDuel(run, true, 30);
      const id = won.context?.boonGained as string;
      expect(won.boons).toEqual([id]);
      const b = BOONS.find((x) => x.id === id);
      expect(b).toBeDefined();
      expect(won.maxHp).toBe(RIFTWALKERS.knight.hero.maxHp + (b?.maxHp ?? 0));
    }
  });

  it('never drops a boon you already have, and never falls back to a Legendary one', () => {
    const plain = BOONS.filter((b) => b.rarity !== 'legendary');
    const owned = plain.slice(0, plain.length - 1).map((b) => b.id);
    const run = { ...inFight(fresh('knight', 'owned'), 'elite'), boons: owned, hp: 30 };
    const won = finishDuel(run, true, 30);
    // the one plain Boon left, or (3% of the time) a Legendary rolled on purpose
    const got = won.boons.filter((b) => !owned.includes(b));
    expect(got).toHaveLength(1);
    expect(new Set(won.boons).size).toBe(won.boons.length);
    // with every plain Boon owned, an Elite gives a Legendary only when it rolls one (never as a fallback)
    const allPlain = { ...run, boons: plain.map((b) => b.id) };
    let legends = 0;
    for (let k = 0; k < 40; k++) {
      const w = finishDuel({ ...allPlain, seed: `full-${k}`, rng: seedRng(`full-${k}`) }, true, 30);
      legends += w.boons.length - plain.length;
    }
    expect(legends).toBeLessThan(10);
  });

  it('a Healing Vial heals after every fight and a Shard Purse pays extra', () => {
    const base = { ...fresh('knight', 'vial'), boons: ['healing-vial', 'coin-purse'] };
    const won = finishDuel({ ...inFight(base, 'duel'), hp: 30 }, true, 30);
    expect(won.hp).toBe(36);
    expect(won.shards).toBe(15 + 10);
  });

  it('the merchant sells one boon, once', () => {
    const base = { ...fresh('hunter', 'mb'), shards: 500 };
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
    expect(bought.maxHp).toBe(RIFTWALKERS.hunter.hero.maxHp + 12);
    expect(bought.shards).toBe(380);
    expect(() => buyBoon(bought)).toThrow(RunError);
    expect(() => buyBoon({ ...shop, shards: 10 })).toThrow(RunError);
  });

  it('saves refuse unknown boons, hold a repeated one once, and turn the retired Ward Stone into an Iron Sigil (DECISIONS #462)', () => {
    const r = fresh('trickster', 'sv');
    expect(parseRun(JSON.stringify({ ...r, boons: ['nope'] }))).toBeNull();
    expect(parseRun(JSON.stringify({ ...r, boons: ['iron-sigil', 'iron-sigil'] }))?.boons).toEqual(['iron-sigil']);
    expect(parseRun(JSON.stringify({ ...r, boons: ['iron-sigil'] }))).not.toBeNull();
    expect(parseRun(JSON.stringify({ ...r, boons: ['ward-stone'] }))?.boons).toEqual(['iron-sigil']);
    expect(parseRun(JSON.stringify({ ...r, boons: ['ward-stone', 'iron-sigil'] }))?.boons).toEqual(['iron-sigil']);
  });

  it('Aegis of Ages gives one Shielded, and there is no other Shielded Boon but the Warded Heart', () => {
    expect(COMBAT_DB.boons['aegis-of-ages']?.fightStart?.[0]).toMatchObject({ status: 'shielded', amount: 1 });
    expect(COMBAT_DB.boons['ward-stone']).toBeUndefined();
    const shielded = Object.values(COMBAT_DB.boons).filter((x) => x.fightStart?.some((o) => o.op === 'status' && o.status === 'shielded'));
    expect(shielded.map((x) => x.id).sort()).toEqual(['aegis-of-ages', 'warded-heart']);
  });
});

describe("the Warden's Gift", () => {
  it('offers only rare (or legendary) cards of your own class, whichever Warden fell', () => {
    for (const boss of ['seraphine', 'kron', 'gorrmaw', 'nyxara']) {
      const base = fresh('knight', `gift-${boss}`);
      const nodes = base.map.nodes.map((n) => (n.kind === 'warden' ? { ...n, enemyId: boss } : n));
      const run = { ...inFight({ ...base, map: { ...base.map, nodes } }, 'warden'), hp: 30 };
      const offers = finishDuel(run, true, 30).context?.offers ?? [];
      expect(offers.length).toBeGreaterThanOrEqual(3);
      for (const id of offers) {
        expect(COMBAT_DB.cards[id]?.hero, id).toBe('knight');
        expect(['rare', 'legendary']).toContain(COMBAT_DB.cards[id]?.rarity);
      }
    }
  });
});

describe('events', () => {
  it('a seed variety of events all resolve, and the altar and smith do what they say', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) {
      let r = open(newRun('knight', `event-${i}`, 'normal'));
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
        if (o.id === 'trial') continue; // (a puzzle: see trials.test.ts)
        let done = chooseEvent(entered, o.id);
        // (an event may wait for one of three cards to be picked, or for a card of your deck)
        if (done.context?.event?.choose) done = pickEventCard(done, 0);
        const deckPick = done.context?.event?.chooseDeck;
        if (deckPick) done = pickDeckCard(done, deckPick.cards[0]!);
        // (or turn into a fight: won here, and its reward skipped)
        if (done.phase === 'duel') done = chooseCard(finishDuel(done, true, done.hp), null);
        expect(done.phase).toBe('map');
        if (o.id === 'bleed') expect(done.hp).toBe(entered.hp - 10);
        if (o.id === 'boon') expect(done.boons).toHaveLength(1);
        if (o.id === 'upgrade') expect(done.deck.some((c) => c.endsWith('+'))).toBe(true);
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(2);
  }, 30_000); // (about 2 s alone; past the default 5 s under a full parallel run)
});

describe('potions in a run', () => {
  it('unused potions come with you, used ones are gone, and a lost fight keeps them all', () => {
    const base = {
      ...fresh('knight', 'pots'),
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
      ...fresh('knight', 'full'),
      potions: ['fire-flask', 'guard-draught', 'mana-vial'],
    };
    for (let i = 0; i < 10; i++) {
      const won = finishDuel(inFight({ ...base, seed: `s${i}` }, 'duel'), true, 40, base.potions);
      expect(won.potions).toHaveLength(3);
    }
    const won = finishDuel(inFight(base, 'duel'), true, 40, ['stun-tonic', 'fire-flask']);
    // (only what the run held, plus at most the one a won fight may drop)
    expect(won.potions.filter((p) => !base.potions.includes(p)).length).toBeLessThanOrEqual(1);
    expect(won.potions.filter((p) => p === 'stun-tonic').length).toBeLessThanOrEqual(1);
  });

  it('the merchant sells potions while there is room', () => {
    const base = { ...fresh('hunter', 'shop'), shards: 200 };
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
    const r = fresh('trickster', 'sp');
    expect(parseRun(JSON.stringify({ ...r, potions: ['nope'] }))).toBeNull();
    expect(parseRun(JSON.stringify({ ...r, potions: Array(4).fill('fire-flask') }))).toBeNull();
    expect(parseRun(JSON.stringify({ ...r, potions: ['fire-flask'] }))).not.toBeNull();
  });
});

describe('what a lost fight costs in Resolve', () => {
  it('a Warden costs 1 (a run on 2 Resolve survives it), an Elite 2', () => {
    expect(resolveCost('duel')).toBe(1);
    expect(resolveCost('warden')).toBe(1);
    expect(resolveCost('elite')).toBe(2);
    const lost = finishDuel(
      { ...inFight(fresh('knight', 'resolve-w'), 'warden'), resolve: 2 },
      false,
    );
    expect(lost.resolve).toBe(1);
    expect(lost.phase).toBe('duel');
    const last = finishDuel(
      { ...inFight(fresh('knight', 'resolve-w1'), 'warden'), resolve: 1 },
      false,
    );
    expect(last.phase).toBe('collapsed');
  });
});

describe('a lost fight is retried at full HP (DECISIONS #289, #355)', () => {
  it('spending Resolve heals you completely, however hurt you came in', () => {
    for (const hp of [10, 70]) {
      const r = finishDuel(
        { ...inFight(fresh('knight', `retry-${hp}`), 'warden'), resolve: 2, hp },
        false,
      );
      expect(r.phase).toBe('duel');
      expect(r.hp).toBe(r.maxHp);
    }
  });
});

describe('one Legendary Boon per run (DECISIONS #293)', () => {
  const legends = BOONS.filter((b) => b.rarity === 'legendary').map((b) => b.id);
  it('holding one, no offer or gift is ever another Legendary', () => {
    const owned = [legends[0] as string];
    expect(holdsLegendBoon(owned)).toBe(true);
    expect(holdsLegendBoon([])).toBe(false);
    for (let i = 0; i < 300; i++) {
      const rng = seedRng(`legend-cap${i}`);
      const a = offerBoon(rng, owned, 'elite');
      const b = boonOfRarity(rng, owned, 'legendary');
      for (const id of [a, b]) if (id) expect(COMBAT_DB.boons[id]?.rarity).not.toBe('legendary');
    }
  });
  it('without one, a Legendary can still be asked for', () => {
    const id = boonOfRarity(seedRng('legend-free'), [], 'legendary');
    expect(legends).toContain(id);
  });
});
