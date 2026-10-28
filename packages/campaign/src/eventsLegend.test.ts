// The third event batch (DECISIONS #238): the reliquary trades a Legendary for another, and the deck keeps its one-Legendary limit.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { COMBAT_DB, RIFTWALKERS, lendLegendaries, stripRoll } from '@sr/content/v2';
import { availableNodes, chooseEvent, enterNode, newRun, type RunState } from './index';
import { LEGEND_EVENTS } from './eventsLegend';

// Legendary is put away (DECISIONS #363): the shelved cards are lent as Legendaries so the reliquary stays tested
let undo = (): void => {};
beforeAll(() => {
  undo = lendLegendaries(COMBAT_DB);
});
afterAll(() => undo());

const legendsIn = (deck: readonly string[]): string[] =>
  deck.filter((id) => COMBAT_DB.cards[stripRoll(id).replace(/\+$/, '')]?.rarity === 'legendary');

/** a run standing at the given event, with this deck */
function at(id: string, deck: string[], seed = 'legend'): RunState {
  const base: RunState = { ...newRun('engineer', `${seed}-${id}`), phase: 'map', context: null };
  const node = availableNodes(base)[0]!;
  const r: RunState = {
    ...base,
    hp: 60,
    shards: 200,
    deck,
    map: {
      ...base.map,
      nodes: base.map.nodes.map((n) => (n.id === node.id ? { ...n, kind: 'event' } : n)),
    },
  };
  const entered = enterNode(r, node.id);
  const def = LEGEND_EVENTS.find((e) => e.id === id)!;
  expect(def.when(entered)).toBe(true);
  return { ...entered, phase: 'event', context: { nodeId: node.id, event: def.build(entered) } };
}

describe('the reliquary of legends', () => {
  const deck = [...RIFTWALKERS.engineer.starter, 'overclocked-legion+'];

  it('is only met with a Legendary in the deck', () => {
    const def = LEGEND_EVENTS.find((e) => e.id === 'legend-reliquary')!;
    const r = at('legend-reliquary', deck);
    expect(def.when({ ...r, deck: [...RIFTWALKERS.engineer.starter] })).toBe(false);
  });

  it('swaps your Legendary for the one you choose (upgraded, as yours was), one of them Rift-crossed, or lets you keep it', () => {
    for (const seed of ['a', 'b', 'c', 'd']) {
      const r = at('legend-reliquary', deck, seed);
      const ev = r.context!.event!;
      const swaps = ev.options.filter((o) => o.deal);
      expect(swaps.length).toBeGreaterThanOrEqual(2);
      expect(ev.options.some((o) => o.id === 'leave')).toBe(true);
      expect(swaps.some((o) => /Rift-crossed/.test(o.label))).toBe(true);
      for (const o of swaps) {
        const done = chooseEvent(r, o.id);
        const held = legendsIn(done.deck);
        expect(held).toHaveLength(1);
        expect(held[0]).not.toBe('overclocked-legion+');
        expect(held[0]!.endsWith('+')).toBe(true);
        expect(done.deck).toHaveLength(deck.length);
      }
      const kept = chooseEvent(r, 'leave');
      expect(legendsIn(kept.deck)).toEqual(['overclocked-legion+']);
    }
  });
});

describe('a deck from before the one-Legendary limit', () => {
  it('can still use the reliquary: one of its two Legendaries is traded, in place', () => {
    const two = [...RIFTWALKERS.engineer.starter, 'overclocked-legion', 'drone-apotheosis'];
    const r = at('legend-reliquary', two, 'old');
    const swaps = r.context!.event!.options.filter((o) => o.deal);
    expect(swaps.length).toBeGreaterThanOrEqual(2);
    for (const o of swaps) {
      const done = chooseEvent(r, o.id);
      expect(legendsIn(done.deck)).toHaveLength(2);
      expect(done.deck).toHaveLength(two.length);
    }
  });
});

describe('the new events', () => {
  it('each can be met and every option resolves', () => {
    for (const def of LEGEND_EVENTS) {
      if (def.id === 'legend-reliquary') continue;
      const r = at(def.id, [...RIFTWALKERS.knight.starter, 'cold-stare']);
      for (const o of r.context!.event!.options) {
        const done = chooseEvent(r, o.id);
        expect(done.hp).toBeGreaterThanOrEqual(1);
        expect(['map', 'event', 'duel']).toContain(done.phase);
      }
    }
  });
});
