// Arena trophies (DECISIONS #238): when a week or a month of the Arena board ends, everyone who finished in its top TROPHY_PLACES
// (with at least one win) is given that period's trophy, for good. A weekly trophy and a monthly one are kept apart: the counts go on
// a player's card in the Arena, and the Trophy case lists each one with its period and place.

import { BOARD_SIZE, periodStart, standingsPvp, type Period, type PvpRow } from './board';

/** How many places on a finished board earn its trophy. */
export const TROPHY_PLACES = BOARD_SIZE;

/** How many trophies of each kind a player holds. */
export interface TrophyCount {
  week: number;
  month: number;
}

/** One trophy: which board, the period it was for (when it began), the place, and the name it was won under. */
export interface Trophy {
  kind: Period;
  period: number;
  place: number;
  name: string;
}

/** The period of this kind that ended most recently: [from, to). */
export function lastFinished(now: number, kind: Period): { from: number; to: number } {
  const to = periodStart(now, kind);
  return { from: periodStart(to - 1, kind), to };
}

/** Who earns the trophy of a finished period: its top TROPHY_PLACES with at least one win, in order. */
export function trophyWinners(
  rows: readonly PvpRow[],
): { player: string; name: string; place: number }[] {
  return standingsPvp(rows)
    .filter((s) => s.wins > 0)
    .slice(0, TROPHY_PLACES)
    .map((s, i) => ({ player: s.player, name: s.name, place: i + 1 }));
}

/** A trophy count as sent over the wire: anything that is not one is no trophies at all. */
export function cleanTrophies(raw: unknown): TrophyCount | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  const n = (x: unknown): number =>
    typeof x === 'number' && Number.isInteger(x) && x >= 0 ? Math.min(x, 9999) : 0;
  const out = { week: n(r['week']), month: n(r['month']) };
  return out.week || out.month ? out : undefined;
}
