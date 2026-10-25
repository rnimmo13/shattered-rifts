import { describe, expect, it } from 'vitest';
import {
  cleanBoardName,
  periodEnd,
  believableStages,
  periodStart,
  pickGhost,
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
    // Saturday 24 Oct 2026, 15:00 UTC
    const sat = Date.UTC(2026, 9, 24, 15);
    expect(periodStart(sat, 'week')).toBe(Date.UTC(2026, 9, 19));
    expect(new Date(periodStart(sat, 'week')).getUTCDay()).toBe(1);
    // Monday itself, at the first moment and the last
    expect(periodStart(Date.UTC(2026, 9, 19), 'week')).toBe(Date.UTC(2026, 9, 19));
    expect(periodStart(Date.UTC(2026, 9, 25, 23, 59), 'week')).toBe(Date.UTC(2026, 9, 19));
    expect(periodEnd(sat, 'week')).toBe(Date.UTC(2026, 9, 26));
  });

  it('a month starts on the 1st, and the year turns over', () => {
    const t = Date.UTC(2026, 11, 31, 23);
    expect(periodStart(t, 'month')).toBe(Date.UTC(2026, 11, 1));
    expect(periodEnd(t, 'month')).toBe(Date.UTC(2027, 0, 1));
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
      row('a', 'maren', true, 1),
      row('a', 'maren', true, 2),
      row('a', 'kesh', false, 3),
      row('b', 'rivet', true, 4),
      row('b', 'rivet', true, 5),
      row('c', 'vesper', true, 6),
      row('c', 'vesper', true, 7),
      row('c', 'vesper', true, 8),
    ];
    const board = rankPvp(rows);
    expect(board.map((s) => s.name)).toEqual(['c', 'b', 'a']);
    expect(board[2]).toMatchObject({ wins: 2, losses: 1 });
    expect(board[2]?.heroes).toEqual([
      { hero: 'maren', wins: 2, losses: 0 },
      { hero: 'kesh', wins: 0, losses: 1 },
    ]);
  });

  it('shows a player under their newest name, and cuts the board to its size', () => {
    const rows = [row('a', 'maren', true, 1, 'Old'), row('a', 'maren', true, 9, 'New')];
    expect(rankPvp(rows)[0]?.name).toBe('New');
    const many = Array.from({ length: 140 }, (_, i) => row(`p${i}`, 'maren', true, i));
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
      hero: 'maren',
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
  it('a couple of stages at the start, then one more for every minute', () => {
    expect(believableStages(0)).toBe(2);
    expect(believableStages(59_000)).toBe(2);
    expect(believableStages(60_000)).toBe(3);
    expect(believableStages(10 * 60_000)).toBe(12);
    expect(believableStages(-5)).toBe(2);
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
    hero: 'maren',
    tier: 1,
    stage: 3,
    wins,
    losses,
    ghostWins: 0,
    ghostLosses: 0,
    lastAt,
  });

  it('are picked from the upper half by wins, never your own, never a stale one', () => {
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
    expect(pickGhost([deck('m', 'me', 3)], 'me', 0.5, NOW)).toBeNull();
    // a single deck is its own upper half
    expect(pickGhost([deck('only', 'ann', 0)], 'me', 0.99, NOW)?.id).toBe('only');
  });

  it('are ranked by their wins, and so are the people who play them', () => {
    const g = (ghost: string, won: boolean, human: string, at: number): GhostGame => ({
      ghost,
      ownerName: ghost,
      hero: 'maren',
      tier: 1,
      stage: null,
      ghostWon: won,
      human,
      humanName: human,
      humanHero: 'kesh',
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

describe('where a player stands', () => {
  it('is found anywhere in the full ranking, and the id never goes out with a place', () => {
    const rows: PvpRow[] = Array.from({ length: 130 }, (_, i) => ({
      player: `p${i}`,
      name: `P${i}`,
      hero: 'maren',
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
