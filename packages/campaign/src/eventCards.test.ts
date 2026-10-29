// An event option that names a card shows that card in its box (DECISIONS #435): the open rift's three Rift-crossed cards.

import { describe, expect, it } from 'vitest';
import { MORE_EVENTS } from './eventsMore';
import { newRun } from './index';

describe('event options show the cards they name', () => {
  it("the open rift's three options each show the card it takes", () => {
    const r = newRun('knight', 'rift-show');
    const ev = MORE_EVENTS.find((e) => e.id === 'open-rift')!;
    const ctx = ev.build(r);
    const takes = ctx.options.filter((o) => o.id !== 'leave');
    expect(takes).toHaveLength(3);
    for (const o of takes) {
      expect(o.shows?.gain).toHaveLength(1);
      expect(o.shows?.lose).toEqual([]);
      const step = o.deal?.find((d) => d.k === 'card');
      expect(step && 'id' in step ? step.id : null).toBe(o.shows!.gain[0]);
    }
  });
});
