import { describe, expect, it } from 'vitest';
import { seedRng } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, V2_DECK_RULES, type HeroId } from '@sr/content/v2';
import {
  RunError,
  chooseKit,
  makeKits,
  mechanicsOf,
  newRun,
  parseRun,
  serializeRun,
} from './index';

const HEROES = Object.keys(RIFTWALKERS) as HeroId[];

describe('starting kits', () => {
  it('every run opens by offering two starting decks', () => {
    for (const h of HEROES) {
      const r = newRun(h, `kit-${h}`, 'normal');
      expect(r.phase).toBe('kit');
      expect(r.context?.kits).toHaveLength(2);
    }
  });

  it('each kit is a real deck: the starter with three plain cards swapped for three of your own', () => {
    for (const h of HEROES) {
      for (let i = 0; i < 20; i++) {
        const kits = makeKits(seedRng(`k${h}${i}`), h);
        expect(kits).toHaveLength(2);
        for (const k of kits) {
          expect(k.added).toHaveLength(3);
          expect(k.deck.length).toBe(RIFTWALKERS[h].starter.length - k.removed.length + 3);
          expect(k.deck.length).toBeGreaterThanOrEqual(V2_DECK_RULES.minSize);
          for (const id of k.added) {
            expect(COMBAT_DB.cards[id]?.hero, `${h} ${id}`).toBe(h);
            expect(['common', 'uncommon']).toContain(COMBAT_DB.cards[id]?.rarity);
          }
          for (const id of k.removed) {
            expect(COMBAT_DB.cards[id]?.hero).toBe('neutral');
            expect(COMBAT_DB.cards[id]?.rarity).toBe('basic');
          }
          expect(k.leans.length).toBeGreaterThan(2);
        }
      }
    }
  });

  it('the two kits differ: no shared added card, and they lean differently', () => {
    let differentLean = 0;
    let total = 0;
    for (const h of HEROES) {
      for (let i = 0; i < 20; i++) {
        const [a, b] = makeKits(seedRng(`d${h}${i}`), h) as [
          ReturnType<typeof makeKits>[0],
          ReturnType<typeof makeKits>[0],
        ];
        expect(a.added.some((c) => b.added.includes(c))).toBe(false);
        total++;
        if (a.leans !== b.leans) differentLean++;
      }
    }
    expect(differentLean / total).toBeGreaterThan(0.8);
  });

  it('a kit is built around a shared mechanic', () => {
    // for a Riftwalker with plenty of Snare cards in the pool, a Snare-leaning kit holds at least two of them
    let leaning = 0;
    for (let i = 0; i < 40; i++) {
      for (const k of makeKits(seedRng(`s${i}`), 'vesper')) {
        if (k.leans === 'Snares') {
          leaning++;
          expect(
            k.added.filter((c) => mechanicsOf(c).includes('snare')).length,
          ).toBeGreaterThanOrEqual(2);
        }
      }
    }
    expect(leaning).toBeGreaterThan(0);
  });

  it('is the same offer for the same seed, and varies between seeds', () => {
    const sig = (s: string) =>
      makeKits(seedRng(s), 'kesh')
        .map((k) => k.added.join('+'))
        .join('|');
    expect(sig('same')).toBe(sig('same'));
    expect(new Set(Array.from({ length: 30 }, (_, i) => sig(`v${i}`))).size).toBeGreaterThan(10);
  });

  it('choosing a kit sets the deck and opens The Threshold; the input is not changed', () => {
    const r = newRun('rivet', 'choose', 'normal');
    const kit = r.context?.kits?.[1];
    const after = chooseKit(r, 'b');
    expect(after.deck).toEqual(kit?.deck);
    expect(after.phase).toBe('prelude');
    expect(after.context?.prelude?.kind).toBe('threshold');
    expect(r.phase).toBe('kit');
    expect(r.deck).toEqual(RIFTWALKERS.rivet.starter);
  });

  it('refuses a kit that is not on offer, or a choice at the wrong time', () => {
    const r = newRun('maren', 'bad', 'normal');
    expect(() => chooseKit(r, 'z')).toThrow(RunError);
    expect(() => chooseKit({ ...r, phase: 'map', context: null }, 'a')).toThrow(RunError);
  });

  it('a run standing at the kit choice saves and loads; a broken one does not', () => {
    const r = newRun('quill', 'save-kit', 'normal');
    expect(parseRun(serializeRun(r))?.phase).toBe('kit');
    const broken = JSON.parse(serializeRun(r)) as typeof r;
    broken.context = {
      nodeId: '',
      kits: [{ id: 'a', leans: 'x', deck: ['nope'], added: [], removed: [] }],
    };
    expect(parseRun(JSON.stringify(broken))).toBeNull();
  });
});
