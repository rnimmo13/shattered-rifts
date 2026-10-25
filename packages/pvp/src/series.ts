// A match is a best of three: the first player to win two games wins the match. Pure rules for keeping the score (the room
// keeps the state, keyed by player id, because the seats swap whenever the order of play is decided again).

import type { Seat, Series } from './protocol';
import { SERIES_MAX_GAMES, SERIES_WINS } from './protocol';

/** The score of a match in progress: the game being played (1, 2, 3) and each player's wins, by player id. */
export interface SeriesState {
  game: number;
  wins: Record<string, number>;
}

export const newSeries = (): SeriesState => ({ game: 1, wins: {} });

/** A game ended: the winner (null for a drawn game, which does not count and is played again) scores, and the next game is due. */
export function scoreGame(s: SeriesState, winner: string | null): SeriesState {
  if (winner === null) return { game: s.game, wins: { ...s.wins } };
  return { game: s.game + 1, wins: { ...s.wins, [winner]: (s.wins[winner] ?? 0) + 1 } };
}

/** Who has won the match (two game wins), if anyone. */
export function seriesWinner(s: SeriesState): string | null {
  for (const [id, n] of Object.entries(s.wins)) if (n >= SERIES_WINS) return id;
  return null;
}

/** The score as the players see it, by the seat each sits in now. */
export function seriesFor(
  s: SeriesState,
  ids: Partial<Record<Seat, string>>,
  over: boolean,
): Series {
  const wins = (seat: Seat): number => {
    const id = ids[seat];
    return id ? (s.wins[id] ?? 0) : 0;
  };
  return { game: Math.min(s.game, SERIES_MAX_GAMES), wins: { a: wins('a'), b: wins('b') }, over };
}
