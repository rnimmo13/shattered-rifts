// The online Vault and this device's copy (2026-11-07): the server's list is the one shown; this device sends up only decks it saved
// itself, and a deck removed on another device leaves here too. A device that may not upload (another holds play) still shows the
// server's decks instead of its own old list.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RIFTWALKERS } from '@sr/content/v2';
import { deckSnapshot, runOf, type VaultDeck } from './vault';

const deck = (seed: string, at: number): VaultDeck =>
  deckSnapshot(
    {
      seed,
      tier: 1,
      character: 'knight',
      deck: [...RIFTWALKERS.knight.starter],
      boons: [],
    } as never,
    at,
  );

let server: VaultDeck[] = [];
let banked: string[] = [];
let playBlocked = false;
let offline = false;

beforeEach(() => {
  // (these decks carry made-up save times: the day is held before the first season wipe, so none of them has expired, #736)
  vi.setSystemTime(new Date('2026-11-10T12:00:00Z'));
  vi.resetModules();
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
  server = [];
  banked = [];
  playBlocked = false;
  offline = false;
  vi.stubGlobal('fetch', (url: string, init: { body: string }) => {
    if (offline) return Promise.reject(new Error('offline'));
    const body = JSON.parse(init.body) as { deck?: VaultDeck };
    const answer = (data: unknown) => Promise.resolve({ json: () => Promise.resolve(data) });
    if (url.endsWith('/list')) return answer({ ok: true, decks: server });
    if (url.endsWith('/bank')) {
      if (playBlocked) return answer({ ok: false, error: 'play-required' });
      const d = body.deck!;
      banked.push(runOf(d.id));
      server = [...server.filter((x) => runOf(x.id) !== runOf(d.id)), d];
      return answer({ ok: true, decks: server });
    }
    return answer({ ok: true, decks: server });
  });
});

const sync = async (local: VaultDeck[]) => {
  const { syncVault } = await import('./vaultSync');
  return syncVault('ABCDEFGHJKMNPQRS', local);
};

describe('the online Vault leads', () => {
  it('the first sync sends up every deck the server lacks, so none is lost', async () => {
    const a = deck('a', 1000);
    const r = await sync([a]);
    expect(banked).toEqual([runOf(a.id)]);
    expect(r).toMatchObject({ ok: true, complete: true });
    expect(r.decks.map((d) => runOf(d.id))).toEqual([runOf(a.id)]);
  });

  it('a deck removed on another device leaves this device too, and is not sent back up', async () => {
    const a = deck('a', 1000);
    const b = deck('b', 1000);
    server = [a, b];
    await sync([a, b]);
    // another device removes A
    server = [b];
    banked = [];
    const r = await sync([a, b]);
    expect(banked).toEqual([]);
    expect(r.ok && r.decks.map((d) => runOf(d.id))).toEqual([runOf(b.id)]);
  });

  it('a newer save on another device replaces this device’s older one', async () => {
    const old = deck('a', 1000);
    server = [old];
    await sync([old]);
    const newer = deck('a', 5000);
    server = [newer];
    const r = await sync([old]);
    expect(banked).toEqual([]);
    expect(r.ok && r.decks[0]!.bankedAt).toBe(5000);
  });

  it('while another device holds play, the server’s decks still show, beside a deck saved here', async () => {
    const b = deck('b', 1000);
    server = [b];
    await sync([b]);
    const c = deck('c', 2000);
    playBlocked = true;
    const r = await sync([b, c]);
    expect(r).toMatchObject({ ok: true, complete: false, waiting: 'play' });
    expect(r.decks.map((d) => runOf(d.id)).sort()).toEqual([runOf(b.id), runOf(c.id)].sort());
    // once this device may upload, the deck goes up
    playBlocked = false;
    const later = await sync(r.decks);
    expect(later).toMatchObject({ ok: true, complete: true });
    expect(banked).toEqual([runOf(c.id)]);
  });

  it('with the server out of reach, this device’s list stands', async () => {
    const a = deck('a', 1000);
    offline = true;
    const r = await sync([a]);
    expect(r).toMatchObject({ ok: false, error: 'offline' });
    expect(r.decks).toEqual([a]);
  });
});

describe('a run played on after its deck was removed elsewhere (review, 2026-11-07)', () => {
  it('its newer save still goes up', async () => {
    const a = deck('a', 1000);
    server = [a];
    await sync([a]);
    // removed on the website, then the run goes on here and saves a newer deck
    server = [];
    banked = [];
    const later = deck('a', 9000);
    const r = await sync([later]);
    expect(banked).toEqual([runOf(a.id)]);
    expect(r.ok && r.decks.map((d) => d.bankedAt)).toEqual([9000]);
  });
});
