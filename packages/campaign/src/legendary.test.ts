import { describe, expect, it } from 'vitest';
import { seedRng } from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, rewardPool, type HeroId } from '@sr/content/v2';
import { canAdd, giftOffers, offerCards } from './index';

const HEROES = Object.keys(RIFTWALKERS) as HeroId[];
const rarityOf = (id: string) => COMBAT_DB.cards[id]?.rarity;

describe('legendary cards', () => {
  it('every Riftwalker has at least two of their own, and Neutral has some for anyone', () => {
    for (const h of HEROES) {
      const own = rewardPool(h).filter(
        (id) => rarityOf(id) === 'legendary' && COMBAT_DB.cards[id]?.hero === h,
      );
      expect(own.length, h).toBeGreaterThanOrEqual(2);
    }
    const neutral = Object.values(COMBAT_DB.cards).filter(
      (c) => c.hero === 'neutral' && c.rarity === 'legendary' && !c.source,
    );
    expect(neutral.length).toBeGreaterThanOrEqual(2);
  });

  it('a legendary is one of a kind: a deck can hold only one copy', () => {
    const id = rewardPool('maren').find((x) => rarityOf(x) === 'legendary') as string;
    expect(canAdd([], id)).toBe(true);
    expect(canAdd([id], id)).toBe(false);
    expect(canAdd([`${id}+`], id)).toBe(false);
    expect(canAdd(['strike', 'strike', 'strike', 'strike', 'rift-bolt'], 'rift-bolt')).toBe(true);
  });

  it('they are never a starter card, never a basic reward, and are rare in ordinary offers', () => {
    for (const h of HEROES)
      for (const id of RIFTWALKERS[h].starter) expect(rarityOf(id)).not.toBe('legendary');
    let seen = 0;
    let total = 0;
    for (let i = 0; i < 600; i++)
      for (const id of offerCards(seedRng(`l${i}`), 'quill', [], 'duel', 3)) {
        total++;
        if (rarityOf(id) === 'legendary') seen++;
      }
    expect(seen).toBe(0); // a normal-difficulty duel never offers one
    seen = 0;
    total = 0;
    for (let i = 0; i < 600; i++)
      for (const id of offerCards(seedRng(`e${i}`), 'quill', [], 'elite', 3)) {
        total++;
        if (rarityOf(id) === 'legendary') seen++;
      }
    expect(seen / total).toBeGreaterThan(0.002);
    expect(seen / total).toBeLessThan(0.05);
  });

  it('better luck finds them more often, and a Warden sometimes leaves one in the Gift', () => {
    const gifts = (luck: 'normal' | 'lucky' | 'blessed') => {
      let withLegend = 0;
      for (let i = 0; i < 300; i++)
        if (
          giftOffers(seedRng(`g${luck}${i}`), 'mire', [], 3, 'seraphine', luck).some(
            (id) => rarityOf(id) === 'legendary',
          )
        )
          withLegend++;
      return withLegend / 300;
    };
    const n = gifts('normal');
    const l = gifts('lucky');
    const b = gifts('blessed');
    expect(n).toBeGreaterThan(0.1);
    expect(l).toBeGreaterThan(n);
    expect(b).toBeGreaterThan(l);
    // and the gift never offers a legendary the deck already holds
    const held = rewardPool('mire').filter((id) => rarityOf(id) === 'legendary');
    for (let i = 0; i < 100; i++)
      for (const id of giftOffers(seedRng(`h${i}`), 'mire', held, 3, 'nyxara', 'blessed'))
        expect(held.includes(id)).toBe(false);
  });
});
