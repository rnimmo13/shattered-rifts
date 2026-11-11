import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { BrokenDeck } from '@sr/pvp';
import { BrokenNotices, InactiveDecks } from './BrokenDecks';

const broken = (over: Partial<BrokenDeck>): BrokenDeck => ({
  id: 'r~old',
  hero: 'knight',
  tier: 4,
  cards: 31,
  bankedAt: Date.UTC(2026, 10, 3, 12),
  fault: 'card',
  inactive: false,
  ...over,
});
const none = (): void => undefined;
const notices = (decks: BrokenDeck[]): string =>
  renderToStaticMarkup(
    createElement(BrokenNotices, { decks, onAcknowledge: none, onRemove: none }),
  );
const inactive = (decks: BrokenDeck[]): string =>
  renderToStaticMarkup(createElement(InactiveDecks, { decks, onRemove: none }));

describe('saved decks an update left unplayable (DECISIONS #754)', () => {
  it('a deck not yet acknowledged has a notice that says why, with Got it and Remove', () => {
    const html = notices([broken({})]);
    expect(html).toContain('An update left this deck unplayable');
    expect(html).toContain('Knight');
    expect(html).toContain('Tier 4');
    expect(html).toContain('31 cards');
    expect(html).toContain('It holds a card that is no longer in the game.');
    expect(html).toContain('Got it');
    expect(html).toContain('Remove');
    // (and it is not yet among the inactive ones)
    expect(inactive([broken({})])).toBe('');
  });

  it('once acknowledged it has no notice, and is listed as inactive', () => {
    const decks = [broken({ inactive: true, hero: 'retired-class', fault: 'hero' })];
    expect(notices(decks)).toBe('');
    const html = inactive(decks);
    expect(html).toContain('Inactive decks (1)');
    expect(html).toContain('Unknown Riftwalker');
    expect(html).toContain('Its Riftwalker is no longer in the game.');
  });
});
