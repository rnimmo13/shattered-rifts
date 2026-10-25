import { describe, expect, it } from 'vitest';
import { COMBAT_DB, RIFTWALKERS, V2_DECK_RULES, laneOf, type HeroId } from '@sr/content/v2';
import {
  KIT_CARDS,
  RunError,
  canAdd,
  chooseKit,
  makeKits,
  newRun,
  parseRun,
  serializeRun,
} from './index';

const HEROES = Object.keys(RIFTWALKERS) as HeroId[];

describe('starting kits', () => {
  it('every run opens by offering three starting decks, one per lane', () => {
    for (const h of HEROES) {
      const r = newRun(h, `kit-${h}`, 'normal');
      expect(r.phase).toBe('kit');
      expect(r.context?.kits?.map((k) => k.id)).toEqual(['a', 'b', 'c']);
    }
  });

  it('each kit is two uncommon cards of its lane swapped in for two plain cards, all legal', () => {
    for (const h of HEROES) {
      const kits = makeKits(h);
      expect(kits).toHaveLength(3);
      kits.forEach((k, lane) => {
        expect(k.added, `${h} lane ${lane}`).toHaveLength(2);
        expect(k.removed).toHaveLength(2);
        expect(k.leans).toBe(RIFTWALKERS[h].lanes[lane]?.split(':')[0]);
        expect(k.deck.length).toBe(RIFTWALKERS[h].starter.length);
        expect(k.deck.length).toBeGreaterThanOrEqual(V2_DECK_RULES.minSize);
        for (const id of k.added) {
          const c = COMBAT_DB.cards[id];
          expect(c?.hero, `${h} ${id}`).toBe(h);
          expect(c?.rarity, `${h} ${id}`).toBe('uncommon');
          expect(laneOf(id), `${h} ${id}`).toBe(lane);
          expect(c?.unplayable).toBeFalsy();
        }
        for (const id of k.removed) {
          expect(COMBAT_DB.cards[id]?.hero).toBe('neutral');
          expect(COMBAT_DB.cards[id]?.rarity).toBe('basic');
        }
        // the deck is legal card by card
        const built: string[] = [];
        for (const id of k.deck) {
          expect(canAdd(built, id), `${h} kit ${k.id}: ${id}`).toBe(true);
          built.push(id);
        }
      });
    }
  });

  it('the three kits of a Riftwalker share no added card', () => {
    for (const h of HEROES) {
      const all = KIT_CARDS[h].flat();
      expect(new Set(all).size).toBe(6);
    }
  });

  it('is the same offer every time (no randomness)', () => {
    for (const h of HEROES) expect(makeKits(h)).toEqual(makeKits(h));
  });

  it('choosing a kit sets the deck and opens The Threshold; the input is not changed', () => {
    const r = newRun('engineer', 'choose', 'normal');
    const kit = r.context?.kits?.[1];
    const after = chooseKit(r, 'b');
    expect(after.deck).toEqual(kit?.deck);
    expect(after.phase).toBe('prelude');
    expect(after.context?.prelude?.kind).toBe('threshold');
    expect(r.phase).toBe('kit');
    expect(r.deck).toEqual(RIFTWALKERS.engineer.starter);
  });

  it('refuses a kit that is not on offer, or a choice at the wrong time', () => {
    const r = newRun('knight', 'bad', 'normal');
    expect(() => chooseKit(r, 'z')).toThrow(RunError);
    expect(() => chooseKit({ ...r, phase: 'map', context: null }, 'a')).toThrow(RunError);
  });

  it('a run standing at the kit choice saves and loads; a broken one does not', () => {
    const r = newRun('assassin', 'save-kit', 'normal');
    expect(parseRun(serializeRun(r))?.phase).toBe('kit');
    const broken = JSON.parse(serializeRun(r)) as typeof r;
    broken.context = {
      nodeId: '',
      kits: [{ id: 'a', leans: 'x', deck: ['nope'], added: [], removed: [] }],
    };
    expect(parseRun(JSON.stringify(broken))).toBeNull();
  });
});
