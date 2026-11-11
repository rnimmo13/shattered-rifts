import { describe, expect, it } from 'vitest';
import { COMBAT_DB } from '@sr/content/v2';
import { strikeVariant } from './weaponArt';

const mine = Object.values(COMBAT_DB.cards).filter((c) => c.hero === 'spellblade');
const magic = (c: (typeof mine)[number]): boolean =>
  /"by":"stars"|"op":"(fracture|shatterBlast|shatterUp)"/.test(JSON.stringify(c.effects));

describe("the Spellblade's spell animation (DECISIONS #756)", () => {
  it('casts for every Spell card, and any card of hers using Spell Power, Fracture or a Shatter', () => {
    const spells = mine.filter((c) => !(c.tags ?? []).includes('sword'));
    expect(spells.some((c) => (c.tags ?? []).includes('spell'))).toBe(true);
    for (const c of spells)
      if ((c.tags ?? []).includes('spell') || magic(c))
        expect(strikeVariant('spellblade', c), c.id).toBe('spell');
  });

  it('keeps the blade for a Sword card, even one that applies Fracture', () => {
    const swords = mine.filter((c) => (c.tags ?? []).includes('sword'));
    expect(swords.length).toBeGreaterThan(0);
    expect(swords.some(magic)).toBe(true);
    for (const c of swords) expect(strikeVariant('spellblade', c), c.id).not.toBe('spell');
  });

  it('leaves every other hero to its weapon', () => {
    const gun = Object.values(COMBAT_DB.cards).find(
      (c) => c.hero === 'drunkard' && (c.tags ?? []).includes('gun'),
    );
    expect(gun && strikeVariant('drunkard', gun)).toBe('shotgun');
    expect(strikeVariant('knight')).toBe('sword');
  });
});
