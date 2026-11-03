import { describe, expect, it } from 'vitest';
import { COMBAT_DB } from '@sr/content/v2';
import { cardMotion } from './attackStyles';
import { hitFx } from './fxMoments';

const card = (id: string) => COMBAT_DB.cards[id]!;

describe('how a card moves on the stage (DECISIONS #565)', () => {
  it('a Sword is swung at one enemy, a Spell is cast in ember', () => {
    expect(cardMotion('spellblade', card('etching-edge'))).toEqual({ spell: false, aoe: false });
    expect(cardMotion('spellblade', card('devastate'))).toEqual({
      spell: true,
      aoe: false,
      spellTint: '#ff8a3a',
    });
  });

  it('a card that hits every enemy plays across them all, a Spell and a blow alike', () => {
    expect(cardMotion('spellblade', card('radiance'))).toMatchObject({ spell: true, aoe: true });
    // (the damage to all inside an "on kill" counts too: Dying Ember's is at the top, Falling Shards' Fracture is not damage)
    expect(cardMotion('spellblade', card('dying-star')).aoe).toBe(true);
    expect(cardMotion('spellblade', card('falling-sky')).aoe).toBe(false);
    expect(cardMotion('knight', card('strike')).aoe).toBe(false);
  });

  it('Fanned or Blade Sweep spreads a single card across them all', () => {
    expect(cardMotion('spellblade', card('starforged-blade'), true).aoe).toBe(true);
  });

  it("a Spell's blow lands as a spell, not a cut", () => {
    expect(hitFx(3, 'cast')).toBe('hit-pierce');
  });
});
