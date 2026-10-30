// A Legendary Boon can be given up (the X in the run bar), and one offered while another is held is swapped or declined.

import { describe, expect, it } from 'vitest';
import { COMBAT_DB } from '@sr/content/v2';
import { seedRng } from '@sr/combat';
import { answerLegendOffer, discardLegendBoon, newRun } from './index';
import { holdsLegendBoon, offerBoon } from './rewards';

const legends = Object.values(COMBAT_DB.boons).filter((b) => b.rarity === 'legendary');

describe('Legendary Boons', () => {
  it('has two to swap between', () => expect(legends.length).toBeGreaterThanOrEqual(2));
  it('the X gives the held Legendary up, undoing its Max HP, and refuses when none is held', () => {
    const run = newRun('engineer', 'legend-drop');
    expect(() => discardLegendBoon(run)).toThrow();
    const l = legends[0]!;
    const held = { ...run, phase: 'map' as const, boons: [...run.boons, l.id] };
    const out = discardLegendBoon(held);
    expect(holdsLegendBoon(out.boons)).toBe(false);
    expect(out.hp).toBeLessThanOrEqual(out.maxHp);
  });
  it('an offered Legendary swaps in for the held one, or is declined', () => {
    const [a, b] = [legends[0]!, legends[1]!];
    const run = { ...newRun('engineer', 'legend-swap'), legendOffer: b.id };
    run.boons = [...run.boons, a.id];
    const swapped = answerLegendOffer(run, true);
    expect(swapped.boons).toContain(b.id);
    expect(swapped.boons).not.toContain(a.id);
    expect(swapped.legendOffer).toBeUndefined();
    const kept = answerLegendOffer(run, false);
    expect(kept.boons).toContain(a.id);
    expect(kept.boons).not.toContain(b.id);
    expect(kept.legendOffer).toBeUndefined();
    expect(() => answerLegendOffer(swapped, true)).toThrow();
  });
  it('an offer may be a second Legendary only when swapping is allowed', () => {
    const owned = [legends[0]!.id];
    const rng = seedRng('legend-offer');
    let plain = 0;
    let swap = 0;
    for (let i = 0; i < 3000; i++) {
      const p = offerBoon(rng, owned, 'elite');
      if (p && COMBAT_DB.boons[p]?.rarity === 'legendary') plain++;
      const s = offerBoon(rng, owned, 'elite', false, true);
      if (s && COMBAT_DB.boons[s]?.rarity === 'legendary') swap++;
    }
    expect(plain).toBe(0);
    expect(swap).toBeGreaterThan(0);
  });
});
