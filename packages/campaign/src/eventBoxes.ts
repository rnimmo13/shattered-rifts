// Which option box holds the card an event names (Robert, 2026-10-30: "all events with options that have cards tied to them, the card
// needs to be in the option box"). Kept apart from the events, so a save can repair an event laid out by an older build when it loads.

import type { EventCtx } from './deals';
import type { EventOption } from './types';

/** The cards this option takes or gives, when they are the card the event names. */
export function offerShows(id: EventOption['id'], cardOffer: string): EventOption['shows'] | undefined {
  if (!cardOffer) return undefined;
  if (id === 'card' || id === 'ancestor' || id === 'cross') return { lose: [], gain: [cardOffer] };
  if (id === 'burn') return { lose: [cardOffer], gain: [] };
  return undefined;
}

/** An event saved before its card went in the box gets it there now. */
export function boxNamedCard(ev: EventCtx): void {
  for (const o of ev.options) {
    if (o.shows || o.deal) continue;
    const shows = offerShows(o.id, ev.cardOffer);
    if (shows) o.shows = shows;
  }
}
