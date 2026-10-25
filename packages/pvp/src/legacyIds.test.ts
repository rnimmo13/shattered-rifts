import { describe, expect, it } from 'vitest';
import { LEGACY_HERO_IDS, RIFTWALKERS } from '@sr/content/v2';
import { checkEntry, isHero, storedHero } from './index';

describe('Arena entries with an old Riftwalker id', () => {
  it('are read as the class: a banked deck or a ghost from before the rename still plays', () => {
    for (const [old, now] of Object.entries(LEGACY_HERO_IDS)) {
      const deck = [...RIFTWALKERS[now].starter];
      const r = checkEntry({ name: 'Rob', hero: old, deck, tier: 1 });
      expect(r.ok, old).toBe(true);
      if (r.ok) expect(r.entry.hero).toBe(now);
      expect(isHero(old)).toBe(true);
      expect(storedHero(old)).toBe(now);
    }
  });

  it('still refuse a Riftwalker nobody has heard of', () => {
    const deck = [...RIFTWALKERS.knight.starter];
    expect(checkEntry({ name: 'x', hero: 'nobody', deck, tier: 1 }).ok).toBe(false);
    expect(isHero('nobody')).toBe(false);
    expect(isHero(7)).toBe(false);
  });
});
