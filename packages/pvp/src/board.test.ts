import { describe, expect, it } from 'vitest';
import {
  checkUsername,
  cleanBoardName,
  periodEnd,
  believableStages,
  periodStart,
  pickGhost,
  ghostCleared,
  pickGhostBoss,
  rankGhosts,
  rankVsGhosts,
  rankPvp,
  rankRuns,
  standingsPvp,
  stagesInAll,
  withoutPlayer,
  type GhostDeck,
  type GhostGame,
  type PvpRow,
  type RunRow,
} from './board';

describe('the periods', () => {
  it('a week starts on Monday at midnight UTC', () => {
    // Saturday 24 Oct 2026, 15:00 UTC (08:00 in Pacific daylight time)
    const sat = Date.UTC(2026, 9, 24, 15);
    // the week began on Monday 19 Oct at 00:00 Pacific (07:00 UTC) and ends Monday 26 Oct at 00:00 Pacific
    expect(periodStart(sat, 'week')).toBe(Date.UTC(2026, 9, 19, 7));
    expect(periodEnd(sat, 'week')).toBe(Date.UTC(2026, 9, 26, 7));
    // Sunday evening in Pacific time is still the old week, even though UTC is already on Monday
    expect(periodStart(Date.UTC(2026, 9, 26, 6, 59), 'week')).toBe(Date.UTC(2026, 9, 19, 7));
    // and the first second of Monday Pacific is the new one
    expect(periodStart(Date.UTC(2026, 9, 26, 7), 'week')).toBe(Date.UTC(2026, 9, 26, 7));
  });

  it('a week turns over an hour later in UTC once the clocks go back (PST is UTC-8)', () => {
    // Monday 9 Nov 2026 00:00 PST = 08:00 UTC; the week before it started Monday 2 Nov, the day after daylight saving ended
    expect(periodStart(Date.UTC(2026, 10, 12, 12), 'week')).toBe(Date.UTC(2026, 10, 9, 8));
    expect(periodStart(Date.UTC(2026, 10, 5, 12), 'week')).toBe(Date.UTC(2026, 10, 2, 8));
    expect(periodEnd(Date.UTC(2026, 10, 5, 12), 'week')).toBe(Date.UTC(2026, 10, 9, 8));
    // the week that holds the change is 7 days and an hour long
    expect(
      periodEnd(Date.UTC(2026, 9, 28), 'week') - periodStart(Date.UTC(2026, 9, 28), 'week'),
    ).toBe(7 * 86_400_000 + 3_600_000);
    expect(
      periodEnd(Date.UTC(2026, 10, 12), 'week') - periodStart(Date.UTC(2026, 10, 12), 'week'),
    ).toBe(7 * 86_400_000);
  });

  it('a month starts on the 1st at midnight Pacific, and the year turns over', () => {
    const t = Date.UTC(2026, 11, 31, 23); // 15:00 on 31 Dec in Pacific
    expect(periodStart(t, 'month')).toBe(Date.UTC(2026, 11, 1, 8));
    expect(periodEnd(t, 'month')).toBe(Date.UTC(2027, 0, 1, 8));
    // 1 Nov 2026 is the Sunday daylight saving ends: its midnight is still PDT
    expect(periodStart(Date.UTC(2026, 10, 15), 'month')).toBe(Date.UTC(2026, 10, 1, 7));
  });
});

describe('the Arena board', () => {
  const row = (player: string, hero: string, won: boolean, at: number, name = player): PvpRow => ({
    player,
    name,
    hero,
    won,
    at,
  });

  it('ranks by wins, then fewer losses, then who got there first, and lists the characters played', () => {
    const rows = [
      row('a', 'knight', true, 1),
      row('a', 'knight', true, 2),
      row('a', 'hunter', false, 3),
      row('b', 'engineer', true, 4),
      row('b', 'engineer', true, 5),
      row('c', 'trapper', true, 6),
      row('c', 'trapper', true, 7),
      row('c', 'trapper', true, 8),
    ];
    const board = rankPvp(rows);
    expect(board.map((s) => s.name)).toEqual(['c', 'b', 'a']);
    expect(board[2]).toMatchObject({ wins: 2, losses: 1 });
    expect(board[2]?.heroes).toEqual([
      { hero: 'knight', wins: 2, losses: 0 },
      { hero: 'hunter', wins: 0, losses: 1 },
    ]);
  });

  it('shows a player under their newest name, and cuts the board to its size', () => {
    const rows = [row('a', 'knight', true, 1, 'Old'), row('a', 'knight', true, 9, 'New')];
    expect(rankPvp(rows)[0]?.name).toBe('New');
    const many = Array.from({ length: 140 }, (_, i) => row(`p${i}`, 'knight', true, i));
    expect(rankPvp(many)).toHaveLength(100);
    expect(rankPvp(many, 3)).toHaveLength(3);
  });
});

describe('the campaign board', () => {
  it('counts three stages to a Rift Tier', () => {
    expect(stagesInAll(1, 0)).toBe(0);
    expect(stagesInAll(1, 3)).toBe(3);
    expect(stagesInAll(2, 1)).toBe(4);
    expect(stagesInAll(0, -4)).toBe(0);
    expect(stagesInAll(3, 9)).toBe(9);
  });

  it('keeps each player’s furthest run and ranks by how far, earliest first on a tie', () => {
    const run = (player: string, tier: number, stage: number, at: number): RunRow => ({
      player,
      name: player,
      hero: 'knight',
      tier,
      stage,
      at,
    });
    const board = rankRuns([
      run('a', 1, 2, 10),
      run('a', 2, 1, 20), // a's best
      run('b', 2, 1, 15), // ties a, got there first
      run('c', 1, 3, 5),
    ]);
    expect(board.map((s) => s.name)).toEqual(['b', 'a', 'c']);
    expect(board[0]).toMatchObject({ tier: 2, stage: 1, total: 4 });
  });
});

describe('the campaign board with several characters', () => {
  const run = (player: string, hero: string, tier: number, stage: number, at: number) => ({
    player,
    name: player,
    hero,
    tier,
    stage,
    at,
  });
  it('lists a player once for each Riftwalker, each at its furthest', () => {
    const board = rankRuns([
      run('a', 'knight', 3, 1, 10),
      run('a', 'knight', 1, 2, 5), // an earlier, shorter knight run
      run('a', 'barbarian', 2, 3, 20),
      run('b', 'hunter', 1, 3, 15),
    ]);
    expect(board.map((s) => [s.name, s.hero])).toEqual([
      ['a', 'knight'],
      ['a', 'barbarian'],
      ['b', 'hunter'],
    ]);
  });
});

describe('usernames', () => {
  it('accept an ordinary name and give it a key that ignores how it is written', () => {
    const a = checkUsername('  Rob   the Brave ');
    expect(a).toMatchObject({ ok: true, name: 'Rob the Brave' });
    const b = checkUsername('rob_the-brave');
    expect(a.ok && b.ok && a.key === b.key).toBe(true);
  });
  it('refuse short, long, odd, reserved and blocked names', () => {
    for (const bad of [
      '',
      'ab',
      'x'.repeat(21),
      'no<tags>',
      'Riftwalker',
      'YOU',
      'what the fuck',
      '___',
      5,
      undefined,
    ])
      expect(checkUsername(bad).ok).toBe(false);
  });
});

describe('names', () => {
  it('are short, one line and kept clean', () => {
    expect(cleanBoardName('  Rob   the   Brave  ')).toBe('Rob the Brave');
    expect(cleanBoardName('x'.repeat(60))).toHaveLength(20);
    expect(cleanBoardName('')).toBe('Riftwalker');
    expect(cleanBoardName(undefined)).toBe('Riftwalker');
    expect(cleanBoardName('what the fuck')).toBe('Riftwalker');
    // an ordinary name that only contains a blocked string inside a longer word is left alone
    expect(cleanBoardName('Scunthorpe')).toBe('Scunthorpe');
  });
});

describe('how far a run can be believed to be', () => {
  it('three Rift Tiers at the start, then one more for every minute', () => {
    expect(believableStages(0)).toBe(9);
    expect(believableStages(59_000)).toBe(9);
    expect(believableStages(60_000)).toBe(10);
    expect(believableStages(10 * 60_000)).toBe(19);
    expect(believableStages(-5)).toBe(9);
  });
});

describe('names that are not abuse', () => {
  it('are left alone', () => {
    expect(cleanBoardName('Dickens')).toBe('Dickens');
    expect(cleanBoardName('Rapeseed Rob')).toBe('Rapeseed Rob');
  });
});

describe('ghosts', () => {
  const NOW = Date.UTC(2026, 9, 24);
  const deck = (id: string, owner: string, wins: number, losses = 0, lastAt = NOW): GhostDeck => ({
    id,
    owner,
    ownerName: owner,
    hero: 'knight',
    tier: 4,
    stage: 3,
    wins,
    losses,
    ghostWins: 0,
    ghostLosses: 0,
    lastAt,
  });

  it('are picked from the upper half by wins, never the deck you are playing, never a stale one', () => {
    const decks = [
      deck('a', 'ann', 9),
      deck('b', 'bob', 7),
      deck('c', 'cy', 4),
      deck('d', 'di', 1),
      deck('me', 'me', 20),
    ];
    // five decks, one is mine: four to choose from, the upper half is the best two
    const seen = new Set<string>();
    for (let r = 0; r < 1; r += 0.05) seen.add(pickGhost(decks, 'me', r, NOW)?.id ?? '-');
    expect([...seen].sort()).toEqual(['a', 'b']);
    // a deck that has not played for over a month is not offered
    const old = [deck('x', 'xan', 50, 0, NOW - 31 * 86_400_000), deck('y', 'yo', 1)];
    expect(pickGhost(old, 'me', 0.9, NOW)?.id).toBe('y');
    expect(pickGhost([], 'me', 0.5, NOW)).toBeNull();
    expect(pickGhost([deck('m', 'me', 3)], 'm', 0.5, NOW)).toBeNull();
    // another deck of yours may come up: only the exact deck you are playing is skipped
    expect(pickGhost([deck('m2', 'me', 3)], 'm1', 0.5, NOW)?.id).toBe('m2');
    // a single deck is its own upper half
    expect(pickGhost([deck('only', 'ann', 0)], 'me', 0.99, NOW)?.id).toBe('only');
  });

  it('are ranked by their wins, and so are the people who play them', () => {
    const g = (ghost: string, won: boolean, human: string, at: number): GhostGame => ({
      ghost,
      ownerName: ghost,
      hero: 'knight',
      tier: 1,
      stage: null,
      ghostWon: won,
      human,
      humanName: human,
      humanHero: 'hunter',
      at,
    });
    const games = [
      g('G1', true, 'p1', 1),
      g('G1', true, 'p2', 2),
      g('G2', false, 'p1', 3),
      g('G2', true, 'p3', 4),
    ];
    expect(rankGhosts(games).map((s) => [s.name, s.wins, s.losses])).toEqual([
      ['G1', 2, 0],
      ['G2', 1, 1],
    ]);
    const people = rankVsGhosts(games);
    expect(people.map((s) => [s.name, s.wins, s.losses])).toEqual([
      ['p1', 1, 1],
      ['p2', 0, 1],
      ['p3', 0, 1],
    ]);
  });
});

describe('ghost Wardens (DECISIONS #231)', () => {
  const NOW = Date.UTC(2026, 9, 24);
  const g = (id: string, tier: number, wins = 1, owner = id, stage = 3): GhostDeck => ({
    id,
    owner,
    ownerName: owner,
    hero: 'knight',
    tier,
    stage,
    wins,
    losses: 0,
    ghostWins: 0,
    ghostLosses: 0,
    lastAt: NOW,
  });
  const pickAll = (
    decks: GhostDeck[],
    tier: number,
    exclude: string[] = [],
    requester: string | null = null,
  ) => {
    const seen = new Set<string>();
    for (let roll = 0; roll < 1; roll += 0.02)
      seen.add(pickGhostBoss(decks, { requester, tier, exclude, roll, now: NOW })?.id ?? '-');
    return [...seen].sort();
  };

  it('only a deck that cleared Tier 3 can be a Warden (DECISIONS #235)', () => {
    expect(pickAll([g('t1', 1), g('t2', 2)], 5)).toEqual(['-']);
    expect(pickAll([g('t2', 2), g('t3', 3)], 3)).toEqual(['t3']);
    // Tier 3 reached but not cleared is not enough
    expect(pickAll([g('t3s2', 3, 1, 't3s2', 2)], 3)).toEqual(['-']);
    expect(pickAll([g('t4s0', 4, 1, 't4s0', 0)], 4)).toEqual(['t4s0']);
  });

  it('an ordinary ghost must have cleared Tier 3 too', () => {
    const seen = new Set<string>();
    for (let roll = 0; roll < 1; roll += 0.05)
      seen.add(pickGhost([g('low', 3, 9, 'low', 2), g('ok', 3, 1)], 'me', roll, NOW)?.id ?? '-');
    expect([...seen]).toEqual(['ok']);
    expect(ghostCleared(3, null)).toBe(false);
    expect(ghostCleared(3, 3)).toBe(true);
    expect(ghostCleared(4, 0)).toBe(true);
  });

  it("a deck from the player's tier or up to three below is chosen, never one above (DECISIONS #253)", () => {
    const decks = [g('t3', 3), g('t6', 6), g('t7', 7, 5), g('t8', 8, 9), g('t15', 15, 50)];
    // a Tier 6 player: never the Tier 7, 8 or 15 decks above; the nearest is their own tier
    expect(pickAll(decks, 6)).toEqual(['t6']);
    // a Tier 7 player: Tiers 6 and 7 are near, the better half by wins (the Tier 7 deck has more)
    expect(pickAll(decks, 7)).toEqual(['t7']);
    // a Tier 5 player: only Tier 3 is in range (Tier 6 is above)
    expect(pickAll(decks, 5)).toEqual(['t3']);
    expect(pickAll(decks, 15)).toEqual(['t15']);
    // a Tier 12 player: nothing between Tier 9 and Tier 12, so no ghost (the usual Warden)
    expect(pickAll(decks, 12)).toEqual(['-']);
  });

  it('never the same ghost twice in a run, and never your own', () => {
    const decks = [g('a', 4, 1, 'ann'), g('b', 4, 1, 'bob'), g('mine', 4, 9, 'me')];
    expect(pickAll(decks, 4, ['a'], 'me')).toEqual(['b']);
    expect(pickAll(decks, 4, ['a', 'b'], 'me')).toEqual(['-']);
  });
});

describe('where a player stands', () => {
  it('is found anywhere in the full ranking, and the id never goes out with a place', () => {
    const rows: PvpRow[] = Array.from({ length: 130 }, (_, i) => ({
      player: `p${i}`,
      name: `P${i}`,
      hero: 'knight',
      won: i < 129, // everyone wins once but the last
      at: i,
    }));
    const all = standingsPvp(rows);
    // (everyone has one win but p129, who has none: last place, below the 100 that are shown)
    expect(all).toHaveLength(130);
    expect(all.findIndex((s) => s.player === 'p129')).toBe(129);
    expect(rankPvp(rows)).toHaveLength(100);
    expect(rankPvp(rows).every((s) => !('player' in s))).toBe(true);
    expect('player' in withoutPlayer(all[0]!)).toBe(false);
  });
});

describe('names', () => {
  it('replaces abusive names, including the usual disguises', () => {
    for (const bad of [
      'fuck',
      'F U C K',
      'f.u.c.k',
      'fuuuck',
      'sh1t',
      'Sh!tlord',
      'b1tch',
      'xX_cunt_Xx',
      'asssss',
      'D1ck',
      'what the fuck',
      'nigga',
    ])
      expect(cleanBoardName(bad), bad).toBe('Riftwalker');
  });
  it('leaves ordinary names alone', () => {
    for (const ok of [
      'Scunthorpe',
      'Dickens',
      'Peacock',
      'Cassidy',
      'Torpedo',
      'Spice',
      'Swank',
      'Classic',
      'Assad',
      'Rob the Brave',
      'Analise',
      'Essex',
      'Hancock',
    ])
      expect(cleanBoardName(ok), ok).toBe(ok);
  });
});

describe('a ghost Warden is never your own deck', () => {
  const NOW = Date.UTC(2026, 9, 24);
  const deck = (id: string, owner: string, ownerName: string): GhostDeck => ({
    id,
    owner,
    ownerName,
    hero: 'knight',
    tier: 3,
    stage: 3,
    wins: 5,
    losses: 0,
    ghostWins: 0,
    ghostLosses: 0,
    lastAt: NOW,
  });
  const pick = (opts: { requester?: string | null; requesters?: string[]; name?: string }) =>
    pickGhostBoss([deck('mine-old', 'code-id', 'Sacagaweeda')], {
      requester: opts.requester ?? null,
      ...(opts.requesters ? { requesters: opts.requesters } : {}),
      ...(opts.name ? { name: opts.name } : {}),
      tier: 3,
      exclude: [],
      roll: 0.5,
      now: NOW,
    });

  it('saved under the Vault code, asked for while signed in: known by the code id or by the username', () => {
    // (asked for under the account id only, the old deck looked like someone else's)
    expect(pick({ requester: 'account-id' })?.id).toBe('mine-old');
    expect(pick({ requester: 'account-id', requesters: ['account-id', 'code-id'] })).toBeNull();
    expect(pick({ requester: 'account-id', name: 'sacagaweeda' })).toBeNull();
  });
});
