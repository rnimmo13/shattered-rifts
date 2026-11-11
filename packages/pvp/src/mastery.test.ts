// Hero mastery (DECISIONS #739): the numbers only grow, a campaign cleared masters a Riftwalker and gives its card back, and the
// earned log keeps one entry per cosmetic.

import { describe, expect, it } from 'vitest';
import { MAX_TIER } from '@sr/campaign';
import { CARD_BACKS, MASTERY_HEROES, RIFTWALKERS, cosmeticDef, heroCardBack } from '@sr/content/v2';
import {
  MASTERY_TIERS,
  cleanEarned,
  cleanMastery,
  countRuns,
  deckRunFacts,
  heroMastery,
  historyRunFacts,
  matchCountsOnly,
  withCampaignOf,
  isMastered,
  masteryRewards,
  masteryTotals,
  mergeMastery,
  sameMastery,
  tiersCleared,
  unseenEarned,
  withArenaWin,
  withEarned,
  withRun,
  withSeen,
} from './mastery';
import { selfClaimable } from './cosmetics';

describe('the mastery card backs', () => {
  it('there is one for every Riftwalker, earned and never free to take', () => {
    expect([...MASTERY_HEROES].sort()).toEqual(Object.keys(RIFTWALKERS).sort());
    expect(CARD_BACKS).toHaveLength(MASTERY_HEROES.length);
    for (const hero of MASTERY_HEROES) {
      const def = cosmeticDef(heroCardBack(hero));
      expect(def).toMatchObject({ kind: 'cardBack', earned: true, crest: hero });
      expect(selfClaimable(heroCardBack(hero))).toBe(false);
    }
  });
});

describe('a run counted', () => {
  it('the campaign has as many tiers as the game', () => {
    expect(MASTERY_TIERS).toBe(MAX_TIER);
  });

  it('a tier counts once it is cleared', () => {
    expect(tiersCleared({ tier: 1, tierCleared: false })).toBe(0);
    expect(tiersCleared({ tier: 4, tierCleared: false })).toBe(3);
    expect(tiersCleared({ tier: 4, tierCleared: true })).toBe(4);
  });

  it('the last tier is cleared only by winning (its Wardens fall before Drago does)', () => {
    expect(tiersCleared({ tier: MAX_TIER, tierCleared: true })).toBe(MAX_TIER - 1);
    expect(tiersCleared({ tier: MAX_TIER, tierCleared: true, won: true })).toBe(MAX_TIER);
    // (a run of the older, longer campaign)
    expect(tiersCleared({ tier: 17, tierCleared: true })).toBe(MAX_TIER - 1);
  });

  it('the highest tier is kept, and never falls', () => {
    let m = withRun({}, 'knight', { tier: 6, tierCleared: true }, false);
    expect(heroMastery(m, 'knight').best).toBe(6);
    const same = withRun(m, 'knight', { tier: 3, tierCleared: true }, false);
    expect(same).toBe(m);
    m = withRun(m, 'knight', { tier: 8, tierCleared: false }, false);
    expect(heroMastery(m, 'knight').best).toBe(7);
    expect(heroMastery(m, 'monk').best).toBe(0);
  });

  it('a campaign cleared is counted when it is new, and masters the Riftwalker', () => {
    const won = { tier: MAX_TIER, tierCleared: true, won: true };
    let m = withRun({}, 'shaman', won, true);
    expect(heroMastery(m, 'shaman')).toEqual({
      best: MAX_TIER,
      clears: 1,
      arenaWins: 0,
      ghostWins: 0,
    });
    expect(isMastered(heroMastery(m, 'shaman'))).toBe(true);
    // the same run again
    expect(withRun(m, 'shaman', won, false)).toBe(m);
    m = withRun(m, 'shaman', won, true);
    expect(heroMastery(m, 'shaman').clears).toBe(2);
  });

  it('an old Riftwalker id is read as its class, and an unknown one counts for nothing', () => {
    const m = withRun({}, 'maren', { tier: 2, tierCleared: true }, false);
    expect(heroMastery(m, 'knight').best).toBe(2);
    expect(withRun({}, 'nobody', { tier: 2, tierCleared: true }, false)).toEqual({});
    expect(withArenaWin({}, 'nobody')).toEqual({});
  });

  it('Arena wins add up', () => {
    const m = withArenaWin(withArenaWin({}, 'monk'), 'monk');
    expect(heroMastery(m, 'monk')).toEqual({ best: 0, clears: 0, arenaWins: 2, ghostWins: 0 });
    expect(isMastered(heroMastery(m, 'monk'))).toBe(false);
  });
});

describe('two copies together', () => {
  it('the larger of each number wins, whichever side has it', () => {
    const a = {
      knight: { best: 5, clears: 0, arenaWins: 9, ghostWins: 0 },
      monk: { best: 2, clears: 0, arenaWins: 0, ghostWins: 0 },
    };
    const b = {
      knight: { best: 12, clears: 2, arenaWins: 4, ghostWins: 0 },
      hunter: { best: 1, clears: 0, arenaWins: 1, ghostWins: 0 },
    };
    const merged = mergeMastery(a, b);
    expect(merged).toEqual({
      knight: { best: 12, clears: 2, arenaWins: 9, ghostWins: 0 },
      monk: { best: 2, clears: 0, arenaWins: 0, ghostWins: 0 },
      hunter: { best: 1, clears: 0, arenaWins: 1, ghostWins: 0 },
    });
    expect(sameMastery(merged, mergeMastery(b, a))).toBe(true);
    expect(sameMastery(a, merged)).toBe(false);
    expect(masteryTotals(merged)).toEqual({ clears: 2, arenaWins: 10, ghostWins: 0, mastered: 1 });
  });
});

describe('what arrives from outside', () => {
  it('is kept only as far as it makes sense', () => {
    expect(cleanMastery(null)).toEqual({});
    expect(cleanMastery([1, 2])).toEqual({});
    expect(
      cleanMastery({
        knight: { best: 99, clears: -4, arenaWins: 2.9 },
        monk: { best: 'x', clears: 1 },
        nobody: { best: 3, clears: 0, arenaWins: 0, ghostWins: 0 },
        hunter: { best: 0, clears: 0, arenaWins: 0, ghostWins: 0 },
        __proto__: { best: 3 },
        shaman: 7,
      }),
    ).toEqual({
      knight: { best: MAX_TIER - 1, clears: 0, arenaWins: 2, ghostWins: 0 },
      // (a campaign cleared is every tier cleared)
      monk: { best: MAX_TIER, clears: 1, arenaWins: 0, ghostWins: 0 },
    });
  });
});

describe('what mastery gives', () => {
  it('the card back of every Riftwalker mastered, and nothing for the rest', () => {
    const m = {
      knight: { best: MAX_TIER, clears: 1, arenaWins: 0, ghostWins: 0 },
      monk: { best: 11, clears: 0, arenaWins: 500, ghostWins: 0 },
    };
    expect(masteryRewards(m)).toEqual(['back-knight']);
    expect(masteryRewards({})).toEqual([]);
  });
});

describe('the server counts the campaign (DECISIONS #741)', () => {
  const won = { run: 'r~a', hero: 'knight', tier: MAX_TIER, tierCleared: true, won: true };

  it('a won run is a clear once, whichever record tells of it', () => {
    const first = countRuns({}, [], [won]);
    expect(heroMastery(first.mastery, 'knight').clears).toBe(1);
    expect(first.newlyCounted).toEqual(['r~a']);
    // the same run again: from its deck, then from the run history
    const again = countRuns(first.mastery, first.newlyCounted, [won, won]);
    expect(again.mastery).toBe(first.mastery);
    expect(again.newlyCounted).toEqual([]);
    // another run of the same Riftwalker
    const second = countRuns(first.mastery, first.newlyCounted, [{ ...won, run: 'r~b' }]);
    expect(heroMastery(second.mastery, 'knight').clears).toBe(2);
  });

  it('a saved deck and a history record of one run name the same run', () => {
    const deck = deckRunFacts({ id: 'r~seed-1', hero: 'monk', tier: 12, stage: 3, won: true });
    const record = historyRunFacts({ id: 'seed-1', at: 5, hero: 'monk', tier: 12, won: true });
    expect(record?.run).toBe(deck.run);
    const both = countRuns({}, [], [deck, record!]);
    expect(heroMastery(both.mastery, 'monk').clears).toBe(1);
  });

  it('a deck says how far its run has got, and a clear only when it is marked won', () => {
    expect(deckRunFacts({ id: 'r~x', hero: 'monk', tier: 5, stage: 3 })).toMatchObject({
      tier: 5,
      tierCleared: true,
      won: false,
    });
    expect(deckRunFacts({ id: 'r~x', hero: 'monk', tier: 5, stage: 0 }).tierCleared).toBe(false);
    const unmarked = countRuns(
      {},
      [],
      [deckRunFacts({ id: 'r~x', hero: 'monk', tier: 12, stage: 3 })],
    );
    expect(heroMastery(unmarked.mastery, 'monk')).toMatchObject({ best: MAX_TIER - 1, clears: 0 });
  });

  it('a history record is won if it says so, or if its last fight beat the last enemy', () => {
    expect(historyRunFacts({ id: 'a', hero: 'knight', tier: 12 })?.won).toBe(false);
    expect(historyRunFacts({ id: 'a', hero: 'knight', tier: 12, won: true })?.won).toBe(true);
    const fight = (won: boolean, enemies: string[]) => ({ won, setup: { b: { enemies } } });
    const rec = (lastFight: unknown) =>
      historyRunFacts({ id: 'a', hero: 'knight', tier: 12, lastFight });
    expect(rec(fight(true, ['vorthax']))?.won).toBe(true);
    expect(rec(fight(false, ['vorthax']))?.won).toBe(false);
    expect(rec(fight(true, ['squire']))?.won).toBe(false);
    // a run that was saved and ended had cleared its tier; one that fell had not
    expect(historyRunFacts({ id: 'a', hero: 'knight', tier: 4, end: 'banked' })?.tierCleared).toBe(
      true,
    );
    expect(
      historyRunFacts({ id: 'a', hero: 'knight', tier: 4, end: 'collapsed' })?.tierCleared,
    ).toBe(false);
    expect(historyRunFacts({ id: '', hero: 'knight', tier: 4 })).toBeNull();
    expect(historyRunFacts('x')).toBeNull();
  });

  it("only a device's match counts are taken from it", () => {
    const device = {
      knight: { best: 12, clears: 9, arenaWins: 3, ghostWins: 5 },
      monk: { best: 6, clears: 0, arenaWins: 0, ghostWins: 0 },
    };
    expect(matchCountsOnly(device)).toEqual({
      knight: { best: 0, clears: 0, arenaWins: 3, ghostWins: 5 },
    });
    const server = { knight: { best: 4, clears: 0, arenaWins: 7, ghostWins: 1 } };
    expect(withCampaignOf(server, device)).toEqual({
      knight: { best: 4, clears: 0, arenaWins: 7, ghostWins: 5 },
    });
  });

  it('a win against a ghost is counted apart from a win against a player', () => {
    const m = withArenaWin(withArenaWin(withArenaWin({}, 'monk'), 'monk', true), 'monk', true);
    expect(heroMastery(m, 'monk')).toEqual({ best: 0, clears: 0, arenaWins: 1, ghostWins: 2 });
  });
});

describe('the earned log', () => {
  it('keeps one entry per cosmetic, newest first, and remembers what was seen', () => {
    let log = withEarned([], ['back-knight'], 'mastery', 100);
    log = withEarned(log, ['back-knight', 'back-monk', 'no-such-thing'], 'mastery', 200);
    expect(log.map((e) => [e.cosmetic, e.at])).toEqual([
      ['back-monk', 200],
      ['back-knight', 100],
    ]);
    expect(unseenEarned(log)).toHaveLength(2);
    log = withSeen(log, ['cosmetic:back-knight']);
    expect(unseenEarned(log).map((e) => e.cosmetic)).toEqual(['back-monk']);
    // through the wire and back
    expect(cleanEarned(JSON.parse(JSON.stringify(log)))).toEqual(log);
  });

  it('drops what it does not know', () => {
    expect(cleanEarned('x')).toEqual([]);
    expect(
      cleanEarned([
        { cosmetic: 'no-such-thing', at: 1, why: 'mastery' },
        { cosmetic: 'back-knight', at: -1, why: 'mastery' },
        { cosmetic: 'back-monk', at: 5, why: 'something else' },
        null,
      ]),
    ).toEqual([{ id: 'cosmetic:back-monk', at: 5, cosmetic: 'back-monk', why: 'gift' }]);
  });
});
