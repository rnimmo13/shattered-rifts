import { describe, expect, it } from 'vitest';
import { RIFTWALKERS } from '@sr/content/v2';
import {
  bankInto,
  deckFromRun,
  deckFromStage,
  stagesCleared,
  dropFrom,
  entryFor,
  labelOf,
  mergeVaults,
  oneEach,
  parseVault,
  runOf,
  VAULT_SLOTS,
  type VaultDeck,
} from './vault';

const run = (seed: string, tier = 1) => ({
  seed,
  tier,
  character: 'knight' as const,
  deck: [...RIFTWALKERS.knight.starter],
  boons: ['iron-will'],
});

describe('how far a run has got in its tier', () => {
  const at = (phase: string, stage: number) => stagesCleared({ phase, stage } as never);
  it('counts the stages already beaten', () => {
    expect(at('prelude', 1)).toBe(0);
    expect(at('map', 1)).toBe(0);
    expect(at('map', 2)).toBe(1);
    expect(at('stageClear', 1)).toBe(1);
    expect(at('gift', 2)).toBe(2);
    expect(at('prelude', 3)).toBe(2);
    expect(at('loopCleared', 3)).toBe(3);
  });

  it('is recorded on the saved deck', () => {
    expect(deckFromRun(run('a'), 1).stage).toBe(3);
    expect(deckFromStage(run('a'), 1, 2).stage).toBe(2);
    expect(entryFor(deckFromStage(run('a'), 1, 1), 'Rob').stage).toBe(1);
  });
});

describe('one deck per run', () => {
  it('keeps runs apart even when a seed looks like an older id', () => {
    const plain = deckFromRun(run('foo'), 1);
    const odd = deckFromRun(run('foo:t5'), 2);
    expect(runOf(plain.id)).not.toBe(runOf(odd.id));
    expect(bankInto([plain], odd).list).toHaveLength(2);
  });

  it('never lets an older save replace a newer one', () => {
    const newer = deckFromRun(run('a', 2), 500);
    const older = { ...deckFromRun(run('a', 1), 100), deck: [...newer.deck, 'strike'] };
    const r = bankInto([newer], older);
    expect(r.list).toEqual([newer]);
  });

  it('merging two lists keeps the newest save of each run, and one entry per run', () => {
    const early = { ...deckFromRun(run('a', 1), 100), id: 'a:t1:s1' };
    const late = deckFromRun(run('a', 2), 900);
    const other = deckFromRun(run('b', 1), 300);
    const merged = mergeVaults([early, other], [late]);
    expect(merged.map((d) => d.bankedAt).sort()).toEqual([300, 900]);
    expect(oneEach([early, late]).map((d) => d.id)).toEqual([late.id]);
  });
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
    expect(e).toMatchObject({ name: 'Rob', hero: 'knight', tier: 3 });
    expect(e.deck).toEqual(RIFTWALKERS.knight.starter);
  });

  it('names a deck by its Riftwalker and Rift Tier', () => {
    expect(labelOf(deckFromRun(run('a', 3), 1))).toBe('Valeria: Rift Tier 3');
  });

  it('a copy taken after a stage says so', () => {
    const mid = deckFromStage(run('a', 2), 1, 1);
    expect(labelOf(mid)).toBe('Valeria: Rift Tier 2, after stage 1');
    expect(labelOf(deckFromStage(run('a', 2), 1, 0))).toBe('Valeria: Rift Tier 2, at the start');
  });

  it('saving the same run again replaces its earlier save instead of adding a second', () => {
    const early = deckFromStage(run('a', 1), 1, 1);
    const later = { ...deckFromRun(run('a', 2), 5), deck: [...early.deck, 'strike'] };
    const other = deckFromRun(run('b', 1), 3);
    const r = bankInto(bankInto([early], other).list, later);
    expect(r).toMatchObject({ ok: true, already: false });
    expect(r.list.map((d) => d.tier).sort()).toEqual([1, 2]);
    expect(r.list.filter((d) => d.id === later.id)).toHaveLength(1);
    // the same deck again changes nothing; decks saved by older builds (id with the tier) are the same run
    expect(bankInto(r.list, later)).toMatchObject({ ok: true, already: true });
    const old = { ...early, id: 'a:t1:s1' };
    expect(bankInto([old], later).list).toHaveLength(1);
  });

  it('replacing a save needs no free slot', () => {
    let list: VaultDeck[] = [];
    for (let i = 0; i < VAULT_SLOTS; i++) list = bankInto(list, deckFromRun(run(`s${i}`), 1)).list;
    const again = { ...deckFromRun(run('s3'), 2), tier: 2 };
    const r = bankInto(list, again);
    expect(r.ok).toBe(true);
    expect(r.list).toHaveLength(VAULT_SLOTS);
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
