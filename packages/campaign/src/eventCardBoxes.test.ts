// A card an event names goes in the box of the option it belongs to, in every event (Robert, 2026-10-29 and 2026-10-30: the open rift,
// then the rift cache). This walks every event, so a new one that names a card without showing it fails here.

import { describe, expect, it } from 'vitest';
import { COMBAT_DB } from '@sr/content/v2';
import { newRun, parseRun, type RunState } from './index';
import type { EventCtx } from './deals';
import { EVENTS, pinOptions } from './events';
import { buildElite, ELITE_EVENTS } from './trials';

const clone = (r: RunState): RunState => JSON.parse(JSON.stringify(r)) as RunState;

/** A deck with cards of every rarity, so the events that trade one up come along. */
const RICH_DECK = Object.values(COMBAT_DB.cards)
  .filter((c) => c.hero === 'knight' && !c.id.endsWith('+'))
  .filter((c) => c.rarity === 'common' || c.rarity === 'uncommon' || c.rarity === 'rare')
  .slice(0, 40)
  .map((c) => c.id);

describe('event cards are in the option boxes', () => {
  it('every event that names a card shows it in an option', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 40; seed++) {
      const base = newRun(seed % 2 ? 'knight' : 'engineer', `boxes-${seed}`);
      const run: RunState = {
        ...base,
        hp: base.maxHp,
        shards: 500,
        phase: 'map',
        context: null,
        deck: [...base.deck, 'dawn-smite', 'wound', ...RICH_DECK],
      };
      for (const def of EVENTS) {
        if (!def.when(clone(run))) continue;
        const r = clone(run);
        const ev = pinOptions(r, def.build(r));
        const shown = ev.options.flatMap((o) => [...(o.shows?.gain ?? []), ...(o.shows?.lose ?? [])]);
        // (a table of cards to choose from too: every one of them is in the box of its option)
        for (const id of ev.cardOffers ?? []) expect(shown, `${def.id} lays out ${id}`).toContain(id);
        // (an option that says outright that a Wound or Static joins your deck shows it)
        for (const o of ev.options) {
          const says = /(?:a|two) (?:Wounds?|Static(?: cards?)?) (?:in|joins?) your deck/.test(o.label);
          // (behind a chance it may not happen, and stays in the words)
          const maybe = /chance|\d+%|, or |; or |otherwise|else /.test(o.label);
          if (says && !maybe) expect(o.shows, `${def.id}: ${o.label}`).toBeDefined();
        }
        if (!ev.cardOffer) continue;
        seen.add(def.id);
        expect(shown, `${def.id} names ${ev.cardOffer}`).toContain(ev.cardOffer);
        expect(COMBAT_DB.cards[ev.cardOffer]).toBeDefined();
      }
    }
    // (each event that names a card was really reached; a new one is added here)
    expect([...seen].sort()).toEqual(['ancestors', 'bonfire', 'cache', 'stranger']);
    // (building every event for 40 runs is slow under a parallel test run)
  }, 30_000);

  it('an event saved before its card went in the box is repaired when the run loads', () => {
    const run = newRun('knight', 'boxes-stale');
    const node = run.map.nodes.find((n) => n.kind === 'event') ?? run.map.nodes[0]!;
    const card = RICH_DECK[0]!;
    const stale = {
      ...run,
      phase: 'event',
      context: {
        nodeId: node.id,
        event: {
          title: 'A traveller from another world',
          text: '',
          cardOffer: card,
          options: [{ id: 'cross', label: 'Take it' }, { id: 'leave', label: 'Walk on' }],
        },
      },
    };
    const back = parseRun(JSON.stringify(stale));
    const ev = (back?.context as { event: EventCtx } | null)?.event;
    expect(ev?.options[0]?.shows).toEqual({ lose: [], gain: [card] });
    expect(ev?.options[1]?.shows).toBeUndefined();
  });

  it('a damaged event in a save does not crash loading it', () => {
    const run = newRun('knight', 'boxes-bad');
    for (const options of [5, [null]]) {
      const bad = { ...run, phase: 'map', context: { event: { cardOffer: 'x', options } } };
      expect(() => parseRun(JSON.stringify(bad))).not.toThrow();
    }
  });

  it('the elite event button just says Spin To Win', () => {
    const run = newRun('knight', 'boxes-spin');
    const ev = buildElite(ELITE_EVENTS[0]!, clone(run));
    expect(ev.options.find((o) => o.id === 'trial')?.label).toBe('Spin To Win');
  });
});
