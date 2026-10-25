import { describe, expect, it } from 'vitest';
import {
  ELITE_EVENTS,
  EVENT_TAG_LABEL,
  REEL_KINDS,
  REEL_PRIZES,
  NODE_ODDS,
  buildElite,
  eventOffers,
  newRun,
} from './index';

describe('the odds the How to play page shows', () => {
  it('say what the events really offer: eighty-two events, and a fair share that let a card go', () => {
    const o = eventOffers();
    expect(o.count).toBe(82);
    for (const tag of Object.keys(EVENT_TAG_LABEL) as (keyof typeof o.share)[]) {
      expect(o.share[tag]).toBeGreaterThanOrEqual(0);
      expect(o.share[tag]).toBeLessThanOrEqual(100);
    }
    expect(o.share.removal).toBeGreaterThanOrEqual(25);
    expect(o.share.crossed).toBeGreaterThan(5);
    expect(o.share.shards).toBeGreaterThan(30);
  });

  it('the prizes listed for the Brass Reel are the prizes of every real reel (in any order)', () => {
    const base = newRun('knight', 'lanes');
    for (const spec of ELITE_EVENTS) {
      const ev = buildElite(spec, { ...base });
      const icons = ev.trial!.prizes.map((p) => p.icon!).sort();
      expect(icons.length).toBe(REEL_PRIZES);
      // (a prize the run cannot take comes as a purse of shards instead)
      const want = [...REEL_KINDS].sort();
      const missing = want.filter((k) => !icons.includes(k));
      for (const k of missing) expect(icons.includes('shards'), spec.id + ' ' + k).toBe(true);
      expect(icons.filter((i) => i === 'card').length).toBeLessThanOrEqual(1);
    }
  });

  it('the map odds leave room for plain fights', () => {
    const o = NODE_ODDS;
    expect(o.eliteFirst + o.merchant + o.shrine + o.event).toBeLessThan(100);
  });

  it('maps really roll about as often as the odds say (events and merchants)', () => {
    let events = 0;
    let nodes = 0;
    for (let i = 0; i < 80; i++) {
      const run = newRun('knight', `odds-${i}`);
      for (const n of run.map.nodes) {
        if (n.floor === 1 || n.kind === 'warden') continue;
        nodes++;
        if (n.kind === 'event') events++;
      }
    }
    // (the last floor is always a Shrine and no two Events sit in a row, so the share is a little under the roll)
    expect(events / nodes).toBeGreaterThan(NODE_ODDS.event / 100 - 0.1);
    expect(events / nodes).toBeLessThan(NODE_ODDS.event / 100 + 0.04);
  });
});
