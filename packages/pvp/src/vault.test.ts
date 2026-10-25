import { describe, expect, it } from 'vitest';
import { RIFTWALKERS } from '@sr/content/v2';
import {
  bankInto,
  cleanDeck,
  cleanVault,
  mergeVaults,
  normaliseCode,
  runKey,
  showCode,
  VAULT_SLOTS,
  type VaultDeck,
} from './index';

const deck = (id: string): VaultDeck => ({
  id,
  hero: 'knight',
  tier: 1,
  deck: [...RIFTWALKERS.knight.starter],
  boons: [],
  bankedAt: 5,
});

describe('Vault rules', () => {
  it('banks once, refuses when full, and replaces on request', () => {
    let list: VaultDeck[] = [];
    for (let i = 0; i < VAULT_SLOTS; i++) {
      const r = bankInto(list, deck(`d${i}`));
      expect(r.ok).toBe(true);
      list = r.list;
    }
    expect(bankInto(list, deck('d0'))).toMatchObject({ ok: true, already: true });
    expect(bankInto(list, deck('extra'))).toMatchObject({ ok: false, reason: 'full' });
    const swapped = bankInto(list, deck('extra'), 'd0');
    expect(swapped.ok && swapped.list.map((d) => d.id)).not.toContain('d0');
    expect(swapped.list).toHaveLength(VAULT_SLOTS);
  });

  it('cleans decks that arrive from outside', () => {
    expect(cleanDeck(deck('a:t1'))).toEqual(deck('a:t1'));
    // an id with odd characters (an old typed seed) is made safe, not dropped
    expect(cleanDeck({ ...deck('x'), id: 'has spaces' })?.id).toBe('has_spaces');
    expect(cleanDeck({ ...deck('x'), id: 'a'.repeat(150) })?.id).toHaveLength(100);
    expect(cleanDeck({ ...deck('x'), id: '' })).toBeNull();
    expect(cleanDeck({ ...deck('x'), hero: 'nobody' })).toBeNull();
    expect(cleanDeck({ ...deck('x'), deck: ['not-a-card'] })).toBeNull();
    expect(cleanDeck({ ...deck('x'), hero: '__proto__' })).toBeNull();
    expect(cleanDeck(null)).toBeNull();
    expect(cleanDeck('deck')).toBeNull();
    // a missing or wild time is tolerated, and stripped to a number
    expect(cleanDeck({ ...deck('x'), bankedAt: 'soon' })?.bankedAt).toBe(0);
  });

  it('keeps the Boons a deck was saved with, as plain ids only', () => {
    const d = cleanDeck({
      ...deck('b'),
      boons: ['iron-will', 'iron-will', 7, 'has space', null, 'a'.repeat(50)],
    });
    expect(d?.boons).toEqual(['iron-will']);
    expect(
      cleanDeck({ ...deck('b'), boons: ['__proto__', 'constructor', 'toString', 'ok'] })?.boons,
    ).toEqual(['ok']);
    expect(cleanDeck({ ...deck('b'), boons: 'nope' })?.boons).toEqual([]);
    expect(cleanDeck({ ...deck('b'), boons: undefined })?.boons).toEqual([]);
    expect(
      cleanDeck({ ...deck('b'), boons: Array.from({ length: 60 }, (_, i) => `b${i}`) })?.boons,
    ).toHaveLength(40);
  });

  it('cleans a whole list: no repeats, no junk, no more than the slots', () => {
    const many = Array.from({ length: VAULT_SLOTS + 3 }, (_, i) => deck(`d${i}`));
    expect(cleanVault([...many, deck('d0'), 7, null])).toHaveLength(VAULT_SLOTS);
    expect(cleanVault('nope')).toEqual([]);
    expect(cleanVault(undefined)).toEqual([]);
  });

  it('merges lists, the first winning', () => {
    const a = deck('a');
    const b = { ...deck('a'), tier: 3 };
    const merged = mergeVaults([a], [b, deck('c')]);
    expect(merged.map((d) => d.id)).toEqual(['a', 'c']);
    expect(merged[0]?.tier).toBe(1);
  });
});

describe('Vault codes', () => {
  it('reads a code however it is typed', () => {
    expect(normaliseCode('abcd-efgh-jkmn-pqrs')).toBe('ABCDEFGHJKMNPQRS'.slice(0, 16));
    expect(normaliseCode(' ABCD EFGH JKMN PQRS ')).toBe('ABCDEFGHJKMNPQRS');
    expect(normaliseCode('ABCD-EFGH-JKMN')).toBeNull();
    expect(normaliseCode('ABCD-EFGH-JKMN-PQR0')).toBeNull();
    expect(normaliseCode('')).toBeNull();
  });

  it('shows a code in groups of four', () => {
    expect(showCode('ABCDEFGHJKMNPQRS')).toBe('ABCD-EFGH-JKMN-PQRS');
  });
});

describe('runKey', () => {
  it('is the same for every save of a run, and for the older id forms of it', () => {
    expect(runKey('r~abc')).toBe(runKey('r~abc'));
    expect(runKey('abc:t2')).toBe(runKey('r~abc'));
    expect(runKey('r~abc')).not.toBe(runKey('r~abd'));
  });
  it('is a short hex fingerprint that does not contain the seed', () => {
    expect(runKey('r~my-secret-seed')).toMatch(/^[0-9a-f]{14}$/);
  });
});
