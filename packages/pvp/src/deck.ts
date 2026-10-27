// Is this a deck the server will let into a match? (The server cannot know a deck was really banked: it can only check
// that it is a legal deck of a real Riftwalker. That is enough for a friends test.)

import { canAdd, MAX_TIER } from '@sr/campaign';
import {
  COMBAT_DB,
  RIFTWALKERS,
  V2_DECK_RULES,
  isDeckCard,
  canonicalCard,
  canonicalHero,
  stripRoll,
} from '@sr/content/v2';
import { MAX_MATCH_DECKS, type Entry } from './protocol';

export const MAX_DECK = 80;
export const MAX_NAME = 24;
/** A run holds at most five Boons; a little headroom for the ones a later build may allow. */
export const MAX_BOONS = 8;
/** The most copies of one card an Arena deck holds: the same 5 as a run (DECISIONS #337). */
export const MAX_COPIES = 5;

export interface Checked {
  ok: true;
  entry: Entry;
}
export interface Rejected {
  ok: false;
  message: string;
}

const isCardId = (id: string): boolean => isDeckCard(id);

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
  const sentDeck = e['deck'];
  if (!Array.isArray(sentDeck) || !sentDeck.every((c) => typeof c === 'string'))
    return { ok: false, message: 'The deck is not a list of cards.' };
  // (a card taken out of the game becomes its replacement, so a deck saved before still plays: DECISIONS #312)
  // (a replacement that would break a copy limit is left out rather than the whole deck refused)
  const deck: string[] = [];
  {
    const seen = new Map<string, number>();
    for (const sent of sentDeck) {
      const id = canonicalCard(sent);
      if (id !== sent && (!canAdd(deck, id, false) || (seen.get(id) ?? 0) >= MAX_COPIES)) continue;
      seen.set(id, (seen.get(id) ?? 0) + 1);
      deck.push(id);
    }
  }
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
    // (copies only: the Legendary and Ancestral limits are the Arena's, checkArenaEntry)
    if (!canAdd(held, id, false))
      return {
        ok: false,
        message: `The deck breaks the deck rules at "${COMBAT_DB.cards[id]?.name ?? id}".`,
      };
    const n = (copies.get(id) ?? 0) + 1;
    copies.set(id, n);
    if (n > MAX_COPIES)
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

/**
 * A deck as it may enter an Arena match: a valid deck (checkEntry) within today's limits of one Legendary and two Ancestral cards
 * (DECISIONS #238). Only the Arena's doors use this: a Vault keeps a deck built before the limits, and a ghost plays as it was saved.
 */
export function checkArenaEntry(raw: unknown): Checked | Rejected {
  const checked = checkEntry(raw);
  if (!checked.ok) return checked;
  const count = (r: string): number =>
    checked.entry.deck.filter(
      (id) => COMBAT_DB.cards[stripRoll(id).replace(/\+$/, '')]?.rarity === r,
    ).length;
  const legends = count('legendary');
  const ancestral = count('ancestral');
  if (legends > V2_DECK_RULES.maxLegendary)
    return {
      ok: false,
      message: `The Arena takes decks with ${V2_DECK_RULES.maxLegendary} Legendary card; this one holds ${legends}.`,
    };
  if (ancestral > V2_DECK_RULES.maxAncestral)
    return {
      ok: false,
      message: `The Arena takes decks with at most ${V2_DECK_RULES.maxAncestral} Ancestral cards; this one holds ${ancestral}.`,
    };
  return checked;
}

/**
 * Check the decks a player brings to a match (DECISIONS #307): 1 to MAX_MATCH_DECKS, each one fit for the Arena. They are one player's,
 * so every deck carries the first one's name and board id. Any deck that fails refuses the lot (the browser only sends decks that pass).
 */
export function checkArenaDecks(raw: unknown): { ok: true; decks: Entry[] } | Rejected {
  if (!Array.isArray(raw) || raw.length === 0) return { ok: false, message: 'No deck was sent.' };
  if (raw.length > MAX_MATCH_DECKS)
    return { ok: false, message: `Bring at most ${MAX_MATCH_DECKS} decks to a match.` };
  const decks: Entry[] = [];
  for (const d of raw as unknown[]) {
    const c = checkArenaEntry(d);
    if (!c.ok) return c;
    decks.push(c.entry);
  }
  const first = decks[0] as Entry;
  return {
    ok: true,
    decks: decks.map((e) => {
      const { who: _who, ...rest } = e;
      void _who;
      return { ...rest, name: first.name, ...(first.who ? { who: first.who } : {}) };
    }),
  };
}
