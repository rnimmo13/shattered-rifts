// Is this a deck the server will let into a match? (The server cannot know a deck was really banked: it can only check
// that it is a legal deck of a real Riftwalker. That is enough for a friends test.)

import { canAdd, MAX_TIER } from '@sr/campaign';
import { COMBAT_DB, RIFTWALKERS, V2_DECK_RULES, rollOf } from '@sr/content/v2';
import type { Entry } from './protocol';

export const MAX_DECK = 80;
export const MAX_NAME = 24;
/** A run holds at most five Boons; a little headroom for the ones a later build may allow. */
export const MAX_BOONS = 8;
/** Basic cards have no copy limit in a run, but 80 of the best one is not a deck. */
export const MAX_BASIC_COPIES = 10;

export interface Checked {
  ok: true;
  entry: Entry;
}
export interface Rejected {
  ok: false;
  message: string;
}

const isCardId = (id: string): boolean =>
  Object.hasOwn(COMBAT_DB.cards, id) || (rollOf(id) !== 0 && COMBAT_DB.cards[id] !== undefined);

/** Strip anything odd out of a display name. */
export function cleanName(raw: unknown): string {
  const s = typeof raw === 'string' ? raw : '';
  // keep printable characters only (no control characters, no angle brackets)
  const kept = Array.from(s)
    .filter((ch) => {
      const c = ch.codePointAt(0) ?? 0;
      return c >= 0x20 && c !== 0x7f && ch !== '<' && ch !== '>';
    })
    .join('');
  return kept.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME) || 'Riftwalker';
}

/** Check an entry that arrived over the wire (it can be anything) and return a clean copy, or why it is refused. */
export function checkEntry(raw: unknown): Checked | Rejected {
  if (typeof raw !== 'object' || raw === null) return { ok: false, message: 'No deck was sent.' };
  const e = raw as Record<string, unknown>;
  const hero = e['hero'];
  if (typeof hero !== 'string' || !Object.hasOwn(RIFTWALKERS, hero))
    return { ok: false, message: 'Unknown Riftwalker.' };
  const deck = e['deck'];
  if (!Array.isArray(deck) || !deck.every((c) => typeof c === 'string'))
    return { ok: false, message: 'The deck is not a list of cards.' };
  if (deck.length < V2_DECK_RULES.minSize || deck.length > MAX_DECK)
    return {
      ok: false,
      message: `A deck holds ${V2_DECK_RULES.minSize} to ${MAX_DECK} cards (this has ${deck.length}).`,
    };
  const cards: string[] = deck;
  const held: string[] = [];
  const copies = new Map<string, number>();
  for (const id of cards) {
    // (a Sanctum-rolled copy like "hi~strike" is derived on demand; nothing else off the table is a card)
    if (!isCardId(id)) return { ok: false, message: `Unknown card "${id.slice(0, 40)}".` };
    if (!canAdd(held, id))
      return {
        ok: false,
        message: `The deck breaks the deck rules at "${COMBAT_DB.cards[id]?.name ?? id}".`,
      };
    const n = (copies.get(id) ?? 0) + 1;
    copies.set(id, n);
    if (n > MAX_BASIC_COPIES)
      return { ok: false, message: `Too many copies of "${COMBAT_DB.cards[id]?.name ?? id}".` };
    held.push(id);
  }
  // Boons that are not in the game (a retired one, a made-up id) are left out rather than refusing the deck
  const boons: string[] = [];
  if (Array.isArray(e['boons']))
    for (const b of e['boons'] as unknown[])
      if (
        typeof b === 'string' &&
        Object.hasOwn(COMBAT_DB.boons, b) &&
        !boons.includes(b) &&
        boons.length < MAX_BOONS
      )
        boons.push(b);
  const tier = e['tier'];
  const t =
    typeof tier === 'number' && Number.isInteger(tier) ? Math.min(MAX_TIER, Math.max(1, tier)) : 1;
  const st = e['stage'];
  const stage = typeof st === 'number' && Number.isInteger(st) && st >= 0 && st <= 3 ? st : null;
  return {
    ok: true,
    entry: {
      name: cleanName(e['name']),
      hero,
      deck: cards,
      boons,
      tier: t,
      ...(stage === null ? {} : { stage }),
    },
  };
}
