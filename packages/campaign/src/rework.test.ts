// A run saved before its Riftwalker's rework (DECISIONS #415), or under a rework that was reverted (#428), is migrated on load, never read as if the new rules had made it: its
// old cards become their nearest new ones, it is stamped with the rework, and the player is told (the screen also restarts a fight
// that was in progress).

import { describe, expect, it } from 'vitest';
import { CLASS_REWORKS, COMBAT_DB, RIFTWALKERS, canonicalCard } from '@sr/content/v2';
import { newRun, parseRun, serializeRun } from './index';

describe('runs saved before a class rework', () => {
  it('a new run is stamped with its class rework, and loads with no notice', () => {
    const run = newRun('knight', 'rework-new');
    expect(run.reworked).toBe(CLASS_REWORKS.knight?.version);
    const back = parseRun(serializeRun(run));
    expect(back?.reworked).toBe(CLASS_REWORKS.knight?.version);
    expect(back?.reworkNotice).toBeUndefined();
  });

  it('an older Shaman run swaps its orb, Focus and recursion cards and says so', () => {
    const run = newRun('shaman', 'rework-old-sh');
    delete run.reworked;
    run.deck = [...run.deck, 'twin-evocation', 'glyph-lattice+', 'harmonic-wave'];
    const back = parseRun(serializeRun(run));
    expect(back!.reworked).toBe(CLASS_REWORKS.shaman?.version);
    // (through the first rework's ids to the second's, DECISIONS #420: twin-evocation > guided-talon > ember-bolt)
    expect(back!.deck).toContain('ember-bolt');
    expect(back!.deck).toContain('rune-carapace+');
    expect(back!.deck).toContain('prism-spell');
    for (const id of back!.deck)
      expect(COMBAT_DB.cards[id.replace(/^(hi|lo)~/, '')], id).toBeDefined();
    expect(back!.reworkNotice).toMatch(/^The Shaman was rebuilt \(elements, totems and Trinity\)/);
  });

  // (DECISIONS #428: the Knight, Assassin, Spellblade and Monk reworks were reverted; a run saved under one comes back to the
  // earlier cards, and a run saved before them keeps its cards, which are live again)
  for (const [hero, kept, gone, pronoun] of [
    ['knight', 'twin-cut', 'return-the-blow', 'her'],
    ['assassin', 'bottomless-sleeves', 'draw-steel', 'his'],
    ['spellblade', 'starforged-blade', 'fracture-script', 'her'],
    ['monk', 'rise-radiant', 'mountain-breaker', 'his'],
  ] as const) {
    it(`a ${hero} run saved under the reverted rework gets the earlier cards back, and says so`, () => {
      const run = newRun(hero, `revert-${hero}`);
      run.reworked = 1;
      run.deck = [...run.deck, gone, `${gone}+`, `hi~${gone}`];
      const back = parseRun(serializeRun(run));
      expect(back).not.toBeNull();
      expect(back!.reworked).toBe(CLASS_REWORKS[hero]?.version);
      expect(back!.deck).not.toContain(gone);
      const now = canonicalCard(gone);
      expect(COMBAT_DB.cards[now]?.hero).toBe(hero);
      expect(back!.deck).toContain(now);
      expect(back!.deck).toContain(`${now}+`);
      // (a roll the replacement cannot carry is dropped, never the card)
      expect(back!.deck.some((id) => id === `hi~${now}` || id === now)).toBe(true);
      for (const id of back!.deck)
        expect(COMBAT_DB.cards[id.replace(/^(hi|lo)~/, '')], id).toBeDefined();
      expect(back!.reworkNotice).toMatch(new RegExp(`back to ${pronoun} earlier cards`));
    });

    it(`a ${hero} run saved before any rework keeps its cards (they are live again)`, () => {
      const run = newRun(hero, `pre-${hero}`);
      delete run.reworked;
      run.deck = [...run.deck, kept];
      const back = parseRun(serializeRun(run));
      expect(back!.deck).toContain(kept);
      expect(COMBAT_DB.cards[kept]?.hero).toBe(hero);
      expect(back!.reworked).toBe(CLASS_REWORKS[hero]?.version);
    });
  }

  it('a run of a class that was not rebuilt is left alone', () => {
    const unchanged = (Object.keys(RIFTWALKERS) as (keyof typeof RIFTWALKERS)[]).find(
      (h) => !CLASS_REWORKS[h],
    )!;
    const run = newRun(unchanged, 'rework-none');
    const back = parseRun(serializeRun(run));
    expect(back?.reworked).toBeUndefined();
    expect(back?.reworkNotice).toBeUndefined();
  });

  it('a damaged rework stamp makes the save unreadable rather than guessed at', () => {
    const run = newRun('knight', 'rework-bad');
    const text = serializeRun(run).replace(/"reworked":\d+/, '"reworked":"one"');
    expect(parseRun(text)).toBeNull();
  });
});

describe('Rift-crossed offers (DECISIONS #418)', () => {
  it('never offer a card that only the Shaman can use to anyone else', async () => {
    const { deadElsewhere } = await import('./rewards');
    for (const id of ['storm-sovereign', 'rally-the-spirits', 'spirit-surge', 'harmony'])
      expect(deadElsewhere(id), id).toBe(true);
    for (const id of ['stone-skin', 'ember-bolt', 'iron-shirt'])
      expect(deadElsewhere(id), id).toBe(false);
  });
});
