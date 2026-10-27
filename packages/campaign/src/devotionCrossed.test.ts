import { describe, expect, it } from 'vitest';
import { COMBAT_DB } from '@sr/content/v2';
import { makeKits } from './kits';
import { canAdd, crossedPool } from './rewards';

describe('Devotion cards stay with Valeria', () => {
  it('cards that spend or count Devotion are never Rift-crossed', () => {
    const pool = crossedPool('hunter');
    for (const id of ['lightbrand', 'hymn-of-reckoning', 'sunfall', 'sunforged-edge'])
      expect(pool).not.toContain(id);
    expect(pool).toContain('lightbearer'); // a plain heal still crosses
  });
});

describe('copies a deck may take (DECISIONS #336)', () => {
  const pick = (rarity: string): string =>
    Object.values(COMBAT_DB.cards).find(
      (c) => c.rarity === rarity && c.hero === 'knight' && !c.id.endsWith('+') && !c.unplayable,
    )!.id;
  it('any number of a common, uncommon or rare card', () => {
    for (const rarity of ['common', 'uncommon', 'rare']) {
      const id = pick(rarity);
      expect(
        canAdd(
          Array.from({ length: 9 }, () => id),
          id,
        ),
        rarity,
      ).toBe(true);
    }
  });
  it('a Legendary is one of a kind (its "+" counts as the same card)', () => {
    const id = pick('legendary');
    expect(canAdd([], id)).toBe(true);
    expect(canAdd([`${id}+`], id)).toBe(false);
  });
});

describe("Valeria's Devotion kit", () => {
  it('comes with a card that spends Devotion, and a heal that pays for it', () => {
    const kit = makeKits('knight')[2]!.deck.map((id) => COMBAT_DB.cards[id]!);
    const spender = kit.find((c) => c.statusCost?.status === 'devotion');
    expect(spender).toBeTruthy();
    const healed = kit
      .flatMap((c) => c.effects)
      .filter((o) => o.op === 'heal')
      .reduce((n, o) => Math.max(n, (o as { amount: number }).amount), 0);
    expect(healed).toBeGreaterThanOrEqual(spender!.statusCost!.amount);
  });
});
