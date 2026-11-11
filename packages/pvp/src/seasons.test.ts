import { describe, expect, it, vi } from 'vitest';
import type * as Content from '@sr/content/v2';

// (no card back or name plate is made yet, so the rules are tried with stand-ins: one free to take, the rest earned)
vi.mock('@sr/content/v2', async (original) => {
  const actual = await original<typeof Content>();
  const extra: Record<string, Content.CosmeticDef> = {
    'back-free': { id: 'back-free', kind: 'cardBack', price: 0, earned: false },
    'back-season': { id: 'back-season', kind: 'cardBack', price: 0, earned: true },
    'back-season-xii': { id: 'back-season-xii', kind: 'cardBack', price: 0, earned: true },
    'back-sold': { id: 'back-sold', kind: 'cardBack', price: 300, earned: false },
    'plate-gold': { id: 'plate-gold', kind: 'plate', price: 0, earned: true },
  };
  return {
    ...actual,
    cosmeticDef: (id: unknown) =>
      typeof id === 'string' && extra[id] ? extra[id] : actual.cosmeticDef(id),
  };
});

import {
  FIRST_DECK_WIPE,
  RANK_FLOORS,
  RANKED_MIN_GAMES,
  SEASON_REWARDS,
  cleanCosmetics,
  deckExpired,
  grantCosmetics,
  inSeason,
  inUse,
  mergeCosmetics,
  periodStart,
  rewardSeasons,
  rewardsEarned,
  seasonAt,
  selfClaimed,
  wornSkin,
  type SeasonRewards,
} from './index';

const DAY = 86_400_000;
const NOV_10 = Date.UTC(2026, 10, 10, 12);
const DEC_10 = Date.UTC(2026, 11, 10, 12);
const JAN_10 = Date.UTC(2027, 0, 10, 12);

describe('saved decks last one season (DECISIONS #736)', () => {
  it('the first wipe is the turn of December 2026, at midnight Pacific', () => {
    expect(FIRST_DECK_WIPE).toBe(periodStart(DEC_10, 'month'));
    expect(FIRST_DECK_WIPE).toBe(seasonAt(NOV_10).ends);
  });

  it('nothing expires before the first wipe, however old', () => {
    expect(deckExpired({ bankedAt: 5 }, NOV_10)).toBe(false);
    expect(deckExpired({ bankedAt: Date.UTC(2026, 8, 1) }, FIRST_DECK_WIPE - 1)).toBe(false);
  });

  it('at the turn of the month every deck saved before it is gone, and one saved after it stays', () => {
    expect(deckExpired({ bankedAt: NOV_10 }, FIRST_DECK_WIPE)).toBe(true);
    expect(deckExpired({ bankedAt: FIRST_DECK_WIPE - 1 }, FIRST_DECK_WIPE)).toBe(true);
    expect(deckExpired({ bankedAt: FIRST_DECK_WIPE }, FIRST_DECK_WIPE)).toBe(false);
    expect(deckExpired({ bankedAt: DEC_10 }, DEC_10 + 5 * DAY)).toBe(false);
    expect(deckExpired({ bankedAt: DEC_10 }, JAN_10)).toBe(true);
  });

  it("a run played on into the new season saves its deck again, and that deck is the new season's", () => {
    const list = [
      { id: 'finished', bankedAt: NOV_10 },
      { id: 'still-going', bankedAt: DEC_10 - DAY },
    ];
    expect(inSeason(list, DEC_10).map((d) => d.id)).toEqual(['still-going']);
  });
});

describe("a season's rewards (DECISIONS #737)", () => {
  const rewards: SeasonRewards = {
    campaign: [
      { tier: 6, cosmetic: 'back-season' },
      { tier: 12, cosmetic: 'back-season-xii' },
    ],
    arena: [{ rank: 'Gold', cosmetic: 'plate-gold' }],
  };
  const gold = RANK_FLOORS[2];

  it('no season has rewards yet', () => {
    expect(Object.keys(SEASON_REWARDS)).toEqual([]);
    expect(rewardsEarned(undefined, { tierCleared: 12, peak: 2000, games: 50 })).toEqual([]);
  });

  it('the Campaign reward is for the highest Rift Tier cleared in the season', () => {
    const at = (tier: number): string[] =>
      rewardsEarned(rewards, { tierCleared: tier, peak: 0, games: 0 });
    expect(at(5)).toEqual([]);
    expect(at(6)).toEqual(['back-season']);
    expect(at(12)).toEqual(['back-season', 'back-season-xii']);
  });

  it('the Arena reward is for the peak rank, once enough ranked games are played to be on the board', () => {
    const at = (peak: number, games: number): string[] =>
      rewardsEarned(rewards, { tierCleared: 0, peak, games });
    expect(at(gold - 1, 20)).toEqual([]);
    expect(at(gold, RANKED_MIN_GAMES - 1)).toEqual([]);
    expect(at(gold, RANKED_MIN_GAMES)).toEqual(['plate-gold']);
    expect(at(gold + 400, 20)).toEqual(['plate-gold']);
  });

  it('this season and the one before can still be given', () => {
    expect(rewardSeasons(DEC_10).map((s) => s.key)).toEqual(['2026-12', '2026-11']);
    expect(rewardSeasons(JAN_10).map((s) => s.key)).toEqual(['2027-01', '2026-12']);
  });
});

describe('card backs and name plates (DECISIONS #737)', () => {
  it('a device may claim what is free, never what is earned or sold', () => {
    const sent = cleanCosmetics({
      owned: ['knight-sunwarden', 'back-free', 'back-season', 'back-sold', 'plate-gold', 'nope'],
    });
    expect(sent.owned).toEqual([
      'knight-sunwarden',
      'back-free',
      'back-season',
      'back-sold',
      'plate-gold',
    ]);
    expect(selfClaimed(sent).owned).toEqual(['knight-sunwarden', 'back-free']);
  });

  it('the server gives an earned one, once, and unknown ids are passed over', () => {
    const before = cleanCosmetics({ owned: ['knight-sunwarden'] });
    const after = grantCosmetics(before, ['back-season', 'back-season', 'made-up', 'plate-gold']);
    expect(after.owned).toEqual(['knight-sunwarden', 'back-season', 'plate-gold']);
    expect(grantCosmetics(after, ['back-season']).owned).toEqual(after.owned);
  });

  it('a slot holds only its own kind, and only what is owned is in use', () => {
    const c = cleanCosmetics({
      owned: ['back-season', 'plate-gold'],
      using: {
        cardBack: { id: 'back-season', at: 5 },
        plate: { id: 'back-season', at: 5 },
        hat: { id: 'plate-gold', at: 5 },
      },
    });
    expect(c.using).toEqual({ cardBack: { id: 'back-season', at: 5 } });
    expect(inUse(c, 'cardBack')).toBe('back-season');
    expect(inUse(c, 'plate')).toBeUndefined();
    const notOwned = cleanCosmetics({ using: { cardBack: { id: 'back-season', at: 5 } } });
    expect(inUse(notOwned, 'cardBack')).toBeUndefined();
  });

  it('a device that says it uses an earned card back keeps the choice only if the server owns it', () => {
    const device = cleanCosmetics({
      owned: ['back-season'],
      using: { cardBack: { id: 'back-season', at: 9 } },
    });
    const never = mergeCosmetics(cleanCosmetics(null), selfClaimed(device));
    expect(never.owned).toEqual([]);
    expect(inUse(never, 'cardBack')).toBeUndefined();
    const earned = mergeCosmetics(
      grantCosmetics(cleanCosmetics(null), ['back-season']),
      selfClaimed(device),
    );
    expect(inUse(earned, 'cardBack')).toBe('back-season');
  });

  it('the newest choice wins, and going back to the default is a choice', () => {
    const a = cleanCosmetics({
      owned: ['back-free'],
      using: { cardBack: { id: 'back-free', at: 10 } },
    });
    const b = cleanCosmetics({ owned: ['back-free'], using: { cardBack: { id: null, at: 20 } } });
    expect(inUse(mergeCosmetics(a, b), 'cardBack')).toBeUndefined();
    expect(mergeCosmetics(a, b).using).toEqual({ cardBack: { id: null, at: 20 } });
    expect(
      inUse(
        mergeCosmetics(b, { ...a, using: { cardBack: { id: 'back-free', at: 30 } } }),
        'cardBack',
      ),
    ).toBe('back-free');
  });

  it('copies made before card backs read as they did, and skins are untouched', () => {
    const old = cleanCosmetics({
      owned: ['knight-sunwarden'],
      worn: { knight: { skin: 'knight-sunwarden', at: 5 } },
    });
    expect(old).toEqual({
      owned: ['knight-sunwarden'],
      worn: { knight: { skin: 'knight-sunwarden', at: 5 } },
    });
    expect(wornSkin(mergeCosmetics(old, cleanCosmetics(null)), 'knight')).toBe('knight-sunwarden');
    // (a card back is never worn as a skin)
    expect(
      cleanCosmetics({ owned: ['back-free'], worn: { knight: { skin: 'back-free', at: 1 } } }).worn,
    ).toEqual({});
  });
});
