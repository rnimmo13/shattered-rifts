import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedRng } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, lendLegendaries, rewardPool, type HeroId } from '@sr/content/v2';
import { canAdd, giftOffers, offerCards } from './index';

const HEROES = Object.keys(RIFTWALKERS) as HeroId[];
const rarityOf = (id: string) => COMBAT_DB.cards[id]?.rarity;

// Legendary is put away (DECISIONS #363): the shelved cards are lent as Legendaries so the rules stay tested for when it returns
let undo = (): void => {};
beforeAll(() => {
  undo = lendLegendaries(COMBAT_DB);
});
afterAll(() => undo());

describe('legendary cards', () => {
  it('every Riftwalker has at least two of their own, and Neutral has some for anyone', () => {
    for (const h of HEROES) {
      const own = rewardPool(h).filter(
        (id) => rarityOf(id) === 'legendary' && COMBAT_DB.cards[id]?.hero === h,
      );
      // (Valeria has none: she is exactly the Ironclad's list, DECISIONS #367)
      expect(own.length, h).toBeGreaterThanOrEqual(h === 'knight' ? 0 : 2);
    }
    const neutral = Object.values(COMBAT_DB.cards).filter(
      (c) => c.hero === 'neutral' && c.rarity === 'legendary' && !c.source,
    );
    expect(neutral.length).toBeGreaterThanOrEqual(2);
  });

  it('a legendary is one of a kind: a deck can hold only one copy', () => {
    const id = rewardPool('engineer').find((x) => rarityOf(x) === 'legendary') as string;
    expect(canAdd([], id)).toBe(true);
    expect(canAdd([id], id)).toBe(false);
    expect(canAdd([`${id}+`], id)).toBe(false);
    expect(canAdd(['strike', 'strike', 'strike', 'strike', 'rift-bolt'], 'rift-bolt')).toBe(true);
  });

  it('they are never a starter card, and ordinary offers hold none while Legendary is away (DECISIONS #363)', () => {
    for (const h of HEROES)
      for (const id of RIFTWALKERS[h].starter) expect(rarityOf(id)).not.toBe('legendary');
    for (const [kind, tag] of [['duel', 'l'], ['elite', 'e']] as const) {
      let seen = 0;
      for (let i = 0; i < 600; i++)
        for (const id of offerCards(seedRng(`${tag}${i}`), 'assassin', [], kind, 3))
          if (rarityOf(id) === 'legendary') seen++;
      expect(seen, kind).toBe(0);
    }
  });

  it('a Warden sometimes leaves one in the Gift (about GIFT_LEGEND_CHANCE of the time)', () => {
    let withLegend = 0;
    for (let i = 0; i < 300; i++)
      if (
        giftOffers(seedRng(`g${i}`), 'necromancer', [], 3, 'seraphine').some(
          (id) => rarityOf(id) === 'legendary',
        )
      )
        withLegend++;
    expect(withLegend / 300).toBeGreaterThan(0.2);
    expect(withLegend / 300).toBeLessThan(0.4);
    // and the gift never offers a legendary the deck already holds
    const held = rewardPool('necromancer').filter((id) => rarityOf(id) === 'legendary');
    for (let i = 0; i < 100; i++)
      for (const id of giftOffers(seedRng(`h${i}`), 'necromancer', held, 3, 'nyxara'))
        expect(held.includes(id)).toBe(false);
  });
});
