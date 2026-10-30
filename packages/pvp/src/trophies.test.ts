// Arena trophies (DECISIONS #238): who earns a finished board's trophy, which period just ended, and what a count may be.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { COMBAT_DB, RIFTWALKERS, lendLegendaries } from '@sr/content/v2';
import {
  TROPHY_PLACES,
  checkEntry,
  checkArenaEntry,
  cleanTrophies,
  lastFinished,
  periodStart,
  trophyWinners,
  type PvpRow,
} from './index';

const NOW = Date.UTC(2026, 9, 25, 18); // a Sunday afternoon, October 2026

describe('which period just ended', () => {
  it('is the week before this one, and the month before this one', () => {
    for (const kind of ['week', 'month'] as const) {
      const { from, to } = lastFinished(NOW, kind);
      expect(to).toBe(periodStart(NOW, kind));
      expect(from).toBe(periodStart(to - 1, kind));
      expect(from).toBeLessThan(to);
    }
    const w = lastFinished(NOW, 'week');
    expect(w.to - w.from).toBeGreaterThanOrEqual(7 * 86_400_000 - 3_600_000);
    expect(w.to - w.from).toBeLessThanOrEqual(7 * 86_400_000 + 3_600_000);
    const m = lastFinished(NOW, 'month');
    // September has 30 days
    expect(Math.round((m.to - m.from) / 86_400_000)).toBe(30);
  });
});

describe('who earns a trophy', () => {
  const row = (player: string, won: boolean, at = NOW): PvpRow => ({
    player,
    name: player.toUpperCase(),
    hero: 'knight',
    won,
    at,
  });

  it('the top places with a win, in order of the board', () => {
    const rows = [row('a', true), row('a', true), row('b', true), row('c', false), row('c', false)];
    expect(trophyWinners(rows)).toEqual([
      { player: 'a', name: 'A', place: 1 },
      { player: 'b', name: 'B', place: 2 },
    ]);
  });

  it(`never more than ${TROPHY_PLACES}`, () => {
    const rows = Array.from({ length: TROPHY_PLACES + 30 }, (_, i) => row(`p${i}`, true, NOW + i));
    expect(trophyWinners(rows)).toHaveLength(TROPHY_PLACES);
  });
});

describe('a trophy count from the wire', () => {
  it('is whole numbers, or nothing at all', () => {
    expect(cleanTrophies({ week: 3, month: 1 })).toEqual({ week: 3, month: 1 });
    expect(cleanTrophies({ week: -2, month: 'x' })).toBeUndefined();
    expect(cleanTrophies({ week: 0, month: 0 })).toBeUndefined();
    expect(cleanTrophies(null)).toBeUndefined();
    expect(cleanTrophies({ week: 1.5, month: 2 })).toEqual({ week: 0, month: 2 });
  });

  it('cannot be claimed by a browser: the deck check drops it', () => {
    const r = checkEntry({
      name: 'Ann',
      hero: 'knight',
      deck: [...RIFTWALKERS.knight.starter],
      boons: [],
      tier: 4,
      trophies: { week: 99, month: 99 },
    });
    expect(r.ok && 'trophies' in r.entry).toBe(false);
  });
});

describe('the deck limits in the Arena (DECISIONS #238)', () => {
  // Legendary is put away (DECISIONS #363): the shelved cards are lent as Legendaries so the limit stays tested
  let undo = (): void => {};
  beforeAll(() => {
    undo = lendLegendaries(COMBAT_DB);
  });
  afterAll(() => undo());

  it('a deck with two Legendary cards is refused at the Arena, and told why, but is still a deck', () => {
    const deck = {
      name: 'Ann',
      hero: 'knight',
      deck: [...RIFTWALKERS.knight.starter, 'foundry-awakens', 'overclocked-legion'],
      boons: [],
      tier: 4,
    };
    expect(checkEntry(deck).ok).toBe(true);
    const r = checkArenaEntry({
      name: 'Ann',
      hero: 'knight',
      // (15 cards, so it is the Legendary limit that refuses it)
      deck: [
        ...RIFTWALKERS.knight.starter,
        'alarm-bell',
        'catch-breath',
        'glimpse-ahead',
        'foundry-awakens',
        'overclocked-legion',
      ],
      boons: [],
      tier: 4,
    });
    expect(r.ok).toBe(false);
    expect(!r.ok && r.message).toMatch(/1 Legendary card/);
  });
});
