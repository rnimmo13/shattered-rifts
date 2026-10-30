// A card an event names goes in the box of the option it belongs to, in every event (Robert, 2026-10-29 and 2026-10-30: the open rift,
// then the rift cache). This walks every event, so a new one that names a card without showing it fails here.

import { describe, expect, it } from 'vitest';
import { COMBAT_DB } from '@sr/content/v2';
import { newRun, type RunState } from './index';
import { EVENTS, pinOptions } from './events';
import { buildElite, ELITE_EVENTS } from './trials';

const clone = (r: RunState): RunState => JSON.parse(JSON.stringify(r)) as RunState;

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
        deck: [...base.deck, 'dawn-smite', 'wound'],
      };
      for (const def of EVENTS) {
        if (!def.when(clone(run))) continue;
        const r = clone(run);
        const ev = pinOptions(r, def.build(r));
        if (!ev.cardOffer) continue;
        seen.add(def.id);
        const boxed = ev.options.some(
          (o) => o.shows?.gain.includes(ev.cardOffer) || o.shows?.lose.includes(ev.cardOffer),
        );
        expect(boxed, `${def.id} names ${ev.cardOffer}`).toBe(true);
        expect(COMBAT_DB.cards[ev.cardOffer]).toBeDefined();
      }
    }
    // (each event that names a card was really reached; a new one is added here)
    expect([...seen].sort()).toEqual(['ancestors', 'bonfire', 'cache', 'stranger']);
    // (building every event for 40 runs is slow under a parallel test run)
  }, 30_000);

  it('the elite event button just says Spin To Win', () => {
    const run = newRun('knight', 'boxes-spin');
    const ev = buildElite(ELITE_EVENTS[0]!, clone(run));
    expect(ev.options.find((o) => o.id === 'trial')?.label).toBe('Spin To Win');
  });
});
