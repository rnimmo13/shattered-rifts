import { expect, it } from 'vitest';
import { COMBAT_DB as db } from '@sr/content/v2';
import { matchesManaCost } from './manaCost';
import { catalog, filterCatalog } from './deckCatalog';
it('separates Mana X from fixed costs and Spell Power spending', () => {
  const card = db.cards.strike!;
  expect(matchesManaCost({ ...card, cost: 0, x: true }, '0')).toBe(false);
  expect(matchesManaCost({ ...card, cost: 0, x: true }, 'X')).toBe(true);
  expect(matchesManaCost({ ...card, cost: 0, starX: true }, '0')).toBe(true);
  expect(matchesManaCost({ ...card, cost: 6 }, '5+')).toBe(true);
  expect(matchesManaCost({ ...card, cost: 0, unplayable: true }, '0')).toBe(false);
  expect(matchesManaCost({ ...card, unplayable: true }, 'unplayable')).toBe(true);
});
it('combines Mana, rarity, upgrades and text filters', () => {
  const result = filterCatalog(
    catalog(db),
    { pool: 'all', rarity: 'basic', text: 'strike', upgraded: false, manaCost: '1' },
    () => '',
  );
  expect(result.length).toBeGreaterThan(0);
  expect(
    result.every(
      (c) =>
        c.def.cost === 1 && c.def.rarity === 'basic' && c.def.name.toLowerCase().includes('strike'),
    ),
  ).toBe(true);
});
