// Sanctified and engraved cards go into the Arena as they are (DECISIONS #227): they are cards of the deck like any other.

import { describe, expect, it } from 'vitest';
import { createCombat } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS } from '@sr/content/v2';
import { checkGhostBoss } from '@sr/campaign';
import { checkEntry, setupFor, type Entry } from './index';

// a knight deck with a Hold Strike, an Opening-hand Dawn Smite, a Flare Defend, and a sanctified, engraved, upgraded Strike
const deck = [
  ...RIFTWALKERS.knight.starter.filter((c) => c !== 'dawn-smite').slice(1, 7),
  'hold^strike',
  'opening^dawn-smite',
  'flare^defend',
  'hi~hold^strike+',
];
const entry: Entry = { name: 'Tagger', hero: 'knight', deck, boons: [], tier: 3, stage: 3 };

describe('tagged and sanctified cards in the Arena', () => {
  it('an Arena entry keeps them, exactly as banked', () => {
    const r = checkEntry(entry);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.entry.deck).toEqual(deck);
  });

  it('a match plays them with their tags: the Opening hand card is in the first hand', () => {
    const { state } = createCombat(COMBAT_DB, setupFor('variants', entry, entry));
    expect(state.sides.a.hand.map((c) => c.card)).toContain('opening^dawn-smite');
    expect(COMBAT_DB.cards['hi~hold^strike+']).toMatchObject({ retain: true });
  });

  it('a ghost Warden made from such a deck is believed (it used to be refused)', () => {
    expect(
      checkGhostBoss({ hero: 'knight', deck, boons: [], name: 'Tagger', tier: 3, stage: 3 })?.deck,
    ).toEqual(deck);
  });

  it('a tag no event could have made is refused', () => {
    const power = Object.values(COMBAT_DB.cards).find(
      (c) => c.kind === 'power' && c.hero === 'knight',
    )!;
    expect(checkEntry({ ...entry, deck: [...deck.slice(0, 9), `flare^${power.id}`] }).ok).toBe(
      false,
    );
  });
});
