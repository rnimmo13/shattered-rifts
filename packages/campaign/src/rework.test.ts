// A run saved before its Riftwalker's rework (DECISIONS #415) is migrated on load, never read as if the new rules had made it: its
// old cards become their nearest new ones, it is stamped with the rework, and the player is told (the screen also restarts a fight
// that was in progress).

import { describe, expect, it } from 'vitest';
import { CLASS_REWORKS, COMBAT_DB, RIFTWALKERS } from '@sr/content/v2';
import { newRun, parseRun, serializeRun } from './index';

describe('runs saved before a class rework', () => {
  it('a new run is stamped with its class rework, and loads with no notice', () => {
    const run = newRun('knight', 'rework-new');
    expect(run.reworked).toBe(CLASS_REWORKS.knight?.version);
    const back = parseRun(serializeRun(run));
    expect(back?.reworked).toBe(CLASS_REWORKS.knight?.version);
    expect(back?.reworkNotice).toBeUndefined();
  });

  it('an older Knight run has its old cards mapped, is stamped, and carries a notice that says so', () => {
    const run = newRun('knight', 'rework-old');
    delete run.reworked;
    run.deck = [...run.deck, 'twin-cut', 'unholy-pact+', 'hi~burn-it-all'];
    const back = parseRun(serializeRun(run));
    expect(back).not.toBeNull();
    expect(back!.reworked).toBe(CLASS_REWORKS.knight?.version);
    expect(back!.deck).toContain('return-the-blow');
    expect(back!.deck).toContain('iron-cadence+');
    expect(back!.deck).toContain('hi~masterstroke');
    for (const id of back!.deck)
      expect(COMBAT_DB.cards[id.replace(/^(hi|lo)~/, '')], id).toBeDefined();
    expect(back!.reworkNotice).toMatch(/^The Knight was rebuilt \(Guard, Riposte and Thorns\)/);
    expect(back!.reworkNotice).toMatch(/starts again from its first turn/);
  });

  it('an older Assassin run swaps its Daggers and Sly cards and says so', () => {
    const run = newRun('assassin', 'rework-old-a');
    delete run.reworked;
    run.deck = [...run.deck, 'grand-scheme', 'bottomless-sleeves+'];
    const back = parseRun(serializeRun(run));
    expect(back!.deck).toContain('eyes-in-the-dark');
    expect(back!.deck).toContain('whetted-edge+');
    expect(back!.reworkNotice).toMatch(
      /^The Assassin was rebuilt \(Preparation and embedded knives\)/,
    );
  });

  it('an older Spellblade run swaps its Arcana, Sharpen and Retainer cards and says so', () => {
    const run = newRun('spellblade', 'rework-old-s');
    delete run.reworked;
    run.deck = [...run.deck, 'starforged-blade', 'gather-light+', 'retainer-guard'];
    const back = parseRun(serializeRun(run));
    expect(back!.reworked).toBe(CLASS_REWORKS.spellblade?.version);
    expect(back!.deck).toContain('obsidian-cut');
    expect(back!.deck).toContain('ember-inscription+');
    expect(back!.deck).toContain('glassward');
    for (const id of back!.deck)
      expect(COMBAT_DB.cards[id.replace(/^(hi|lo)~/, '')], id).toBeDefined();
    expect(back!.reworkNotice).toMatch(/^The Spellblade was rebuilt \(Imbue and Discharge\)/);
  });

  it('an older Shaman run swaps its orb, Focus and recursion cards and says so', () => {
    const run = newRun('shaman', 'rework-old-sh');
    delete run.reworked;
    run.deck = [...run.deck, 'twin-evocation', 'glyph-lattice+', 'harmonic-wave'];
    const back = parseRun(serializeRun(run));
    expect(back!.reworked).toBe(CLASS_REWORKS.shaman?.version);
    expect(back!.deck).toContain('guided-talon');
    expect(back!.deck).toContain('rune-carapace+');
    expect(back!.deck).toContain('chorus-of-glyphs');
    for (const id of back!.deck)
      expect(COMBAT_DB.cards[id.replace(/^(hi|lo)~/, '')], id).toBeDefined();
    expect(back!.reworkNotice).toMatch(/^The Shaman was rebuilt \(commanded totems\)/);
  });

  it('an older Monk run swaps its stance, Fervor and Radiant cards and says so', () => {
    const run = newRun('monk', 'rework-old-m');
    delete run.reworked;
    run.deck = [...run.deck, 'rise-radiant', 'thread-cutter+', 'eye-of-the-storm'];
    const back = parseRun(serializeRun(run));
    expect(back!.reworked).toBe(CLASS_REWORKS.monk?.version);
    expect(back!.deck).toContain('last-rites-of-flame');
    expect(back!.deck).toContain('redirect+');
    expect(back!.deck).toContain('unmoved-mind');
    for (const id of back!.deck)
      expect(COMBAT_DB.cards[id.replace(/^(hi|lo)~/, '')], id).toBeDefined();
    expect(back!.reworkNotice).toMatch(/^The Monk was rebuilt \(Martial Forms and Mastery\)/);
  });

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

describe('Rift-crossed offers (DECISIONS #418, #419)', () => {
  it('never offer a card that only the Shaman or the Monk can use to anyone else', async () => {
    const { deadElsewhere } = await import('./rewards');
    for (const id of [
      'stormcrown',
      'hawks-counsel',
      'tune-the-spirits',
      'perfected-motion',
      'unmoved-mind',
      'river-turns',
      'mountain-breaker',
      'read-the-rhythm',
    ])
      expect(deadElsewhere(id), id).toBe(true);
    for (const id of ['stone-skin', 'ember-toss', 'iron-shirt', 'quick-palms'])
      expect(deadElsewhere(id), id).toBe(false);
  });
});
