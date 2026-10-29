import { describe, expect, it } from 'vitest';
import { cleanCosmetics, mergeCosmetics, wornSkin } from './cosmetics';

describe('cosmetics (DECISIONS #406)', () => {
  it('keeps only known skins, known Riftwalkers, and a skin on its own class', () => {
    const c = cleanCosmetics({
      owned: ['knight-moonlit-regent', 'knight-moonlit-regent', 'made-up', 3],
      worn: {
        knight: { skin: 'knight-moonlit-regent', at: 5 },
        hunter: { skin: 'knight-moonlit-regent', at: 5 },
        nobody: { skin: null, at: 1 },
        monk: { skin: null, at: 2 },
        trickster: { skin: 'trickster-gender-male', at: 'soon' },
      },
    });
    expect(c.owned).toEqual(['knight-moonlit-regent']);
    expect(c.worn).toEqual({
      knight: { skin: 'knight-moonlit-regent', at: 5 },
      monk: { skin: null, at: 2 },
    });
    expect(cleanCosmetics('nonsense')).toEqual({ owned: [], worn: {} });
  });

  it('merges: owning grows, the newest choice wins, an unowned skin is never worn', () => {
    const phone = cleanCosmetics({
      owned: ['knight-moonlit-regent'],
      worn: { knight: { skin: 'knight-moonlit-regent', at: 10 } },
    });
    const laptop = cleanCosmetics({
      owned: ['knight-gender-male', 'hunter-tempest-prowler'],
      worn: { knight: { skin: 'knight-gender-male', at: 20 }, hunter: { skin: null, at: 1 } },
    });
    const both = mergeCosmetics(phone, laptop);
    expect(both.owned).toEqual([
      'knight-moonlit-regent',
      'knight-gender-male',
      'hunter-tempest-prowler',
    ]);
    expect(wornSkin(both, 'knight')).toBe('knight-gender-male');
    expect(wornSkin(both, 'hunter')).toBeUndefined();
    // a choice of a skin that neither copy owns is dropped
    const odd = mergeCosmetics(
      { owned: [], worn: { knight: { skin: 'knight-moonlit-regent', at: 9 } } },
      phone,
    );
    expect(odd.worn['knight']).toEqual({ skin: 'knight-moonlit-regent', at: 10 });
    expect(
      mergeCosmetics(
        { owned: [], worn: { knight: { skin: 'knight-moonlit-regent', at: 9 } } },
        { owned: [], worn: {} },
      ).worn,
    ).toEqual({});
  });
});
