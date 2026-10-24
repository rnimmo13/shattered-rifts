import { describe, expect, it } from 'vitest';
import { RIFTWALKERS } from '@sr/content/v2';
import {
  bankInto,
  deckFromRun,
  deckFromStage,
  dropFrom,
  entryFor,
  labelOf,
  parseVault,
  VAULT_SLOTS,
  type VaultDeck,
} from './vault';

const run = (seed: string, tier = 1) => ({
  seed,
  tier,
  character: 'maren' as const,
  deck: [...RIFTWALKERS.maren.starter],
  boons: ['iron-will'],
});

describe('the Vault', () => {
  it('keeps a banked deck once, however often it is banked', () => {
    const d = deckFromRun(run('a'), 1);
    const one = bankInto([], d);
    expect(one).toMatchObject({ ok: true, already: false });
    const two = bankInto(one.list, d);
    expect(two).toMatchObject({ ok: true, already: true });
    expect(two.list).toHaveLength(1);
  });

  it('is full after its slots, and gives up a deck only when told which', () => {
    let list: VaultDeck[] = [];
    for (let i = 0; i < VAULT_SLOTS; i++) {
      const r = bankInto(list, deckFromRun(run(`s${i}`), 1));
      expect(r.ok).toBe(true);
      list = r.list;
    }
    const extra = deckFromRun(run('extra'), 2);
    expect(bankInto(list, extra)).toMatchObject({ ok: false, reason: 'full' });
    const swapped = bankInto(list, extra, list[0]?.id);
    expect(swapped.ok).toBe(true);
    expect(swapped.list).toHaveLength(VAULT_SLOTS);
    expect(swapped.list.some((x) => x.id === extra.id)).toBe(true);
    expect(swapped.list.some((x) => x.id === list[0]?.id)).toBe(false);
    expect(dropFrom(list, list[0]?.id ?? '')).toHaveLength(VAULT_SLOTS - 1);
  });

  it('turns a deck into what a match is told', () => {
    const e = entryFor(deckFromRun(run('a', 3), 1), 'Rob');
    expect(e).toMatchObject({ name: 'Rob', hero: 'maren', tier: 3 });
    expect(e.deck).toEqual(RIFTWALKERS.maren.starter);
  });

  it('names a deck by its Riftwalker and Rift Tier', () => {
    expect(labelOf(deckFromRun(run('a', 3), 1))).toBe('Valeria: Rift Tier 3');
  });

  it('a copy taken after a stage has its own id and says so', () => {
    const r = { ...run('a', 2), stage: 1 };
    const mid = deckFromStage(r, 1);
    expect(mid.id).not.toBe(deckFromRun(r, 1).id);
    expect(labelOf(mid)).toBe('Valeria: Rift Tier 2, after stage 1');
    // both can sit in the Vault together
    const both = bankInto(bankInto([], mid).list, deckFromRun(r, 1));
    expect(both.list).toHaveLength(2);
  });

  it('reads back what it saved, and drops anything that is no longer a legal deck', () => {
    const good = deckFromRun(run('a'), 5);
    const bad = { ...good, id: 'bad', deck: ['strike'] };
    const worse = { id: 'worse', hero: 'constructor', deck: [], tier: 1, bankedAt: 1 };
    const back = parseVault(JSON.stringify([good, bad, worse, 'nope', null]));
    expect(back.map((x) => x.id)).toEqual([good.id]);
    expect(parseVault('{not json')).toEqual([]);
    expect(parseVault(null)).toEqual([]);
  });
});
