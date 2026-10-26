// Constructed decks kept in this browser (DECISIONS #242): built card by card in the Constructed builder, for the Constructed Arena.

import { checkConstructed } from '@sr/pvp';

const KEY = 'sr.constructedDecks';
export const CONSTRUCTED_SLOTS = 12;

export interface ConstructedDeck {
  id: string;
  name: string;
  hero: string;
  deck: string[];
  at: number;
}

export function loadConstructed(): ConstructedDeck[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(v)) return [];
    return v.filter(
      (d): d is ConstructedDeck =>
        typeof d === 'object' &&
        d !== null &&
        typeof (d as ConstructedDeck).id === 'string' &&
        typeof (d as ConstructedDeck).name === 'string' &&
        typeof (d as ConstructedDeck).hero === 'string' &&
        Array.isArray((d as ConstructedDeck).deck),
    );
  } catch {
    return [];
  }
}

/** Keep the list (false when the browser would not store it). */
export function saveConstructed(list: readonly ConstructedDeck[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, CONSTRUCTED_SLOTS)));
    return true;
  } catch {
    return false;
  }
}

/** Whether a kept deck is still legal (a card can leave a pool, or change rarity, in a new version). */
export const stillLegal = (d: ConstructedDeck): boolean => checkConstructed(d.hero, d.deck).ok;
