import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newRun, type RunState } from '@sr/campaign';
import type { RunCopy } from '@sr/pvp';
import * as saves from './saves';
import type * as CloudModule from './runCloud';

const lease = vi.hoisted(() => ({ playing: true, revision: 1, epoch: 1, paused: vi.fn() }));
vi.mock('../pvp/config', () => ({ serverBase: () => 'wss://game.invalid' }));
vi.mock('../pvp/vaultSync', () => ({
  vaultKey: () => null,
  whoAmI: () => Promise.resolve({ signedIn: true }),
}));
vi.mock('../playAccess', () => ({
  localOnly: () => false,
  canPlay: () => lease.playing,
  playRevision: () => lease.revision,
  setPlayRevision: (n: number) => {
    lease.revision = n;
  },
  playState: () => ({ epoch: lease.epoch }),
  pausePlay: (message: string) => {
    lease.playing = false;
    lease.paused(message);
  },
}));
vi.mock('./history', () => ({
  runHistory: () => [],
  historyRemoved: () => [],
  replaceHistory: vi.fn(),
  setHistoryRemoved: vi.fn(),
}));
vi.mock('../pvp/matchHistory', () => ({ matchHistory: () => [], replaceMatches: vi.fn() }));

let cloud: typeof CloudModule;
let server: RunCopy[];
let serverRevision: number;
let requests: RunCopy[][];
let stopSave: (() => Promise<void>) | undefined;
let fetcher: ReturnType<typeof vi.fn<typeof fetch>>;
let id: string;
let base: RunState;
beforeEach(async () => {
  vi.resetModules();
  lease.playing = true;
  lease.revision = 1;
  lease.epoch = 1;
  lease.paused.mockClear();
  const values = new Map<string, string>();
  const storage = {
    getItem: (k: string) => values.get(k) ?? null,
    setItem(k: string, v: string) {
      values.set(k, v);
      Object.defineProperty(this, k, {
        value: v,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    },
    removeItem(k: string) {
      values.delete(k);
      Reflect.deleteProperty(this, k);
    },
    key: (i: number) => [...values.keys()][i] ?? null,
    get length() {
      return values.size;
    },
  };
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('window', {
    setTimeout: (callback: () => void, delay: number) => setTimeout(callback, delay),
    clearTimeout: (n: ReturnType<typeof setTimeout>) => clearTimeout(n),
  });
  base = { ...newRun('engineer', 'handoff-evidence'), tier: 10, phase: 'map', context: null };
  id = saves.startRunSlot(base)!;
  server = saves.runCopies();
  serverRevision = 1;
  requests = [];
  stopSave = undefined;
  fetcher = vi.fn<typeof fetch>(async (input, init) => {
    const path = new URL(input instanceof Request ? input.url : input.toString()).pathname;
    if (path.endsWith('/runs'))
      return Response.json({ ok: true, runs: server, revision: serverRevision, replays: {} });
    if (path.endsWith('/runsave')) {
      const body = JSON.parse(init!.body as string) as { runs: RunCopy[]; replays: unknown };
      requests.push(body.runs);
      if (stopSave) await stopSave();
      const copy = new Map(server.map((c) => [c.id, c]));
      for (const c of body.runs) copy.set(c.id, { ...c, updated: ++serverRevision });
      server = [...copy.values()];
      return Response.json({
        ok: true,
        runs: server,
        revision: serverRevision,
        replays: body.replays,
      });
    }
    return Response.json({ ok: true, items: [], removed: [] });
  });
  vi.stubGlobal('fetch', fetcher);
  cloud = await import('./runCloud');
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const tier = (copies: RunCopy[]): number =>
  (JSON.parse(copies.find((c) => c.id === id)!.text!) as { tier: number }).tier;

describe('confirmed cross-device campaign saves', () => {
  it('does not postpone the upload while the player keeps taking actions', async () => {
    vi.useFakeTimers();
    saves.saveRunSlot(id, { ...base, tier: 11 });
    cloud.soonSyncRuns();
    await vi.advanceTimersByTimeAsync(200);
    cloud.soonSyncRuns();
    await vi.advanceTimersByTimeAsync(50);
    expect(requests).toHaveLength(1);
    expect(tier(server)).toBe(11);
    expect(await cloud.flushCampaignSave()).toBe(true);
  });
  it('drains a newer tier written while an earlier upload is in flight', async () => {
    let acknowledge!: () => void;
    const blocked = new Promise<void>((resolve) => {
      acknowledge = resolve;
    });
    stopSave = () => blocked;
    saves.saveRunSlot(id, { ...base, shards: 500 });
    const upload = cloud.syncRuns();
    await vi.waitFor(() => expect(requests).toHaveLength(1));
    saves.saveRunSlot(id, { ...base, tier: 11, shards: 600 });
    stopSave = undefined;
    acknowledge();
    await upload;
    expect(requests).toHaveLength(2);
    expect(tier(server)).toBe(11);
    expect(saves.loadActiveRun()!.run.tier).toBe(11);
    expect(await cloud.flushCampaignSave()).toBe(true);
  });
  it('pauses play and refuses handoff if the upload fails', async () => {
    saves.saveRunSlot(id, { ...base, tier: 11 });
    fetcher.mockImplementation(async (input) =>
      (input instanceof Request ? input.url : input.toString()).endsWith('/runs')
        ? Response.json({ ok: true, runs: server, revision: 1, replays: {} })
        : Promise.reject(new Error('offline')),
    );
    expect(await cloud.flushCampaignSave()).toBe(false);
    expect(lease.playing).toBe(false);
    expect(cloud.campaignSyncState()).toBe('error');
    expect(saves.loadActiveRun()!.run.tier).toBe(11);
  });
  it('ignores an old upload response after a new play session has loaded', async () => {
    let acknowledge!: () => void;
    stopSave = () =>
      new Promise<void>((resolve) => {
        acknowledge = resolve;
      });
    saves.saveRunSlot(id, { ...base, shards: 500 });
    const upload = cloud.syncRuns();
    await vi.waitFor(() => expect(requests).toHaveLength(1));
    lease.epoch++;
    lease.revision = 50;
    saves.saveRunSlot(id, { ...base, tier: 11 });
    acknowledge();
    await upload;
    expect(lease.revision).toBe(50);
    expect(saves.loadActiveRun()!.run.tier).toBe(11);
  });
  it('a browsing device preserves local progress beyond an older account checkpoint', async () => {
    saves.saveRunSlot(id, { ...base, tier: 11 });
    lease.playing = false;
    await cloud.syncRuns();
    expect(saves.loadActiveRun()!.run.tier).toBe(11);
    expect(requests).toHaveLength(0);
  });
});
