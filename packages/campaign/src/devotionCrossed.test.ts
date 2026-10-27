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

describe('copies a deck may take, by rarity (DECISIONS #330)', () => {
  const pick = (rarity: string): string =>
    Object.values(COMBAT_DB.cards).find(
      (c) => c.rarity === rarity && c.hero === 'knight' && !c.id.endsWith('+') && !c.unplayable,
    )!.id;
  it('4 of a common, 3 of an uncommon, 2 of a rare; a card and its "+" share the limit', () => {
    for (const [rarity, max] of [
      ['common', 4],
      ['uncommon', 3],
      ['rare', 2],
    ] as const) {
      const id = pick(rarity);
      const deck = Array.from({ length: max - 1 }, () => id);
      expect(canAdd(deck, id), `${rarity} at ${max - 1}`).toBe(true);
      expect(canAdd([...deck, `${id}+`], id), `${rarity} at ${max}`).toBe(false);
    }
  });
  it('a deck checked without the rarity limits (an older Arena deck) keeps the flat 4', () => {
    const id = pick('rare');
    expect(canAdd([id, id, id], id, false)).toBe(true);
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
