import { describe, expect, it } from 'vitest';
import { cleanCosmetics, mergeCosmetics, wornSkin } from './cosmetics';

describe('cosmetics (DECISIONS #406)', () => {
  it('keeps only known skins, known Riftwalkers, and a skin on its own class', () => {
    const c = cleanCosmetics({
      owned: ['knight-sunwarden', 'knight-sunwarden', 'made-up', 3],
      worn: {
        knight: { skin: 'knight-sunwarden', at: 5 },
        hunter: { skin: 'knight-sunwarden', at: 5 },
        nobody: { skin: null, at: 1 },
        monk: { skin: null, at: 2 },
        trickster: { skin: 'trickster-gender-male', at: 'soon' },
      },
    });
    expect(c.owned).toEqual(['knight-sunwarden']);
    expect(c.worn).toEqual({
      knight: { skin: 'knight-sunwarden', at: 5 },
      monk: { skin: null, at: 2 },
    });
    expect(cleanCosmetics('nonsense')).toEqual({ owned: [], worn: {} });
  });

  it('merges: owning grows, the newest choice wins, an unowned skin is never worn', () => {
    const phone = cleanCosmetics({
      owned: ['knight-sunwarden'],
      worn: { knight: { skin: 'knight-sunwarden', at: 10 } },
    });
    const laptop = cleanCosmetics({
      owned: ['knight-gender-female', 'hunter-tempest-prowler'],
      worn: { knight: { skin: 'knight-gender-female', at: 20 }, hunter: { skin: null, at: 1 } },
    });
    const both = mergeCosmetics(phone, laptop);
    expect(both.owned).toEqual([
      'knight-sunwarden',
      'knight-gender-female',
      'hunter-tempest-prowler',
    ]);
    expect(wornSkin(both, 'knight')).toBe('knight-gender-female');
    expect(wornSkin(both, 'hunter')).toBeUndefined();
    // a choice of a skin that neither copy owns is dropped
    const odd = mergeCosmetics(
      { owned: [], worn: { knight: { skin: 'knight-sunwarden', at: 9 } } },
      phone,
    );
    expect(odd.worn['knight']).toEqual({ skin: 'knight-sunwarden', at: 10 });
    expect(
      mergeCosmetics(
        { owned: [], worn: { knight: { skin: 'knight-sunwarden', at: 9 } } },
        { owned: [], worn: {} },
      ).worn,
    ).toEqual({});
  });
});

describe('a renamed skin is kept under its new id (DECISIONS #408)', () => {
  it('the Moonlit Regent is the Female Knight', () => {
    const c = cleanCosmetics({
      owned: ['knight-moonlit-regent'],
      worn: { knight: { skin: 'knight-moonlit-regent', at: 3 } },
    });
    expect(c.owned).toEqual(['knight-gender-female']);
    expect(wornSkin(c, 'knight')).toBe('knight-gender-female');
  });
});
