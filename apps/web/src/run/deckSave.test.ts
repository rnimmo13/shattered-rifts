import { describe, expect, it } from 'vitest';
import type { RunState } from '@sr/campaign';
import { RIFTWALKERS } from '@sr/content/v2';
import { loseSavedDecks, shouldAutoSave } from './deckSave';
import { loadVault, saveVault } from '../pvp/vault';

const stepped = (nodes: number, phase = 'map', seed = 's'): RunState =>
  ({ seed, phase, stats: { nodesCleared: nodes } }) as unknown as RunState;

describe('when the deck is saved for the Arena by itself', () => {
  it('after a stop on the map is finished (a fight and its reward, a shop, a shrine, an event)', () => {
    expect(shouldAutoSave(stepped(2, 'reward'), stepped(3))).toBe(true);
    expect(shouldAutoSave(stepped(0, 'shrine'), stepped(1))).toBe(true);
  });
  it('when the Warden\'s Gift has been picked (the Warden itself was cleared before it)', () => {
    expect(shouldAutoSave(stepped(5, 'gift'), stepped(5, 'stageClear'))).toBe(true);
    expect(shouldAutoSave(stepped(5, 'gift'), stepped(5, 'gift'))).toBe(false);
  });
  it('not in the middle of a stop, for the same count, or for another run', () => {
    expect(shouldAutoSave(stepped(2), stepped(2, 'duel'))).toBe(false);
    expect(shouldAutoSave(stepped(2, 'duel'), stepped(2, 'reward'))).toBe(false);
    expect(shouldAutoSave(stepped(2, 'map', 'a'), stepped(3, 'map', 'b'))).toBe(false);
  });
  it('not for a run that has just collapsed or been banked', () => {
    expect(shouldAutoSave(stepped(2), stepped(3, 'collapsed'))).toBe(false);
    expect(shouldAutoSave(stepped(2), stepped(3, 'banked'))).toBe(false);
  });
});

describe('a run that collapses takes its saved deck with it', () => {
  it('removes every saved copy of that run and nothing else', async () => {
    const store = new Map<string, string>();
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
    const deck = (id: string, tier: number) => ({
      id,
      hero: 'knight',
      tier,
      deck: [...RIFTWALKERS.knight.starter],
      boons: [],
      bankedAt: 1,
    });
    // the run's save (its id is the seed), an older build's per-tier save of the same run, and another run's deck
    saveVault([deck('r~dead-run', 2), deck('dead-run:t1', 1), deck('r~other-run', 1)]);
    expect(await loseSavedDecks({ seed: 'dead-run' })).toBe(1); // (an older build's copy of the same run is already merged into it when the Vault is read)
    expect(loadVault().map((d) => d.id)).toEqual(['r~other-run']);
    // nothing saved: nothing lost
    expect(await loseSavedDecks({ seed: 'dead-run' })).toBe(0);
    expect(loadVault()).toHaveLength(1);
  });
});
