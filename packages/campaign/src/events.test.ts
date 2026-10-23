import { describe, expect, it } from 'vitest';
import { applyAction, createCombat, legalActions, clone, cardText } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, rollOf, stripRoll } from '@sr/content/v2';
import {
  availableNodes,
  canAdd,
  chooseEvent,
  enterNode,
  newRun,
  parseRun,
  serializeRun,
  takeShrine,
  type RunState,
} from './index';
import { EVENTS, resolveEvent } from './events';
import type { DealStep } from './types';

const open = (r: RunState): RunState => ({ ...r, phase: 'map', context: null });

function eventRun(seed: string, over: Partial<RunState> = {}): RunState {
  const kind = 'event';
  const base = open(newRun('maren', seed));
  const node = availableNodes(base)[0]!;
  const asEvent: RunState = {
    ...base,
    hp: 60,
    shards: 200,
    ...over,
    map: { ...base.map, nodes: base.map.nodes.map((n) => (n.id === node.id ? { ...n, kind } : n)) },
  };
  return enterNode(asEvent, node.id);
}

describe('events', () => {
  it('are varied and random, and a card is on offer only now and then', () => {
    const titles = new Map<string, number>();
    let withCard = 0;
    const N = 600;
    for (let i = 0; i < N; i++) {
      const ev = eventRun(`ev-${i}`).context!.event!;
      titles.set(ev.title, (titles.get(ev.title) ?? 0) + 1);
      if (ev.options.some((o) => o.id === 'card' || o.id === 'ancestor')) withCard++;
    }
    expect(titles.size).toBeGreaterThanOrEqual(9);
    // no single event takes over
    expect(Math.max(...titles.values()) / N).toBeLessThan(0.3);
    expect(withCard / N).toBeLessThan(0.3);
    expect(withCard).toBeGreaterThan(0);
  });

  it('every option of every event resolves, says what happened, and leaves a sane run', () => {
    for (const def of EVENTS) {
      const first = eventRun(`def-${def.id}`);
      // a deck with one non-basic card in it, so every event has something to work with
      const base: RunState = { ...first, deck: [...first.deck, 'gilded-bastion'] };
      expect(def.when(base), def.id).toBe(true);
      const ev = def.build(base);
      expect(ev.options.length, def.id).toBeGreaterThanOrEqual(2);
      for (const o of ev.options) {
        const r = clone(base);
        const msg = resolveEvent(r, o.id, ev, {
          gainBoon: (run, id) => void run.boons.push(id),
          fail: (m) => {
            throw new Error(`${def.id}/${o.id}: ${m}`);
          },
        });
        expect(msg.length, `${def.id}/${o.id}`).toBeGreaterThan(5);
        expect(r.hp).toBeGreaterThanOrEqual(1);
        expect(r.shards).toBeGreaterThanOrEqual(0);
        for (const id of r.deck)
          expect(COMBAT_DB.cards[id], `${def.id}/${o.id} ${id}`).toBeTruthy();
      }
    }
  });

  it('and the result is shown through the run (eventResult)', () => {
    const e = eventRun('result-1');
    const leave = chooseEvent(e, 'leave');
    expect(leave.eventResult).toBeTruthy();
    expect(leave.phase).toBe('map');
  });
});

describe('sanctifying the deck', () => {
  const sanctified = (): RunState => {
    for (let i = 0; i < 2000; i++) {
      const e = eventRun(`sanct-${i}`);
      if (e.context!.event!.options.some((o) => o.id === 'sanctify'))
        return chooseEvent(e, 'sanctify');
    }
    throw new Error('no Sanctum event in 2000 seeds');
  };

  it('rolls every card that has numbers 25% up or down, about half each, and keeps the rest', () => {
    const before = open(newRun('maren', 'sanct-base')).deck.length;
    const r = sanctified();
    expect(r.deck).toHaveLength(before);
    const up = r.deck.filter((id) => rollOf(id) === 1).length;
    const down = r.deck.filter((id) => rollOf(id) === -1).length;
    // each card has a one-in-five chance of being left alone, so a few untouched cards are normal
    expect(up + down).toBeGreaterThanOrEqual(before - 4);
    expect(up).toBeGreaterThan(0);
    expect(down).toBeGreaterThan(0);
    expect(r.eventResult).toMatch(/rise/);
  });

  it('a rolled card is the same card with its numbers scaled, and is never listed as a card of its own', () => {
    const base = COMBAT_DB.cards['strike']!;
    const hi = COMBAT_DB.cards['hi~strike']!;
    const lo = COMBAT_DB.cards['lo~strike']!;
    const dmg = (c: typeof base): number => (c.effects[0] as { amount: number }).amount;
    expect(dmg(hi)).toBeGreaterThan(dmg(base));
    expect(dmg(lo)).toBeLessThan(dmg(base));
    expect(hi.name).toContain('▲');
    expect(lo.name).toContain('▼');
    expect(cardText(COMBAT_DB, hi)).not.toBe(cardText(COMBAT_DB, base));
    expect(Object.keys(COMBAT_DB.cards).some((k) => k.includes('~'))).toBe(false);
    expect(COMBAT_DB.cards['hi~no-such-card']).toBeUndefined();
    expect(COMBAT_DB.cards['hi~draw-only-card']).toBeUndefined();
  });

  it('plays for real, saves and loads, shares one copy limit with its plain card, and upgrades as itself', () => {
    const { state } = createCombat(COMBAT_DB, {
      seed: 's',
      a: { hero: 'maren', deck: ['hi~strike', 'lo~strike', ...RIFTWALKERS.maren.starter] },
      b: { enemies: ['squire'] },
    });
    const s = clone(state);
    s.sides.a.hand = [
      { id: 'H', card: 'hi~strike' },
      { id: 'L', card: 'lo~strike' },
    ];
    const foe = s.sides.b.units[0]!;
    foe.hp = foe.maxHp = 100;
    const play = (st: typeof s, id: string) =>
      applyAction(
        COMBAT_DB,
        st,
        legalActions(COMBAT_DB, st).find((a) => a.type === 'play' && a.card === id)!,
      ).state;
    const after = play(play(s, 'H'), 'L');
    const dealt = 100 - after.sides.b.units[0]!.hp;
    // the rolled cards deal their own, scaled, damage
    expect(dealt).toBe(
      (COMBAT_DB.cards['hi~strike']!.effects[0] as { amount: number }).amount +
        (COMBAT_DB.cards['lo~strike']!.effects[0] as { amount: number }).amount,
    );
    const run = sanctified();
    const back = parseRun(serializeRun(run));
    expect(back?.deck).toEqual(run.deck);
    // one copy limit is shared with the plain card and the upgraded one
    const rare = Object.values(COMBAT_DB.cards).find(
      (c) => c.rarity === 'legendary' && c.hero === 'maren',
    )!;
    expect(canAdd([`hi~${rare.id}`], rare.id)).toBe(false);
    expect(stripRoll(`lo~${rare.id}+`)).toBe(`${rare.id}+`);
    // the shrine upgrades a rolled card into the rolled upgrade
    const shrine: RunState = {
      ...open(newRun('maren', 'shr')),
      phase: 'shrine',
      context: { nodeId: 'x' },
      deck: [...RIFTWALKERS.maren.starter, 'hi~strike'],
    };
    const up = takeShrine(
      { ...shrine, map: { ...shrine.map } },
      { kind: 'upgrade', card: 'hi~strike' },
    );
    expect(up.deck).toContain('hi~strike+');
  });
});

describe('the data-driven events', () => {
  const helpers = {
    gainBoon: (run: RunState, id: string): void => void run.boons.push(id),
    fail: (m: string): never => {
      throw new Error(m);
    },
  };
  const ctxOf = (r: RunState) => r.context!.event!;

  it('there are about fifty events, each with its own id', () => {
    expect(EVENTS.length).toBeGreaterThanOrEqual(45);
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(EVENTS.length);
  });

  it('every option of every event can be taken from many different runs, and leaves a sane run', () => {
    const states: Partial<RunState>[] = [
      { hp: 60, shards: 200 },
      { hp: 12, shards: 10 },
      { hp: 30, shards: 0 },
      { hp: 66, shards: 500, potions: ['fire-flask', 'fire-flask', 'fire-flask'] },
      { hp: 25, shards: 60, boons: Object.keys(COMBAT_DB.boons) },
    ];
    for (let i = 0; i < 120; i++) {
      const s = states[i % states.length]!;
      const r0 = eventRun(`stress-${i}`, s);
      const ev = ctxOf(r0);
      for (const o of ev.options) {
        const r = clone(r0);
        const msg = resolveEvent(r, o.id, ev, helpers);
        expect(msg.length, `${ev.title}/${o.id}`).toBeGreaterThan(3);
        expect(r.hp, `${ev.title}/${o.id} hp`).toBeGreaterThanOrEqual(1);
        expect(r.hp).toBeLessThanOrEqual(r.maxHp);
        expect(r.shards, `${ev.title}/${o.id} shards`).toBeGreaterThanOrEqual(0);
        expect(r.maxHp).toBeGreaterThanOrEqual(30);
        expect(r.potions.length).toBeLessThanOrEqual(3);
        for (const id of r.deck) expect(COMBAT_DB.cards[id], `${ev.title} ${id}`).toBeTruthy();
      }
    }
  });

  it('an event is not offered when its price cannot be paid', () => {
    const poor: RunState = { ...eventRun('poor-1'), hp: 5, shards: 0 };
    const ferry = EVENTS.find((e) => e.id === 'ferry')!;
    expect(ferry.when(poor)).toBe(false); // the fare is 30 shards and the wade costs 8 HP
    expect(ferry.when({ ...poor, hp: 60, shards: 40 })).toBe(true);
    const beggar = EVENTS.find((e) => e.id === 'beggar')!;
    expect(beggar.when({ ...poor, shards: 40 })).toBe(false); // the big gift needs 60
    // a Boon event needs a Boon left to give
    const reliquary = EVENTS.find((e) => e.id === 'reliquary')!;
    const allOwned = { ...eventRun('boons'), boons: Object.keys(COMBAT_DB.boons) };
    expect(reliquary.when(allOwned)).toBe(false);
  });

  it('the steps do what they say', () => {
    const base = { ...eventRun('steps-1'), hp: 40, shards: 100, potions: [] as string[] };
    const run = (...deal: DealStep[]): RunState => {
      const r = clone(base);
      const ev = { title: 't', text: 't', cardOffer: '', options: [] };
      const o = { id: 'd1' as const, label: 'x', deal };
      resolveEvent(r, 'd1', { ...ev, options: [o] }, helpers);
      return r;
    };
    expect(run({ k: 'shards', n: -30 }).shards).toBe(70);
    expect(run({ k: 'hurt', n: 10 }).hp).toBe(30);
    expect(run({ k: 'maxHp', n: 5 }).maxHp).toBe(base.maxHp + 5);
    expect(run({ k: 'maxHp', n: -5 }).maxHp).toBe(base.maxHp - 5);
    expect(run({ k: 'wound', n: 2 }).deck.filter((c) => c === 'wound').length).toBe(2);
    expect(run({ k: 'potion', n: 2 }).potions.length).toBe(2);
    expect(run({ k: 'remove', of: 'basic', n: 2 }).deck.length).toBe(base.deck.length - 2);
    expect(run({ k: 'gift', rarity: 'common' }).deck.length).toBe(base.deck.length + 1);
    expect(() => run({ k: 'hurt', n: 40 })).toThrow();
    expect(() => run({ k: 'shards', n: -500 })).toThrow();
    // a chance runs one branch
    const lucky = run({
      k: 'chance',
      pct: 100,
      win: [{ k: 'shards', n: 7 }],
      lose: [{ k: 'hurt', n: 1 }],
    });
    expect(lucky.shards).toBe(107);
    expect(lucky.hp).toBe(40);
  });
});
