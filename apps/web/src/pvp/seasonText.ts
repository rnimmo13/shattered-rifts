// How long the Arena season has to run, in words (the Arena page's rank card and the Leaderboards both say it).

import { FIRST_DECK_WIPE, seasonAt } from '@sr/pvp';

const leftUntil = (ms: number): string => {
  const days = Math.floor(Math.max(0, ms) / 86_400_000);
  if (days >= 1) return `${days} ${days === 1 ? 'day' : 'days'} left`;
  const hours = Math.max(1, Math.floor(Math.max(0, ms) / 3_600_000));
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} left`;
};

/**
 * What the Saved decks page says about the season's end (DECISIONS #736): saved decks are wiped when the monthly leaderboard rolls
 * over, and when the next wipe is (the first one is at FIRST_DECK_WIPE, however many months away that is).
 */
export function deckWipeLine(now: number): string {
  const next = Math.max(seasonAt(now).ends, FIRST_DECK_WIPE);
  const day = new Date(next).toLocaleDateString([], { month: 'long', day: 'numeric' });
  const first = next === FIRST_DECK_WIPE ? ' for the first time' : '';
  return `Saved decks last one season: they are wiped${first} when the monthly leaderboard rolls over on ${day} (${leftUntil(next - now)}). Your cosmetics are never wiped.`;
}

/** How long until the season turns over ("12 days left"). */
export function seasonLeft(now: number): string {
  const ms = Math.max(0, seasonAt(now).ends - now);
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${days} ${days === 1 ? 'day' : 'days'} left`;
  const hours = Math.max(1, Math.floor(ms / 3_600_000));
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} left`;
}
