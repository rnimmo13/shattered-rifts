import { beforeEach, describe, expect, it } from 'vitest';
import { newRun } from '@sr/campaign';
import {
  RUN_SLOTS,
  unreadableRuns,
  activeRunId,
  clearAllRuns,
  clearDuelStarted,
  clearSavedRun,
  duelWasStarted,
  listRuns,
  loadActiveRun,
  markDuelStarted,
  runCount,
  saveRunSlot,
  setActiveRun,
  startRunSlot,
} from './saves';

// the tests run in node, so storage is a small stand-in
const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
});

const run = (seed: string, hero: 'knight' | 'hunter' = 'knight') => newRun(hero, seed, 'normal');
const idOf = (seed: string): string | null =>
  listRuns().find((r) => r.run.seed === seed)?.id ?? null;

describe('saved runs', () => {
  it('keeps several runs, each in its own slot, and opens the active one', () => {
    const a = startRunSlot(run('one'));
    const b = startRunSlot(run('two', 'hunter'));
    expect(listRuns()).toHaveLength(2);
    expect(activeRunId()).toBe(b);
    expect(loadActiveRun()?.run.seed).toBe('two');
    setActiveRun(a);
    expect(loadActiveRun()).toMatchObject({ id: a, run: { seed: 'one' } });
  });

  it('saves a run into its own slot, never another', () => {
    const a = startRunSlot(run('one')) as string;
    const b = startRunSlot(run('two')) as string;
    // the second window switched the active run to b; the first still saves to a
    setActiveRun(b);
    expect(saveRunSlot(a, { ...run('one'), shards: 77 })).toBe(true);
    const runs = listRuns();
    expect(runs.find((r) => r.id === a)?.run.shards).toBe(77);
    expect(runs.find((r) => r.id === b)?.run.seed).toBe('two');
    expect(runs.find((r) => r.id === b)?.run.shards).not.toBe(77);
  });

  it('does not bring back a run that was abandoned elsewhere', () => {
    const a = startRunSlot(run('one')) as string;
    clearSavedRun(a);
    expect(saveRunSlot(a, run('one'))).toBe(false);
    expect(listRuns()).toEqual([]);
  });

  it('refuses a run when every slot is taken, and throws nothing away', () => {
    for (let i = 0; i < RUN_SLOTS; i++) expect(startRunSlot(run(`r${i}`))).not.toBeNull();
    expect(startRunSlot(run('extra'))).toBeNull();
    expect(
      listRuns()
        .map((r) => r.run.seed)
        .sort(),
    ).toEqual(Array.from({ length: RUN_SLOTS }, (_, i) => `r${i}`).sort());
  });

  it('counts a slot that cannot be read toward the limit and keeps it', () => {
    store.set(
      'sr.runs.v3',
      // every slot but one taken by saves that cannot be read
      JSON.stringify(
        Array.from({ length: RUN_SLOTS - 1 }, (_, i) => ({
          id: `bad${i}`,
          text: 'nope',
          updated: i,
        })),
      ),
    );
    expect(listRuns()).toEqual([]);
    expect(runCount()).toBe(RUN_SLOTS - 1);
    expect(unreadableRuns()).toHaveLength(RUN_SLOTS - 1);
    expect(startRunSlot(run('fits'))).not.toBeNull();
    expect(startRunSlot(run('full'))).toBeNull();
    expect(JSON.parse(store.get('sr.runs.v3') ?? '[]')).toHaveLength(RUN_SLOTS);
  });

  it('abandoning one leaves the others, and clears the active key if it was that one', () => {
    startRunSlot(run('one'));
    const b = startRunSlot(run('two')) as string;
    clearSavedRun(idOf('one'));
    expect(listRuns().map((r) => r.run.seed)).toEqual(['two']);
    expect(activeRunId()).toBe(b);
    clearSavedRun(b);
    expect(activeRunId()).toBeNull();
  });

  it('moves the single save an older build kept into a slot and opens it', () => {
    startRunSlot(run('old'));
    const text = (JSON.parse(store.get('sr.runs.v3') ?? '[]') as { text: string }[])[0]?.text ?? '';
    store.clear();
    store.set('sr.run.v2', text);
    expect(listRuns().map((r) => r.run.seed)).toEqual(['old']);
    expect(store.has('sr.run.v2')).toBe(false);
    expect(loadActiveRun()?.run.seed).toBe('old');
    // moving it again finds nothing more, and a second window cannot add it twice
    store.set('sr.run.v2', text);
    expect(listRuns()).toHaveLength(1);
  });

  it('leaves an older save where it is when there is no room for it', () => {
    for (let i = 0; i < RUN_SLOTS; i++) startRunSlot(run(`r${i}`));
    store.set('sr.run.v2', 'old save text');
    expect(listRuns()).toHaveLength(RUN_SLOTS);
    expect(store.get('sr.run.v2')).toBe('old save text');
  });

  it('is not fooled by junk in storage', () => {
    store.set('sr.runs.v3', '{not json');
    expect(listRuns()).toEqual([]);
    store.set('sr.runs.v3', JSON.stringify([{ id: 1 }, null, 'x', { id: 'a', text: 'nope' }]));
    expect(listRuns()).toEqual([]);
    expect(loadActiveRun()).toBeNull();
  });

  it('clears every run on request', () => {
    startRunSlot(run('one'));
    startRunSlot(run('two'));
    clearAllRuns();
    expect(listRuns()).toEqual([]);
    expect(activeRunId()).toBeNull();
  });
});

describe('an unfinished duel is remembered per run', () => {
  it('leaving one run does not make another forget', () => {
    markDuelStarted('seedA:node:0:0');
    markDuelStarted('seedB:node:1:0');
    clearDuelStarted('seedB:node:1:0');
    expect(duelWasStarted('seedA:node:0:0')).toBe(true);
    expect(duelWasStarted('seedB:node:1:0')).toBe(false);
    clearDuelStarted();
    expect(duelWasStarted('seedA:node:0:0')).toBe(false);
  });
});
