import { describe, expect, it } from 'vitest';
import { RIFTWALKERS, COMBAT_DB } from '@sr/content/v2';
import {
  CONSTRUCTED_RULES,
  RATING_START,
  carryOver,
  checkConstructed,
  cleanRank,
  cleanReplay,
  constructedPool,
  constructedRoom,
  rankOf,
  rateMatch,
  seasonAt,
  seasonOf,
} from './index';

describe('Arena ranks', () => {
  it('start everyone in Bronze II, and climb through the divisions to Diamond', () => {
    expect(rankOf(RATING_START).label).toBe('Bronze II');
    expect(rankOf(900).label).toBe('Bronze III');
    expect(rankOf(1099).label).toBe('Bronze I');
    expect(rankOf(1100).label).toBe('Silver III');
    expect(rankOf(1249).label).toBe('Silver I');
    expect(rankOf(1250).label).toBe('Gold III');
    expect(rankOf(1400).label).toBe('Platinum III');
    expect(rankOf(1549).label).toBe('Platinum I');
    expect(rankOf(1550).label).toBe('Diamond');
    expect(rankOf(2400)).toMatchObject({ name: 'Diamond', next: null });
  });

  it('say how far through a division a rating is', () => {
    const r = rankOf(1125);
    expect(r.next).toBe(1150);
    expect(r.progress).toBeCloseTo(0.5);
  });

  it('move a rating further for beating someone rated higher, and further in the first games', () => {
    const even = rateMatch({ rating: 1000, games: 20 }, { rating: 1000, games: 20 });
    expect(even.winner).toBe(1012);
    expect(even.loser).toBe(988);
    const upset = rateMatch({ rating: 1000, games: 20 }, { rating: 1300, games: 20 });
    expect(upset.winner - 1000).toBeGreaterThan(12);
    const fresh = rateMatch({ rating: 1000, games: 0 }, { rating: 1000, games: 0 });
    expect(fresh.winner - 1000).toBeGreaterThan(even.winner - 1000);
    // a sure thing still moves a little
    const sure = rateMatch({ rating: 2400, games: 50 }, { rating: 600, games: 50 });
    expect(sure.winner).toBeGreaterThan(2400);
    expect(sure.loser).toBeLessThan(600);
  });

  it('pull ratings halfway back to the start at a new season', () => {
    expect(carryOver(1600)).toBe(1300);
    expect(carryOver(800)).toBe(900);
    expect(carryOver(RATING_START)).toBe(RATING_START);
  });

  it('take only a well-formed badge from the wire', () => {
    expect(cleanRank({ rating: 1200, games: 4 })).toEqual({ rating: 1200, games: 4 });
    expect(cleanRank({ rating: 1.5, games: 4 })).toBeUndefined();
    expect(cleanRank({ rating: 1200 })).toBeUndefined();
    expect(cleanRank('gold')).toBeUndefined();
  });
});

describe('seasons', () => {
  it('are months of the Arena board, named for the month', () => {
    // 2026-10-15 12:00 UTC
    const mid = Date.UTC(2026, 9, 15, 12);
    const s = seasonAt(mid);
    expect(s.key).toBe('2026-10');
    expect(s.name).toBe('October 2026');
    expect(s.id).toBe(seasonOf(mid));
    expect(s.ends).toBeGreaterThan(mid);
    expect(seasonAt(s.ends).key).toBe('2026-11');
    // the first of the month, early in UTC, is still the last day of the month before in Pacific time
    expect(seasonAt(Date.UTC(2026, 10, 1, 3)).key).toBe('2026-10');
  });
});

describe('replays', () => {
  const entry = {
    name: 'Ann',
    hero: 'knight',
    deck: [...RIFTWALKERS.knight.starter],
    boons: [],
    tier: 4,
  };
  const good = {
    id: 'AbCdEfGh23',
    at: 1,
    rules: 2,
    seed: 'x',
    a: entry,
    b: { ...entry, name: 'Bo' },
    log: [{ seat: 'a', action: { type: 'endTurn' } }],
    winner: 'a',
    reason: 'resign',
    game: 2,
  };
  it('are read back when well-formed', () => {
    const r = cleanReplay(good);
    expect(r?.a.name).toBe('Ann');
    expect(r?.log).toHaveLength(1);
    expect(r?.game).toBe(2);
  });
  it('are refused when anything in them is off', () => {
    expect(cleanReplay({ ...good, id: 'short' })).toBeNull();
    expect(cleanReplay({ ...good, winner: 'c' })).toBeNull();
    expect(cleanReplay({ ...good, log: [{ seat: 'c', action: { type: 'endTurn' } }] })).toBeNull();
    expect(cleanReplay({ ...good, log: [{ seat: 'a', action: { type: 'cheat' } }] })).toBeNull();
    expect(cleanReplay({ ...good, a: { ...entry, deck: ['nope'] } })).toBeNull();
  });
});

describe('Constructed decks', () => {
  const pool = constructedPool('knight');
  const own = pool.filter((id) => COMBAT_DB.cards[id]?.hero === 'knight');
  const commons = own.filter((id) => COMBAT_DB.cards[id]?.rarity === 'common');

  it('draw on the class, Neutral and Ancestral cards, plain versions only', () => {
    expect(pool.length).toBeGreaterThan(30);
    expect(pool.some((id) => id.endsWith('+'))).toBe(false);
    expect(pool.some((id) => COMBAT_DB.cards[id]?.hero === 'hunter')).toBe(false);
    expect(pool.some((id) => COMBAT_DB.cards[id]?.rarity === 'ancestral')).toBe(true);
  });

  it('take a legal deck, and say what is wrong with one that is not', () => {
    const deck = commons.slice(0, 7).flatMap((id) => [id, id, id]);
    expect(deck.length).toBeGreaterThanOrEqual(CONSTRUCTED_RULES.minSize);
    expect(checkConstructed('knight', deck)).toEqual({ ok: true });
    expect(checkConstructed('knight', deck.slice(0, 5)).ok).toBe(false);
    expect(checkConstructed('knight', [...deck.slice(0, 19), commons[0]!]).ok).toBe(false);
    const upgraded = [...deck.slice(1), `${commons[0]!}+`];
    expect(checkConstructed('knight', upgraded).ok).toBe(false);
  });

  it('allow one Legendary and two Ancestral cards', () => {
    const legends = own.filter((id) => COMBAT_DB.cards[id]?.rarity === 'legendary');
    const ancients = pool.filter((id) => COMBAT_DB.cards[id]?.rarity === 'ancestral');
    expect(constructedRoom('knight', [legends[0]!], legends[1] ?? legends[0]!)).toBe(false);
    expect(constructedRoom('knight', [ancients[0]!, ancients[1]!], ancients[2]!)).toBe(false);
    expect(constructedRoom('knight', [ancients[0]!], ancients[1]!)).toBe(true);
  });
});
