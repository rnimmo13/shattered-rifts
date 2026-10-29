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
    for (const id of back!.deck) expect(COMBAT_DB.cards[id.replace(/^(hi|lo)~/, '')], id).toBeDefined();
    expect(back!.reworkNotice).toMatch(/^The Knight was rebuilt \(Guard, Riposte and Thorns\)/);
    expect(back!.reworkNotice).toMatch(/starts again from its first turn/);
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
