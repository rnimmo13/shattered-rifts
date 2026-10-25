// Is this a deck the server will let into a match? (The server cannot know a deck was really banked: it can only check
// that it is a legal deck of a real Riftwalker. That is enough for a friends test.)

import { canAdd, MAX_TIER } from '@sr/campaign';
import { COMBAT_DB, RIFTWALKERS, V2_DECK_RULES, isVariant, canonicalHero } from '@sr/content/v2';
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
  Object.hasOwn(COMBAT_DB.cards, id) || (isVariant(id) && COMBAT_DB.cards[id] !== undefined);

// Names are shown to other players, so abusive ones are replaced. Letters are compared after folding look-alikes (f u c k, f*ck,
// sh1t, Fuuuck) so the usual disguises do not work. Strong stems match anywhere in the name; short or ambiguous words only
// match as a whole word, so ordinary names (Cassidy, Dickens, Peacock, Scunthorpe, Torpedo, Spice) are left alone.
const STEMS = [
  'fuck',
  'shit',
  'cunt',
  'nigg',
  'fagg',
  'whore',
  'slut',
  'bitch',
  'bastard',
  'twat',
  'retard',
  'dildo',
  'penis',
  'vagina',
  'pussy',
  'blowjob',
  'handjob',
  'rapist',
  'paedo',
  'nazi',
  'tranny',
  'cocksuck',
  'motherf',
  'asshole',
  'dickhead',
  'jackoff',
  'jerkoff',
  'cumshot',
];
const WORDS = new Set([
  'ass',
  'arse',
  'dick',
  'cock',
  'cum',
  'piss',
  'fag',
  'rape',
  'tits',
  'boobs',
  'anal',
  'sex',
  'nig',
  'coon',
  'gook',
  'dyke',
  'prick',
  'fk',
  'fck',
  'wtf',
  'stfu',
  'kys',
  'milf',
  'wank',
  'spic',
  'kike',
  'chink',
  'pedo',
  'porn',
  'hitler',
  'molest',
]);
const LOOKALIKE: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '!': 'i',
  '|': 'i',
  '3': 'e',
  '4': 'a',
  '@': 'a',
  '5': 's',
  $: 's',
  '7': 't',
  '+': 't',
  '8': 'b',
  '9': 'g',
};

/** real words and places that contain a blocked stem */
const INNOCENT = /scunthorpe|cunningham/g;

const REPEATS = /(.)\1+/g;
/** three or more of the same letter in a row (asssss) read as two */
const LONG_RUNS = /(.)\1{2,}/g;

/** Fold a name for comparison: no accents, look-alike symbols as letters, lower case. */
const fold = (name: string): string =>
  Array.from(name.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase())
    .map((ch) => LOOKALIKE[ch] ?? ch)
    .join('');

/** Is this name abusive (so it is shown as "Riftwalker" instead)? */
export function isProfane(name: string): boolean {
  const folded = fold(name);
  // separated by symbols or spaces (f u c k, f.u.c.k) and stretched (fuuuck): squash to letters only, and collapse repeats
  const squashed = folded
    .replace(INNOCENT, '')
    .replace(/[^a-z]/g, '')
    .replace(REPEATS, '$1');
  if (STEMS.some((s) => squashed.includes(s.replace(REPEATS, '$1')))) return true;
  const words = folded.split(/[^a-z]+/).filter((w) => w !== '');
  return words.some((w) => WORDS.has(w) || WORDS.has(w.replace(LONG_RUNS, '$1$1')));
}

/** Strip anything odd out of a display name (and replace an abusive one). */
export function cleanName(raw: unknown): string {
  const s = typeof raw === 'string' ? raw : '';
  // keep printable characters only (no control characters, no angle brackets)
  const kept = Array.from(s)
    .filter((ch) => {
      const c = ch.codePointAt(0) ?? 0;
      return c >= 0x20 && c !== 0x7f && ch !== '<' && ch !== '>';
    })
    .join('');
  const name = kept.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
  return name === '' || isProfane(name) ? 'Riftwalker' : name;
}

/** Check an entry that arrived over the wire (it can be anything) and return a clean copy, or why it is refused. */
export function checkEntry(raw: unknown): Checked | Rejected {
  if (typeof raw !== 'object' || raw === null) return { ok: false, message: 'No deck was sent.' };
  const e = raw as Record<string, unknown>;
  const sent = e['hero'];
  // (an old id from before the Riftwalkers were named for their class is read as the class)
  const hero = typeof sent === 'string' ? canonicalHero(sent) : sent;
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
  const who = typeof e['who'] === 'string' && /^[0-9a-f]{64}$/.test(e['who']) ? e['who'] : null;
  const run = typeof e['run'] === 'string' && /^[0-9a-f]{8,16}$/.test(e['run']) ? e['run'] : null;
  return {
    ok: true,
    entry: {
      name: cleanName(e['name']),
      hero,
      deck: cards,
      boons,
      tier: t,
      ...(stage === null ? {} : { stage }),
      ...(run === null ? {} : { run }),
      ...(who === null ? {} : { who }),
    },
  };
}
