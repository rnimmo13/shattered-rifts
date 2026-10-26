import { describe, expect, it } from 'vitest';
import { clone } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS } from '@sr/content/v2';
import { availableNodes, enterNode, newRun, pickEventCard, type RunState } from './index';
import { EVENTS, resolveEvent } from './events';

// Robert, 2026-10-26: no event may force a card into the deck, least of all a card from another Riftwalker (DECISIONS #267).

const helpers = {
  gainBoon: (r: RunState, id: string) => void r.boons.push(id),
  fail: (m: string): never => {
    throw new Error(m);
  },
};
/** a Wound or Static (or any card with no rarity) is a cost, not a card you take */
const junk = (id: string): boolean =>
  id === 'wound' || id === 'static' || !COMBAT_DB.cards[id.replace(/\+$/, '')]?.rarity;

/** a run standing in an event, rich enough that every event can be built and every option paid for */
function standing(seed: string): RunState {
  const base: RunState = { ...newRun('knight', seed), phase: 'map', context: null };
  const node = availableNodes(base)[0]!;
  const run: RunState = {
    ...base,
    hp: 60,
    shards: 400,
    stage: 2,
    potions: ['healing-philtre', 'healing-philtre'],
    boons: ['iron-sigil'],
    marks: ['map'],
    deck: [
      ...RIFTWALKERS.knight.starter,
      'bulwark-blow',
      'shield-bash',
      'stand-firm',
      'iron-vigil',
      'colossus-blow',
      'gilded-bastion',
      'anvil-strike',
    ],
    map: {
      ...base.map,
      nodes: base.map.nodes.map((n) => (n.id === node.id ? { ...n, kind: 'event' as const } : n)),
    },
  };
  return enterNode(run, node.id);
}

describe('no event forces a card on you', () => {
  it('every event has an option that adds no card (or only lays cards out to choose from, or starts a fight)', () => {
    const r0 = standing('no-forced-card');
    for (const e of EVENTS) {
      const ev = e.build(clone(r0));
      const ways = ev.options.map((o) => {
        if (o.id === 'trial') return 'free';
        const r = clone(r0);
        const evc = clone(ev);
        try {
          resolveEvent(r, o.id, evc, helpers);
        } catch {
          return 'refused';
        }
        // a choice of cards can be left (pickEventCard with null), and a fight's card reward can be skipped
        if (evc.choose || evc.fight) return 'free';
        const left = [...r0.deck];
        const gained = r.deck.filter((id) => {
          const k = left.indexOf(id);
          if (k < 0) return true;
          left.splice(k, 1);
          return false;
        });
        return gained.some((id) => !junk(id)) ? 'card' : 'free';
      });
      expect(ways, `${e.id}: ${ev.options.map((o) => o.id).join(', ')}`).toContain('free');
    }
  });

  it('three cards laid out by an event can all be left where they lie', () => {
    // find a run whose event lays out a choice of cards
    for (let i = 0; i < 400; i++) {
      const r0 = standing(`leave-them-${i}`);
      const ev = r0.context?.event;
      if (!ev) continue;
      for (const o of ev.options) {
        const r = clone(r0);
        const evc = r.context!.event!;
        try {
          resolveEvent(r, o.id, evc, helpers);
        } catch {
          continue;
        }
        if (!evc.choose) continue;
        const deck = [...r.deck];
        const after = pickEventCard(r, null);
        expect(after.deck).toEqual(deck);
        expect(after.phase).toBe('map');
        expect(after.eventResult).toMatch(/leave the cards/);
        return;
      }
    }
    throw new Error('no event laid out a choice of cards in 400 runs');
  });
});
