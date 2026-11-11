// How long the Arena season has to run, in words (the Arena page's rank card and the Leaderboards both say it).

import { seasonAt } from '@sr/pvp';

/** How long until the season turns over ("12 days left"). */
export function seasonLeft(now: number): string {
  const ms = Math.max(0, seasonAt(now).ends - now);
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${days} ${days === 1 ? 'day' : 'days'} left`;
  const hours = Math.max(1, Math.floor(ms / 3_600_000));
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} left`;
}
