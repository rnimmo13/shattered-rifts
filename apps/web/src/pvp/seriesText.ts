// How the best-of-three reads on screen: "Game 2 of 3 · You 1 – 0 Maren". The score arrives by seat; the player reads it as "you" and "them".

import type { Series } from '@sr/pvp';
import { SERIES_MAX_GAMES } from '@sr/pvp';

type Seat = 'a' | 'b';

/** Wins for you and for your opponent, given the seat you hold. */
export function scoreFor(series: Series, seat: Seat): { me: number; foe: number } {
  const foe: Seat = seat === 'a' ? 'b' : 'a';
  return { me: series.wins[seat], foe: series.wins[foe] };
}

/** "Game 2 of 3 · You 1 – 0 Maren" (the game number is left off once the match is decided). */
export function seriesLine(series: Series, seat: Seat, foeName: string): string {
  const { me, foe } = scoreFor(series, seat);
  const score = `You ${me} – ${foe} ${foeName}`;
  return series.over ? score : `Game ${series.game} of ${SERIES_MAX_GAMES} · ${score}`;
}
