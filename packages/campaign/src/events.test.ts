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

const open = (r: RunState): RunState => ({ ...r, phase: 'map', context: null });

function eventRun(seed: string, kind: 'event' = 'event'): RunState {
  const base = open(newRun('maren', seed));
  const node = availableNodes(base)[0]!;
  const asEvent: RunState = {
    ...base,
    hp: 60,
    shards: 200,
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
    expect(up + down).toBeGreaterThanOrEqual(before - 2);
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
