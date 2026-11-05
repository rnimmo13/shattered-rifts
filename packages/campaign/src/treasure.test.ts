import { describe, expect, it } from 'vitest';
import { clone } from '@sr/combat';
import { COMBAT_DB } from '@sr/content/v2';
import {
  availableNodes,
  chooseEvent,
  enterNode,
  newRun,
  parseRun,
  pickEventCard,
  serializeRun,
} from './index';
import { EVENTS, resolveEvent } from './events';
import type { RunState } from './types';

const base = (): RunState => ({
  ...newRun('knight', 'treasure-promise'),
  phase: 'map',
  context: null,
  shards: 200,
});
const helpers = {
  gainBoon: () => {},
  fail: (s: string): never => {
    throw new Error(s);
  },
};
function keepMap(r: RunState): RunState {
  const out = clone(r);
  const ev = EVENTS.find((e) => e.id === 'buried-map')!.build(out);
  resolveEvent(out, ev.options[0]!.id, ev, helpers);
  return out;
}

describe('buried map delivery', () => {
  it.each(Array.from({ length: 20 }, (_, i) => i + 1))(
    'delivers at tier %i without replacing or clearing a route node',
    (tier) => {
      const held = keepMap({ ...base(), tier });
      expect(held.treasureMapTier).toBe(tier);
      if (tier < 20) {
        const sameTier = enterNode(held, availableNodes(held)[0]!.id);
        expect(sameTier.context?.bonusEvent).not.toBe(true);
      }
      const next = { ...held, tier: Math.min(20, tier + 1) };
      for (const node of availableNodes(next)) {
        const treasure = enterNode(next, node.id);
        expect(treasure.context?.event?.scene).toBe('treasure-dig');
        expect(treasure.at).toBe(next.at);
        const restored = parseRun(serializeRun(treasure))!;
        expect(restored).not.toBeNull();
        const deep = restored.context!.event!.options.find((o) => o.label?.startsWith('Dig deep'))!;
        const choosing = chooseEvent(restored, deep.id);
        expect(choosing.shards).toBe(next.shards + 105);
        expect(choosing.context!.event!.choose!.cards).toHaveLength(3);
        expect(choosing.marks).not.toContain('map');
        const choosingRestored = parseRun(serializeRun(choosing))!;
        const done = pickEventCard(choosingRestored, 0);
        expect(done.deck).toHaveLength(next.deck.length + 1);
        expect(done.map).toEqual(next.map);
        expect(done.cleared).toEqual(next.cleared);
        expect(done.stats.nodesCleared).toBe(next.stats.nodesCleared);
        expect(done.at).toBe(next.at);
        expect(availableNodes(done).map((n) => n.id)).toContain(node.id);
        expect(enterNode(done, node.id).context?.bonusEvent).not.toBe(true);
      }
    },
  );

  it('honours legacy maps immediately, including healing and skipping the card choice', () => {
    const legacy = parseRun(serializeRun({ ...base(), marks: ['map'], hp: 10 }))!;
    const node = availableNodes(legacy)[0]!;
    const treasure = enterNode(legacy, node.id);
    const careful = treasure.context!.event!.options.find((o) =>
      o.label?.startsWith('Dig carefully'),
    )!;
    const healed = chooseEvent(treasure, careful.id);
    expect(healed.maxHp).toBe(legacy.maxHp + 8);
    expect(healed.hp).toBeGreaterThan(legacy.hp);
    expect(healed.at).toBeNull();
    expect(healed.marks).not.toContain('map');
    const choosing = chooseEvent(treasure, treasure.context!.event!.options[0]!.id);
    const skipped = pickEventCard(choosing, null);
    expect(skipped.shards).toBe(legacy.shards + 105);
    expect(skipped.deck).toEqual(legacy.deck);
    expect(skipped.cleared).toEqual([]);
  });
});

describe('more deliberate Rift-Crossed event rewards', () => {
  it.each([
    ['rift-broker', 'Trade one card', 'uncommon', 0, 0],
    ['torn-grimoire', 'Copy out one page', 'common', 40, 0],
    ['old-soldiers', 'Learn a foreign technique', 'common', 0, 8],
    ['ash-market', 'Buy foreign stock', 'uncommon', 60, 0],
  ] as const)(
    '%s offers three eligible cards for the stated price',
    (id, label, rarity, cost, hp) => {
      const r = base();
      const ev = EVENTS.find((e) => e.id === id)!.build(r);
      const option = ev.options.find((o) => o.label?.startsWith(label))!;
      expect(option).toBeDefined();
      resolveEvent(r, option.id, ev, helpers);
      expect(ev.choose!.cards).toHaveLength(3);
      expect(new Set(ev.choose!.cards).size).toBe(3);
      for (const card of ev.choose!.cards) {
        expect(COMBAT_DB.cards[card]!.rarity).toBe(rarity);
        expect(COMBAT_DB.cards[card]!.hero).not.toBe(r.character);
      }
      expect(r.shards).toBe(200 - cost);
      expect(r.hp).toBe(base().hp - hp);
    },
  );
});
