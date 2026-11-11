import { describe, expect, it } from 'vitest';
import { RIFTWALKERS } from '@sr/content/v2';
import {
  bankInto,
  brokenDeck,
  checkEntry,
  cleanBroken,
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
    expect(cleanDeck(deck('a:t1'))).toEqual({ ...deck('a:t1'), weaponCards: true });
    // an id with odd characters (an old typed seed) is made safe, not dropped
    expect(cleanDeck({ ...deck('x'), id: 'has spaces' })?.id).toBe('has_spaces');
    expect(cleanDeck({ ...deck('x'), id: 'a'.repeat(150) })?.id).toHaveLength(100);
    expect(cleanDeck({ ...deck('x'), id: '' })).toBeNull();
    // the run's Max HP is kept for its ghost Warden (DECISIONS #538), when it is a whole number in reason
    expect(cleanDeck({ ...deck('x'), maxHp: 112 })?.maxHp).toBe(112);
    expect(cleanDeck({ ...deck('x'), maxHp: 5000 })?.maxHp).toBeUndefined();
    expect(checkEntry({ ...deck('x'), name: 'n', maxHp: 112 })).toMatchObject({
      ok: true,
      entry: { maxHp: 112 },
    });
    expect(
      checkEntry({ ...deck('x'), name: 'n', maxHp: -3 }).ok &&
        'maxHp' in (checkEntry({ ...deck('x'), name: 'n', maxHp: -3 }) as { entry: object }).entry,
    ).toBe(false);
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

describe('the starting weapons are cards of the deck (DECISIONS #436)', () => {
  it('a Vault deck saved before gets its weapon once; one saved after keeps what the player chose', () => {
    const deck = RIFTWALKERS.drunkard.starter.filter((id) => id !== 'old-twelve-gauge');
    const base = { id: 'r~v', hero: 'drunkard', tier: 1, deck, boons: [], bankedAt: 1 };
    expect(cleanDeck(base)!.deck).toContain('old-twelve-gauge');
    expect(cleanDeck({ ...base, weaponCards: true })!.deck).not.toContain('old-twelve-gauge');
    expect(cleanDeck({ ...base, hero: 'constructor' })).toBeNull();
  });
});

describe('a saved deck an update left unplayable (DECISIONS #754)', () => {
  it('a deck that still plays is not broken, and neither is something that was never a deck', () => {
    expect(brokenDeck(deck('fine'))).toBeNull();
    expect(brokenDeck(null)).toBeNull();
    expect(brokenDeck({ hero: 'knight', deck: ['gone-card'] })).toBeNull();
  });

  it('says what is left of one and why it no longer plays', () => {
    const card = { ...deck('r~card'), deck: [...deck('x').deck, 'a-card-taken-out'], tier: 7 };
    expect(cleanDeck(card)).toBeNull();
    expect(brokenDeck(card)).toEqual({
      id: 'r~card',
      hero: 'knight',
      tier: 7,
      cards: card.deck.length,
      bankedAt: 5,
      fault: 'card',
      inactive: false,
    });
    expect(brokenDeck({ ...deck('r~hero'), hero: 'retired-class' })).toMatchObject({
      hero: 'retired-class',
      fault: 'hero',
    });
    expect(brokenDeck({ ...deck('r~small'), deck: ['strike'] }, true)).toMatchObject({
      fault: 'size',
      cards: 1,
      inactive: true,
    });
    expect(brokenDeck({ ...deck('r~odd'), deck: 'nope' })).toMatchObject({
      fault: 'unreadable',
      cards: 0,
    });
    // (nothing unsafe is carried from what was saved)
    expect(brokenDeck({ ...deck('r~x'), hero: '<b>x</b>', tier: 1e9 })).toMatchObject({
      hero: '',
      tier: 99,
    });
  });

  it('cleans what the server says of them', () => {
    const one = brokenDeck({ ...deck('r~hero'), hero: 'retired-class' }, true)!;
    expect(
      cleanBroken([one, one, { ...one, id: 'bad id' }, { ...one, id: 'b', fault: 'x' }, 7]),
    ).toEqual([one]);
    expect(cleanBroken('nope')).toEqual([]);
  });
});

describe('a Vault holding more than its slots (DECISIONS #754: an unplayable deck that plays again)', () => {
  const at = (id: string, bankedAt: number): VaultDeck => ({ ...deck(id), bankedAt });
  const over = Array.from({ length: VAULT_SLOTS + 1 }, (_, i) => at(`r~d${i}`, 100 + i));

  it('a run already in it saves its deck again, and a new run is still refused', () => {
    const again = bankInto(over, { ...at('r~d3', 999), tier: 2 });
    expect(again).toMatchObject({ ok: true, already: false });
    expect(again.list).toHaveLength(VAULT_SLOTS + 1);
    expect(bankInto(over, at('r~new', 999))).toMatchObject({ ok: false, reason: 'full' });
  });

  it('a device keeps the newest of them, in the order they came', () => {
    const kept = cleanVault(over).map((d) => d.id);
    expect(kept).toHaveLength(VAULT_SLOTS);
    expect(kept).not.toContain('r~d0');
    expect(kept[0]).toBe('r~d1');
    expect(kept.at(-1)).toBe(`r~d${VAULT_SLOTS}`);
  });

  it('cards that are not text are refused, not read as ids', () => {
    const odd = { ...deck('r~odd'), hero: 'spellblade', deck: [5, null] };
    expect(cleanDeck(odd)).toBeNull();
    expect(brokenDeck(odd)).toMatchObject({ fault: 'unreadable' });
  });
});
