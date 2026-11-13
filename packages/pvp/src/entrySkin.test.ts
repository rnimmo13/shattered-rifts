// A deck's look over the wire (DECISIONS #776): checkEntry keeps a skin only if it is one of the deck's own Riftwalker's.
import { describe, expect, it } from 'vitest';
import { RIFTWALKERS } from '@sr/content/v2';
import { checkEntry } from './deck';

const entry = (skin?: unknown) => ({
  name: 'Ann',
  hero: 'knight',
  deck: [...RIFTWALKERS.knight.starter],
  boons: [],
  tier: 5,
  ...(skin === undefined ? {} : { skin }),
});

describe('checkEntry and a look (DECISIONS #776)', () => {
  it("keeps a look of the deck's own Riftwalker", () => {
    const r = checkEntry(entry('knight-demon-knight'));
    expect(r.ok && r.entry.skin).toBe('knight-demon-knight');
  });
  it("drops another Riftwalker's look, an unknown id, or something that is not text", () => {
    for (const skin of ['spellblade-nova-ronin', 'knight-made-up', 7, null, { id: 'x' }]) {
      const r = checkEntry(entry(skin));
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.entry).not.toHaveProperty('skin');
    }
  });
  it('has no look when none is sent', () => {
    const r = checkEntry(entry());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.entry).not.toHaveProperty('skin');
  });
});
