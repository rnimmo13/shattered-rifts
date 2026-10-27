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

describe('copies a deck may take (DECISIONS #337)', () => {
  const pick = (rarity: string): string =>
    Object.values(COMBAT_DB.cards).find(
      (c) => c.rarity === rarity && c.hero === 'knight' && !c.id.endsWith('+') && !c.unplayable,
    )!.id;
  it('up to 5 of a common, uncommon or rare card', () => {
    for (const rarity of ['common', 'uncommon', 'rare']) {
      const id = pick(rarity);
      expect(
        canAdd(
          Array.from({ length: 4 }, () => id),
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
  it('comes with a card that spends Devotion, and heals that pay for it within two turns', () => {
    const kit = makeKits('knight')[2]!.deck.map((id) => COMBAT_DB.cards[id]!);
    const spender = kit.find((c) => c.statusCost?.status === 'devotion');
    expect(spender).toBeTruthy();
    // a heal now counts once, an Aura's heal (Sacred Vow) twice: two turns of it
    let healed = 0;
    for (const c of kit)
      for (const o of c.effects) {
        if (o.op === 'heal') healed += o.amount;
        if (o.op === 'power')
          for (const p of o.ops) if (p.op === 'heal') healed += 2 * p.amount;
      }
    expect(healed).toBeGreaterThanOrEqual(spender!.statusCost!.amount);
  });
});
