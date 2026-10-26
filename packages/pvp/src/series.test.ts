import { describe, expect, it } from 'vitest';
import { newSeries, scoreGame, seriesFor, seriesWinner } from './series';

describe('a best of three', () => {
  it('starts at game 1 with nobody ahead', () => {
    const s = newSeries();
    expect(s.game).toBe(1);
    expect(seriesWinner(s)).toBeNull();
  });

  it('is won by the first player to take two games', () => {
    let s = scoreGame(newSeries(), 'p1');
    expect(s).toEqual({ game: 2, wins: { p1: 1 } });
    expect(seriesWinner(s)).toBeNull();
    s = scoreGame(s, 'p2');
    expect(seriesWinner(s)).toBeNull();
    s = scoreGame(s, 'p1');
    expect(seriesWinner(s)).toBe('p1');
    expect(s.game).toBe(4);
  });

  it('can be won in two straight games', () => {
    const s = scoreGame(scoreGame(newSeries(), 'p2'), 'p2');
    expect(seriesWinner(s)).toBe('p2');
  });

  it('plays a drawn game again without scoring it', () => {
    const s = scoreGame(scoreGame(newSeries(), 'p1'), null);
    expect(s).toEqual({ game: 2, wins: { p1: 1 } });
  });

  it('shows the score by seat, with the game capped at 3', () => {
    const s = scoreGame(scoreGame(newSeries(), 'p1'), 'p2');
    // the seats swapped between games: p1 now sits in b
    expect(seriesFor(s, { a: 'p2', b: 'p1' }, false)).toEqual({
      game: 3,
      wins: { a: 1, b: 1 },
      over: false,
    });
    const done = scoreGame(s, 'p1');
    expect(seriesFor(done, { a: 'p1', b: 'p2' }, true)).toEqual({
      game: 3,
      wins: { a: 2, b: 1 },
      over: true,
    });
  });

  it('does not mutate the state it is given', () => {
    const s = newSeries();
    scoreGame(s, 'p1');
    expect(s).toEqual({ game: 1, wins: {} });
  });
});
