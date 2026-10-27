import { describe, expect, it } from 'vitest';
import {
  COMBAT_DB,
  LEGACY_HERO_IDS,
  RETIRED_CARDS,
  RIFTWALKERS,
  canonicalCard,
  canonicalHero,
} from '@sr/content/v2';
import { newRun, parseRun, serializeRun } from './index';

describe('Riftwalker ids are named for their class', () => {
  it('every old id has a class id that exists, and no old id is still an id', () => {
    for (const [old, now] of Object.entries(LEGACY_HERO_IDS)) {
      expect(Object.hasOwn(RIFTWALKERS, now), now).toBe(true);
      expect(Object.hasOwn(RIFTWALKERS, old), old).toBe(false);
      expect(canonicalHero(old)).toBe(now);
      // the id is the class: it is what the character screen calls them
      expect(RIFTWALKERS[now].role.toLowerCase()).toBe(now);
    }
    expect(Object.keys(LEGACY_HERO_IDS)).toHaveLength(Object.keys(RIFTWALKERS).length);
    // anything else comes back as it was
    expect(canonicalHero('knight')).toBe('knight');
    expect(canonicalHero('constructor')).toBe('constructor');
    expect(canonicalHero('')).toBe('');
  });

  it('a run saved under an old id loads as the class, with its visiting merchant', () => {
    for (const [old, now] of Object.entries(LEGACY_HERO_IDS)) {
      const run = newRun(now, 'legacy-save');
      const text = serializeRun(run).replace(`"character":"${now}"`, `"character":"${old}"`);
      expect(text).toContain(`"character":"${old}"`);
      const back = parseRun(text);
      expect(back?.character).toBe(now);
    }
    // a visiting merchant's class too
    const run = newRun('knight', 'legacy-crossed');
    run.map.nodes[run.map.nodes.length - 1]!.crossed = 'quill';
    const back = parseRun(serializeRun(run));
    expect(back?.map.nodes.at(-1)?.crossed).toBe('assassin');
  });

  it('a save of a character the game does not know is still refused', () => {
    const run = newRun('knight', 'legacy-unknown');
    expect(
      parseRun(serializeRun(run).replace('"character":"knight"', '"character":"nobody"')),
    ).toBeNull();
  });
});

describe('cards taken out of the game (DECISIONS #312)', () => {
  it('an old save holding them loads with their replacements, roll, engraving and upgrade kept', () => {
    const run = newRun('hunter', 'retired-cards');
    const text = serializeRun({
      ...run,
      deck: [...run.deck, 'guard-dog', 'heel+', 'hi~howl', 'hold^heel'],
    });
    const back = parseRun(text);
    expect(back).not.toBeNull();
    const tail = back!.deck.slice(-4);
    expect(tail).toEqual(['rend', 'call-gnashlings+', 'hi~pack-tactics', 'hold^call-gnashlings']);
    for (const id of Object.keys(RETIRED_CARDS)) expect(COMBAT_DB.cards[id]).toBeUndefined();
    expect(canonicalCard('strike')).toBe('strike');
  });
});
